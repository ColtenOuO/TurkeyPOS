# app/api/v1/endpoints/menu.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.product import Category as CategorySchema

from app.crud import menu as crud_menu

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
def get_menu(db: Session = Depends(get_db)):
    """
    獲取完整菜單，包含分類、產品及客製化選項
    """
    return crud_menu.get_menu(db)