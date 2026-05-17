import React, { FormEvent, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname === "/register") setMode("register");
    else setMode("login");
  }, [location.pathname]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        navigate("/dashboard");
      } else if (mode === "register") {
        await register(name, email, password);
        navigate("/dashboard");
      } else if (mode === "forgot-password") {
        const res = await api.post("/auth/forgot-password", { email });
        setSuccess(res.data.message);
        setMode("reset-password");
      } else if (mode === "reset-password") {
        const res = await api.post("/auth/reset-password", { email, otp, newPassword });
        setSuccess(res.data.message);
        setTimeout(() => setMode("login"), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-yellow-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-slate-100 mb-2">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Join FinTrack Pro"}
            {mode === "forgot-password" && "Reset Password"}
            {mode === "reset-password" && "New Password"}
          </h2>
          <p className="text-slate-400 text-sm">
            {mode === "login" && "Sign in to access your wealth dashboard."}
            {mode === "register" && "Start your journey to financial clarity."}
            {mode === "forgot-password" && "Enter your email to receive an OTP."}
            {mode === "reset-password" && "Enter the OTP sent to your email."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-yellow-600/50 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}

            {(mode === "login" || mode === "register" || mode === "forgot-password" || mode === "reset-password") && (
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-yellow-600/50 transition-colors"
                  placeholder="name@example.com"
                  readOnly={mode === "reset-password"}
                />
              </div>
            )}

            {(mode === "login" || mode === "register") && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot-password")} className="text-xs text-yellow-500 hover:text-yellow-400">
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-yellow-600/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            )}

            {mode === "reset-password" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">OTP</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-yellow-600/50 transition-colors tracking-widest text-center"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-yellow-600/50 transition-colors"
                    placeholder="New secure password"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-200 text-sm text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  {mode === "login" && "Sign In"}
                  {mode === "register" && "Create Account"}
                  {mode === "forgot-password" && "Send OTP"}
                  {mode === "reset-password" && "Reset Password"}
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="mt-6 text-center text-sm text-slate-400">
          {mode === "login" && (
            <p>
              Don't have an account?{" "}
              <button onClick={() => setMode("register")} className="text-yellow-500 hover:text-yellow-400 font-medium">
                Sign up
              </button>
            </p>
          )}
          {mode === "register" && (
            <p>
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-yellow-500 hover:text-yellow-400 font-medium">
                Sign in
              </button>
            </p>
          )}
          {(mode === "forgot-password" || mode === "reset-password") && (
            <button onClick={() => setMode("login")} className="text-slate-500 hover:text-slate-300">
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
