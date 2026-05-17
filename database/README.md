# Database

PostgreSQL 15 schema managed via Sequelize models and sync on startup. Seed data creates an admin user and common categories.

## Tables
- users, transactions, budgets, bank_accounts, bank_transactions, investments, notifications, audit_logs, categories

## Migrations/Seeds
- Sync and seed executed in backend container entrypoint:
  - `node src/scripts/dbSync.js`
  - `node src/scripts/seed.js`

## Indexes and Constraints
- Unique email on users.
- Indexes on transactions(user_id,date), budgets(user_id,category), bank_transactions(bank_account_id,date), investments(user_id,symbol).

