"""APScheduler-based job runner for scheduled tasks."""

import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import SessionLocal
from app.models.connection import (
    ScheduledTask, Connection, QualityMonitor,
)
from app.services import db_service, snapshot_service, quality_service, webhook_service

log = logging.getLogger(__name__)

# Use a module-level scheduler. Started in lifespan.
scheduler = BackgroundScheduler(timezone="UTC")


def _run_task(task_id: int):
    """Executed by APScheduler — load the task fresh each fire."""
    db = SessionLocal()
    try:
        task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id, ScheduledTask.is_active == True).first()
        if not task:
            return
        task.last_run_at = datetime.utcnow()

        if not task.connection_id and task.task_type != "query":
            task.last_status = "error"; task.last_error = "No connection bound"
            db.commit(); return

        conn = db.query(Connection).filter(Connection.id == task.connection_id).first() if task.connection_id else None

        try:
            if task.task_type == "snapshot":
                if not conn:
                    raise RuntimeError("Snapshot requires a connection")
                snapshot_service.create_snapshot(db, conn, None, task.database or "")
            elif task.task_type == "quality":
                monitor = db.query(QualityMonitor).filter(QualityMonitor.id == task.monitor_id).first()
                if not monitor:
                    raise RuntimeError(f"Monitor {task.monitor_id} not found")
                mc = db.query(Connection).filter(Connection.id == monitor.connection_id).first()
                quality_service.run_monitor(db, monitor, mc, None)
            else:  # query
                if conn and task.query_text:
                    db_service.execute_query(conn, None, task.database, task.query_text)
            task.last_status = "success"; task.last_error = None
            webhook_service.emit("scheduled.success", {
                "task_id": task.id, "name": task.name, "type": task.task_type,
            })
        except Exception as e:
            task.last_status = "error"; task.last_error = str(e)[:500]
            webhook_service.emit("scheduled.failed", {
                "task_id": task.id, "name": task.name, "type": task.task_type, "error": str(e),
            })
        db.commit()
    finally:
        db.close()


def _job_id(task_id: int) -> str:
    return f"scheduled-task-{task_id}"


def register_task(task: ScheduledTask) -> None:
    """Add or update an APScheduler job for this task."""
    if not task.is_active:
        unregister_task(task.id)
        return
    try:
        trigger = CronTrigger.from_crontab(task.cron, timezone="UTC")
    except Exception as e:
        log.warning("Invalid cron %r for task %d: %s", task.cron, task.id, e)
        return
    scheduler.add_job(
        _run_task,
        trigger=trigger,
        id=_job_id(task.id),
        args=[task.id],
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )


def unregister_task(task_id: int) -> None:
    try:
        scheduler.remove_job(_job_id(task_id))
    except Exception:
        pass


def run_task_now(task_id: int) -> None:
    _run_task(task_id)


def boot_scheduler() -> None:
    """Start scheduler + re-register all active tasks from DB."""
    if not scheduler.running:
        scheduler.start()
    db = SessionLocal()
    try:
        for task in db.query(ScheduledTask).filter(ScheduledTask.is_active == True).all():
            register_task(task)
    finally:
        db.close()


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
