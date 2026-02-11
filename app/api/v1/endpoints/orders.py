import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdateStatus
from typing import List
from app.crud import order as crud_order

router = APIRouter()

from app.models.store import Store
from app.api.deps import get_current_store, oauth2_scheme
from app.core.security import ALGORITHM, SECRET_KEY
from jose import jwt, JWTError
from typing import Optional
from fastapi import Query

def get_current_actor(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/", response_model=OrderResponse)
def create_order(
    order_in: OrderCreate, 
    db: Session = Depends(get_db),
    current_store: Store = Depends(get_current_store)
):
    """
    建立訂單 (需 Store 權限)
    """
    return crud_order.create_order(db, order_in, store_id=current_store.id)

@router.get("/", response_model=List[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db), 
    skip: int = 0, 
    limit: int = 100,
    store_id: Optional[uuid.UUID] = Query(None),
    payload: dict = Depends(get_current_actor)
):
    """
    列出訂單
    - Admin: 可看所有 (或用 store_id 過濾)
    - Store: 只能看自己的
    """
    role = payload.get("role", "admin")
    
    if role == "store":
        # Force filter by own store_id
        current_store_id = uuid.UUID(payload.get("sub"))
        return crud_order.get_orders(db, skip=skip, limit=limit, store_id=current_store_id)
    
    # Admin
    return crud_order.get_orders(db, skip=skip, limit=limit, store_id=store_id)

@router.get("/active", response_model=List[OrderResponse])
def get_active_orders(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor)
):
    """
    列出進行中訂單 (Kitchen View)
    - Admin: 可看所有
    - Store: 只能看自己的
    """
    role = payload.get("role", "admin")
    
    fil_store_id = None
    if role == "store":
        fil_store_id = uuid.UUID(payload.get("sub"))
        
    return crud_order.get_active_orders(db, store_id=fil_store_id)

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: uuid.UUID, 
    status_update: OrderUpdateStatus, 
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor)
):
    """
    更新訂單狀態 (Admin or Store)
    """
    return crud_order.update_order_status(db, order_id, status_update.status)

@router.delete("/{order_id}", response_model=OrderResponse)
def delete_order(
    order_id: uuid.UUID, 
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor)
):
    """
    刪除訂單
    """
    return crud_order.delete_order(db, order_id)