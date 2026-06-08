from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.connection import QueryRequest
from app.services import connection_service, mysql_service
from app.services.query_guard import check_query

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query")
def execute_query(
    req: QueryRequest,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not x_db_password:
        raise HTTPException(status_code=401, detail="Missing X-DB-Password header")

    conn = connection_service.get_connection(db, req.connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

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
        result = mysql_service.execute_query(
            conn.host, conn.port, conn.user, x_db_password, database, guard.normalized_query
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "success": True,
        "blocked": False,
        "reason": None,
        "normalized_query": guard.normalized_query,
        **result,
    }
