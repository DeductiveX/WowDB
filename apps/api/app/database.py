from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings


def _get_engine():
    settings = get_settings()
    db_url = f"sqlite:///{settings.wowdb_db_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(conn, _):
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")

    return engine


engine = _get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import connection  # noqa: F401
    Base.metadata.create_all(bind=engine)
