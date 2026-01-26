# app/api/v1/endpoints/orders.py
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.order import Order, OrderItem, OrderItemOption
from app.models.product import Product, ProductOption
from app.schemas.order import OrderCreate, OrderResponse
from typing import List

router = APIRouter()

@router.post("/", response_model=OrderResponse)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    total_price = 0.0
    db_order = Order(
        id=uuid.uuid4(),
        table_number=order_in.table_number,
        total_price=0.0,
        status="pending"
    )
    db.add(db_order)

    for item in order_in.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        current_unit_price = product.base_price
        options_to_add = []
        
        for opt_id in item.option_ids:
            option = db.query(ProductOption).filter(ProductOption.id == opt_id).first()
            if option:
                current_unit_price += option.price_delta
                options_to_add.append(option)

        db_item = OrderItem(
            id=uuid.uuid4(),
            order_id=db_order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=current_unit_price
        )
        db.add(db_item)
        
        for opt in options_to_add:
            db.add(OrderItemOption(
                order_item_id=db_item.id,
                option_name=opt.name,
                price_delta=opt.price_delta
            ))
        
        total_price += current_unit_price * item.quantity

    db_order.total_price = total_price
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/active", response_model=List[OrderResponse])
def get_active_orders(db: Session = Depends(get_db)):
    """列出目前尚未完成的訂單"""
    return db.query(Order).filter(Order.status == "pending").all()

@router.get("/", response_model=List[OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db), 
    skip: int = 0, 
    limit: int = 100
):
    """
    列出資料庫中所有的訂單 (包含已完成的)
    """
    orders = db.query(Order)\
        .options(joinedload(Order.items))\
        .order_by(Order.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return orders

@router.get("/active", response_model=List[OrderResponse])
def get_active_orders(db: Session = Depends(get_db)):
    """
    出狀態為 'pending' (待處理) 的訂單
    """
    active_orders = db.query(Order)\
        .filter(Order.status == "pending")\
        .options(joinedload(Order.items))\
        .order_by(Order.created_at.asc())\
        .all()
    return active_orders