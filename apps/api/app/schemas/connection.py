from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator

DBType = Literal["mysql", "postgres", "sqlite", "duckdb"]


def _validate_db_fields(values: "ConnectionTestRequest | ConnectionCreateRequest"):
    if values.db_type in ("sqlite", "duckdb"):
        if not values.db_path:
            raise ValueError(f"db_path is required for {values.db_type} connections")
    else:
        missing = [k for k, v in (("host", values.host), ("user", values.user), ("password", values.password)) if not v]
        if missing:
            raise ValueError(f"{', '.join(missing)} required for {values.db_type} connections")
    return values


class ConnectionTestRequest(BaseModel):
    db_type: DBType = "mysql"
    host: Optional[str] = Field(default=None, max_length=255)
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    db_path: Optional[str] = Field(default=None, max_length=500)
    database: Optional[str] = Field(default=None, max_length=120)
    user: Optional[str] = Field(default=None, max_length=120)
    password: Optional[str] = None

    @model_validator(mode="after")
    def _validate(self):
        return _validate_db_fields(self)


class ConnectionCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    db_type: DBType = "mysql"
    host: Optional[str] = Field(default=None, max_length=255)
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    db_path: Optional[str] = Field(default=None, max_length=500)
    database: Optional[str] = Field(default=None, max_length=120)
    user: Optional[str] = Field(default=None, max_length=120)
    password: Optional[str] = None

    @model_validator(mode="after")
    def _validate(self):
        return _validate_db_fields(self)


class ConnectionResponse(BaseModel):
    id: int
    name: str
    db_type: str
    host: Optional[str]
    port: Optional[int]
    db_path: Optional[str]
    database: Optional[str]
    user: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConnectionTestResult(BaseModel):
    success: bool
    message: str
    latency_ms: Optional[float] = None


class SessionCreateResult(BaseModel):
    connection_id: int
    name: str
    db_type: str
    host: Optional[str]
    port: Optional[int]
    db_path: Optional[str]
    database: Optional[str]
    user: Optional[str]
    message: str


class QueryRequest(BaseModel):
    connection_id: int
    query: str = Field(..., min_length=1, max_length=10000)
    database: Optional[str] = None


class QueryResult(BaseModel):
    success: bool
    blocked: bool
    reason: Optional[str] = None
    columns: list[str] = []
    rows: list[dict] = []
    count: int = 0
    elapsed_ms: float = 0
    normalized_query: Optional[str] = None


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class ApiKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreated(BaseModel):
    id: int
    name: str
    key: str
    key_prefix: str
    message: str
