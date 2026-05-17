import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Transaction } from "../types";

interface BankAccount {
  id: number;
  provider: string;
  name: string;
  balance: number;
  currency: string;
  lastSyncedAt: string | null;
  status: "linked" | "syncing";
}

interface BankSyncStatus {
  lastSync: string | null;
  createdTransactions: number;
}

export function BankLinkPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [status, setStatus] = useState<BankSyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankSelectorOpen, setBankSelectorOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>("HDFC Bank");

  const load = async () => {
    setError(null);
    try {
      const [accountsRes, statusRes, txRes] = await Promise.all([
        api.get("/bank/accounts"),
        api.get("/bank/status"),
        api.get("/transactions")
      ]);
      setAccounts(accountsRes.data);
      setStatus(statusRes.data);
      const onlyBankTx = (txRes.data as Transaction[]).filter(t => t.source === "bank");
      setTransactions(onlyBankTx);
    } catch (err) {
      setError("Unable to load bank data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startLink = async () => {
    if (!selectedBank) {
      setBankSelectorOpen(true);
      return;
    }
    setError(null);
    setStarting(true);
    try {
      const res = await api.post("/bank/link/start", {
        redirectUrl: window.location.origin + "/bank"
      });
      const url = res.data.url as string;
      window.location.href = url;
    } catch (err) {
      setError("Starting bank link failed.");
      setStarting(false);
    }
  };

  const syncNow = async () => {
    setError(null);
    setSyncing(true);
    try {
      const res = await api.post("/bank/sync");
      setStatus(res.data);
      await load();
    } catch (err) {
      setError("Bank sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const unlink = async (id: number) => {
    setError(null);
    try {
      await api.post(`/bank/accounts/${id}/unlink`);
      await load();
    } catch (err) {
      setError("Unlinking account failed.");
    }
  };

  const banks = [
    { id: "hdfc", name: "HDFC Bank", description: "Savings · Current · Deposits" },
    { id: "icici", name: "ICICI Bank", description: "Savings · Current · Credit cards" },
    { id: "sbi", name: "State Bank of India", description: "Savings · YONO · Government schemes" }
  ];

  const bankTransactions = transactions.slice(0, 8);

  return (
    <section className="space-y-4" aria-label="Bank account linking and synchronization">
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 lg:col-span-1">
          <h1 className="text-sm font-semibold text-white">Link bank account</h1>
          <p className="text-xs text-slate-300">
            Connect a bank in a consent-based, read-only way. We never see your credentials; only tokenized access and
            transaction data are used, similar to providers like Plaid or Setu.
          </p>
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-500/60 bg-red-900/40 px-3 py-2 text-xs text-red-100"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-slate-300">Preferred bank</p>
            <button
              type="button"
              onClick={() => setBankSelectorOpen(true)}
              className="flex w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 hover:bg-slate-800"
            >
              <span>{selectedBank}</span>
              <span className="text-[10px] text-slate-400">Change</span>
            </button>
          </div>
          <button
            type="button"
            onClick={startLink}
            disabled={starting}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-primary-500 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400 focus-visible:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {starting ? "Opening consent screen…" : "Continue to bank consent"}
          </button>
          <div className="text-xs text-slate-400">
            You will be redirected to a mock bank consent page to approve secure, read-only access to balances and
            transactions, then brought back to FinTrack Pro.
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Linked accounts</h2>
              <p className="text-xs text-slate-300">
                View balances across connected banks and keep them in sync with one click.
              </p>
            </div>
            <button
              type="button"
              onClick={syncNow}
              disabled={syncing}
              className="inline-flex items-center justify-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {syncing ? "Syncing…" : "Sync transactions"}
            </button>
          </div>
          {status && (
            <p className="text-xs text-slate-300">
              Last sync:{" "}
              {status.lastSync ? new Date(status.lastSync).toLocaleString("en-IN") : "Never"} · Last run created{" "}
              {status.createdTransactions} transactions.
            </p>
          )}
          {loading ? (
            <div className="space-y-2">
              <div className="h-10 w-full rounded-md bg-slate-800 animate-pulse" />
              <div className="h-10 w-full rounded-md bg-slate-800 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-100">
                      {account.name} ({account.provider})
                    </p>
                    <p className="text-slate-300">
                      Balance ₹{account.balance.toLocaleString("en-IN")} {account.currency}
                    </p>
                    <p className="text-slate-400">
                      Last synced{" "}
                      {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString("en-IN") : "never"}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        account.status === "syncing"
                          ? "bg-amber-900/60 text-amber-100"
                          : "bg-emerald-900/60 text-emerald-100"
                      }`}
                    >
                      {account.status === "syncing" ? "Syncing" : "Linked"}
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={() => unlink(account.id)}
                        className="inline-flex items-center rounded bg-red-700 px-2 py-1 text-[10px] text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && !loading && (
                <p className="text-xs text-slate-400">
                  No linked accounts yet. Connect a mock bank to import balances and transactions.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent bank transactions</h2>
          <span className="text-[11px] text-slate-400">
            Source: synced via secure bank connectivity
          </span>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-9 w-full rounded-md bg-slate-800 animate-pulse" />
            <div className="h-9 w-full rounded-md bg-slate-800 animate-pulse" />
            <div className="h-9 w-full rounded-md bg-slate-800 animate-pulse" />
          </div>
        ) : bankTransactions.length === 0 ? (
          <p className="text-xs text-slate-400">
            Once you sync a bank, transactions imported from the provider will appear here with a clear audit of amounts,
            categories, and dates.
          </p>
        ) : (
          <div className="space-y-2" aria-label="Recent bank transactions">
            {bankTransactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium text-slate-100">{tx.category}</p>
                  <p className="text-slate-400">
                    {tx.description} · {new Date(tx.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      tx.type === "expense" ? "text-red-300 font-semibold" : "text-emerald-300 font-semibold"
                    }
                  >
                    {tx.type === "expense" ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-slate-400">Bank sync</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {bankSelectorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">Select your bank</h2>
              <button
                type="button"
                onClick={() => setBankSelectorOpen(false)}
                className="rounded-md p-1 text-slate-300 hover:bg-slate-800"
                aria-label="Close bank selection"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-slate-300">
              Choose the bank you want to connect. In a production setup this step would open the provider (Plaid, Setu)
              widget for secure authentication.
            </p>
            <div className="space-y-2">
              {banks.map(bank => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBank(bank.name)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 ${
                    selectedBank === bank.name
                      ? "border-primary-500 bg-primary-500/10 text-white"
                      : "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  }`}
                >
                  <span>
                    <span className="block text-xs font-semibold">{bank.name}</span>
                    <span className="block text-[11px] text-slate-400">{bank.description}</span>
                  </span>
                  {selectedBank === bank.name && <span className="text-[11px] text-primary-300">Selected</span>}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBankSelectorOpen(false)}
                className="rounded-md px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setBankSelectorOpen(false);
                  startLink();
                }}
                className="rounded-md bg-primary-500 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-primary-600"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
