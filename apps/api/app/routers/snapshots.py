from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.connection import SchemaSnapshot
from app.schemas.automation import SnapshotCreate, SnapshotResponse, SnapshotDiff
from app.services import connection_service, snapshot_service

router = APIRouter(prefix="/api/snapshots", tags=["snapshots"])


@router.post("", response_model=SnapshotResponse)
def create_snap(req: SnapshotCreate, x_db_password: str | None = Header(default=None), db: Session = Depends(get_db)):
    conn = connection_service.get_connection(db, req.connection_id)
    if not conn:
        raise HTTPException(404, "Connection not found")
    if conn.db_type not in ("sqlite", "duckdb") and not x_db_password:
        raise HTTPException(401, "Missing X-DB-Password")
    try:
        snap = snapshot_service.create_snapshot(db, conn, x_db_password, req.database)
    except Exception as e:
        raise HTTPException(400, str(e))
    return snap


@router.get("", response_model=list[SnapshotResponse])
def list_snaps(connection_id: int | None = None, database: str | None = None, db: Session = Depends(get_db)):
    q = db.query(SchemaSnapshot)
    if connection_id is not None:
        q = q.filter(SchemaSnapshot.connection_id == connection_id)
    if database is not None:
        q = q.filter(SchemaSnapshot.database == database)
    return q.order_by(SchemaSnapshot.captured_at.desc()).limit(50).all()


@router.get("/{snap_id}/data")
def snap_data(snap_id: int, db: Session = Depends(get_db)):
    snap = db.query(SchemaSnapshot).filter(SchemaSnapshot.id == snap_id).first()
    if not snap:
        raise HTTPException(404, "Not found")
    return snapshot_service.get_snapshot_data(snap)


@router.get("/diff", response_model=SnapshotDiff)
def diff(a: int, b: int, db: Session = Depends(get_db)):
    sa = db.query(SchemaSnapshot).filter(SchemaSnapshot.id == a).first()
    sb = db.query(SchemaSnapshot).filter(SchemaSnapshot.id == b).first()
    if not sa or not sb:
        raise HTTPException(404, "Snapshot not found")
    return snapshot_service.compute_diff(
        snapshot_service.get_snapshot_data(sa),
        snapshot_service.get_snapshot_data(sb),
    )


@router.delete("/{snap_id}")
def delete_snap(snap_id: int, db: Session = Depends(get_db)):
    snap = db.query(SchemaSnapshot).filter(SchemaSnapshot.id == snap_id).first()
    if not snap:
        raise HTTPException(404, "Not found")
    db.delete(snap); db.commit()
    return {"message": "deleted"}
