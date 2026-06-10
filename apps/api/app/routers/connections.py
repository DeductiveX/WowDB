from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.connection import (
    ConnectionTestRequest,
    ConnectionCreateRequest,
    ConnectionResponse,
    ConnectionTestResult,
    SessionCreateResult,
)
from app.services import connection_service
from app.services import db_service

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.post("/test", response_model=ConnectionTestResult)
def test_connection(req: ConnectionTestRequest):
    from app.models.connection import Connection as ConnModel
    # Build a transient model object for db_service dispatch
    mock = ConnModel(
        db_type=req.db_type,
        host=req.host,
        port=req.port,
        db_path=req.db_path,
        database=req.database,
        user=req.user,
    )
    ok, message, latency = db_service.test_connection(mock, req.password)
    return ConnectionTestResult(success=ok, message=message, latency_ms=latency)


@router.post("/session", response_model=SessionCreateResult)
def create_session(req: ConnectionCreateRequest, db: Session = Depends(get_db)):
    from app.models.connection import Connection as ConnModel
    mock = ConnModel(
        db_type=req.db_type,
        host=req.host,
        port=req.port,
        db_path=req.db_path,
        database=req.database,
        user=req.user,
    )
    ok, message, _ = db_service.test_connection(mock, req.password)
    if not ok:
        raise HTTPException(status_code=400, detail=f"Cannot connect: {message}")

    conn = connection_service.create_connection(db, req)
    return SessionCreateResult(
        connection_id=conn.id,
        name=conn.name,
        db_type=conn.db_type,
        host=conn.host,
        port=conn.port,
        db_path=conn.db_path,
        database=conn.database,
        user=conn.user,
        message="Session created. Password was NOT stored.",
    )


@router.get("", response_model=list[ConnectionResponse])
def list_connections(db: Session = Depends(get_db)):
    return connection_service.list_connections(db)


@router.get("/{connection_id}", response_model=ConnectionResponse)
def get_connection(connection_id: int, db: Session = Depends(get_db)):
    conn = connection_service.get_connection(db, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn


@router.delete("/{connection_id}")
def delete_connection(connection_id: int, db: Session = Depends(get_db)):
    deleted = connection_service.delete_connection(db, connection_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"message": "Connection removed"}
