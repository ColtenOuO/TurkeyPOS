# app/models/order.py

import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import ForeignKey, String, Float, DateTime, Integer, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.store import Store

class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    table_number: Mapped[Optional[str]] = mapped_column(String(10)) 
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending") 
    order_type: Mapped[str] = mapped_column(String(20), default="dine_in")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    store_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("stores.id"), nullable=True)
    
    items: Mapped[List["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    store: Mapped["Store"] = relationship()

class OrderItem(Base):
    """訂單明細"""
    __tablename__ = "order_items"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(100), nullable=False) 
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False) 
    
    order: Mapped["Order"] = relationship(back_populates="items")
    selected_options: Mapped[List["OrderItemOption"]] = relationship(cascade="all, delete-orphan")

class OrderItemOption(Base):
    """客製化紀錄"""
    __tablename__ = "order_item_options"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    order_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("order_items.id"), nullable=False)
    option_name: Mapped[str] = mapped_column(String(50), nullable=False) 
    price_delta: Mapped[float] = mapped_column(Float, nullable=False)