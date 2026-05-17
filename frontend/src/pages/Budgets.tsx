import React, { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { Budget } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, TrashIcon, PencilIcon, BanknotesIcon, ChartBarIcon } from "@heroicons/react/24/solid";

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    category: "",
    limit: "",
    period: "monthly" as "monthly" | "yearly"
  });

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get("/budgets");
      setBudgets(res.data);
    } catch (err) {
      setError("Unable to load budgets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      category: form.category,
      limit: Number(form.limit),
      period: form.period
    };
    try {
      if (editingId) {
        await api.put(`/budgets/${editingId}`, payload);
      } else {
        await api.post("/budgets", payload);
      }
      setEditingId(null);
      setForm({
        category: "",
        limit: "",
        period: "monthly"
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError("Saving budget failed.");
    }
  };

  const handleEdit = (b: Budget) => {
    setEditingId(b.id);
    setForm({
      category: b.category,
      limit: String(b.limit),
      period: b.period
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    setError(null);
    try {
      await api.delete(`/budgets/${id}`);
      await load();
    } catch (err) {
      setError("Deleting budget failed.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-wide">Budget Control</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor spending limits and financial discipline</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingId(null);
            setForm({ category: "", limit: "", period: "monthly" });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          {showForm ? "Cancel" : "New Budget"}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, overflow: "hidden" }}
            animate={{ opacity: 1, height: "auto", overflow: "visible" }}
            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6 shadow-2xl">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
               
               <h2 className="text-xl font-serif text-white mb-6 relative z-10">
                 {editingId ? "Edit Budget Plan" : "Set New Budget Limit"}
               </h2>
               
               <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                 <div>
                   <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Category</label>
                   <input
                     type="text"
                     required
                     value={form.category}
                     onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                     className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all"
                     placeholder="e.g. Food, Travel"
                   />
                 </div>
                 
                 <div>
                   <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Limit Amount</label>
                   <div className="relative">
                     <span className="absolute left-4 top-3.5 text-slate-500">₹</span>
                     <input
                       type="number"
                       min="0"
                       required
                       value={form.limit}
                       onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
                       className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all"
                       placeholder="0.00"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Period</label>
                   <select
                     value={form.period}
                     onChange={e => setForm(f => ({ ...f, period: e.target.value as "monthly" | "yearly" }))}
                     className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all appearance-none"
                   >
                     <option value="monthly">Monthly</option>
                     <option value="yearly">Yearly</option>
                   </select>
                 </div>
                 
                 <div className="md:col-span-3 flex justify-end gap-3 mt-2">
                    <button 
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-8 py-3 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-xl transition-colors"
                    >
                      {editingId ? "Update Plan" : "Create Plan"}
                    </motion.button>
                 </div>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800/50" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed">
          <ChartBarIcon className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-light">No budget plans active</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-amber-500 hover:text-amber-400 text-sm font-medium">Create your first budget</button>
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {budgets.map(budget => {
            const percent = Math.min((budget.spent / budget.limit) * 100, 100);
            const remaining = Math.max(budget.limit - budget.spent, 0);
            const isOver = budget.spent > budget.limit;
            const statusColor = isOver ? "bg-red-500" : percent > 80 ? "bg-amber-500" : "bg-emerald-500";
            const textColor = isOver ? "text-red-400" : percent > 80 ? "text-amber-400" : "text-emerald-400";

            return (
              <motion.div
                key={budget.id}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 hover:bg-slate-800/60 transition-all hover:border-slate-700"
              >
                {/* Progress Background */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full ${statusColor}`} 
                  />
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">{budget.category}</h3>
                    <span className="text-xs uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded mt-1 inline-block">
                      {budget.period}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(budget)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(budget.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Spent</p>
                      <p className={`text-2xl font-bold ${textColor}`}>
                        ₹{budget.spent.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Limit</p>
                      <p className="text-lg font-medium text-slate-300">
                        ₹{budget.limit.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${statusColor}`}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                    <span className="text-xs text-slate-400">
                      {percent.toFixed(0)}% Used
                    </span>
                    <span className="text-xs font-medium text-slate-300">
                      ₹{remaining.toLocaleString("en-IN")} Remaining
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  );
}
