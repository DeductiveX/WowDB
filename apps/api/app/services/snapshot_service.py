"""Schema snapshots + drift detection."""

import json
from sqlalchemy.orm import Session

from app.models.connection import Connection, SchemaSnapshot
from app.services import db_service, webhook_service


def _build_snapshot(conn: Connection, password: str | None, database: str) -> dict:
    tables = db_service.list_tables(conn, password, database)
    result = {"tables": {}}
    for t in tables:
        name = t.get("TABLE_NAME")
        if not name:
            continue
        detail = db_service.describe_table(conn, password, database, name)
        result["tables"][name] = {
            "engine": t.get("ENGINE", ""),
            "comment": t.get("TABLE_COMMENT") or "",
            "columns": [
                {
                    "name": c["COLUMN_NAME"],
                    "type": c.get("COLUMN_TYPE") or c.get("DATA_TYPE") or "",
                    "nullable": c.get("IS_NULLABLE") == "YES",
                    "key": c.get("COLUMN_KEY", ""),
                }
                for c in detail.get("columns", [])
            ],
            "foreign_keys": [
                {"column": fk["COLUMN_NAME"], "ref_table": fk.get("REFERENCED_TABLE_NAME"), "ref_column": fk.get("REFERENCED_COLUMN_NAME")}
                for fk in detail.get("foreign_keys", [])
            ],
        }
    return result


def create_snapshot(db: Session, conn: Connection, password: str | None, database: str) -> SchemaSnapshot:
    snap_data = _build_snapshot(conn, password, database)
    table_count = len(snap_data["tables"])
    column_count = sum(len(t["columns"]) for t in snap_data["tables"].values())

    # Find previous snapshot for drift detection
    prev = (
        db.query(SchemaSnapshot)
        .filter(SchemaSnapshot.connection_id == conn.id, SchemaSnapshot.database == database)
        .order_by(SchemaSnapshot.captured_at.desc())
        .first()
    )

    snap = SchemaSnapshot(
        connection_id=conn.id,
        database=database,
        snapshot_json=json.dumps(snap_data),
        table_count=table_count,
        column_count=column_count,
    )
    db.add(snap)
    db.commit()
    db.refresh(snap)

    # Drift detection
    if prev:
        prev_data = json.loads(prev.snapshot_json)
        diff = compute_diff(prev_data, snap_data)
        if any(diff.values()):
            webhook_service.emit("schema.drift", {
                "connection_id": conn.id,
                "database": database,
                "previous_snapshot_id": prev.id,
                "current_snapshot_id": snap.id,
                "diff": diff,
            })

    return snap


def compute_diff(prev: dict, curr: dict) -> dict:
    prev_tables = prev.get("tables", {})
    curr_tables = curr.get("tables", {})

    tables_added = sorted(set(curr_tables) - set(prev_tables))
    tables_removed = sorted(set(prev_tables) - set(curr_tables))

    columns_added = []
    columns_removed = []
    columns_changed = []

    for tname in sorted(set(prev_tables) & set(curr_tables)):
        prev_cols = {c["name"]: c for c in prev_tables[tname]["columns"]}
        curr_cols = {c["name"]: c for c in curr_tables[tname]["columns"]}
        for cname in set(curr_cols) - set(prev_cols):
            columns_added.append({"table": tname, "column": cname, "type": curr_cols[cname]["type"]})
        for cname in set(prev_cols) - set(curr_cols):
            columns_removed.append({"table": tname, "column": cname, "type": prev_cols[cname]["type"]})
        for cname in set(prev_cols) & set(curr_cols):
            if prev_cols[cname] != curr_cols[cname]:
                columns_changed.append({
                    "table": tname, "column": cname,
                    "before": prev_cols[cname], "after": curr_cols[cname],
                })

    return {
        "tables_added": tables_added,
        "tables_removed": tables_removed,
        "columns_added": columns_added,
        "columns_removed": columns_removed,
        "columns_changed": columns_changed,
    }


def get_snapshot_data(snap: SchemaSnapshot) -> dict:
    return json.loads(snap.snapshot_json) if snap.snapshot_json else {"tables": {}}
