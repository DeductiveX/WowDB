"""API key management — generation, validation, storage."""

import hashlib
import secrets
from sqlalchemy.orm import Session
from app.models.connection import ApiKey


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def generate_key() -> tuple[str, str, str]:
    """Returns (full_key, prefix, key_hash)."""
    raw = secrets.token_urlsafe(32)
    full_key = f"wdb_{raw}"
    prefix = full_key[:8]
    key_hash = _hash_key(full_key)
    return full_key, prefix, key_hash


def create_api_key(db: Session, name: str) -> tuple[ApiKey, str]:
    full_key, prefix, key_hash = generate_key()
    api_key = ApiKey(name=name, key_hash=key_hash, key_prefix=prefix)
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key, full_key


def validate_api_key(db: Session, key: str) -> bool:
    if not key:
        return False
    key_hash = _hash_key(key)
    record = db.query(ApiKey).filter(ApiKey.key_hash == key_hash, ApiKey.is_active == True).first()
    return record is not None


def list_api_keys(db: Session) -> list[ApiKey]:
    return db.query(ApiKey).filter(ApiKey.is_active == True).order_by(ApiKey.created_at.desc()).all()


def delete_api_key(db: Session, key_id: int) -> bool:
    record = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.is_active == True).first()
    if not record:
        return False
    record.is_active = False
    db.commit()
    return True
