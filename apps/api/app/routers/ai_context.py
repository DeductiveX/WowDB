from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import connection_service, db_service

router = APIRouter(prefix="/api/connections", tags=["ai"])


@router.get("/{connection_id}/ai-context")
def get_ai_context(
    connection_id: int,
    database: str,
    x_db_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    conn = connection_service.get_connection(db, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    if conn.db_type != "sqlite" and not x_db_password:
        raise HTTPException(status_code=401, detail="Missing X-DB-Password header")

    try:
        tables = db_service.list_tables(conn, x_db_password, database)
        result_tables = []
        for table in tables:
            name = table["TABLE_NAME"]
            detail = db_service.describe_table(conn, x_db_password, database, name)
            result_tables.append({
                "name": name,
                "engine": table.get("ENGINE", ""),
                "row_count": table.get("TABLE_ROWS"),
                "comment": table.get("TABLE_COMMENT", "") or "",
                "columns": [
                    {
                        "name": col["COLUMN_NAME"],
                        "type": col["COLUMN_TYPE"],
                        "key": col["COLUMN_KEY"],
                        "nullable": col["IS_NULLABLE"] == "YES",
                        "extra": col.get("EXTRA", ""),
                    }
                    for col in detail.get("columns", [])
                ],
                "foreign_keys": [
                    {
                        "column": fk["COLUMN_NAME"],
                        "references": f"{fk['REFERENCED_TABLE_NAME']}({fk['REFERENCED_COLUMN_NAME']})",
                    }
                    for fk in detail.get("foreign_keys", [])
                ],
            })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"database": database, "tables": result_tables}
