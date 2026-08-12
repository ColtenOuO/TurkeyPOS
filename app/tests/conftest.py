"""
測試共用設定。

app.core.config.Settings 在被 import 的當下就會讀取
POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB / DATABASE_URL，
測試環境通常不會有 .env 檔，若沒有先給預設值，光是 import
app.api.v1.endpoints.login 就會直接丟出 pydantic 驗證錯誤，
導致所有測試連 collect 都失敗。這裡用 setdefault，
如果 CI/本機已經有設定真正的值就不會覆蓋掉。
"""
import os

os.environ.setdefault("POSTGRES_USER", "test")
os.environ.setdefault("POSTGRES_PASSWORD", "test")
os.environ.setdefault("POSTGRES_DB", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
