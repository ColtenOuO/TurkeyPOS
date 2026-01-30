import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdateStatus
from typing import List
from app.crud import order as crud_order

router = APIRouter()

@router.post("/", response_model=OrderResponse)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """
    建立訂單
    """
    return crud_order.create_order(db, order_in)

@router.get("/", response_model=List[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db), 
    skip: int = 0, 
    limit: int = 100
):
    """
    列出資料庫中所有的訂單 (包含已完成的)
    """
    return crud_order.get_orders(db, skip=skip, limit=limit)

@router.get("/active", response_model=List[OrderResponse])
def get_active_orders(db: Session = Depends(get_db)):
    """
    出狀態為 'pending' (待處理) 的訂單
    """
    return crud_order.get_active_orders(db)

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: uuid.UUID, 
    status_update: OrderUpdateStatus, 
    db: Session = Depends(get_db)
):
    """
    更新訂單狀態
    """
    order = crud_order.update_order_status(db, order_id, status_update.status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.delete("/{order_id}", response_model=OrderResponse)
def delete_order(order_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    刪除訂單
    """
    order = crud_order.delete_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order