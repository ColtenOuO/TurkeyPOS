# app/api/v1/endpoints/menu.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.product import Category as CategoryModel
from app.schemas.product import Category as CategorySchema

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
def get_menu(db: Session = Depends(get_db)):
    """
    獲取完整菜單，包含分類、產品及客製化選項
    """
    categories = db.query(CategoryModel).order_by(CategoryModel.sort_order).all()
    return categories