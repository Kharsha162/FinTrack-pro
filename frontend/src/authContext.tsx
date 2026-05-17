import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthTokens } from "./types";
import { api, setTokens } from "./api";

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokensState, setTokensState] = useState<AuthTokens | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("fintech_auth");
    if (stored) {
      const parsed = JSON.parse(stored) as { user: User; tokens: AuthTokens };
      setUser(parsed.user);
      setTokensState(parsed.tokens);
      setTokens(parsed.tokens);
    }
  }, []);

  const persist = (nextUser: User | null, nextTokens: AuthTokens | null) => {
    setUser(nextUser);
    setTokensState(nextTokens);
    setTokens(nextTokens);
    if (nextUser && nextTokens) {
      window.localStorage.setItem("fintech_auth", JSON.stringify({ user: nextUser, tokens: nextTokens }));
    } else {
      window.localStorage.removeItem("fintech_auth");
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    persist(res.data.user, { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { name, email, password });
    persist(res.data.user, { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
  };

  const logout = async () => {
    await api.post("/auth/logout");
    persist(null, null);
  };

  return (
    <AuthContext.Provider value={{ user, tokens: tokensState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

