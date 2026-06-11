from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.connection import QualityMonitor
from app.schemas.automation import QualityMonitorCreate, QualityMonitorResponse, QualityCheckResult
from app.services import connection_service, quality_service

router = APIRouter(prefix="/api/quality-monitors", tags=["quality"])


@router.post("", response_model=QualityMonitorResponse)
def create_monitor(req: QualityMonitorCreate, db: Session = Depends(get_db)):
    monitor = QualityMonitor(**req.model_dump())
    db.add(monitor); db.commit(); db.refresh(monitor)
    return monitor


@router.get("", response_model=list[QualityMonitorResponse])
def list_monitors(db: Session = Depends(get_db)):
    return db.query(QualityMonitor).filter(QualityMonitor.is_active == True).order_by(QualityMonitor.created_at.desc()).all()


@router.delete("/{monitor_id}")
def delete_monitor(monitor_id: int, db: Session = Depends(get_db)):
    monitor = db.query(QualityMonitor).filter(QualityMonitor.id == monitor_id, QualityMonitor.is_active == True).first()
    if not monitor:
        raise HTTPException(404, "Not found")
    monitor.is_active = False
    db.commit()
    return {"message": "deleted"}


@router.post("/{monitor_id}/check", response_model=QualityCheckResult)
def run_check(monitor_id: int, x_db_password: str | None = Header(default=None), db: Session = Depends(get_db)):
    monitor = db.query(QualityMonitor).filter(QualityMonitor.id == monitor_id, QualityMonitor.is_active == True).first()
    if not monitor:
        raise HTTPException(404, "Not found")
    conn = connection_service.get_connection(db, monitor.connection_id)
    if not conn:
        raise HTTPException(404, "Connection not found")
    if conn.db_type not in ("sqlite", "duckdb") and not x_db_password:
        raise HTTPException(401, "Missing X-DB-Password")
    return quality_service.run_monitor(db, monitor, conn, x_db_password)
