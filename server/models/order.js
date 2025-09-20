// server/models/order.js
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: Number, index: true, unique: true }, // auto-incremented friendly ID
  service: { type: String, required: true },
  clothTypes: { type: [String], default: [] },
  pickupAddress: { type: String, default: "" },
  lat: Number,
  lng: Number,
  phone: { type: String, default: "" },
  notes: { type: String, default: "" },
  pickupDate: { type: String, default: "" },
  pickupTime: { type: String, default: "" },
  delivery: { type: String, enum: ["regular", "express"], default: "regular" },
  status: { type: String, enum: ["Pending", "In Progress", "Delivering", "Completed"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);
