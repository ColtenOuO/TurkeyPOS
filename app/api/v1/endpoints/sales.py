from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.order import Order
from typing import Optional, Dict
from datetime import datetime, date

router = APIRouter()

@router.get("/stats")
def get_sales_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get aggregated sales statistics.
    If no dates provided, returns overall stats (all time).
    """
    query = db.query(
        func.count(Order.id).label("total_orders"),
        func.sum(Order.total_price).label("total_sales")
    )
    
    # Filter by date range if provided
    if start_date:
        query = query.filter(func.date(Order.created_at) >= start_date)
    if end_date:
        query = query.filter(func.date(Order.created_at) <= end_date)
        
    result = query.first()
    
    total_orders = result.total_orders or 0
    total_sales = result.total_sales or 0.0
    
    # Calculate Average Order Value
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0
    
    # --- Product Sales Breakdown ---
    from app.models.order import OrderItem
    
    prod_query = db.query(
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label("total_quantity"),
        func.sum(OrderItem.quantity * OrderItem.unit_price).label("product_revenue")
    ).join(Order, Order.id == OrderItem.order_id)
    
    # Filter by date range if provided (same as above)
    if start_date:
        prod_query = prod_query.filter(func.date(Order.created_at) >= start_date)
    if end_date:
        prod_query = prod_query.filter(func.date(Order.created_at) <= end_date)
        
    prod_stats = prod_query.group_by(OrderItem.product_name)\
        .order_by(func.sum(OrderItem.quantity).desc())\
        .all()
        
    products_data = [
        {
            "name": p.product_name,
            "quantity": int(p.total_quantity or 0),
            "revenue": float(p.product_revenue or 0)
        }
        for p in prod_stats
    ]
    
    return {
        "period": {
            "start": start_date,
            "end": end_date
        },
        "stats": {
            "total_orders": total_orders,
            "total_sales": total_sales,
            "avg_order_value": round(avg_order_value, 2)
        },
        "products": products_data
    }
