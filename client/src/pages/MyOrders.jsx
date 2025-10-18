import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/orders.css";
import { FaWhatsapp } from "react-icons/fa";

/* ------------------------------------------------------------------
   CONFIG
------------------------------------------------------------------ */
const SUPPORT_WHATSAPP = "+91 6300914718"; // support chat shortcut

/* ------------------------------------------------------------------
   UTILS
------------------------------------------------------------------ */
const onlyDigits = (s = "") => String(s || "").replace(/\D/g, "");
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

function buildWAUrl({ phone, text }) {
  const p = onlyDigits(phone);
  const q = encodeURIComponent(text || "");
  return isMobile
    ? `whatsapp://send?phone=${p}&text=${q}`
    : `https://api.whatsapp.com/send?phone=${p}&text=${q}`;
}

function StatusBadge({ status }) {
  let cls = "badge pending";
  if (["In Progress", "in_progress"].includes(status)) cls = "badge progress";
  else if (["picked_up"].includes(status)) cls = "badge picked";
  else if (["Delivering", "delivering"].includes(status)) cls = "badge delivering";
  else if (["Completed", "completed"].includes(status)) cls = "badge done";
  return <span className={cls}>{status || "Pending"}</span>;
}

/* ------------------------------------------------------------------
   PAGE: My Orders (no online payments)
------------------------------------------------------------------ */
export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // auto-refresh while tab is visible
    const id = setInterval(() => !document.hidden && load(), 12000);
    return () => clearInterval(id);
  }, []);

  const cancelOrder = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await api.delete(`/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o._id !== id));
      setMsg("Order cancelled");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to cancel order");
      setTimeout(() => setErr(""), 4000);
    }
  };

  const computeTotals = (o) => {
    const subtotal = Array.isArray(o.items)
      ? o.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
      : Number(o.subtotal || 0);
    const discount = Number(o.discount || 0);
    const tax = Number(o.tax || 0);
    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal, discount, tax, total };
  };

  return (
    <div className="container orders-page">
      <div className="card header-card compact">
        <h2 className="page-title">My Orders</h2>
        <div className="helper header-helper">Track your pickups, totals and delivery status.</div>
      </div>

      {msg && <div className="alert success">{msg}</div>}
      {err && <div className="alert warning">{err}</div>}

      {loading && <div className="card order">Loading…</div>}
      {!loading && orders.length === 0 && <div className="card order">No orders yet.</div>}

      <div className="grid">
        {orders.map((o) => {
          const { subtotal, discount, tax, total } = computeTotals(o);
          const orderIdShort = o.orderNumber ?? (o._id ? String(o._id).slice(-6) : "N/A");
          return (
            <div key={o._id || o.orderNumber} className="card order">
              <div className="order-top">
                <div className="left">
                  <h4 className="order-title">
                    #{orderIdShort} — {o.service || "Laundry"}
                  </h4>
                  <div className="meta">{o.pickupAddress}</div>
                  <div className="helper small">
                    <strong>Pickup:</strong> {o.pickupDate || "-"} {o.pickupTime || ""}
                  </div>
                </div>
                <div className="right">
                  <StatusBadge status={o.status} />
                  <div className="helper small mt8">Delivery: <strong>{o.delivery || "-"}</strong></div>
                  <div className="helper small">
                    Phone: <a href={`tel:${onlyDigits(o.phone)}`}>{o.phone || "-"}</a>
                  </div>
                  <div className="helper small">
                    Ordered: {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}
                  </div>
                  {/* Payment info now static hint */}
                  <div className="helper tiny mt8">
                    <span className="badge neutral">Pay at counter</span>
                  </div>
                </div>
              </div>

              {Array.isArray(o.items) && o.items.length > 0 && (
                <div className="items">
                  <div className="item-head">
                    <div>Item</div><div>Qty</div><div>Rate</div><div>Amount</div>
                  </div>
                  {o.items.map((it, i) => (
                    <div key={i} className="item-row">
                      <div>{it.service}</div>
                      <div>x{it.qty}</div>
                      <div>₹ {Number(it.rate).toFixed(2)}</div>
                      <div>₹ {(Number(it.qty) * Number(it.rate)).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="t-totals slim" style={{ marginTop: 8 }}>
                <div><span>Sub Total</span><span>₹ {subtotal.toFixed(2)}</span></div>
                <div><span>Discount</span><span>₹ {discount.toFixed(2)}</span></div>
                <div><span>Tax</span><span>₹ {tax.toFixed(2)}</span></div>
                <div className="grand"><span>Total</span><span>₹ {total.toFixed(2)}</span></div>
              </div>

              <div className="stack">
                <button className="btn ghost" onClick={() => cancelOrder(o._id)} aria-label="Cancel order">
                  Cancel
                </button>

                <a
                  className="btn wa"
                  href={buildWAUrl({
                    phone: SUPPORT_WHATSAPP,
                    text:
                      `Hi! Query about my order.\nOrder #: ${o.orderNumber ?? o._id}\nService: ${o.service}\n` +
                      (o.pickupAddress ? `Pickup: ${o.pickupAddress}\n` : "") +
                      (o.pickupDate ? `Pickup date: ${o.pickupDate} ${o.pickupTime || ""}\n` : "") +
                      (o.phone ? `Phone: ${o.phone}\n` : "") +
                      (o.status ? `Status: ${o.status}\n` : "")
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaWhatsapp size={16} color="#fff" style={{ marginRight: 8 }} />
                  WhatsApp
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
