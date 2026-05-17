import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { User } from "../models/User.js";
import { config } from "../config.js";
import { handleValidation } from "../middleware/validation.js";
import { recordAudit } from "../middleware/audit.js";
import crypto from "crypto";

const router = express.Router();

function tokensFor(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: "30m" });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

function sendMockEmail(to, subject, body) {
  console.log(`\n📧 [MOCK EMAIL] To: ${to}\n   Subject: ${subject}\n   Body: ${body}\n`);
}

router.post(
  "/register",
  [
    body("name").isString().trim().isLength({ min: 2 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8 })
  ],
  handleValidation,
  async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: "user" });
    const { accessToken, refreshToken } = tokensFor(user);
    await recordAudit(email, "register");
    sendMockEmail(email, "Welcome to FinTrack Pro", "Thank you for creating an account.");
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken });
  }
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 8 })],
  handleValidation,
  async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Check if account is disabled by admin
    if (user.isActive === false) {
      return res.status(403).json({ error: "Account disabled. Please contact support." });
    }

    // Check Lockout
    if (user.lockUntil && new Date() < user.lockUntil) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(403).json({ error: `Account locked. Try again in ${waitMinutes} minutes.` });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // Increment failed attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      if (user.failedLoginAttempts >= 3) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        sendMockEmail(email, "Security Alert: Account Locked", "Multiple failed login attempts detected. Your account is temporarily locked.");
        await user.save();
        return res.status(403).json({ error: "Account locked due to multiple failed attempts." });
      }
      
      await user.save();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = tokensFor(user);
    await recordAudit(email, "login");
    sendMockEmail(email, "New Login Detected", `Logged in at ${new Date().toLocaleString()}`);
    
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken });
  }
);

router.post("/logout", async (req, res) => {
  res.json({ ok: true });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Missing refresh token" });
  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: "Invalid refresh token" });
    const { accessToken, refreshToken: newRefresh } = tokensFor(user);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Forgot Password
router.post("/forgot-password", 
  [body("email").isEmail().normalizeEmail()],
  handleValidation,
  async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal user existence, just simulate success
      return res.json({ message: "If that email exists, an OTP has been sent." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = otp;
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    sendMockEmail(email, "Password Reset OTP", `Your OTP is: ${otp}. Expires in 10 minutes.`);
    res.json({ message: "OTP sent to email." });
  }
);

// Reset Password
router.post("/reset-password",
  [
    body("email").isEmail().normalizeEmail(),
    body("otp").isString().isLength({ min: 6, max: 6 }),
    body("newPassword").isString().isLength({ min: 8 })
  ],
  handleValidation,
  async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || user.resetToken !== otp || !user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    // Also unlock account if it was locked
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    sendMockEmail(email, "Password Changed", "Your password has been successfully reset.");
    res.json({ message: "Password reset successful. Please login." });
  }
);

export default router;
