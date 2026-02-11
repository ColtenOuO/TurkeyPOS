from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud import analytics
from typing import List, Any, Optional
import uuid
from app.api.deps import get_current_actor

router = APIRouter()

def get_filter_store_id(payload: dict, store_id: Optional[uuid.UUID]):
    role = payload.get("role", "admin")
    if role == "store":
        return uuid.UUID(payload.get("sub"))
    return store_id

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db), 
    payload: dict = Depends(get_current_actor),
    store_id: Optional[uuid.UUID] = Query(None)
):
    """
    Get overall dashboard statistics (Today's revenue, Today's orders, All time revenue)
    """
    filter_id = get_filter_store_id(payload, store_id)
    
    daily_rev = analytics.get_daily_revenue(db, store_id=filter_id)
    daily_cnt = analytics.get_daily_order_count(db, store_id=filter_id)
    total_rev = analytics.get_total_revenue(db, store_id=filter_id)
    
    # Calculate AOV (Average Order Value) for today
    daily_aov = daily_rev / daily_cnt if daily_cnt > 0 else 0
    
    return {
        "today_revenue": daily_rev,
        "today_orders": daily_cnt,
        "today_aov": daily_aov,
        "total_revenue": total_rev
    }

@router.get("/daily-trend")
def get_daily_trend(
    db: Session = Depends(get_db), 
    payload: dict = Depends(get_current_actor),
    store_id: Optional[uuid.UUID] = Query(None)
):
    """
    Get sales trend for the last 30 days
    """
    filter_id = get_filter_store_id(payload, store_id)
    return analytics.get_daily_sales_trend(db, store_id=filter_id)

@router.get("/trend")
def get_hourly_trend(
    db: Session = Depends(get_db), 
    payload: dict = Depends(get_current_actor),
    store_id: Optional[uuid.UUID] = Query(None)
):
    """
    Get hourly sales trend for today
    """
    filter_id = get_filter_store_id(payload, store_id)
    return analytics.get_hourly_sales(db, store_id=filter_id)

@router.get("/top-products")
def get_top_products(
    db: Session = Depends(get_db), 
    payload: dict = Depends(get_current_actor),
    store_id: Optional[uuid.UUID] = Query(None)
):
    """
    Get top 5 selling products
    """
    filter_id = get_filter_store_id(payload, store_id)
    return analytics.get_top_products(db, store_id=filter_id)
