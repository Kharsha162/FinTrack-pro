import express from "express";
import { body } from "express-validator";
import { authorize, authenticate } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { AuditLog } from "../models/AuditLog.js";
import { Category } from "../models/Category.js";
import { handleValidation } from "../middleware/validation.js";
import { recordAudit } from "../middleware/audit.js";
import { Op } from "sequelize";

const router = express.Router();

// Get Dashboard Stats
router.get("/stats", authenticate, authorize("admin"), async (req, res) => {
  const totalUsers = await User.count();
  const activeUsers = await User.count({ where: { isActive: true } });
  
  // Active sessions (users logged in within last 30 mins)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const activeSessions = await User.count({
    where: { lastLogin: { [Op.gte]: thirtyMinsAgo } }
  });

  const recentAudits = await AuditLog.findAll({
    limit: 5,
    order: [["createdAt", "DESC"]]
  });

  res.json({
    totalUsers,
    activeUsers,
    activeSessions,
    recentAudits
  });
});

// List Users
router.get("/users", authenticate, authorize("admin"), async (req, res) => {
  const users = await User.findAll({
    attributes: ["id", "name", "email", "role", "isActive", "lastLogin", "lockUntil", "failedLoginAttempts"],
    order: [["createdAt", "DESC"]]
  });
  res.json(users);
});

// Change Role
router.post(
  "/users/:id/role",
  authenticate,
  authorize("admin"),
  [body("role").isIn(["user", "admin"])],
  handleValidation,
  async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    await user.update({ role: req.body.role });
    await recordAudit(req.user.email, `update role ${user.email} -> ${req.body.role}`);
    res.json({ ok: true });
  }
);

// Toggle Account Status (Enable/Disable)
router.post(
  "/users/:id/toggle-status",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    
    // Prevent disabling self
    if (user.id === req.user.id) {
      return res.status(400).json({ error: "Cannot disable your own account" });
    }

    const newStatus = !user.isActive;
    await user.update({ isActive: newStatus });
    await recordAudit(req.user.email, `${newStatus ? "enabled" : "disabled"} user ${user.email}`);
    res.json({ ok: true, isActive: newStatus });
  }
);

// Unlock User
router.post(
  "/users/:id/unlock",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    
    await user.update({ lockUntil: null, failedLoginAttempts: 0 });
    await recordAudit(req.user.email, `unlocked user ${user.email}`);
    res.json({ ok: true });
  }
);

// Audit Logs
router.get("/audit", authenticate, authorize("admin"), async (req, res) => {
  const logs = await AuditLog.findAll({ 
    order: [["id", "DESC"]],
    limit: 100 // Limit to last 100 for performance
  });
  res.json(logs);
});

// Categories (Existing)
router.get("/categories", authenticate, authorize("admin"), async (req, res) => {
  const categories = await Category.findAll({ order: [["name", "ASC"]] });
  res.json(categories.map(c => ({ id: c.id, name: c.name, type: c.type })));
});

router.post(
  "/categories",
  authenticate,
  authorize("admin"),
  [body("name").isString().trim().isLength({ min: 1 }), body("type").isIn(["expense", "income"])],
  handleValidation,
  async (req, res) => {
    const cat = await Category.create({ name: req.body.name, type: req.body.type });
    await recordAudit(req.user.email, `create category ${cat.name}`);
    res.status(201).json({ id: cat.id });
  }
);

export default router;
