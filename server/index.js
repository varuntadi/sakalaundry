// server/index.js
// ES module style
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ----------------- CORS (robust, handles preflight) ----------------- */
/**
 * Make sure FRONTEND_URL is set in your Render/host environment to:
 *   https://sakalaundry.netlify.app
 *
 * If FRONTEND_URL is not set, we fall back to the common Netlify URL so
 * the site still works while you configure environment variables.
 */
const FALLBACK_FRONTEND = "https://sakalaundry.netlify.app";
const frontendUrl = process.env.FRONTEND_URL || FALLBACK_FRONTEND;

// Allowed origins includes local dev hosts and the configured frontend URL
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  frontendUrl,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow non-browser requests (curl, Postman) which send no origin
    if (!origin) return callback(null, true);

    // block file:// origins (user opening local file)
    if (typeof origin === "string" && origin.startsWith("file://")) {
      console.warn("Blocked file:// origin. Use a local server for dev.");
      return callback(null, false);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("CORS blocked origin:", origin);
    return callback(new Error("CORS not allowed"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true, // keep true if using cookies or credentials; otherwise false
};

// Register CORS BEFORE body parsers so preflight is handled early
app.use(cors(corsOptions));
// NOTE: removed app.options("*", cors(corsOptions)) because certain path-to-regexp versions
// throw when registering '*' as a route. The cors middleware above correctly handles preflight.
 
/* ----------------- Middlewares ----------------- */
// parse JSON bodies (place before routes)
app.use(express.json());

// catch invalid JSON in request body early and return 400
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  next();
});

// request logger (simple)
app.use((req, res, next) => {
  console.log("➡", req.method, req.url);
  next();
});

/* ----------------- DB + Server start (dev-tolerant) ----------------- */
const MONGO_URI = process.env.MONGO_URI || "";

async function startServer() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ Connected to MongoDB Atlas");
    } catch (err) {
      console.error("❌ MongoDB connection error (continuing in dev):", err.message || err);
    }
  } else {
    console.warn("⚠️ No MONGO_URI provided — starting server without DB (dev only).");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`➡ Allowed frontend origins: ${allowedOrigins.join(", ")}`);
  });
}

/* ----------------- Models ----------------- */
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
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

/* ----------------- Routes ----------------- */
// health
app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// test endpoint
app.post("/signup-test", (req, res) => res.json({ ok: true, msg: "POST /signup-test reached the server 👍" }));

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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
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

// orders
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

app.get("/orders", auth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

app.delete("/orders/:id", auth, async (req, res) => {
  const order = await Order.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ message: "Order canceled" });
});

// admin routes
app.get("/admin/orders", auth, adminOnly, async (req, res) => {
  const orders = await Order.find().populate("userId", "name email").sort({ createdAt: -1 });
  res.json(orders);
});

app.patch("/admin/orders/:id/status", auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  const allowed = ["Pending", "In Progress", "Completed"];
  if (!allowed.includes(status)) return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  await order.save();

  const updated = await Order.findById(order._id).populate("userId", "name email");
  res.json(updated);
});

/* ----------------- Root ----------------- */
app.get("/", (req, res) => res.send("🚀 API is running..."));

/* ----------------- Start ----------------- */
startServer();

/* ----------------- Global error handlers (optional helpful) ----------------- */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
