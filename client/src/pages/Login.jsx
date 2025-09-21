import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";
import { FaEnvelope, FaPhoneAlt, FaLock, FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";

const onlyDigits = (s = "") => s.replace(/\D/g, "");
const emailOk = (e = "") => /\S+@\S+\.\S+/.test(e);

export default function Login() {
  const nav = useNavigate();
  // 🔹 default tab changed to "phone"
  const [tab, setTab] = useState("phone"); 
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [show, setShow] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const looksLikePhone = (s = "") => {
    const d = onlyDigits(s);
    return d.length >= 10;
  };

  const validate = () => {
    if (!form.identifier || !form.password) {
      setMsg({ type: "err", text: "Please fill all fields." });
      return false;
    }
    if (tab === "email") {
      if (!emailOk(form.identifier)) {
        setMsg({ type: "err", text: "Please enter a valid email." });
        return false;
      }
    } else {
      if (!looksLikePhone(form.identifier)) {
        setMsg({ type: "err", text: "Please enter a valid phone number (min 10 digits)." });
        return false;
      }
    }
    return true;
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { password: form.password };
      if (tab === "email") payload.email = form.identifier.trim();
      else payload.phone = onlyDigits(form.identifier);

      const res = await api.post("/login", payload);
      const token = res.data?.token || res.data?.accessToken || res.data?.data?.token;
      if (token) {
        try {
          localStorage.setItem("token", token);
          localStorage.setItem("authExpiry", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        } catch (err) {
          console.warn("Could not write token to localStorage", err);
        }
      }

      setMsg({ type: "ok", text: "Welcome back! Redirecting…" });
      nav("/orders", { replace: true });
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data || err?.message;
      setMsg({ type: "err", text: serverMsg || "Login failed" });
      console.error("Login error:", err?.response || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card slim">
        <div className="auth-body">
          <h1 className="hero-title styled">Welcome Back</h1>

          {/* 🔹 Phone first, Email second */}
          <div className="tab-row" role="tablist" aria-label="Login method">
            <button
              type="button"
              className={`tab ${tab === "phone" ? "active" : ""}`}
              onClick={() => setTab("phone")}
            >
              <FaPhoneAlt /> <span>Phone Login</span>
            </button>

            <button
              type="button"
              className={`tab ${tab === "email" ? "active" : ""}`}
              onClick={() => setTab("email")}
            >
              <FaEnvelope /> <span>Email Login</span>
            </button>
          </div>

          <form className="auth-form compact" onSubmit={onLogin} noValidate>
            {/* identifier row */}
            <div className="row">
              <div className="row-icon">{tab === "phone" ? <FaPhoneAlt /> : <FaEnvelope />}</div>
              <div className="row-input">
                <input
                  name="identifier"
                  placeholder={tab === "phone" ? "Phone number" : "Email"}
                  value={form.identifier}
                  onChange={onChange}
                  autoComplete={tab === "phone" ? "tel" : "username"}
                  inputMode={tab === "phone" ? "numeric" : "email"}
                />
              </div>
            </div>

            {/* password row */}
            <div className="row">
              <div className="row-icon"><FaLock /></div>
              <div className="row-input">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={onChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {msg.text && (
              <div className={`toast ${msg.type === "err" ? "toast-err" : "toast-ok"}`}>
                {msg.type === "err" ? "❌ " : "✅ "}
                {msg.text}
              </div>
            )}

            <button className="auth-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="or-divider"><span>OR CONTINUE WITH</span></div>

            <button
              type="button"
              className="google-btn"
              onClick={() => alert("Google login placeholder")}
            >
              <FaGoogle /> <span>Continue with Google</span>
            </button>

            <div className="bottom-row">
              <div className="left-link">
                <Link to="/signup" className="link-primary">Don't have an account? Sign Up</Link>
              </div>
              <div className="right-link">
                <Link to="/forgot-password" className="link-muted">Forgot password?</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
