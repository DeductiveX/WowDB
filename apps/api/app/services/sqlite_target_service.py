"""SQLite file-based target connection service (not the internal WowDB metadata DB)."""

import sqlite3
import time
from contextlib import contextmanager


@contextmanager
def get_sqlite_connection(db_path: str):
    conn = sqlite3.connect(db_path, timeout=10)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def test_connection(db_path: str) -> tuple[bool, str, float | None]:
    start = time.monotonic()
    try:
        with get_sqlite_connection(db_path) as conn:
            conn.execute("SELECT 1")
        latency = (time.monotonic() - start) * 1000
        return True, "Connection successful", round(latency, 2)
    except Exception as e:
        return False, f"Cannot open SQLite file: {str(e)}", None


def list_databases(db_path: str) -> list[str]:
    import os
    return [os.path.basename(db_path).replace(".db", "").replace(".sqlite", "").replace(".sqlite3", "")]


def list_tables(db_path: str) -> list[dict]:
    with get_sqlite_connection(db_path) as conn:
        cur = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        rows = cur.fetchall()
    return [
        {"TABLE_NAME": row["name"], "TABLE_TYPE": "BASE TABLE", "ENGINE": "SQLite", "TABLE_ROWS": None, "TABLE_COMMENT": ""}
        for row in rows
    ]


def describe_table(db_path: str, table: str) -> dict:
    safe_table = table.replace('"', "")
    with get_sqlite_connection(db_path) as conn:
        cur = conn.execute(f'PRAGMA table_info("{safe_table}")')
        pragma_rows = cur.fetchall()

        cur = conn.execute(f'PRAGMA index_list("{safe_table}")')
        index_list = cur.fetchall()

        indexes = []
        for idx in index_list:
            cur = conn.execute(f'PRAGMA index_info("{idx["name"]}")')
            for col in cur.fetchall():
                indexes.append({
                    "INDEX_NAME": idx["name"],
                    "NON_UNIQUE": 0 if idx["unique"] else 1,
                    "SEQ_IN_INDEX": col["seqno"] + 1,
                    "COLUMN_NAME": col["name"],
                    "INDEX_TYPE": "BTREE",
                })

        cur = conn.execute(f'PRAGMA foreign_key_list("{safe_table}")')
        fk_rows = cur.fetchall()

    columns = [
        {
            "COLUMN_NAME": row["name"],
            "ORDINAL_POSITION": row["cid"] + 1,
            "COLUMN_DEFAULT": row["dflt_value"],
            "IS_NULLABLE": "NO" if row["notnull"] else "YES",
            "DATA_TYPE": row["type"].upper() if row["type"] else "TEXT",
            "COLUMN_TYPE": row["type"] or "TEXT",
            "COLUMN_KEY": "PRI" if row["pk"] else "",
            "EXTRA": "",
            "COLUMN_COMMENT": "",
        }
        for row in pragma_rows
    ]

    foreign_keys = [
        {
            "CONSTRAINT_NAME": f"fk_{safe_table}_{row['from']}",
            "COLUMN_NAME": row["from"],
            "REFERENCED_TABLE_NAME": row["table"],
            "REFERENCED_COLUMN_NAME": row["to"] or "id",
        }
        for row in fk_rows
    ]

    return {
        "meta": {"TABLE_NAME": table, "ENGINE": "SQLite", "TABLE_ROWS": None, "TABLE_COMMENT": ""},
        "columns": columns,
        "indexes": indexes,
        "foreign_keys": foreign_keys,
    }


def preview_table(db_path: str, table: str, limit: int = 100) -> dict:
    safe_table = table.replace('"', "")
    with get_sqlite_connection(db_path) as conn:
        cur = conn.execute(f'SELECT * FROM "{safe_table}" LIMIT ?', (limit,))
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description] if cur.description else []
    return {"columns": columns, "rows": [dict(r) for r in rows], "count": len(rows)}


def execute_query(db_path: str, sql: str) -> dict:
    with get_sqlite_connection(db_path) as conn:
        start = time.monotonic()
        cur = conn.execute(sql)
        rows = cur.fetchall()
        elapsed = round((time.monotonic() - start) * 1000, 2)
        columns = [desc[0] for desc in cur.description] if cur.description else []
    return {
        "columns": columns,
        "rows": [dict(r) for r in rows],
        "count": len(rows),
        "elapsed_ms": elapsed,
    }
