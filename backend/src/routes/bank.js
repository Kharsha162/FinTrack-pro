import express from "express";
import dayjs from "dayjs";
import { authenticate } from "../middleware/auth.js";
import { BankAccount } from "../models/BankAccount.js";
import { BankTransaction } from "../models/BankTransaction.js";
import { Transaction } from "../models/Transaction.js";

const router = express.Router();

router.get("/accounts", authenticate, async (req, res) => {
  const accounts = await BankAccount.findAll({ where: { userId: req.user.id } });
  res.json(
    accounts.map(a => ({
      id: a.id,
      provider: a.provider,
      name: a.name,
      balance: Number(a.balance),
      currency: a.currency,
      lastSyncedAt: a.lastSyncedAt ? new Date(a.lastSyncedAt).toISOString() : null,
      status: a.status
    }))
  );
});

router.get("/status", authenticate, async (req, res) => {
  const last = await BankAccount.findOne({ where: { userId: req.user.id }, order: [["lastSyncedAt", "DESC"]] });
  res.json({ lastSync: last?.lastSyncedAt ? new Date(last.lastSyncedAt).toISOString() : null, createdTransactions: 0 });
});

router.post("/link/start", authenticate, async (req, res) => {
  const { redirectUrl } = req.body || {};
  const base = `${req.protocol}://${req.get("host")}`;
  const url = `${base}/api/bank/consent?redirect=${encodeURIComponent(redirectUrl || `${base}`)}`;
  res.json({ url });
});

router.get("/consent", async (req, res) => {
  const redirect = req.query.redirect || "/";
  const html = `<!doctype html>
<meta charset="utf-8">
<title>Mock Bank Consent</title>
<body style="margin:0;background:#020617;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
  <div style="max-width:480px;margin:48px auto;padding:24px;border-radius:16px;background:#020617;border:1px solid #1e293b;box-shadow:0 18px 40px rgba(15,23,42,0.8);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="height:32px;width:32px;border-radius:999px;background:#10b981;display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:14px;">MB</div>
        <div>
          <div style="font-size:14px;font-weight:600;color:#f9fafb;">MockBank Connect</div>
          <div style="font-size:11px;color:#9ca3af;">Read-only access powered by OAuth</div>
        </div>
      </div>
      <span style="font-size:11px;color:#64748b;">Secure session</span>
    </div>
    <h1 style="font-size:16px;font-weight:600;margin:16px 0 8px;color:#f9fafb;">Approve data sharing</h1>
    <p style="font-size:12px;color:#e5e7eb;line-height:1.5;margin-bottom:12px;">
      FinTrack Pro is requesting read-only access to your account balances and transaction history. Credentials are never
      shared; you can revoke access from your bank at any time.
    </p>
    <ul style="font-size:12px;color:#cbd5f5;line-height:1.6;margin:0 0 16px 16px;padding:0;">
      <li>Account holder name and masked account numbers</li>
      <li>Available and ledger balances</li>
      <li>Up to 90 days of transaction history</li>
    </ul>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
      <button style="border-radius:999px;border:1px solid #1f2937;background:#020617;color:#e5e7eb;font-size:12px;padding:6px 14px;cursor:pointer;">
        Cancel
      </button>
      <button id="approveBtn" style="border-radius:999px;border:none;background:#10b981;color:white;font-size:12px;padding:6px 18px;font-weight:600;cursor:pointer;">
        Approve and continue
      </button>
    </div>
    <p style="margin-top:12px;font-size:11px;color:#9ca3af;">
      On approval, you will be securely redirected back to FinTrack Pro to complete account linking.
    </p>
  </div>
  <script>
    document.getElementById("approveBtn").addEventListener("click", function () {
      setTimeout(function () {
        location.href = ${JSON.stringify(redirect)};
      }, 800);
    });
  </script>
</body>`;
  res.setHeader("Content-Type", "text/html").send(html);
});

router.post("/sync", authenticate, async (req, res) => {
  let account = await BankAccount.findOne({ where: { userId: req.user.id } });
  if (!account) {
    account = await BankAccount.create({
      userId: req.user.id,
      provider: "MockBank",
      name: "Mock Savings",
      balance: 25000,
      currency: "INR",
      status: "linked"
    });
  }
  await account.update({ status: "syncing" });
  const today = dayjs();
  const created = [];
  for (let i = 0; i < 12; i++) {
    const d = today.subtract(i, "day").format("YYYY-MM-DD");
    const debit = Math.random() < 0.6;
    const amount = Number((Math.random() * (debit ? 1200 : 8000) + (debit ? 100 : 2000)).toFixed(2));
    const desc = debit ? "Groceries" : "Salary credit";
    const categoryHint = debit ? "Groceries" : "Salary";
    const bt = await BankTransaction.create({
      bankAccountId: account.id,
      date: d,
      description: desc,
      amount,
      type: debit ? "debit" : "credit",
      categoryHint
    });
    created.push(bt);
    await Transaction.create({
      userId: req.user.id,
      type: debit ? "expense" : "income",
      amount,
      currency: "INR",
      category: categoryHint,
      description: desc,
      date: d,
      isRecurring: !debit,
      source: "bank"
    });
  }
  await account.update({ status: "linked", lastSyncedAt: new Date() });
  res.json({ lastSync: new Date().toISOString(), createdTransactions: created.length });
});

router.post("/accounts/:id/unlink", authenticate, async (req, res) => {
  const account = await BankAccount.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!account) return res.status(404).json({ error: "Not found" });
  await BankTransaction.destroy({ where: { bankAccountId: account.id } });
  await account.destroy();
  res.json({ ok: true });
});

router.get("/rates", authenticate, (req, res) => {
  // Mock rates relative to INR
  res.json({
    base: "INR",
    rates: {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      JPY: 1.8
    }
  });
});

export default router;
