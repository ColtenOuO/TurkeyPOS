# app/api/v1/endpoints/menu.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.product import Category as CategorySchema, CategoryCreate

from app.crud import menu as crud_menu

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
def get_menu(db: Session = Depends(get_db)):
    """
    獲取完整菜單，包含分類、產品及客製化選項
    """
    return crud_menu.get_menu(db)

from app.api.deps import get_current_admin

@router.post("/categories", response_model=CategorySchema)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    新增餐點分類
    """
    return crud_menu.create_category(db, category_in)

@router.put("/reorder")
def reorder_categories(payload: dict, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    { "items": [ {"id": "uuid", "sort_order": 1}, ... ] }
    """
    if "items" not in payload:
        raise HTTPException(status_code=400, detail="Missing items")
    
    mapping = {}
    for item in payload["items"]:
        mapping[item["id"]] = item["sort_order"]
        
    crud_menu.reorder_categories(db, mapping)
    return {"message": "Categories reordered successfully"}

@router.delete("/categories/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    刪除分類 (Soft Delete)
    """
    category = crud_menu.delete_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

@router.get("/trash")
def get_trash(db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    獲取已刪除的項目 (回收桶)
    """
    return crud_menu.get_deleted_items(db)

@router.post("/categories/{category_id}/restore")
def restore_category(category_id: str, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    復原分類
    """
    category = crud_menu.restore_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category restored successfully"}

@router.delete("/categories/{category_id}/hard")
def hard_delete_category(category_id: str, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """
    永久刪除分類
    """
    result = crud_menu.hard_delete_category(db, category_id)
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category permanently deleted"}