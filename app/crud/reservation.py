# app/crud/reservation.py
import random
import uuid
from datetime import date, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem
from app.models.store import Store
from app.schemas.reservation import ReservationCreate, ReservationUpdate
from app.crud.order import build_order_items, now_tw


def _get_reservation_or_404(db: Session, reservation_id: uuid.UUID) -> Order:
    reservation = db.query(Order)\
        .filter(Order.id == reservation_id, Order.is_reservation.is_(True))\
        .first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation


def _normalize_phone(phone: Optional[str]) -> str:
    """只留數字比對，並把 +886/886 開頭視同 0 開頭"""
    digits = "".join(c for c in (phone or "") if c.isdigit())
    if digits.startswith("886"):
        digits = "0" + digits[3:]
    return digits


def _normalize_name(name: Optional[str]) -> str:
    return "".join((name or "").split()).casefold()


#「進行中」的訂單編號不可重複，完成/取消後即可回收
ACTIVE_STATUSES = ("reserved", "pending")
_ORDER_NO_MIN = 10000
_ORDER_NO_MAX = 99999
_ORDER_NO_MAX_TRIES = 50


def generate_order_no(db: Session) -> str:
    """產生一組未被進行中訂單佔用的 5 位數編號"""
    taken = {
        row[0] for row in db.query(Order.order_no)
        .filter(Order.order_no.isnot(None), Order.status.in_(ACTIVE_STATUSES))
        .all()
    }

    for _ in range(_ORDER_NO_MAX_TRIES):
        candidate = str(random.randint(_ORDER_NO_MIN, _ORDER_NO_MAX))
        if candidate not in taken:
            return candidate

    raise HTTPException(status_code=503, detail="目前訂單量過大，請稍後再試")


def find_reservations_by_customer(
    db: Session,
    customer_name: str,
    customer_phone: str,
    days: int = 30,
    limit: int = 20,
):
    """
    以姓名 + 電話查詢該顧客近期的預定訂單 (最新的排前面)。
    姓名與電話都在 Python 端正規化比對，因此先以天數縮小範圍再比對。
    """
    since = now_tw() - timedelta(days=days)
    candidates = db.query(Order)\
        .filter(Order.is_reservation.is_(True), Order.created_at >= since)\
        .options(joinedload(Order.items).joinedload(OrderItem.selected_options),
                 joinedload(Order.store))\
        .order_by(Order.created_at.desc())\
        .all()

    target_name = _normalize_name(customer_name)
    target_phone = _normalize_phone(customer_phone)

    matched = [
        r for r in candidates
        if _normalize_name(r.customer_name) == target_name
        and _normalize_phone(r.customer_phone) == target_phone
    ]
    return matched[:limit]


def phone_has_reservations(db: Session, customer_phone: str, days: int = 30) -> bool:
    """該電話是否有近期預定訂單 (只用於決定要不要記錄查詢失敗次數)"""
    since = now_tw() - timedelta(days=days)
    target_phone = _normalize_phone(customer_phone)
    rows = db.query(Order.customer_phone)\
        .filter(Order.is_reservation.is_(True), Order.created_at >= since)\
        .all()
    return any(_normalize_phone(r[0]) == target_phone for r in rows)


def find_reservation(db: Session, reservation_id: uuid.UUID) -> Optional[Order]:
    """找不到不拋錯，供公開查詢使用"""
    return db.query(Order)\
        .filter(Order.id == reservation_id, Order.is_reservation.is_(True))\
        .first()


def matches_customer(reservation: Order, customer_name: str, customer_phone: str) -> bool:
    """姓名與電話是否與訂單相符 (忽略空白/大小寫/電話符號)"""
    return (
        _normalize_name(reservation.customer_name) == _normalize_name(customer_name)
        and _normalize_phone(reservation.customer_phone) == _normalize_phone(customer_phone)
    )


def create_reservation(db: Session, reservation_in: ReservationCreate) -> Order:
    store = db.query(Store).filter(Store.id == reservation_in.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    if not store.is_active:
        raise HTTPException(status_code=400, detail="該分店目前暫停接單")

    db_order = Order(
        id=uuid.uuid4(),
        order_no=generate_order_no(db),
        table_number=None,
        total_price=0.0,
        status="reserved",
        order_type=reservation_in.order_type,
        created_at=now_tw(),
        store_id=store.id,
        is_reservation=True,
        customer_name=reservation_in.customer_name,
        customer_unit=reservation_in.customer_unit,
        customer_phone=reservation_in.customer_phone,
        delivery_address=reservation_in.delivery_address if reservation_in.order_type == "delivery" else None,
        pickup_time=reservation_in.pickup_time,
    )
    db.add(db_order)

    db_order.total_price = build_order_items(db, db_order, reservation_in.items)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_reservations(
    db: Session,
    store_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
):
    """
    列出預定訂單。日期是以「預定取餐時間」為準，未填取餐時間者則以建立時間為準。
    """
    effective_date = func.date(func.coalesce(Order.pickup_time, Order.created_at))

    query = db.query(Order).filter(Order.is_reservation.is_(True))

    if store_id:
        query = query.filter(Order.store_id == store_id)
    if start_date:
        query = query.filter(effective_date >= start_date)
    if end_date:
        query = query.filter(effective_date <= end_date)
    if status:
        query = query.filter(Order.status == status)

    return query.options(joinedload(Order.items).joinedload(OrderItem.selected_options),
                         joinedload(Order.store))\
        .order_by(func.coalesce(Order.pickup_time, Order.created_at).asc())\
        .offset(skip)\
        .limit(limit)\
        .all()


def get_reservation(db: Session, reservation_id: uuid.UUID) -> Order:
    return _get_reservation_or_404(db, reservation_id)


def update_reservation(db: Session, reservation_id: uuid.UUID, reservation_in: ReservationUpdate) -> Order:
    reservation = _get_reservation_or_404(db, reservation_id)

    data = reservation_in.model_dump(exclude_unset=True)
    items = data.pop("items", None)

    if "store_id" in data and data["store_id"]:
        store = db.query(Store).filter(Store.id == data["store_id"]).first()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

    for field, value in data.items():
        setattr(reservation, field, value)

    # 改成外帶時清掉地址，維持外送必填地址的規則
    if reservation.order_type == "delivery":
        if not (reservation.delivery_address or "").strip():
            raise HTTPException(status_code=400, detail="外送訂單必須填寫地址")
    else:
        reservation.delivery_address = None

    if items is not None:
        if not items:
            raise HTTPException(status_code=400, detail="訂單內容不可為空")
        for item in list(reservation.items):
            db.delete(item)
        db.flush()
        reservation.total_price = build_order_items(db, reservation, reservation_in.items)

    db.commit()
    db.refresh(reservation)
    return reservation


def delete_reservation(db: Session, reservation_id: uuid.UUID) -> Order:
    reservation = _get_reservation_or_404(db, reservation_id)
    db.delete(reservation)
    db.commit()
    return reservation
