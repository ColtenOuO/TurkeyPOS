# app/models/product.py

import uuid
from typing import List
from sqlalchemy import ForeignKey, String, Float, Integer, Boolean, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Category(Base):
    """菜單分類"""
    __tablename__ = "categories"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    products: Mapped[List["Product"]] = relationship(back_populates="category")

class Product(Base):
    """基本餐點品項"""
    __tablename__ = "products"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    
    category: Mapped["Category"] = relationship(back_populates="products")
    options: Mapped[List["ProductOption"]] = relationship(back_populates="product")

class ProductOption(Base):
    """客製化選項"""
    __tablename__ = "product_options"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    price_delta: Mapped[float] = mapped_column(Float, default=0.0)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)

    product: Mapped["Product"] = relationship(back_populates="options")