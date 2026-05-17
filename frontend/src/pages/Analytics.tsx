import React, { useEffect, useState } from "react";
import { api } from "../api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from "recharts";

interface SummaryResponse {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  netWorth: number;
  tradingPnL: number;
  openTradesCount: number;
  budgets: { category: string; limit: number; actual: number; variance: number; period: string }[];
}

interface MonthlyPoint {
  month: string;
  expenses: number;
  income: number;
  tradingPnL: number;
}

interface CategoryPoint {
  category: string;
  amount: number;
}

interface InsightsResponse {
  anomalies: { id: number; date: string; amount: number; category: string; reason: string }[];
  explanations: string[];
}

interface HealthResponse {
  score: number;
  status: string;
  details: {
    savingsRate: number;
    budgetAdherence: number;
  };
}

export function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [categories, setCategories] = useState<CategoryPoint[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New states for Loan
  const [loanForm, setLoanForm] = useState({ salary: 50000, age: 30, creditScore: 750, loanAmount: 500000, tenureMonths: 60 });
  const [loanResult, setLoanResult] = useState<any>(null);

  const checkLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/analytics/loan-eligibility", loanForm);
      setLoanResult(res.data);
    } catch (err) {
      console.error("Loan check failed", err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get("/analytics/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transactions.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const [summaryRes, monthlyRes, categoriesRes, insightsRes, healthRes] = await Promise.all([
          api.get("/analytics/summary"),
          api.get("/analytics/monthly"),
          api.get("/analytics/categories"),
          api.get("/analytics/insights"),
          api.get("/analytics/health")
        ]);
        if (!active) return;
        setSummary(summaryRes.data);
        setMonthly(monthlyRes.data);
        setCategories(categoriesRes.data);
        setInsights({
          anomalies: insightsRes.data.anomalies || [],
          explanations: insightsRes.data.explanations || []
        });
        setHealth(healthRes.data);
      } catch (err) {
        if (active) {
          setError("Unable to load analytics.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-slate-300">Loading analytics...</span>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Financial Analytics</h1>
        <button
          onClick={handleExport}
          className="rounded bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-xs font-medium text-slate-400">Total Income</h3>
            <p className="mt-2 text-xl font-bold text-emerald-400">₹{summary.totalIncome.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-xs font-medium text-slate-400">Total Expenses</h3>
            <p className="mt-2 text-xl font-bold text-red-400">₹{summary.totalExpenses.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-xs font-medium text-slate-400">Net Savings</h3>
            <p className={`mt-2 text-xl font-bold ${summary.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ₹{summary.balance.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-xs font-medium text-slate-400">Combined Net Worth</h3>
            <p className="mt-2 text-xl font-bold text-blue-400">
              ₹{summary.netWorth?.toLocaleString("en-IN") || summary.balance.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}

      {summary && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                 <h3 className="text-xs font-medium text-slate-400">Trading P&L (Realized)</h3>
                 <p className={`mt-2 text-xl font-bold ${summary.tradingPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                     ₹{summary.tradingPnL.toLocaleString("en-IN")}
                 </p>
             </div>
             <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                 <h3 className="text-xs font-medium text-slate-400">Open Trades</h3>
                 <p className="mt-2 text-xl font-bold text-slate-200">{summary.openTradesCount}</p>
             </div>
             <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <h3 className="text-xs font-medium text-slate-400 mb-2">Financial Health Score</h3>
                  {health && (
                      <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-primary-500">{health.score}/100</div>
                          <div className="text-sm">
                              <p className={`font-semibold ${health.status === 'Excellent' ? 'text-emerald-400' : health.status === 'Fair' ? 'text-yellow-400' : 'text-red-400'}`}>{health.status}</p>
                              <p className="text-slate-400">Savings Rate: {health.details.savingsRate}%</p>
                          </div>
                      </div>
                  )}
             </div>
         </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-4 text-sm font-semibold text-white">Income vs Expenses vs Trading</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "0.5rem" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} name="Expenses" />
                <Line type="monotone" dataKey="tradingPnL" stroke="#3b82f6" strokeWidth={2} dot={false} name="Trading P&L" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-4 text-sm font-semibold text-white">Expense Breakdown</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical">
                <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} hide />
                <YAxis dataKey="category" type="category" width={100} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "#1e293b" }}
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "0.5rem" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {insights && insights.anomalies.length > 0 && (
          <div className="rounded-xl border border-red-900/50 bg-red-900/10 p-4">
              <h2 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                <span>⚠️</span> Anomalies & Security Alerts
              </h2>
              <ul className="space-y-3">
                  {insights.anomalies.map(a => (
                      <li key={a.id} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/50 p-2 rounded">
                          <span className="font-mono text-slate-500 min-w-[80px]">{new Date(a.date).toLocaleDateString()}</span>
                          <div>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${a.category === 'Security Risk' ? 'text-red-500' : 'text-white'}`}>
                                    {a.category}
                                </span>
                                {a.amount > 0 && <span className="text-slate-400">(₹{a.amount.toLocaleString()})</span>}
                            </div>
                            <p className="text-slate-400 mt-1">{a.reason}</p>
                          </div>
                      </li>
                  ))}
              </ul>
          </div>
      )}

      {/* Loan Eligibility Section */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
          <h2 className="text-lg font-serif text-white mb-6 flex items-center gap-2">
            <span className="text-amber-500">🏦</span> Loan Eligibility Checker
          </h2>
          <form onSubmit={checkLoan} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Monthly Salary</label>
                <input 
                  type="number" 
                  value={loanForm.salary}
                  onChange={e => setLoanForm({...loanForm, salary: Number(e.target.value)})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Credit Score</label>
                <input 
                  type="number" 
                  value={loanForm.creditScore}
                  onChange={e => setLoanForm({...loanForm, creditScore: Number(e.target.value)})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber-500/50 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Loan Amount</label>
                <input 
                  type="number" 
                  value={loanForm.loanAmount}
                  onChange={e => setLoanForm({...loanForm, loanAmount: Number(e.target.value)})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Tenure (Months)</label>
                <input 
                  type="number" 
                  value={loanForm.tenureMonths}
                  onChange={e => setLoanForm({...loanForm, tenureMonths: Number(e.target.value)})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber-500/50 outline-none"
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10">
              Analyze Eligibility
            </button>
          </form>

          {loanResult && (
            <div className={`mt-6 p-5 rounded-2xl border ${loanResult.eligible ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-lg font-bold ${loanResult.eligible ? 'text-emerald-400' : 'text-red-400'}`}>
                    {loanResult.eligible ? 'Eligible for Loan' : 'Not Eligible'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Based on Rule-Engine Analysis</p>
                </div>
                {loanResult.eligible && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-500">Estimated EMI</p>
                    <p className="text-xl font-bold text-white">₹{loanResult.emi.toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {!loanResult.eligible && (
                <ul className="space-y-1.5">
                  {loanResult.reasons.map((r: string, i: number) => (
                    <li key={i} className="text-xs text-red-300 flex items-center gap-2">
                      <span className="w-1 h-1 bg-red-400 rounded-full" /> {r}
                    </li>
                  ))}
                </ul>
              )}

              {loanResult.eligible && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-emerald-500/10">
                  <div>
                    <p className="text-[10px] uppercase text-slate-500">Interest</p>
                    <p className="text-sm font-semibold text-white">{loanResult.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-500">Total Pay</p>
                    <p className="text-sm font-semibold text-white">₹{loanResult.totalRepayment.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-500">Fee (1%)</p>
                    <p className="text-sm font-semibold text-white">₹{loanResult.processingFee.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
