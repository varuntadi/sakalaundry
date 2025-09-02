import React, { useMemo, useState } from "react";
import api from "../api";
import { auth } from "../auth";
import { useNavigate, Link } from "react-router-dom";

/** small helpers */
const onlyDigits = (s = "") => s.replace(/\D/g, "");
const emailOk = (e = "") => /\S+@\S+\.\S+/.test(e);

function strengthLabel(pw = "") {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "#ef4444", bar: 33 };
  if (score === 3) return { label: "Okay", color: "#f59e0b", bar: 66 };
  return { label: "Strong", color: "#22c55e", bar: 100 };
}

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    agree: true, // ticked by default; toggle if you want
  });
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const pw = form.password;
  const pwMeta = useMemo(() => strengthLabel(pw), [pw]);

  const validate = () => {
    if (!form.name || !form.email || !form.password) {
      setMsg({ type: "err", text: "Please fill all required fields." });
      return false;
    }
    if (!emailOk(form.email)) {
      setMsg({ type: "err", text: "Please enter a valid email." });
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
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: onlyDigits(form.phone), // normalize
        password: form.password,
      };
      const res = await api.post("/signup", payload);
      // if your API returns token on signup:
      if (res.data?.token) auth.token = res.data.token;
      setMsg({ type: "ok", text: "Account created! 🎉 Redirecting…" });
      nav("/orders");
    } catch (e) {
      setMsg({ type: "err", text: e?.response?.data?.error || "Signup failed" });
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
            <h1 className="auth-title">Create account</h1>
            <p className="auth-sub">Join Saka Laundry in seconds</p>
          </div>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <span>Full name</span>
            <input
              name="name"
              placeholder="Saka User"
              value={form.name}
              onChange={onChange}
              autoComplete="name"
              required
            />
          </label>

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
            <span>Phone (optional)</span>
            <input
              name="phone"
              placeholder="9876543210"
              value={form.phone}
              onChange={onChange}
              inputMode="numeric"
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-pass">
              <input
                type={show ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={onChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>

            {/* strength bar */}
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div
                  style={{
                    height: 6,
                    borderRadius: 8,
                    background: "rgba(2,6,23,.12)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pwMeta.bar}%`,
                      height: "100%",
                      background: pwMeta.color,
                      transition: "width .2s",
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginTop: 6 }}>
                  Password strength: <span style={{ color: pwMeta.color }}>{pwMeta.label}</span>
                </div>
              </div>
            )}
          </label>

          {/* Terms */}
          <label className="auth-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={onChange}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ color: "#334155", fontSize: 13 }}>
              I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms</a> &{" "}
              <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
            </span>
          </label>

          {/* toasts */}
          {msg.text && (
            <div className={`toast ${msg.type === "err" ? "toast-err" : "toast-ok"}`}>
              {msg.type === "err" ? "❌ " : "✅ "}{msg.text}
            </div>
          )}

          <button className="auth-btn" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
