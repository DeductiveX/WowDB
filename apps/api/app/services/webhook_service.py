"""Webhook outbound dispatcher with HMAC signing and delivery log."""

import hashlib
import hmac
import json
import logging
from datetime import datetime
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.connection import Webhook, WebhookDelivery

log = logging.getLogger(__name__)


def _sign(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _matches(events_csv: str, event: str) -> bool:
    events = [e.strip() for e in events_csv.split(",")]
    if "*" in events:
        return True
    if event in events:
        return True
    # Prefix match e.g. "schema.*" matches "schema.drift"
    prefix = event.split(".")[0] + ".*"
    return prefix in events


def emit(event: str, payload: dict[str, Any]) -> None:
    """Fire-and-forget event dispatch to all matching active webhooks."""
    db: Session = SessionLocal()
    try:
        hooks = db.query(Webhook).filter(Webhook.is_active == True).all()
        for hook in hooks:
            if not _matches(hook.events, event):
                continue
            _deliver(db, hook, event, payload)
    finally:
        db.close()


def _deliver(db: Session, hook: Webhook, event: str, payload: dict) -> None:
    body = json.dumps({
        "event": event,
        "delivered_at": datetime.utcnow().isoformat(),
        "data": payload,
    }, default=str).encode()

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "WowDB-Webhook/0.3",
        "X-WowDB-Event": event,
    }
    if hook.secret:
        headers["X-WowDB-Signature"] = "sha256=" + _sign(hook.secret, body)

    status_code: int | None = None
    response_body: str | None = None
    error: str | None = None

    try:
        with httpx.Client(timeout=10) as client:
            r = client.post(hook.url, content=body, headers=headers)
            status_code = r.status_code
            response_body = r.text[:2000]
    except Exception as e:
        error = str(e)[:1000]

    delivery = WebhookDelivery(
        webhook_id=hook.id,
        event=event,
        payload=body.decode(errors="replace"),
        status_code=status_code,
        response_body=response_body,
        error=error,
    )
    db.add(delivery)
    db.commit()
