// server/index.js
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

/* ----------------- CORS ----------------- */
const FALLBACK_FRONTEND = "https://sakalaundry.netlify.app";
const FRONTEND_URL = process.env.FRONTEND_URL || FALLBACK_FRONTEND;
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow non-browser requests (curl, Postman) where origin may be undefined
    if (!origin) return callback(null, true);
    if (typeof origin === "string" && origin.startsWith("file://")) return callback(null, false);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};
app.use(cors(corsOptions));

/* simple request logger */
app.use((req, res, next) => {
  console.log("➡", req.method, req.url);
  next();
});

/* ----------------- HTTP + Socket.IO ----------------- */
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
});

/* ----------------- Models ----------------- */
// User
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, required: true },
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", userSchema);

// Counter (for sequences)
const counterSchema = new mongoose.Schema({ _id: { type: String, required: true }, seq: { type: Number, default: 0 } });
const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Order
const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, index: true, unique: true, sparse: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: String, enum: ["Wash and Fold", "Wash and Iron", "Iron", "Dry Clean", "Others"], required: true },
    status: { type: String, enum: ["Pending", "In Progress", "Delivering", "Completed"], default: "Pending" },
    clothTypes: { type: [String], default: [] },
    pickupAddress: String,
    lat: Number,
    lng: Number,
    phone: String,
    notes: String,
    pickupDate: String,
    pickupTime: String,
    delivery: { type: String, enum: ["regular", "express"], default: "regular" },
  },
  { timestamps: true }
);
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

/* ----------------- Auth helpers ----------------- */
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

/* ----------------- Sequence helper ----------------- */
async function getNextSequence(name) {
  const doc = await Counter.findByIdAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return doc.seq;
}

/* ----------------- Socket.IO admin namespace ----------------- */
/* Use a dedicated namespace for admin sockets so only admins receive admin events */
const adminNs = io.of("/admin");

// Authenticate sockets connecting to /admin
adminNs.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("No token"));
    const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
    const payload = jwt.verify(raw, process.env.JWT_SECRET);
    if (!payload || payload.role !== "admin") return next(new Error("Forbidden"));
    socket.user = payload;
    return next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

adminNs.on("connection", (socket) => {
  console.log("🔌 Admin connected via socket:", socket.id, "user:", socket.user?.id);
  socket.on("disconnect", (reason) => {
    console.log("🔌 Admin disconnected:", socket.id, reason);
  });
});

/* ----------------- Twilio SMS helper (optional) ----------------- */
const TW_SID = process.env.TWILIO_ACCOUNT_SID;
const TW_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TW_FROM = process.env.TWILIO_FROM; // e.g. "+1XXXXXXXXXX"
const ADMIN_PHONE = process.env.ADMIN_PHONE; // e.g. "+91XXXXXXXXXX"

async function sendAdminSMSIfConfigured(order) {
  if (!TW_SID || !TW_TOKEN || !TW_FROM || !ADMIN_PHONE) {
    // not configured — skip silently
    console.log("ℹ️ Twilio not configured; skipping SMS send.");
    return;
  }

  try {
    // dynamic import so package is optional
    const TwilioModule = await import("twilio").catch((e) => {
      throw e;
    });
    const Twilio = TwilioModule.default || TwilioModule;
    const client = Twilio(TW_SID, TW_TOKEN);

    const text =
      `New order #${order.orderNumber || order._id}\n` +
      `Service: ${order.service}\n` +
      `Phone: ${order.phone || "-"}\n` +
      `Pickup: ${order.pickupAddress || "-"}\n` +
      `Delivery: ${order.delivery || "regular"}`;

    const msg = await client.messages.create({
      body: text,
      from: TW_FROM,
      to: ADMIN_PHONE,
    });
    console.log("📩 Twilio SMS sent, sid:", msg.sid);
  } catch (err) {
    console.warn("⚠️ sendAdminSMSIfConfigured failed:", err && err.message ? err.message : err);
  }
}

/* ----------------- Status normalization ----------------- */
/**
 * Accept common variants and map to canonical statuses used in DB:
 * - Delivered / Delivered -> Completed
 * - Delivering / Out for delivery -> Delivering
 * - In progress / progress -> In Progress
 * - pending -> Pending
 */
const CANONICAL_STATUSES = ["Pending", "In Progress", "Delivering", "Completed"];
function normalizeStatus(input) {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  if (s === "delivered" || s === "delivered." || s === "complete" || s === "completed") return "Completed";
  if (s.includes("deliver") && !s.includes("deliveri d")) return "Delivering"; // covers "delivering", "out for delivery"
  if (s === "in progress" || s === "inprogress" || s === "progress") return "In Progress";
  if (s === "pending") return "Pending";
  // title-case fallback
  const title = s
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  if (CANONICAL_STATUSES.includes(title)) return title;
  return null;
}

/* ----------------- Routes ----------------- */
app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: "Email already exists" });
    console.error("❌ /signup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email & password required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid password" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("❌ /login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// profile
app.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

/* ----------------- Orders (user) ----------------- */
/* POST /orders -> create with orderNumber */
app.post("/orders", auth, async (req, res) => {
  try {
    const { service, pickupAddress, phone, notes, clothTypes, pickupDate, pickupTime, delivery, lat, lng } = req.body;
    if (!service) return res.status(400).json({ error: "Service is required" });
    const orderNumber = await getNextSequence("orderNumber");
    const created = await Order.create({
      orderNumber,
      userId: req.user.id,
      service,
      clothTypes: clothTypes || [],
      pickupAddress,
      phone,
      notes,
      pickupDate,
      pickupTime,
      delivery: delivery || "regular",
      lat,
      lng,
      status: "Pending",
    });

    // Emit to all connected admins in /admin namespace
    try {
      adminNs.emit("admin:newOrder", created);
      console.log("📣 Emitted admin:newOrder", created._id);
    } catch (e) {
      console.warn("⚠️ Could not emit socket event:", e);
    }

    // Optionally send SMS to admin (safe, non-blocking)
    sendAdminSMSIfConfigured(created).catch((err) => console.warn("sendAdminSMSIfConfigured error:", err));

    return res.status(201).json(created);
  } catch (err) {
    console.error("❌ POST /orders error:", err);
    return res.status(500).json({ error: err.message || "Failed to create order" });
  }
});

/* GET /orders -> user's orders */
app.get("/orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ GET /orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* DELETE /orders/:id -> cancel (user only) */
app.delete("/orders/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order canceled" });
  } catch (err) {
    console.error("❌ DELETE /orders/:id error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

/* ----------------- Admin routes ----------------- */
/* GET /admin/orders -> all orders */
app.get("/admin/orders", auth, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ GET /admin/orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* PATCH /admin/orders/:id/status -> update status (normalizes input and accepts aliases) */
app.patch("/admin/orders/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const raw = req.body?.status;
    const normalized = normalizeStatus(raw);
    if (!normalized) {
      return res.status(400).json({ error: `Status must be one of: ${CANONICAL_STATUSES.join(", ")} (aliases allowed)` });
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, { status: normalized }, { new: true }).populate("userId", "name email");
    if (!updated) return res.status(404).json({ error: "Order not found" });

    // Emit update to admin namespace (so other admins see changes)
    try {
      adminNs.emit("admin:orderUpdated", updated);
    } catch (e) {
      console.warn("⚠️ Could not emit admin:orderUpdated", e);
    }

    return res.json(updated);
  } catch (err) {
    console.error("❌ PATCH /admin/orders/:id/status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.get("/admin/statuses", auth, adminOnly, (req, res) => {
  res.json({ statuses: CANONICAL_STATUSES });
});

/* ----------------- Root & start ----------------- */
app.get("/", (req, res) => res.send("🚀 API is running..."));

async function startServer() {
  const MONGO_URI = process.env.MONGO_URI || "";
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("✅ Connected to MongoDB");
    } catch (err) {
      console.error("❌ MongoDB connection error (continuing in dev):", err.message || err);
    }
  } else {
    console.warn("⚠️ No MONGO_URI provided — starting server without DB (dev only).");
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server + sockets listening on port ${PORT}`);
  });
}

startServer();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
