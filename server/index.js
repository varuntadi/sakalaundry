// server/index.js
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import forgotRouter from "./router/forgot.js";
import ticketsRouter from "./router/tickets.js";

import requireAuth from "./middleware/auth.js";
import requireAdmin from "./middleware/requireAdmin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------------------- Core middleware ---------------------------- */
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

/* ----------------- CORS (Netlify + custom domain + localhost) ------------ */
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sakalaundry.netlify.app";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "";

const variants = (u) => {
  if (!u) return [];
  try {
    const url = new URL(u);
    const proto = url.protocol;
    const host = url.host;
    const noWww = host.replace(/^www\./, "");
    const withWww = host.startsWith("www.") ? host : `www.${host}`;
    return [`${proto}//${noWww}`, `${proto}//${withWww}`];
  } catch {
    return [u];
  }
};
const NETLIFY_PREVIEWS = /^https:\/\/[a-z0-9-]+--sakalaundry\.netlify\.app$/i;

const allowlist = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  ...variants(FRONTEND_URL),
  ...variants(PUBLIC_SITE_URL),
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowlist.has(origin)) return true;
  if (NETLIFY_PREVIEWS.test(origin)) return true;
  return false;
};

app.use((req, res, next) => { res.setHeader("Vary", "Origin"); next(); });
app.use(
  cors({
    origin: (origin, cb) =>
      isAllowedOrigin(origin) ? cb(null, true) : cb(new Error(`CORS not allowed: ${origin}`), false),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: false,
  })
);
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    return res.sendStatus(204);
  }
  return res.sendStatus(403);
});

console.log("CORS allowlist:", Array.from(allowlist));
console.log("CORS previews regex:", NETLIFY_PREVIEWS);

/* -------------------------------- Logger -------------------------------- */
app.use((req, _res, next) => { console.log("➡", req.method, req.url); next(); });

/* ------------------------ HTTP + Socket.IO setup ------------------------- */
const httpServer = http.createServer(app);
const socketAllow = Array.from(allowlist);
const io = new SocketIOServer(httpServer, {
  cors: { origin: socketAllow, credentials: false },
  pingInterval: 25000,
  pingTimeout: 60000,
});
app.set("io", io);

/* -------------------------------- Models --------------------------------- */
const { Schema, model, models } = mongoose;

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

const itemSchema = new Schema(
  {
    service: { type: String, required: true },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: Number, index: true, unique: true, sparse: true },

    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    service: {
      type: String,
      enum: ["Wash and Fold", "Wash and Iron", "Iron", "Dry Clean", "Others"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Delivering", "Completed"],
      default: "Pending",
    },

    clothTypes: { type: [String], default: [] },
    pickupAddress: { type: String, default: "" },
    lat: Number,
    lng: Number,
    phone: { type: String, default: "" },
    notes: { type: String, default: "" },

    pickupDate: { type: String, default: "" },
    pickupTime: { type: String, default: "" },

    delivery: { type: String, enum: ["regular", "express"], default: "regular" },
    deliveryDate: { type: String, default: "" },
    deliveryTime: { type: String, default: "" },

    // pricing/invoice
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }, // flat ₹
    tax: { type: Number, default: 0 },      // flat ₹
    total: { type: Number, default: 0 },
    invoiceNumber: { type: Number, index: true },

    pickedUpAt: { type: Date },
    pickedUpBy: { type: Schema.Types.ObjectId, ref: "User" },

    // payment
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    paymentRef: { type: String, default: "" },
    invoiceUrl: { type: String, default: "" }, // link to generated PDF (if any)
  },
  { timestamps: true }
);

orderSchema.methods.recalc = function () {
  const items = Array.isArray(this.items) ? this.items : [];
  const subtotal = items.reduce(
    (s, it) => s + (Number(it.amount ?? (Number(it.qty || 0) * Number(it.rate || 0))) || 0),
    0
  );
  const discount = Math.max(0, Number(this.discount || 0));
  const tax = Math.max(0, Number(this.tax || 0));
  this.subtotal = subtotal;
  this.total = Math.max(0, subtotal - discount + tax);
  return this.total;
};

const Order = models.Order || model("Order", orderSchema);

/* -------------------------------- Helpers -------------------------------- */
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_env";
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

function computeTotals({ items = [], discount = 0, tax = 0 }) {
  const norm = (items || []).map((it) => {
    const qty = Math.max(0, Number(it.qty || 0));
    const rate = Math.max(0, Number(it.rate || 0));
    return { service: String(it.service || "Item"), qty, rate, amount: qty * rate };
  });
  const subtotal = norm.reduce((s, it) => s + it.amount, 0);
  const d = Math.max(0, Number(discount || 0));
  const t = Math.max(0, Number(tax || 0));
  const total = Math.max(0, subtotal - d + t);
  return { items: norm, subtotal, discount: d, tax: t, total };
}

/* -------------------------------- Routers -------------------------------- */
app.use("/auth", forgotRouter);
app.use("/api/tickets", ticketsRouter);

/* ------------------------------- Basic API ------------------------------- */
app.get("/api", (_req, res) => res.json({ ok: true, service: "saka-laundry-api" }));
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

/* --------------------------------- Auth ---------------------------------- */
app.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ error: "Name, phone and password are required." });

    const normalizedPhone = onlyDigits(phone);
    if (await User.findOne({ phone: normalizedPhone }))
      return res.status(400).json({ error: "Phone already in use." });
    if (email && (await User.findOne({ email: email.toLowerCase() })))
      return res.status(400).json({ error: "Email already in use." });

    const user = new User({
      name,
      phone: normalizedPhone,
      email: email ? email.toLowerCase() : undefined,
    });
    await user.setPassword(password);
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered",
      token,
      user: { id: user._id, name, phone: user.phone, email: user.email, role: user.role },
    });
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

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("❌ /login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------------ User routes ------------------------------ */
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

    io.emit("admin:newOrder", created);
    io.emit("admin:orderUpdated", created);

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

/* ------------------------------- Admin APIs ------------------------------ */
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

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status: normalized },
      { new: true }
    ).populate("userId", "name email phone");

    if (!updated) return res.status(404).json({ error: "Order not found" });

    io.emit("admin:orderUpdated", updated);
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

// ----- NEW: pickup + initial pricing -----
app.post("/admin/orders/:id/pickup", requireAuth, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const { items, discount, tax } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    const totals = computeTotals({ items, discount, tax });

    if (!order.invoiceNumber) {
      order.invoiceNumber = await getNextSequence("invoiceNumber");
    }
    if (!order.pickedUpAt) order.pickedUpAt = new Date();
    if (!order.pickedUpBy && req.user?.id) order.pickedUpBy = req.user.id;

    order.items = totals.items;
    order.subtotal = totals.subtotal;
    order.discount = totals.discount;
    order.tax = totals.tax;
    order.total = totals.total;

    if (order.status === "Pending") order.status = "In Progress";

    order.recalc();
    const saved = await order.save();
    const populated = await saved.populate("userId", "name email phone");
    io.emit("admin:orderUpdated", populated);
    res.json(populated);
  } catch (err) {
    console.error("POST /admin/orders/:id/pickup error:", err);
    res.status(500).json({ error: "Failed to save pricing" });
  }
});

// ----- NEW: edit pricing later -----
app.patch("/admin/orders/:id/pricing", requireAuth, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const { items, discount, tax } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    const totals = computeTotals({ items, discount, tax });

    order.items = totals.items;
    order.subtotal = totals.subtotal;
    order.discount = totals.discount;
    order.tax = totals.tax;
    order.total = totals.total;

    order.recalc();
    const saved = await order.save();
    const populated = await saved.populate("userId", "name email phone");
    io.emit("admin:orderUpdated", populated);
    res.json(populated);
  } catch (err) {
    console.error("PATCH /admin/orders/:id/pricing error:", err);
    res.status(500).json({ error: "Failed to save pricing" });
  }
});

/* ----------------------------- PAYMENTS (UPDATED) ---------------------------- */
/**
 * Frontend polls this endpoint after launching the UPI intent.
 * For localhost/demo you can pass ?forcePaid=1 or ?upiTxnId=XXXX to flip to paid.
 * In production, mark paid in your UPI/PG webhook and this will just return the status.
 */
app.get("/payments/upi/status", async (req, res) => {
  try {
    const { orderId, invoiceNo, upiTxnId, forcePaid } = req.query;
    if (!orderId || !invoiceNo) {
      return res.status(400).json({ error: "Missing orderId or invoiceNo" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.paymentStatus === "paid") {
      return res.json({
        paid: true,
        ref: order.paymentRef || null,
        invoiceUrl: order.invoiceUrl || null,
        amount: order.total || 0,
        method: "UPI",
      });
    }

    const forced = String(forcePaid || "") === "1";
    const hasTxn = typeof upiTxnId === "string" && upiTxnId.trim().length > 5;

    if (forced || hasTxn) {
      order.paymentStatus = "paid";
      order.paymentRef = hasTxn ? String(upiTxnId) : `UPI-${Date.now()}`;
      if (!order.invoiceUrl) order.invoiceUrl = `/invoices/${invoiceNo}.pdf`;
      await order.save();

      const populated = await Order.findById(order._id).populate("userId", "name email phone");
      io.emit("admin:orderUpdated", populated);

      return res.json({
        paid: true,
        ref: order.paymentRef,
        invoiceUrl: order.invoiceUrl,
        amount: order.total || 0,
        method: "UPI",
      });
    }

    return res.json({ paid: false });
  } catch (err) {
    console.error("GET /payments/upi/status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------------------- PAYMENTS: DESKTOP CONFIRM (DEV) ----------------------------- */
/**
 * POST /payments/upi/confirm
 * Body: { orderId, invoiceNo, upiTxnId? }
 * Desktop helper: when the user clicks "I've completed the payment" on the QR dialog,
 * we mark the order as paid (DEV ONLY). In production, rely on your PG/webhook.
 */
app.post("/payments/upi/confirm", requireAuth, async (req, res) => {
  try {
    const { orderId, invoiceNo, upiTxnId } = req.body || {};
    if (!orderId || !invoiceNo) {
      return res.status(400).json({ error: "Missing orderId or invoiceNo" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.paymentStatus === "paid") {
      return res.json({
        paid: true,
        ref: order.paymentRef || null,
        invoiceUrl: order.invoiceUrl || null,
        amount: order.total || 0,
        method: "UPI",
      });
    }

    order.paymentStatus = "paid";
    order.paymentRef = upiTxnId ? String(upiTxnId) : `UPI-${Date.now()}`;
    if (!order.invoiceUrl) order.invoiceUrl = `/invoices/${invoiceNo}.pdf`;
    await order.save();

    const populated = await Order.findById(order._id).populate("userId", "name email phone");
    io.emit("admin:orderUpdated", populated);

    return res.json({
      paid: true,
      ref: order.paymentRef,
      invoiceUrl: order.invoiceUrl,
      amount: order.total || 0,
      method: "UPI",
    });
  } catch (err) {
    console.error("POST /payments/upi/confirm error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (_req, res) => res.send("🚀 API is running..."));

/* --------------------------------- Start --------------------------------- */
async function startServer() {
  const MONGO_URI = process.env.MONGO_URI || "";
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("✅ Connected to MongoDB");
      mongoose.connection.on("connected", () => {
        const cxn = mongoose.connection;
        console.log("✅ Mongo connected", { host: cxn.host, name: cxn.name });
        console.log("CORS allowlist:", Array.from(allowlist));
      });
    } catch (err) {
      console.error("❌ MongoDB connection error:", err?.message || err);
    }
  } else {
    console.warn("⚠️ No MONGO_URI provided — starting server without DB (dev only).");
  }

  httpServer.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server listening on port ${PORT}`));
}
startServer();

process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
