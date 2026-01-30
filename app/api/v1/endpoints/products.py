from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.product import Product, ProductUpdate
from app.crud import product as crud_product

router = APIRouter()

@router.patch("/{name}", response_model=Product)
def update_product(name: str, product_in: ProductUpdate, db: Session = Depends(get_db)):
    """
    依據餐點名稱更新資訊
    """
    product = crud_product.get_product_by_name(db, name)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return crud_product.update_product_by_name(db, product, product_in)
