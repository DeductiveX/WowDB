# WowDB MCP Server

Exposes WowDB database tools to Claude Desktop, Cursor, and any MCP-compatible client.

## Tools

| Tool | Description |
|------|-------------|
| `list_connections` | List saved connections (no password needed) |
| `list_databases` | List databases in a connection |
| `list_tables` | List tables with row counts and comments |
| `describe_table` | Full table schema: columns, indexes, FK |
| `run_safe_select` | Execute read-only SQL via Query Guard |
| `get_schema_context` | Compact JSON schema for AI context |
| `generate_docs` | Generate Markdown schema documentation |

## Installation

```bash
cd apps/mcp-server
pip install -e .
```

## Configuration

```bash
WOWDB_API_URL=http://localhost:8000   # WowDB API URL (default)
WOWDB_API_KEY=wdb_your_key_here       # API key from Settings > API Keys
```

## Connect to Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wowdb": {
      "command": "wowdb-mcp",
      "env": {
        "WOWDB_API_URL": "http://localhost:8000",
        "WOWDB_API_KEY": "wdb_your_key_here"
      }
    }
  }
}
```

macOS path: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows path: `%APPDATA%\Claude\claude_desktop_config.json`

## Connect to Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "wowdb": {
      "command": "wowdb-mcp",
      "env": {
        "WOWDB_API_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Example prompts (Claude Desktop)

```
List my WowDB connections
Show tables in creditdb (connection 1, password: demo_pass123)
Describe the contratos table in creditdb
Run SELECT * FROM clientes LIMIT 10
Generate documentation for the creditdb schema
```

## Security

- All SQL goes through Query Guard — only SELECT/SHOW/DESCRIBE/EXPLAIN allowed
- Passwords are passed per-call, never stored
- Use `WOWDB_API_KEY` to restrict access (generate in Settings > API Keys)
