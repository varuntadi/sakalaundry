// server/index.js
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import forgotRouter from "./router/forgot.js";
import ticketsRouter from "./router/tickets.js";

import requireAuth from "./middleware/auth.js";
import requireAdmin from "./middleware/requireAdmin.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

/* ----------------- CORS ----------------- */
const FALLBACK_FRONTEND = "http://localhost:5173";
const FRONTEND_URL = process.env.FRONTEND_URL || FALLBACK_FRONTEND;
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (typeof origin === "string" && origin.startsWith("file://")) return callback(null, false);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS not allowed for: ${origin}`), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: false, // we use Bearer tokens, not cookies
  })
);

/* simple logger */
app.use((req, _res, next) => {
  console.log("➡", req.method, req.url);
  next();
});

/* ----------------- HTTP + Socket.IO ----------------- */
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: false },
  pingInterval: 25000,
  pingTimeout: 60000,
});
app.set("io", io);

/* ----------------- Models ----------------- */
import mongoosePkg from "mongoose";
const { Schema, model, models } = mongoosePkg;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);
userSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};
userSchema.methods.verifyPassword = function (plain) {
  return this.passwordHash ? bcrypt.compare(plain, this.passwordHash) : false;
};
const User = models.User || model("User", userSchema);

const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = models.Counter || model("Counter", counterSchema);

const orderSchema = new Schema(
  {
    orderNumber: { type: Number, index: true, unique: true, sparse: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
const Order = models.Order || model("Order", orderSchema);

/* ----------------- Helpers ----------------- */
const JWT_SECRET = process.env.JWT_SECRET; // one true secret
const onlyDigits = (s = "") => (s || "").toString().replace(/\D/g, "");
const CANONICAL_STATUSES = ["Pending", "In Progress", "Delivering", "Completed"];
const normalizeStatus = (input) => {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  if (["delivered", "complete", "completed"].includes(s)) return "Completed";
  if (s.includes("deliver")) return "Delivering";
  if (s === "in progress" || s === "progress") return "In Progress";
  if (s === "pending") return "Pending";
  const title = s.split(/\s+/).map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
  return CANONICAL_STATUSES.includes(title) ? title : null;
};
async function getNextSequence(name) {
  const doc = await Counter.findByIdAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
}

/* fingerprint log helper */
const fp = (s) => crypto.createHash("sha256").update(String(s || "")).digest("hex").slice(0, 8);

/* ----------------- Socket auth (admin ns) ----------------- */
io.of("/admin").use((socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token || socket.handshake.query?.token || "";
    if (!authToken) return next(new Error("No token"));
    const raw = typeof authToken === "string" && authToken.startsWith("Bearer ") ? authToken.slice(7) : authToken;
    const payload = jwt.verify(raw, JWT_SECRET);
    if (!payload || payload.role !== "admin") return next(new Error("Forbidden"));
    socket.user = payload;
    return next();
  } catch (err) {
    console.warn("adminNs auth error:", err.message || err);
    return next(new Error("Authentication error"));
  }
});

/* ----------------- Routers ----------------- */
app.use("/auth", forgotRouter);
app.use("/api/tickets", ticketsRouter);

/* ----------------- Basic routes ----------------- */
app.get("/api", (_req, res) => res.json({ ok: true, service: "saka-laundry-api" }));
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

/* ----------------- Auth ----------------- */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ error: "Name, phone and password are required." });

    const normalizedPhone = onlyDigits(phone);
    if (await User.findOne({ phone: normalizedPhone })) return res.status(400).json({ error: "Phone already in use." });
    if (email && (await User.findOne({ email: email.toLowerCase() }))) return res.status(400).json({ error: "Email already in use." });

    const user = new User({ name, phone: normalizedPhone, email: email ? email.toLowerCase() : undefined });
    await user.setPassword(password);
    await user.save();

    console.log("SIGN using JWT_SECRET fingerprint:", fp(JWT_SECRET));
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ message: "User registered", token, user: { id: user._id, name, phone: user.phone, email: user.email, role: user.role } });
  } catch (err) {
    console.error("❌ /signup error:", err);
    if (err?.code === 11000) return res.status(409).json({ error: "Duplicate value" });
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required." });

    const id = (identifier || email || phone || "").toString().trim();
    if (!id) return res.status(400).json({ error: "Provide email or phone" });

    const isEmail = /\S+@\S+\.\S+/.test(id);
    const query = isEmail ? { email: id.toLowerCase() } : { phone: onlyDigits(id) };
    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const valid = await user.verifyPassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials." });

    console.log("SIGN using JWT_SECRET fingerprint:", fp(JWT_SECRET));
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (err) {
    console.error("❌ /login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------- Protected ----------------- */
app.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash -__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* User Orders */
app.post("/orders", requireAuth, async (req, res) => {
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

    io.of("/admin").emit("admin:newOrder", created);
    io.of("/admin").emit("admin:orderUpdated", created);

    res.status(201).json(created);
  } catch (err) {
    console.error("❌ POST /orders error:", err);
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
});

app.get("/orders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
  } catch (err) {
    console.error("GET /orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* Admin */
app.get("/admin/orders", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const orders = await Order.find().populate("userId", "name email phone").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("GET /admin/orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.patch("/admin/orders/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const normalized = normalizeStatus(req.body?.status);
    if (!normalized) return res.status(400).json({ error: `Status must be one of: ${CANONICAL_STATUSES.join(", ")}` });

    const updated = await Order.findByIdAndUpdate(req.params.id, { status: normalized }, { new: true }).populate("userId", "name email phone");
    if (!updated) return res.status(404).json({ error: "Order not found" });

    io.of("/admin").emit("admin:orderUpdated", updated);
    res.json(updated);
  } catch (err) {
    console.error("PATCH /admin/orders/:id/status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.delete("/admin/orders/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (err) {
    console.error("DELETE /admin/orders/:id error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

app.get("/", (_req, res) => res.send("🚀 API is running..."));

/* -------- TEMP DEBUG ROUTES (remove after fixing) -------- */
app.get("/whoami", requireAuth, (req, res) => res.json({ ok: true, userFromToken: req.user }));
app.get("/__debug/orders-count", async (_req, res) => {
  try {
    const total = await Order.countDocuments();
    const cxn = mongoose.connection;
    res.json({ db: cxn.name, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
/* -------------------------------------------------------- */

/* ----------------- Start ----------------- */
async function startServer() {
  const MONGO_URI = process.env.MONGO_URI || "";
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("✅ Connected to MongoDB");
      mongoose.connection.on("connected", () => {
        const cxn = mongoose.connection;
        console.log("✅ Mongo connected", { host: cxn.host, name: cxn.name });
        console.log("CORS allowed origins:", allowedOrigins);
      });
    } catch (err) {
      console.error("❌ MongoDB connection error:", err.message || err);
    }
  } else {
    console.warn("⚠️ No MONGO_URI provided — starting server without DB (dev only).");
  }

  httpServer.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server listening on port ${PORT}`));
}
startServer();

process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
