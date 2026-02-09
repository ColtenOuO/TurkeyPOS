# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import menu, orders, products, analytics, sales

app = FastAPI(title="Turkey Rice POS System", version="1.0.0")

# CROS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu.router, prefix="/api/v1/menu", tags=["Menu"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

@app.get("/")
def root():
    return {"message": "Welcome to Turkey Rice POS API"}