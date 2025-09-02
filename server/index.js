import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 🔰 Graceful error if body JSON is invalid
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  next();
});

// 🧭 show which folder is running
console.log("🧭 process.cwd() =", process.cwd());

// 🔎 log every request
app.use((req, res, next) => {
  console.log("➡", req.method, req.url);
  next();
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ User Schema + Model (with role)
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, required: true },
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

// 🧺 Order Schema + Model (with pickup details)
const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: {
      type: String,
      enum: ["Wash and Fold", "Wash and Iron", "Iron", "Dry Clean"],
      required: true,
    },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    pickupAddress: String,
    phone: String,
    notes: String,
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", orderSchema);

// 🔐 JWT auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // { id, role }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// 👑 Admin-only guard
function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

// 🧪 sanity route
app.post("/signup-test", (req, res) => {
  return res.json({ ok: true, msg: "POST /signup-test reached the server 👍" });
});

console.log("✅ Signup route is loaded in index.js");

// ✅ Signup
app.post("/signup", async (req, res) => {
  console.log("📩 /signup route was hit with data:", req.body);
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("❌ /signup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ Login (token includes role)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("❌ /login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// 👤 Profile (protected)
app.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

/* ---------- USER ORDER ROUTES (no status update) ---------- */

// ➕ Create order (protected)
app.post("/orders", auth, async (req, res) => {
  const { service, pickupAddress, phone, notes } = req.body;
  if (!service) return res.status(400).json({ error: "Service is required" });

  const order = await Order.create({
    userId: req.user.id,
    service,
    pickupAddress,
    phone,
    notes,
  });

  res.status(201).json(order);
});

// 📄 List my orders (protected)
app.get("/orders", auth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

// ❌ Cancel my order (protected)
app.delete("/orders/:id", auth, async (req, res) => {
  const order = await Order.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ message: "Order canceled" });
});

/* ---------- ADMIN ROUTES ---------- */

// 👑 Admin: list all orders
app.get("/admin/orders", auth, adminOnly, async (req, res) => {
  const orders = await Order.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// 👑 Admin: update any order status
app.patch("/admin/orders/:id/status", auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  const allowed = ["Pending", "In Progress", "Completed"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  await order.save();

  const updated = await Order.findById(order._id).populate("userId", "name email");
  res.json(updated);
});

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ✅ Start Server — updated for network access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://10.21.115.69:${PORT}`);
});