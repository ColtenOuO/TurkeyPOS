from sqlalchemy.orm import Session
from app.models.product import Category as CategoryModel
from app.schemas.product import CategoryCreate

def get_menu(db: Session):
    """
    獲取完整菜單，包含分類、產品及客製化選項
    """
    return db.query(CategoryModel).filter(CategoryModel.is_deleted == False).order_by(CategoryModel.sort_order).all()

def delete_category(db: Session, category_id: str):
    import uuid
    db_cat = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if db_cat:
        db_cat.is_deleted = True
        db.commit()
    return db_cat

def create_category(db: Session, category_in: CategoryCreate):
    import uuid
    if category_in.sort_order == 0:
        max_order = db.query(CategoryModel).order_by(CategoryModel.sort_order.desc()).first()
        new_order = (max_order.sort_order + 1) if max_order else 0
    else:
        new_order = category_in.sort_order

    db_obj = CategoryModel(
        id=uuid.uuid4(),
        name=category_in.name,
        sort_order=new_order
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def reorder_categories(db: Session, order_mapping: dict):
    """
    Update sort_order for multiple categories.
    order_mapping: {category_id (str): new_sort_order (int)}
    """
    for cat_id, new_order in order_mapping.items():
        db_cat = db.query(CategoryModel).filter(CategoryModel.id == cat_id).first()
        if db_cat:
            db_cat.sort_order = new_order
    db.commit()
    return True

def get_deleted_items(db: Session):
    """
    獲取所有已刪除的分類與產品
    """
    from app.models.product import Product
    
    deleted_cats = db.query(CategoryModel).filter(CategoryModel.is_deleted == True).all()
    deleted_prods = db.query(Product).filter(Product.is_deleted == True).all()
    
    return {
        "categories": deleted_cats,
        "products": deleted_prods
    }

def restore_category(db: Session, category_id: str):
    db_cat = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if db_cat:
        db_cat.is_deleted = False
        db.commit()
    return db_cat

def hard_delete_category(db: Session, category_id: str):
    from app.models.product import Product
    
    # First, manually delete all products associated with this category
    # This prevents integrity error where SQLAlchemy tries to set category_id=NULL
    db.query(Product).filter(Product.category_id == category_id).delete()
    
    db_cat = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if db_cat:
        db.delete(db_cat)
        db.commit()
    return True
