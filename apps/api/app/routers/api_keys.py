from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.connection import ApiKeyCreate, ApiKeyResponse, ApiKeyCreated
from app.services import api_key_service

router = APIRouter(prefix="/api/keys", tags=["api-keys"])


@router.post("", response_model=ApiKeyCreated)
def create_key(req: ApiKeyCreate, db: Session = Depends(get_db)):
    record, full_key = api_key_service.create_api_key(db, req.name)
    return ApiKeyCreated(
        id=record.id,
        name=record.name,
        key=full_key,
        key_prefix=record.key_prefix,
        message="Save this key — it will not be shown again.",
    )


@router.get("", response_model=list[ApiKeyResponse])
def list_keys(db: Session = Depends(get_db)):
    return api_key_service.list_api_keys(db)


@router.delete("/{key_id}")
def delete_key(key_id: int, db: Session = Depends(get_db)):
    deleted = api_key_service.delete_api_key(db, key_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key revoked"}
