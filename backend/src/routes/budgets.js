import express from "express";
import { body } from "express-validator";
import { Budget } from "../models/Budget.js";
import { authenticate } from "../middleware/auth.js";
import { handleValidation } from "../middleware/validation.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  const data = await Budget.findAll({ where: { userId: req.user.id }, order: [["id", "DESC"]] });
  res.json(
    data.map(b => ({
      id: b.id,
      category: b.category,
      limit: Number(b.limit),
      spent: Number(b.spent),
      period: b.period,
      currency: b.currency
    }))
  );
});

router.post(
  "/",
  authenticate,
  [body("category").isString().trim().isLength({ min: 1 }), body("limit").isFloat({ min: 0 }), body("period").isIn(["monthly", "yearly"])],
  handleValidation,
  async (req, res) => {
    const { category, limit, period } = req.body;
    const budget = await Budget.create({ userId: req.user.id, category, limit, period, currency: "INR" });
    res.status(201).json({ id: budget.id });
  }
);

router.put(
  "/:id",
  authenticate,
  [body("category").isString().trim().isLength({ min: 1 }), body("limit").isFloat({ min: 0 }), body("period").isIn(["monthly", "yearly"])],
  handleValidation,
  async (req, res) => {
    const b = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!b) return res.status(404).json({ error: "Not found" });
    const { category, limit, period } = req.body;
    await b.update({ category, limit, period });
    res.json({ ok: true });
  }
);

router.delete("/:id", authenticate, async (req, res) => {
  const b = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!b) return res.status(404).json({ error: "Not found" });
  await b.destroy();
  res.json({ ok: true });
});

export default router;

