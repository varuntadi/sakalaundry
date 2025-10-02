// server/router/tickets.js
import express from "express";
import mongoose from "mongoose";
import requireAuth from "../middleware/auth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

/* ----------------- Ticket Schema ----------------- */
const ticketSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    mobile: { type: String, required: true },
    orderId: { type: String, default: "" },
    issue: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Contacted", "Resolved"], // ✅ aligned with frontend
      default: "Pending",
    },
    replies: [
      {
        sender: { type: String, enum: ["user", "admin"], required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);

/* ----------------- Routes ----------------- */

// Create ticket (public, from chat widget)
router.post("/", async (req, res) => {
  try {
    const { userName, mobile, orderId, issue } = req.body;
    if (!userName || !mobile || !issue) {
      return res
        .status(400)
        .json({ error: "Name, mobile, and issue are required." });
    }

    const ticket = await Ticket.create({ userName, mobile, orderId, issue });

    // Notify admins via socket
    const io = req.app.get("io");
    if (io) {
      io.of("/admin").emit("admin:newTicket", ticket);
    }

    res.status(201).json(ticket);
  } catch (err) {
    console.error("POST /api/tickets error:", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

// Get all tickets (admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error("GET /api/tickets error:", err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// Reply to a ticket (admin only)
router.post("/:id/reply", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required." });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.replies.push({ sender: "admin", message });
    ticket.status = "Contacted"; // ✅ update to Contacted
    await ticket.save();

    // Notify admins via socket
    const io = req.app.get("io");
    if (io) {
      io.of("/admin").emit("admin:ticketUpdated", ticket);
    }

    res.json(ticket);
  } catch (err) {
    console.error("POST /api/tickets/:id/reply error:", err);
    res.status(500).json({ error: "Failed to reply to ticket" });
  }
});

// Close a ticket (mark as Resolved)
router.post("/:id/close", requireAuth, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: "Resolved" }, // ✅ resolved instead of closed
      { new: true }
    );
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const io = req.app.get("io");
    if (io) {
      io.of("/admin").emit("admin:ticketUpdated", ticket);
    }

    res.json(ticket);
  } catch (err) {
    console.error("POST /api/tickets/:id/close error:", err);
    res.status(500).json({ error: "Failed to close ticket" });
  }
});

// Update Ticket Status (admin only)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Contacted", "Resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Notify admins via socket
    const io = req.app.get("io");
    if (io) {
      io.of("/admin").emit("admin:ticketUpdated", ticket);
    }

    res.json(ticket);
  } catch (err) {
    console.error("PUT /api/tickets/:id error:", err);
    res.status(500).json({ error: "Failed to update ticket status" });
  }
});

export default router;
