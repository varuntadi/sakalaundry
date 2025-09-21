import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/auth.css";
import { FaPhoneAlt } from "react-icons/fa";
import { HiOutlineKey } from "react-icons/hi2";
import { FaKey } from "react-icons/fa";

/* helpers */
const onlyDigits = (s = "") => (s || "").toString().replace(/\D/g, "");

export default function ForgotPassword() {
  const nav = useNavigate();

  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [passwordStrength, setPasswordStrength] = useState("");

  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Request OTP
  const requestOtp = async (ev) => {
    ev?.preventDefault?.();
    setNotice({ type: "", text: "" });
    setDigits(["", "", "", ""]);
    setNewPassword("");
    setPasswordStrength("");

    const phoneDigits = onlyDigits(phone);
    if (!phoneDigits || phoneDigits.length < 6) {
      setNotice({ type: "error", text: "Please enter a valid phone number (min 6 digits)." });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/request-otp", { phone: phoneDigits });
      setNotice({ type: "ok", text: "Verification code sent to your phone." });

      // Dev: autofill OTP if server returns one
      const otpFromServer = res?.data?.otp ? String(res.data.otp) : "";
      if (otpFromServer) {
        const arr = otpFromServer.slice(0, 4).split("");
        while (arr.length < 4) arr.push("");
        setDigits(arr);
        setTimeout(() => refs[3].current?.focus(), 80);
      } else {
        setTimeout(() => refs[0].current?.focus(), 80);
      }
    } catch (err) {
      console.error("requestOtp error:", err);
      const server = err?.response?.data;
      setNotice({
        type: "error",
        text: server?.message || "Failed to send code. Try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  // OTP handlers (4 small inputs)
  const otpString = () => digits.join("");
  const setOtpFromString = (s) => {
    const arr = s.slice(0, 4).split("").concat(Array(4).fill("")).slice(0, 4);
    setDigits(arr);
  };

  const onOtpChange = (idx, value) => {
    const d = onlyDigits(value).slice(0, 1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < 3) refs[idx + 1].current?.focus();
  };

  const onOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      } else if (idx > 0) {
        refs[idx - 1].current?.focus();
        const next = [...digits];
        next[idx - 1] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs[idx - 1].current?.focus();
    } else if (e.key === "ArrowRight" && idx < 3) {
      refs[idx + 1].current?.focus();
    }
  };

  const onOtpPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text") || "";
    const d = onlyDigits(text);
    if (!d) return;
    setOtpFromString(d);
    const fillLen = Math.min(4, d.length);
    const focusIndex = Math.max(0, fillLen - 1);
    setTimeout(() => refs[focusIndex].current?.focus(), 50);
  };

  // Password strength
  const checkStrength = (pwd) => {
    if (!pwd) return "";
    if (pwd.length < 6) return "Weak";
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd)) return "Strong";
    return "Medium";
  };

  const handlePasswordChange = (e) => {
    const v = e.target.value;
    setNewPassword(v);
    setPasswordStrength(checkStrength(v));
  };

  // Submit reset (button below new password)
  const submitReset = async (ev) => {
    ev?.preventDefault?.();
    setNotice({ type: "", text: "" });

    const phoneDigits = onlyDigits(phone);
    const otpVal = otpString();

    if (!phoneDigits || otpVal.length < 4 || !newPassword) {
      setNotice({ type: "error", text: "Phone, 4-digit code and new password are required." });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/reset", {
        phone: phoneDigits,
        otp: otpVal,
        newPassword,
      });
      setNotice({ type: "ok", text: res?.data?.message || "Password reset successful. Redirecting…" });
      setTimeout(() => nav("/login"), 900);
    } catch (err) {
      console.error("reset error:", err);
      const server = err?.response?.data;
      setNotice({ type: "error", text: server?.message || "Reset failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card slim">
        <div className="auth-body">
          {/* Lock badge */}
          <div className="auth-lock-badge" aria-hidden>
            <div className="auth-lock-icon">🔒</div>
          </div>

          <h1 className="hero-title styled">Forgot Password</h1>
          <p className="sub-muted">Enter your mobile number to reset your password.</p>

          {/* Phone + Send code inline */}
          <form className="auth-form compact" onSubmit={requestOtp} noValidate>
            <div className="inline-row">
              <div className="row-icon"><FaPhoneAlt /></div>

              <div className="inline-input-wrap">
                <input
                  name="phone"
                  placeholder="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                  autoComplete="tel"
                  aria-label="Mobile number"
                />
              </div>

              <button className="send-btn" type="submit" disabled={loading} aria-disabled={loading}>
                {loading ? "Sending…" : "Send code"}
              </button>
            </div>

            {notice.text && (
              <div
                className={`notice-inline ${notice.type === "error" ? "notice-error" : "notice-ok"}`}
                role={notice.type === "error" ? "alert" : "status"}
              >
                {notice.text}
              </div>
            )}
          </form>

          {/* OTP (4 boxes) */}
          <div className="otp-section" style={{ marginTop: 18 }}>
            <label className="sr-only" htmlFor="otp">OTP</label>
            <div className="otp-inputs" onPaste={onOtpPaste} aria-label="Enter OTP">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={refs[i]}
                  className="otp-input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={d}
                  onChange={(e) => onOtpChange(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* New password (below OTP) */}
          <form className="auth-form compact" onSubmit={submitReset} noValidate>
            <div className="row small-row" style={{ marginTop: 16 }}>
              <div className="row-icon" aria-hidden />
              <div className="row-input">
                <input
                  name="newPassword"
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
                {newPassword && (
                  <div className={`password-hint strength-${passwordStrength.toLowerCase()}`}>
                    {passwordStrength} password
                  </div>
                )}
              </div>
            </div>

            {/* Reset button placed below the new password */}
            <div style={{ marginTop: 18 }}>
              <button
                className="primary-reset-btn"
                type="submit"
                disabled={loading}
                aria-disabled={loading}
              >
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </div>
          </form>

          {/* Bottom links */}
          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
            <Link to="/login" className="link-primary small">Back to login</Link>
            <div>
              <Link to="/help" className="link-muted small" style={{ marginRight: 8 }}>Need help?</Link>
              <Link to="/terms" className="link-muted small">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
