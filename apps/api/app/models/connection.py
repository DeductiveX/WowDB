from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from app.database import Base


class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    # db_type: mysql | postgres | sqlite
    db_type = Column(String(20), nullable=False, default="mysql")
    host = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    # For SQLite connections: path to the .db file
    db_path = Column(String(500), nullable=True)
    database = Column(String(120), nullable=True)
    user = Column(String(120), nullable=True)
    # Password is NEVER stored
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    key_hash = Column(String(64), nullable=False, unique=True, index=True)
    key_prefix = Column(String(8), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, nullable=False, index=True)
    # Only stores the query text, never query results or sensitive data
    query_text = Column(Text, nullable=False)
    was_blocked = Column(Boolean, default=False, nullable=False)
    block_reason = Column(String(255), nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
