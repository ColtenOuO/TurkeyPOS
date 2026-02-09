from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.crud import analytics
from typing import List, Any

from app.api.deps import get_current_admin

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    Get overall dashboard statistics (Today's revenue, Today's orders, All time revenue)
    """
    daily_rev = analytics.get_daily_revenue(db)
    daily_cnt = analytics.get_daily_order_count(db)
    total_rev = analytics.get_total_revenue(db)
    
    # Calculate AOV (Average Order Value) for today
    daily_aov = daily_rev / daily_cnt if daily_cnt > 0 else 0
    
    return {
        "today_revenue": daily_rev,
        "today_orders": daily_cnt,
        "today_aov": daily_aov,
        "total_revenue": total_rev
    }

@router.get("/daily-trend")
def get_daily_trend(db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    Get sales trend for the last 30 days
    """
    return analytics.get_daily_sales_trend(db)

@router.get("/trend")
def get_hourly_trend(db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    Get hourly sales trend for today
    """
    return analytics.get_hourly_sales(db)

@router.get("/top-products")
def get_top_products(db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    Get top 5 selling products
    """
    return analytics.get_top_products(db)
