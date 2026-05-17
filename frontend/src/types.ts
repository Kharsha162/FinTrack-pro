export type Role = "user" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Transaction {
  id: number;
  type: "expense" | "income";
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  isRecurring: boolean;
  source: "manual" | "bank";
}

export interface Budget {
  id: number;
  category: string;
  limit: number;
  spent: number;
  period: "monthly" | "yearly";
  currency: string;
}

export interface Investment {
  id: number;
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currency: string;
  currentPrice: number;
}

