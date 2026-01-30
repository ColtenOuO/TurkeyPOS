import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from app.models.order import Order, OrderItem, OrderItemOption
from app.models.product import Product, ProductOption
from app.schemas.order import OrderCreate
from fastapi import HTTPException

def create_order(db: Session, order_in: OrderCreate):
    total_price = 0.0
    db_order = Order(
        id=uuid.uuid4(),
        table_number=order_in.table_number,
        total_price=0.0,
        status="pending",
        created_at=datetime.utcnow() + timedelta(hours=8)
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

def get_active_orders(db: Session):
    """
    列出目前尚未完成的訂單 (status == 'pending')
    """
    return db.query(Order)\
        .filter(Order.status == "pending")\
        .options(joinedload(Order.items))\
        .order_by(Order.created_at.asc())\
        .all()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    """
    列出資料庫中所有的訂單 (包含已完成的)
    """
    return db.query(Order)\
        .options(joinedload(Order.items))\
        .order_by(Order.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

def update_order_status(db: Session, order_id: uuid.UUID, status: str):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    order.status = status
    db.commit()
    db.refresh(order)
    return order

def delete_order(db: Session, order_id: uuid.UUID):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    db.delete(order)
    db.commit()
    return order
