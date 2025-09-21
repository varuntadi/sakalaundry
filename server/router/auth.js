// server/router/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/user");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "please-change-this";

const onlyDigits = (s = "") => (s || "").toString().replace(/\D/g, "");

function makeToken(user) {
  // keep payload small
  return jwt.sign({ id: user._id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * POST /signup
 * body: { name, phone, password, email? }
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: "Name, phone and password are required." });
    }

    const normalizedPhone = onlyDigits(phone);

    // check phone
    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) return res.status(400).json({ error: "Phone already in use." });

    // check email if provided
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) return res.status(400).json({ error: "Email already in use." });
    }

    const user = new User({
      name,
      phone: normalizedPhone,
      email: email ? email.toLowerCase() : undefined,
    });

    await user.setPassword(password);
    await user.save();

    const token = makeToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("Signup error:", err);
    // handle duplicate key more clearly
    if (err.code === 11000) return res.status(400).json({ error: "Duplicate value error" });
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /login
 * Accepts:
 * - { identifier: "you@example.com"|"9876543210", password }
 * - or { email, password } or { phone, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;

    if (!password) return res.status(400).json({ error: "Password is required." });

    const id = (identifier || email || phone || "").toString().trim();
    if (!id) return res.status(400).json({ error: "Provide email or phone number to sign in." });

    let user = null;
    if (/\S+@\S+\.\S+/.test(id)) {
      user = await User.findOne({ email: id.toLowerCase() });
    } else {
      user = await User.findOne({ phone: onlyDigits(id) });
    }

    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const valid = await user.verifyPassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials." });

    const token = makeToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
