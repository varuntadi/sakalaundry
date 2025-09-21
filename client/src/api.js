// client/src/api.js
import axios from "axios";

/* ----------------- Axios instance ----------------- */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000", // backend API URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // allow cookies if backend uses them
});

// Debug: log which API base URL is being used
console.log("📡 API Base URL:", api.defaults.baseURL);

/* ----------------- Request Interceptor ----------------- */
// Attach token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("⚠️ Could not read token from localStorage:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ----------------- Response Interceptor ----------------- */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      console.warn("⚠️ Unauthorized (401) → clearing token & redirecting");
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("authExpiry");
      } catch (e) {
        console.warn("⚠️ Could not clear localStorage:", e);
      }
      // Redirect to login with optional query param
      window.location.href = "/login?reason=session_expired";
    }

    return Promise.reject(err);
  }
);

export default api;
