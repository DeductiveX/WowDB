"""Global search across connections, saved queries, and pages."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.connection import Connection
from app.services import saved_query_service

router = APIRouter(prefix="/api", tags=["search"])


_STATIC_PAGES = [
    {"title": "Dashboard", "url": "/", "kind": "page", "icon": "home", "description": "Home overview"},
    {"title": "Connections", "url": "/connections", "kind": "page", "icon": "database", "description": "Manage database connections"},
    {"title": "New Connection", "url": "/connections/new", "kind": "page", "icon": "plus", "description": "Add a MySQL / PostgreSQL / SQLite / DuckDB connection"},
    {"title": "SQL Editor", "url": "/editor", "kind": "page", "icon": "code", "description": "Run read-only queries"},
    {"title": "Saved Queries", "url": "/queries", "kind": "page", "icon": "bookmark", "description": "Saved and parameterised queries"},
    {"title": "Query History", "url": "/history", "kind": "page", "icon": "history", "description": "Recent query history"},
    {"title": "Settings", "url": "/settings", "kind": "page", "icon": "settings", "description": "AI provider, API keys, theme"},
]


@router.get("/search")
def global_search(q: str = "", db: Session = Depends(get_db)):
    q = (q or "").strip()
    results = {"connections": [], "saved_queries": [], "pages": []}

    if not q:
        results["pages"] = _STATIC_PAGES
        return results

    q_lower = q.lower()

    # Connections — name / host / user / db_path
    conns_query = (
        db.query(Connection)
        .filter(Connection.is_active == True)
        .all()
    )
    for c in conns_query:
        hay = " ".join(filter(None, [c.name, c.host, c.user, c.db_path, c.database, c.db_type])).lower()
        if q_lower in hay:
            results["connections"].append({
                "id": c.id,
                "name": c.name,
                "db_type": c.db_type,
                "host": c.host,
                "db_path": c.db_path,
                "url": f"/connections/{c.id}",
            })

    # Saved queries
    for sq in saved_query_service.search(db, q):
        results["saved_queries"].append({
            "id": sq.id,
            "name": sq.name,
            "tags": sq.tags,
            "preview": (sq.query_text or "")[:120],
            "url": f"/queries?id={sq.id}",
        })

    # Pages
    results["pages"] = [p for p in _STATIC_PAGES if q_lower in (p["title"] + " " + p["description"]).lower()]

    return results
