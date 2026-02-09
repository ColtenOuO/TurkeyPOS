from sqlalchemy.orm import Session
from app.models.product import Product, ProductOption
from app.schemas.product import ProductUpdate, ProductCreate
import uuid

def get_product_by_name(db: Session, name: str):
    return db.query(Product).filter(Product.name == name).first()

def create_product(db: Session, product_in: ProductCreate):

    # Auto-assign sort_order if not provided
    if product_in.sort_order == 0:
        max_order = db.query(Product).filter(Product.category_id == product_in.category_id).order_by(Product.sort_order.desc()).first()
        new_order = (max_order.sort_order + 1) if max_order else 0
    else:
        new_order = product_in.sort_order

    db_product = Product(
        id=uuid.uuid4(),
        name=product_in.name,
        base_price=product_in.base_price,
        category_id=product_in.category_id,
        sort_order=new_order
    )
    db.add(db_product)
    
    for opt in product_in.options:
        new_opt = ProductOption(
            id=uuid.uuid4(),
            product_id=db_product.id,
            name=opt.name,
            price_delta=opt.price_delta,
            is_required=opt.is_required
        )
        db.add(new_opt)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def reorder_products(db: Session, order_mapping: dict):
    """
    Update sort_order for multiple products.
    order_mapping: {product_id (str): new_sort_order (int)}
    """
    for prod_id, new_order in order_mapping.items():
        db_prod = db.query(Product).filter(Product.id == prod_id).first()
        if db_prod:
            db_prod.sort_order = new_order
    db.commit()
    return True

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
    return db_product

def delete_product(db: Session, product_id: str):
    import uuid
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if db_prod:
        db_prod.is_deleted = True
        db.commit()
    return db_prod
    return db_prod

def restore_product(db: Session, product_id: str):
    import uuid
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if db_prod:
        db_prod.is_deleted = False
        db.commit()
    return db_prod

def hard_delete_product(db: Session, product_id: str):
    import uuid
    db_prod = db.query(Product).filter(Product.id == product_id).first()
    if db_prod:
        db.delete(db_prod)
        db.commit()
    return True
