from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from datetime import datetime, timedelta
from app.models.order import Order, OrderItem

def get_daily_sales_trend(db: Session, days: int = 30):
    """
    Get completed sales count/revenue grouped by date for the last N days.
    """
    start_date = datetime.now().date() - timedelta(days=days)
    results = db.query(
        func.date(Order.created_at).label('date'),
        func.sum(Order.total_price).label('revenue'),
        func.count(Order.id).label('count')
    ).filter(Order.status == "completed")\
     .filter(func.date(Order.created_at) >= start_date)\
     .group_by(func.date(Order.created_at))\
     .order_by(func.date(Order.created_at))\
     .all()
     
    return [{"date": str(r.date), "revenue": r.revenue, "count": r.count} for r in results]

def get_total_revenue(db: Session):
    return db.query(func.sum(Order.total_price)).filter(Order.status == "completed").scalar() or 0.0

def get_total_orders(db: Session):
    return db.query(func.count(Order.id)).filter(Order.status == "completed").scalar() or 0

def get_daily_revenue(db: Session):
    # Get revenue for today (Taipei time is handled by checking truncated date if needed, 
    # but for simplicity we'll just sum all completed for now or use server time filter if strictly daily)
    # Since we are using UTC+8 for creation, we can filtering by date() should work if db server time aligns,
    # but to be safe we can just group by date.
    # For now, let's just get All Time stats + Today's stats specifically.
    
    # Assuming "today" is based on the created_at timestamp we manually shifted.
    today = datetime.now().date() 
    # Note: datetime.now() depends on system time. If system is CST, this works.
    
    return db.query(func.sum(Order.total_price))\
        .filter(Order.status == "completed")\
        .filter(func.date(Order.created_at) == today)\
        .scalar() or 0.0

def get_daily_order_count(db: Session):
    today = datetime.now().date()
    return db.query(func.count(Order.id))\
        .filter(Order.status == "completed")\
        .filter(func.date(Order.created_at) == today)\
        .scalar() or 0

def get_hourly_sales(db: Session):
    """
    Get completed sales count/revenue grouped by hour for today.
    """
    today = datetime.now().date()
    results = db.query(
        func.extract('hour', Order.created_at).label('hour'),
        func.sum(Order.total_price).label('revenue'),
        func.count(Order.id).label('count')
    ).filter(Order.status == "completed")\
     .filter(func.date(Order.created_at) == today)\
     .group_by(func.extract('hour', Order.created_at))\
     .order_by(func.extract('hour', Order.created_at))\
     .all()
     
    return [{"hour": int(r.hour), "revenue": r.revenue, "count": r.count} for r in results]

def get_top_products(db: Session, limit: int = 5):
    """
    Get top selling products by quantity.
    """
    results = db.query(
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label('total_quantity'),
        func.sum(OrderItem.quantity * OrderItem.unit_price).label('total_revenue')
    ).join(Order, Order.id == OrderItem.order_id)\
     .filter(Order.status == "completed")\
     .group_by(OrderItem.product_name)\
     .order_by(desc('total_quantity'))\
     .limit(limit)\
     .all()
     
    return [
        {
            "name": r.product_name,
            "quantity": r.total_quantity,
            "revenue": r.total_revenue
        }
        for r in results
    ]
