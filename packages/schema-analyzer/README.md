# schema-analyzer

Reusable Python module for introspecting MySQL schemas.

**Role:** Wraps SQLAlchemy + PyMySQL inspection logic to provide a clean API for listing databases, tables, columns, indexes and foreign keys.

**Status:** Embedded in `apps/api/app/services/mysql_service.py` for v0.1. Will be extracted to a standalone package in v0.2.

## Planned API

```python
from schema_analyzer import SchemaAnalyzer

analyzer = SchemaAnalyzer(host, port, user, password, database)
analyzer.list_tables()
analyzer.describe_table("my_table")
analyzer.list_indexes("my_table")
```
