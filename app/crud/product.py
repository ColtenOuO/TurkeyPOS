from sqlalchemy.orm import Session
from app.models.product import Product, ProductOption
from app.schemas.product import ProductUpdate
import uuid

def get_product_by_name(db: Session, name: str):
    return db.query(Product).filter(Product.name == name).first()

def update_product_by_name(db: Session, db_product: Product, product_in: ProductUpdate):
    update_data = product_in.model_dump(exclude_unset=True)
    
    # Update basic fields
    if "name" in update_data:
        db_product.name = update_data["name"]
    if "base_price" in update_data:
        db_product.base_price = update_data["base_price"]

    # Update options if provided
    if "options" in update_data:
        # Delete existing options
        db.query(ProductOption).filter(ProductOption.product_id == db_product.id).delete()
        
        # Add new options
        for opt_data in update_data["options"]:
            # opt_data is a dictionary since we used model_dump
            new_opt = ProductOption(
                id=uuid.uuid4(),
                product_id=db_product.id,
                name=opt_data["name"],
                price_delta=opt_data["price_delta"],
                is_required=opt_data["is_required"]
            )
            db.add(new_opt)
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product
