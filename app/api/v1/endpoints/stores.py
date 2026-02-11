
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.store import Store as StoreSchema, StoreCreate, StoreUpdate
from app.crud import store as crud_store

router = APIRouter()

@router.get("/", response_model=List[StoreSchema])
def get_stores(db: Session = Depends(get_db)):
    """
    Get all stores (Public for login check)
    """
    return crud_store.get_stores(db)

@router.post("/", response_model=StoreSchema)
def create_store(store_in: StoreCreate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    Create a new store (Admin only)
    """
    existing_store = crud_store.get_store_by_name(db, name=store_in.name)
    if existing_store:
        raise HTTPException(status_code=400, detail="Store with this name already exists")
    
    return crud_store.create_store(db, store_in=store_in)

@router.delete("/{store_id}")
def delete_store(store_id: str, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    Delete a store (Admin only)
    """
    try:
         store_uuid = uuid.UUID(store_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid UUID")

    store = crud_store.delete_store(db, store_id=store_uuid)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {"message": "Store deleted"}

@router.put("/{store_id}/reset-password")
def reset_store_password(store_id: str, payload: dict, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    Reset store password (Admin only)
    Payload: {"password": "new_password"}
    """
    new_password = payload.get("password")
    if not new_password:
        raise HTTPException(status_code=400, detail="Password is required")

    try:
         store_uuid = uuid.UUID(store_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid UUID")

    store = crud_store.reset_password(db, store_id=store_uuid, new_password=new_password)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    return {"message": "Password updated successfully"}
