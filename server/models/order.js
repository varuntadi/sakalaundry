import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, index: true, unique: true, sparse: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

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

    // pickup & contact
    pickupAddress: String,
    lat: Number,
    lng: Number,
    phone: String,
    notes: String,
    pickupDate: String,
    pickupTime: String,

    // delivery speed
    delivery: { type: String, enum: ["regular", "express"], default: "regular" },

    /* ---------- Delivery fields ---------- */
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // delivery partner id
    itemCount: Number,
    pickupPhotos: [{ type: String }],
    pickedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pickedAt: Date,
    deliveredAt: Date,
    cost: Number,        // set by admin
    partnerName: String, // who picked up
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
