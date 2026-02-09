# app/schemas/product.py

import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ProductOptionBase(BaseModel):
    name: str
    price_delta: float = 0.0
    is_required: bool = False

class ProductOptionCreate(ProductOptionBase):
    product_id: uuid.UUID

class ProductOption(ProductOptionBase):
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)



class ProductBase(BaseModel):
    name: str
    base_price: float
    sort_order: int = 0

class ProductCreate(ProductBase):
    category_id: uuid.UUID
    options: List[ProductOptionBase] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    base_price: Optional[float] = None
    options: Optional[List[ProductOptionBase]] = None

class Product(ProductBase):
    id: uuid.UUID
    category_id: uuid.UUID
    options: List[ProductOption] = []

    model_config = ConfigDict(from_attributes=True)


class CategoryBase(BaseModel):
    name: str
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: uuid.UUID
    products: List[Product] = []

    model_config = ConfigDict(from_attributes=True)

class ReorderSchema(BaseModel):
    items: List[dict] # [{"id": "uuid", "sort_order": 1}, ...]