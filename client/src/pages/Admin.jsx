// client/src/pages/Admin.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
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

// ====== CHART SETUP ======
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

/* =========================================================================
   CONSTANTS & HELPERS
   ========================================================================= */
// stamp image should be in /public/sakastamp.jpg

const ORDER_STATUSES = ["Pending", "In Progress", "Delivering", "Completed"];
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

const money = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const deliveryBadgeStyle = (type) =>
  type === "express"
    ? {
        background: "#ef4444",
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 12,
        fontWeight: 700,
        fontSize: 12,
        textTransform: "capitalize",
      }
    : {
        background: "#10b981",
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 12,
        textTransform: "capitalize",
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

const pad = (s, n = 2) => String(s).padStart(n, "0");
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
const safeWin = () => (typeof window !== "undefined" ? window : undefined);

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function Admin() {
  /* Orders */
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterDelivery, setFilterDelivery] = useState("all");

  /* Tickets */
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketSearch, setTicketSearch] = useState("");
  const [replyText, setReplyText] = useState({});
  const [view, setView] = useState("dashboard");

  const [busyTicketIds, setBusyTicketIds] = useState(new Set());
  const [ticketTab, setTicketTab] = useState("all");
  const [ticketSortBy, setTicketSortBy] = useState("newest");

  /* Pricing modal + invoice */
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceMode, setPriceMode] = useState("pickup"); // 'pickup' | 'edit'
  const [priceOrderId, setPriceOrderId] = useState(null);
  const [priceOrderTitle, setPriceOrderTitle] = useState("");
  const [items, setItems] = useState([{ service: "Wash and Fold", item: "Garment", qty: 1, rate: 0 }]);

  // discount can be amount or percentage
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] = useState("amount"); // 'amount' | 'percent'
  const [tax, setTax] = useState(0);

  const [savingPrice, setSavingPrice] = useState(false);
  const [formError, setFormError] = useState("");
  const [activeOrder, setActiveOrder] = useState(null);

  const [isNarrow, setIsNarrow] = useState(false);

  // refs for capturing invoice
  const invoiceCaptureRef = useRef(null);
  const invoiceScrollRef = useRef(null);

  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  /* ----------------- One-time CSS ----------------- */
  useEffect(() => {
    if (document.getElementById("admin-invoice-styles-v2")) return;
    const css = `
      .adm-modal { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,.45); display:flex; align-items:center; justify-content:center; padding:12px; }
      .adm-sheet { width:min(1180px,100%); max-height: 94vh; overflow:auto; padding:14px; border-radius:14px; background:#fff; }
      .adm-grid { display:grid; grid-template-columns: 1.35fr 520px; gap:14px; }
      .invoice-panel { position:relative; }
      .invoice-box { width:520px; max-width:520px; }

      .big-input { height:44px; padding:10px 14px; font-size:16px; border:2px solid #e3e8ef; border-radius:12px; outline:none; width:100%; }
      .big-input:focus { border-color:#2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.12); }
      .big-number { text-align:left; }
      .editor-th { background:#f1f5f9; font-weight:700; }
      .editor-td { padding:8px; }
      .editor-actions .btn { height:44px; }
      .add-btn { height:44px; padding:0 14px; border:2px solid #e3e8ef; border-radius:12px; background:#f8fafc; }
      .add-btn:hover { background:#eef2f7; }
      .amount-cell { text-align:right; font-weight:700; white-space:nowrap; min-width:120px; }
      .col-service { width: 34%; min-width: 260px; }
      .col-item    { width: 28%; min-width: 220px; }
      .col-qty     { width: 12%; min-width: 90px; }
      .col-rate    { width: 16%; min-width: 140px; }
      .col-amt     { width: 10%; min-width: 120px; }

      @media (max-width: 1020px) {
        .adm-grid { grid-template-columns: 1fr; }
        .adm-sheet { width:100%; height:100%; max-height:none; border-radius:0; }
        .invoice-box { width:100%; max-width:none; }
        .invoice-panel { position:static; }
      }
    `;
    const el = document.createElement("style");
    el.id = "admin-invoice-styles-v2";
    el.textContent = css;
    document.head.appendChild(el);
  }, []);

  /* ----------------- Responsive flag ----------------- */
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1020);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ----------------- Orders: load ----------------- */
  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders");
      const loaded = res.data ?? res;
      setOrders(loaded || []);
      // refresh activeOrder if open
      if (priceOrderId) {
        const fresh = (loaded || []).find((o) => o._id === priceOrderId);
        if (fresh) setActiveOrder(fresh);
      }
    } catch (e) {
      console.error("loadOrders error:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => void loadOrders(), []);

  /* ----------------- Tickets: load ----------------- */
  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
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
  useEffect(() => void loadTickets(), []);

  /* ----------------- Sockets ----------------- */
  useEffect(() => {
    if (!base) {
      console.warn("Sockets disabled: set VITE_API_URL to your API origin to enable admin live updates.");
      return;
    }
    const socketUrl = `${base}/admin`;
    const token = safeWin()?.localStorage?.getItem("token");
    const opts = {
      transports: ["websocket", "polling"],
      ...(token ? { auth: { token } } : {}),
    };

    let socket;
    try {
      socket = io(socketUrl, opts);

      socket.on("connect", () => console.log("Admin socket connected", socketUrl));

      socket.on("admin:newOrder", (order) => {
        setOrders((prev) =>
          prev.some((p) => p._id === order._id) ? prev.map((p) => (p._id === order._id ? order : p)) : [order, ...prev]
        );
      });

      socket.on("admin:orderUpdated", (order) => {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? order : o)));
        if (priceOrderId && order._id === priceOrderId) setActiveOrder(order);
      });

      socket.on("admin:newTicket", (ticket) => {
        setTickets((prev) =>
          prev.some((p) => p._id === ticket._id) ? prev.map((p) => (p._id === ticket._id ? ticket : p)) : [ticket, ...prev]
        );
      });

      socket.on("admin:ticketUpdated", (ticket) => {
        setTickets((prev) => prev.map((p) => (p._id === ticket._id ? ticket : p)));
      });

      socket.on("disconnect", () => console.log("Admin socket disconnected"));
      socket.on("connect_error", (err) => console.warn("Admin socket connect_error:", err?.message || err));
    } catch (e) {
      console.warn("Admin socket init skipped:", e);
    }

    return () => {
      try {
        socket?.disconnect();
      } catch {}
    };
  }, [base, priceOrderId]);

  /* ----------------- Tickets actions ----------------- */
  const setTicketBusy = (id, busy = true) => {
    setBusyTicketIds((prev) => {
      const copy = new Set(prev);
      if (busy) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  };

  const updateTicketStatus = async (id, backendStatus) => {
    setTicketBusy(id, true);
    try {
      if (backendStatus === "in-progress") {
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
        try {
          const res = await api.put(`/api/tickets/${id}`, { status: "open" });
          const updated = res.data ?? res;
          setTickets((prev) => prev.map((t) => (t._id === id ? updated : t)));
          return;
        } catch {
          await loadTickets();
          return;
        }
      }
      await loadTickets();
    } catch (err) {
      console.error("updateTicketStatus failed:", err);
      await loadTickets();
    } finally {
      setTicketBusy(id, false);
    }
  };

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
      await loadTickets();
    } finally {
      setTicketBusy(id, false);
    }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm("Are you sure you want to DELETE this ticket?")) return;
    setTicketBusy(id, true);
    try {
      await api.delete(`/api/tickets/${id}`);
      setTickets((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        setTickets((prev) => prev.filter((t) => t._id !== id));
      } else {
        console.error("deleteTicket failed:", err);
        alert("Failed to delete ticket.");
      }
    } finally {
      setTicketBusy(id, false);
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
    if (!rowsSource.length) return alert("No orders to export");
    const headers = [
      "Order Number",
      "Customer",
      "Service",
      "Status",
      "Delivery",
      "Pickup Address",
      "Pickup Date",
      "Pickup Time",
      "Phone",
      "User",
      "Created At",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
    ];
    const rows = rowsSource.map((o) => [
      o.orderNumber,
      o.userId?.name || "",
      o.service,
      o.status,
      o.delivery || "regular",
      o.pickupAddress || "",
      o.pickupDate || "",
      o.pickupTime || "",
      o.phone || "",
      o.userId?.name || "",
      o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
      o.subtotal ?? "",
      o.discount ?? "",
      o.tax ?? "",
      o.total ?? "",
    ]);
    exportCsvFromRows(headers, rows, onlyFiltered ? "orders_filtered_export.csv" : "orders_export.csv");
  };

  const exportTickets = (groupByStatus = false) => {
    if (!tickets.length) return alert("No tickets to export");
    if (!groupByStatus) {
      const headers = ["User Name", "Mobile", "OrderId", "Issue", "Status", "Created At"];
      const rows = tickets.map((t) => [
        t.userName || "",
        t.mobile || "",
        t.orderId || "",
        t.issue || "",
        (t.status === "open" && "Pending") ||
          (t.status === "in-progress" && "Contacted") ||
          (t.status === "closed" && "Resolved") ||
          t.status ||
          "",
        t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
      ]);
      exportCsvFromRows(headers, rows, "tickets_export.csv");
      return;
    }
    const sorted = [...tickets].sort((a, b) => (a.status || "").localeCompare(b.status || ""));
    const headers = ["Status", "User Name", "Mobile", "OrderId", "Issue", "Created At"];
    const rows = sorted.map((t) => [
      (t.status === "open" && "Pending") ||
        (t.status === "in-progress" && "Contacted") ||
        (t.status === "closed" && "Resolved") ||
        t.status ||
        "",
      t.userName || "",
      t.mobile || "",
      t.orderId || "",
      t.issue || "",
      t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
    ]);
    exportCsvFromRows(headers, rows, "tickets_export_grouped.csv");
  };

  /* ----------------- Orders helpers ----------------- */
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

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (filterService !== "all") list = list.filter((o) => o.service === filterService);
    if (filterDelivery !== "all") list = list.filter((o) => (o.delivery || "regular") === filterDelivery);

    if (!search.trim()) return list;
    const q = search.trim().toLowerCase().replace(/\s+/g, " ");
    return list.filter((o) => {
      const hay = [
        String(o.orderNumber || ""),
        String(o.userId?.name || ""),
        String(o._id || ""),
        String(o.phone || ""),
        String(o.pickupAddress || ""),
        String(o.service || ""),
        String(o.delivery || ""),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, search, filterService, filterDelivery]);

  /* ----------------- Order actions ----------------- */
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

  const isPickupOverdue = (pickupDate) => {
    if (!pickupDate) return false;
    try {
      const p = new Date(pickupDate);
      const today = new Date();
      const pDateOnly = new Date(p.getFullYear(), p.getMonth(), p.getDate());
      const tDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return pDateOnly < tDateOnly;
    } catch {
      return false;
    }
  };

  /* ----------------- Pricing ----------------- */
  const computeSubtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0),
    [items]
  );

  const discountAmount = useMemo(() => {
    const sub = computeSubtotal;
    return discountMode === "percent"
      ? Math.max(0, Math.round((Number(discount || 0) / 100) * sub))
      : Math.max(0, Number(discount || 0));
  }, [discount, discountMode, computeSubtotal]);

  const computeTotal = useMemo(() => {
    const sub = computeSubtotal;
    return Math.max(0, sub - discountAmount + (Number(tax) || 0));
  }, [computeSubtotal, discountAmount, tax]);

  const getCustomerPhone = (o) => onlyDigits(o?.phone || o?.userId?.phone || "");

  const openPriceModal = (order) => {
    setFormError("");
    setActiveOrder(order);
    setPriceOrderId(order._id);
    setPriceOrderTitle(`#${order.orderNumber} — ${order.service} — ${order.userId?.name || "Customer"}`);

    const hasPricing = Array.isArray(order.items) && order.items.length > 0;

    if (hasPricing) {
      setPriceMode("edit");
      setItems(
        order.items.map((it) => ({
          service: it.service || order.service || "Service",
          item: it.item || "Garment",
          qty: it.qty || 0,
          rate: it.rate || 0,
        }))
      );
      setDiscount(order.discount || 0);
      setDiscountMode("amount");
      setTax(order.tax || 0);
    } else {
      setPriceMode("pickup");
      setItems([{ service: order.service || "Service", item: "Garment", qty: 1, rate: 0 }]);
      setDiscount(0);
      setDiscountMode("amount");
      setTax(0);
    }

    setPriceModalOpen(true);
    setTimeout(() => {
      try {
        invoiceScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch {}
    }, 50);
  };

  const closePriceModal = () => {
    if (savingPrice) return;
    setPriceModalOpen(false);
    setActiveOrder(null);
    setItems([{ service: "Wash and Fold", item: "Garment", qty: 1, rate: 0 }]);
    setDiscount(0);
    setDiscountMode("amount");
    setTax(0);
    setPriceOrderId(null);
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[idx] };
      if (field === "service") current.service = value;
      if (field === "item") current.item = value;
      if (field === "qty") current.qty = Math.max(0, Number(value || 0));
      if (field === "rate") current.rate = Math.max(0, Number(value || 0));
      next[idx] = current;
      return next;
    });
  };

  const addItemRow = () => setItems((prev) => [...prev, { service: "Wash and Iron", item: "Shirt", qty: 1, rate: 0 }]);
  const removeItemRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const savePricing = async () => {
    if (!priceOrderId) return;
    if (!items.length || items.every((it) => !Number(it.qty) || !Number(it.rate))) {
      setFormError("Add at least one item with quantity and rate.");
      return;
    }
    setSavingPrice(true);
    try {
      const body = {
        items,
        discount: Number(discountAmount || 0),
        tax: Number(tax || 0),
      };
      if (priceMode === "pickup") {
        await api.post(`/admin/orders/${priceOrderId}/pickup`, body);
      } else {
        await api.patch(`/admin/orders/${priceOrderId}/pricing`, body);
      }
      await loadOrders();
      closePriceModal();
    } catch (e) {
      console.error("savePricing failed", e);
      setFormError(e?.response?.data?.error || "Failed to save pricing");
    } finally {
      setSavingPrice(false);
    }
  };

  /* ----------------- Capture Invoice as IMAGE & WhatsApp helpers ----------------- */
  const captureInvoiceAsImage = async () => {
    if (!invoiceCaptureRef.current) return null;
    const { default: html2canvas } = await import("html2canvas");
    const node = invoiceCaptureRef.current;
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png", 1));
  };

  const openWhatsAppChat = (order) => {
    const digits = getCustomerPhone(order);
    const lineItems = (order?.items || items || [])
      .map(
        (it) =>
          `${it.service || "Service"} - ${it.item || "Item"} x${it.qty} = ₹${Number(it.qty || 0) * Number(it.rate || 0)}`
      )
      .join("%0A");
    const sub = order?.subtotal ?? computeSubtotal;
    const tot =
      order?.total ??
      Math.max(0, sub - (Number(order?.discount ?? discountAmount) || 0) + (Number(order?.tax ?? tax) || 0));
    const msg = encodeURIComponent(
      `Hello ${order?.userId?.name || "Customer"},%0A` +
        `Invoice #${order?.orderNumber || "-"}%0A` +
        `${lineItems}%0A` +
        `Total: ${money(tot)}%0A` +
        `Thank you for choosing Saka Laundry!`
    );
    const url = digits ? `https://wa.me/${digits}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareInvoiceOnWhatsApp = async () => {
    if (!activeOrder) return;
    try {
      const blob = await captureInvoiceAsImage();
      if (!blob) {
        openWhatsAppChat(activeOrder);
        return;
      }
      const file = new File([blob], `invoice_${activeOrder.orderNumber || "order"}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Invoice",
          text: `Invoice #${activeOrder.orderNumber} from Saka Laundry`,
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);

      openWhatsAppChat(activeOrder);
    } catch (err) {
      console.error("shareInvoiceOnWhatsApp failed:", err);
      alert("Couldn't share automatically. Image downloaded—please attach it in WhatsApp.");
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
          {/* Controls */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search orders, phone, address, service..."
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div className="card" style={{ padding: 12 }}>
              <h4>Orders by Status</h4>
              <Doughnut
                data={{ labels: ORDER_STATUSES, datasets: [{ data: statusCounts, backgroundColor: orderStatusColors }] }}
              />
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>Orders by Service</h4>
              <Bar data={{ labels: SERVICES, datasets: [{ data: serviceCounts, backgroundColor: serviceColors }] }} />
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>Orders by Delivery Type</h4>
              <Doughnut
                data={{
                  labels: ["Regular", "Express"],
                  datasets: [{ data: deliveryCounts, backgroundColor: deliveryColors }],
                }}
              />
            </div>
            <div className="card" style={{ padding: 12 }}>
              <h4>Orders last 7 days</h4>
              <Line
                data={{
                  labels: labels7,
                  datasets: [{ data: counts7, borderColor: "#2563eb", backgroundColor: "#60a5fa", tension: 0.35 }],
                }}
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="card" style={{ padding: 12, marginBottom: 30 }}>
            <h3>Orders</h3>
            {loading && <div>Loading orders…</div>}
            {!loading && filteredOrders.length === 0 && <div>No orders found.</div>}

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))" }}>
              {filteredOrders.map((o) => {
                const hasPricing = Array.isArray(o.items) && o.items.length > 0;
                return (
                  <div
                    key={o._id}
                    className="card"
                    style={{ padding: 12, border: isPickupOverdue(o.pickupDate) ? "1px solid #ef4444" : undefined }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                        >
                          <span>
                            #{o.orderNumber}{" "}
                            <span style={{ marginLeft: 8, fontWeight: 600, color: "#374151" }}>{o.service}</span>
                          </span>
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

                    {hasPricing && (
                      <div
                        style={{
                          marginTop: 10,
                          background: "#f8fafc",
                          border: "1px solid #e6eef6",
                          borderRadius: 10,
                          padding: 10,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Invoice</div>
                        <div style={{ fontSize: 13, color: "#374151" }}>
                          {(o.items || []).slice(0, 3).map((it, i) => (
                            <div key={i}>
                              {it.service || "Service"} — {it.item || "Item"}: {it.qty} × {money(it.rate)} ={" "}
                              {money((it.qty || 0) * (it.rate || 0))}
                            </div>
                          ))}
                          {o.items.length > 3 && <div>…and {o.items.length - 3} more</div>}
                          <div style={{ marginTop: 6 }}>
                            Subtotal: <b>{money(o.subtotal || 0)}</b>
                            {" · "}Discount: <b>{money(o.discount || 0)}</b>
                            {" · "}Tax: <b>{money(o.tax || 0)}</b>
                            {" · "}Total: <b>{money(o.total || 0)}</b>
                          </div>
                        </div>
                      </div>
                    )}

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

                      <button
                        className="btn"
                        onClick={() => openPriceModal(o)}
                        title={hasPricing ? "Edit Pricing" : "Pickup & Price"}
                      >
                        {hasPricing ? "✏️ Edit Pricing" : "📦 Pickup & Price"}
                      </button>

                      <button className="btn" onClick={() => (o.phone ? (window.location.href = `tel:${o.phone}`) : null)}>
                        📞 Call
                      </button>
                      <button
                        className="btn ghost"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(o.phone || o.userId?.phone || "");
                          } catch {}
                        }}
                      >
                        📋 Copy
                      </button>
                      <button className="btn ghost" onClick={() => openWhatsAppChat(o)}>
                        🟢 WhatsApp
                      </button>

                      <button
                        className="btn danger"
                        onClick={() => handleDelete(o._id)}
                        disabled={deletingId === o._id || updatingId === o._id}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Tickets view */
        <div className="card" style={{ padding: 12, marginBottom: 30 }}>
          <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Tickets</span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              <strong>{tickets.length}</strong> total • Pending:{" "}
              <strong>{(tickets.filter((t) => (t.status || "open") === "open") || []).length}</strong> • Contacted:{" "}
              <strong>{(tickets.filter((t) => (t.status || "") === "in-progress") || []).length}</strong> • Resolved:{" "}
              <strong>{(tickets.filter((t) => (t.status || "") === "closed") || []).length}</strong>
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
            <button className="btn" onClick={() => exportTickets(false)}>
              📥 Export Tickets
            </button>
            <button className="btn ghost" onClick={() => exportTickets(true)}>
              📥 Export (grouped)
            </button>
            <button className="btn ghost" onClick={loadTickets}>
              🔄 Refresh Tickets
            </button>
          </div>

          {loadingTickets ? (
            <div>Loading tickets…</div>
          ) : (() => {
              let list = tickets;
              if (ticketTab === "pending") list = list.filter((t) => (t.status || "open") === "open");
              else if (ticketTab === "contacted") list = list.filter((t) => (t.status || "") === "in-progress");
              else if (ticketTab === "resolved") list = list.filter((t) => (t.status || "") === "closed");
              const sorter = (a, b) =>
                ticketSortBy === "newest"
                  ? new Date(b.createdAt) - new Date(a.createdAt)
                  : new Date(a.createdAt) - new Date(b.createdAt);
              if (ticketSearch) {
                const q = ticketSearch.trim().toLowerCase();
                list = list.filter(
                  (t) =>
                    String(t.userName || "").toLowerCase().includes(q) ||
                    String(t.mobile || "").toLowerCase().includes(q) ||
                    String(t.issue || "").toLowerCase().includes(q)
                );
              }
              const filtered = [...list].sort(sorter);
              if (!filtered.length) return <div>No tickets found.</div>;
              return (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
                  {filtered.map((t) => {
                    const uiStatus =
                      t.status === "open"
                        ? "Pending"
                        : t.status === "in-progress"
                        ? "Contacted"
                        : t.status === "closed"
                        ? "Resolved"
                        : String(t.status);
                    const isBusy = busyTicketIds.has(t._id);
                    return (
                      <div key={t._id} className="card" style={{ padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{t.userName || "Unknown User"}</div>
                            <div style={{ marginTop: 4, color: "#6b7280" }}>{t.mobile || "-"}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <a
                              href={`tel:${t.mobile}`}
                              className="btn"
                              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                            >
                              📞 Call
                            </a>
                            <button
                              className="btn ghost"
                              onClick={() => navigator.clipboard.writeText(t.mobile || "")}
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

                        <div style={{ marginTop: 12 }}>
                          <strong>Replies:</strong>
                          <div style={{ maxHeight: 140, overflowY: "auto", marginTop: 6, paddingLeft: 6 }}>
                            {t.replies?.length ? (
                              t.replies.map((r, i) => (
                                <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>
                                  <b>{r.sender}:</b> {r.message}{" "}
                                  <i style={{ color: "#9ca3af", fontSize: 11 }}>({fmtDate(r.createdAt)})</i>
                                </div>
                              ))
                            ) : (
                              <div style={{ fontSize: 13, color: "#9ca3af" }}>No replies yet</div>
                            )}
                          </div>
                        </div>

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
                          <button
                            className={`btn ${uiStatus === "Contacted" ? "" : "ghost"}`}
                            onClick={() => updateTicketStatus(t._id, "in-progress")}
                            disabled={isBusy}
                          >
                            Contacted
                          </button>
                          <button
                            className={`btn ${uiStatus === "Pending" ? "" : "ghost"}`}
                            onClick={() => updateTicketStatus(t._id, "open")}
                            disabled={isBusy}
                          >
                            Pending
                          </button>
                          <button
                            className={`btn ${uiStatus === "Resolved" ? "" : "ghost"}`}
                            onClick={() => updateTicketStatus(t._id, "closed")}
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
              );
            })()}
        </div>
      )}

      {/* ================= Pickup & Pricing Modal with HALF-SHEET INVOICE ================= */}
      {priceModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="adm-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePriceModal();
          }}
        >
          <div className="adm-sheet card">
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0 }}>{priceMode === "pickup" ? "Pickup & Price" : "Edit Pricing"}</h3>
                <div style={{ color: "#64748b", marginTop: 2 }}>{priceOrderTitle}</div>
                {activeOrder?.userId?.name && (
                  <div style={{ color: "#0f172a", marginTop: 2, fontWeight: 600 }}>
                    Customer: {activeOrder.userId.name}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn ghost"
                  title="Download PNG"
                  onClick={async () => {
                    const blob = await captureInvoiceAsImage();
                    if (!blob) return;
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `invoice_${activeOrder?.orderNumber || "order"}.png`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      URL.revokeObjectURL(url);
                      a.remove();
                    }, 0);
                  }}
                >
                  ⬇️ PNG
                </button>
                <button className="btn" title="Share via WhatsApp (image/text)" onClick={shareInvoiceOnWhatsApp}>
                  🟢 WhatsApp
                </button>
                <button className="btn danger" onClick={closePriceModal} disabled={savingPrice}>
                  ✖
                </button>
              </div>
            </div>

            {formError && (
              <div className="alert warning" style={{ marginBottom: 10 }}>
                {formError}
              </div>
            )}

            {/* Content split: Left editor + Right invoice */}
            <div className="adm-grid">
              {/* LEFT : Items table + summary inputs */}
              <div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr className="editor-th">
                        <th className="col-service" style={{ textAlign: "left", padding: 10 }}>
                          Service
                        </th>
                        <th className="col-item" style={{ textAlign: "left", padding: 10 }}>
                          Item
                        </th>
                        <th className="col-qty" style={{ textAlign: "left", padding: 10 }}>
                          Qty
                        </th>
                        <th className="col-rate" style={{ textAlign: "left", padding: 10 }}>
                          Rate (₹)
                        </th>
                        <th className="col-amt" style={{ textAlign: "right", padding: 10 }}>
                          Amount
                        </th>
                        <th style={{ width: 60 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);
                        return (
                          <tr key={idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                            <td className="editor-td col-service">
                              <input
                                list="serviceList"
                                className="big-input"
                                value={it.service}
                                onChange={(e) => updateItem(idx, "service", e.target.value)}
                              />
                              <datalist id="serviceList">
                                {SERVICES.map((s) => (
                                  <option key={s} value={s} />
                                ))}
                              </datalist>
                            </td>
                            <td className="editor-td col-item">
                              <input
                                className="big-input"
                                placeholder="e.g., Shirt, Bedsheet…"
                                value={it.item || ""}
                                onChange={(e) => updateItem(idx, "item", e.target.value)}
                              />
                            </td>
                            <td className="editor-td col-qty">
                              <input
                                type="number"
                                min="0"
                                className="big-input big-number"
                                value={it.qty}
                                onChange={(e) => updateItem(idx, "qty", e.target.value)}
                              />
                            </td>
                            <td className="editor-td col-rate">
                              <input
                                type="number"
                                min="0"
                                className="big-input big-number"
                                value={it.rate}
                                onChange={(e) => updateItem(idx, "rate", e.target.value)}
                              />
                            </td>
                            <td className="editor-td col-amt">
                              <div className="amount-cell">{money(amount)}</div>
                            </td>
                            <td className="editor-td" style={{ textAlign: "center" }}>
                              <button className="btn ghost" onClick={() => removeItemRow(idx)} title="Remove row">
                                🗑
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="add-btn" onClick={addItemRow}>
                    + Add Item
                  </button>
                </div>

                {/* Discount / Tax / Total */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1fr 1fr",
                    gap: 12,
                    marginTop: 16,
                    alignItems: "end",
                  }}
                >
                  <label style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span className="helper">
                        Discount {discountMode === "percent" ? `(${Number(discount || 0)}%)` : "(₹)"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="big-input big-number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Applied: <b>{money(discountAmount)}</b>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className={`btn ${discountMode === "amount" ? "" : "ghost"}`}
                        onClick={() => setDiscountMode("amount")}
                        title="Discount in Rupees"
                      >
                        ₹
                      </button>
                      <button
                        type="button"
                        className={`btn ${discountMode === "percent" ? "" : "ghost"}`}
                        onClick={() => setDiscountMode("percent")}
                        title="Discount in %"
                      >
                        %
                      </button>
                    </div>
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className="helper">Tax (₹)</span>
                    <input
                      type="number"
                      min="0"
                      className="big-input big-number"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value || 0))}
                    />
                  </label>

                  <div style={{ textAlign: "right", fontWeight: 900, fontSize: 20 }}>
                    Total: {money(computeTotal)}
                  </div>
                </div>

                <div
                  className="editor-actions"
                  style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}
                >
                  <button className="btn ghost" onClick={closePriceModal} disabled={savingPrice}>
                    Cancel
                  </button>
                  <button className="btn" onClick={savePricing} disabled={savingPrice}>
                    {priceMode === "pickup" ? "Confirm Pickup & Save" : "Save Pricing"}
                  </button>
                </div>
              </div>

              {/* RIGHT : HALF-SHEET PAPER INVOICE (to capture) */}
              <div ref={invoiceScrollRef} className="invoice-panel">
                <div style={{ position: isNarrow ? "static" : "sticky", top: 8 }}>
                  <div
                    ref={invoiceCaptureRef}
                    id="invoice-half-sheet"
                    className="invoice-box"
                    style={{
                      position: "relative",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 6px 28px rgba(2,6,23,0.08)",
                      borderRadius: 8,
                      overflow: "hidden",
                      fontFamily:
                        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'",
                    }}
                  >
                    {/* Letterhead */}
                    <div style={{ padding: "14px 16px", borderBottom: "2px solid #111827" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: "#e5f7eb",
                            display: "grid",
                            placeItems: "center",
                            color: "#16a34a",
                            fontWeight: 900,
                            fontSize: 18,
                          }}
                          title="Saka Laundry"
                        >
                          S
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.2 }}>
                            SAKA LAUNDRY SOLUTIONS
                          </div>
                          <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>
                            1st Floor, Indian Bank Building, Kokila Center, Bhaskar Nagar Rd,
Bhanugudi Junction, Kakinada, Andhra Pradesh 533003
                          </div>
                          <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>
                            📞 9121991113 • ✉️ sakafreshwash@gmail.com
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 22,
                              fontWeight: 900,
                              color: "#111827",
                              letterSpacing: 1.2,
                              textTransform: "uppercase",
                            }}
                          >
                            INVOICE
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                            No: <b>{activeOrder?.orderNumber ?? "-"}</b>
                            <br />
                            {(() => {
                              const d = new Date(activeOrder?.createdAt || Date.now());
                              const dd = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                              const tt = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
                              return (
                                <>
                                  Date: <b>{dd}</b>
                                  <br />
                                  Time: <b>{tt}</b>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bill To */}
                    <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Bill To</div>
                        <div style={{ fontWeight: 800, fontSize: 16, marginTop: 4 }}>
                          {activeOrder?.userId?.name || "Customer"}
                        </div>
                        <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
                          {activeOrder?.phone || activeOrder?.userId?.phone
                            ? `📞 ${activeOrder?.phone || activeOrder?.userId?.phone}`
                            : ""}
                        </div>
                        <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
                          {activeOrder?.pickupAddress ? `📍 ${activeOrder.pickupAddress}` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 12, color: "#374151" }}>
                        <div>
                          Delivery: <b style={{ textTransform: "capitalize" }}>{activeOrder?.delivery || "regular"}</b>
                        </div>
                        <div>
                          Pickup Date: <b>{activeOrder?.pickupDate || "-"}</b>
                        </div>
                        <div>
                          Pickup Time: <b>{activeOrder?.pickupTime || "-"}</b>
                        </div>
                        <div>
                          Status: <b>{activeOrder?.status || "-"}</b>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ padding: "0 16px 10px" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "separate",
                          borderSpacing: 0,
                          fontSize: 13,
                          color: "#111827",
                        }}
                      >
                        <thead>
                          <tr>
                            {["#", "Service", "Item", "Qty", "Unit", "Rate", "Amount"].map((h, i) => (
                              <th
                                key={h}
                                style={{
                                  textAlign: i === 0 ? "left" : i >= 5 ? "right" : "left",
                                  background: "#f3f4f6",
                                  color: "#111827",
                                  padding: "8px 8px",
                                  borderTop: "1px solid #111827",
                                  borderBottom: "1px solid #111827",
                                  ...(i === 0 ? { borderLeft: "1px solid #111827", borderTopLeftRadius: 4 } : {}),
                                  ...(i === 6 ? { borderRight: "1px solid #111827", borderTopRightRadius: 4 } : {}),
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(items?.length ? items : [{ service: "Wash & Iron", item: "Shirt", qty: 1, rate: 50 }]).map(
                            (it, i) => {
                              const qty = Number(it.qty) || 0;
                              const rate = Number(it.rate) || 0;
                              const amt = qty * rate;
                              return (
                                <tr key={i} style={{ background: i % 2 ? "#fff" : "#fafafa" }}>
                                  <td style={{ padding: "8px 8px", borderLeft: "1px solid #e5e7eb" }}>{i + 1}</td>
                                  <td style={{ padding: "8px 8px" }}>{it.service || "-"}</td>
                                  <td style={{ padding: "8px 8px" }}>{it.item || "-"}</td>
                                  <td style={{ padding: "8px 8px" }}>{qty}</td>
                                  <td style={{ padding: "8px 8px" }}>Pcs</td>
                                  <td style={{ padding: "8px 8px", textAlign: "right" }}>{money(rate)}</td>
                                  <td
                                    style={{
                                      padding: "8px 8px",
                                      textAlign: "right",
                                      borderRight: "1px solid #e5e7eb",
                                    }}
                                  >
                                    {money(amt)}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                          <tr>
                            <td colSpan={7} style={{ borderTop: "1px dashed #d1d5db" }} />
                          </tr>
                        </tbody>
                      </table>

                      {/* Totals & Note */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, marginTop: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>Amount in words</div>
                          <div style={{ fontWeight: 600, marginTop: 4 }}>
                            {(() => {
                              const tot = Math.max(0, computeSubtotal - discountAmount + (Number(tax) || 0));
                              return `${toRupeesInWords(Math.round(tot))} Only`;
                            })()}
                          </div>

                          <div style={{ fontSize: 12, color: "#374151", marginTop: 12 }}>
                            Thank you for choosing Saka Laundry. Please check items at the time of delivery.
                          </div>
                        </div>

                        {/* Summary card */}
                        <div
                          style={{
                            position: "relative",
                            zIndex: 2,
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            overflow: "hidden",
                            paddingRight: 8,
                          }}
                        >
                          <div style={{ background: "#111827", color: "#fff", padding: "8px 10px", fontWeight: 700 }}>
                            Summary
                          </div>
                          <div
                            style={{
                              padding: "10px 10px",
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              rowGap: 6,
                            }}
                          >
                            <div>Sub Total</div>
                            <div style={{ paddingRight: 6 }}>{money(computeSubtotal)}</div>
                            <div>Discount {discountMode === "percent" ? `(${Number(discount || 0)}%)` : ""}</div>
                            <div style={{ paddingRight: 6 }}>{money(discountAmount)}</div>
                            <div>Tax</div>
                            <div style={{ paddingRight: 6 }}>{money(Number(tax || 0))}</div>
                            <div style={{ borderTop: "1px dashed #d1d5db", marginTop: 4 }} />
                            <div style={{ borderTop: "1px dashed #d1d5db", marginTop: 4 }} />
                            <div style={{ fontWeight: 800 }}>Total</div>
                            <div style={{ fontWeight: 800, paddingRight: 6 }}>
                              {money(Math.max(0, computeSubtotal - discountAmount + (Number(tax) || 0)))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer sign + STAMP */}
                    <div
                      style={{
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        position: "relative",
                      }}
                    >
                      {/* STAMP: left side above the generated line */}
                      <img
                        src="/sakastamp.jpg"
                        alt="Saka Laundry Stamp"
                        style={{
                          position: "absolute",
                          left: 60,   // move to left
                          bottom: 42, // sit above "Generated on"
                          width: 96,
                          height: 96,
                          objectFit: "contain",
                          opacity: 0.9,
                          pointerEvents: "none",
                          userSelect: "none",
                          zIndex: 1,
                          mixBlendMode: "multiply",
                          transform: "rotate(-6deg)", // small tilt for real-stamp feel; remove if not needed
                        }}
                      />

                      <div style={{ fontSize: 12, color: "#6b7280", position: "relative", zIndex: 1 }}>
                        Generated on{" "}
                        {(() => {
                          const d = new Date(activeOrder?.createdAt || Date.now());
                          return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
                            d.getHours()
                          )}:${pad(d.getMinutes())}`;
                        })()}
                      </div>

                      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                        <div style={{ width: 160, height: 1, background: "#9ca3af", marginBottom: 6 }} />
                        <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Authorized Signatory</div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons under preview */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      className="btn ghost"
                      style={{ flex: 1 }}
                      onClick={async () => {
                        const blob = await captureInvoiceAsImage();
                        if (!blob) return;
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `invoice_${activeOrder?.orderNumber || "order"}.png`;
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                          URL.revokeObjectURL(url);
                          a.remove();
                        }, 0);
                      }}
                    >
                      ⬇️ PNG
                    </button>
                    <button className="btn" style={{ flex: 1 }} onClick={shareInvoiceOnWhatsApp}>
                      🟢 WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Small utility: number to Indian rupees words (simple round rupees)
   ========================================================================= */
function toRupeesInWords(num) {
  if (!Number.isFinite(num)) return "-";
  if (num === 0) return "Zero Rupees";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const u = (n, s) => {
    let str = "";
    if (n > 19) str += b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    else str += a[n];
    return str ? str + (s ? " " + s : "") : "";
  };
  const crore = Math.floor(num / 10000000);
  num = num % 10000000;
  const lakh = Math.floor(num / 100000);
  num = num % 100000;
  const thousand = Math.floor(num / 1000);
  num = num % 1000;
  const hundred = Math.floor(num / 100);
  const rest = num % 100;

  let out = "";
  if (crore) out += u(crore, "Crore") + " ";
  if (lakh) out += u(lakh, "Lakh") + " ";
  if (thousand) out += u(thousand, "Thousand") + " ";
  if (hundred) out += u(hundred, "Hundred") + " ";
  if (rest) out += (out !== "" ? "and " : "") + u(rest, "");
  return out.trim() + " Rupees";
}
