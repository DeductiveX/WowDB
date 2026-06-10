from sqlalchemy import create_engine, event, inspect, text
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


def _migrate_legacy_columns() -> None:
    """Lightweight migration for upgrades from v0.1/v0.2.
    Adds new columns to the connections table when they are missing,
    so existing wowdb.db files don't break with 'no such column'."""
    inspector = inspect(engine)
    if "connections" not in inspector.get_table_names():
        return
    existing = {col["name"] for col in inspector.get_columns("connections")}
    migrations = [
        ("db_type", "ALTER TABLE connections ADD COLUMN db_type VARCHAR(20) NOT NULL DEFAULT 'mysql'"),
        ("db_path", "ALTER TABLE connections ADD COLUMN db_path VARCHAR(500)"),
    ]
    with engine.begin() as conn:
        for col, ddl in migrations:
            if col not in existing:
                conn.execute(text(ddl))


def init_db() -> None:
    from app.models import connection  # noqa: F401 — registers Connection, ApiKey, QueryHistory
    Base.metadata.create_all(bind=engine)
    _migrate_legacy_columns()
