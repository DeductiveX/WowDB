"""Saved queries CRUD service."""

from sqlalchemy.orm import Session
from app.models.connection import SavedQuery


def create(db: Session, **kwargs) -> SavedQuery:
    q = SavedQuery(**{k: v for k, v in kwargs.items() if v is not None})
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


def list_all(db: Session) -> list[SavedQuery]:
    return (
        db.query(SavedQuery)
        .filter(SavedQuery.is_active == True)
        .order_by(SavedQuery.updated_at.desc())
        .all()
    )


def get(db: Session, query_id: int) -> SavedQuery | None:
    return db.query(SavedQuery).filter(SavedQuery.id == query_id, SavedQuery.is_active == True).first()


def update(db: Session, query_id: int, **kwargs) -> SavedQuery | None:
    q = get(db, query_id)
    if not q:
        return None
    for k, v in kwargs.items():
        if v is not None:
            setattr(q, k, v)
    db.commit()
    db.refresh(q)
    return q


def delete(db: Session, query_id: int) -> bool:
    q = get(db, query_id)
    if not q:
        return False
    q.is_active = False
    db.commit()
    return True


def search(db: Session, q: str) -> list[SavedQuery]:
    """Simple LIKE search for global search."""
    pat = f"%{q}%"
    return (
        db.query(SavedQuery)
        .filter(SavedQuery.is_active == True)
        .filter(
            (SavedQuery.name.ilike(pat))
            | (SavedQuery.query_text.ilike(pat))
            | (SavedQuery.tags.ilike(pat))
        )
        .order_by(SavedQuery.updated_at.desc())
        .limit(20)
        .all()
    )
