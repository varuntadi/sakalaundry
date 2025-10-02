// server/models/ticket.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    mobile: { type: String, required: true },
    orderId: { type: String },
    issue: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["Pending", "Contacted", "Resolved"], 
      default: "Pending" 
    },
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
