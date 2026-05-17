import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function authorize(role) {
  return async function (req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (role && user.role !== role) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

