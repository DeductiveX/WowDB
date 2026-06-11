from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


# ── Webhooks ────────────────────────────────────────────────────────────

class WebhookCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    url: str = Field(..., min_length=1, max_length=500)
    events: str = "*"
    secret: Optional[str] = None


class WebhookUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    url: Optional[str] = Field(default=None, min_length=1, max_length=500)
    events: Optional[str] = None
    secret: Optional[str] = None
    is_active: Optional[bool] = None


class WebhookResponse(BaseModel):
    id: int
    name: str
    url: str
    events: str
    is_active: bool
    created_at: datetime
    # secret intentionally not returned
    model_config = {"from_attributes": True}


class WebhookDeliveryResponse(BaseModel):
    id: int
    webhook_id: int
    event: str
    status_code: Optional[int]
    error: Optional[str]
    delivered_at: datetime
    model_config = {"from_attributes": True}


# ── Scheduled Tasks ─────────────────────────────────────────────────────

TaskType = Literal["query", "snapshot", "quality"]


class ScheduledTaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    task_type: TaskType = "query"
    cron: str = Field(..., min_length=1, max_length=120)
    connection_id: Optional[int] = None
    database: Optional[str] = None
    query_text: Optional[str] = None
    monitor_id: Optional[int] = None


class ScheduledTaskUpdate(BaseModel):
    name: Optional[str] = None
    cron: Optional[str] = None
    is_active: Optional[bool] = None
    query_text: Optional[str] = None


class ScheduledTaskResponse(BaseModel):
    id: int
    name: str
    task_type: str
    cron: str
    connection_id: Optional[int]
    database: Optional[str]
    query_text: Optional[str]
    monitor_id: Optional[int]
    is_active: bool
    last_run_at: Optional[datetime]
    last_status: Optional[str]
    last_error: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Schema Snapshots ────────────────────────────────────────────────────

class SnapshotCreate(BaseModel):
    connection_id: int
    database: str


class SnapshotResponse(BaseModel):
    id: int
    connection_id: int
    database: str
    table_count: int
    column_count: int
    captured_at: datetime
    model_config = {"from_attributes": True}


class SnapshotDiff(BaseModel):
    tables_added: list[str]
    tables_removed: list[str]
    columns_added: list[dict]  # [{table, column, type}]
    columns_removed: list[dict]
    columns_changed: list[dict]


# ── Quality Monitors ────────────────────────────────────────────────────

AssertionType = Literal[
    "count_gt", "count_eq", "count_lt",
    "no_nulls", "value_min", "value_max",
]


class QualityMonitorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    connection_id: int
    database: str = Field(..., min_length=1, max_length=120)
    query_text: str = Field(..., min_length=1, max_length=10000)
    assertion: AssertionType
    threshold: Optional[str] = None


class QualityMonitorResponse(BaseModel):
    id: int
    name: str
    connection_id: int
    database: str
    query_text: str
    assertion: str
    threshold: Optional[str]
    is_active: bool
    last_check_at: Optional[datetime]
    last_passed: Optional[bool]
    last_value: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class QualityCheckResult(BaseModel):
    passed: bool
    value: str
    expected: str
    message: str
