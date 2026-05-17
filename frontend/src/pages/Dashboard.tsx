import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Budget, Transaction } from "../types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

interface OverviewResponse {
  balances: {
    totalBalanceInr: number;
    cashInr: number;
    investmentsInr: number;
  };
  monthlyCashflow: { month: string; income: number; expenses: number }[];
  categoryBreakdown: { category: string; amount: number }[];
  healthScore: number;
  alerts: { id: number; type: string; message: string; priority: "low" | "medium" | "high" }[];
  budgets: Budget[];
  recentTransactions: Transaction[];
}

const chartColors = ["#d4af37", "#f97316", "#22c55e", "#3b82f6", "#a855f7", "#facc15"]; // Gold as primary

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const AnimatedCounter = ({ value }: { value: number }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      ₹{value.toLocaleString("en-IN")}
    </motion.span>
  );
};

export function Dashboard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await api.get("/dashboard/overview");
        if (active) {
          setData(res.data);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load overview data.");
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
      <section className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Financial overview dashboard loading">
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse backdrop-blur-sm" />
          ))}
        </div>
        <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse backdrop-blur-sm" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-lg text-red-300 font-light" role="alert">
          {error || "Dashboard data unavailable."}
        </p>
      </div>
    );
  }

  return (
    <motion.section 
      className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" 
      aria-label="Financial overview dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-serif text-white tracking-wide">
          Financial <span className="text-amber-500">Overview</span>
        </h1>
        <p className="text-slate-400 mt-1 font-light">Your wealth ecosystem at a glance.</p>
      </motion.div>

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6 transition-all hover:border-amber-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Net Worth</p>
          <p className="mt-2 text-3xl font-bold text-white tracking-tight">
            <AnimatedCounter value={data.balances.totalBalanceInr} />
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6 transition-all hover:border-emerald-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Cash Balance</p>
          <p className="mt-2 text-3xl font-bold text-white tracking-tight">
            <AnimatedCounter value={data.balances.cashInr} />
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6 transition-all hover:border-blue-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Investments</p>
          <p className="mt-2 text-3xl font-bold text-white tracking-tight">
            <AnimatedCounter value={data.balances.investmentsInr} />
          </p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 lg:col-span-2">
          <h2 className="text-lg font-serif text-white mb-6">Cashflow Trends</h2>
          {data.monthlyCashflow.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 font-light">
              Insufficient data to display trends.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyCashflow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6">
          <h2 className="text-lg font-serif text-white mb-6">Allocation</h2>
          {data.categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 font-light">
              No expenses recorded.
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell key={entry.category} fill={chartColors[index % chartColors.length]} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-sm font-bold text-white">Expenses</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Budgets Section - Enhanced */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6">
          <h2 className="text-lg font-serif text-white mb-6">Budget Status</h2>
          <div className="space-y-6">
            {data.budgets.map(budget => {
              const ratio = Math.min(budget.spent / budget.limit, 1);
              const remaining = Math.max(budget.limit - budget.spent, 0);
              const percent = Math.round(ratio * 100);
              
              let statusColor = "bg-emerald-500";
              if (percent >= 100) statusColor = "bg-red-500";
              else if (percent >= 80) statusColor = "bg-amber-500";

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-200">{budget.category}</span>
                    <span className="text-slate-400">
                      <span className="text-white">₹{budget.spent.toLocaleString("en-IN")}</span> / ₹{budget.limit.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <motion.div 
                      className={`h-full ${statusColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{percent}% Used</span>
                    <span>₹{remaining.toLocaleString("en-IN")} Remaining</span>
                  </div>
                </div>
              );
            })}
            {data.budgets.length === 0 && (
              <p className="text-slate-500 text-sm">No budgets set. Create one to track spending.</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6">
          <h2 className="text-lg font-serif text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {data.recentTransactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800/50 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === "expense" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                  }`}>
                    {tx.type === "expense" ? "↓" : "↑"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-200 text-sm">{tx.category}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })} · {tx.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${
                    tx.type === "expense" ? "text-red-400" : "text-emerald-400"
                  }`}>
                    {tx.type === "expense" ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
            {data.recentTransactions.length === 0 && (
              <p className="text-slate-500 text-sm">No recent transactions.</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
