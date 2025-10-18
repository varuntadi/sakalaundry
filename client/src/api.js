// client/src/api.js
import axios from "axios";
import { auth } from "./auth";

/**
 * Base URL comes from Vite env:
 *  - Prod (Netlify): set VITE_API_URL=https://<your-backend>.onrender.com
 *  - Dev: client/.env.local -> VITE_API_URL=http://localhost:5000
 */
const BASE = import.meta.env.VITE_API_URL;

if (!BASE) {
  console.warn(
    "VITE_API_URL is not set. Set it in Netlify (prod) or client/.env.local (dev)."
  );
}

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // using Bearer tokens, not cookies
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

/** Friendly 401 handling (avoid loops on auth routes) */
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

/* ------------------------------------------------------------------ */
/*                           PRICES ENDPOINTS                         */
/* ------------------------------------------------------------------ */
export const getCatalog = async () => {
  const res = await api.get("/api/prices");
  return res.data;
};

export const updatePriceItem = async (id, partial) => {
  const res = await api.patch(`/api/prices/${encodeURIComponent(id)}`, partial);
  return res.data;
};

export const bulkUpsertPrices = async (payloadObject) => {
  const res = await api.post("/api/prices/bulk-upsert", payloadObject);
  return res.data;
};

// also attach to default for convenience
api.getCatalog = getCatalog;
api.updatePriceItem = updatePriceItem;
api.bulkUpsertPrices = bulkUpsertPrices;

export default api;
