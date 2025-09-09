// client/src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// Attach token from localStorage on each request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Could not read token from localStorage:", err);
  }
  return config;
});

// Response interceptor: handle 401 Unauthorized
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("authExpiry");
      } catch (e) {
        console.warn("Could not clear localStorage:", e);
      }
      // Redirect to login with reason flag
      window.location.href = "/login?reason=session_expired";
    }
    return Promise.reject(err);
  }
);

export default api;
