import axios from "axios";
import { AuthTokens } from "./types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

let tokens: AuthTokens | null = null;

export function setTokens(newTokens: AuthTokens | null) {
  tokens = newTokens;
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

api.interceptors.request.use(config => {
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

