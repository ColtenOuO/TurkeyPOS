# app/api/v1/endpoints/reservations.py
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_actor
from app.crud import reservation as crud_reservation
from app.crud.order import now_tw
from app.models.order import Order
from app.models.store import Store
from app.schemas.reservation import (
    ReservationCreate,
    ReservationDailySummary,
    ReservationLookupRequest,
    ReservationPublicResponse,
    ReservationResponse,
    ReservationUpdate,
)

router = APIRouter()


def _store_id_from_payload(payload: dict) -> Optional[uuid.UUID]:
    """分店帳號只能看/改自己的預定訂單，Admin 則不限制"""
    if payload.get("role") == "store":
        return uuid.UUID(payload.get("sub"))
    return None


def _assert_can_access(payload: dict, reservation: Order):
    own_store_id = _store_id_from_payload(payload)
    if own_store_id and reservation.store_id != own_store_id:
        raise HTTPException(status_code=403, detail="無權限存取此預定訂單")


@router.post("/", response_model=ReservationResponse)
def create_reservation(reservation_in: ReservationCreate, db: Session = Depends(get_db)):
    """
    建立預定訂單 (顧客端，公開)

    - customer_name: 訂購人姓名 (必填)
    - customer_unit: 單位 (選填)
    - customer_phone: 訂購人電話 (必填)
    - order_type: takeout (外帶自取) 或 delivery (外送)
    - delivery_address: 外送時必填
    - pickup_time: 預定取餐時間 (選填)
    - store_id: 下單分店
    - items: 點餐內容 (同 /orders 的格式)
    """
    return crud_reservation.create_reservation(db, reservation_in)


@router.get("/", response_model=List[ReservationResponse])
def get_reservations(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor),
    store_id: Optional[uuid.UUID] = Query(None),
    start_date: Optional[date] = Query(None, description="不填則預設查詢今日"),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 200,
):
    """
    查詢預定訂單 (Admin 可看全部或指定分店，分店只能看自己的)
    未帶日期參數時預設為「今日」的預定訂單
    """
    filter_store_id = _store_id_from_payload(payload) or store_id

    if start_date is None and end_date is None:
        start_date = end_date = now_tw().date()

    return crud_reservation.get_reservations(
        db,
        store_id=filter_store_id,
        start_date=start_date,
        end_date=end_date,
        status=status,
        skip=skip,
        limit=limit,
    )


@router.get("/summary", response_model=List[ReservationDailySummary])
def get_reservations_summary(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor),
    store_id: Optional[uuid.UUID] = Query(None),
    start_date: Optional[date] = Query(None, description="不填則預設查詢今日"),
    end_date: Optional[date] = Query(None),
):
    """
    預定訂單依分店分類彙總 (含訂單數與金額，金額同步計入銷售數據)
    """
    filter_store_id = _store_id_from_payload(payload) or store_id

    if start_date is None and end_date is None:
        start_date = end_date = now_tw().date()

    reservations = crud_reservation.get_reservations(
        db,
        store_id=filter_store_id,
        start_date=start_date,
        end_date=end_date,
        limit=1000,
    )

    grouped = defaultdict(list)
    for r in reservations:
        grouped[r.store_id].append(r)

    # 即使某分店今日沒有預定訂單也一併列出，方便後台比對
    store_query = db.query(Store)
    if filter_store_id:
        store_query = store_query.filter(Store.id == filter_store_id)
    stores = store_query.order_by(Store.name).all()

    summaries = []
    for store in stores:
        rows = grouped.pop(store.id, [])
        summaries.append(_build_summary(store.id, store.name, rows))

    # 分店已被刪除 / 沒有對應分店的預定訂單
    for orphan_store_id, rows in grouped.items():
        summaries.append(_build_summary(orphan_store_id, rows[0].store_name, rows))

    return summaries


def _build_summary(store_id, store_name, rows) -> dict:
    countable = [r for r in rows if r.status != "cancelled"]
    return {
        "store_id": store_id,
        "store_name": store_name,
        "total_orders": len(countable),
        "total_sales": float(sum(r.total_price for r in countable)),
        "takeout_orders": len([r for r in countable if r.order_type == "takeout"]),
        "delivery_orders": len([r for r in countable if r.order_type == "delivery"]),
        "reservations": rows,
    }


# 查詢失敗次數 (per 訂單編號)，避免以姓名/電話暴力嘗試
# 只記錄「訂單存在但姓名/電話不符」的失敗，因此 key 數量受限於實際訂單數，
# 用隨機編號亂打不會在此累積任何資料
_LOOKUP_FAIL_LIMIT = 5
_LOOKUP_FAIL_WINDOW = timedelta(minutes=10)
_LOOKUP_SWEEP_INTERVAL = timedelta(minutes=1)
_lookup_failures: dict = {}
_last_sweep = datetime.utcnow()


def _recent_failures(key: str, now: datetime) -> list:
    """取得該編號在視窗內的失敗紀錄，順手清掉自己過期的部分 (O(1) 攤提)"""
    attempts = [t for t in _lookup_failures.get(key, []) if now - t < _LOOKUP_FAIL_WINDOW]
    if attempts:
        _lookup_failures[key] = attempts
    else:
        _lookup_failures.pop(key, None)
    return attempts


def _sweep_failures(now: datetime):
    """整批清除過期紀錄。最多每分鐘掃一次，避免每個請求都走訪全表"""
    global _last_sweep
    if now - _last_sweep < _LOOKUP_SWEEP_INTERVAL:
        return
    _last_sweep = now
    for key, attempts in list(_lookup_failures.items()):
        if not any(now - t < _LOOKUP_FAIL_WINDOW for t in attempts):
            del _lookup_failures[key]


@router.post("/lookup", response_model=ReservationPublicResponse)
def lookup_reservation(lookup_in: ReservationLookupRequest, db: Session = Depends(get_db)):
    """
    顧客查詢預定訂單狀態 (公開，需雙重驗證)

    須同時提供訂單編號、訂購人姓名與電話，三者相符才回傳訂單內容。
    姓名忽略空白與大小寫，電話忽略符號並將 +886 視同 0 開頭。
    """
    now = datetime.utcnow()
    _sweep_failures(now)

    key = str(lookup_in.reservation_id)
    if len(_recent_failures(key, now)) >= _LOOKUP_FAIL_LIMIT:
        raise HTTPException(status_code=429, detail="嘗試次數過多，請稍後再試")

    # 對外一律回傳相同的 404，不區分「查無訂單」與「姓名/電話不符」
    not_found = HTTPException(status_code=404, detail="訂單編號、姓名或電話有誤，請確認後再試")

    reservation = crud_reservation.find_reservation(db, lookup_in.reservation_id)
    if not reservation:
        # 編號不存在就不留紀錄，否則隨機編號亂打會無限撐大 _lookup_failures
        raise not_found

    if not crud_reservation.matches_customer(reservation, lookup_in.customer_name, lookup_in.customer_phone):
        _lookup_failures.setdefault(key, []).append(now)
        raise not_found

    _lookup_failures.pop(key, None)
    return reservation


@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(
    reservation_id: uuid.UUID,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor),
):
    """
    查詢單筆預定訂單
    """
    reservation = crud_reservation.get_reservation(db, reservation_id)
    _assert_can_access(payload, reservation)
    return reservation


@router.put("/{reservation_id}", response_model=ReservationResponse)
def update_reservation(
    reservation_id: uuid.UUID,
    reservation_in: ReservationUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor),
):
    """
    更新預定訂單 (訂購人資訊、外帶/外送、狀態，或整批取代點餐內容)
    """
    reservation = crud_reservation.get_reservation(db, reservation_id)
    _assert_can_access(payload, reservation)
    return crud_reservation.update_reservation(db, reservation_id, reservation_in)


@router.delete("/{reservation_id}", response_model=ReservationResponse)
def delete_reservation(
    reservation_id: uuid.UUID,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_actor),
):
    """
    刪除預定訂單
    """
    reservation = crud_reservation.get_reservation(db, reservation_id)
    _assert_can_access(payload, reservation)
    # 先序列化，刪除後物件會脫離 session 無法再讀取關聯資料
    deleted = ReservationResponse.model_validate(reservation)
    crud_reservation.delete_reservation(db, reservation_id)
    return deleted
