// client/src/pages/MyOrders.jsx
import React, { useEffect, useState, useRef } from "react";
import { FaWhatsapp } from "react-icons/fa";
import api from "../api";
import "../styles/orders.css";

const SUPPORT_WHATSAPP = "+91 91219 91113";
const onlyDigits = (s = "") => String(s || "").replace(/\D/g, "");

function buildWAUrl({ phone, text }) {
  const p = onlyDigits(phone);
  const q = encodeURIComponent(text || "");
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  if (isMobile) return `whatsapp://send?phone=${p}&text=${q}`;
  return `https://api.whatsapp.com/send?phone=${p}&text=${q}`;
}

function escapeCsv(v = "") {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function downloadCsvClient(filename, columns, rows) {
  const header = columns.map(c => escapeCsv(c.label)).join(",");
  const lines = rows.map(r => columns.map(c => escapeCsv(c.value(r))).join(","));
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }) {
  let cls = "badge pending";
  if (status === "In Progress") cls = "badge progress";
  else if (status === "Delivering") cls = "badge delivering";
  else if (status === "Completed") cls = "badge done";
  return <span className={cls}>{status}</span>;
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const pollRef = useRef(null);

  async function load() {
    setLoading(true); setErr("");
    try {
      const res = await api.get("/orders");
      const data = Array.isArray(res.data) ? res.data : [];
      setOrders(data);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => {
      if (!document.hidden) load();
    }, 12000);
    return () => clearInterval(pollRef.current);
  }, []);

  const cancelOrder = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await api.delete(`/orders/${id}`);
      setOrders(prev => prev.filter(o => o._id !== id));
      setMsg("Order cancelled");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to cancel order");
      setTimeout(() => setErr(""), 4000);
    }
  };

  const exportCsv = () => {
    const cols = [
      { label: "Order Number", value: r => r.orderNumber ?? "" },
      { label: "Order ID", value: r => r._id ?? "" },
      { label: "Created Date", value: r => r.createdAt ? new Date(r.createdAt).toLocaleString() : "" },
      { label: "Service", value: r => r.service ?? "" },
      { label: "Pickup Address", value: r => r.pickupAddress ?? "" },
      { label: "Pickup Date", value: r => r.pickupDate ?? "" },
      { label: "Phone", value: r => r.phone ?? "" },
      { label: "Delivery", value: r => r.delivery ?? "" },
      { label: "Status", value: r => r.status ?? "" },
    ];
    const filename = `my_orders_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.csv`;
    downloadCsvClient(filename, cols, orders);
  };

  return (
    <div className="container orders-page" style={{ maxWidth: 980, margin: "18px auto", padding: 12 }}>
      <div className="card header-card compact" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>My Orders</h2>
        <div className="helper header-helper">All your orders are listed here. Tap to contact or cancel.</div>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={load}>Refresh</button>
          <button className="btn ghost" onClick={exportCsv}>Download CSV</button>
        </div>
      </div>

      {msg && <div className="alert success" style={{ marginBottom: 10 }}>{msg}</div>}
      {err && <div className="alert warning" style={{ marginBottom: 10 }}>{err}</div>}

      {loading && <div className="card order">Loading…</div>}
      {!loading && orders.length === 0 && <div className="card order">No orders yet.</div>}

      <div className="grid" style={{ marginTop: 8 }}>
        {orders.map((o) => (
          <div key={o._id ?? o.orderNumber ?? Math.random()} className="card order">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom:6, fontSize: 16 }}>
                  #{o.orderNumber ?? (o._id ? String(o._id).slice(-6) : "N/A")} — {o.service}
                </h4>
                <div className="meta" style={{ marginBottom: 8 }}>{o.pickupAddress}</div>
                <div className="helper small">
                  <strong>Pickup:</strong> {o.pickupDate || "-"}{o.pickupTime ? ` at ${o.pickupTime}` : ""}
                </div>
              </div>

              <div style={{ minWidth: 110, textAlign: "right" }}>
                <StatusBadge status={o.status} />
                <div className="helper small" style={{ marginTop: 8 }}>Delivery: <strong>{o.delivery}</strong></div>
                <div className="helper small">Phone: <a href={`tel:${onlyDigits(o.phone)}`}>{o.phone || "-"}</a></div>
                <div className="helper small">Ordered: {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}</div>
              </div>
            </div>

            <div className="stack" style={{ marginTop:12 }}>
              <button className="btn ghost" onClick={() => cancelOrder(o._id)} aria-label="Cancel order">Cancel</button>

              <a
                className="btn wa"
                href={buildWAUrl({
                  phone: SUPPORT_WHATSAPP,
                  text:
                    `Hi! Query about my order.\nOrder #: ${o.orderNumber ?? o._id}\nService: ${o.service}\n` +
                    (o.pickupAddress ? `Pickup: ${o.pickupAddress}\n` : "") +
                    (o.pickupDate ? `Pickup date: ${o.pickupDate} ${o.pickupTime || ''}\n` : '') +
                    (o.phone ? `Phone: ${o.phone}\n` : "") +
                    (o.notes ? `Notes: ${o.notes}\n` : "") +
                    (o.status ? `Status: ${o.status}\n` : "")
                })}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={16} color="#fff" style={{ marginRight: 8 }} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
