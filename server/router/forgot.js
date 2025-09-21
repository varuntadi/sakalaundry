// server/router/forgot.js
// ESM module. Mount in index.js as: import forgotRouter from "./router/forgot.js"; app.use("/auth", forgotRouter);

import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const router = express.Router();

/* ----------------- Config ----------------- */
const OTP_LENGTH = Number(process.env.OTP_LENGTH) || 4; // default 4-digit OTP
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // cleanup expired OTPs every minute

/* ----------------- In-memory OTP store ----------------- */
// Map<phoneDigits, { otp: string, expiresAt: number }>
const otpMap = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of otpMap.entries()) {
    if (v.expiresAt <= now) otpMap.delete(k);
  }
}, CLEANUP_INTERVAL_MS);

/* ----------------- Helpers ----------------- */
const onlyDigits = (s = "") => (s || "").toString().replace(/\D/g, "");
function genNumericOtp(len = 4) {
  // crypto.randomInt per digit — uniform distribution
  let out = "";
  for (let i = 0; i < len; i++) {
    out += String(crypto.randomInt(0, 10));
  }
  return out;
}

/* ----------------- Routes ----------------- */

/**
 * POST /auth/forgot-password/request-otp
 * Body: { phone }
 * Response (dev): { ok: true, otp, ttlMs }
 *
 * Note: in production you should send OTP via SMS (Twilio/MSG91/AWS SNS).
 * For this app (in-app display) we return OTP in response so UI can show it.
 */
router.post("/forgot-password/request-otp", async (req, res) => {
  try {
    const phoneRaw = (req.body?.phone || "").toString().trim();
    if (!phoneRaw) return res.status(400).json({ error: "Phone is required" });

    const phone = onlyDigits(phoneRaw);
    if (!phone || phone.length < 6) return res.status(400).json({ error: "Invalid phone" });

    // Ensure user exists before generating OTP (prevents endless OTP creation)
    const User = mongoose.model("User");
    const user = await User.findOne({ phone });

    // For privacy avoid revealing existence — still return ok.
    if (!user) {
      return res.json({ ok: true, message: "If account exists, code generated." });
    }

    const otp = genNumericOtp(Math.max(1, Math.floor(OTP_LENGTH)));
    const expiresAt = Date.now() + OTP_TTL_MS;
    otpMap.set(phone, { otp, expiresAt });

    // Return OTP for in-app display (dev). In production, remove otp from response.
    return res.json({ ok: true, otp, ttlMs: OTP_TTL_MS });
  } catch (err) {
    console.error("❌ /auth/forgot-password/request-otp error:", err && (err.message || err));
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /auth/forgot-password/reset
 * Body: { phone, otp, newPassword }   (also accepts `password` as fallback)
 * Response: { ok: true, message }
 */
router.post("/forgot-password/reset", async (req, res) => {
  try {
    const phoneRaw = (req.body?.phone || "").toString().trim();
    const otpInput = (req.body?.otp || "").toString().trim();
    const newPassword = (req.body?.newPassword || req.body?.password || "").toString();

    if (!phoneRaw || !otpInput || !newPassword) {
      return res.status(400).json({ error: "phone, otp and newPassword are required" });
    }

    const phone = onlyDigits(phoneRaw);
    if (!phone) return res.status(400).json({ error: "Invalid phone" });

    const record = otpMap.get(phone);
    if (!record) return res.status(400).json({ error: "No OTP found or expired" });

    if (record.expiresAt <= Date.now()) {
      otpMap.delete(phone);
      return res.status(400).json({ error: "OTP expired" });
    }

    if (String(record.otp) !== String(otpInput)) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    const User = mongoose.model("User");
    const user = await User.findOne({ phone });
    if (!user) {
      otpMap.delete(phone);
      return res.status(404).json({ error: "User not found" });
    }

    // Update password: prefer setPassword helper if present
    if (typeof user.setPassword === "function") {
      await user.setPassword(newPassword);
    } else {
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    await user.save();

    // consume OTP
    otpMap.delete(phone);

    return res.json({ ok: true, message: "Password reset successful. Please login." });
  } catch (err) {
    console.error("❌ /auth/forgot-password/reset error:", err && (err.message || err));
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
