# WowDB Roadmap

## v0.1 — MySQL Read-only Workbench ✅ Current

- MySQL connection manager (no password storage)
- Database & table explorer
- Column, index and foreign key inspection
- Safe data preview (LIMIT 100)
- Read-only Query Guard (sqlglot AST)
- SQL Editor with enforcement
- Markdown schema documentation
- Docker Compose demo environment
- Fictitious credit domain dataset

## v0.2 — PostgreSQL + ERD

- PostgreSQL support
- Improved ERD visualization (Mermaid or D3)
- Table relationship graph
- Schema comparison (two databases side by side)
- Improved Markdown docs with Mermaid diagrams

## v0.3 — AI Explain

- Optional AI integration (Ollama local or OpenAI)
- Natural language schema explanation
- Query suggestion from natural language
- Column and table meaning inference
- Privacy-first: AI is opt-in and local-first

## v0.4 — MCP Server

- Full MCP server implementation
- Tools: list_databases, list_tables, describe_table, run_safe_select, explain_schema, generate_documentation
- Works with Claude, Cursor, and other MCP-compatible clients
- Read-only MCP tools only

## v0.5 — Credit Intelligence Pack

- Domain-specific intelligence for credit/financial databases
- Automatic detection of credit-related schemas
- Pre-built report templates for credit portfolios
- Installment and payment analysis views
- Compliance-friendly export

## v0.6 — Automation & Integrations

- Scheduled schema snapshots
- Schema drift detection
- Webhook notifications
- Slack/Teams integration for schema alerts
- CI/CD integration for schema documentation
