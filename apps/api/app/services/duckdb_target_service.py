"""DuckDB target — point at a folder of CSV/Parquet/JSON files, query them as SQL tables.

db_path: directory containing data files (or a single .duckdb file).
Each file becomes a virtual table; .csv/.parquet/.json discovered automatically.
"""

import os
import time
from contextlib import contextmanager

import duckdb


_SUPPORTED_EXTS = (".csv", ".parquet", ".json", ".jsonl", ".tsv")


def _is_duckdb_file(path: str) -> bool:
    return path.endswith(".duckdb") or path.endswith(".db")


def _table_name(filename: str) -> str:
    base = os.path.splitext(filename)[0]
    return base.replace("-", "_").replace(" ", "_")


def _files_in(path: str) -> list[tuple[str, str]]:
    """(table_name, full_path) tuples for supported data files in directory."""
    if not os.path.isdir(path):
        return []
    out: list[tuple[str, str]] = []
    for f in sorted(os.listdir(path)):
        full = os.path.join(path, f)
        if os.path.isfile(full) and f.lower().endswith(_SUPPORTED_EXTS):
            out.append((_table_name(f), full))
    return out


@contextmanager
def _conn(db_path: str):
    if _is_duckdb_file(db_path):
        c = duckdb.connect(db_path, read_only=True)
        try:
            yield c, None
        finally:
            c.close()
    else:
        c = duckdb.connect(":memory:")
        try:
            files = _files_in(db_path)
            for tname, full in files:
                full_safe = full.replace("'", "''")
                if full.lower().endswith((".csv", ".tsv")):
                    c.execute(f"CREATE VIEW {tname} AS SELECT * FROM read_csv_auto('{full_safe}')")
                elif full.lower().endswith(".parquet"):
                    c.execute(f"CREATE VIEW {tname} AS SELECT * FROM read_parquet('{full_safe}')")
                elif full.lower().endswith((".json", ".jsonl")):
                    c.execute(f"CREATE VIEW {tname} AS SELECT * FROM read_json_auto('{full_safe}')")
            yield c, files
        finally:
            c.close()


def test_connection(db_path: str) -> tuple[bool, str, float | None]:
    start = time.monotonic()
    try:
        with _conn(db_path) as (c, files):
            c.execute("SELECT 1").fetchone()
            count = "duckdb file" if _is_duckdb_file(db_path) else f"{len(files or [])} data files"
        latency = round((time.monotonic() - start) * 1000, 2)
        return True, f"Connected · {count}", latency
    except Exception as e:
        return False, f"DuckDB error: {e}", None


def list_databases(db_path: str) -> list[str]:
    base = os.path.basename(db_path.rstrip("/\\"))
    return [base or "duckdb"]


def list_tables(db_path: str) -> list[dict]:
    with _conn(db_path) as (c, files):
        rows = c.execute(
            "SELECT table_name, table_type FROM information_schema.tables "
            "WHERE table_schema NOT IN ('information_schema', 'pg_catalog')"
        ).fetchall()
    out = []
    for r in rows:
        out.append({
            "TABLE_NAME": r[0],
            "TABLE_TYPE": r[1],
            "ENGINE": "DuckDB",
            "TABLE_ROWS": None,
            "TABLE_COMMENT": "",
        })
    return out


def describe_table(db_path: str, table: str) -> dict:
    safe = table.replace('"', "")
    with _conn(db_path) as (c, _):
        rows = c.execute(
            f"PRAGMA table_info('{safe}')"
        ).fetchall()
    columns = []
    for i, r in enumerate(rows):
        columns.append({
            "COLUMN_NAME": r[1],
            "ORDINAL_POSITION": i + 1,
            "COLUMN_DEFAULT": r[4],
            "IS_NULLABLE": "YES" if not r[3] else "NO",
            "DATA_TYPE": (r[2] or "").upper(),
            "COLUMN_TYPE": r[2] or "",
            "COLUMN_KEY": "PRI" if r[5] else "",
            "EXTRA": "",
            "COLUMN_COMMENT": "",
        })
    return {
        "meta": {"TABLE_NAME": table, "ENGINE": "DuckDB", "TABLE_ROWS": None, "TABLE_COMMENT": ""},
        "columns": columns,
        "indexes": [],
        "foreign_keys": [],
    }


def preview_table(db_path: str, table: str, limit: int = 100) -> dict:
    safe = table.replace('"', "")
    with _conn(db_path) as (c, _):
        cur = c.execute(f'SELECT * FROM "{safe}" LIMIT ?', [limit])
        rows = cur.fetchall()
        columns = [d[0] for d in cur.description] if cur.description else []
    return {"columns": columns, "rows": [dict(zip(columns, r)) for r in rows], "count": len(rows)}


def execute_query(db_path: str, sql: str) -> dict:
    with _conn(db_path) as (c, _):
        start = time.monotonic()
        cur = c.execute(sql)
        rows = cur.fetchall()
        elapsed = round((time.monotonic() - start) * 1000, 2)
        columns = [d[0] for d in cur.description] if cur.description else []
    return {
        "columns": columns,
        "rows": [dict(zip(columns, r)) for r in rows],
        "count": len(rows),
        "elapsed_ms": elapsed,
    }
