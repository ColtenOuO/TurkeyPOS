# TurkeyPOS System / 火雞肉飯 POS 系統

[English](#english) | [中文](#chinese)

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)

---

<a name="english"></a>
## English

### Overview
TurkeyPOS (v1.1.0) is a modern, web-based Point of Sale (POS) system designed specifically for turkey rice restaurants, **but it is highly adaptable for other types of small eateries (e.g., noodle shops, bento places) by simply customizing the menu data.**

It features a responsive POS interface for ordering, a real-time Kitchen Display System (KDS), and an Admin Dashboard for sales analytics and store management.

### Tech Stack
*   **Frontend**: React, TypeScript, TailwindCSS, Vite
*   **Backend**: FastAPI, SQLAlchemy, PostgreSQL
*   **Database**: PostgreSQL
*   **Containerization**: Docker, Docker Compose
*   **Environment Management**: Conda (`environment.yml`)

### Features
*   **POS Interface**: 
    *   Category-first menu navigation.
    *   Support for Dine-in and Takeout orders.
    *   Cart management with customizable options.
    *   Virtual keypads for table numbers and change calculation.
*   **Kitchen Display System (KDS)**:
    *   Real-time order updates.
    *   Clear distinction between Dine-in and Takeout (Blue Badge) orders.
    *   One-click order completion.
*   **Admin Dashboard**:
    *   Sales overview (Daily revenue, Order counts).
    *   Menu management (Add/Edit/Delete items, Soft delete).
    *   Store management (Multi-store support).

### Installation & Setup

#### Method 1: Docker (Recommended)
You can bring up the entire stack (Frontend, Backend, Database) with a single command.

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd TurkeyPOS
    ```

2.  **Configure Environment**:
    Copy the example environment file:
    ```bash
    cp .env_example .env
    ```
    *Note: Check `.env` to ensure `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc., are set.*

3.  **Start Services**:
    ```bash
    docker-compose up --build -d
    ```

4.  **Access the Application**:
    *   **POS / Root**: [http://localhost:3000](http://localhost:3000)
    *   **Kitchen**: [http://localhost:3000/kitchen](http://localhost:3000/kitchen)
    *   **Admin Dashboard**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
    *   **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Method 2: Conda (Recommended for Local Dev)
For local development without Docker, it is recommended to use Conda to manage the Python environment.

1.  **Create Environment**:
    ```bash
    conda env create -f environment.yml
    ```
2.  **Activate Environment**:
    ```bash
    conda activate turkey-pos
    ```
3.  **Run Backend**:
    Ensure PostgreSQL is running locally.
    ```bash
    uvicorn app.main:app --reload
    ```

#### Method 3: Manual Pip Setup

**Backend**:
1.  Navigate to `app` directory (or root depending on structure, assuming `requirements.txt` is in root):
    ```bash
    pip install -r requirements.txt
    ```
2.  Ensure local PostgreSQL is running and `.env` is configured to point to it.
3.  Run database migrations (or init scripts).
4.  Start the server:
    ```bash
    uvicorn app.main:app --reload
    ```

**Frontend**:
1.  Navigate to `frontend`:
    ```bash
    cd frontend
    npm install
    ```
2.  Start dev server:
    ```bash
    npm run dev
    ```

### Deployment (Production)

The system automatically proxies API requests, so you generally **do not need** to change the API URL.

1.  **Standard Build**:
    ```bash
    docker-compose up --build -d
    ```
    The frontend is configured to send requests to `/api/v1` by default. Nginx handles the routing internally, so no manual configuration is needed.

2.  **Initialize Database (Fresh Install Only)**:
    If this is a new server, you must run migrations:
    ```bash
    docker-compose exec api alembic upgrade head
    ```
    *(Optional) Seed with sample data:*
    ```bash
    docker-compose exec api python scripts/seed_db.py
    ```

### Configuration (.env)

Setting up the `.env` file, pay special attention to the following variables:

| Variable Name | Description | Default / Example |
| :--- | :--- | :--- |
| `POSTGRES_USER` | Database user | `admin` |
| `POSTGRES_PASSWORD` | Database password | `admin` |
| `POSTGRES_DB` | Database name | `turkey_pos_db` |
| `SECRET_KEY` | JWT encryption key | **MUST be changed to a random string** |
| `ADMIN_PASSWORD` | Admin login password | `admin_secret` |

### Usage Guide

1.  **Admin Login**:
    *   Go to `/store-login` (or `/admin` redirects there).
    *   Select **"Admin (管理員)"** from the dropdown.
    *   Password: `admin` (or as configured in `.env`).
    *   *Note: Admin session expires in 30 minutes.*

2.  **Store Login**:
    *   Select a specific store.
    *   Password: `password` (Default sample password).

3.  **Kitchen Display**:
    *   Log in as a store.
    *   Navigate to `/kitchen`.
    *   Orders appear here instantly when placed from POS.

---

<a name="chinese"></a>
## 中文 (Chinese)

### 專案簡介
TurkeyPOS (v1.1.0) 是一個專為火雞肉飯餐飲店設計的現代化 POS 點餐系統，**但其設計極具彈性，透過客製化菜單資料，也可輕易應用於其他類型的小吃店（如麵店、便當店）。**

它整合了前台點餐、廚房接單系統 (KDS) 以及後台管理儀表板，提供流暢的餐飲運作流程。

### 技術架構
*   **前端**: React, TypeScript, TailwindCSS, Vite
*   **後端**: FastAPI, SQLAlchemy, PostgreSQL
*   **資料庫**: PostgreSQL
*   **容器化**: Docker, Docker Compose
*   **環境管理**: Conda (`environment.yml`)

### 功能特色
*   **POS 點餐介面**:
    *   以「分類」為優先的瀏覽模式，直覺好操作。
    *   支援「內用」與「外帶」模式切換。
    *   購物車管理與客製化選項（如：加蛋、加辣）。
    *   **虛擬鍵盤**: 支援桌號輸入（數字+英文）與找零計算（純數字小鍵盤）。
*   **廚房接單系統 (KDS)**:
    *   即時顯示新訂單。
    *   清楚標示「外帶」訂單（藍色標籤）。
    *   一鍵完成訂單功能。
    *   支援「回到點餐」快速切換。
*   **後台管理**:
    *   銷售概況（每日營收、訂單量）。
    *   菜單管理（新增/修改/刪除餐點，支援軟刪除）。
    *   分店管理（多店支援）。

### 安裝與設定

#### 方法一：使用 Docker (推薦)
透過 Docker Compose 可以一鍵啟動所有服務（前端、後端、資料庫）。

1.  **複製專案**:
    ```bash
    git clone <repository_url>
    cd TurkeyPOS
    ```

2.  **設定環境變數**:
    複製範例設定檔：
    ```bash
    cp .env_example .env
    ```
    *注意：請檢查 `.env` 檔案中的資料庫設定是否正確。*

3.  **啟動服務**:
    ```bash
    docker-compose up --build -d
    ```

4.  **開啟應用程式**:
    *   **POS 點餐頁**: [http://localhost:3000](http://localhost:3000)
    *   **廚房系統**: [http://localhost:3000/kitchen](http://localhost:3000/kitchen)
    *   **後台管理**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
    *   **API 文件**: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 方法二：使用 Conda (本地開發推薦)
若不使用 Docker，建議使用 Conda 來管理 Python 環境。

1.  **建立環境**:
    ```bash
    conda env create -f environment.yml
    ```
2.  **啟用環境**:
    ```bash
    conda activate turkey-pos
    ```
3.  **啟動後端**:
    確保本地 PostgreSQL 已啟動。
    ```bash
    uvicorn app.main:app --reload
    ```

#### 方法三：手動安裝 (Pip)

**後端 (Backend)**:
1.  安裝依賴套件：
    ```bash
    pip install -r requirements.txt
    ```
2.  確認本地 PostgreSQL 資料庫已啟動，並設定 `.env`。
3.  初始化資料庫（如需載入範例資料）：
    ```bash
    python scripts/seed_db.py
    ```
4.  啟動伺服器：
    ```bash
    uvicorn app.main:app --reload
    ```

**前端 (Frontend)**:
1.  進入 frontend 目錄：
    ```bash
    cd frontend
    npm install
    ```
2.  啟動開發伺服器：
    ```bash
    npm run dev
    ```

### 部署說明 (Production Deployment)

系統已設定自動代理 API 請求，因此您通常 **不需要** 修改 API 網址。

1.  **標準部署**:
    ```bash
    docker-compose up --build -d
    ```
    前端預設會將請求發送至 `/api/v1`，Nginx 會自動處理內部轉發，無需手動設定。

2.  **初始化資料庫 (僅首次安裝)**:
    若是新伺服器，請務必執行資料庫遷移指令：
    ```bash
    docker-compose exec api alembic upgrade head
    ```
    *(選用) 載入範例資料：*
    ```bash
    docker-compose exec api python scripts/seed_db.py
    ```

### 設定說明 (.env)

設定 `.env` 檔案時，請特別留意以下變數：

| 變數名稱 | 說明 | 預設值 / 範例 |
| :--- | :--- | :--- |
| `POSTGRES_USER` | 資料庫使用者 | `admin` |
| `POSTGRES_PASSWORD` | 資料庫密碼 | `admin` |
| `POSTGRES_DB` | 資料庫名稱 | `turkey_pos_db` |
| `SECRET_KEY` | JWT 加密金鑰 | **請務必修改為隨機字串** |
| `ADMIN_PASSWORD` | 管理員登入密碼 | `admin_secret` |

### 開始使用 (Getting Started)

1.  **首次設定 (重要)**:
    *   **管理員登入**:
        *   進入登入頁面。
        *   選擇 **"Admin (管理員)"**。
        *   密碼: `admin_secret` (或您設定的 `ADMIN_PASSWORD`)。
    *   **建立分店**:
        *   前往 **"分店管理" (Store Management)**。
        *   新增您的第一間分店（例如：「總店」）。
        *   設定分店密碼。
    *   **登出**: 您現在可以切換為分店身份開始點餐。

2.  **分店登入**:
    *   選擇您剛剛建立的分店。
    *   密碼: 您剛剛設定的分店密碼。

3.  **操作流程**:
    *   店員在 POS 頁面點餐 -> 結帳。
    *   廚房在 `/kitchen` 頁面看到訂單 -> 製作完成後點選完成。
