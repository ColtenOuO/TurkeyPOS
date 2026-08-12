import uuid

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from app.api.v1.endpoints.menu import router
from app.api.deps import get_current_admin
from app.db.session import get_db

app = FastAPI()
app.include_router(router, prefix="/api/v1/menu")


@pytest.fixture
def mock_db_session():
    """ 模擬資料庫的 session"""
    return MagicMock()


@pytest.fixture
def client(mock_db_session):
    # 只覆蓋 get_db，get_current_admin 維持原樣，
    # 用來測試「沒帶 token」時該被擋下來的行為
    app.dependency_overrides[get_db] = lambda: mock_db_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_client(client):
    # 在 client 之上再覆蓋 get_current_admin，模擬一個已登入的管理員，
    # 測試時就不用真的產生 JWT
    app.dependency_overrides[get_current_admin] = lambda: "admin"
    yield client
    del app.dependency_overrides[get_current_admin]


# ---------- GET /menu/ (公開，不需要登入) ----------

def test_get_menu_returns_categories(client, monkeypatch):
    category_id = uuid.uuid4()
    fake_categories = [
        {"id": category_id, "name": "飲料", "sort_order": 0, "products": []}
    ]
    monkeypatch.setattr("app.crud.menu.get_menu", lambda db: fake_categories)

    response = client.get("/api/v1/menu/")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == str(category_id)
    assert body[0]["name"] == "飲料"


def test_get_menu_empty(client, monkeypatch):
    monkeypatch.setattr("app.crud.menu.get_menu", lambda db: [])

    response = client.get("/api/v1/menu/")

    assert response.status_code == 200
    assert response.json() == []


# ---------- 需要管理員權限的 endpoint 在沒帶 token 時都應該回 401 ----------

@pytest.mark.parametrize(
    "method, path, json_body",
    [
        ("post", "/api/v1/menu/categories", {"name": "測試分類", "sort_order": 0}),
        ("put", "/api/v1/menu/reorder", {"items": []}),
        ("delete", f"/api/v1/menu/categories/{uuid.uuid4()}", None),
        ("get", "/api/v1/menu/trash", None),
        ("post", f"/api/v1/menu/categories/{uuid.uuid4()}/restore", None),
        ("delete", f"/api/v1/menu/categories/{uuid.uuid4()}/hard", None),
    ],
)
def test_admin_endpoints_require_auth(client, method, path, json_body):
    kwargs = {"json": json_body} if json_body is not None else {}
    response = getattr(client, method)(path, **kwargs)
    assert response.status_code == 401


def test_admin_endpoints_reject_invalid_token(client):
    response = client.get(
        "/api/v1/menu/trash",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code == 401


# ---------- POST /menu/categories ----------

def test_create_category_success(admin_client, monkeypatch):
    category_id = uuid.uuid4()
    created = {"id": category_id, "name": "湯品", "sort_order": 1, "products": []}
    mock_create = MagicMock(return_value=created)
    monkeypatch.setattr("app.crud.menu.create_category", mock_create)

    response = admin_client.post(
        "/api/v1/menu/categories",
        json={"name": "湯品", "sort_order": 1},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "湯品"
    passed_category_in = mock_create.call_args.args[1]
    assert passed_category_in.name == "湯品"
    assert passed_category_in.sort_order == 1


# ---------- PUT /menu/reorder ----------

def test_reorder_categories_missing_items(admin_client):
    response = admin_client.put("/api/v1/menu/reorder", json={})

    assert response.status_code == 400
    assert response.json()["detail"] == "Missing items"


def test_reorder_categories_success(admin_client, monkeypatch):
    mock_reorder = MagicMock(return_value=True)
    monkeypatch.setattr("app.crud.menu.reorder_categories", mock_reorder)

    cat_id = str(uuid.uuid4())
    response = admin_client.put(
        "/api/v1/menu/reorder",
        json={"items": [{"id": cat_id, "sort_order": 2}]},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Categories reordered successfully"}
    mock_reorder.assert_called_once()
    assert mock_reorder.call_args.args[1] == {cat_id: 2}


# ---------- DELETE /menu/categories/{id} ----------

def test_delete_category_not_found(admin_client, monkeypatch):
    monkeypatch.setattr("app.crud.menu.delete_category", lambda db, cid: None)

    response = admin_client.delete(f"/api/v1/menu/categories/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"


def test_delete_category_success(admin_client, monkeypatch):
    monkeypatch.setattr("app.crud.menu.delete_category", lambda db, cid: object())

    response = admin_client.delete(f"/api/v1/menu/categories/{uuid.uuid4()}")

    assert response.status_code == 200
    assert response.json() == {"message": "Category deleted successfully"}


# ---------- GET /menu/trash ----------

def test_get_trash(admin_client, monkeypatch):
    trash = {"categories": [], "products": []}
    monkeypatch.setattr("app.crud.menu.get_deleted_items", lambda db: trash)

    response = admin_client.get("/api/v1/menu/trash")

    assert response.status_code == 200
    assert response.json() == trash


# ---------- POST /menu/categories/{id}/restore ----------

def test_restore_category_not_found(admin_client, monkeypatch):
    monkeypatch.setattr("app.crud.menu.restore_category", lambda db, cid: None)

    response = admin_client.post(f"/api/v1/menu/categories/{uuid.uuid4()}/restore")

    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"


def test_restore_category_success(admin_client, monkeypatch):
    monkeypatch.setattr("app.crud.menu.restore_category", lambda db, cid: object())

    response = admin_client.post(f"/api/v1/menu/categories/{uuid.uuid4()}/restore")

    assert response.status_code == 200
    assert response.json() == {"message": "Category restored successfully"}


# ---------- DELETE /menu/categories/{id}/hard ----------

def test_hard_delete_category_not_found(admin_client, monkeypatch):
    monkeypatch.setattr("app.crud.menu.hard_delete_category", lambda db, cid: False)

    response = admin_client.delete(f"/api/v1/menu/categories/{uuid.uuid4()}/hard")

    assert response.status_code == 404
    assert response.json()["detail"] == "Category not found"


def test_hard_delete_category_success(admin_client, monkeypatch):
    monkeypatch.setattr("app.crud.menu.hard_delete_category", lambda db, cid: True)

    response = admin_client.delete(f"/api/v1/menu/categories/{uuid.uuid4()}/hard")

    assert response.status_code == 200
    assert response.json() == {"message": "Category permanently deleted"}
