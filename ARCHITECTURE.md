# Architecture

## Overview
- Frontend: React + TypeScript + Tailwind; accessible components, dashboards, bank linking, admin.
- Backend: Node.js + Express + Sequelize + PostgreSQL; JWT + refresh, RBAC, APIs, audit logs.
- ML Service: Python FastAPI; categorization, patterns, forecasting, anomaly detection, health score.
- DevOps: Dockerfiles for all services; docker-compose orchestration; environment-driven configs.

## Data Model
- users(id, name, email unique, password_hash, role)
- transactions(id, user_id FK, type enum, amount, currency, category, description, date, is_recurring, source)
- budgets(id, user_id FK, category, limit, spent, period, currency)
- bank_accounts(id, user_id FK, provider, name, balance, currency, last_synced_at, status, access_token)
- bank_transactions(id, bank_account_id FK, date, description, amount, type, category_hint)
- investments(id, user_id FK, symbol, quantity, avg_buy_price, currency, current_price)
- notifications(id, user_id FK, type, message, priority enum, read)
- audit_logs(id, actor_email, action, created_at)
- categories(id, name unique, type enum)

## Security
- Password hashing (bcrypt), JWT access + refresh, role-based middleware.
- Helmet, CORS, input validation/sanitization via express-validator.
- No credential storage for banks; consent-style tokens (mock provider).

## Flows
- Auth: Register/Login returns tokens; refresh rotates; logout invalidates client state.
- Bank Linking: Start returns consent URL; after approve, auto-redirect; sync pulls mock data and creates transactions.
- Analytics: Backend aggregates data and calls ML service; returns explainable insights.
- Stocks: Backend fetches Yahoo Finance chart data for current prices; portfolio analysis computed server-side.
- Admin: Manage roles, categories; audit logs recorded for sensitive actions.

## Accessibility
- Semantic HTML, ARIA labels, keyboard navigation, screen-reader support, contrast and validation.
- Forms provide clear errors; tables and charts are labelled and navigable.

