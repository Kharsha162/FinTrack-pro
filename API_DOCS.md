# API Documentation

## Authentication (`/api/auth`)

- **POST /register**: `{ name, email, password }` -> Returns user & tokens.
- **POST /login**: `{ email, password }` -> Returns user & tokens.
- **POST /logout**: Invalidates tokens.
- **POST /refresh-token**: `{ refreshToken }` -> Returns new accessToken.

## Transactions (`/api/transactions`)

- **GET /**: List all transactions for the user.
- **POST /**: Create transaction `{ type, amount, category, description, date, isRecurring }`.
- **PUT /:id**: Update transaction.
- **DELETE /:id**: Delete transaction.

## Budgets (`/api/budgets`)

- **GET /**: List all budgets.
- **POST /**: Create budget `{ category, limit, period }`.
- **PUT /:id**: Update budget.
- **DELETE /:id**: Delete budget.

## Investments (`/api/investments`)

- **GET /positions**: Get current holdings with real-time price updates (Yahoo Finance).
- **POST /positions**: Add holding `{ symbol, quantity, avgBuyPrice }`.
- **GET /portfolio**: Get portfolio summary, history, and AI recommendations.

## Bank Integration (`/api/bank`)

- **GET /accounts**: List linked bank accounts.
- **POST /link/start**: Initiate OAuth flow.
- **GET /consent**: OAuth callback page.
- **POST /sync**: Sync transactions from mock bank.
- **POST /accounts/:id/unlink**: Unlink account.

## Analytics (`/api/analytics`)

- **GET /insights**: Returns spending categorization, budget forecasts, and anomaly detection (powered by ML service).

## Admin (`/api/admin`)

- **GET /users**: List all users (Admin only).
- **GET /audit-logs**: View system audit logs (Admin only).

## ML Service (Internal)

- **POST /categorize**: Suggest categories for transaction descriptions.
- **POST /analyze**: Analyze transaction history for anomalies and forecasts.
