# Turkey Rice POS System

This is a comprehensive POS system featuring:
- **Frontend**: React, TypeScript, TailwindCSS, Recharts.
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL.
- **Features**: Order Management, Kitchen Display System (KDS), Admin Dashboard (Analytics).

## Quick Start (Docker)

You can run the entire stack (Frontend + Backend + Database) using Docker.

### Prerequisites
- Docker and Docker Compose installed.

### Setup Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd TurkeyPOS
    ```

2.  **Configure Environment:**
    Copy the example environment file:
    ```bash
    cp .env_example .env
    ```
    *Note: The default credentials in `.env_example` are suitable for local development.*

3.  **Start the Application:**
    Run the following command to build and start all services:
    ```bash
    docker-compose up --build -d
    ```

4.  **Access the Application:**

    - **POS Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
    - **PgAdmin** (Database UI): [http://localhost:8080](http://localhost:8080)
        - *Email*: `admin@admin.com`
        - *Password*: `admin`

### Key Features
- **POS Page** (`/`): Interface for placing orders.
- **Kitchen Page** (`/kitchen`): Real-time kitchen display for chefs.
- **Admin Dashboard** (`/admin`): Sales analytics and daily trends.

## Local Development (Without Docker)

If you prefer to run services individually:

1.  **Backend**:
    ```bash
    cd app
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
