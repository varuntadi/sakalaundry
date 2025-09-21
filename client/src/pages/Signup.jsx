import React, { useMemo, useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";
import { FaUser, FaEnvelope, FaPhoneAlt, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

/* helpers */
const onlyDigits = (s = "") => s.replace(/\D/g, "");
const emailOk = (e = "") => /\S+@\S+\.\S+/.test(e);

function strengthLabel(pw = "") {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "#ef4444", bar: 28 };
  if (score === 3) return { label: "Okay", color: "#f59e0b", bar: 64 };
  return { label: "Strong", color: "#22c55e", bar: 100 };
}

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", agree: true });
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const pwMeta = useMemo(() => strengthLabel(form.password), [form.password]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.name || !form.phone || !form.password) {
      setMsg({ type: "err", text: "Please fill all required fields." });
      return false;
    }
    const digits = onlyDigits(form.phone);
    if (digits.length < 10) {
      setMsg({ type: "err", text: "Please enter a valid phone number (at least 10 digits)." });
      return false;
    }
    if (form.email && !emailOk(form.email)) {
      setMsg({ type: "err", text: "Please enter a valid email or leave it blank." });
      return false;
    }
    if (form.password.length < 8) {
      setMsg({ type: "err", text: "Password must be at least 8 characters." });
      return false;
    }
    if (!form.agree) {
      setMsg({ type: "err", text: "Please accept the Terms to continue." });
      return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { name: form.name.trim(), phone: onlyDigits(form.phone), password: form.password };
      if (form.email && form.email.trim()) payload.email = form.email.trim();

      const res = await api.post("/signup", payload);
      if (res.data?.token) {
        try {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("authExpiry", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        } catch (err) {
          console.warn("Could not write token to localStorage", err);
        }
      }

      setMsg({ type: "ok", text: "Account created! Redirecting…" });
      nav("/orders");
    } catch (err) {
      setMsg({ type: "err", text: err?.response?.data?.error || "Signup failed" });
      console.error("Signup error:", err?.response || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card slim">
        <div className="auth-body">
          <h1 className="hero-title styled">Create Account</h1>

          <form className="auth-form compact" onSubmit={submit} noValidate>
            {/* name */}
            <div className="row">
              <div className="row-icon"><FaUser /></div>
              <div className="row-input">
                <input name="name" placeholder="Full name" value={form.name} onChange={onChange} autoComplete="name" />
              </div>
            </div>

            {/* email */}
            <div className="row">
              <div className="row-icon"><FaEnvelope /></div>
              <div className="row-input">
                <input type="email" name="email" placeholder="Email (optional)" value={form.email} onChange={onChange} autoComplete="email" />
              </div>
            </div>

            {/* phone */}
            <div className="row">
              <div className="row-icon"><FaPhoneAlt /></div>
              <div className="row-input">
                <input name="phone" placeholder="Phone number" value={form.phone} onChange={onChange} inputMode="numeric" autoComplete="tel" />
              </div>
            </div>

            {/* password */}
            <div className="row">
              <div className="row-icon"><FaLock /></div>
              <div className="row-input">
                <input type={show ? "text" : "password"} name="password" placeholder="Create password" value={form.password} onChange={onChange} autoComplete="new-password" />
                <button type="button" className="eye-btn" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* password meter */}
            {form.password && (
              <div className="pw-meta compact-meter">
                <div className="pw-bar"><div className="pw-fill" style={{ width: `${pwMeta.bar}%`, background: pwMeta.color }} /></div>
                <div className="pw-label">Password strength: <strong style={{ color: pwMeta.color }}>{pwMeta.label}</strong></div>
              </div>
            )}

            {/* terms row inline */}
            <label className="terms-row">
              <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} />
              <span className="terms-text">
                I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms</a> &amp; <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
              </span>
            </label>

            {msg.text && <div className={`toast ${msg.type === "err" ? "toast-err" : "toast-ok"}`}>{msg.type === "err" ? "❌ " : "✅ "}{msg.text}</div>}

            <button className="auth-btn" type="submit" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>

            <div className="bottom-row">
              <div className="left-link"><Link to="/login" className="link-primary">Already have an account? Sign in</Link></div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
