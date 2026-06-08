# 🗄️ WowDB

<div align="center">

**AI-native open-source database workbench for relational databases**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](docker-compose.yml)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg)](https://mysql.com)
[![Status](https://img.shields.io/badge/Status-v0.1%20MVP-green.svg)](#)

[Features](#-features) · [Quick Start](#-quick-start) · [Architecture](#-architecture) · [Security](#-security) · [Roadmap](#-roadmap) · [Contributing](#-contributing)

</div>

---

> ⚠️ **WowDB is not recommended for direct production database connections** without a dedicated read-only MySQL user and proper security review. See [Security](#-security).

---

## 📸 Preview

```
┌─────────────────────────────────────────────────────────────────────┐
│  🗄️ WowDB             Connections  Editor  Docs  Settings          │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  creditdb    │   📋 Table: contratos                                │
│  ├─ clients  │                                                      │
│  ├─ contrat… │   Column          Type        Null   Key    Default  │
│  ├─ parcelas │   ─────────────────────────────────────────────────  │
│  ├─ pagamen… │   id              INT         NO     PRI    —        │
│  └─ produto… │   cliente_id      INT         NO     MUL    —        │
│              │   valor_total     DECIMAL     NO     —      0.00     │
│  [+ Connect] │   status          VARCHAR     NO     —      ativo    │
│              │   created_at      DATETIME    NO     —      NOW()    │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## ✨ Features

### v0.1 — MySQL Read-only Workbench

| Feature | Status |
|---|---|
| 🔌 MySQL connection manager | ✅ |
| 🗂️ Database & table explorer | ✅ |
| 🔍 Column/index/FK inspection | ✅ |
| 👀 Safe data preview (LIMIT 100) | ✅ |
| 🛡️ Read-only Query Guard (sqlglot AST) | ✅ |
| 📝 SQL Editor with safety enforcement | ✅ |
| 📄 Markdown schema documentation | ✅ |
| 🌙 Dark/light theme | ✅ |
| 🐳 Docker Compose demo environment | ✅ |
| 📦 Demo dataset (credit domain) | ✅ |

### What WowDB is NOT

- ❌ Not a database engine or SGBD
- ❌ Not a migration tool
- ❌ Not an ORM
- ❌ Not a data editing tool
- ❌ Not a production DBA replacement

WowDB is a **read-only exploration and documentation layer** on top of your existing MySQL databases.

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/)
- Node.js 18+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Option 1 — Docker Compose (recommended)

```bash
git clone https://github.com/your-username/wowdb.git
cd wowdb
cp .env.example .env
docker compose up --build
```

Then open:
- **Frontend:** http://localhost:3000
- **API docs:** http://localhost:8000/docs
- **API health:** http://localhost:8000/health

### Option 2 — Local Development

**Backend:**
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../../.env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd apps/web
npm install
cp ../../.env.example .env.local
npm run dev
```

---

## 🐳 Docker Compose

The `docker-compose.yml` spins up three services:

| Service | Port | Description |
|---|---|---|
| `web` | 3000 | Next.js frontend |
| `api` | 8000 | FastAPI backend |
| `mysql-demo` | 3306 | MySQL 8.0 with demo dataset |

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop
docker compose down

# Reset demo database
docker compose down -v && docker compose up
```

---

## 🎯 Demo Dataset

The demo MySQL instance comes pre-loaded with a fictitious credit management dataset:

```
creditdb
├── clientes          — Customer records
├── produtos_credito  — Credit products
├── status_contrato   — Contract status lookup
├── contratos         — Credit contracts
├── parcelas          — Contract installments
└── pagamentos        — Payment records
```

**Demo connection details:**
```
Host:     localhost
Port:     3306
Database: creditdb
User:     demo_user
Password: demo_pass123
```

> All data is 100% fictitious. No real names, CPFs, emails or sensitive data.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser / Client                │
└──────────────────────┬──────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────┐
│              Next.js Frontend (port 3000)        │
│              App Router · TypeScript · shadcn/ui │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│              FastAPI Backend (port 8000)         │
│  ┌───────────────┐  ┌──────────────────────────┐│
│  │  Query Guard  │  │   Schema Service         ││
│  │  (sqlglot)    │  │   (SQLAlchemy + PyMySQL) ││
│  └───────────────┘  └──────────────┬───────────┘│
│  ┌───────────────┐                 │            │
│  │ SQLite (meta) │  ┌──────────────▼───────────┐│
│  │ connections   │  │  MySQL Target Database   ││
│  │ query history │  │  (read-only operations)  ││
│  └───────────────┘  └──────────────────────────┘│
└─────────────────────────────────────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for details.

---

## 🛡️ Security

WowDB enforces read-only access at multiple layers:

### Query Guard (backend)
- Parses SQL using **sqlglot AST** (not regex)
- Allows only: `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN`
- Blocks: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `REPLACE`, `GRANT`, `REVOKE`, `EXEC`, `LOAD DATA`, and more
- Blocks multiple statements in a single input
- Auto-applies `LIMIT 100` to SELECT without LIMIT
- Enforces 10-second query timeout

### Data Privacy
- **Passwords are never stored** (v0.1)
- No sensitive data in logs
- SQLite stores only connection metadata (host, port, user, name)

### Recommended Setup

```sql
-- Create a dedicated read-only MySQL user
CREATE USER 'wowdb_reader'@'%' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, SHOW VIEW ON your_database.* TO 'wowdb_reader'@'%';
FLUSH PRIVILEGES;
```

> See [docs/security.md](docs/security.md) for full security documentation.

---

## 🗺️ Roadmap

| Version | Focus |
|---|---|
| **v0.1** ✅ | MySQL read-only workbench (current) |
| v0.2 | PostgreSQL support + improved ERD |
| v0.3 | AI explain + Ollama/OpenAI optional integration |
| v0.4 | MCP server for AI agents |
| v0.5 | Credit Intelligence Pack |
| v0.6 | Automation & integrations |

See [docs/roadmap.md](docs/roadmap.md) for details.

---

## 📡 API Reference

```
GET  /health                                          — Service health
POST /api/connections/test                            — Test MySQL connection
POST /api/connections/session                         — Create temp session
GET  /api/connections                                 — List saved connections
GET  /api/connections/{id}                            — Get connection details
GET  /api/connections/{id}/databases                  — List databases
GET  /api/connections/{id}/tables                     — List tables
GET  /api/connections/{id}/tables/{table}             — Table details
GET  /api/connections/{id}/tables/{table}/preview     — Data preview
POST /api/query                                       — Execute read-only query
GET  /api/docs/{id}                                   — Generate schema docs
```

Interactive docs available at http://localhost:8000/docs when running.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Development

```bash
# Backend tests
cd apps/api && pytest

# Frontend type check
cd apps/web && npm run type-check

# Lint
cd apps/api && ruff check .
cd apps/web && npm run lint
```

---

## 📄 License

[MIT](LICENSE) — free to use, modify and distribute.

---

<div align="center">
Built with ❤️ for developers who love clean tools · <a href="https://github.com/your-username/wowdb/issues">Report a bug</a> · <a href="docs/roadmap.md">Roadmap</a>
</div>
