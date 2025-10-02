// client/src/api.js
import axios from "axios";
import { auth } from "./auth";

/** Uses VITE_API_URL set in Netlify (or local .env.local) */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // we use Bearer tokens, not cookies
});

/** Attach token on every request */
api.interceptors.request.use(
  (config) => {
    const token = auth.token || localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** If a protected API returns 401, log out and send to login */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = String(err?.config?.url || "");
    // Don't redirect for the auth endpoints themselves
    const isAuthEndpoint = /\/login|\/signup|\/forgot/i.test(url);
    if (status === 401 && !isAuthEndpoint) {
      try { auth.logout(); } catch {}
      window.location.href = "/login?reason=session_expired";
    }
    return Promise.reject(err);
  }
);

export default api;
