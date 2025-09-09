// src/pages/login.jsx
import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [show, setShow] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.email || !form.password) {
      setMsg({ type: "err", text: "Please fill all fields." });
      return false;
    }
    const okEmail = /\S+@\S+\.\S+/.test(form.email);
    if (!okEmail) {
      setMsg({ type: "err", text: "Please enter a valid email." });
      return false;
    }
    return true;
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!validate()) return;
    setLoading(true);

    try {
      // Adjust endpoint path if your backend uses /auth/login
      const res = await api.post("/login", form);

      // Save token and a client-side expiry timestamp (7 days)
      const token = res.data?.token || res.data?.accessToken || res.data?.data?.token;
      if (token) {
        try {
          localStorage.setItem("token", token);
          // 7 days in milliseconds
          const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
          localStorage.setItem("authExpiry", String(expiry));
        } catch (storageErr) {
          console.warn("Could not write auth info to localStorage", storageErr);
        }
      }

      setMsg({ type: "ok", text: "Welcome back! Redirecting…" });
      nav("/orders", { replace: true });
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data || err.message;
      setMsg({ type: "err", text: serverMsg || "Login failed" });
      console.error("Login error:", err?.response || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-logo">S</div>
          <div>
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-sub">Welcome to Saka Laundry</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={onLogin}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-pass">
              <input
                type={show ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShow(v => !v)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {msg.text && (
            <div className={`toast ${msg.type === "err" ? "toast-err" : "toast-ok"}`}>
              {msg.type === "err" ? "❌ " : "✅ "}{msg.text}
            </div>
          )}

          <button className="auth-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-foot">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
