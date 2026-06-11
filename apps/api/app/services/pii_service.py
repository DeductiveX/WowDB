"""Heuristic PII detection from schema metadata (no actual data sampled)."""

from app.models.connection import Connection
from app.services import db_service

# (regex-ish word, kind, base_confidence)
_PATTERNS: list[tuple[str, str, float]] = [
    ("cpf", "cpf", 0.95),
    ("cnpj", "cnpj", 0.95),
    ("rg ", "rg", 0.7),
    ("_rg", "rg", 0.85),
    ("cnh", "cnh", 0.85),
    ("passport", "passport", 0.85),
    ("passaporte", "passport", 0.85),
    ("email", "email", 0.9),
    ("e_mail", "email", 0.9),
    ("phone", "phone", 0.85),
    ("telefone", "phone", 0.9),
    ("celular", "phone", 0.9),
    ("mobile", "phone", 0.8),
    ("password", "password", 0.95),
    ("senha", "password", 0.95),
    ("token", "secret", 0.7),
    ("api_key", "secret", 0.9),
    ("apikey", "secret", 0.9),
    ("secret", "secret", 0.8),
    ("name", "name", 0.5),
    ("nome", "name", 0.7),
    ("fullname", "name", 0.85),
    ("first_name", "name", 0.85),
    ("last_name", "name", 0.85),
    ("birth", "birthdate", 0.85),
    ("nascimento", "birthdate", 0.9),
    ("dob", "birthdate", 0.85),
    ("address", "address", 0.85),
    ("endereco", "address", 0.9),
    ("endereço", "address", 0.9),
    ("cep", "postal_code", 0.9),
    ("zip", "postal_code", 0.7),
    ("postcode", "postal_code", 0.85),
    ("card", "card", 0.7),
    ("cartao", "card", 0.85),
    ("cartão", "card", 0.85),
    ("credit_card", "card", 0.95),
    ("iban", "bank", 0.95),
    ("account_number", "bank", 0.85),
    ("conta_bancaria", "bank", 0.9),
    ("ssn", "ssn", 0.95),
    ("salary", "salary", 0.8),
    ("salario", "salary", 0.85),
    ("ip_address", "ip", 0.85),
    ("user_agent", "user_agent", 0.7),
]


def scan(conn: Connection, password: str | None, database: str) -> list[dict]:
    """Returns a list of {table, column, kind, confidence} for likely PII."""
    tables = db_service.list_tables(conn, password, database)
    findings: list[dict] = []
    for t in tables:
        tname = t.get("TABLE_NAME")
        if not tname:
            continue
        detail = db_service.describe_table(conn, password, database, tname)
        for col in detail.get("columns", []):
            cname = col.get("COLUMN_NAME", "")
            ctype = (col.get("COLUMN_TYPE") or col.get("DATA_TYPE") or "").lower()
            haystack = cname.lower()
            for pattern, kind, base_conf in _PATTERNS:
                if pattern in haystack:
                    confidence = base_conf
                    # bump for short int that doesn't fit kind
                    if kind in {"email", "address", "name"} and ("int" in ctype or "decimal" in ctype):
                        confidence -= 0.3
                    if confidence < 0.4:
                        continue
                    findings.append({
                        "table": tname,
                        "column": cname,
                        "kind": kind,
                        "confidence": round(confidence, 2),
                        "type": col.get("COLUMN_TYPE") or col.get("DATA_TYPE") or "",
                    })
                    break
    return findings
