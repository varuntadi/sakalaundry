import React, { useState } from "react";
import api from "../api";
import { auth } from "../auth";
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
      const res = await api.post("/login", form);
      auth.token = res.data?.token;
      setMsg({ type: "ok", text: "Welcome back! 🎉 Redirecting…" });
      nav("/orders");
    } catch (e) {
      setMsg({ type: "err", text: e?.response?.data?.error || "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-head">
          <div className="auth-logo">S</div>
          <div>
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-sub">Welcome to Saka Laundry</p>
          </div>
        </div>

        {/* Form */}
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

        {/* Footer */}
        <p className="auth-foot">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
