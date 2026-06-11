from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import connection_service, db_service

router = APIRouter(prefix="/api/connections", tags=["explorer"])


def _get_conn_and_pwd(connection_id: int, db: Session, x_db_password: str | None):
    conn = connection_service.get_connection(db, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.db_type not in ("sqlite", "duckdb") and not x_db_password:
        raise HTTPException(status_code=401, detail="Missing X-DB-Password header")
    return conn, x_db_password


@router.get("/{connection_id}/databases")
def list_databases(
    connection_id: int,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    conn, pwd = _get_conn_and_pwd(connection_id, db, x_db_password)
    try:
        databases = db_service.list_databases(conn, pwd)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"databases": databases}


@router.get("/{connection_id}/tables")
def list_tables(
    connection_id: int,
    database: str,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    conn, pwd = _get_conn_and_pwd(connection_id, db, x_db_password)
    try:
        tables = db_service.list_tables(conn, pwd, database)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"tables": tables, "database": database}


@router.get("/{connection_id}/tables/{table_name}")
def describe_table(
    connection_id: int,
    table_name: str,
    database: str,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    conn, pwd = _get_conn_and_pwd(connection_id, db, x_db_password)
    try:
        detail = db_service.describe_table(conn, pwd, database, table_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return detail


@router.get("/{connection_id}/tables/{table_name}/preview")
def preview_table(
    connection_id: int,
    table_name: str,
    database: str,
    limit: int = 100,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if limit > 500:
        limit = 500
    conn, pwd = _get_conn_and_pwd(connection_id, db, x_db_password)
    try:
        result = db_service.preview_table(conn, pwd, database, table_name, limit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result
