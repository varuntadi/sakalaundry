// client/src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { io } from "socket.io-client";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";
// Optional: import admin styles if you created admin.css
// import "../styles/admin.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

const STATUSES = ["Pending", "In Progress", "Delivering", "Completed"];
const SERVICES = ["Wash and Fold", "Wash and Iron", "Iron", "Dry Clean", "Others"];

// status colors (used for charts)
const statusColors = ["#f59e0b", "#06b6d4", "#a855f7", "#22c55e"];
const serviceColors = [
  "rgba(37,99,235,0.8)",
  "rgba(96,165,250,0.8)",
  "rgba(244,114,182,0.8)",
  "rgba(251,146,60,0.8)",
  "rgba(107,114,128,0.85)",
];

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // socket.io real-time + notification + sound
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(base + "/admin", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => console.log("✅ Admin socket connected:", socket.id));
    socket.on("disconnect", (reason) => console.log("🔌 Admin socket disconnected:", reason));

    // small sound (place notification.mp3 in public/, or change path)
    const audio = new Audio("/notification.mp3");

    socket.on("admin:newOrder", (order) => {
      // prepend so newest appear on top
      setOrders((prev) => [order, ...prev]);

      // browser notification (if allowed)
      try {
        if ("Notification" in window) {
          if (Notification.permission === "default") Notification.requestPermission();
          if (Notification.permission === "granted") {
            new Notification(`New Order #${order.orderNumber || order._id}`, {
              body: `${order.service} — ${order.phone || "No phone"}\nPickup: ${order.pickupAddress || "-"}`,
              icon: "/img/sakalogo.jpg",
            });
          }
        }
      } catch (e) {
        console.warn("Notification failed:", e);
      }

      // play sound (best-effort; may be blocked by browser without user interaction)
      audio.play().catch(() => { /* ignore autoplay errors */ });

      // lightweight UI hint
      setError(`📦 New Order #${order.orderNumber || String(order._id).slice(-6)} received`);
      setTimeout(() => setError(""), 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // KPI totals
  const totals = useMemo(() => {
    const t = { total: orders.length, pending: 0, progress: 0, delivering: 0, done: 0 };
    orders.forEach((o) => {
      if (o.status === "Pending") t.pending++;
      else if (o.status === "In Progress") t.progress++;
      else if (o.status === "Delivering") t.delivering++;
      else if (o.status === "Completed") t.done++;
    });
    return t;
  }, [orders]);

  const statusCounts = useMemo(() => STATUSES.map((s) => orders.filter((o) => o.status === s).length), [orders]);
  const serviceCounts = useMemo(() => SERVICES.map((s) => orders.filter((o) => o.service === s).length), [orders]);

  // last 14 days counts
  const { labels14, counts14 } = useMemo(() => {
    const labels = [];
    const countsMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      labels.push(key);
      countsMap[key] = 0;
    }
    orders.forEach((o) => {
      if (!o.createdAt) return;
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (key in countsMap) countsMap[key] += 1;
    });
    return { labels14: labels, counts14: labels.map((k) => countsMap[k]) };
  }, [orders]);

  const setStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      await load();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err?.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // CSV Export (simple)
  const exportCSV = () => {
    const headers = [
      "Order ID",
      "Order Number",
      "User",
      "Phone",
      "Service",
      "Cloth Types",
      "Pickup Address",
      "Pickup Date",
      "Delivery",
      "Status",
      "Created At",
    ];
    const rows = orders.map((o) => [
      o._id,
      o.orderNumber,
      o.userId?.name || o.userId?.email || "",
      o.phone || "",
      o.service,
      (o.clothTypes || []).join(" | "),
      o.pickupAddress || "",
      o.pickupDate || "",
      o.delivery || "regular",
      o.status,
      o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
    ]);
    const csvContent =
      [headers.join(","), ...rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doughnutData = { labels: STATUSES, datasets: [{ data: statusCounts, backgroundColor: statusColors, borderWidth: 0 }] };
  const barData = { labels: SERVICES, datasets: [{ label: "Orders", data: serviceCounts, backgroundColor: serviceColors, borderRadius: 8 }] };
  const lineData = { labels: labels14, datasets: [{ label: "Orders per day", data: counts14, borderColor: "#2563eb", backgroundColor: "#60a5fa", tension: 0.35, fill: false }] };

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!o) return false;
      if (String(o.orderNumber).toLowerCase().includes(q)) return true;
      if (o._id && String(o._id).toLowerCase().includes(q)) return true;
      if (o.phone && String(o.phone).toLowerCase().includes(q)) return true;
      return false;
    });
  }, [orders, search]);

  return (
    <div className="container" style={{ maxWidth: 1200, margin: "18px auto", padding: 12 }}>
      <h2 style={{ marginBottom: 12 }}>Admin Dashboard</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search by order number / id / phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e6eef6" }}
        />
        <button className="btn ghost" onClick={exportCSV} style={{ padding: "8px 12px" }}>⬇ Export CSV</button>
        <button className="btn ghost" onClick={load} style={{ padding: "8px 12px" }}>🔄 Refresh</button>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="kpi kpi-blue" style={{ padding: 12, borderRadius: 12, color: "#fff", minWidth: 160 }}>
          <div style={{ fontSize: 13 }}>Total Orders</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.total}</div>
        </div>
        <div className="kpi kpi-amber" style={{ padding: 12, borderRadius: 12, minWidth: 160, color: "#111" }}>
          <div style={{ fontSize: 13 }}>Pending</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.pending}</div>
        </div>
        <div className="kpi kpi-cyan" style={{ padding: 12, borderRadius: 12, minWidth: 160 }}>
          <div style={{ fontSize: 13 }}>In Progress</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.progress}</div>
        </div>
        <div className="kpi kpi-purple" style={{ padding: 12, borderRadius: 12, minWidth: 160 }}>
          <div style={{ fontSize: 13 }}>Delivering</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.delivering}</div>
        </div>
        <div className="kpi kpi-green" style={{ padding: 12, borderRadius: 12, minWidth: 160 }}>
          <div style={{ fontSize: 13 }}>Completed</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.done}</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: 12 }}><h4>Orders by Status</h4><Doughnut data={doughnutData} /></div>
        <div className="card" style={{ padding: 12 }}><h4>Orders by Service</h4><Bar data={barData} /></div>
        <div className="card" style={{ padding: 12 }}><h4>Orders over last 14 days</h4><Line data={lineData} /></div>
      </div>

      {/* Orders list */}
      <div className="card" style={{ padding: 12 }}>
        {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
        {loading && <div style={{ marginBottom: 8 }}>Loading orders…</div>}
        {!loading && filteredOrders.length === 0 && <div style={{ marginBottom: 8 }}>No matching orders found.</div>}

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
          {filteredOrders.map((o) => (
            <div key={o._id} className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>#{o.orderNumber} — {o.service}</div>
                </div>
                <div>
                  <span style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 12,
                    background: o.status === "Completed" ? "#ecfee9" : o.status === "Delivering" ? "linear-gradient(90deg,#f3e8ff,#e9d5ff)" : o.status === "In Progress" ? "#e0f2fe" : "#fff7ed",
                    color: o.status === "Completed" ? "#166534" : o.status === "Delivering" ? "#6b21a8" : o.status === "In Progress" ? "#0369a1" : "#92400e",
                    border: "1px solid rgba(0,0,0,0.04)"
                  }}>
                    {o.status}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 8, color: "#374151", fontSize: 13 }}>
                <div><strong>User:</strong> {o.userId?.name ?? o.userId?.email ?? "-"}</div>
                <div><strong>Phone:</strong> {o.phone ?? "-"}</div>
                <div><strong>Pickup:</strong> {o.pickupAddress ?? "-"}</div>
                <div><strong>Pickup Date:</strong> {o.pickupDate ?? "-"}</div>
                <div><strong>Delivery:</strong> {o.delivery ?? "regular"}</div>
                <div><strong>Created:</strong> {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</div>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`btn ${s === o.status ? "" : "ghost"}`}
                    onClick={() => setStatus(o._id, s)}
                    disabled={updatingId === o._id || s === o.status}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: s === o.status ? "#0b1220" : "transparent",
                      color: s === o.status ? "#fff" : "#0b1220",
                      border: s === o.status ? "none" : "1px solid #e6eef6",
                      fontWeight: 700,
                      cursor: updatingId === o._id ? "wait" : "pointer"
                    }}
                  >
                    {updatingId === o._id && s !== o.status ? "Updating…" : s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
