# WowDB MCP Server (Planned — v0.4)

The WowDB MCP (Model Context Protocol) server is planned for v0.4.

It will allow AI agents (Claude, Cursor, etc.) to interact with your database schema through a standardized protocol.

## Planned MCP Tools

| Tool | Description | Safety |
|---|---|---|
| `list_databases` | List available databases for a connection | Read-only |
| `list_tables` | List tables in a database | Read-only |
| `describe_table` | Describe columns, indexes and FKs | Read-only |
| `run_safe_select` | Execute a SELECT via Query Guard | Read-only, LIMIT enforced |
| `explain_schema` | Summarize a database schema in natural language | Read-only |
| `generate_documentation` | Generate Markdown docs for a schema | Read-only |

## Design Principles

- All tools will be read-only
- The Query Guard will be applied to any SQL executed via MCP
- No write operations will be exposed via MCP in any version
- Authentication will use the same per-request password model

## Implementation Notes

The MCP server will be implemented in `apps/mcp-server/` using the [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk).

It will reuse the existing `apps/api` services directly (schema_service, query_guard, markdown_service) rather than duplicating logic.

## Current Status

See the placeholder at [apps/mcp-server/README.md](../apps/mcp-server/README.md).
