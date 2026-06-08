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


# Regression tests: column names that contain blocked keyword substrings
def test_created_at_allowed():
    result = check_query("SELECT created_at FROM users")
    assert result.allowed, f"Blocked unexpectedly: {result.reason}"


def test_updated_at_allowed():
    result = check_query("SELECT updated_at FROM orders")
    assert result.allowed, f"Blocked unexpectedly: {result.reason}"


def test_deleted_at_allowed():
    result = check_query("SELECT deleted_at FROM posts")
    assert result.allowed, f"Blocked unexpectedly: {result.reason}"


def test_replace_function_allowed():
    result = check_query("SELECT REPLACE(nome, ' ', '_') FROM clientes")
    assert result.allowed, f"Blocked unexpectedly: {result.reason}"


def test_executive_column_allowed():
    result = check_query("SELECT executive_id FROM org")
    assert result.allowed, f"Blocked unexpectedly: {result.reason}"


def test_grant_date_column_allowed():
    result = check_query("SELECT grant_date FROM loans")
    assert result.allowed, f"Blocked unexpectedly: {result.reason}"


def test_clock_in_column_allowed():
    result = check_query("SELECT clock_in FROM attendance")
    assert result.allowed, f"Blocked unexpectedly: {result.reason}"
