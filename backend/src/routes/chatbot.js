import express from "express";
import { authenticate } from "../middleware/auth.js";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { DemoAccount } from "../models/DemoAccount.js";
import { DemoTrade } from "../models/DemoTrade.js";
import { Op } from "sequelize";

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMsg = message.toLowerCase();
    const userId = req.user.id;

    // 1. Gather Context Data
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Transactions this month
    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: { [Op.gte]: startOfMonth }
      }
    });

    // All-time budgets
    const budgets = await Budget.findAll({ where: { userId } });

    // Investment / Demo Account
    const demoAccount = await DemoAccount.findOne({ where: { userId } });
    const trades = demoAccount ? await DemoTrade.findAll({ where: { accountId: demoAccount.id } }) : [];

    // 2. Process Data
    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpend = {};

    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'income') totalIncome += amt;
      else if (t.type === 'expense') {
        totalExpense += amt;
        const cat = t.category ? t.category.toLowerCase() : 'uncategorized';
        categorySpend[cat] = (categorySpend[cat] || 0) + amt;
      }
    });

    const savings = totalIncome - totalExpense;
    const balance = demoAccount ? Number(demoAccount.balance) : 0;
    const equity = demoAccount ? Number(demoAccount.equity) : 0;
    
    // 3. Rule-Based Intent Matching

    // Greeting
    if (lowerMsg.includes("hello") || lowerMsg.includes("hi ") || lowerMsg === "hi" || lowerMsg.includes("help")) {
      return res.json({ 
        reply: `Hello! I'm your FinTrack AI Advisor. I've analyzed your finances: you have ₹${balance.toLocaleString('en-IN')} in your trading account and have saved ₹${savings.toLocaleString('en-IN')} this month. How can I help you today?`,
        source: "rules"
      });
    }

    // Intent: What is my total income?
    if (lowerMsg.includes("total income")) {
      return res.json({
        reply: `Your total income for this month is ₹${totalIncome.toLocaleString('en-IN')}.`,
        source: "rules"
      });
    }

    // Intent: How much have I spent this month?
    if (lowerMsg.includes("spent this month") || (lowerMsg.includes("how much") && lowerMsg.includes("spent"))) {
      const topCat = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];
      let reply = `You have spent a total of ₹${totalExpense.toLocaleString('en-IN')} this month.`;
      if (topCat) {
        reply += ` Your biggest expense category is **${topCat[0]}** (₹${topCat[1].toLocaleString('en-IN')}).`;
      }
      return res.json({ reply, source: "rules" });
    }

    // Intent: Can I afford to trade today? / Today I am going to trade
    if (lowerMsg.includes("afford to trade") || lowerMsg.includes("going to trade") || lowerMsg.includes("should i trade")) {
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
      const emiBudget = budgets.find(b => b.category.toLowerCase().includes('emi'));
      const overBudgets = budgets.filter(b => Number(b.spent) > Number(b.limit)).length;

      let advice = "";
      let status = "ok";

      if (balance < 10000 || savingsRate < 10 || overBudgets > 0) {
        status = "poor";
        advice = `❌ **Advisory: Trading is risky right now.**\n\n- **Balance:** Your trading balance is ₹${balance.toLocaleString('en-IN')}.\n- **Savings Rate:** ${savingsRate.toFixed(1)}% (Target: >15%).\n- **Budget:** You are over budget in ${overBudgets} categories.\n\nI recommend focusing on saving and clearing pending obligations before taking new trades.`;
      } else {
        status = "good";
        advice = `✅ **Financial Condition: Stable.**\n\nYour finances look solid with a ${savingsRate.toFixed(1)}% savings rate and sufficient balance (₹${balance.toLocaleString('en-IN')}).\n\n**Trading Plan:**\n1. Use a maximum of **1-2% risk** per trade.\n2. Ensure your stop-loss is set.\n3. Avoid over-leveraging. Happy trading!`;
      }

      return res.json({ reply: advice, source: "rules" });
    }

    // Intent: Give me a saving plan
    if (lowerMsg.includes("saving plan") || lowerMsg.includes("how to save")) {
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
      let plan = "### Your Personalized Saving Plan\n\n";
      
      if (savingsRate < 20) {
        const targetSavings = totalIncome * 0.2;
        const gap = targetSavings - savings;
        plan += `1. **Target 20%:** You're currently at ${savingsRate.toFixed(1)}%. You need to save ₹${gap.toLocaleString('en-IN')} more to reach the 20% benchmark.\n`;
      }
      
      const highestExpense = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];
      if (highestExpense) {
        plan += `2. **Optimize ${highestExpense[0]}:** You spent ₹${highestExpense[1].toLocaleString('en-IN')} here. Reducing this by 10% would save you ₹${(highestExpense[1] * 0.1).toLocaleString('en-IN')}.\n`;
      }
      
      plan += `3. **Automate:** Set up a recurring transfer to your savings account right after salary credit.\n`;
      plan += `4. **Emergency Fund:** Ensure you have 3-6 months of expenses in a liquid account.`;

      return res.json({ reply: plan, source: "rules" });
    }

    // Intent: How is my financial health?
    if (lowerMsg.includes("financial health")) {
      // Calculate a quick health score
      const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 1;
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
      const budgetAdherence = budgets.length > 0 ? (budgets.filter(b => Number(b.spent) <= Number(b.limit)).length / budgets.length) * 100 : 100;
      
      const score = Math.round((savingsRate * 0.4) + (budgetAdherence * 0.4) + ((1 - expenseRatio) * 20));
      const rating = score > 70 ? "Excellent" : score > 40 ? "Fair" : "Poor";
      const color = score > 70 ? "✅" : score > 40 ? "⚠️" : "❌";

      return res.json({
        reply: `${color} Your Financial Health Score is **${score}/100** (**${rating}**).\n\n- **Savings Rate:** ${savingsRate.toFixed(1)}%\n- **Budget Adherence:** ${budgetAdherence.toFixed(1)}%\n- **Expense Ratio:** ${(expenseRatio * 100).toFixed(1)}%`,
        source: "rules"
      });
    }

    // Spending / Expenses
    if (lowerMsg.includes("spend") || lowerMsg.includes("spent") || lowerMsg.includes("expense")) {
      // Check for specific category
      const categories = Object.keys(categorySpend);
      const foundCat = categories.find(c => lowerMsg.includes(c));
      
      if (foundCat) {
        return res.json({
          reply: `You have spent ₹${categorySpend[foundCat].toLocaleString('en-IN')} on ${foundCat} this month.`,
          source: "rules"
        });
      }
      
      // General spending
      const topCat = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0];
      let reply = `Total expenses this month: ₹${totalExpense.toLocaleString('en-IN')}.`;
      if (topCat) {
        reply += ` Your highest spending category is ${topCat[0]} (₹${topCat[1].toLocaleString('en-IN')}).`;
      }
      return res.json({ reply, source: "rules" });
    }

    // Income / Salary
    if (lowerMsg.includes("income") || lowerMsg.includes("earn") || lowerMsg.includes("salary")) {
      return res.json({
        reply: `Your total recorded income for this month is ₹${totalIncome.toLocaleString('en-IN')}.`,
        source: "rules"
      });
    }

    // Savings
    if (lowerMsg.includes("save") || lowerMsg.includes("savings") || lowerMsg.includes("left")) {
      if (savings > 0) {
        return res.json({
          reply: `You have saved ₹${savings.toLocaleString('en-IN')} this month! That's about ${((savings/totalIncome)*100).toFixed(1)}% of your income. Keep it up!`,
          source: "rules"
        });
      } else {
        return res.json({
          reply: `Currently, your expenses exceed your income by ₹${Math.abs(savings).toLocaleString('en-IN')} this month. Try to cut down on discretionary spending.`,
          source: "rules"
        });
      }
    }

    // Budget
    if (lowerMsg.includes("budget")) {
        if (budgets.length === 0) {
            return res.json({
                reply: "You haven't set any budgets yet. Setting a budget for categories like 'Food' or 'Travel' can help you save more!",
                source: "rules"
            });
        }
        // Check for over-budget
        const alerts = [];
        budgets.forEach(b => {
            const cat = b.category.toLowerCase();
            const spent = categorySpend[cat] || 0;
            const limit = Number(b.limit);
            if (spent > limit) {
                alerts.push(`${b.category} (Over by ₹${(spent - limit).toLocaleString('en-IN')})`);
            }
        });
        
        if (alerts.length > 0) {
            return res.json({
                reply: `Alert: You have exceeded your budget for: ${alerts.join(", ")}.`,
                source: "rules"
            });
        }
        
        return res.json({
            reply: `You are within your budget limits for all categories! Good job.`,
            source: "rules"
        });
    }

    // Investments / Trading
    if (lowerMsg.includes("invest") || lowerMsg.includes("trade") || lowerMsg.includes("stock") || lowerMsg.includes("portfolio")) {
        const openTrades = trades.filter(t => t.status === 'open');
        const profitTrades = trades.filter(t => t.status === 'closed' && Number(t.profit) > 0);
        
        return res.json({
            reply: `Your Demo Trading Portfolio:\n- Balance: ₹${balance.toLocaleString('en-IN')}\n- Equity: ₹${equity.toLocaleString('en-IN')}\n- Open Positions: ${openTrades.length}\n- Profitable Trades: ${profitTrades.length}`,
            source: "rules"
        });
    }
    
    // Net Worth / Total Balance
    if (lowerMsg.includes("net worth") || lowerMsg.includes("total balance") || lowerMsg.includes("how much i have") || lowerMsg.includes("total")) {
      const totalBalance = balance + savings;
      const status = totalBalance < 50000 ? "Poor" : totalBalance < 200000 ? "Good" : "Excellent";
      return res.json({
        reply: `Your total estimated net worth (including current month's savings) is ₹${totalBalance.toLocaleString('en-IN')}. Your financial health is currently rated as **${status}**.`,
        source: "rules"
      });
    }

    // Trading / Risk Management Advisory
    if (lowerMsg.includes("trade") || lowerMsg.includes("trading") || lowerMsg.includes("invest today")) {
      const totalBalance = balance + savings;
      const monthlyEMI = budgets.find(b => b.category.toLowerCase().includes('emi'))?.limit || 0;
      const overBudgets = budgets.filter(b => Number(b.spent) > Number(b.limit)).length;

      if (totalBalance < 50000) {
        return res.json({
          reply: `⚠️ **Advisory: DO NOT TRADE TODAY.** \n\nYour current net worth (₹${totalBalance.toLocaleString('en-IN')}) is below the safety threshold. You have upcoming expenses and EMI commitments. Focus on building an emergency fund first.`,
          source: "rules"
        });
      }

      if (overBudgets > 0) {
        return res.json({
          reply: `⚠️ **Caution:** You are currently over budget in ${overBudgets} categories. While you have the funds, trading now might increase your financial stress. If you proceed, use a maximum of 1-2% risk per trade.`,
          source: "rules"
        });
      }

      return res.json({
        reply: `✅ **Trade Advisory:** Your financial condition looks solid (Net Worth: ₹${totalBalance.toLocaleString('en-IN')}). \n\n**Risk Management Tip:** Limit your risk to 1% of your capital per trade. Ensure you have a stop-loss in place. Happy trading!`,
        source: "rules"
      });
    }

    // EMI / Budget Alerts
    if (lowerMsg.includes("emi") || lowerMsg.includes("pending") || lowerMsg.includes("risk")) {
      const emiBudget = budgets.find(b => b.category.toLowerCase().includes('emi'));
      const overBudgets = budgets.filter(b => Number(b.spent) > Number(b.limit));
      
      let reply = "";
      if (emiBudget) {
        reply += `Your EMI budget is ₹${Number(emiBudget.limit).toLocaleString('en-IN')}. You have spent ₹${Number(emiBudget.spent).toLocaleString('en-IN')} so far. `;
      }
      
      if (overBudgets.length > 0) {
        reply += `\n\n⚠️ **Budget Alerts:** You have exceeded limits in: ${overBudgets.map(b => b.category).join(", ")}.`;
      } else {
        reply += `\n\n✅ All your budgets are currently within limits.`;
      }
      
      return res.json({ reply, source: "rules" });
    }

    // Fallback
    return res.json({
      reply: "I can help you track expenses, analyze budgets, or review your portfolio. Try asking 'How much did I spend on food?' or 'What is my net worth?'.",
      source: "rules"
    });

  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({ error: "Failed to process message" });
  }
});

export default router;
