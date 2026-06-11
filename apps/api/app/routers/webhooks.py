from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.connection import Webhook, WebhookDelivery
from app.schemas.automation import (
    WebhookCreate, WebhookUpdate, WebhookResponse, WebhookDeliveryResponse,
)
from app.services import webhook_service

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("", response_model=WebhookResponse)
def create_webhook(req: WebhookCreate, db: Session = Depends(get_db)):
    hook = Webhook(name=req.name, url=req.url, events=req.events, secret=req.secret)
    db.add(hook); db.commit(); db.refresh(hook)
    return hook


@router.get("", response_model=list[WebhookResponse])
def list_webhooks(db: Session = Depends(get_db)):
    return db.query(Webhook).filter(Webhook.is_active == True).order_by(Webhook.created_at.desc()).all()


@router.patch("/{hook_id}", response_model=WebhookResponse)
def update_webhook(hook_id: int, req: WebhookUpdate, db: Session = Depends(get_db)):
    hook = db.query(Webhook).filter(Webhook.id == hook_id).first()
    if not hook:
        raise HTTPException(404, "Not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(hook, k, v)
    db.commit(); db.refresh(hook)
    return hook


@router.delete("/{hook_id}")
def delete_webhook(hook_id: int, db: Session = Depends(get_db)):
    hook = db.query(Webhook).filter(Webhook.id == hook_id, Webhook.is_active == True).first()
    if not hook:
        raise HTTPException(404, "Not found")
    hook.is_active = False
    db.commit()
    return {"message": "deleted"}


@router.post("/{hook_id}/test")
def test_webhook(hook_id: int, db: Session = Depends(get_db)):
    hook = db.query(Webhook).filter(Webhook.id == hook_id, Webhook.is_active == True).first()
    if not hook:
        raise HTTPException(404, "Not found")
    webhook_service.emit("test.ping", {"webhook_id": hook.id, "name": hook.name})
    return {"message": "Sent"}


@router.get("/{hook_id}/deliveries", response_model=list[WebhookDeliveryResponse])
def list_deliveries(hook_id: int, db: Session = Depends(get_db)):
    return (
        db.query(WebhookDelivery)
        .filter(WebhookDelivery.webhook_id == hook_id)
        .order_by(WebhookDelivery.delivered_at.desc())
        .limit(50).all()
    )
