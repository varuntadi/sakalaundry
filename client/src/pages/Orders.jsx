import React, { useEffect, useState } from "react";
import api from "../api";

/** ================== CONFIG — EDIT THESE ================== **/
const APP_NAME         = "Saka Laundry";
const LOGO_SRC         = "/img/sakalogo.jpg";      // file in /public/img/...
const SUPPORT_WHATSAPP = "+91 91219 91113";        // WhatsApp / Business
const SUPPORT_PHONE    = "+91 95156 64446";        // Call number
/** ========================================================= **/

const services = ["Wash and Fold", "Wash and Iron", "Iron", "Dry Clean"];

/* ---------- small helpers/components ---------- */
function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const cls = s.includes("progress")
    ? "badge progress"
    : s.includes("complete")
    ? "badge done"
    : "badge pending";
  return <span className={cls}>{status}</span>;
}

/* ====== WhatsApp: robust link + fallback ====== */
const onlyDigits = (s = "") => s.replace(/\D/g, "");

const mapsLink = (lat, lng, addr = "") =>
  lat && lng
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : addr
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`
    : "#";

function buildWAUrl({ phone, text }) {
  const p = onlyDigits(phone);
  const q = encodeURIComponent(text || "");
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  if (isMobile) return `whatsapp://send?phone=${p}&text=${q}`;
  return `https://api.whatsapp.com/send?phone=${p}&text=${q}`;
}

function WhatsAppButton({ phone, text, label = "Chat on WhatsApp", className = "" }) {
  const href = buildWAUrl({ phone, text });

  const onClick = () => {
    // fallback for some desktops if deep link didn't switch focus
    setTimeout(() => {
      if (document.hidden === false) {
        window.open(`https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(text || "")}`, "_blank");
      }
    }, 1200);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn ${className}`}
      style={{ background: "#7fb800", color: "#fff", border: "none", borderRadius: 9999 }}
      aria-label="Chat on WhatsApp"
    >
      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M19.11 17.28c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.62.14-.19.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.35-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.06-.22-.53-.45-.46-.62-.47l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.99 2.66 1.13 2.85c.14.18 1.95 2.98 4.73 4.18.66.28 1.17.45 1.57.58.66.21 1.26.18 1.73.11.53-.08 1.6-.65 1.83-1.27.23-.62.23-1.15.16-1.27-.07-.12-.25-.2-.52-.34z" fill="currentColor"/>
          <path d="M27.1 4.9C24.2 2 20.4.5 16.4.5S8.6 2 5.7 4.9C2.8 7.8 1.3 11.6 1.3 15.6c0 3 .9 5.8 2.7 8.2L2 31.5l7-1.8c2.3 1.3 4.8 1.9 7.4 1.9 4 0 7.8-1.5 10.7-4.4 2.9-2.9 4.4-6.7 4.4-10.7 0-4-1.5-7.8-4.4-10.7zM16.4 28.1c-2.3 0-4.6-.6-6.6-1.7l-.47-.27-4.14 1.06 1.11-4.03-.3-.5c-1.7-2.3-2.6-5-2.6-7.8 0-7.3 6-13.3 13.3-13.3s13.3 6 13.3 13.3-6 13.3-13.3 13.3z" fill="currentColor"/>
        </svg>
        <span>{label}</span>
      </span>
    </a>
  );
}

function FloatingWhatsApp({ phone, text }) {
  const href = buildWAUrl({ phone, text });
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      style={{
        position: "fixed",
        right: 16,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#16a34a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 20px rgba(0,0,0,.15)",
        zIndex: 50
      }}
    >
      <svg width="26" height="26" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.28c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.62.14-.19.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.35-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.06-.22-.53-.45-.46-.62-.47l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.99 2.66 1.13 2.85c.14.18 1.95 2.98 4.73 4.18.66.28 1.17.45 1.57.58.66.21 1.26.18 1.73.11.53-.08 1.6-.65 1.83-1.27.23-.62.23-1.15.16-1.27-.07-.12-.25-.2-.52-.34z"/>
        <path d="M27.1 4.9C24.2 2 20.4.5 16.4.5S8.6 2 5.7 4.9C2.8 7.8 1.3 11.6 1.3 15.6c0 3 .9 5.8 2.7 8.2L2 31.5l7-1.8c2.3 1.3 4.8 1.9 7.4 1.9 4 0 7.8-1.5 10.7-4.4 2.9-2.9 4.4-6.7 4.4-10.7 0-4-1.5-7.8-4.4-10.7z"/>
      </svg>
    </a>
  );
}

/* ====== Geolocation + Reverse Geocoding ====== */
async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "saka-app/1.0" },
  });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  return res.json();
}

async function autoFetchLocation(setForm, setErr, setMsg) {
  if (!("geolocation" in navigator)) {
    setErr("❌ This browser does not support location.");
    return;
  }

  if (navigator.permissions) {
    try {
      const perm = await navigator.permissions.query({ name: "geolocation" });
      if (perm.state === "denied") {
        setErr("📍 Location access is blocked. Click the 🔒 icon → Site Settings → Allow Location, then reload.");
        return;
      }
    } catch {}
  }

  setMsg("📍 Fetching your location...");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
        try {
          const data = await reverseGeocode(lat, lng);
          address = data.display_name || address;
        } catch {}
        setForm((f) => ({ ...f, pickupAddress: address, lat, lng }));
        setMsg("✅ Location added");
      } catch {
        setErr("❌ Could not fetch address");
      }
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        setErr("📍 Please enable location access in browser settings (click the 🔒 icon).");
      } else {
        setErr("❌ Location error: " + err.message);
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

/* ------------------------- PAGE ------------------------- */
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    service: services[0],
    pickupAddress: "",
    phone: "",
    notes: "",
    lat: null,
    lng: null,
  });

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/orders");
      setOrders(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createOrder = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      const payload = { ...form, phone: onlyDigits(form.phone) }; // normalize phone
      await api.post("/orders", payload);
      setMsg("✅ Order created!");
      setForm({ service: services[0], pickupAddress: "", phone: "", notes: "", lat: null, lng: null });
      load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to create order");
    }
  };

  const cancelOrder = async (id) => {
    try { await api.delete(`/orders/${id}`); load(); }
    catch (e) { setErr(e?.response?.data?.error || "Failed to cancel order"); }
  };

  // Prefilled WA message from current form inputs
  const quickMsg =
    `Hi! I'd like to schedule a free pickup.\n` +
    `Service: ${form.service}\n` +
    `Pickup address: ${form.pickupAddress || "-"}\n` +
    (form.lat && form.lng ? `Location: ${form.lat}, ${form.lng}\n` : "") +
    `Phone: ${onlyDigits(form.phone) || "-"}\n` +
    (form.notes ? `Notes: ${form.notes}\n` : "");

  return (
    <div className="container">
      {/* ---------- TOP ---------- */}
      <div className="card" style={{
          marginBottom: 16, padding: "18px 20px", display: "flex",
          alignItems: "center", gap: 12, justifyContent: "center",
          background:"linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.85))"
        }}>
        <img src={LOGO_SRC} alt={`${APP_NAME} logo`}
          style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }}
          onError={(e)=>{ e.currentTarget.style.visibility="hidden"; }}
        />
        <h2 className="section-title" style={{ margin: 0 }}>{APP_NAME} — My Orders</h2>
      </div>

      {/* ---------- FORM ---------- */}
      <div className="card" style={{ marginBottom: 16 }}>
        <form id="create-order-form" className="form" onSubmit={createOrder}>
          <div>
            <label>Service</label>
            <select name="service" value={form.service} onChange={onChange}>
              {services.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label>Pickup address</label>
            <input
              name="pickupAddress"
              placeholder="Flat 301, MG Road, Indore"
              value={form.pickupAddress}
              onChange={onChange}
            />
            {/* Auto-fetch location bar */}
            <div onClick={() => autoFetchLocation(setForm, setErr, setMsg)}
              style={{ marginTop: 6, padding: "10px", textAlign: "center",
                background: "#f1f5f9", borderRadius: 6, cursor: "pointer",
                fontWeight: 600, color: "#0369a1" }}>
              🔄 Auto-fetch my location
            </div>

            {(form.lat && form.lng) && (
              <div className="helper" style={{ marginTop: 4, display:"flex", gap:8, alignItems:"center" }}>
                <span>📍 {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span>
                <a
                  href={mapsLink(form.lat, form.lng, form.pickupAddress)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn ghost"
                  style={{ padding:"4px 8px", borderRadius:8 }}
                >
                  Open in Maps
                </a>
              </div>
            )}
          </div>

          <div>
            <label>Phone</label>
            <input name="phone" placeholder="9876543210"
              value={form.phone} onChange={onChange} />
          </div>

          <div>
            <label>Notes</label>
            <input name="notes" placeholder="Any special handling?"
              value={form.notes} onChange={onChange} />
          </div>

          <div className="stack" style={{ alignItems: "center", gap: 10 }}>
            <button className="btn" type="submit">Create Order</button>
            <WhatsAppButton phone={SUPPORT_WHATSAPP} text={quickMsg} label="Chat on WhatsApp" className="ghost" />
            {msg && <span className="helper">{msg}</span>}
            {err && <span className="helper" style={{ color: "var(--bad)" }}>{err}</span>}
          </div>
        </form>
      </div>

      {loading && <div className="card">Loading…</div>}
      {!loading && orders.length === 0 && <div className="card">No orders yet.</div>}

      {/* ---------- ORDERS ---------- */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
        {orders.map((o) => (
          <div key={o._id} className="card">
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div style={{ fontWeight:700 }}>{o.service}</div>
              <StatusBadge status={o.status} />
            </div>
            {o.pickupAddress && <div className="helper" style={{ marginTop:6 }}>{o.pickupAddress}</div>}
            {o.lat && o.lng && (
              <div className="helper" style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span>📍 {Number(o.lat).toFixed(5)}, {Number(o.lng).toFixed(5)}</span>
                <a
                  href={mapsLink(o.lat, o.lng, o.pickupAddress)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn ghost"
                  style={{ padding:"2px 8px", borderRadius:8 }}
                >
                  Map
                </a>
              </div>
            )}
            {o.phone && <div className="helper">{o.phone}</div>}
            {o.notes && <div className="helper">“{o.notes}”</div>}

            <div className="stack" style={{ marginTop:12 }}>
              <button className="btn ghost" onClick={() => cancelOrder(o._id)}>Cancel</button>
              <WhatsAppButton
                phone={SUPPORT_WHATSAPP}
                label="WhatsApp"
                text={
                  `Hi! Query about my order.\n` +
                  `Order ID: ${o._id}\n` +
                  `Service: ${o.service}\n` +
                  (o.pickupAddress ? `Pickup: ${o.pickupAddress}\n` : "") +
                  (o.lat && o.lng ? `Location: ${o.lat}, ${o.lng}\n` : "") +
                  (o.phone ? `Phone: ${o.phone}\n` : "") +
                  (o.notes ? `Notes: ${o.notes}\n` : "") +
                  (o.status ? `Status: ${o.status}\n` : "")
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Floating bubbles (phone + WhatsApp) ---------- */}
      <a
        href={`tel:${onlyDigits(SUPPORT_PHONE)}`}
        aria-label="Call us"
        style={{
          position: "fixed",
          right: 16,
          bottom: 88,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#1296f3",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 20px rgba(0,0,0,.15)",
          zIndex: 50
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011.1-.23c1.2.49 2.6.76 4 .76a1 1 0 011 1V20a1 1 0 01-1 1C11.3 21 3 12.7 3 2a1 1 0 011-1h3.2a1 1 0 011 1c0 1.4.27 2.8.76 4a1 1 0 01-.23 1.1L6.6 10.8z"/>
        </svg>
      </a>

      {/* use the same prefilled message as the form */}
      <FloatingWhatsApp phone={SUPPORT_WHATSAPP} text={quickMsg} />
    </div>
  );
}
