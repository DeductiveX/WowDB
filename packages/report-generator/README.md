# report-generator

Reusable Python module for generating schema documentation.

**Role:** Takes schema introspection data and generates human-readable Markdown documentation for databases and tables.

**Status:** Implemented in `apps/api/app/services/markdown_service.py` for v0.1. Will be extended with HTML, PDF and ERD output in future versions.

## Planned API

```python
from report_generator import ReportGenerator

gen = ReportGenerator(schema_data)
markdown = gen.to_markdown()
html = gen.to_html()      # v0.2
erd = gen.to_mermaid()    # v0.2
```
