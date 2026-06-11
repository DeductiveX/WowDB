from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.limiter import limiter
from app.schemas.connection import QueryRequest, QueryResult
from app.services import connection_service, db_service
from app.services.query_guard import check_query

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResult)
@limiter.limit("30/minute")
def execute_query(
    request: Request,
    req: QueryRequest,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    conn = connection_service.get_connection(db, req.connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    if conn.db_type not in ("sqlite", "duckdb") and not x_db_password:
        raise HTTPException(status_code=401, detail="Missing X-DB-Password header")

    settings = get_settings()
    guard = check_query(req.query, settings.default_query_limit)

    if not guard.allowed:
        return {
            "success": False,
            "blocked": True,
            "reason": guard.reason,
            "columns": [],
            "rows": [],
            "count": 0,
            "elapsed_ms": 0,
        }

    database = req.database or conn.database
    try:
        result = db_service.execute_query(conn, x_db_password, database, guard.normalized_query)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "success": True,
        "blocked": False,
        "reason": None,
        "normalized_query": guard.normalized_query,
        **result,
    }
