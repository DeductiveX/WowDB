"""Low-level MySQL connection and query execution service."""

import time
from contextlib import contextmanager
from typing import Any

import pymysql
import pymysql.cursors

from app.config import get_settings


def _make_conn(host: str, port: int, user: str, password: str, database: str | None) -> pymysql.Connection:
    settings = get_settings()
    kwargs: dict[str, Any] = {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "connect_timeout": settings.query_timeout,
        "read_timeout": settings.query_timeout,
        "write_timeout": settings.query_timeout,
    }
    if database:
        kwargs["database"] = database
    return pymysql.connect(**kwargs)


@contextmanager
def get_mysql_connection(host: str, port: int, user: str, password: str, database: str | None = None):
    conn = _make_conn(host, port, user, password, database)
    try:
        yield conn
    finally:
        conn.close()


def test_connection(host: str, port: int, user: str, password: str, database: str | None = None) -> tuple[bool, str, float | None]:
    start = time.monotonic()
    try:
        with get_mysql_connection(host, port, user, password, database) as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
        latency = (time.monotonic() - start) * 1000
        return True, "Connection successful", round(latency, 2)
    except pymysql.err.OperationalError as e:
        return False, f"Connection failed: {e.args[1]}", None
    except Exception as e:
        return False, f"Unexpected error: {str(e)}", None


def list_databases(host: str, port: int, user: str, password: str) -> list[str]:
    with get_mysql_connection(host, port, user, password) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            rows = cursor.fetchall()
    return [row["Database"] for row in rows]


def list_tables(host: str, port: int, user: str, password: str, database: str) -> list[dict]:
    with get_mysql_connection(host, port, user, password, database) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_ROWS, TABLE_COMMENT "
                "FROM information_schema.TABLES "
                "WHERE TABLE_SCHEMA = %s "
                "ORDER BY TABLE_NAME",
                (database,),
            )
            rows = cursor.fetchall()
    return [dict(r) for r in rows]


def describe_table(host: str, port: int, user: str, password: str, database: str, table: str) -> dict:
    with get_mysql_connection(host, port, user, password, database) as conn:
        with conn.cursor() as cursor:
            # Columns
            cursor.execute(
                "SELECT COLUMN_NAME, ORDINAL_POSITION, COLUMN_DEFAULT, IS_NULLABLE, "
                "DATA_TYPE, COLUMN_TYPE, COLUMN_KEY, EXTRA, COLUMN_COMMENT "
                "FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s "
                "ORDER BY ORDINAL_POSITION",
                (database, table),
            )
            columns = [dict(r) for r in cursor.fetchall()]

            # Indexes
            cursor.execute(
                "SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, INDEX_TYPE "
                "FROM information_schema.STATISTICS "
                "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s "
                "ORDER BY INDEX_NAME, SEQ_IN_INDEX",
                (database, table),
            )
            indexes = [dict(r) for r in cursor.fetchall()]

            # Foreign keys
            cursor.execute(
                "SELECT kcu.CONSTRAINT_NAME, kcu.COLUMN_NAME, "
                "kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME "
                "FROM information_schema.KEY_COLUMN_USAGE kcu "
                "JOIN information_schema.TABLE_CONSTRAINTS tc "
                "  ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME "
                "  AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA "
                "  AND kcu.TABLE_NAME = tc.TABLE_NAME "
                "WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY' "
                "  AND kcu.TABLE_SCHEMA = %s AND kcu.TABLE_NAME = %s",
                (database, table),
            )
            foreign_keys = [dict(r) for r in cursor.fetchall()]

            # Table meta
            cursor.execute(
                "SELECT TABLE_NAME, ENGINE, TABLE_ROWS, TABLE_COMMENT, CREATE_TIME, UPDATE_TIME "
                "FROM information_schema.TABLES "
                "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s",
                (database, table),
            )
            meta_row = cursor.fetchone()
            meta = dict(meta_row) if meta_row else {}

    return {"meta": meta, "columns": columns, "indexes": indexes, "foreign_keys": foreign_keys}


def preview_table(
    host: str, port: int, user: str, password: str, database: str, table: str, limit: int = 100
) -> dict:
    safe_table = f"`{table.replace('`', '')}`"
    query = f"SELECT * FROM {safe_table} LIMIT %s"
    with get_mysql_connection(host, port, user, password, database) as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (limit,))
            rows = cursor.fetchall()
            columns = [d[0] for d in cursor.description] if cursor.description else []
    return {"columns": columns, "rows": [dict(r) for r in rows], "count": len(rows)}


def execute_query(
    host: str, port: int, user: str, password: str, database: str | None, sql: str
) -> dict:
    with get_mysql_connection(host, port, user, password, database) as conn:
        with conn.cursor() as cursor:
            start = time.monotonic()
            cursor.execute(sql)
            rows = cursor.fetchall()
            elapsed = round((time.monotonic() - start) * 1000, 2)
            columns = [d[0] for d in cursor.description] if cursor.description else []
    return {
        "columns": columns,
        "rows": [dict(r) for r in rows],
        "count": len(rows),
        "elapsed_ms": elapsed,
    }
