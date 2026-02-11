from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from datetime import datetime, timedelta, date
from app.models.order import Order, OrderItem

import uuid

def get_daily_sales_trend(db: Session, days: int = 30, store_id: uuid.UUID = None):
    """
    Get completed sales count/revenue grouped by date for the last N days.
    """
    start_date = datetime.now().date() - timedelta(days=days)
    query = db.query(
        func.date(Order.created_at).label('date'),
        func.sum(Order.total_price).label('revenue'),
        func.count(Order.id).label('count')
    ).filter(Order.status == "completed")\
     .filter(func.date(Order.created_at) >= start_date)
     
    if store_id:
        query = query.filter(Order.store_id == store_id)
        
    results = query.group_by(func.date(Order.created_at))\
     .order_by(func.date(Order.created_at))\
     .all()
     
    return [{"date": str(r.date), "revenue": r.revenue, "count": r.count} for r in results]

def get_total_revenue(db: Session, store_id: uuid.UUID = None):
    query = db.query(func.sum(Order.total_price)).filter(Order.status == "completed")
    if store_id:
        query = query.filter(Order.store_id == store_id)
    return query.scalar() or 0.0

def get_total_orders(db: Session, store_id: uuid.UUID = None): # Not used in API currently?
    query = db.query(func.count(Order.id)).filter(Order.status == "completed")
    if store_id:
        query = query.filter(Order.store_id == store_id)
    return query.scalar() or 0

def get_daily_revenue(db: Session, store_id: uuid.UUID = None):
    today = datetime.now().date() 
    query = db.query(func.sum(Order.total_price))\
        .filter(Order.status == "completed")\
        .filter(func.date(Order.created_at) == today)
    
    if store_id:
        query = query.filter(Order.store_id == store_id)
        
    return query.scalar() or 0.0

def get_daily_order_count(db: Session, store_id: uuid.UUID = None):
    today = datetime.now().date()
    query = db.query(func.count(Order.id))\
        .filter(Order.status == "completed")\
        .filter(func.date(Order.created_at) == today)
        
    if store_id:
        query = query.filter(Order.store_id == store_id)
        
    return query.scalar() or 0

def get_hourly_sales(db: Session, store_id: uuid.UUID = None):
    """
    Get completed sales count/revenue grouped by hour for today.
    """
    today = datetime.now().date()
    query = db.query(
        func.extract('hour', Order.created_at).label('hour'),
        func.sum(Order.total_price).label('revenue'),
        func.count(Order.id).label('count')
    ).filter(Order.status == "completed")\
     .filter(func.date(Order.created_at) == today)
     
    if store_id:
        query = query.filter(Order.store_id == store_id)

    results = query.group_by(func.extract('hour', Order.created_at))\
     .order_by(func.extract('hour', Order.created_at))\
     .all()
     
    return [{"hour": int(r.hour), "revenue": r.revenue, "count": r.count} for r in results]

def get_top_products(db: Session, limit: int = 5, store_id: uuid.UUID = None):
    """
    Get top selling products by quantity.
    """
    query = db.query(
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label('total_quantity'),
        func.sum(OrderItem.quantity * OrderItem.unit_price).label('total_revenue')
    ).join(Order, Order.id == OrderItem.order_id)\
     .filter(Order.status == "completed")
     
    if store_id:
        query = query.filter(Order.store_id == store_id)

    results = query.group_by(OrderItem.product_name)\
     .order_by(desc('total_quantity'))\
     .limit(limit)\
     .all()
     

    return [
        {
            "name": r.product_name,
            "quantity": int(r.total_quantity or 0),
            "revenue": float(r.total_revenue or 0)
        }
        for r in results
    ]

def get_stores_overview(db: Session, start_date: date = None, end_date: date = None):
    """
    Get overview of all stores (active/inactive) with their sales stats in the period.
    """
    from app.models.store import Store
    from sqlalchemy import and_
    
    # Base conditions for the join
    join_conditions = [Store.id == Order.store_id, Order.status == "completed"]
    
    if start_date:
        join_conditions.append(func.date(Order.created_at) >= start_date)
    if end_date:
        join_conditions.append(func.date(Order.created_at) <= end_date)
        
    query = db.query(
        Store.id,
        Store.name,
        Store.is_active,
        func.count(Order.id).label('total_orders'),
        func.sum(Order.total_price).label('total_revenue')
    ).outerjoin(Order, and_(*join_conditions))\
     .group_by(Store.id, Store.name, Store.is_active)\
     .order_by(Store.name)
     
    results = query.all()
    
    return [
        {
            "store_id": r.id,
            "store_name": r.name,
            "is_active": r.is_active,
            "total_orders": r.total_orders or 0,
            "total_sales": float(r.total_revenue or 0)
        }
        for r in results
    ]

