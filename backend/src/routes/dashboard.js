import express from "express";
import { authenticate } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

router.get("/overview", authenticate, async (req, res) => {
  const tx = await Transaction.findAll({ where: { userId: req.user.id } });
  const budgets = await Budget.findAll({ where: { userId: req.user.id } });
  const notifications = await Notification.findAll({ where: { userId: req.user.id }, order: [["id", "DESC"]] });
  let cashInr = 0;
  let investmentsInr = 0;
  for (const t of tx) {
    if (t.type === "income") cashInr += Number(t.amount);
    else cashInr -= Number(t.amount);
  }
  investmentsInr = Math.max(0, Math.round(cashInr * 0.3));
  const totalBalanceInr = cashInr + investmentsInr;
  const monthlyMap = new Map();
  for (const t of tx) {
    const month = new Date(t.date).toISOString().slice(0, 7);
    const entry = monthlyMap.get(month) || { month, income: 0, expenses: 0 };
    if (t.type === "income") entry.income += Number(t.amount);
    else entry.expenses += Number(t.amount);
    monthlyMap.set(month, entry);
  }
  const monthlyCashflow = Array.from(monthlyMap.values()).slice(-12);
  const catMap = new Map();
  for (const t of tx.filter(t => t.type === "expense")) {
    const v = catMap.get(t.category) || 0;
    catMap.set(t.category, v + Number(t.amount));
  }
  const categoryBreakdown = Array.from(catMap.entries()).map(([category, amount]) => ({ category, amount }));
  const healthScore = Math.max(30, Math.min(95, Math.round(100 - (categoryBreakdown.reduce((a, b) => a + b.amount, 0) / Math.max(1, cashInr)) * 50)));
  const alerts = notifications.map(n => ({ id: n.id, type: n.type, message: n.message, priority: n.priority }));
  res.json({
    balances: { totalBalanceInr: Math.round(totalBalanceInr), cashInr: Math.round(cashInr), investmentsInr },
    monthlyCashflow,
    categoryBreakdown,
    healthScore,
    alerts,
    budgets: budgets.map(b => ({ id: b.id, category: b.category, limit: Number(b.limit), spent: Number(b.spent), period: b.period, currency: b.currency })),
    recentTransactions: tx.slice(-10).reverse().map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      category: t.category,
      description: t.description || "",
      date: new Date(t.date).toISOString(),
      isRecurring: t.isRecurring,
      source: t.source
    }))
  });
});

export default router;

