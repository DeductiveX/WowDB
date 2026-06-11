from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.saved_query import SavedQueryCreate, SavedQueryUpdate, SavedQueryResponse
from app.services import saved_query_service

router = APIRouter(prefix="/api/saved-queries", tags=["saved-queries"])


@router.post("", response_model=SavedQueryResponse)
def create_saved(req: SavedQueryCreate, db: Session = Depends(get_db)):
    return saved_query_service.create(db, **req.model_dump())


@router.get("", response_model=list[SavedQueryResponse])
def list_saved(db: Session = Depends(get_db)):
    return saved_query_service.list_all(db)


@router.get("/{query_id}", response_model=SavedQueryResponse)
def get_saved(query_id: int, db: Session = Depends(get_db)):
    q = saved_query_service.get(db, query_id)
    if not q:
        raise HTTPException(status_code=404, detail="Saved query not found")
    return q


@router.patch("/{query_id}", response_model=SavedQueryResponse)
def update_saved(query_id: int, req: SavedQueryUpdate, db: Session = Depends(get_db)):
    q = saved_query_service.update(db, query_id, **req.model_dump(exclude_unset=True))
    if not q:
        raise HTTPException(status_code=404, detail="Saved query not found")
    return q


@router.delete("/{query_id}")
def delete_saved(query_id: int, db: Session = Depends(get_db)):
    if not saved_query_service.delete(db, query_id):
        raise HTTPException(status_code=404, detail="Saved query not found")
    return {"message": "Saved query removed"}
