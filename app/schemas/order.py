# app/schemas/order.py
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class OrderItemOptionSchema(BaseModel):
    option_name: str
    price_delta: float
    model_config = ConfigDict(from_attributes=True)

class OrderItemSchema(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    selected_options: List[OrderItemOptionSchema]
    model_config = ConfigDict(from_attributes=True)

class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1
    option_ids: List[uuid.UUID] = []

class OrderCreate(BaseModel):
    table_number: Optional[str] = None
    order_type: str = "dine_in"
    items: List[OrderItemCreate]

class OrderUpdateStatus(BaseModel):
    status: str

class OrderResponse(BaseModel):
    id: uuid.UUID
    store_id: Optional[uuid.UUID] = None
    table_number: Optional[str]
    order_type: str
    total_price: float
    status: str
    created_at: datetime
    items: List[OrderItemSchema]

    # 預定訂單才有值，供廚房/後台辨識來源
    is_reservation: bool = False
    order_no: Optional[str] = None
    customer_name: Optional[str] = None
    customer_unit: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    pickup_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)