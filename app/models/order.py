# app/models/order.py

import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import ForeignKey, String, Float, DateTime, Integer, Boolean, UUID
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

    # 預定訂單 (Reservation) 專用欄位
    is_reservation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 給顧客看的 5 位數訂單編號；已完成/已取消後可被回收再利用
    order_no: Mapped[Optional[str]] = mapped_column(String(5), nullable=True, index=True)
    customer_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    customer_unit: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    customer_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    delivery_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pickup_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    items: Mapped[List["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    store: Mapped["Store"] = relationship()

    @property
    def store_name(self) -> Optional[str]:
        return self.store.name if self.store else None

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