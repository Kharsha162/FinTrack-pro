# FinTech Platform

A complete, end-to-end fintech system featuring:

- **Backend**: Node.js, Express, Sequelize, PostgreSQL (Authentication, RBAC, Core APIs)
- **Frontend**: React, TypeScript, Tailwind CSS, Recharts (Dashboards, Analytics, Investments)
- **ML Service**: Python, FastAPI, Scikit-learn (Expense Categorization, Anomaly Detection, Forecasting)
- **Infrastructure**: Docker, Docker Compose (Containerization, Orchestration)
- **Integrations**:
  - **Mock Bank**: Open Banking-style consent flow and transaction sync.
  - **Stock Market**: Yahoo Finance integration and portfolio analysis.
  - **GoCharting**: Advanced technical charting iframe.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
- [Node.js](https://nodejs.org/) (optional, for local dev without Docker)

## Quick Start

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd <repo-folder>
    ```

2.  **Start the system**:
    ```bash
    docker-compose up --build
    ```
    *This command builds the frontend, backend, and ML images, starts PostgreSQL, and links everything.*

3.  **Access the Application**:
    - **Frontend**: [http://localhost:5173](http://localhost:5173)
    - **Backend API**: [http://localhost:4000](http://localhost:4000)
    - **ML Service**: [http://localhost:8000](http://localhost:8000)

4.  **Default Credentials**:
    - **Admin User**:
      - Email: `admin@example.com`
      - Password: `AdminPass123`
    - **New User**: You can register a new account on the login page.

## Architecture

- **PostgreSQL**: Primary database for users, transactions, budgets, investments.
- **Backend (Node.js)**: REST API gateway. Handles auth, business logic, and orchestrates calls to ML service.
- **ML Service (Python)**: Microservice for heavy computational tasks (categorization, isolation forest anomalies).
- **Frontend (React)**: SPA consuming the Backend API.

## Features

- **Dashboard**: Real-time overview of net worth, income/expense trends.
- **Transactions**: Add manual transactions or sync from Mock Bank.
- **Bank Link**: Simulate linking a bank account (OAuth flow) and syncing transactions.
- **Budgets**: Set category-wise limits and track spending.
- **Investments**: Track stock portfolio, get AI recommendations, and view GoCharting technical charts.
- **Analytics**: Deep dive into spending patterns and financial health.
- **Admin**: System-wide audit logs and user management (accessible only to Admin).

## Development

- **Frontend**: `cd frontend && npm install && npm run dev`
- **Backend**: `cd backend && npm install && npm run dev`
- **ML**: `cd ml-services && pip install -r requirements.txt && uvicorn app:app --reload`
