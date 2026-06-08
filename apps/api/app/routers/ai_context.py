from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import connection_service
from app.services.mysql_service import get_mysql_connection

router = APIRouter(prefix="/api/connections", tags=["ai"])


@router.get("/{connection_id}/ai-context")
def get_ai_context(
    connection_id: int,
    database: str,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not x_db_password:
        raise HTTPException(status_code=401, detail="Missing X-DB-Password header")

    conn = connection_service.get_connection(db, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    try:
        context = _build_context(conn.host, conn.port, conn.user, x_db_password, database)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return context


def _build_context(host: str, port: int, user: str, password: str, database: str) -> dict:
    with get_mysql_connection(host, port, user, password, database) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT TABLE_NAME, ENGINE, TABLE_ROWS, TABLE_COMMENT "
                "FROM information_schema.TABLES WHERE TABLE_SCHEMA = %s ORDER BY TABLE_NAME",
                (database,),
            )
            tables = {r["TABLE_NAME"]: dict(r) for r in cur.fetchall()}

            cur.execute(
                "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY, IS_NULLABLE, EXTRA "
                "FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = %s ORDER BY TABLE_NAME, ORDINAL_POSITION",
                (database,),
            )
            columns: dict[str, list] = {}
            for row in cur.fetchall():
                columns.setdefault(row["TABLE_NAME"], []).append({
                    "name": row["COLUMN_NAME"],
                    "type": row["COLUMN_TYPE"],
                    "key": row["COLUMN_KEY"],
                    "nullable": row["IS_NULLABLE"] == "YES",
                    "extra": row["EXTRA"],
                })

            cur.execute(
                "SELECT kcu.TABLE_NAME, kcu.COLUMN_NAME, "
                "kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME "
                "FROM information_schema.KEY_COLUMN_USAGE kcu "
                "JOIN information_schema.TABLE_CONSTRAINTS tc "
                "  ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME "
                "  AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA "
                "  AND kcu.TABLE_NAME = tc.TABLE_NAME "
                "WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY' AND kcu.TABLE_SCHEMA = %s",
                (database,),
            )
            fks: dict[str, list] = {}
            for row in cur.fetchall():
                fks.setdefault(row["TABLE_NAME"], []).append({
                    "column": row["COLUMN_NAME"],
                    "references": f"{row['REFERENCED_TABLE_NAME']}({row['REFERENCED_COLUMN_NAME']})",
                })

    return {
        "database": database,
        "tables": [
            {
                "name": name,
                "engine": meta.get("ENGINE", ""),
                "row_count": meta.get("TABLE_ROWS"),
                "comment": meta.get("TABLE_COMMENT", "") or "",
                "columns": columns.get(name, []),
                "foreign_keys": fks.get(name, []),
            }
            for name, meta in tables.items()
        ],
    }
