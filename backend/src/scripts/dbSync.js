import "../models/User.js";
import "../models/Transaction.js";
import "../models/Budget.js";
import "../models/BankAccount.js";
import "../models/BankTransaction.js";
import "../models/Investment.js";
import "../models/Notification.js";
import "../models/AuditLog.js";
import "../models/Category.js";
import "../models/associations.js";
import { sequelize } from "../db.js";

async function main() {
  console.log("Checking database connection...");
  let connected = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!connected && attempts < maxAttempts) {
    try {
      await sequelize.authenticate();
      connected = true;
      console.log("Database connection established.");
    } catch (err) {
      attempts++;
      console.log(`Connection attempt ${attempts} failed. Retrying in 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (!connected) {
    console.error("Could not connect to the database after multiple attempts.");
    process.exit(1);
  }

  await sequelize.sync({ alter: true });
  console.log("Database synced");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

