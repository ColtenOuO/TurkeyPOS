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
    items: List[OrderItemCreate]

class OrderUpdateStatus(BaseModel):
    status: str

class OrderResponse(BaseModel):
    id: uuid.UUID
    table_number: Optional[str]
    total_price: float
    status: str
    created_at: datetime
    items: List[OrderItemSchema]
    model_config = ConfigDict(from_attributes=True)