
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class StoreBase(BaseModel):
    name: str

class StoreCreate(StoreBase):
    password: str

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class Store(StoreBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
