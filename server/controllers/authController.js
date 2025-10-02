import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js"; // adjust path if needed

// ===========================
// LOGIN
// ===========================
export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Accept either email or phone
    const query = email ? { email } : phone ? { phone } : null;
    if (!query) return res.status(400).json({ error: "Email or phone required" });

    // Find user by email or phone
    const user = await User.findOne(query);
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    // JWT payload includes role
    const payload = {
      id: user._id,
      name: user.name,
      role: user.role || "user",   // role: "user", "admin", or "delivery"
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role || "user",
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ===========================
// PROFILE
// ===========================
export const profile = async (req, res) => {
  try {
    // requireAuth middleware should set req.user
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
