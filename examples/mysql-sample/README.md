# WowDB Demo Dataset — Credit Management

A fictitious credit management schema designed to showcase WowDB's exploration features.

## Database: `creditdb`

| Table | Rows (seed) | Description |
|---|---|---|
| `status_contrato` | 5 | Contract status lookup |
| `produtos_credito` | 5 | Credit product catalog |
| `clientes` | 20 | Customer records |
| `contratos` | 20 | Credit contracts |
| `parcelas` | 20 | Installments |
| `pagamentos` | 13 | Payment records |

## Connection (demo)

```
Host:     localhost (or mysql-demo inside Docker)
Port:     3306
Database: creditdb
User:     demo_user
Password: demo_pass123
```

## Read-only user (recommended)

```
User:     wowdb_reader
Password: readonly_pass123
```

## Important

> ⚠️ All data is **100% fictitious**. No real names, CPFs, emails or any real personal data is present.
