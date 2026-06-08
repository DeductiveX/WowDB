import pytest
from app.services.query_guard import check_query


def test_select_allowed():
    result = check_query("SELECT * FROM clientes")
    assert result.allowed


def test_select_gets_limit():
    result = check_query("SELECT * FROM clientes")
    assert "LIMIT" in result.normalized_query.upper()


def test_select_with_limit_unchanged():
    result = check_query("SELECT id FROM clientes LIMIT 10")
    assert result.allowed
    assert "LIMIT 10" in result.normalized_query


def test_show_allowed():
    result = check_query("SHOW DATABASES")
    assert result.allowed


def test_describe_allowed():
    result = check_query("DESCRIBE clientes")
    assert result.allowed


def test_insert_blocked():
    result = check_query("INSERT INTO clientes (nome) VALUES ('test')")
    assert not result.allowed


def test_update_blocked():
    result = check_query("UPDATE clientes SET nome = 'x' WHERE id = 1")
    assert not result.allowed


def test_delete_blocked():
    result = check_query("DELETE FROM clientes WHERE id = 1")
    assert not result.allowed


def test_drop_blocked():
    result = check_query("DROP TABLE clientes")
    assert not result.allowed


def test_alter_blocked():
    result = check_query("ALTER TABLE clientes ADD COLUMN x INT")
    assert not result.allowed


def test_truncate_blocked():
    result = check_query("TRUNCATE TABLE clientes")
    assert not result.allowed


def test_multiple_statements_blocked():
    result = check_query("SELECT 1; DROP TABLE clientes")
    assert not result.allowed


def test_empty_blocked():
    result = check_query("")
    assert not result.allowed
