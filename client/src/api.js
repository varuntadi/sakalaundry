// client/src/api.js
import axios from "axios";
import { auth } from "./auth";

/**
 * Base URL comes from Vite env:
 *  - Netlify (prod): set VITE_API_URL = https://<your-backend>.onrender.com
 *  - Local (dev): create client/.env.local with VITE_API_URL=http://localhost:5000
 */
const BASE = import.meta.env.VITE_API_URL;

if (!BASE) {
  // Helpful log if env is missing in a preview/local build
  // (does NOT break the app; axios will still throw on first call)
  console.warn(
    "VITE_API_URL is not set. Set it in Netlify (prod) or client/.env.local (dev)."
  );
}

const api = axios.create({
  baseURL: BASE,
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

/** Friendly 401 handling (don’t loop on auth endpoints) */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = String(err?.config?.url || "");
    const isAuthEndpoint = /\/login|\/signup|\/forgot/i.test(url);

    if (status === 401 && !isAuthEndpoint) {
      try { auth.logout(); } catch {}
      window.location.href = "/login?reason=session_expired";
    }

    return Promise.reject(err);
  }
);

export default api;
