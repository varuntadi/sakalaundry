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

/* ----------------- constants & helpers ----------------- */
const ORDER_STATUSES = ["Pending", "In Progress", "Delivering", "Completed"];
const TICKET_STATUS_UI = ["Pending", "Contacted", "Resolved"];
const SERVICES = ["Wash and Fold", "Wash and Iron", "Iron", "Dry Clean", "Others"];
const DELIVERY_TYPES = ["regular", "express"];

const orderStatusColors = ["#f59e0b", "#06b6d4", "#a855f7", "#22c55e"];
const serviceColors = [
  "rgba(37,99,235,0.8)",
  "rgba(96,165,250,0.8)",
  "rgba(244,114,182,0.8)",
  "rgba(251,146,60,0.8)",
  "rgba(107,114,128,0.85)",
];
const deliveryColors = ["#10b981", "#ef4444"];

const deliveryBadgeStyle = (type) => {
  if (!type) type = "regular";
  if (type === "express") {
    return {
      background: "#ef4444",
      color: "#fff",
      padding: "4px 10px",
      borderRadius: 12,
      fontWeight: 700,
      fontSize: 12,
      textTransform: "capitalize",
    };
  }
  if (type === "regular") {
    return {
      background: "#10b981",
      color: "#fff",
      padding: "4px 10px",
      borderRadius: 12,
      fontWeight: 600,
      fontSize: 12,
      textTransform: "capitalize",
    };
  }
  return {
    background: "#6b7280",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 12,
    textTransform: "capitalize",
  };
};

const fmtDate = (iso) => {
  try {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso || "-";
  }
};

// map UI label -> backend status value
const uiToBackendStatus = (ui) => {
  if (!ui) return "open";
  const normalized = String(ui).toLowerCase();
  if (normalized === "pending") return "open";
  if (normalized === "contacted") return "in-progress";
  if (normalized === "resolved") return "closed";
  return normalized;
};

const backendToUiStatus = (s) => {
  if (s === "open") return "Pending";
  if (s === "in-progress") return "Contacted";
  if (s === "closed") return "Resolved";
  return s;
};

/* ----------------- Admin component ----------------- */
export default function Admin() {
  /* ----------------- Orders state (unchanged) ----------------- */
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterDelivery, setFilterDelivery] = useState("all");

  /* ----------------- Tickets state (new) ----------------- */
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketSearch, setTicketSearch] = useState("");
  const [replyText, setReplyText] = useState({}); // { ticketId: message }
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'tickets'
  const [busyTicketIds, setBusyTicketIds] = useState(new Set()); // disable controls per ticket

  // ticket UI tabs/filters
  const [ticketTab, setTicketTab] = useState("all"); // 'all'|'pending'|'contacted'|'resolved'
  const [ticketSortBy, setTicketSortBy] = useState("newest"); // 'newest'|'oldest'

  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  /* ----------------- Orders: loadOrders ----------------- */
  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/orders");
      const loaded = res.data ?? res;
      setOrders(loaded || []);
    } catch (e) {
      console.error("loadOrders error:", e);
      setError(e?.response?.data?.error || e?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* ----------------- Tickets: loadTickets (admin) ----------------- */
  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      // The backend router is mounted at /api/tickets (server/index.js)
      // Use axios wrapper `api` which should have baseURL; try explicit /api/tickets
      const res = await api.get("/api/tickets");
      const loaded = res.data ?? res;
      setTickets(Array.isArray(loaded) ? loaded : loaded.tickets ?? []);
    } catch (err) {
      console.error("loadTickets failed:", err);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  /* ----------------- Socket: admin namespace ----------------- */
  useEffect(() => {
    const socketBase = base ? `${base}/admin` : "/admin";
    const token = localStorage.getItem("token");
    const opts = { transports: ["websocket"], ...(token ? { auth: { token } } : {}) };
    const socket = io(socketBase, opts);

    socket.on("connect", () => {
      console.log("Admin socket connected", socketBase);
    });

    socket.on("admin:newOrder", (order) => {
      setOrders((prev) => {
        if (prev.some((p) => p._id === order._id)) return prev.map((p) => (p._id === order._id ? order : p));
        return [order, ...prev];
      });
    });

    socket.on("admin:newTicket", (ticket) => {
      setTickets((prev) => {
        if (prev.some((p) => p._id === ticket._id)) return prev.map((p) => (p._id === ticket._id ? ticket : p));
        return [ticket, ...prev];
      });
    });

    socket.on("admin:ticketUpdated", (ticket) => {
      setTickets((prev) => prev.map((p) => (p._id === ticket._id ? ticket : p)));
    });

    socket.on("disconnect", () => {
      console.log("Admin socket disconnected");
    });

    return () => socket.disconnect();
  }, [base]);

  /* ----------------- Tickets actions ----------------- */
  const setTicketBusy = (id, busy = true) => {
    setBusyTicketIds((prev) => {
      const copy = new Set(prev);
      if (busy) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  };

  // Update status using the backend endpoints that exist:
  // - POST /api/tickets/:id/reply  -> sets status to "in-progress" and pushes reply
  // - POST /api/tickets/:id/close  -> sets status to "closed"
  // There is no PUT /api/tickets/:id in your current server, so we call the above endpoints accordingly.
  const updateTicketStatus = async (id, backendStatus) => {
    // backendStatus should be one of: 'open', 'in-progress', 'closed'
    setTicketBusy(id, true);
    try {
      if (backendStatus === "in-progress") {
        // set to in-progress and add a short admin reply
        const res = await api.post(`/api/tickets/${id}/reply`, { message: "Contacted by admin" });
        const updated = res.data ?? res;
        setTickets((prev) => prev.map((t) => (t._id === id ? updated : t)));
        return;
      }

      if (backendStatus === "closed") {
        const res = await api.post(`/api/tickets/${id}/close`);
        const updated = res.data ?? res;
        setTickets((prev) => prev.map((t) => (t._id === id ? updated : t)));
        return;
      }

      if (backendStatus === "open") {
        // Your backend does not currently expose a 'reopen' endpoint.
        // Best-effort: we will try to PATCH/PUT (if implemented), else inform admins.
        try {
          const res = await api.put(`/api/tickets/${id}`, { status: "open" });
          const updated = res.data ?? res;
          setTickets((prev) => prev.map((t) => (t._id === id ? updated : t)));
          return;
        } catch (err) {
          // fallback: just reload tickets and show a console note
          console.warn("Reopen not supported by backend; reloading tickets instead.");
          await loadTickets();
          return;
        }
      }

      // unknown status: reload
      await loadTickets();
    } catch (err) {
      console.error("updateTicketStatus failed:", err);
      // refresh to canonical state
      await loadTickets();
    } finally {
      setTicketBusy(id, false);
    }
  };

  // wrapper to accept UI label and map to backend status
  const handleStatusClick = (id, uiLabel) => {
    const backendStatus = uiToBackendStatus(uiLabel); // 'open'|'in-progress'|'closed'
    updateTicketStatus(id, backendStatus);
  };

  // send a typed reply -> uses reply endpoint and server sets in-progress
  const sendReply = async (id) => {
    const message = (replyText[id] || "").trim();
    if (!message) return;
    setTicketBusy(id, true);
    try {
      const res = await api.post(`/api/tickets/${id}/reply`, { message });
      const updated = res.data ?? res;
      setReplyText((prev) => ({ ...prev, [id]: "" }));
      setTickets((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      console.error("sendReply failed:", err);
      // reload to keep UI consistent
      await loadTickets();
    } finally {
      setTicketBusy(id, false);
    }
  };

  // delete ticket - backend currently doesn't have a DELETE route in your provided router.
  // We'll attempt DELETE /api/tickets/:id and fallback to removing from UI if 404.
  const deleteTicket = async (id) => {
    if (!window.confirm("Are you sure you want to DELETE this ticket?")) return;
    setTicketBusy(id, true);
    try {
      await api.delete(`/api/tickets/${id}`);
      // success - remove locally
      setTickets((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      // If backend doesn't support delete, fallback to remove locally (with warning)
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        console.warn("Delete not supported by backend; removing locally for admin view.");
        setTickets((prev) => prev.filter((t) => t._id !== id));
      } else {
        console.error("deleteTicket failed:", err);
        alert("Failed to delete ticket. Check console for details.");
      }
    } finally {
      setTicketBusy(id, false);
    }
  };

  /* ----------------- copy helper ----------------- */
  const copyToClipboard = async (text) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      // short feedback
      console.log("Copied:", text);
    } catch (e) {
      console.warn("copy failed", e);
    }
  };

  /* ----------------- Export helpers ----------------- */
  const exportCsvFromRows = (headers, rows, filename) => {
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportOrders = (onlyFiltered = false) => {
    const rowsSource = onlyFiltered ? filteredOrders : orders;
    if (!rowsSource.length) {
      alert("No orders to export");
      return;
    }
    const headers = [
      "Order Number",
      "Service",
      "Status",
      "Delivery",
      "Pickup Address",
      "Pickup Date",
      "Pickup Time",
      "Phone",
      "User",
      "Created At",
    ];
    const rows = rowsSource.map((o) => [
      o.orderNumber,
      o.service,
      o.status,
      o.delivery || "regular",
      o.pickupAddress || "",
      o.pickupDate || "",
      o.pickupTime || "",
      o.phone || "",
      o.userId?.name || "",
      o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
    ]);
    exportCsvFromRows(headers, rows, onlyFiltered ? "orders_filtered_export.csv" : "orders_export.csv");
  };

  const exportTickets = (groupByStatus = false) => {
    if (!tickets.length) {
      alert("No tickets to export");
      return;
    }
    if (!groupByStatus) {
      const headers = ["User Name", "Mobile", "OrderId", "Issue", "Status", "Created At"];
      const rows = tickets.map((t) => [
        t.userName || "",
        t.mobile || "",
        t.orderId || "",
        t.issue || "",
        backendToUiStatus(t.status) || "",
        t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
      ]);
      exportCsvFromRows(headers, rows, "tickets_export.csv");
      return;
    }

    // grouped export: one CSV with status column already present but sorted by status
    const sorted = [...tickets].sort((a, b) => (a.status || "").localeCompare(b.status || ""));
    const headers = ["Status", "User Name", "Mobile", "OrderId", "Issue", "Created At"];
    const rows = sorted.map((t) => [
      backendToUiStatus(t.status),
      t.userName || "",
      t.mobile || "",
      t.orderId || "",
      t.issue || "",
      t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
    ]);
    exportCsvFromRows(headers, rows, "tickets_export_grouped.csv");
  };

  /* ----------------- Orders helpers (preserved) ----------------- */
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

  const statusCounts = ORDER_STATUSES.map((s) => orders.filter((o) => o.status === s).length);
  const serviceCounts = SERVICES.map((s) => orders.filter((o) => o.service === s).length);
  const deliveryCounts = DELIVERY_TYPES.map((d) => orders.filter((o) => (o.delivery || "regular") === d).length);

  const { labels7, counts7 } = useMemo(() => {
    const labels = [];
    const countsMap = {};
    for (let i = 6; i >= 0; i--) {
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
    return { labels7: labels, counts7: labels.map((k) => countsMap[k]) };
  }, [orders]);

  /* ----------------- Filters (unchanged) ----------------- */
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (filterService !== "all") list = list.filter((o) => o.service === filterService);
    if (filterDelivery !== "all") list = list.filter((o) => (o.delivery || "regular") === filterDelivery);

    if (!search) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (o) =>
        String(o.orderNumber || "").toLowerCase().includes(q) ||
        String(o._id || "").toLowerCase().includes(q) ||
        String(o.phone || "").toLowerCase().includes(q)
    );
  }, [orders, search, filterService, filterDelivery]);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    // filter by tab
    if (ticketTab === "pending") list = list.filter((t) => (t.status || "open") === "open");
    else if (ticketTab === "contacted") list = list.filter((t) => (t.status || "").toString() === "in-progress");
    else if (ticketTab === "resolved") list = list.filter((t) => (t.status || "").toString() === "closed");

    const sorter = (a, b) => (ticketSortBy === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));
    if (!ticketSearch) return [...list].sort(sorter);

    const q = ticketSearch.trim().toLowerCase();
    const filtered = list.filter(
      (t) =>
        String(t.userName || "").toLowerCase().includes(q) ||
        String(t.mobile || "").toLowerCase().includes(q) ||
        String(t.issue || "").toLowerCase().includes(q)
    );
    return filtered.sort(sorter);
  }, [tickets, ticketSearch, ticketTab, ticketSortBy]);

  /* ----------------- Orders actions (unchanged) ----------------- */
  const setStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      await loadOrders();
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to DELETE this order?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/admin/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error("Delete order failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  /* ----------------- Extra helpers ----------------- */
  const isPickupOverdue = (pickupDate) => {
    if (!pickupDate) return false;
    try {
      const p = new Date(pickupDate);
      const today = new Date();
      // compare date-only
      const pDateOnly = new Date(p.getFullYear(), p.getMonth(), p.getDate());
      const tDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return pDateOnly < tDateOnly;
    } catch {
      return false;
    }
  };

  /* ----------------- Render ----------------- */
  return (
    <div className="container" style={{ maxWidth: 1200, margin: "18px auto", padding: 12 }}>
      <h2 style={{ marginBottom: 12 }}>Admin Dashboard</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setView("dashboard")} className={`btn ${view === "dashboard" ? "" : "ghost"}`}>
          📊 Dashboard
        </button>
        <button
          onClick={() => {
            setView("tickets");
            loadTickets();
          }}
          className={`btn ${view === "tickets" ? "" : "ghost"}`}
        >
          🎫 Tickets
        </button>
      </div>

      {view === "dashboard" ? (
        <>
          {/* Orders search + refresh + export */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search orders by number / id / phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e6eef6" }}
            />
            <select value={filterService} onChange={(e) => setFilterService(e.target.value)}>
              <option value="all">All Services</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={filterDelivery} onChange={(e) => setFilterDelivery(e.target.value)}>
              <option value="all">All Delivery</option>
              <option value="regular">Regular</option>
              <option value="express">Express</option>
            </select>
            <button className="btn" onClick={() => exportOrders(false)}>
              📥 Export Orders
            </button>
            <button className="btn ghost" onClick={() => exportOrders(true)}>
              📥 Export Filtered Orders
            </button>
            <button className="btn ghost" onClick={loadOrders}>
              🔄 Refresh Orders
            </button>
            <button className="btn ghost" onClick={loadTickets}>
              🔄 Refresh Tickets
            </button>
          </div>

          {/* KPIs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ padding: 12, borderRadius: 12, background: "#3b82f6", color: "#fff", minWidth: 160 }}>
              <div>Total Orders</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.total}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: "#facc15", minWidth: 160 }}>
              <div>Pending</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.pending}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: "#06b6d4", minWidth: 160 }}>
              <div>In Progress</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.progress}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: "#a855f7", minWidth: 160 }}>
              <div>Delivering</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.delivering}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: "#22c55e", minWidth: 160 }}>
              <div>Completed</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{totals.done}</div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12, marginBottom: 16 }}>
            <div className="card" style={{ padding: 12 }}>
              <h4>Orders by Status</h4>
              <Doughnut data={{ labels: ORDER_STATUSES, datasets: [{ data: statusCounts, backgroundColor: orderStatusColors }] }} />
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>Orders by Service</h4>
              <Bar data={{ labels: SERVICES, datasets: [{ data: serviceCounts, backgroundColor: serviceColors }] }} />
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>Orders by Delivery Type</h4>
              <Doughnut data={{ labels: ["Regular", "Express"], datasets: [{ data: deliveryCounts, backgroundColor: deliveryColors }] }} />
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>Orders last 7 days</h4>
              <Line data={{ labels: labels7, datasets: [{ data: counts7, borderColor: "#2563eb", backgroundColor: "#60a5fa", tension: 0.35 }] }} />
            </div>
          </div>

          {/* Orders List */}
          <div className="card" style={{ padding: 12, marginBottom: 30 }}>
            <h3>Orders</h3>
            {loading && <div>Loading orders…</div>}
            {!loading && filteredOrders.length === 0 && <div>No orders found.</div>}

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
              {filteredOrders.map((o) => (
                <div key={o._id} className="card" style={{ padding: 12, border: isPickupOverdue(o.pickupDate) ? "1px solid #ef4444" : undefined }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800 }}>
                        #{o.orderNumber}{" "}
                        <span style={{ marginLeft: 8, fontWeight: 600, color: "#374151" }}>{o.service}</span>
                      </div>
                      <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
                        {o.userId?.name || "Anonymous"} • {o.phone || "-"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={deliveryBadgeStyle(o.delivery)}>{o.delivery || "regular"}</div>
                      <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>{fmtDate(o.createdAt)}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>Pickup address:</strong>{" "}
                    {o.lat && o.lng ? (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#2563eb", textDecoration: "underline" }}
                      >
                        {o.pickupAddress || "View Location"}
                      </a>
                    ) : (
                      o.pickupAddress || "-"
                    )}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>Pickup Date:</strong> {o.pickupDate || "-"}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>Pickup Time:</strong> {o.pickupTime || "-"}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>Status:</strong> {o.status}
                  </div>

                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {ORDER_STATUSES.map((s) => (
                      <button
                        key={s}
                        className={`btn ${s === o.status ? "" : "ghost"}`}
                        onClick={() => setStatus(o._id, s)}
                        disabled={updatingId === o._id || deletingId === o._id}
                      >
                        {s}
                      </button>
                    ))}
                    <button className="btn" onClick={() => (o.phone ? (window.location.href = `tel:${o.phone}`) : copyToClipboard(o.phone))}>
                      📞 Call
                    </button>
                    <button className="btn ghost" onClick={() => copyToClipboard(o.phone || o.userId?.phone || "")}>📋 Copy</button>
                    <button className="btn danger" onClick={() => handleDelete(o._id)} disabled={deletingId === o._id || updatingId === o._id}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Tickets view */
        <>
          <div className="card" style={{ padding: 12, marginBottom: 30 }}>
            <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Tickets</span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                <strong>{tickets.length}</strong> total • Pending: <strong>{(tickets.filter(t => (t.status || "open") === "open") || []).length}</strong> • Contacted: <strong>{(tickets.filter(t => (t.status || "") === "in-progress") || []).length}</strong> • Resolved: <strong>{(tickets.filter(t => (t.status || "") === "closed") || []).length}</strong>
              </span>
            </h3>

            {/* ticket controls */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Search tickets by user / mobile / issue..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e6eef6" }}
              />
              <select value={ticketTab} onChange={(e) => setTicketTab(e.target.value)} style={{ minWidth: 140 }}>
                <option value="all">All Tickets</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={ticketSortBy} onChange={(e) => setTicketSortBy(e.target.value)} style={{ minWidth: 140 }}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              <button className="btn" onClick={() => exportTickets(false)}>📥 Export Tickets</button>
              <button className="btn ghost" onClick={() => exportTickets(true)}>📥 Export (grouped)</button>
              <button className="btn ghost" onClick={loadTickets}>🔄 Refresh Tickets</button>
            </div>

            {loadingTickets && <div>Loading tickets…</div>}
            {!loadingTickets && filteredTickets.length === 0 && <div>No tickets found.</div>}

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
              {filteredTickets.map((t) => {
                const isBusy = busyTicketIds.has(t._id);
                // map backend status to UI label
                const uiStatus = t.status === "open" ? "Pending" : t.status === "in-progress" ? "Contacted" : t.status === "closed" ? "Resolved" : String(t.status);
                return (
                  <div key={t._id} className="card" style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{t.userName || "Unknown User"}</div>
                        <div style={{ marginTop: 4, color: "#6b7280" }}>{t.mobile || "-"}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Call button */}
                        <a
                          href={`tel:${t.mobile}`}
                          className="btn"
                          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                          📞 Call
                        </a>

                        {/* Copy number */}
                        <button
                          className="btn ghost"
                          onClick={() => copyToClipboard(t.mobile || "")}
                          title="Copy number"
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>{t.issue || "No issue description"}</div>

                    <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                      Status: <strong>{uiStatus}</strong> • {fmtDate(t.createdAt)}
                    </div>

                    {/* Replies */}
                    <div style={{ marginTop: 12 }}>
                      <strong>Replies:</strong>
                      <div style={{ maxHeight: 140, overflowY: "auto", marginTop: 6, paddingLeft: 6 }}>
                        {t.replies?.length ? (
                          t.replies.map((r, i) => (
                            <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>
                              <b>{r.sender}:</b> {r.message} <i style={{ color: "#9ca3af", fontSize: 11 }}>({fmtDate(r.createdAt)})</i>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: 13, color: "#9ca3af" }}>No replies yet</div>
                        )}
                      </div>
                    </div>

                    {/* Reply box */}
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Type reply..."
                        value={replyText[t._id] || ""}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [t._id]: e.target.value }))}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e6eef6" }}
                        disabled={isBusy}
                      />
                      <button className="btn" onClick={() => sendReply(t._id)} disabled={isBusy}>
                        Reply
                      </button>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* Contacted -> in-progress */}
                      <button
                        className={`btn ${uiStatus === "Contacted" ? "" : "ghost"}`}
                        onClick={() => handleStatusClick(t._id, "Contacted")}
                        disabled={isBusy}
                      >
                        Contacted
                      </button>

                      {/* Pending -> reopen to 'open' */}
                      <button
                        className={`btn ${uiStatus === "Pending" ? "" : "ghost"}`}
                        onClick={() => handleStatusClick(t._id, "Pending")}
                        disabled={isBusy}
                      >
                        Pending
                      </button>

                      {/* Resolved -> closed */}
                      <button
                        className={`btn ${uiStatus === "Resolved" ? "" : "ghost"}`}
                        onClick={() => handleStatusClick(t._id, "Resolved")}
                        disabled={isBusy}
                      >
                        Resolved
                      </button>

                      <button className="btn danger" onClick={() => deleteTicket(t._id)} disabled={isBusy}>
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
