# WowDB Security Model

## Read-only Enforcement

WowDB enforces read-only access at multiple independent layers:

### Layer 1: Query Guard (AST)
- Every SQL input is parsed using `sqlglot` AST (not regex)
- Only `SELECT`, `SHOW`, `DESCRIBE`, and `EXPLAIN` are allowed
- Blocked statements: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `REPLACE`, `GRANT`, `REVOKE`, `CALL`, `EXEC`, `LOAD DATA`, `MERGE`, `LOCK`, `UNLOCK`, `SET GLOBAL`, `SET SESSION`
- Multiple statements (`;`) are rejected
- `SELECT` without `LIMIT` gets `LIMIT 100` auto-appended
- 10-second query timeout is enforced at the driver level

### Layer 2: MySQL User Privileges (Recommended)
The Query Guard is NOT a substitute for proper MySQL permissions.

**Always use a read-only MySQL user:**

```sql
CREATE USER 'wowdb_reader'@'%' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, SHOW VIEW ON your_database.* TO 'wowdb_reader'@'%';
FLUSH PRIVILEGES;
```

This provides database-level enforcement that cannot be bypassed regardless of what the application sends.

## Password Storage Policy

**WowDB v0.1 does NOT store passwords anywhere:**
- Not in SQLite
- Not in log files
- Not in environment variables
- Not in browser localStorage

Passwords flow as:
1. User enters password in browser
2. Password is held in `sessionStorage` (browser memory, cleared on tab close)
3. Password is sent per-request as the `X-DB-Password` HTTP header
4. Backend uses it for the MySQL connection and discards it
5. No password ever reaches SQLite or any persistent storage

## What IS Stored (SQLite)

Only connection metadata without credentials:
- Connection name
- Host
- Port
- Database name (optional)
- Username
- Timestamps

## Limitations of the Query Guard

The Query Guard is defense-in-depth, not a security boundary by itself:

1. It operates at the application layer and can theoretically be bypassed if the API is accessed directly
2. It relies on `sqlglot`'s MySQL dialect parser — edge cases may exist
3. It does not protect against read-based attacks (data exfiltration via SELECT)
4. It does not rate-limit queries

**This is why a read-only MySQL user is required for any sensitive use case.**

## Connecting to Production Databases

> ⚠️ **WowDB is NOT recommended for direct production database connections** without:
> 1. A dedicated read-only MySQL user with minimal permissions
> 2. Network-level access controls (VPN, firewall)
> 3. A security review of the WowDB deployment
> 4. TLS/SSL for the MySQL connection

**Recommended safer alternatives:**
- Connect to a sanitized development dump
- Connect to a staging/homologation environment
- Use a read replica with a read-only user
- Use a sanitized export of production data

## Sensitive Data Handling

- Query results are never logged
- Passwords are never logged
- No telemetry or analytics
- No external network calls from the backend

## Reporting Security Issues

Please report security vulnerabilities via GitHub Issues with the `security` label, or directly to the maintainers.
