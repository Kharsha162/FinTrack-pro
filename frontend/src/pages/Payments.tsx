import React, { useState, useEffect } from "react";
import { api } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CurrencyRupeeIcon, 
  UserCircleIcon, 
  QrCodeIcon, 
  PhoneIcon, 
  BuildingLibraryIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

export function PaymentsPage() {
  const [upiForm, setUpiForm] = useState({ receiverVpa: "", amount: "", note: "" });
  const [upiResult, setUpiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentVPAs, setRecentVPAs] = useState<string[]>(["jaya@okaxis", "merchant@upi", "rent@ybl", "electricity@paytm"]);

  const simulateUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiForm.receiverVpa || !upiForm.amount) return;
    
    setLoading(true);
    try {
      const res = await api.post("/analytics/upi-simulate", {
        ...upiForm,
        amount: Number(upiForm.amount)
      });
      setUpiResult(res.data);
      setUpiForm({ receiverVpa: "", amount: "", note: "" });
      
      // Add to recents if not exists
      if (!recentVPAs.includes(upiForm.receiverVpa)) {
        setRecentVPAs([upiForm.receiverVpa, ...recentVPAs.slice(0, 7)]);
      }
    } catch (err) {
      console.error("UPI failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight">Payments</h1>
          <p className="text-slate-400 text-sm mt-1">Simulated UPI & Money Transfers</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
            <QrCodeIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Payment Section - GPay Style */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Transfer Methods */}
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: <QrCodeIcon className="w-6 h-6" />, label: "Scan QR" },
              { icon: <UserCircleIcon className="w-6 h-6" />, label: "Contacts" },
              { icon: <PhoneIcon className="w-6 h-6" />, label: "Phone No" },
              { icon: <BuildingLibraryIcon className="w-6 h-6" />, label: "Bank Trf" },
            ].map((item, i) => (
              <button key={i} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-semibold text-white mb-6">Recent Payments</h2>
            <div className="grid grid-cols-4 gap-6">
              {recentVPAs.map((vpa, i) => (
                <button 
                  key={i} 
                  onClick={() => setUpiForm({ ...upiForm, receiverVpa: vpa })}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-700 transition-colors">
                    {vpa[0].toUpperCase()}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate w-full text-center">{vpa.split('@')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Payment Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <form onSubmit={simulateUpi} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Pay via UPI ID</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="name@okaxis"
                  value={upiForm.receiverVpa}
                  onChange={e => setUpiForm({...upiForm, receiverVpa: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  required
                />
                <CurrencyRupeeIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Amount</label>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-serif text-slate-400">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={upiForm.amount}
                  onChange={e => setUpiForm({...upiForm, amount: e.target.value})}
                  className="w-full bg-transparent text-5xl font-bold focus:outline-none placeholder-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Add a note</label>
              <input 
                type="text" 
                placeholder="What is this for?"
                value={upiForm.note}
                onChange={e => setUpiForm({...upiForm, note: e.target.value})}
                className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
            >
              {loading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircleIcon className="w-6 h-6" />
                  Proceed to Pay
                </>
              )}
            </button>
          </form>

          {/* Result Modal / Overlay */}
          <AnimatePresence>
            {upiResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-500/40">
                  <CheckCircleIcon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">₹{upiResult.amount.toLocaleString()}</h3>
                <p className="text-emerald-500 font-semibold mb-6">Payment Successful</p>
                <div className="space-y-1 text-sm text-slate-400 mb-8">
                  <p>Paid to: <span className="text-white">{upiResult.vpa}</span></p>
                  <p>ID: <span className="font-mono text-xs">{upiResult.transactionId}</span></p>
                  <p>{new Date(upiResult.timestamp).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setUpiResult(null)}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Security Info */}
      <div className="flex items-center justify-center gap-8 py-6 opacity-40 grayscale">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.png/640px-UPI-Logo.png" alt="UPI" className="h-6" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/NPCI_logo.svg/1200px-NPCI_logo.svg.png" alt="NPCI" className="h-4" />
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-tighter text-slate-500">
          <CheckCircleIcon className="w-4 h-4" /> SECURE 256-BIT ENCRYPTION
        </div>
      </div>
    </div>
  );
}
