# WowDB Architecture

## Overview

WowDB is a **read-only database exploration layer**, not a database engine. It sits on top of existing MySQL databases and provides a modern UI for exploration, querying, and documentation.

## Components

### Frontend (`apps/web`)
- **Next.js 14** with App Router and TypeScript
- **shadcn/ui** components on top of Tailwind CSS
- State management: React hooks + in-memory password store
- API communication: centralized `lib/api.ts` client
- Passwords are held in `sessionStorage` (never localStorage or cookies)

### Backend (`apps/api`)
- **FastAPI** with Python 3.11+
- Routers: `health`, `connections`, `explorer`, `query`, `docs`
- Services layer separates business logic from endpoints
- **SQLite** (via SQLAlchemy) for internal WowDB metadata

### Internal SQLite Database
Stores only:
- Connection metadata (name, host, port, user — **never password**)
- Query history (query text only, no results)

### MySQL Target Database
WowDB connects to user-provided MySQL instances as a client:
- Uses **PyMySQL** for raw connections
- Read timeouts enforced at driver level (10s default)
- Credentials passed per-request via `X-DB-Password` header

### Query Guard (`app/services/query_guard.py`)
Multi-layer SQL safety enforcement:
1. **Keyword scanning** — blocks dangerous tokens before parsing
2. **AST inspection** — uses `sqlglot` to parse and classify statements
3. **Multiple statement detection** — rejects batched queries
4. **Auto-LIMIT** — appends `LIMIT 100` to SELECT without LIMIT

### Markdown Service (`app/services/markdown_service.py`)
Generates human-readable schema documentation by:
1. Listing all tables via `information_schema.TABLES`
2. Describing each table's columns, indexes and foreign keys
3. Assembling a structured Markdown document

## Data Flow

```
Browser ──HTTP──► Next.js (SSR/CSR)
                      │
                      │ REST API
                      ▼
               FastAPI Backend
               ┌─────┴──────────────────┐
               │                        │
         Query Guard              SQLite (meta)
         (sqlglot AST)            connections
               │                  query history
               │
         MySQL Service (PyMySQL)
               │
         Target MySQL DB
         (read-only ops only)
```

## Why Not a Full SGBD?

WowDB deliberately does NOT implement:
- A storage engine
- Query planning
- Transaction management
- Connection pooling (beyond per-request connections)
- Replication
- Data writing

These are already provided by MySQL. WowDB is a lens, not a replacement.

## Security Architecture

See [security.md](security.md).
