import pytest
from app.services.query_guard import check_query
from app.services.erd_service import _infer_edges


# ── Query Guard ────────────────────────────────────────────────────────

def test_select_allowed():
    assert check_query("SELECT * FROM t").allowed

def test_drop_blocked():
    assert not check_query("DROP TABLE t").allowed

def test_delete_blocked():
    assert not check_query("DELETE FROM t WHERE 1=1").allowed

def test_auto_limit():
    result = check_query("SELECT * FROM t")
    assert "LIMIT" in result.normalized_query.upper()


# ── ERD inference ──────────────────────────────────────────────────────

NODES = [
    {
        "id": "contratos",
        "columns": [
            {"name": "id", "key": "PRI"},
            {"name": "cliente_id", "key": "MUL"},
            {"name": "produto_id", "key": "MUL"},
        ],
    },
    {"id": "clientes", "columns": [{"name": "id", "key": "PRI"}]},
    {"id": "produtos_credito", "columns": [{"name": "id", "key": "PRI"}]},
    {"id": "parcelas", "columns": [
        {"name": "id", "key": "PRI"},
        {"name": "contrato_id", "key": "MUL"},
    ]},
]

TABLE_SET = {"contratos", "clientes", "produtos_credito", "parcelas"}


def test_infers_cliente_id():
    edges = _infer_edges(NODES, TABLE_SET, [])
    targets = {e["target"] for e in edges}
    assert "clientes" in targets


def test_infers_contrato_id():
    edges = _infer_edges(NODES, TABLE_SET, [])
    targets = {e["target"] for e in edges}
    assert "contratos" in targets


def test_no_self_reference():
    edges = _infer_edges(NODES, TABLE_SET, [])
    for e in edges:
        assert e["source"] != e["target"]


def test_skips_explicit_fks():
    explicit = [{"source": "contratos", "source_handle": "cliente_id", "target": "clientes", "target_handle": "id", "id": "fk_1", "kind": "fk"}]
    edges = _infer_edges(NODES, TABLE_SET, explicit)
    # contratos.cliente_id should NOT appear again in inferred edges
    inferred_pairs = {(e["source"], e["source_handle"]) for e in edges}
    assert ("contratos", "cliente_id") not in inferred_pairs


def test_no_duplicate_edges():
    edges = _infer_edges(NODES, TABLE_SET, [])
    ids = [e["id"] for e in edges]
    assert len(ids) == len(set(ids))
