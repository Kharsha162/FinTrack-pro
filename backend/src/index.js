import express from "express";
import axios from "axios";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { sequelize } from "./db.js";
import { authenticate } from "./middleware/auth.js";
import { Transaction } from "./models/Transaction.js";
import { Budget } from "./models/Budget.js";
import { Investment } from "./models/Investment.js";
import "./models/User.js";
import "./models/Transaction.js";
import "./models/Budget.js";
import "./models/BankAccount.js";
import "./models/BankTransaction.js";
import "./models/Investment.js";
import "./models/Notification.js";
import "./models/AuditLog.js";
import "./models/Category.js";
import "./models/associations.js";
import authRoutes from "./routes/auth.js";
import transactionsRoutes from "./routes/transactions.js";
import budgetsRoutes from "./routes/budgets.js";
import bankRoutes from "./routes/bank.js";
import investmentsRoutes from "./routes/investments.js";
import analyticsRoutes from "./routes/analytics.js";
import adminRoutes from "./routes/admin.js";
import dashboardRoutes from "./routes/dashboard.js";
import taxRoutes from "./routes/tax.js";
import tradingRoutes from "./routes/trading.js";
import chatbotRoutes from "./routes/chatbot.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174"
    ],
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/investments", investmentsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/chat", chatbotRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(config.port, () => {
      console.log(`API listening on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
