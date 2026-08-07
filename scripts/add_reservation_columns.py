
from sqlalchemy import create_engine, text
import os
import sys

# Add the parent directory to sys.path to resolve app imports if needed
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings

COLUMNS = {
    "is_reservation": "BOOLEAN NOT NULL DEFAULT FALSE",
    "customer_name": "VARCHAR(50)",
    "customer_unit": "VARCHAR(100)",
    "customer_phone": "VARCHAR(30)",
    "delivery_address": "VARCHAR(255)",
    "pickup_time": "TIMESTAMP",
}


def add_columns():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        for column, definition in COLUMNS.items():
            try:
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name='orders' AND column_name=:col"
                ), {"col": column})
                if result.fetchone():
                    print(f"Column '{column}' already exists.")
                    continue

                print(f"Adding '{column}' column...")
                conn.execute(text(f"ALTER TABLE orders ADD COLUMN {column} {definition}"))
                conn.commit()
                print(f"Column '{column}' added successfully.")
            except Exception as e:
                print(f"Error adding '{column}': {e}")


if __name__ == "__main__":
    add_columns()
