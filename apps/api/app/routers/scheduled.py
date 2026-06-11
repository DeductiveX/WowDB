from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.connection import ScheduledTask
from app.schemas.automation import (
    ScheduledTaskCreate, ScheduledTaskUpdate, ScheduledTaskResponse,
)
from app.services import scheduler_service

router = APIRouter(prefix="/api/scheduled-tasks", tags=["scheduled"])


@router.post("", response_model=ScheduledTaskResponse)
def create_task(req: ScheduledTaskCreate, db: Session = Depends(get_db)):
    task = ScheduledTask(**req.model_dump())
    db.add(task); db.commit(); db.refresh(task)
    scheduler_service.register_task(task)
    return task


@router.get("", response_model=list[ScheduledTaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(ScheduledTask).order_by(ScheduledTask.created_at.desc()).all()


@router.patch("/{task_id}", response_model=ScheduledTaskResponse)
def update_task(task_id: int, req: ScheduledTaskUpdate, db: Session = Depends(get_db)):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    db.commit(); db.refresh(task)
    scheduler_service.register_task(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(ScheduledTask).filter(ScheduledTask.id == task_id).first()
    if not task:
        raise HTTPException(404, "Not found")
    scheduler_service.unregister_task(task_id)
    db.delete(task); db.commit()
    return {"message": "deleted"}


@router.post("/{task_id}/run")
def run_now(task_id: int):
    scheduler_service.run_task_now(task_id)
    return {"message": "executed"}
