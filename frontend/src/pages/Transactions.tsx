import React, { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import { Transaction } from "../types";
import { CameraIcon, MicrophoneIcon, BanknotesIcon, CalendarIcon, ArrowPathIcon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Salary", "Investment"];

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Balance Stats
  const [stats, setStats] = useState({
    balance: 0,
    credited: 0,
    debited: 0
  });

  // Form State
  const [form, setForm] = useState({
    type: "expense" as "expense" | "income",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    isRecurring: false
  });

  // UI State
  const [showKeypad, setShowKeypad] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [listening, setListening] = useState(false);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data);
      
      // Calculate Stats
      let credited = 0;
      let debited = 0;
      res.data.forEach((t: any) => {
        if (t.type === 'income') credited += Number(t.amount);
        else debited += Number(t.amount);
      });
      setStats({
        credited,
        debited,
        balance: credited - debited
      });
    } catch (err) {
      setError("Unable to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    
    if (!form.amount || Number(form.amount) <= 0) {
        setError("Please enter a valid amount");
        return;
    }

    const payload = {
      type: form.type,
      amount: Number(form.amount),
      category: form.category || "Uncategorized",
      description: form.description,
      date: form.date || new Date().toISOString(),
      isRecurring: form.isRecurring
    };
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post("/transactions", payload);
      }
      setForm({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
        isRecurring: false
      });
      setEditingId(null);
      setShowKeypad(false);
      await load();
    } catch (err) {
      setError("Saving transaction failed.");
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setForm({
      type: tx.type,
      amount: String(tx.amount),
      category: tx.category,
      description: tx.description,
      date: tx.date.slice(0, 10),
      isRecurring: tx.isRecurring
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Are you sure?")) return;
      try {
          await api.delete(`/transactions/${id}`);
          await load();
      } catch (err) {
          setError("Delete failed");
      }
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setScanning(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    try {
        const res = await api.post("/transactions/scan", formData);
        setForm({
            ...form,
            amount: String(res.data.amount || ""),
            date: res.data.date ? new Date(res.data.date).toISOString().slice(0, 10) : form.date,
            description: res.data.description || res.data.merchant || "",
            category: "Bills" // Auto-categorize as Bills for now
        });
        alert(`Scan successful! Found: ₹${res.data.amount}`);
    } catch (err) {
        alert("Scan failed. Please try again.");
    } finally {
        setScanning(false);
    }
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    
    recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setListening(false);
        if (event.error === 'not-allowed') {
            alert("Microphone access was denied. Please enable it in your browser settings.");
        } else if (event.error === 'network') {
            alert("Network error occurred during speech recognition.");
        } else {
            alert(`Speech recognition error: ${event.error}`);
        }
    };
    
    recognition.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        console.log("Voice Input:", text);
        
        // Send to backend for parsing
        try {
            const res = await api.post("/transactions/voice", { text });
            // It auto-creates the transaction!
            alert(`Added: ${res.data.description} (₹${res.data.amount})`);
            load();
        } catch (err) {
            alert("Could not process voice command.");
        }
    };
    
    recognition.start();
  };

  // Keypad Logic
  const handleKeypadPress = (key: string) => {
      if (key === 'backspace') {
          setForm(f => ({ ...f, amount: f.amount.slice(0, -1) }));
      } else if (key === 'done') {
          setShowKeypad(false);
      } else if (key === '.') {
          if (!form.amount.includes('.')) {
              setForm(f => ({ ...f, amount: f.amount + key }));
          }
      } else {
          setForm(f => ({ ...f, amount: f.amount + key }));
      }
  };

  return (
    <section className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dynamic Summary Cards */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Current Balance</p>
          <p className={`text-3xl font-bold font-serif ${stats.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
            ₹{stats.balance.toLocaleString()}
          </p>
          <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-2/3" />
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total Credited</p>
          <p className="text-3xl font-bold font-serif text-emerald-400">₹{stats.credited.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-500">↑</span> Money In
          </p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total Debited</p>
          <p className="text-3xl font-bold font-serif text-red-400">₹{stats.debited.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-red-500">↓</span> Money Out
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-8 lg:grid-cols-3 items-start"
      >
        {/* Left Column: Form */}
        <div className="lg:col-span-1 space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-xl p-6 shadow-2xl">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-xl font-serif text-white tracking-wide">
                    {editingId ? "Edit Transaction" : "New Entry"}
                    </h1>
                    <div className="flex gap-3">
                        {/* Voice Button */}
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button" 
                            onClick={handleVoice}
                            className={`p-2.5 rounded-full transition-all border border-slate-700 ${listening ? 'bg-red-500/20 text-red-500 border-red-500 animate-pulse' : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                            title="Voice Input"
                        >
                            <MicrophoneIcon className="w-5 h-5" />
                        </motion.button>
                        
                        {/* Scan Button */}
                        <motion.label 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`cursor-pointer p-2.5 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all ${scanning ? 'animate-pulse' : ''}`} title="Scan Bill">
                            <input type="file" accept="image/*" className="hidden" onChange={handleScan} disabled={scanning} />
                            <CameraIcon className="w-5 h-5" />
                        </motion.label>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount Display & Keypad Trigger */}
                    <div className="relative group">
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Amount</label>
                        <div 
                            onClick={() => setShowKeypad(!showKeypad)}
                            className="w-full text-4xl font-bold bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 px-4 text-white placeholder-slate-600 cursor-pointer flex items-center hover:border-amber-500/50 transition-colors"
                        >
                            <span className="text-amber-500 mr-2 font-serif">₹</span>
                            {form.amount || "0"}
                            <span className="ml-auto text-[10px] uppercase tracking-widest bg-slate-800/80 px-2 py-1 rounded text-slate-400">Keypad</span>
                        </div>
                        
                        {/* Keypad Overlay */}
                        <AnimatePresence>
                            {showKeypad && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute top-full left-0 right-0 z-20 mt-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-4 grid grid-cols-3 gap-3"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                                        <motion.button
                                            key={num}
                                            whileTap={{ scale: 0.95 }}
                                            type="button"
                                            onClick={() => handleKeypadPress(String(num))}
                                            className="p-4 text-xl font-medium text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-colors"
                                        >
                                            {num}
                                        </motion.button>
                                    ))}
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => handleKeypadPress('backspace')}
                                        className="p-4 text-white bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors flex items-center justify-center"
                                    >
                                        ⌫
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => setShowKeypad(false)}
                                        className="col-span-3 p-3 text-sm font-bold uppercase tracking-wider text-slate-900 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors"
                                    >
                                        Done
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-950/30 p-1.5 rounded-xl border border-slate-800/50">
                        <button
                            type="button"
                            onClick={() => setForm({...form, type: 'expense'})}
                            className={`py-2.5 text-sm font-medium rounded-lg transition-all ${form.type === 'expense' ? 'bg-red-500/10 text-red-400 shadow-sm border border-red-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({...form, type: 'income'})}
                            className={`py-2.5 text-sm font-medium rounded-lg transition-all ${form.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            Income
                        </button>
                    </div>

                    {/* Category & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Category</label>
                            <div 
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none cursor-pointer flex justify-between items-center hover:border-slate-600 transition-colors"
                            >
                                {form.category || "Select..."}
                                <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                            </div>
                            
                            <AnimatePresence>
                                {showCategoryDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 right-0 z-10 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <div
                                                key={cat}
                                                onClick={() => {
                                                    setForm({...form, category: cat});
                                                    setShowCategoryDropdown(false);
                                                }}
                                                className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white cursor-pointer transition-colors border-b border-slate-800/50 last:border-0"
                                            >
                                                {cat}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm({...form, date: e.target.value})}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all placeholder-slate-600"
                            placeholder="What was this for?"
                        />
                    </div>

                    {/* Recurring Toggle */}
                    <div className="flex items-center gap-4 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                        <div 
                            onClick={() => setForm({...form, isRecurring: !form.isRecurring})}
                            className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${form.isRecurring ? 'bg-amber-500' : 'bg-slate-700'}`}
                        >
                            <motion.div 
                                layout
                                className="w-5 h-5 rounded-full bg-white shadow-sm" 
                            />
                        </div>
                        <span className="text-sm text-slate-300 font-medium">Recurring Payment</span>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-red-400 text-xs bg-red-900/20 p-3 rounded-xl border border-red-900/50"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                    >
                        {editingId ? "Update Transaction" : "Save Transaction"}
                    </motion.button>
                </form>
            </div>
        </div>

        {/* Right Column: Transaction List */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-serif text-white tracking-wide">Recent Activity</h2>
                <button onClick={load} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            
            {loading ? (
                 <div className="space-y-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-24 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800/50" />
                    ))}
                 </div>
            ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed">
                    <BanknotesIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-light">No transactions recorded yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <motion.div 
                            key={tx.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="group relative bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 hover:border-slate-700 rounded-2xl p-5 transition-all hover:bg-slate-800/40"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {tx.category && tx.category.length > 0 ? tx.category[0].toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium text-lg">{tx.category || "Uncategorized"}</h3>
                                        <p className="text-sm text-slate-400 mb-1">{tx.description || tx.type}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-slate-700/50">
                                                <CalendarIcon className="w-3 h-3" />
                                                {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            {tx.isRecurring && (
                                                <span className="text-[11px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md flex items-center gap-1.5 border border-blue-500/20">
                                                    <ArrowPathIcon className="w-3 h-3" />
                                                    Recurring
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-xl tracking-tight ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                        {tx.type === 'income' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                                    </p>
                                    <div className="flex gap-3 justify-end mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <button onClick={() => handleEdit(tx)} className="text-xs font-medium text-amber-500 hover:text-amber-400 uppercase tracking-wider">Edit</button>
                                        <button onClick={() => handleDelete(tx.id)} className="text-xs font-medium text-red-400 hover:text-red-300 uppercase tracking-wider">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
      </motion.div>
    </section>
  );
}
