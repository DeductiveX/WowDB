# query-guard

Reusable Python module for enforcing read-only SQL execution.

**Role:** Uses sqlglot AST parsing to validate SQL statements and ensure only safe read-only operations (SELECT, SHOW, DESCRIBE, EXPLAIN) are executed.

**Status:** Implemented in `apps/api/app/services/query_guard.py` for v0.1. Will be extracted to a standalone pip-installable package in v0.2.

## Planned API

```python
from query_guard import QueryGuard

guard = QueryGuard(default_limit=100)
result = guard.check("SELECT * FROM users")
# result.allowed => True
# result.normalized_query => "SELECT * FROM users LIMIT 100"

result = guard.check("DROP TABLE users")
# result.allowed => False
# result.reason => "DROP statements are not allowed..."
```
