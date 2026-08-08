# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import menu, orders, products, analytics, sales, login, stores, reservations
from app.core.config import settings

app = FastAPI(title="Turkey Rice POS System", version="1.0.0")

# CORS
# 只開放 CORS_ORIGINS 列出的網域。前端經 nginx 代理 /api/v1 時屬同源請求，不受此限制。
# 認證用 Authorization: Bearer (localStorage)，不使用 cookie，因此 allow_credentials 維持 False，
# 避免與萬用字元來源組成「任何網站都能帶憑證呼叫」的組合。
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

app.include_router(stores.router, prefix="/api/v1/stores", tags=["Stores"])
app.include_router(login.router, prefix="/api/v1", tags=["Login"])
app.include_router(menu.router, prefix="/api/v1/menu", tags=["Menu"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(reservations.router, prefix="/api/v1/reservations", tags=["Reservations"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

@app.get("/")
def root():
    return {"message": "Welcome to Turkey Rice POS API"}