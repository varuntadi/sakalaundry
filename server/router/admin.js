// server/router/admin.js
import express from "express";
import requireAuth from "../middleware/auth.js";
import requireAdmin from "../middleware/requireAdmin.js";

// models
import Order from "../models/order.js";
import User from "../models/user.js";

const router = express.Router();

/* ----------------- helpers ----------------- */
function adminNsFromReq(req) {
  try {
    const io = req.app.get("io");
    return io ? io.of("/admin") : null;
  } catch {
    return null;
  }
}

// sanitize & compute money
const toNum = (v) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
function sanitizeItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => ({
    service: String(it?.service || "Item"),
    qty: toNum(it?.qty || 0),
    rate: toNum(it?.rate || 0),
  }));
}
function computeTotals(items = [], discount = 0, tax = 0) {
  const subtotal = items.reduce((s, it) => s + toNum(it.qty) * toNum(it.rate), 0);
  const total = Math.max(0, subtotal - toNum(discount) + toNum(tax));
  return { subtotal, total };
}

/* ----------------- ORDERS: list ----------------- */
/**
 * GET /admin/orders
 * Returns full order list for admin dashboard
 */
router.get("/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    console.error("GET /admin/orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* ----------------- ORDERS: status ----------------- */
/**
 * PATCH /admin/orders/:id/status
 * Update order status (normalizes allowed statuses)
 */
const CANONICAL_STATUSES = ["Pending", "In Progress", "Delivering", "Completed"];
function normalizeStatus(input) {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  if (s === "delivered" || s === "complete" || s === "completed") return "Completed";
  if (s.includes("deliver")) return "Delivering";
  if (s === "in progress" || s === "progress") return "In Progress";
  if (s === "pending") return "Pending";
  const title = s
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return CANONICAL_STATUSES.includes(title) ? title : null;
}

router.patch("/orders/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = normalizeStatus(req.body?.status);
    if (!status) {
      return res.status(400).json({ error: `Status must be one of: ${CANONICAL_STATUSES.join(", ")}` });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("userId", "name email phone")
      .lean();

    if (!updated) return res.status(404).json({ error: "Order not found" });

    adminNsFromReq(req)?.emit("admin:orderUpdated", updated);
    res.json(updated);
  } catch (err) {
    console.error("PATCH /admin/orders/:id/status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/* ----------------- ORDERS: pickup (NEW) ----------------- */
/**
 * POST /admin/orders/:id/pickup
 * Mark order picked up AND save counted items & pricing in one shot.
 * Body: { items:[{service,qty,rate}], discount, tax }
 * Status becomes "In Progress" to match your canonical statuses.
 */
router.post("/orders/:id/pickup", requireAuth, requireAdmin, async (req, res) => {
  try {
    const items = sanitizeItems(req.body?.items || []);
    const discount = toNum(req.body?.discount || 0);
    const tax = toNum(req.body?.tax || 0);
    const { subtotal, total } = computeTotals(items, discount, tax);

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "In Progress",
          pickupAt: new Date(),
          items,
          discount,
          tax,
          subtotal,
          total,
        },
      },
      { new: true }
    )
      .populate("userId", "name email phone")
      .lean();

    if (!updated) return res.status(404).json({ error: "Order not found" });

    adminNsFromReq(req)?.emit("admin:orderUpdated", updated);
    res.json(updated);
  } catch (err) {
    console.error("POST /admin/orders/:id/pickup error:", err);
    res.status(500).json({ error: "Failed to mark pickup" });
  }
});

/* ----------------- ORDERS: pricing (NEW) ----------------- */
/**
 * PATCH /admin/orders/:id/pricing
 * Update items/discount/tax later (e.g., edits).
 * Body: { items:[{service,qty,rate}], discount, tax }
 */
router.patch("/orders/:id/pricing", requireAuth, requireAdmin, async (req, res) => {
  try {
    const items = sanitizeItems(req.body?.items || []);
    const discount = toNum(req.body?.discount || 0);
    const tax = toNum(req.body?.tax || 0);
    const { subtotal, total } = computeTotals(items, discount, tax);

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          items,
          discount,
          tax,
          subtotal,
          total,
        },
      },
      { new: true }
    )
      .populate("userId", "name email phone")
      .lean();

    if (!updated) return res.status(404).json({ error: "Order not found" });

    adminNsFromReq(req)?.emit("admin:orderUpdated", updated);
    res.json(updated);
  } catch (err) {
    console.error("PATCH /admin/orders/:id/pricing error:", err);
    res.status(500).json({ error: "Failed to save pricing" });
  }
});

/* ----------------- ORDERS: delete ----------------- */
/**
 * DELETE /admin/orders/:id
 * Delete an order (admin)
 */
router.delete("/orders/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: "Order not found" });

    adminNsFromReq(req)?.emit("admin:orderDeleted", { _id: deleted._id });
    res.json({ message: "Order deleted" });
  } catch (err) {
    console.error("DELETE /admin/orders/:id error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

/* ----------------- USERS ----------------- */
/**
 * GET /admin/users
 * List users (no password field)
 */
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash -__v").sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    console.error("GET /admin/users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * PATCH /admin/users/:id/role
 * Update user's role (promote/demote)
 */
router.patch("/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || (role !== "admin" && role !== "user")) {
      return res.status(400).json({ error: 'Role must be "admin" or "user"' });
    }

    const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select("-passwordHash -__v")
      .lean();

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (err) {
    console.error("PATCH /admin/users/:id/role error:", err);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

/* ----------------- STATS ----------------- */
router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const pending = await Order.countDocuments({ status: "Pending" });
    const inProgress = await Order.countDocuments({ status: "In Progress" });
    const delivering = await Order.countDocuments({ status: "Delivering" });
    const completed = await Order.countDocuments({ status: "Completed" });
    res.json({ total, pending, inProgress, delivering, completed });
  } catch (err) {
    console.error("GET /admin/stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
