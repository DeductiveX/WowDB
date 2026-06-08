"""
Query Guard — enforces read-only SQL at the AST level using sqlglot.

Defense-in-depth: this guard does NOT replace a read-only DB user.
Always use a MySQL user with SELECT-only grants in production.
"""

from dataclasses import dataclass
import sqlglot
from sqlglot import exp

ALLOWED_STATEMENT_TYPES = (
    exp.Select,
    exp.Show,
    exp.Describe,
    exp.Command,  # covers EXPLAIN in some dialects
)

BLOCKED_STATEMENT_TYPES = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Drop,
    exp.AlterTable,   # sqlglot 23+: was exp.Alter
    exp.Create,
    exp.Use,
    exp.Transaction,
    exp.Commit,
    exp.Rollback,
    exp.Merge,
    exp.TruncateTable,  # sqlglot 23+: was exp.Truncate
    exp.Set,
    exp.Lock,
)

BLOCKED_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
    "CREATE", "REPLACE", "GRANT", "REVOKE", "CALL", "EXEC",
    "EXECUTE", "LOAD", "MERGE", "LOCK", "UNLOCK",
    "SET GLOBAL", "SET SESSION", "SHUTDOWN", "KILL",
]


@dataclass
class GuardResult:
    allowed: bool
    reason: str
    normalized_query: str


def check_query(sql: str, default_limit: int = 100) -> GuardResult:
    if not sql or not sql.strip():
        return GuardResult(allowed=False, reason="Empty query.", normalized_query=sql)

    raw = sql.strip()

    # Block multiple statements (semicolon check before parsing)
    # sqlglot.parse returns one AST per statement
    try:
        statements = sqlglot.parse(raw, dialect="mysql")
    except Exception as e:
        return GuardResult(allowed=False, reason=f"SQL parse error: {e}", normalized_query=raw)

    if len(statements) > 1:
        return GuardResult(
            allowed=False,
            reason="Multiple statements are not allowed. Send one query at a time.",
            normalized_query=raw,
        )

    if not statements or statements[0] is None:
        return GuardResult(allowed=False, reason="Could not parse SQL.", normalized_query=raw)

    stmt = statements[0]

    # Hard keyword block (catches obfuscation attempts)
    upper = raw.upper()
    for kw in BLOCKED_KEYWORDS:
        if kw in upper:
            return GuardResult(
                allowed=False,
                reason=f"Statement contains blocked keyword '{kw}'. Only SELECT, SHOW, DESCRIBE and EXPLAIN are allowed.",
                normalized_query=raw,
            )

    # AST-level check
    if isinstance(stmt, BLOCKED_STATEMENT_TYPES):
        kind = type(stmt).__name__.upper()
        return GuardResult(
            allowed=False,
            reason=f"{kind} statements are not allowed. WowDB operates in read-only mode.",
            normalized_query=raw,
        )

    if not isinstance(stmt, ALLOWED_STATEMENT_TYPES):
        kind = type(stmt).__name__.upper()
        return GuardResult(
            allowed=False,
            reason=f"Statement type '{kind}' is not allowed. Only SELECT, SHOW, DESCRIBE and EXPLAIN are permitted.",
            normalized_query=raw,
        )

    # Auto-apply LIMIT to SELECT without one
    normalized = raw
    if isinstance(stmt, exp.Select):
        normalized = _apply_limit_if_missing(stmt, raw, default_limit)

    return GuardResult(allowed=True, reason="OK", normalized_query=normalized)


def _apply_limit_if_missing(stmt: exp.Select, raw: str, limit: int) -> str:
    if stmt.args.get("limit") is None:
        stmt.set("limit", exp.Limit(this=exp.Literal.number(limit)))
        return stmt.sql(dialect="mysql")
    return raw
