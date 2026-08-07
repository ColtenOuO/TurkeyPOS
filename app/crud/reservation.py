# app/crud/reservation.py
import uuid
from datetime import date
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


def create_reservation(db: Session, reservation_in: ReservationCreate) -> Order:
    store = db.query(Store).filter(Store.id == reservation_in.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    if not store.is_active:
        raise HTTPException(status_code=400, detail="該分店目前暫停接單")

    db_order = Order(
        id=uuid.uuid4(),
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
