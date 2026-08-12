import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from app.api.v1.endpoints.login import router
from app.db.session import get_db
from app.core.security import get_password_hash

app = FastAPI()
app.include_router(router, prefix="/api/v1")


@pytest.fixture
def mock_db_session():
    """ 模擬資料庫的 session """
    mock_session = MagicMock()
    yield mock_session


@pytest.fixture # fixture 是 pytest 的一個功能，允許你在測試中提供共用的資源或設定
def client(mock_db_session):
    # 用 mock session 覆蓋掉 get_db 依賴，測試就不會真的去連資料庫
    app.dependency_overrides[get_db] = lambda: mock_db_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# 下面的這些測資料試都會被用在 test_login_access_token 依序帶入對應的參數 (就是多組測資測試的概念)
@pytest.mark.parametrize(
    "username, password, expected_status, expected_detail",
    [
        ("admin", "admin_secret", 200, None),
        ("admin", "wrong_password", 400, "Incorrect username or password"),
        # TODO: 這裡可以再加上其他測試案例，例如錯誤的 username
    ]
)
def test_login_access_token(client, monkeypatch, username, password, expected_status, expected_detail):
    monkeypatch.setenv("ADMIN_PASSWORD", "admin_secret")

    response = client.post(
        "/api/v1/login/access-token",
        data={"username": username, "password": password},
    )
    assert response.status_code == expected_status
    if expected_status == 200:
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"]
    else:
        assert response.json()["detail"] == expected_detail


class FakeStore:
    """假的 Store 物件，只提供 login_store 端點會用到的欄位，方便測試。"""
    def __init__(self, name, password, is_active=True):
        self.id = "11111111-1111-1111-1111-111111111111"
        self.name = name
        self.password_hash = get_password_hash(password)
        self.is_active = is_active


@pytest.fixture
def mock_store_query(mock_db_session):
    """ 讓測試可以指定 db query return 的結果，方便測試，不用真的在資料庫中塞資料測試。"""
    def _set(result):
        mock_db_session.query.return_value.filter.return_value.first.return_value = result
    return _set


# TODO: 可以再加上測試案例，比照上方使用 parametrize (Line 30~36)，測試 store login 的各種情況
def test_login_store_success(client, mock_store_query):
    mock_store_query(FakeStore(name="turkey-store", password="store_secret"))

    response = client.post(
        "/api/v1/login/store",
        data={"username": "turkey-store", "password": "store_secret"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_store_not_found(client, mock_store_query):
    # 資料庫查無此店家名稱
    mock_store_query(None) # 模擬查詢結果為 None

    response = client.post(
        "/api/v1/login/store",
        data={"username": "no-such-store", "password": "whatever"},
    )

    # TODO: 補完 assert，檢查 response.status_code 與 response.json() 的內容


def test_login_store_wrong_password(client, mock_store_query):
    
    # TODO: 補完這個測試案例，模擬查詢到一個 Store，但密碼錯誤，檢查 response.status_code 與 response.json() 的內容


def test_login_store_inactive(client, mock_store_query):
    mock_store_query(FakeStore(name="turkey-store", password="store_secret", is_active=False))

    response = client.post(
        "/api/v1/login/store",
        data={"username": "turkey-store", "password": "store_secret"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Store is inactive"
