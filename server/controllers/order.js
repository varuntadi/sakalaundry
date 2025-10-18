// server/controllers/order.js
import Order from "../models/order.js";

// mark picked up + save items & pricing in one shot
export const markPickedUp = async (req, res) => {
  try {
    const { id } = req.params;
    let { items = [], discount = 0, tax = 0 } = req.body;

    // sanitize
    items = Array.isArray(items)
      ? items.map(it => ({
          service: String(it.service || "Item"),
          qty: Number(it.qty || 0),
          rate: Number(it.rate || 0),
        }))
      : [];

    const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
    const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));

    const updated = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "picked_up",
          pickupAt: new Date(),
          items,
          discount: Number(discount || 0),
          tax: Number(tax || 0),
          subtotal,
          total,
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Order not found" });
    res.json(updated);
  } catch (e) {
    console.error("markPickedUp error:", e);
    res.status(500).json({ error: e.message });
  }
};
