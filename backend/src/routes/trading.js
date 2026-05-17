import express from "express";
import { authenticate } from "../middleware/auth.js";
import { DemoAccount } from "../models/DemoAccount.js";
import { DemoTrade } from "../models/DemoTrade.js";
import { body } from "express-validator";
import { handleValidation } from "../middleware/validation.js";

const router = express.Router();

// Get or Create Account
router.get("/account", authenticate, async (req, res) => {
  try {
    let account = await DemoAccount.findOne({ where: { userId: req.user.id } });
    if (!account) {
      account = await DemoAccount.create({ 
        userId: req.user.id,
        balance: 10000, // Default 10k INR
        equity: 10000 
      });
    }
    res.json(account);
  } catch (err) {
    console.error("Demo Account Error:", err);
    res.status(500).json({ error: "Failed to fetch demo account" });
  }
});

// Place Trade
router.post(
  "/trade",
  authenticate,
  [
    body("symbol").isString().notEmpty(),
    body("type").isIn(["buy", "sell", "BUY", "SELL"]),
    body("quantity").isFloat({ gt: 0 }),
    body("price").isFloat({ gt: 0 })
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { symbol, type, quantity, price } = req.body;
      const tradeType = type.toLowerCase();
      
      let account = await DemoAccount.findOne({ where: { userId: req.user.id } });
      if (!account) {
          account = await DemoAccount.create({ 
            userId: req.user.id,
            balance: 10000,
            equity: 10000
          });
      }
      
      const tradeValue = Number(quantity) * Number(price);
      
      // Check balance for BUY
      if (tradeType === "buy" && Number(account.balance) < tradeValue) {
        return res.status(400).json({ error: `Insufficient balance. Required: ₹${tradeValue}` });
      }

      // Create Trade
      const trade = await DemoTrade.create({
        accountId: account.id,
        symbol: symbol.toUpperCase(),
        type: tradeType,
        volume: quantity,
        entryPrice: price,
        status: "open"
      });

      // Update Balance
      if (tradeType === "buy") {
          account.balance = Number(account.balance) - tradeValue;
      } else {
          // Short selling: We assume simplified model where we just track P&L against equity
          // But typically shorts require margin. Here we deduct value to simulate 'invested' cash
          // or we can leave balance alone and just track negative position.
          // Let's deduct to keep it simple (Cash used for margin).
          account.balance = Number(account.balance) - tradeValue; 
      }
      
      // Equity remains same initially (Asset = Cash + Stock Value)
      // If we deduct Cash, we gain Stock Value. So Equity is constant until price moves.
      
      await account.save();

      res.json(trade);
    } catch (err) {
      console.error("Trade Execution Error:", err);
      res.status(500).json({ error: "Trade execution failed" });
    }
  }
);

// Get User Trades
router.get("/trades", authenticate, async (req, res) => {
  try {
    const account = await DemoAccount.findOne({ where: { userId: req.user.id } });
    if (!account) return res.json([]);

    const trades = await DemoTrade.findAll({
      where: { accountId: account.id },
      order: [["createdAt", "DESC"]]
    });
    res.json(trades);
  } catch (err) {
    console.error("Fetch Trades Error:", err);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});

// Mock Price Generator (Fallback)
const getMockPrice = (symbol, basePrice = 100) => {
  // Generate a random variation within +/- 2%
  const variation = (Math.random() * 0.04) - 0.02; 
  return basePrice * (1 + variation);
};

// Calculate P&L (Live)
router.post("/pnl", authenticate, async (req, res) => {
    try {
        let { prices } = req.body; 
        
        // Mock prices if not provided
        if (!prices || Object.keys(prices).length === 0) {
            prices = {
                "BTC": getMockPrice("BTC", 50000),
                "ETH": getMockPrice("ETH", 3000),
                "AAPL": getMockPrice("AAPL", 175),
                "TSLA": getMockPrice("TSLA", 200),
                "GOOGL": getMockPrice("GOOGL", 140),
                "AMZN": getMockPrice("AMZN", 180),
                "MSFT": getMockPrice("MSFT", 400),
                "NVDA": getMockPrice("NVDA", 900),
                "NSE:NIFTY": getMockPrice("NSE:NIFTY", 22500),
                "NSE:BANKNIFTY": getMockPrice("NSE:BANKNIFTY", 48000),
                "NSE:RELIANCE": getMockPrice("NSE:RELIANCE", 2900),
                "NSE:TCS": getMockPrice("NSE:TCS", 4000),
                "NSE:HDFCBANK": getMockPrice("NSE:HDFCBANK", 1500),
                "NSE:INFY": getMockPrice("NSE:INFY", 1600),
                "NSE:IRCTC": getMockPrice("NSE:IRCTC", 900),
                "NSE:SBIN": getMockPrice("NSE:SBIN", 750)
            };
        }

        const account = await DemoAccount.findOne({ where: { userId: req.user.id } });
        if (!account) return res.json({ totalPnL: 0, positions: [], equity: 0, balance: 0 });

        const trades = await DemoTrade.findAll({ 
            where: { accountId: account.id, status: 'open' } 
        });

        let totalPnL = 0;
        let totalInvestedValue = 0;
        let currentPortfolioValue = 0;

        const positions = trades.map(t => {
            // Use provided price, or mock, or entry price as fallback
            const currentPrice = prices[t.symbol] || (Number(t.entryPrice) * (1 + (Math.random() * 0.02 - 0.01))); // Fallback random
            
            const entryVal = Number(t.entryPrice) * Number(t.volume);
            const currentVal = currentPrice * Number(t.volume);
            
            let pnl = 0;
            if (t.type === 'buy') {
                pnl = currentVal - entryVal;
                totalInvestedValue += entryVal;
                currentPortfolioValue += currentVal;
            } else {
                pnl = entryVal - currentVal;
            }
            
            totalPnL += pnl;
            
            return {
                id: t.id,
                symbol: t.symbol,
                quantity: t.volume,
                entryPrice: t.entryPrice,
                currentPrice,
                pnl,
                type: t.type
            };
        });
        
        // Equity = Cash Balance + Current Portfolio Value (Longs) + PnL (Shorts)
        // Note: For simplicity in this demo, we assume shorts just add/subtract PnL from equity directly
        account.equity = Number(account.balance) + currentPortfolioValue + (totalPnL < 0 ? totalPnL : 0 /* approximate for shorts */);
        
        // Better Equity Calculation:
        // Equity = Cash + Asset Value
        // Since we deducted cash on BUY, we just add back current asset value.
        // For SELL (Short), we kept cash (in this simplified model), so we add PnL.
        
        let equity = Number(account.balance);
        positions.forEach(p => {
            if (p.type === 'buy') {
                equity += (p.currentPrice * Number(p.quantity));
            } else {
                equity += p.pnl;
            }
        });

        account.equity = equity;
        await account.save();

        res.json({ totalPnL, positions, equity: account.equity, balance: account.balance, prices });
    } catch (err) {
        console.error("PnL Calculation Error:", err);
        res.status(500).json({ error: "Failed to calculate P&L" });
    }
});

export default router;
