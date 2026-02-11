import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.product import Category, Product, ProductOption

def seed():
    db = SessionLocal()
    try:
        categories_data = [
            {"name": "飯類", "sort_order": 1},
            {"name": "切盤系列", "sort_order": 2},
            {"name": "湯類", "sort_order": 3},
            {"name": "小菜", "sort_order": 4},
        ]
        
        cat_map = {}
        for cat in categories_data:
            c = db.query(Category).filter_by(name=cat["name"]).first()
            if not c:
                c = Category(name=cat["name"], sort_order=cat["sort_order"])
                db.add(c)
                db.flush()
            cat_map[cat["name"]] = c

        products = [
            ("火雞肉飯", 45.0, "飯類", True),
            ("肉燥飯", 40.0, "飯類", True),
            ("白飯", 10.0, "飯類", True),
            
            ("火雞肉切盤", 80.0, "切盤系列", False),
            ("火雞翅切盤", 100.0, "切盤系列", False),
            ("火雞元寶切盤", 100.0, "切盤系列", False),
            
            ("薑絲過魚湯", 130.0, "湯類", False),
            ("味噌過魚湯", 130.0, "湯類", False),
            ("虱目魚皮湯", 55.0, "湯類", False),
            ("火雞下水湯", 35.0, "湯類", False),
            ("鳳爪湯", 35.0, "湯類", False),
            ("脆筍湯", 35.0, "湯類", False),
            ("虱目魚丸湯", 35.0, "湯類", False),
            ("貢丸湯", 35.0, "湯類", False),
            ("紫菜湯", 15.0, "湯類", False),
            
            ("豆豉吳郭魚", 50.0, "小菜", False),
            ("筍干", 35.0, "小菜", False),
            ("白菜魯", 35.0, "小菜", False),
            ("皮蛋豆腐", 35.0, "小菜", False),
            ("滷蛋", 15.0, "小菜", False),
            ("滷貢丸", 10.0, "小菜", False),
            ("滷油豆腐", 10.0, "小菜", False),
            ("高麗菜/青菜", 30.0, "小菜", False),
        ]

        for name, price, cat_name, has_variants in products:
            if not db.query(Product).filter_by(name=name).first():
                p = Product(name=name, base_price=price, category_id=cat_map[cat_name].id)
                db.add(p)
                db.flush()
                
                if has_variants:
                    db.add(ProductOption(product_id=p.id, name="小", price_delta=0.0, is_required=True))
                    db.add(ProductOption(product_id=p.id, name="大", price_delta=10.0, is_required=True))

        db.commit()
        print("Successfully seeded turkey rice menu data!")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()