
import uuid
from sqlalchemy.orm import Session
from app.models.store import Store
from app.models.order import Order
from app.schemas.store import StoreCreate, StoreUpdate
from app.core.security import get_password_hash

def get_store(db: Session, store_id: uuid.UUID):
    return db.query(Store).filter(Store.id == store_id).first()

def get_store_by_name(db: Session, name: str):
    return db.query(Store).filter(Store.name == name).first()

def get_stores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Store).all()

def create_store(db: Session, store_in: StoreCreate):
    db_store = Store(
        name=store_in.name,
        password_hash=get_password_hash(store_in.password),
        is_active=True
    )
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

def update_store(db: Session, db_obj: Store, obj_in: StoreUpdate):
    update_data = obj_in.dict(exclude_unset=True)
    if update_data.get("password"):
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["password_hash"] = hashed_password
        
    for field in update_data:
        setattr(db_obj, field, update_data[field])
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_store(db: Session, store_id: uuid.UUID):
    """
    Delete a store. 
    Handles Foreign Key constraints by setting related orders' store_id to NULL.
    """
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        return None
        
    # Set store_id to NULL for related orders to avoid FK violation
    # This keeps the order history but disassociates it from the deleted store
    db.query(Order).filter(Order.store_id == store_id).update({Order.store_id: None})
    
    db.delete(store)
    db.commit()
    return store

def reset_password(db: Session, store_id: uuid.UUID, new_password: str):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        return None
        
    store.password_hash = get_password_hash(new_password)
    db.commit()
    db.refresh(store)
    return store
