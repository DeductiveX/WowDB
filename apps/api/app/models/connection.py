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


class SavedQuery(Base):
    __tablename__ = "saved_queries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    description = Column(Text, nullable=True)
    query_text = Column(Text, nullable=False)
    tags = Column(String(255), nullable=True)  # comma-separated
    connection_id = Column(Integer, nullable=True, index=True)
    database = Column(String(120), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    url = Column(String(500), nullable=False)
    # Comma-separated event types: schema.drift, query.completed, quality.failed, scheduled.failed, scheduled.success
    events = Column(String(500), nullable=False, default="*")
    secret = Column(String(120), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    webhook_id = Column(Integer, nullable=False, index=True)
    event = Column(String(120), nullable=False)
    payload = Column(Text, nullable=False)
    status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    delivered_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    # task type: query | snapshot | quality
    task_type = Column(String(20), nullable=False, default="query")
    cron = Column(String(120), nullable=False)
    connection_id = Column(Integer, nullable=True, index=True)
    database = Column(String(120), nullable=True)
    query_text = Column(Text, nullable=True)
    # For quality: stored monitor_id; for snapshot: None
    monitor_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    last_status = Column(String(20), nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SchemaSnapshot(Base):
    __tablename__ = "schema_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, nullable=False, index=True)
    database = Column(String(120), nullable=False, index=True)
    snapshot_json = Column(Text, nullable=False)
    table_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    captured_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class QualityMonitor(Base):
    __tablename__ = "quality_monitors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    connection_id = Column(Integer, nullable=False, index=True)
    database = Column(String(120), nullable=False)
    query_text = Column(Text, nullable=False)
    # assertion: count_gt | count_eq | count_lt | no_nulls | value_min | value_max
    assertion = Column(String(40), nullable=False)
    threshold = Column(String(120), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_check_at = Column(DateTime, nullable=True)
    last_passed = Column(Boolean, nullable=True)
    last_value = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
