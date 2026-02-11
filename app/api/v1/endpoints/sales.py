from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.order import Order
from typing import Optional, Dict
from datetime import datetime, date



from app.models.store import Store
from app.api.deps import get_current_actor, get_current_admin
import uuid

router = APIRouter()

@router.get("/stats")
def get_sales_stats(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    store_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor)
):
    """
    Get aggregated sales statistics.
    If no dates provided, returns overall stats (all time).
    - Admin: Can see all or filter by store_id
    - Store: Can only see own stats
    """
    role = payload.get("role", "admin")
    
    # Determine effective store_id filter
    filter_store_id = store_id
    
    if role == "store":
        filter_store_id = uuid.UUID(payload.get("sub"))
    
    query = db.query(
        func.count(Order.id).label("total_orders"),
        func.sum(Order.total_price).label("total_sales")
    )
    
    # Filter by store if applicable
    if filter_store_id:
        query = query.filter(Order.store_id == filter_store_id)

    
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
    
    # Filter by store if applicable
    if filter_store_id:
        prod_query = prod_query.filter(Order.store_id == filter_store_id)
    
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

@router.get("/overview")
def get_sales_overview(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):
    """
    Get aggregated sales stats per store (Admin only)
    """
    from app.crud import analytics
    return analytics.get_stores_overview(db, start_date, end_date)

