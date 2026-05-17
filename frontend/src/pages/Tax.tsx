import React, { useState } from "react";
import { api } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DocumentArrowDownIcon, 
  CalculatorIcon, 
  BanknotesIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";

export function TaxPage() {
    const [form, setForm] = useState({ income: "", age: "", deductions: "" });
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleCalculate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/tax/calculate", form);
            setResult(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!result) return;
        setDownloading(true);
        try {
            const res = await api.post("/tax/report", form, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tax-report-${new Date().getFullYear()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err) {
            console.error("Download failed", err);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-6xl mx-auto pb-20 space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-light text-white tracking-wide">
                        Tax <span className="text-amber-500">Calculator</span>
                    </h1>
                    <p className="text-slate-400 mt-1 font-light">
                        Estimate your tax liability under the New Regime (FY 2024-25)
                    </p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                
                {/* Input Form */}
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 shadow-xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                            <CalculatorIcon className="w-6 h-6 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-light text-white">Input Details</h2>
                    </div>

                    <form onSubmit={handleCalculate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Annual Income (₹)</label>
                            <input 
                                type="number" 
                                value={form.income} 
                                onChange={e => setForm({...form, income: e.target.value})} 
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-mono text-lg" 
                                placeholder="e.g. 1200000"
                                required 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Age</label>
                            <input 
                                type="number" 
                                value={form.age} 
                                onChange={e => setForm({...form, age: e.target.value})} 
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-mono text-lg" 
                                placeholder="e.g. 30"
                                required 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex justify-between">
                                <span>Total Deductions (₹)</span>
                                <span className="text-slate-500 lowercase font-normal">optional</span>
                            </label>
                            <input 
                                type="number" 
                                value={form.deductions} 
                                onChange={e => setForm({...form, deductions: e.target.value})} 
                                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-mono text-lg" 
                                placeholder="e.g. 150000" 
                            />
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <InformationCircleIcon className="w-3 h-3" />
                                Limited deductions apply in New Regime
                            </p>
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-amber-500 text-black font-medium py-4 rounded-xl hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <span className="animate-pulse">Calculating...</span>
                            ) : (
                                <>
                                    <BanknotesIcon className="w-5 h-5" />
                                    Calculate Liability
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Result Section */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div 
                                key="result"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="p-8 border-b border-slate-800 bg-slate-950/30">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-xl font-light text-white">Tax Summary</h2>
                                            <p className="text-sm text-slate-400">Based on submitted details</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-slate-400 uppercase tracking-wider mb-1">Net Tax Payable</div>
                                            <div className="text-3xl font-mono text-white font-medium">₹{result.taxPayable.toLocaleString("en-IN")}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Taxable Income</div>
                                            <div className="text-lg text-white font-mono">₹{result.taxableIncome.toLocaleString("en-IN")}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Effective Rate</div>
                                            <div className="text-lg text-blue-400 font-mono">{result.effectiveRate}%</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900/30">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Calculation Breakdown</h3>
                                    <div className="space-y-3">
                                        {result.slabs.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500">{i+1}</span>
                                                    <span className="text-slate-300">{item.range}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-slate-500 text-xs bg-slate-800/50 px-2 py-1 rounded">{item.rate}</span>
                                                    <span className="font-mono text-white min-w-[80px] text-right">₹{item.amount.toLocaleString("en-IN")}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <motion.button 
                                        onClick={handleDownloadPDF} 
                                        disabled={downloading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full mt-8 border border-slate-700 bg-slate-800/50 text-white font-medium py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {downloading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <DocumentArrowDownIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                                Download Official Report
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center p-12 border border-slate-800/50 border-dashed rounded-2xl text-slate-500"
                            >
                                <BanknotesIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-light">Enter your income details to view tax liability</p>
                                <p className="text-sm mt-2 opacity-50">Supports New Regime Slabs</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
