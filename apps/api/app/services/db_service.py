"""Database-agnostic service that dispatches to the correct driver."""

from app.models.connection import Connection
from app.services import mysql_service, sqlite_target_service

_PG_AVAILABLE = False
try:
    from app.services import postgres_service
    _PG_AVAILABLE = True
except ImportError:
    pass

_DUCKDB_AVAILABLE = False
try:
    from app.services import duckdb_target_service
    _DUCKDB_AVAILABLE = True
except ImportError:
    pass


class DBError(Exception):
    pass


def _require_pg():
    if not _PG_AVAILABLE:
        raise DBError("PostgreSQL driver (psycopg2) is not installed.")


def _require_duckdb():
    if not _DUCKDB_AVAILABLE:
        raise DBError("DuckDB driver is not installed. Add duckdb to requirements.txt.")


def test_connection(conn: Connection, password: str | None) -> tuple[bool, str, float | None]:
    if conn.db_type == "sqlite":
        return sqlite_target_service.test_connection(conn.db_path or "")
    if conn.db_type == "duckdb":
        _require_duckdb()
        return duckdb_target_service.test_connection(conn.db_path or "")
    if conn.db_type == "postgres":
        _require_pg()
        return postgres_service.test_connection(conn.host, conn.port, conn.user, password or "", conn.database)
    return mysql_service.test_connection(conn.host, conn.port, conn.user, password or "", conn.database)


def list_databases(conn: Connection, password: str | None) -> list[str]:
    if conn.db_type == "sqlite":
        return sqlite_target_service.list_databases(conn.db_path or "")
    if conn.db_type == "duckdb":
        _require_duckdb()
        return duckdb_target_service.list_databases(conn.db_path or "")
    if conn.db_type == "postgres":
        _require_pg()
        return postgres_service.list_databases(conn.host, conn.port, conn.user, password or "")
    return mysql_service.list_databases(conn.host, conn.port, conn.user, password or "")


def list_tables(conn: Connection, password: str | None, database: str) -> list[dict]:
    if conn.db_type == "sqlite":
        return sqlite_target_service.list_tables(conn.db_path or "")
    if conn.db_type == "duckdb":
        _require_duckdb()
        return duckdb_target_service.list_tables(conn.db_path or "")
    if conn.db_type == "postgres":
        _require_pg()
        return postgres_service.list_tables(conn.host, conn.port, conn.user, password or "", database)
    return mysql_service.list_tables(conn.host, conn.port, conn.user, password or "", database)


def describe_table(conn: Connection, password: str | None, database: str, table: str) -> dict:
    if conn.db_type == "sqlite":
        return sqlite_target_service.describe_table(conn.db_path or "", table)
    if conn.db_type == "duckdb":
        _require_duckdb()
        return duckdb_target_service.describe_table(conn.db_path or "", table)
    if conn.db_type == "postgres":
        _require_pg()
        return postgres_service.describe_table(conn.host, conn.port, conn.user, password or "", database, table)
    return mysql_service.describe_table(conn.host, conn.port, conn.user, password or "", database, table)


def preview_table(conn: Connection, password: str | None, database: str, table: str, limit: int = 100) -> dict:
    if conn.db_type == "sqlite":
        return sqlite_target_service.preview_table(conn.db_path or "", table, limit)
    if conn.db_type == "duckdb":
        _require_duckdb()
        return duckdb_target_service.preview_table(conn.db_path or "", table, limit)
    if conn.db_type == "postgres":
        _require_pg()
        return postgres_service.preview_table(conn.host, conn.port, conn.user, password or "", database, table, limit)
    return mysql_service.preview_table(conn.host, conn.port, conn.user, password or "", database, table, limit)


def execute_query(conn: Connection, password: str | None, database: str | None, sql: str) -> dict:
    if conn.db_type == "sqlite":
        return sqlite_target_service.execute_query(conn.db_path or "", sql)
    if conn.db_type == "duckdb":
        _require_duckdb()
        return duckdb_target_service.execute_query(conn.db_path or "", sql)
    if conn.db_type == "postgres":
        _require_pg()
        return postgres_service.execute_query(conn.host, conn.port, conn.user, password or "", database, sql)
    return mysql_service.execute_query(conn.host, conn.port, conn.user, password or "", database, sql)
