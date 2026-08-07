# app/schemas/reservation.py
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.schemas.order import OrderItemCreate, OrderItemSchema

# 預定訂單只支援外帶自取與外送
RESERVATION_ORDER_TYPES = {"takeout", "delivery"}
# reserved: 已預定待確認 / pending: 已確認 (進廚房) / completed: 已完成 / cancelled: 已取消
RESERVATION_STATUSES = {"reserved", "pending", "completed", "cancelled"}


class ReservationBase(BaseModel):
    customer_name: str
    customer_unit: Optional[str] = None
    customer_phone: str
    order_type: str = "takeout"
    delivery_address: Optional[str] = None
    pickup_time: Optional[datetime] = None

    @field_validator("customer_name", "customer_phone")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("此欄位為必填")
        return v.strip()

    @field_validator("order_type")
    @classmethod
    def valid_order_type(cls, v: str) -> str:
        if v not in RESERVATION_ORDER_TYPES:
            raise ValueError(f"order_type 必須為 {sorted(RESERVATION_ORDER_TYPES)} 其中之一")
        return v

    @model_validator(mode="after")
    def address_required_for_delivery(self):
        if self.order_type == "delivery" and not (self.delivery_address or "").strip():
            raise ValueError("外送訂單必須填寫地址")
        return self


class ReservationCreate(ReservationBase):
    store_id: uuid.UUID
    items: List[OrderItemCreate]

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: List[OrderItemCreate]) -> List[OrderItemCreate]:
        if not v:
            raise ValueError("訂單內容不可為空")
        return v


class ReservationUpdate(BaseModel):
    """
    更新預定訂單，所有欄位皆為選填；帶入 items 時會整批取代原本的點餐內容
    """
    customer_name: Optional[str] = None
    customer_unit: Optional[str] = None
    customer_phone: Optional[str] = None
    order_type: Optional[str] = None
    delivery_address: Optional[str] = None
    pickup_time: Optional[datetime] = None
    status: Optional[str] = None
    store_id: Optional[uuid.UUID] = None
    items: Optional[List[OrderItemCreate]] = None

    @field_validator("order_type")
    @classmethod
    def valid_order_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in RESERVATION_ORDER_TYPES:
            raise ValueError(f"order_type 必須為 {sorted(RESERVATION_ORDER_TYPES)} 其中之一")
        return v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in RESERVATION_STATUSES:
            raise ValueError(f"status 必須為 {sorted(RESERVATION_STATUSES)} 其中之一")
        return v


class ReservationResponse(BaseModel):
    id: uuid.UUID
    store_id: Optional[uuid.UUID] = None
    store_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_unit: Optional[str] = None
    customer_phone: Optional[str] = None
    order_type: str
    delivery_address: Optional[str] = None
    pickup_time: Optional[datetime] = None
    total_price: float
    status: str
    created_at: datetime
    items: List[OrderItemSchema]
    model_config = ConfigDict(from_attributes=True)


class ReservationDailySummary(BaseModel):
    """今日預定訂單依分店彙總"""
    store_id: Optional[uuid.UUID] = None
    store_name: Optional[str] = None
    total_orders: int
    total_sales: float
    takeout_orders: int
    delivery_orders: int
    reservations: List[ReservationResponse]
