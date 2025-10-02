// client/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { auth } from "../auth";
import "../styles/auth.css";
import { FaEnvelope, FaPhoneAlt, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const onlyDigits = (s = "") => s.replace(/\D/g, "");
const emailOk = (e = "") => /\S+@\S+\.\S+/.test(e);

export default function Login() {
  const nav = useNavigate();
  const [tab, setTab] = useState("phone");
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.identifier || !form.password) {
      setMsg("Please fill all fields");
      return false;
    }
    if (tab === "email" && !emailOk(form.identifier)) {
      setMsg("Enter valid email");
      return false;
    }
    if (tab === "phone" && onlyDigits(form.identifier).length < 10) {
      setMsg("Enter valid phone number");
      return false;
    }
    return true;
  };

  const onLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMsg("");
    try {
      const payload =
        tab === "email"
          ? { email: form.identifier.trim(), password: form.password }
          : { phone: onlyDigits(form.identifier), password: form.password };

      const res = await api.post("/login", payload);

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) throw new Error("Invalid response from server");

      // ✅ Save to auth
      auth.login({ token, user });

      // Save expiry 7 days
      localStorage.setItem("authExpiry", String(Date.now() + 7 * 24 * 60 * 60 * 1000));

      nav("/orders", { replace: true });
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err.message || "Login failed";
      setMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap no-extra-space">
      <div className="auth-card slim">
        <div className="auth-body">
          <h1 className="hero-title styled">Welcome Back</h1>

          {/* Tabs */}
          <div className="tab-row">
            <button
              type="button"
              className={`tab ${tab === "phone" ? "active" : ""}`}
              onClick={() => setTab("phone")}
            >
              <FaPhoneAlt /> Phone
            </button>
            <button
              type="button"
              className={`tab ${tab === "email" ? "active" : ""}`}
              onClick={() => setTab("email")}
            >
              <FaEnvelope /> Email
            </button>
          </div>

          <form className="auth-form" onSubmit={onLogin}>
            <div className="row">
              <div className="row-icon">
                {tab === "phone" ? <FaPhoneAlt /> : <FaEnvelope />}
              </div>
              <div className="row-input">
                <input
                  name="identifier"
                  placeholder={tab === "phone" ? "Phone number" : "Email"}
                  value={form.identifier}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="row-icon"><FaLock /></div>
              <div className="row-input">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={onChange}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {msg && <div className="toast toast-err">❌ {msg}</div>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="bottom-row">
              <Link to="/signup">Sign Up</Link>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
