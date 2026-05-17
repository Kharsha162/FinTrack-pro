import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Investment } from "../types";
import { useTheme } from "../themeContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  CurrencyRupeeIcon, 
  ChartBarIcon, 
  BriefcaseIcon,
  ClockIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

// --- Types ---
interface PortfolioAnalysis {
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  positions: Investment[];
}

interface MarketStock {
  symbol: string;
  name: string;
  segment: string;
  last: number;
  change: number;
  changePct: number;
  volume: number;
}

interface DemoAccount {
  id: number;
  balance: string;
  equity: string;
}

interface DemoTrade {
  id: number;
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  entryPrice: string;
  currentPrice?: number;
  pnl?: number;
  createdAt: string;
}

// --- Static Data (Market Universe) ---
const marketUniverse: MarketStock[] = [
  { symbol: "NSE:NIFTY", name: "NIFTY 50", segment: "Index", last: 22450.25, change: 135.4, changePct: 0.61, volume: 0 },
  { symbol: "NSE:BANKNIFTY", name: "NIFTY BANK", segment: "Index", last: 47820.9, change: -85.75, changePct: -0.18, volume: 0 },
  { symbol: "NSE:RELIANCE", name: "Reliance Ind.", segment: "Energy", last: 2900.0, change: 42.1, changePct: 1.4, volume: 5200000 },
  { symbol: "NSE:TCS", name: "TCS", segment: "IT Services", last: 4000.0, change: -25.75, changePct: -0.68, volume: 2450000 },
  { symbol: "NSE:HDFCBANK", name: "HDFC Bank", segment: "Banking", last: 1500.0, change: 18.4, changePct: 1.16, volume: 6830000 },
  { symbol: "NSE:INFY", name: "Infosys", segment: "IT Services", last: 1600.0, change: -12.3, changePct: -0.84, volume: 4120000 },
  { symbol: "NSE:IRCTC", name: "IRCTC", segment: "Travel", last: 900.0, change: 21.7, changePct: 2.32, volume: 3980000 },
  { symbol: "NSE:SBIN", name: "SBI", segment: "Banking", last: 750.0, change: -5.6, changePct: -0.73, volume: 7300000 },
  { symbol: "BTC", name: "Bitcoin", segment: "Crypto", last: 65000.0, change: 1200, changePct: 1.8, volume: 100000 },
  { symbol: "ETH", name: "Ethereum", segment: "Crypto", last: 3500.0, change: 45, changePct: 1.3, volume: 50000 },
  { symbol: "AAPL", name: "Apple", segment: "US Tech", last: 175.0, change: 2.5, changePct: 1.4, volume: 1000000 },
  { symbol: "TSLA", name: "Tesla", segment: "US Auto", last: 200.0, change: -3.2, changePct: -1.6, volume: 800000 }
];

// --- Components ---

function TradingViewChart({ symbol }: { symbol: string }) {
  const { theme } = useTheme();
  // Luxury theme adaptation
  const toolbarBg = theme === 'dark' ? '0f172a' : 'f1f5f9';
  
  // Clean symbol for TV
  const tvSymbol = symbol.includes(":") ? symbol : `NASDAQ:${symbol}`;

  const src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
    tvSymbol
  )}&interval=D&hidesidetoolbar=1&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=${toolbarBg}&studies=[]&theme=${theme}&style=1&timezone=Asia%2FKolkata&withdateranges=1&hidevolume=0&allow_symbol_change=1&calendar=1&hotlist=1&news=0&locale=en`;

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl">
      <iframe
        title={`Trading chart for ${symbol}`}
        src={src}
        loading="lazy"
        className="absolute inset-0 h-full w-full"
        allowFullScreen
      />
    </div>
  );
}

export function InvestmentsPage() {
  // State
  const [activeTab, setActiveTab] = useState<"portfolio" | "demo">("portfolio");
  const [loading, setLoading] = useState(true);
  
  // Portfolio State
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [portfolioForm, setPortfolioForm] = useState({ symbol: "", quantity: "", avgBuyPrice: "" });

  // Demo Trading State
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const [demoTrades, setDemoTrades] = useState<DemoTrade[]>([]);
  const [demoPrices, setDemoPrices] = useState<Record<string, number>>({});
  const [demoForm, setDemoForm] = useState({ type: "buy", quantity: "" });
  
  // Shared State
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NSE:NIFTY");

  // Initial Load
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Polling for Demo P&L (every 5 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === "demo") {
      interval = setInterval(fetchDemoPnL, 5000);
      fetchDemoPnL(); // Immediate call
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "portfolio") {
        const [posRes, anaRes] = await Promise.all([
          api.get("/investments/positions"),
          api.get("/investments/portfolio")
        ]);
        setInvestments(posRes.data);
        setAnalysis(anaRes.data);
      } else {
        const [accRes, tradesRes] = await Promise.all([
          api.get("/trading/account"),
          api.get("/trading/trades")
        ]);
        setDemoAccount(accRes.data);
        setDemoTrades(tradesRes.data);
      }
    } catch (err) {
      console.error("Load Error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoPnL = async () => {
    try {
      // Send empty prices to trigger backend mock generation, or send current known prices if we had a real feed
      const res = await api.post("/trading/pnl", { prices: {} }); 
      
      // Update local state with latest calculation
      if (res.data.prices) setDemoPrices(res.data.prices);
      if (res.data.equity && demoAccount) {
        setDemoAccount(prev => prev ? { ...prev, equity: res.data.equity } : null);
      }
      
      // Merge PnL into trades list
      if (res.data.positions) {
        setDemoTrades(prev => prev.map(t => {
          const updated = res.data.positions.find((p: any) => p.id === t.id);
          return updated ? { ...t, ...updated } : t;
        }));
      }
    } catch (err) {
      console.error("PnL Fetch Error:", err);
    }
  };

  const handlePortfolioSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/investments/positions", {
        symbol: portfolioForm.symbol.toUpperCase(),
        quantity: Number(portfolioForm.quantity),
        avgBuyPrice: Number(portfolioForm.avgBuyPrice)
      });
      setPortfolioForm({ symbol: "", quantity: "", avgBuyPrice: "" });
      loadData();
      toast.success("Position Added");
    } catch (err) {
      toast.error("Failed to add position");
    }
  };

  const handleDemoTrade = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Get price from mock prices or static data
      const currentPrice = demoPrices[selectedSymbol] || marketUniverse.find(s => s.symbol === selectedSymbol)?.last || 100;

      await api.post("/trading/trade", {
        symbol: selectedSymbol,
        type: demoForm.type,
        quantity: demoForm.quantity,
        price: currentPrice
      });
      
      setDemoForm({ ...demoForm, quantity: "" });
      loadData();
      fetchDemoPnL();
      toast.success(`Trade Executed: ${demoForm.type.toUpperCase()} ${selectedSymbol}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Trade Failed");
    }
  };

  // --- UI Helpers ---
  const activeStock = marketUniverse.find(s => s.symbol === selectedSymbol) || marketUniverse[0];
  const currentPrice = demoPrices[selectedSymbol] || activeStock.last;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-light text-white tracking-wide">
            Investments <span className="text-amber-500">&</span> Trading
          </h1>
          <p className="text-slate-400 mt-1 font-light">
            Manage your portfolio and practice with virtual capital
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-6 py-2 rounded-lg text-sm transition-all duration-300 ${
              activeTab === "portfolio" 
                ? "bg-amber-500 text-black font-medium shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab("demo")}
            className={`px-6 py-2 rounded-lg text-sm transition-all duration-300 ${
              activeTab === "demo" 
                ? "bg-emerald-500 text-black font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Demo Trading
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Market List & Forms */}
        <div className="space-y-6">
          
          {/* Market Ticker */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Market Watch</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
              {marketUniverse.map(stock => {
                const price = demoPrices[stock.symbol] || stock.last;
                const isUp = (demoPrices[stock.symbol] ? price > stock.last : stock.change > 0);
                
                return (
                  <motion.div
                    key={stock.symbol}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                    onClick={() => setSelectedSymbol(stock.symbol)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                      selectedSymbol === stock.symbol 
                        ? "border-amber-500/50 bg-slate-800/50" 
                        : "border-transparent hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{stock.symbol}</div>
                        <div className="text-xs text-slate-500">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">₹{price.toLocaleString()}</div>
                        <div className={`text-xs flex items-center justify-end gap-1 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isUp ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                          {Math.abs(stock.changePct)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Trade / Add Form */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-white mb-4 flex items-center gap-2">
              {activeTab === "demo" ? <span className="text-emerald-400">Place Order</span> : <span className="text-amber-400">Add Holding</span>}
            </h3>
            
            {activeTab === "demo" ? (
              <form onSubmit={handleDemoTrade} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Symbol</label>
                  <div className="text-xl text-white font-mono bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    {selectedSymbol}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Current Price</label>
                    <div className="text-white font-mono p-3">₹{currentPrice.toFixed(2)}</div>
                  </div>
                  <div>
                     <label className="text-xs text-slate-400 block mb-1">Type</label>
                     <select 
                       value={demoForm.type}
                       onChange={e => setDemoForm({...demoForm, type: e.target.value as any})}
                       className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 focus:border-emerald-500 outline-none"
                     >
                       <option value="buy">BUY</option>
                       <option value="sell">SELL</option>
                     </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={demoForm.quantity}
                    onChange={e => setDemoForm({...demoForm, quantity: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:border-emerald-500 outline-none font-mono"
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Est. Value</span>
                    <span>₹{((Number(demoForm.quantity) || 0) * currentPrice).toLocaleString()}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-xl font-medium text-black shadow-lg ${
                      demoForm.type === 'buy' 
                        ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20' 
                        : 'bg-red-500 hover:bg-red-400 shadow-red-500/20'
                    }`}
                  >
                    {demoForm.type.toUpperCase()} {selectedSymbol}
                  </motion.button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePortfolioSubmit} className="space-y-4">
                 <div>
                  <label className="text-xs text-slate-400 block mb-1">Symbol</label>
                  <input
                    value={portfolioForm.symbol}
                    onChange={e => setPortfolioForm({...portfolioForm, symbol: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:border-amber-500 outline-none uppercase"
                    placeholder="e.g. RELIANCE"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={portfolioForm.quantity}
                      onChange={e => setPortfolioForm({...portfolioForm, quantity: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:border-amber-500 outline-none"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Avg Price</label>
                    <input
                      type="number"
                      value={portfolioForm.avgBuyPrice}
                      onChange={e => setPortfolioForm({...portfolioForm, avgBuyPrice: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:border-amber-500 outline-none"
                      placeholder="₹"
                      required
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] mt-4"
                >
                  Add to Portfolio
                </motion.button>
              </form>
            )}
          </div>
        </div>

        {/* Middle & Right: Chart & Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Section */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-1 shadow-2xl">
             <TradingViewChart symbol={selectedSymbol} />
          </div>

          {/* Stats Grid */}
          {activeTab === "demo" && demoAccount && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Available Balance</div>
                 <div className="text-2xl font-light text-white font-mono">₹{Number(demoAccount.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
               </div>
               <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Equity</div>
                 <div className="text-2xl font-light text-white font-mono">₹{Number(demoAccount.equity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
               </div>
               <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">P&L (Unrealized)</div>
                 <div className={`text-2xl font-light font-mono ${Number(demoAccount.equity) >= 10000 ? 'text-emerald-400' : 'text-red-400'}`}>
                   {Number(demoAccount.equity) - 10000 > 0 ? '+' : ''}
                   ₹{(Number(demoAccount.equity) - 10000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                 </div>
               </div>
             </div>
          )}

          {activeTab === "portfolio" && analysis && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Invested</div>
                 <div className="text-2xl font-light text-white font-mono">₹{analysis.totalInvested.toLocaleString()}</div>
               </div>
               <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Current Value</div>
                 <div className="text-2xl font-light text-white font-mono">₹{analysis.totalValue.toLocaleString()}</div>
               </div>
               <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                 <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Returns</div>
                 <div className={`text-2xl font-light font-mono ${analysis.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                   {analysis.totalGain >= 0 ? '+' : ''}₹{analysis.totalGain.toLocaleString()} ({analysis.gainPercentage.toFixed(2)}%)
                 </div>
               </div>
             </div>
          )}

          {/* Positions Table */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center">
               <h3 className="text-sm font-semibold text-white">
                 {activeTab === "demo" ? "Open Positions" : "Your Holdings"}
               </h3>
               <button onClick={activeTab === "demo" ? fetchDemoPnL : loadData} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                 <ArrowPathIcon className="w-4 h-4 text-slate-400" />
               </button>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-400">
                 <thead className="bg-slate-950/50 text-xs uppercase tracking-wider">
                   <tr>
                     <th className="px-6 py-3 font-medium">Symbol</th>
                     <th className="px-6 py-3 font-medium text-right">Qty</th>
                     <th className="px-6 py-3 font-medium text-right">Avg. Price</th>
                     <th className="px-6 py-3 font-medium text-right">Cur. Price</th>
                     <th className="px-6 py-3 font-medium text-right">P&L</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/50">
                   {(activeTab === "demo" ? demoTrades : investments).map((item: any, i) => {
                     const isDemo = activeTab === "demo";
                     const symbol = isDemo ? item.symbol : item.symbol;
                     const qty = isDemo ? item.quantity : item.quantity;
                     const avg = isDemo ? item.entryPrice : item.avgBuyPrice;
                     // For demo, pnl comes from backend. For portfolio, calc locally if needed or use from analysis
                     const pnl = isDemo ? (item.pnl || 0) : ((item.currentPrice - item.avgBuyPrice) * item.quantity);
                     const curPrice = isDemo ? (item.currentPrice || avg) : item.currentPrice;

                     return (
                       <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                         <td className="px-6 py-4 font-medium text-white">{symbol}</td>
                         <td className="px-6 py-4 text-right font-mono">{qty}</td>
                         <td className="px-6 py-4 text-right font-mono">₹{Number(avg).toLocaleString()}</td>
                         <td className="px-6 py-4 text-right font-mono">₹{Number(curPrice).toLocaleString()}</td>
                         <td className={`px-6 py-4 text-right font-mono font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                           {pnl >= 0 ? '+' : ''}₹{Number(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                         </td>
                       </tr>
                     );
                   })}
                   {(activeTab === "demo" ? demoTrades : investments).length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                         No active positions found
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
