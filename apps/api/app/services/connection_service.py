from sqlalchemy.orm import Session
from app.models.connection import Connection
from app.schemas.connection import ConnectionCreateRequest


def create_connection(db: Session, req: ConnectionCreateRequest) -> Connection:
    conn = Connection(
        name=req.name,
        host=req.host,
        port=req.port,
        database=req.database,
        user=req.user,
        # Password deliberately NOT stored
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


def get_connection(db: Session, connection_id: int) -> Connection | None:
    return db.query(Connection).filter(Connection.id == connection_id, Connection.is_active == True).first()


def list_connections(db: Session) -> list[Connection]:
    return db.query(Connection).filter(Connection.is_active == True).order_by(Connection.created_at.desc()).all()


def delete_connection(db: Session, connection_id: int) -> bool:
    conn = get_connection(db, connection_id)
    if not conn:
        return False
    conn.is_active = False
    db.commit()
    return True
