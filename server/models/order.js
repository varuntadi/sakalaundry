// server/models/order.js
const mongoose = require("mongoose");

/** Line-items captured at pickup */
const ItemSchema = new mongoose.Schema(
  {
    service: { type: String, required: true },          // e.g., "Wash and Fold / shirts"
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },     // per piece/kg/etc (₹)
    amount: { type: Number, required: true, min: 0 },   // qty * rate (denormalized)
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, index: true, unique: true, sparse: true },

    // who placed the order
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // booking details
    service: {
      type: String,
      enum: ["Wash and Fold", "Wash and Iron", "Iron", "Dry Clean", "Others"],
      required: true,
    },
    clothTypes: { type: [String], default: [] },
    pickupAddress: { type: String, default: "" },
    lat: Number,
    lng: Number,
    phone: { type: String, default: "" },
    notes: { type: String, default: "" },

    // pickup (requested)
    pickupDate: { type: String, default: "" },
    pickupTime: { type: String, default: "" },

    // delivery (planned/actual)
    deliveryDate: { type: String, default: "" },
    deliveryTime: { type: String, default: "" },

    delivery: { type: String, enum: ["regular", "express"], default: "regular" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Delivering", "Completed"],
      default: "Pending",
    },

    /* ---------- Pricing / Invoice (new) ---------- */
    items: { type: [ItemSchema], default: [] },   // captured after pickup
    subtotal: { type: Number, default: 0 },       // sum of item.amount
    discount: { type: Number, default: 0 },       // flat amount in ₹
    tax: { type: Number, default: 0 },            // flat amount in ₹
    total: { type: Number, default: 0 },          // subtotal - discount + tax

    invoiceNumber: { type: Number, index: true }, // optional sequential invoice no.

    // pickup confirmation metadata
    pickedUpAt: { type: Date },
    pickedUpBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // staff/admin id

    // payment metadata (optional, for later)
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    paymentRef: { type: String, default: "" },    // UPI/PG transaction id
  },
  { timestamps: true }
);

/** Optional helper to recompute totals on the doc (you can call before save) */
OrderSchema.methods.recalculateTotals = function () {
  const items = Array.isArray(this.items) ? this.items : [];
  const subtotal = items.reduce((s, it) => s + Number(it.amount || (Number(it.qty || 0) * Number(it.rate || 0))), 0);
  const discount = Math.max(0, Number(this.discount || 0));
  const tax = Math.max(0, Number(this.tax || 0));
  this.subtotal = subtotal;
  this.total = Math.max(0, subtotal - discount + tax);
  return this.total;
};

module.exports = mongoose.models.Order || mongoose.model("Order", OrderSchema);
