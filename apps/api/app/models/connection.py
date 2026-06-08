from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from app.database import Base


class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False, default=3306)
    database = Column(String(120), nullable=True)
    user = Column(String(120), nullable=False)
    # Password is NEVER stored
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, nullable=False, index=True)
    # Only stores the query text, never query results or sensitive data
    query_text = Column(Text, nullable=False)
    was_blocked = Column(Boolean, default=False, nullable=False)
    block_reason = Column(String(255), nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
