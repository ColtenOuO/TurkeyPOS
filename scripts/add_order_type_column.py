
from sqlalchemy import create_engine, text
import os
import sys

# Add the parent directory to sys.path to resolve app imports if needed
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings

def add_column():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("COMMIT"))
        try:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='order_type'"))
            if result.fetchone():
                print("Column 'order_type' already exists.")
                return

            print("Adding 'order_type' column...")
            conn.execute(text("ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'dine_in'"))
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
