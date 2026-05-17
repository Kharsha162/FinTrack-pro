import { sequelize } from "../db.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { Investment } from "../models/Investment.js";
import bcrypt from "bcryptjs";

async function main() {
  await sequelize.sync();
  const adminEmail = "admin@example.com";
  const existing = await User.findOne({ where: { email: adminEmail } });
  if (!existing) {
    const admin = await User.create({
      name: "Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash("AdminPass123", 10),
      role: "admin"
    });
    console.log("Created admin:", admin.email);
    const today = new Date();
    const sampleTx = [
      {
        type: "income",
        amount: 150000,
        category: "Salary",
        description: "Monthly salary credit",
        date: new Date(today.getFullYear(), today.getMonth(), 1),
        isRecurring: true,
        source: "manual"
      },
      {
        type: "expense",
        amount: 22000,
        category: "Rent",
        description: "Apartment rent",
        date: new Date(today.getFullYear(), today.getMonth(), 2),
        isRecurring: true,
        source: "manual"
      },
      {
        type: "expense",
        amount: 8500,
        category: "Groceries",
        description: "Monthly groceries",
        date: new Date(today.getFullYear(), today.getMonth(), 5),
        isRecurring: false,
        source: "manual"
      },
      {
        type: "expense",
        amount: 3200,
        category: "Utilities",
        description: "Electricity and broadband",
        date: new Date(today.getFullYear(), today.getMonth(), 8),
        isRecurring: true,
        source: "manual"
      }
    ];
    for (const t of sampleTx) {
      await Transaction.create({
        userId: admin.id,
        amount: t.amount,
        currency: "INR",
        ...t
      });
    }
    const budgets = [
      { category: "Groceries", limit: 12000, spent: 8500 },
      { category: "Rent", limit: 22000, spent: 22000 },
      { category: "Utilities", limit: 6000, spent: 3200 }
    ];
    for (const b of budgets) {
      await Budget.create({
        userId: admin.id,
        category: b.category,
        limit: b.limit,
        spent: b.spent,
        period: "monthly",
        currency: "INR"
      });
    }
    await Investment.create({
      userId: admin.id,
      symbol: "NSE:RELIANCE",
      quantity: 20,
      avgBuyPrice: 2800,
      currentPrice: 3045.6,
      currency: "INR"
    });
    await Investment.create({
      userId: admin.id,
      symbol: "NSE:HDFCBANK",
      quantity: 40,
      avgBuyPrice: 1500,
      currentPrice: 1598.2,
      currency: "INR"
    });
  }
  const preset = [
    { name: "Salary", type: "income" },
    { name: "Interest", type: "income" },
    { name: "Groceries", type: "expense" },
    { name: "Rent", type: "expense" },
    { name: "Utilities", type: "expense" },
    { name: "Transport", type: "expense" }
  ];
  for (const c of preset) {
    const exists = await Category.findOne({ where: { name: c.name } });
    if (!exists) await Category.create(c);
  }
  console.log("Seed complete");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
