import express from "express";
import { body } from "express-validator";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { Notification } from "../models/Notification.js";
import { authenticate } from "../middleware/auth.js";
import { handleValidation } from "../middleware/validation.js";
import { Op } from "sequelize";
import multer from "multer";
import { createWorker } from "tesseract.js";
import { fraudService } from "../services/fraudService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/scan", authenticate, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const worker = await createWorker("eng");
    const ret = await worker.recognize(req.file.buffer);
    const text = ret.data.text;
    await worker.terminate();

    // Simple extraction logic
    const amountMatch = text.match(/[\d,]+\.\d{2}/) || text.match(/\d+/);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, "")) : 0;

    const dateMatch = text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/);
    const date = dateMatch ? new Date(dateMatch[0]) : new Date();

    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const merchant = lines[0] || "Unknown Merchant";

    res.json({
      amount,
      date,
      description: `Bill from ${merchant}`,
      category: "Uncategorized",
      rawText: text
    });
  } catch (err) {
    console.error("OCR Error:", err);
    res.status(500).json({ error: "OCR Failed" });
  }
});

router.post("/voice", authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    // Simple NLP extraction
    const amountMatch = text.match(/(\d+)/);
    const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

    let category = "Uncategorized";
    const categories = ["food", "travel", "bills", "shopping", "entertainment", "health", "groceries"];
    const lowerText = text.toLowerCase();
    for (const cat of categories) {
      if (lowerText.includes(cat)) {
        category = cat;
        break;
      }
    }

    const tx = await Transaction.create({
      userId: req.user.id,
      type: "expense",
      amount,
      category,
      description: text,
      date: new Date(),
      isRecurring: false,
      source: "voice",
      currency: "INR"
    });

    res.status(201).json(tx);
  } catch (err) {
    console.error("Voice Entry Error:", err);
    res.status(500).json({ error: "Voice Entry Failed" });
  }
});

router.get("/", authenticate, async (req, res) => {
  const data = await Transaction.findAll({ where: { userId: req.user.id }, order: [["date", "DESC"], ["id", "DESC"]] });
  res.json(
    data.map(t => ({
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
  );
});

router.post(
  "/",
  authenticate,
  [
    body("type").isIn(["expense", "income"]),
    body("amount").isFloat({ min: 0 }),
    body("category").isString().trim().isLength({ min: 1 }),
    body("description").optional().isString(),
    body("date").optional().isISO8601(),
    body("isRecurring").isBoolean()
  ],
  handleValidation,
  async (req, res) => {
    const { type, amount, category, description, date, isRecurring } = req.body;
    const tx = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      date: date ? new Date(date) : new Date(),
      isRecurring,
      source: "manual",
      currency: "INR"
    });

    // Run async fraud checks
    try {
      const alerts = await fraudService.checkTransaction(req.user.id, tx);
      console.log("Fraud checks completed. Alerts:", alerts);
    } catch (err) {
      console.error("Fraud check failed:", err);
    }

    // Check Budget Limits
    if (type === "expense") {
      try {
        const budget = await Budget.findOne({ where: { userId: req.user.id, category } });
        if (budget) {
          const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const totalSpent = await Transaction.sum("amount", {
            where: {
              userId: req.user.id,
              category,
              type: "expense",
              date: { [Op.gte]: startOfMonth }
            }
          }) || 0;

          const limit = Number(budget.limit);
          const spent = Number(totalSpent);
          const percentage = (spent / limit) * 100;

          if (percentage >= 80) {
             const message = percentage >= 100 
                ? `Budget Exceeded: You have spent ₹${spent} on ${category}, exceeding your limit of ₹${limit}.`
                : `Budget Warning: You have used ${percentage.toFixed(0)}% of your ${category} budget (₹${spent}/₹${limit}).`;
             
             const priority = percentage >= 100 ? "high" : "medium";

             // Check if we already alerted recently to avoid spam (optional, skipping for simplicity)
             await Notification.create({
                userId: req.user.id,
                type: "BUDGET_ALERT",
                message,
                priority,
                read: false
             });
             
             console.log(`[Email Mock] Sending Budget Alert to ${req.user.email}: ${message}`);
          }
        }
      } catch (err) {
        console.error("Budget check failed:", err);
      }
    }

    res.status(201).json({ id: tx.id });
  }
);

router.put(
  "/:id",
  authenticate,
  [
    body("type").isIn(["expense", "income"]),
    body("amount").isFloat({ min: 0 }),
    body("category").isString().trim().isLength({ min: 1 }),
    body("description").optional().isString(),
    body("date").optional().isISO8601(),
    body("isRecurring").isBoolean()
  ],
  handleValidation,
  async (req, res) => {
    const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!tx) return res.status(404).json({ error: "Not found" });
    const { type, amount, category, description, date, isRecurring } = req.body;
    await tx.update({
      type,
      amount,
      category,
      description,
      date: date ? new Date(date) : tx.date,
      isRecurring
    });
    res.json({ ok: true });
  }
);

router.delete("/:id", authenticate, async (req, res) => {
  const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!tx) return res.status(404).json({ error: "Not found" });
  await tx.destroy();
  res.json({ ok: true });
});

export default router;

