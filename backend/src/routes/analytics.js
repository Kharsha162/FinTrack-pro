import express from "express";
import { authenticate } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { DemoTrade } from "../models/DemoTrade.js";
import { DemoAccount } from "../models/DemoAccount.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

router.get("/summary", authenticate, async (req, res) => {
  try {
    const tx = await Transaction.findAll({ where: { userId: req.user.id } });
    const budgets = await Budget.findAll({ where: { userId: req.user.id } });
    
    // Demo Trading Stats
    const demoAccount = await DemoAccount.findOne({ where: { userId: req.user.id } });
    const trades = demoAccount ? await DemoTrade.findAll({ where: { accountId: demoAccount.id } }) : [];

    let totalIncome = 0;
    let totalExpenses = 0;
    const expenseByCategory = new Map();

    for (const t of tx) {
      const amount = Number(t.amount);
      if (t.type === "income") {
        totalIncome += amount;
      } else if (t.type === "expense") {
        totalExpenses += amount;
        const key = t.category || "Uncategorized";
        const current = expenseByCategory.get(key) || 0;
        expenseByCategory.set(key, current + amount);
      }
    }

    const balance = totalIncome - totalExpenses;

    // --- Production Health Score Logic ---
    // 1. Savings Rate (30% weight)
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) : 0;
    const savingsScore = Math.min(1, savingsRate / 0.2) * 30; // 20% savings = full 30 points

    // 2. Expense Ratio (30% weight)
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) : 1;
    const expenseScore = Math.max(0, (1 - expenseRatio)) * 30; // Lower expense = more points

    // 3. Budget Discipline (20% weight)
    const overBudgetCount = budgets.filter(b => {
      const spent = expenseByCategory.get(b.category) || 0;
      return spent > Number(b.limit);
    }).length;
    const budgetScore = budgets.length > 0 ? ((budgets.length - overBudgetCount) / budgets.length) * 20 : 20;

    // 4. Debt/EMI Burden (20% weight)
    const emiBudget = budgets.find(b => b.category.toLowerCase().includes('emi'));
    const emiLimit = emiBudget ? Number(emiBudget.limit) : 0;
    const emiRatio = totalIncome > 0 ? (emiLimit / totalIncome) : 0;
    const debtScore = Math.max(0, (1 - (emiRatio / 0.4))) * 20; // EMI > 40% income = 0 points

    const healthScore = Math.round(savingsScore + expenseScore + budgetScore + debtScore);
    const healthLabel = healthScore > 70 ? "Excellent" : healthScore > 40 ? "Fair" : "Poor";

    // Trading P&L
    let tradingPnL = 0; // Realized P&L
    let openTradesCount = 0;
    
    trades.forEach(t => {
        if (t.status === 'closed' && t.profit) {
            tradingPnL += Number(t.profit);
        }
        if (t.status === 'open') {
            openTradesCount++;
        }
    });

    const demoEquity = demoAccount ? Number(demoAccount.equity || 0) : 0;
    // Net Worth = Real World Savings + Demo Trading Account Equity
    const netWorth = balance + demoEquity;

    const budgetSummaries = budgets.map(b => {
      const limit = Number(b.limit);
      const actual = expenseByCategory.get(b.category) || 0;
      const variance = limit - actual;
      return {
        category: b.category,
        limit,
        actual,
        variance,
        period: b.period
      };
    });

    res.json({
      totalIncome,
      totalExpenses,
      balance, // Net Savings (Income - Expense)
      netWorth, // Combined
      tradingPnL,
      openTradesCount,
      healthScore,
      healthLabel,
      budgets: budgetSummaries
    });
  } catch (err) {
    console.error("Analytics Summary Error:", err);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

router.get("/insights", authenticate, async (req, res) => {
  try {
    // Fetch recent fraud notifications
    const alerts = await Notification.findAll({
      where: { 
        userId: req.user.id,
        type: "FRAUD_ALERT" 
      },
      order: [["createdAt", "DESC"]],
      limit: 20
    });

    const anomalies = alerts.map(a => ({
      category: a.priority === "high" ? "Critical Alert" : "Warning",
      reason: a.message,
      date: a.createdAt
    }));

    res.json({ anomalies });
  } catch (err) {
    console.error("Analytics Insights Error:", err);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

router.get("/monthly", authenticate, async (req, res) => {
  try {
    const tx = await Transaction.findAll({ where: { userId: req.user.id } });
    const demoAccount = await DemoAccount.findOne({ where: { userId: req.user.id } });
    const trades = demoAccount ? await DemoTrade.findAll({ where: { accountId: demoAccount.id } }) : [];

    const monthlyMap = new Map();

    // Transactions
    for (const t of tx) {
      const month = new Date(t.date).toISOString().slice(0, 7);
      const amount = Number(t.amount);
      const entry = monthlyMap.get(month) || { month, income: 0, expenses: 0, tradingPnL: 0 };
      if (t.type === "income") {
        entry.income += amount;
      } else if (t.type === "expense") {
        entry.expenses += amount;
      }
      monthlyMap.set(month, entry);
    }

    // Trading P&L (Realized only)
    for (const t of trades) {
        if (t.status === 'closed' && t.closedAt) {
            const month = new Date(t.closedAt).toISOString().slice(0, 7);
            const entry = monthlyMap.get(month) || { month, income: 0, expenses: 0, tradingPnL: 0 };
            entry.tradingPnL += Number(t.profit);
            monthlyMap.set(month, entry);
        }
    }

    const rows = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(entry => ({
        month: entry.month,
        income: entry.income,
        expenses: entry.expenses,
        tradingPnL: entry.tradingPnL
      }));

    res.json(rows);
  } catch (err) {
    console.error("Analytics Monthly Error:", err);
    res.status(500).json({ error: "Failed to load monthly data" });
  }
});

router.get("/categories", authenticate, async (req, res) => {
  try {
    const tx = await Transaction.findAll({ where: { userId: req.user.id } });
    const demoAccount = await DemoAccount.findOne({ where: { userId: req.user.id } });
    const trades = demoAccount ? await DemoTrade.findAll({ where: { accountId: demoAccount.id } }) : [];
    
    const catMap = new Map();

    for (const t of tx) {
      if (t.type !== "expense") continue;
      const key = t.category || "Uncategorized";
      const current = catMap.get(key) || 0;
      catMap.set(key, current + Number(t.amount));
    }
    
    // Add Trading Loss / Profit
    let tradingProfit = 0;
    let tradingLoss = 0;
    
    trades.forEach(t => {
        if (t.status === 'closed' && t.profit) {
            const p = Number(t.profit);
            if (p >= 0) tradingProfit += p;
            else tradingLoss += Math.abs(p);
        }
    });

    if (tradingProfit > 0) catMap.set("Trading Profit", tradingProfit);
    if (tradingLoss > 0) catMap.set("Trading Loss", tradingLoss);

    const categorizedExpenses = Array.from(catMap.entries()).map(([category, amount]) => ({
      category,
      amount
    }));

    res.json(categorizedExpenses);
  } catch (err) {
    console.error("Analytics Categories Error:", err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

router.get("/investments", authenticate, async (req, res) => {
  try {
    const demoAccount = await DemoAccount.findOne({ where: { userId: req.user.id } });
    const trades = demoAccount ? await DemoTrade.findAll({ where: { accountId: demoAccount.id } }) : [];
    
    let totalInvested = 0;
    let realizedPnL = 0;
    
    trades.forEach(t => {
      if (t.status === 'closed') {
        realizedPnL += Number(t.profit);
      } else {
        // Open trade
        const vol = Number(t.volume);
        totalInvested += (Number(t.entryPrice) * vol);
      }
    });

    const equity = demoAccount ? Number(demoAccount.equity || 0) : 0;
    const balance = demoAccount ? Number(demoAccount.balance || 0) : 0; 
    
    // Market Value = Equity - Balance (Cash)
    // Note: This is an approximation if equity isn't updated real-time. 
    // Ideally, frontend sends current prices to calculate this, or we use stored 'equity'.
    const marketValue = Math.max(0, equity - balance);

    res.json({
      totalInvested,
      currentValue: marketValue,
      realizedPnL,
      unrealizedPnL: marketValue - totalInvested,
      cashBalance: balance,
      equity
    });
  } catch (err) {
    console.error("Analytics Investments Error:", err);
    res.status(500).json({ error: "Failed to load investment analytics" });
  }
});

router.get("/health", authenticate, async (req, res) => {
  try {
    const tx = await Transaction.findAll({ where: { userId: req.user.id } });
    const budgets = await Budget.findAll({ where: { userId: req.user.id } });

    let totalIncome = 0;
    let totalExpenses = 0;
    const expenseByCategory = new Map();

    for (const t of tx) {
      const amount = Number(t.amount);
      if (t.type === "income") totalIncome += amount;
      else if (t.type === "expense") {
        totalExpenses += amount;
        const key = t.category || "Uncategorized";
        expenseByCategory.set(key, (expenseByCategory.get(key) || 0) + amount);
      }
    }

    const balance = totalIncome - totalExpenses;

    // Logic Mirroring /summary for consistency
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) : 0;
    const savingsScore = Math.min(1, savingsRate / 0.2) * 30;

    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) : 1;
    const expenseScore = Math.max(0, (1 - expenseRatio)) * 30;

    const overBudgetCount = budgets.filter(b => {
      const spent = expenseByCategory.get(b.category) || 0;
      return spent > Number(b.limit);
    }).length;
    const budgetScore = budgets.length > 0 ? ((budgets.length - overBudgetCount) / budgets.length) * 20 : 20;

    const emiBudget = budgets.find(b => b.category.toLowerCase().includes('emi'));
    const emiLimit = emiBudget ? Number(emiBudget.limit) : 0;
    const emiRatio = totalIncome > 0 ? (emiLimit / totalIncome) : 0;
    const debtScore = Math.max(0, (1 - (emiRatio / 0.4))) * 20;

    const score = Math.round(savingsScore + expenseScore + budgetScore + debtScore);
    const status = score > 70 ? "Excellent" : score > 40 ? "Fair" : "Poor";

    res.json({
      score,
      status,
      details: {
        savingsRate: Math.round(savingsRate * 100),
        budgetAdherence: budgets.length > 0 ? Math.round(((budgets.length - overBudgetCount) / budgets.length) * 100) : 100,
        expenseRatio: Math.round(expenseRatio * 100),
        debtBurden: Math.round(emiRatio * 100)
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate health score" });
  }
});

router.post("/loan-eligibility", authenticate, async (req, res) => {
  try {
    const { salary, age, creditScore, loanAmount, tenureMonths } = req.body;
    
    // Rule-based Decision Engine
    let eligible = true;
    const reasons = [];

    if (age < 21 || age > 60) {
      eligible = false;
      reasons.push("Age must be between 21 and 60");
    }
    if (salary < 25000) {
      eligible = false;
      reasons.push("Minimum salary required is ₹25,000");
    }
    if (creditScore < 650) {
      eligible = false;
      reasons.push("Credit score too low (min 650)");
    }

    // EMI Calculation: P * r * (1+r)^n / ((1+r)^n - 1)
    const annualRate = creditScore > 750 ? 0.105 : 0.125;
    const monthlyRate = annualRate / 12;
    const emi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1));

    if (emi > salary * 0.5) {
      eligible = false;
      reasons.push("EMI exceeds 50% of monthly salary");
    }

    res.json({
      eligible,
      reasons,
      emi,
      interestRate: (annualRate * 100).toFixed(1),
      totalRepayment: emi * tenureMonths,
      processingFee: Math.round(loanAmount * 0.01)
    });
  } catch (err) {
    res.status(500).json({ error: "Loan check failed" });
  }
});

router.post("/upi-simulate", authenticate, async (req, res) => {
  try {
    const { receiverVpa, amount, note } = req.body;
    const userId = req.user.id;

    // Create a transaction record
    const tx = await Transaction.create({
      userId,
      type: 'expense',
      amount,
      category: 'UPI Transfer',
      description: `Sent to ${receiverVpa}: ${note}`,
      date: new Date(),
      source: 'manual'
    });

    res.json({
      status: 'success',
      transactionId: `TXN${Date.now()}${tx.id}`,
      vpa: receiverVpa,
      amount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: "UPI simulation failed" });
  }
});

export default router;
