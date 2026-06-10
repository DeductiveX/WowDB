"""Optional API key authentication dependency.

When API_KEY_REQUIRED=true in env, all /api/* routes require X-API-Key header.
Default is false so the existing frontend and dev workflow are not broken.
"""

from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.services import api_key_service


def require_api_key(
    x_api_key: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> None:
    settings = get_settings()
    if not settings.api_key_required:
        return
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    if not api_key_service.validate_api_key(db, x_api_key):
        raise HTTPException(status_code=403, detail="Invalid or revoked API key")
