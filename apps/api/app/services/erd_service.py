"""
ERD service — builds nodes and edges for the React Flow canvas.

Edges come from two sources:
  1. Explicit FK constraints (information_schema.KEY_COLUMN_USAGE)
  2. Inferred relationships from column naming conventions (e.g. cliente_id → clientes.id)
"""

from app.services import mysql_service


def build_erd(host: str, port: int, user: str, password: str, database: str) -> dict:
    tables = mysql_service.list_tables(host, port, user, password, database)
    table_names = [t["TABLE_NAME"] for t in tables]
    table_name_set = {n.lower() for n in table_names}

    nodes = []
    explicit_edges = []

    for table in tables:
        name = table["TABLE_NAME"]
        detail = mysql_service.describe_table(host, port, user, password, database, name)

        nodes.append({
            "id": name,
            "table_name": name,
            "engine": table.get("ENGINE", ""),
            "comment": table.get("TABLE_COMMENT", "") or "",
            "row_count": table.get("TABLE_ROWS"),
            "columns": [
                {
                    "name": col["COLUMN_NAME"],
                    "type": col["COLUMN_TYPE"],
                    "nullable": col["IS_NULLABLE"] == "YES",
                    "key": col["COLUMN_KEY"],
                    "extra": col.get("EXTRA", ""),
                }
                for col in detail["columns"]
            ],
        })

        for fk in detail.get("foreign_keys", []):
            explicit_edges.append({
                "id": fk["CONSTRAINT_NAME"],
                "source": name,
                "source_handle": fk["COLUMN_NAME"],
                "target": fk["REFERENCED_TABLE_NAME"],
                "target_handle": fk["REFERENCED_COLUMN_NAME"],
                "kind": "fk",
            })

    # Infer relationships from column naming conventions
    inferred_edges = _infer_edges(nodes, table_name_set, explicit_edges)

    return {
        "nodes": nodes,
        "edges": explicit_edges + inferred_edges,
    }


def _infer_edges(nodes: list, table_name_set: set, explicit_edges: list) -> list:
    explicit_pairs = {(e["source"], e["source_handle"]) for e in explicit_edges}
    inferred = []

    for node in nodes:
        for col in node["columns"]:
            col_name = col["name"].lower()

            # Skip PKs and already-covered columns
            if col["key"] == "PRI":
                continue
            if (node["id"], col["name"]) in explicit_pairs:
                continue

            if not col_name.endswith("_id"):
                continue

            base = col_name[:-3]  # strip _id
            candidates = [base, base + "s", base + "es", base.rstrip("e") + "es"]
            target_table = next((c for c in candidates if c in table_name_set), None)

            if not target_table or target_table == node["id"].lower():
                continue

            # Find actual cased table name
            actual_target = next(n["id"] for n in nodes if n["id"].lower() == target_table)

            edge_id = f"inferred_{node['id']}_{col['name']}"
            if edge_id in {e["id"] for e in inferred}:
                continue

            inferred.append({
                "id": edge_id,
                "source": node["id"],
                "source_handle": col["name"],
                "target": actual_target,
                "target_handle": "id",
                "kind": "inferred",
            })

    return inferred
