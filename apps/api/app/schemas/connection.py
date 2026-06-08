from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ConnectionTestRequest(BaseModel):
    host: str = Field(..., min_length=1, max_length=255)
    port: int = Field(default=3306, ge=1, le=65535)
    database: Optional[str] = Field(default=None, max_length=120)
    user: str = Field(..., min_length=1, max_length=120)
    password: str = Field(..., min_length=1)


class ConnectionCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    host: str = Field(..., min_length=1, max_length=255)
    port: int = Field(default=3306, ge=1, le=65535)
    database: Optional[str] = Field(default=None, max_length=120)
    user: str = Field(..., min_length=1, max_length=120)
    password: str = Field(..., min_length=1)


class ConnectionResponse(BaseModel):
    id: int
    name: str
    host: str
    port: int
    database: Optional[str]
    user: str
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
    host: str
    port: int
    database: Optional[str]
    user: str
    message: str


class QueryRequest(BaseModel):
    connection_id: int
    query: str = Field(..., min_length=1, max_length=10000)
    database: Optional[str] = None
