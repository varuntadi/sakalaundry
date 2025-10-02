// server/router/orders.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Counter = require("../models/counter");
const Order = require("../models/order");
const requireAuth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

// Sequence helper
async function getNextSequence(name) {
  const doc = await Counter.findByIdAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
}

/* ----------------- USER ROUTES ----------------- */
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      service,
      pickupAddress,
      phone,
      notes,
      clothTypes,
      pickupDate,
      pickupTime,
      delivery,
      lat,
      lng,
    } = req.body;

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

    res.status(201).json(created);
  } catch (err) {
    console.error("❌ POST /orders error:", err);
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ GET /orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order canceled" });
  } catch (err) {
    console.error("❌ DELETE /orders/:id error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

/* ----------------- ADMIN ROUTES ----------------- */
router.get("/admin/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ GET /admin/all error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/admin/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowed = ["Pending", "In Progress", "Delivering", "Completed"];
    const { status } = req.body;
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("userId", "name email phone");

    if (!updated) return res.status(404).json({ error: "Order not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ PATCH /admin/:id/status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.delete("/admin/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (err) {
    console.error("❌ DELETE /admin/:id error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

module.exports = router;
