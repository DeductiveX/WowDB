"""HTTP client for the WowDB REST API."""

import os
import httpx

WOWDB_BASE_URL = os.environ.get("WOWDB_API_URL", "http://localhost:8000")
WOWDB_API_KEY = os.environ.get("WOWDB_API_KEY", "")


def _headers(db_password: str | None = None) -> dict[str, str]:
    h: dict[str, str] = {"Content-Type": "application/json"}
    if WOWDB_API_KEY:
        h["X-API-Key"] = WOWDB_API_KEY
    if db_password:
        h["X-DB-Password"] = db_password
    return h


def list_connections() -> list[dict]:
    with httpx.Client(base_url=WOWDB_BASE_URL, timeout=15) as client:
        r = client.get("/api/connections", headers=_headers())
        r.raise_for_status()
        return r.json()


def list_databases(connection_id: int, password: str) -> list[str]:
    with httpx.Client(base_url=WOWDB_BASE_URL, timeout=15) as client:
        r = client.get(f"/api/connections/{connection_id}/databases", headers=_headers(password))
        r.raise_for_status()
        return r.json()["databases"]


def list_tables(connection_id: int, database: str, password: str) -> list[dict]:
    with httpx.Client(base_url=WOWDB_BASE_URL, timeout=15) as client:
        r = client.get(
            f"/api/connections/{connection_id}/tables",
            params={"database": database},
            headers=_headers(password),
        )
        r.raise_for_status()
        return r.json()["tables"]


def describe_table(connection_id: int, database: str, table: str, password: str) -> dict:
    with httpx.Client(base_url=WOWDB_BASE_URL, timeout=15) as client:
        r = client.get(
            f"/api/connections/{connection_id}/tables/{table}",
            params={"database": database},
            headers=_headers(password),
        )
        r.raise_for_status()
        return r.json()


def run_query(connection_id: int, query: str, password: str, database: str | None = None) -> dict:
    with httpx.Client(base_url=WOWDB_BASE_URL, timeout=30) as client:
        r = client.post(
            "/api/query",
            json={"connection_id": connection_id, "query": query, "database": database},
            headers=_headers(password),
        )
        r.raise_for_status()
        return r.json()


def get_schema_context(connection_id: int, database: str, password: str) -> dict:
    with httpx.Client(base_url=WOWDB_BASE_URL, timeout=20) as client:
        r = client.get(
            f"/api/connections/{connection_id}/ai-context",
            params={"database": database},
            headers=_headers(password),
        )
        r.raise_for_status()
        return r.json()


def generate_docs(connection_id: int, database: str, password: str) -> str:
    with httpx.Client(base_url=WOWDB_BASE_URL, timeout=30) as client:
        r = client.get(
            f"/api/docs/{connection_id}",
            params={"database": database},
            headers=_headers(password),
        )
        r.raise_for_status()
        return r.json()["markdown"]
