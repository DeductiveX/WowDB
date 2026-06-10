"""PostgreSQL connection and query execution service."""

import time
from contextlib import contextmanager
from typing import Any

import psycopg2
import psycopg2.extras

from app.config import get_settings


def _make_conn(host: str, port: int, user: str, password: str, database: str | None) -> Any:
    settings = get_settings()
    kwargs: dict[str, Any] = {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "connect_timeout": settings.query_timeout,
        "options": f"-c statement_timeout={settings.query_timeout * 1000}",
    }
    if database:
        kwargs["dbname"] = database
    return psycopg2.connect(**kwargs)


@contextmanager
def get_pg_connection(host: str, port: int, user: str, password: str, database: str | None = None):
    conn = _make_conn(host, port, user, password, database)
    try:
        yield conn
    finally:
        conn.close()


def test_connection(host: str, port: int, user: str, password: str, database: str | None = None) -> tuple[bool, str, float | None]:
    start = time.monotonic()
    try:
        with get_pg_connection(host, port, user, password, database) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        latency = (time.monotonic() - start) * 1000
        return True, "Connection successful", round(latency, 2)
    except psycopg2.OperationalError as e:
        return False, f"Connection failed: {e}", None
    except Exception as e:
        return False, f"Unexpected error: {str(e)}", None


_SYSTEM_SCHEMAS = ("pg_catalog", "information_schema", "pg_toast")


def list_databases(host: str, port: int, user: str, password: str) -> list[str]:
    # Try the user-provided default DB first; fall back to "postgres" if none.
    # We connect to whichever DB the credentials grant access to and just list pg_database.
    last_err: Exception | None = None
    for maintenance_db in ("postgres", "template1"):
        try:
            with get_pg_connection(host, port, user, password, maintenance_db) as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                    cur.execute(
                        "SELECT datname FROM pg_database "
                        "WHERE datistemplate = false AND has_database_privilege(datname, 'CONNECT') "
                        "ORDER BY datname"
                    )
                    rows = cur.fetchall()
            return [row["datname"] for row in rows]
        except psycopg2.OperationalError as e:
            last_err = e
            continue
    if last_err:
        raise last_err
    return []


def list_tables(host: str, port: int, user: str, password: str, database: str) -> list[dict]:
    with get_pg_connection(host, port, user, password, database) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(
                """
                SELECT
                    t.table_schema AS schema_name,
                    t.table_name AS "TABLE_NAME",
                    t.table_type AS "TABLE_TYPE",
                    'PostgreSQL' AS "ENGINE",
                    s.n_live_tup AS "TABLE_ROWS",
                    obj_description((quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))::regclass, 'pg_class') AS "TABLE_COMMENT"
                FROM information_schema.tables t
                LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
                WHERE t.table_schema NOT IN %s
                ORDER BY t.table_schema, t.table_name
                """,
                (_SYSTEM_SCHEMAS,),
            )
            rows = cur.fetchall()
    out = []
    for r in rows:
        row = dict(r)
        # Prefix non-public schemas so the user sees them but the URL/table_name stays usable
        if row.pop("schema_name", "public") != "public":
            pass  # schema info kept implicit; could prepend for clarity in future
        out.append(row)
    return out


def describe_table(host: str, port: int, user: str, password: str, database: str, table: str) -> dict:
    with get_pg_connection(host, port, user, password, database) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Columns
            cur.execute(
                """
                SELECT
                    column_name AS "COLUMN_NAME",
                    ordinal_position AS "ORDINAL_POSITION",
                    column_default AS "COLUMN_DEFAULT",
                    is_nullable AS "IS_NULLABLE",
                    data_type AS "DATA_TYPE",
                    udt_name AS "COLUMN_TYPE",
                    '' AS "COLUMN_KEY",
                    '' AS "EXTRA",
                    '' AS "COLUMN_COMMENT"
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
                """,
                (table,),
            )
            columns = [dict(r) for r in cur.fetchall()]

            # Primary keys
            cur.execute(
                """
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = %s
                """,
                (table,),
            )
            pk_cols = {row["column_name"] for row in cur.fetchall()}
            for col in columns:
                if col["COLUMN_NAME"] in pk_cols:
                    col["COLUMN_KEY"] = "PRI"

            # Indexes
            cur.execute(
                """
                SELECT
                    i.relname AS "INDEX_NAME",
                    NOT ix.indisunique AS "NON_UNIQUE",
                    a.attnum AS "SEQ_IN_INDEX",
                    a.attname AS "COLUMN_NAME",
                    am.amname AS "INDEX_TYPE"
                FROM pg_index ix
                JOIN pg_class t ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_am am ON i.relam = am.oid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
                WHERE t.relname = %s AND t.relkind = 'r'
                ORDER BY i.relname, a.attnum
                """,
                (table,),
            )
            indexes = [dict(r) for r in cur.fetchall()]

            # Foreign keys
            cur.execute(
                """
                SELECT
                    tc.constraint_name AS "CONSTRAINT_NAME",
                    kcu.column_name AS "COLUMN_NAME",
                    ccu.table_name AS "REFERENCED_TABLE_NAME",
                    ccu.column_name AS "REFERENCED_COLUMN_NAME"
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                  ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = %s
                """,
                (table,),
            )
            foreign_keys = [dict(r) for r in cur.fetchall()]

            meta = {"TABLE_NAME": table, "ENGINE": "PostgreSQL", "TABLE_ROWS": None, "TABLE_COMMENT": ""}

    return {"meta": meta, "columns": columns, "indexes": indexes, "foreign_keys": foreign_keys}


def preview_table(host: str, port: int, user: str, password: str, database: str, table: str, limit: int = 100) -> dict:
    safe_table = table.replace('"', "")
    query = f'SELECT * FROM "{safe_table}" LIMIT %s'
    with get_pg_connection(host, port, user, password, database) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(query, (limit,))
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description] if cur.description else []
    return {"columns": columns, "rows": [dict(r) for r in rows], "count": len(rows)}


def execute_query(host: str, port: int, user: str, password: str, database: str | None, sql: str) -> dict:
    with get_pg_connection(host, port, user, password, database) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            start = time.monotonic()
            cur.execute(sql)
            rows = cur.fetchall()
            elapsed = round((time.monotonic() - start) * 1000, 2)
            columns = [desc[0] for desc in cur.description] if cur.description else []
    return {
        "columns": columns,
        "rows": [dict(r) for r in rows],
        "count": len(rows),
        "elapsed_ms": elapsed,
    }
