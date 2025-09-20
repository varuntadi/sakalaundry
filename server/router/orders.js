// server/router/orders.js
const express = require('express');
const router = express.Router();
const Counter = require('../models/counter');   // ensure server/models/counter.js exists
const Order = require('../models/order');

/**
 * Helper: atomically increment and return a sequence value
 * Creates the counter document if it doesn't exist.
 */
async function getNextSequence(name) {
  const doc = await Counter.findByIdAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

/* POST /orders
   Creates an order and assigns a friendly orderNumber (auto-increment).
*/
router.post('/', async (req, res) => {
  try {
    // get next order number
    const orderNumber = await getNextSequence('orderNumber');

    // build payload. preserve any fields client sent (userId, service, etc.)
    const payload = {
      ...req.body,
      orderNumber,
      status: req.body.status || "Pending",
    };

    const order = new Order(payload);
    await order.save();
    return res.status(201).json(order);
  } catch (err) {
    console.error("POST /orders error:", err);
    return res.status(400).json({ error: err.message || "Failed to create order" });
  }
});

/* GET /orders
   List all orders (most-recent first). keeps populate('userId') like your old code.
*/
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('userId').sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error("GET /orders error:", err);
    return res.status(500).json({ error: err.message || "Could not fetch orders" });
  }
});

/* GET /orders/:id
   Fetch single order by id
*/
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId');
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    console.error("GET /orders/:id error:", err);
    return res.status(500).json({ error: err.message || "Could not fetch order" });
  }
});

/* PUT /orders/:id/status
   Admin updates order status. Allowed: Pending, In Progress, Delivering, Completed
*/
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Pending", "In Progress", "Delivering", "Completed"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid or missing status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Optionally: here you can emit a websocket event to notify clients in real-time.

    return res.json(order);
  } catch (err) {
    console.error("PUT /orders/:id/status error:", err);
    return res.status(500).json({ error: err.message || "Could not update status" });
  }
});

/* DELETE /orders/:id
   Cancel/delete an order
*/
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Order.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Order not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /orders/:id error:", err);
    return res.status(500).json({ error: err.message || "Failed to delete order" });
  }
});

module.exports = router;
