// src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import { Doughnut, Bar, Line } from "react-chartjs-2";
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
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement
);

const STATUSES = ["Pending", "In Progress", "Completed"];
const SERVICES = ["Wash and Fold","Wash and Iron","Iron","Dry Clean"];

// 🌈 palette
const statusColors = ["#f59e0b", "#06b6d4", "#22c55e"]; // pending, progress, done
const serviceColors = [
  "rgba(37,99,235,0.8)",
  "rgba(96,165,250,0.8)",
  "rgba(244,114,182,0.8)",
  "rgba(251,146,60,0.8)",
];

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
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
  useEffect(()=>{ load(); }, []);

  const totals = useMemo(() => {
    const t = { total: orders.length, pending: 0, progress: 0, done: 0 };
    orders.forEach(o => {
      if (o.status === "Pending") t.pending++;
      else if (o.status === "In Progress") t.progress++;
      else if (o.status === "Completed") t.done++;
    });
    return t;
  }, [orders]);

  const statusCounts = useMemo(
    () => STATUSES.map(s => orders.filter(o => o.status === s).length),
    [orders]
  );

  const serviceCounts = useMemo(
    () => SERVICES.map(s => orders.filter(o => o.service === s).length),
    [orders]
  );

  // 🗓️ Build last 14 days labels and counts from createdAt
  const { labels14, counts14 } = useMemo(() => {
    // labels like 2025-08-11 .. 2025-08-24
    const labels = [];
    const countsMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      labels.push(key);
      countsMap[key] = 0;
    }
    orders.forEach(o => {
      if (!o.createdAt) return;
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (key in countsMap) countsMap[key] += 1;
    });
    return { labels14: labels, counts14: labels.map(k => countsMap[k]) };
  }, [orders]);

  const setStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      await load();
    } finally {
      setUpdatingId(null);
    }
  };

  // 📊 Doughnut (status)
  const doughnutData = {
    labels: STATUSES,
    datasets: [{ data: statusCounts, backgroundColor: statusColors, borderWidth: 0 }],
  };
  const doughnutOptions = {
    cutout: "60%",
    plugins: {
      legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle" } },
      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}` } },
    },
  };

  // 📊 Bar (services)
  const barData = {
    labels: SERVICES,
    datasets: [{
      label: "Orders",
      data: serviceCounts,
      backgroundColor: serviceColors,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };
  const barOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.raw} orders` } },
    },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
  };

  // 📈 Line (last 14 days)
  const lineData = {
    labels: labels14,
    datasets: [{
      label: "Orders per day",
      data: counts14,
      fill: false,
      borderColor: "#2563eb",
      backgroundColor: "#60a5fa",
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  };
  const lineOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  return (
    <div className="container">
      <h2 className="section-title">Admin Dashboard</h2>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi kpi-blue">
          <div className="kpi-title">Total Orders</div>
          <div className="kpi-value">{totals.total}</div>
        </div>
        <div className="kpi kpi-amber">
          <div className="kpi-title">Pending</div>
          <div className="kpi-value">{totals.pending}</div>
        </div>
        <div className="kpi kpi-cyan">
          <div className="kpi-title">In Progress</div>
          <div className="kpi-value">{totals.progress}</div>
        </div>
        <div className="kpi kpi-green">
          <div className="kpi-title">Completed</div>
          <div className="kpi-value">{totals.done}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))"}}>
        <div className="card">
          <div style={{fontWeight:700, marginBottom:10}}>Orders by Status</div>
          <div className="chart-wrap"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
        </div>

        <div className="card">
          <div style={{fontWeight:700, marginBottom:10}}>Orders by Service</div>
          <div className="chart-wrap"><Bar data={barData} options={barOptions} /></div>
        </div>

        <div className="card">
          <div style={{fontWeight:700, marginBottom:10}}>Orders over last 14 days</div>
          <div className="chart-wrap"><Line data={lineData} options={lineOptions} /></div>
        </div>
      </div>

      {/* List */}
      <div className="card" style={{marginTop:16}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{fontWeight:700}}>All Orders</div>
          <button className="btn ghost" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {error && <div style={{color:"crimson", marginTop:8}}>❌ {error}</div>}
        {!loading && orders.length === 0 && <div className="helper">No orders found.</div>}

        <div className="grid" style={{marginTop:12, gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))"}}>
          {orders.map(o=>(
            <div key={o._id} className="card">
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div><b>{o.service}</b></div>
                <span
                  className={
                    o.status==="Completed" ? "badge done" :
                    o.status==="In Progress" ? "badge progress" : "badge pending"
                  }
                >
                  {o.status}
                </span>
              </div>
              <div className="helper">{o.userId?.name} ({o.userId?.email})</div>
              {o.pickupAddress && <div className="helper">{o.pickupAddress}</div>}
              {o.phone && <div className="helper">{o.phone}</div>}
              {o.notes && <div className="helper">“{o.notes}”</div>}

              <div className="stack" style={{marginTop:10}}>
                {STATUSES.map(s=>(
                  <button
                    className={`btn ${s===o.status ? "" : "ghost"}`}
                    key={s}
                    onClick={()=>setStatus(o._id, s)}
                    disabled={updatingId===o._id || s===o.status}
                  >
                    {updatingId===o._id && s!==o.status ? "Updating…" : s}
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
