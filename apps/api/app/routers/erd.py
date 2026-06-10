from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import connection_service
from app.services.erd_service import build_erd

router = APIRouter(prefix="/api/connections", tags=["erd"])


@router.get("/{connection_id}/erd")
def get_erd(
    connection_id: int,
    database: str,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    conn = connection_service.get_connection(db, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.db_type != "sqlite" and not x_db_password:
        raise HTTPException(status_code=401, detail="Missing X-DB-Password header")

    try:
        data = build_erd(conn, x_db_password, database)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return data
