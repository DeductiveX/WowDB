"""WowDB MCP Server — exposes database tools and schema resources to Claude, Cursor and N8n."""

import json
import os
import sys
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

from wowdb_mcp import client

server = Server("wowdb")


# ── Resources: schemas exposed as virtual files ────────────────────────

@server.list_resources()
async def list_resources() -> list[types.Resource]:
    """Expose each saved connection as a resource URI.
    Claude can read these without calling a tool — schema arrives as context."""
    out: list[types.Resource] = []
    try:
        connections = client.list_connections()
    except Exception:
        return out
    for c in connections:
        cid = c["id"]
        name = c["name"]
        out.append(types.Resource(
            uri=f"wowdb://connection/{cid}",
            name=f"{name} — connection info",
            description=f"WowDB connection #{cid} ({c.get('db_type', '?')})",
            mimeType="application/json",
        ))
        out.append(types.Resource(
            uri=f"wowdb://connection/{cid}/databases",
            name=f"{name} — databases list",
            description="List of databases on this connection",
            mimeType="application/json",
        ))
    return out


@server.read_resource()
async def read_resource(uri: str) -> str:
    """Return the JSON content for a wowdb:// URI."""
    if not uri.startswith("wowdb://"):
        raise ValueError(f"Unsupported URI scheme: {uri}")
    path = uri[len("wowdb://"):]
    parts = path.split("/")
    # connection/{id}
    if len(parts) == 2 and parts[0] == "connection":
        cid = int(parts[1])
        conns = [c for c in client.list_connections() if c["id"] == cid]
        return json.dumps(conns[0] if conns else {}, indent=2)
    # connection/{id}/databases  (no password — only works for sqlite/duckdb)
    if len(parts) == 3 and parts[0] == "connection" and parts[2] == "databases":
        cid = int(parts[1])
        # Need a password to call /databases; for sqlite/duckdb backend ignores it.
        # If WOWDB_DB_PASSWORD env is set, use it as a default.
        pwd = os.environ.get("WOWDB_DB_PASSWORD", "__sqlite__")
        try:
            dbs = client.list_databases(cid, pwd)
            return json.dumps(dbs, indent=2)
        except Exception as e:
            return json.dumps({"error": str(e)})
    # schema/{conn}/{database}  (requires password env)
    if len(parts) == 3 and parts[0] == "schema":
        cid = int(parts[1])
        database = parts[2]
        pwd = os.environ.get("WOWDB_DB_PASSWORD", "__sqlite__")
        try:
            ctx = client.get_schema_context(cid, database, pwd)
            return json.dumps(ctx, indent=2)
        except Exception as e:
            return json.dumps({"error": str(e)})
    raise ValueError(f"Unknown wowdb URI: {uri}")


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="list_connections",
            description="List all saved WowDB connections (name, host, type). No password required.",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="list_databases",
            description="List databases available in a WowDB connection.",
            inputSchema={
                "type": "object",
                "properties": {
                    "connection_id": {"type": "integer", "description": "WowDB connection ID"},
                    "password": {"type": "string", "description": "Database password (not stored by WowDB)"},
                },
                "required": ["connection_id", "password"],
            },
        ),
        types.Tool(
            name="list_tables",
            description="List tables in a database, including row counts and comments.",
            inputSchema={
                "type": "object",
                "properties": {
                    "connection_id": {"type": "integer"},
                    "database": {"type": "string", "description": "Database name"},
                    "password": {"type": "string"},
                },
                "required": ["connection_id", "database", "password"],
            },
        ),
        types.Tool(
            name="describe_table",
            description="Describe a table: columns, types, nullability, indexes, foreign keys.",
            inputSchema={
                "type": "object",
                "properties": {
                    "connection_id": {"type": "integer"},
                    "database": {"type": "string"},
                    "table": {"type": "string", "description": "Table name"},
                    "password": {"type": "string"},
                },
                "required": ["connection_id", "database", "table", "password"],
            },
        ),
        types.Tool(
            name="run_safe_select",
            description=(
                "Execute a read-only SQL query via WowDB Query Guard. "
                "Only SELECT, SHOW, DESCRIBE and EXPLAIN are allowed. "
                "LIMIT is auto-applied. Never sends actual data to AI — results returned as JSON."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "connection_id": {"type": "integer"},
                    "query": {"type": "string", "description": "SQL query to execute"},
                    "password": {"type": "string"},
                    "database": {"type": "string", "description": "Target database (optional if set in connection)"},
                },
                "required": ["connection_id", "query", "password"],
            },
        ),
        types.Tool(
            name="get_schema_context",
            description=(
                "Get a compact JSON summary of all tables, columns, types and FK relationships "
                "for AI context. Only metadata — no actual row data."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "connection_id": {"type": "integer"},
                    "database": {"type": "string"},
                    "password": {"type": "string"},
                },
                "required": ["connection_id", "database", "password"],
            },
        ),
        types.Tool(
            name="generate_docs",
            description="Generate full Markdown documentation for a database schema.",
            inputSchema={
                "type": "object",
                "properties": {
                    "connection_id": {"type": "integer"},
                    "database": {"type": "string"},
                    "password": {"type": "string"},
                },
                "required": ["connection_id", "database", "password"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    try:
        if name == "list_connections":
            connections = client.list_connections()
            result = [
                {
                    "id": c["id"],
                    "name": c["name"],
                    "db_type": c.get("db_type", "mysql"),
                    "host": c.get("host"),
                    "port": c.get("port"),
                }
                for c in connections
            ]
            return [types.TextContent(type="text", text=json.dumps(result, indent=2))]

        elif name == "list_databases":
            databases = client.list_databases(arguments["connection_id"], arguments["password"])
            return [types.TextContent(type="text", text=json.dumps(databases, indent=2))]

        elif name == "list_tables":
            tables = client.list_tables(arguments["connection_id"], arguments["database"], arguments["password"])
            simplified = [
                {
                    "name": t.get("TABLE_NAME"),
                    "type": t.get("TABLE_TYPE"),
                    "engine": t.get("ENGINE"),
                    "approx_rows": t.get("TABLE_ROWS"),
                    "comment": t.get("TABLE_COMMENT") or "",
                }
                for t in tables
            ]
            return [types.TextContent(type="text", text=json.dumps(simplified, indent=2))]

        elif name == "describe_table":
            detail = client.describe_table(
                arguments["connection_id"],
                arguments["database"],
                arguments["table"],
                arguments["password"],
            )
            return [types.TextContent(type="text", text=json.dumps(detail, indent=2))]

        elif name == "run_safe_select":
            result = client.run_query(
                arguments["connection_id"],
                arguments["query"],
                arguments["password"],
                arguments.get("database"),
            )
            if result.get("blocked"):
                return [types.TextContent(type="text", text=f"Query blocked: {result.get('reason')}")]
            if not result.get("success"):
                return [types.TextContent(type="text", text=f"Query failed: {result.get('reason')}")]
            summary = {
                "columns": result.get("columns", []),
                "rows": result.get("rows", []),
                "count": result.get("count", 0),
                "elapsed_ms": result.get("elapsed_ms", 0),
            }
            return [types.TextContent(type="text", text=json.dumps(summary, indent=2))]

        elif name == "get_schema_context":
            context = client.get_schema_context(
                arguments["connection_id"],
                arguments["database"],
                arguments["password"],
            )
            return [types.TextContent(type="text", text=json.dumps(context, indent=2))]

        elif name == "generate_docs":
            markdown = client.generate_docs(
                arguments["connection_id"],
                arguments["database"],
                arguments["password"],
            )
            return [types.TextContent(type="text", text=markdown)]

        else:
            return [types.TextContent(type="text", text=f"Unknown tool: {name}")]

    except Exception as e:
        return [types.TextContent(type="text", text=f"Error: {str(e)}")]


async def _run():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


def main():
    import asyncio
    asyncio.run(_run())


if __name__ == "__main__":
    main()
