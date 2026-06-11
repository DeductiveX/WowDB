from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SavedQueryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    query_text: str = Field(..., min_length=1, max_length=20000)
    tags: Optional[str] = None
    connection_id: Optional[int] = None
    database: Optional[str] = None


class SavedQueryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None
    query_text: Optional[str] = Field(default=None, min_length=1, max_length=20000)
    tags: Optional[str] = None
    connection_id: Optional[int] = None
    database: Optional[str] = None


class SavedQueryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    query_text: str
    tags: Optional[str]
    connection_id: Optional[int]
    database: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
