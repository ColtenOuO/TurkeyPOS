from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.product import Product, ProductUpdate, ProductCreate
from app.crud import product as crud_product

router = APIRouter()



@router.post("/", response_model=Product)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """
    新增餐點
    """
    return crud_product.create_product(db, product_in)

@router.patch("/{name}", response_model=Product)
def update_product(name: str, product_in: ProductUpdate, db: Session = Depends(get_db)):
    """
    依據餐點名稱更新資訊
    """
    product = crud_product.get_product_by_name(db, name)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return crud_product.update_product_by_name(db, product, product_in)

@router.put("/reorder")
def reorder_products(payload: dict, db: Session = Depends(get_db)):
    """
    { "items": [ {"id": "uuid", "sort_order": 1}, ... ] }
    """
    if "items" not in payload:
        raise HTTPException(status_code=400, detail="Missing items")
    
    mapping = {}
    for item in payload["items"]:
        mapping[item["id"]] = item["sort_order"]
        
    crud_product.reorder_products(db, mapping)
    return {"message": "Products reordered successfully"}

@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    """
    刪除餐點 (Soft Delete)
    """
    product = crud_product.delete_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@router.post("/{product_id}/restore")
def restore_product(product_id: str, db: Session = Depends(get_db)):
    """
    復原餐點
    """
    product = crud_product.restore_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product restored successfully"}

@router.delete("/{product_id}/hard")
def hard_delete_product(product_id: str, db: Session = Depends(get_db)):
    """
    永久刪除餐點
    """
    result = crud_product.hard_delete_product(db, product_id)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product permanently deleted"}
