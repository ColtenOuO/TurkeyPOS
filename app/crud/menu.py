from sqlalchemy.orm import Session
from app.models.product import Category as CategoryModel

def get_menu(db: Session):
    """
    獲取完整菜單，包含分類、產品及客製化選項
    """
    return db.query(CategoryModel).order_by(CategoryModel.sort_order).all()
