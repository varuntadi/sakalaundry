// client/src/pages/Orders.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import api from "../api";
import "../styles/orders.css";

/* CONFIG */
const APP_NAME = "Saka Laundry";
const SUPPORT_WHATSAPP = "+91 91219 91113";
const SUPPORT_PHONE = "+91 95156 64446";
const services = ["Wash and Fold", "Wash and Iron", "Iron", "Dry Clean", "Others"];
const payments = [
  { id: "cash", label: "Cash on pickup" },
  { id: "upi", label: "UPI (Pay on pickup)" },
  { id: "card", label: "Card (Pay on pickup)" },
];
const onlyDigits = (s = "") => String(s || "").replace(/\D/g, "");

/* helpers */
function buildWAUrl({ phone, text }) {
  const p = onlyDigits(phone || "");
  const q = encodeURIComponent(text || "");
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  if (!p) return `https://api.whatsapp.com/send?text=${q}`;
  return isMobile ? `whatsapp://send?phone=${p}&text=${q}` : `https://api.whatsapp.com/send?phone=${p}&text=${q}`;
}

/* Floating action buttons */
function FloatingGroup({ phone, text }) {
  const containerStyle = { position: "fixed", right: 12, bottom: 14, zIndex: 9999, display: "flex", flexDirection: "column-reverse", gap: 10, alignItems: "center" };
  const fab = { width: 52, height: 52, borderRadius: 52, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 36px rgba(2,6,23,0.16)", cursor: "pointer" };
  return (
    <div style={containerStyle} aria-hidden>
      <a href={`tel:${onlyDigits(phone)}`} style={{ textDecoration: "none" }}>
        <div style={{ ...fab, background: "#0ea5e9" }} aria-hidden><FaPhoneAlt color="#fff" size={20} /></div>
      </a>
      <a href={buildWAUrl({ phone, text })} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <div style={{ ...fab, background: "#25D366" }} aria-hidden><FaWhatsapp color="#fff" size={22} /></div>
      </a>
    </div>
  );
}

/* Centered small modal (re-usable)
   - small: boolean -> use compact width
   - accessible: ESC closes, focus trap inside modal
*/
function CenterModal({
  open,
  title,
  message,
  acceptText = "OK",
  declineText = "Cancel",
  onAccept,
  onDecline,
  acceptPrimary = true,
  danger = false,
  small = false
}) {
  const modalRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    // wait next tick then focus
    const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [];
    if (focusable.length) focusable[0].focus();
    else modalRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        onDecline?.();
      }
      // simple focus trap: if Tab pressed, wrap around
      if (e.key === "Tab" && modalRef.current) {
        const nodes = Array.from(
          modalRef.current.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ).filter(n => n.offsetParent !== null);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // restore focus
      try { previouslyFocused.current?.focus?.(); } catch(_) {}
    };
  }, [open, onDecline]);

  if (!open) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onDecline} />

      <div
        className={`modal-content${small ? " small" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()} // prevent overlay click when clicking inside
      >
        <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
        <p style={{ marginTop: 12, color: "#374151", lineHeight: 1.45 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
          <button
            onClick={onDecline}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #eee",
              background: "#fff",
              color: danger ? "#c53030" : "#374151",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {declineText}
          </button>
          <button
            onClick={onAccept}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: acceptPrimary ? "#0b78f6" : "#06b6d4",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            {acceptText}
          </button>
        </div>
      </div>
    </>
  );
}

/* Small inline validation tick */
function ValidationTick({ show }) {
  if (!show) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 10 }} aria-hidden>
      <svg viewBox="0 0 36 36" width="28" height="28" aria-hidden>
        <circle cx="18" cy="18" r="16" fill="none" stroke="#16a34a" strokeWidth="2" opacity="0.12" />
        <path d="M10 19.5 L15.5 25 L26 12" fill="none" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: "vt-draw .45s ease forwards" }} />
      </svg>
      <style>{`@keyframes vt-draw { to { stroke-dashoffset: 0; } }`}</style>
    </span>
  );
}

/* Success screen — FULL WHITE SCREEN with zoom tick + falling petals + chime. */
function SuccessScreen({ open, orderNumber, message, onClose }) {
  useEffect(() => {
    if (!open) return;
    // chime
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const g = ctx.createGain(); g.gain.value = 0.00008; g.connect(ctx.destination);

      const osc1 = ctx.createOscillator(); osc1.type = "sine"; osc1.frequency.setValueAtTime(760, now);
      const osc2 = ctx.createOscillator(); osc2.type = "sine"; osc2.frequency.setValueAtTime(980, now + 0.04);

      osc1.connect(g); osc2.connect(g);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.start(now); osc2.start(now + 0.04);
      osc1.stop(now + 1.2); osc2.stop(now + 1.2);
    } catch (e) { /* ignore audio errors */ }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 20000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const petals = Array.from({ length: 30 }).map((_, i) => {
    const left = Math.round(Math.random() * 96) + 2;
    const size = 8 + Math.round(Math.random() * 20);
    const delay = (Math.random() * 1.6).toFixed(2);
    const dur = (3 + Math.random() * 4).toFixed(2);
    const rot = Math.round(Math.random() * 360);
    const colors = ["#FDE68A","#F97316","#FB7185","#60A5FA","#34D399"];
    return { i, left, size, delay, dur, rot, color: colors[Math.floor(Math.random()*colors.length)] };
  });

  return (
    <div role="status" aria-live="polite" className="success-screen">
      {petals.map(p => (
        <div key={p.i} className="petal" style={{
          left: p.left + "%",
          width: p.size,
          height: Math.round(p.size * 0.66),
          background: p.color,
          transform: `rotate(${p.rot}deg)`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.dur}s`
        }} />
      ))}

      <div className="success-inner">
        <div className="tick-zoom" aria-hidden>
          <svg viewBox="0 0 120 120" width="130" height="130" aria-hidden>
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0" stopColor="#16a34a" />
                <stop offset="1" stopColor="#059669" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="56" fill="rgba(6,95,70,0.06)" />
            <circle cx="60" cy="60" r="46" fill="#ffffff" />
            <path d="M36 62 L52 78 L86 40" stroke="url(#g1)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="title">Pickup confirmed</div>
        <div className="subtitle">{message || `Your pickup booking is placed. Our agent will reach you shortly.`}</div>
        <div className="orderid">Your order ID is #{orderNumber ?? "—"}</div>
        <div className="quote">“Have a great day — thanks for choosing Saka Laundry!”</div>

        <div>
          <button className="btn primary success-close" onClick={onClose}>Go back</button>
        </div>
      </div>
    </div>
  );
}

/* Dropdown used in the form */
function DropdownList({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-select" aria-label="Select">
      {options.map(o => <option key={o.id ?? o} value={o.id ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

/* Main Orders component */
export default function Orders() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width:700px)");
    const update = () => setIsMobile(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update); else mq.addListener(update);
    return () => { try { mq.removeEventListener("change", update); } catch { mq.removeListener(update); } };
  }, []);

  const [form, setForm] = useState({
    service: services[0],
    pickupAddress: "",
    phone: "",
    notes: "",
    lat: null, lng: null,
    pickupDate: "",
    delivery: "regular",
    payment: payments[0].id,
  });

  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [expressConfirmOpen, setExpressConfirmOpen] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationText, setValidationText] = useState("");
  const [confirmSheetOpen, setConfirmSheetOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState({});
  const formRef = useRef(null);

  const [validationPassed, setValidationPassed] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async function load() {
      setLoading(true);
      try {
        const res = await api.get("/orders");
        if (!cancelled) setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!cancelled) { setErr("Failed to load orders"); setTimeout(()=>setErr(""),2200); }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDeliveryChange = (value) => {
    if (value === "express") { setExpressConfirmOpen(true); return; }
    setForm(f => ({ ...f, delivery: "regular" }));
  };

  const acceptExpress = () => { setForm(f => ({ ...f, delivery: "express" })); setExpressConfirmOpen(false); setMsg("Express selected — extra cost depends on order."); setTimeout(()=>setMsg(""),3200); };
  const declineExpress = () => { setForm(f => ({ ...f, delivery: "regular" })); setExpressConfirmOpen(false); setMsg("Kept regular delivery."); setTimeout(()=>setMsg(""),2200); };

  const requestAutoFetch = () => {
    if (!("geolocation" in navigator)) { setErr("This browser doesn't support location."); setTimeout(()=>setErr(""),2000); return; }
    setMsg("Fetching location...");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          if (r.ok) { const j = await r.json(); if (j?.display_name) address = j.display_name; }
        } catch {}
        setForm(f => ({ ...f, pickupAddress: address, lat, lng }));
        setMsg("Location added"); setTimeout(()=>setMsg(""),1800);
      } catch (e) { setErr("Could not fetch address"); setTimeout(()=>setErr(""),1800); }
    }, (err) => { setErr(err.code === err.PERMISSION_DENIED ? "Please enable location access." : "Location error: " + err.message); setTimeout(()=>setErr(""),2500); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const openConfirmSheet = (e) => { if (e) e.preventDefault(); setConfirmSheetOpen(true); };
  const closeConfirmSheet = () => setConfirmSheetOpen(false);

  const validateFields = () => {
    const phoneDigits = onlyDigits(form.phone);
    if (!phoneDigits || phoneDigits.length < 7) { setValidationText("Please provide a valid phone number."); setValidationOpen(true); return false; }
    if (!form.pickupAddress) { setValidationText("Pickup address is required."); setValidationOpen(true); return false; }
    if (!form.pickupDate) { setValidationText("Please select a pickup date."); setValidationOpen(true); return false; }
    return true;
  };

  const performCreate = async () => {
    setConfirmSheetOpen(false); setErr(""); setMsg("");
    if (!validateFields()) return;
    setValidationPassed(true);
    setTimeout(async () => {
      setValidationPassed(false);
      setCreating(true);
      try {
        const payload = { ...form, phone: onlyDigits(form.phone) };
        const res = await api.post("/orders", payload);
        const created = res.data;
        setOrders(prev => [created, ...prev]);
        setSuccessData({ orderNumber: created.orderNumber ?? created._1d, details: created });
        setSuccessOpen(true);
        setForm({ service: services[0], pickupAddress: "", phone: "", notes: "", lat: null, lng: null, pickupDate: "", delivery: "regular", payment: payments[0].id });
        if (isMobile && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) { setErr(e?.response?.data?.error || e?.message || "Failed to create order"); setTimeout(() => setErr(""), 3200); } finally { setCreating(false); }
    }, 420);
  };

  const quickMsg = (f) => `Hi! I'd like to schedule a pickup.\nService: ${f.service}\nPickup address: ${f.pickupAddress || "-"}\nPickup: ${f.pickupDate || "-"}\nPhone: ${onlyDigits(f.phone) || "-"}\nDelivery: ${f.delivery}\nPayment: ${f.payment}`;

  const containerStyle = isMobile ? { maxWidth: 520, margin: "6px auto", padding: "6px 12px" } : { maxWidth: 980, margin: "14px auto", padding: 12 };
  const labelStyle = { display: "block", marginBottom: 6, fontWeight: 700 };
  const inputStyle = { width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #eef6fb", background: "#fff" };

  return (
    <div className="container orders-page" style={containerStyle} ref={formRef}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0b78f6" }}>BOOK PICKUP</h2>
      </div>

      <div className="card form-card" style={{ padding: isMobile ? 12 : 14, marginBottom: 14 }}>
        <form onSubmit={(e) => { e.preventDefault(); openConfirmSheet(e); }}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Service</label>
            <DropdownList value={form.service} onChange={(v) => setForm(f => ({ ...f, service: v }))} options={services.map(s => ({ id: s, label: s }))} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Pickup address</label>
            <input style={inputStyle} placeholder="Flat 301, MG Road, Indore" value={form.pickupAddress} onChange={(e) => setForm(f => ({ ...f, pickupAddress: e.target.value }))} />
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn ghost" onClick={requestAutoFetch} style={{ padding: "8px 10px", borderRadius: 8 }}>🔄 Auto-fetch</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Pickup date</label>
              <input type="date" style={inputStyle} value={form.pickupDate} onChange={(e) => setForm(f => ({ ...f, pickupDate: e.target.value }))} min={new Date().toISOString().slice(0,10)} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} placeholder="Enter your mobile number" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Notes</label>
            <input style={inputStyle} placeholder="Any special handling?" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Delivery type</label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input type="radio" name="delivery" value="regular" checked={form.delivery === "regular"} onChange={() => handleDeliveryChange("regular")} /> Regular
              </label>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input type="radio" name="delivery" value="express" checked={form.delivery === "express"} onChange={() => handleDeliveryChange("express")} /> Express
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Payment</label>
            <DropdownList options={payments} value={form.payment} onChange={(v) => setForm(f => ({ ...f, payment: v }))} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
            <button type="submit" className="btn primary dark" style={{ flex: 1, padding: "10px 12px", fontWeight: 800 }} disabled={creating}>{creating ? 'Creating...' : 'BOOK PICKUP'}</button>
            <ValidationTick show={validationPassed} />
            <a className="btn wa" href={buildWAUrl({ phone: SUPPORT_WHATSAPP, text: quickMsg(form) })} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", padding: "8px 12px" }}>
              <FaWhatsapp color="#fff" size={14} style={{ marginRight: 8 }} /> Message
            </a>
          </div>

          <div style={{ marginTop: 10 }}>
            {msg && <div className="alert success">{msg}</div>}
            {err && <div className="alert warning">{err}</div>}
          </div>
        </form>
      </div>

      {loading && <div className="card order" style={{ padding: isMobile ? 8 : 12 }}>Loading…</div>}

      {/* Express confirm uses animated centered modal with blur backdrop */}
      <CenterModal
        open={expressConfirmOpen}
        title="Express delivery — confirm"
        message={`Express is faster. Extra cost will depend on your order. Proceed with Express?`}
        acceptText="Proceed"
        declineText="No, keep regular"
        onAccept={acceptExpress}
        onDecline={declineExpress}
      />

      {/* validation modal - use small to keep it compact and centered */}
      <CenterModal
        open={validationOpen}
        title="Required"
        message={validationText}
        acceptText="OK"
        declineText="Cancel"
        onAccept={() => setValidationOpen(false)}
        onDecline={() => setValidationOpen(false)}
        danger
        small
      />

      {/* Confirm pickup modal (centered) */}
      {confirmSheetOpen && (
        <>
          <div className="modal-overlay" onClick={closeConfirmSheet} />
          <div className="modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Confirm pickup</strong>
              <button onClick={closeConfirmSheet} style={{ background: "transparent", border: "none", fontWeight: 700 }}>✕</button>
            </div>
            <div style={{ marginTop: 12, color: "#374151" }}>
              <div><strong>Service:</strong> {form.service}</div>
              <div style={{ marginTop: 6 }}><strong>Pickup:</strong> {form.pickupDate || "-"}</div>
              <div style={{ marginTop: 6 }}><strong>Address:</strong> {form.pickupAddress || "-"}</div>
              <div style={{ marginTop: 6 }}><strong>Delivery:</strong> {form.delivery}</div>
              <div style={{ marginTop: 6 }}><strong>Payment:</strong> {payments.find(p => p.id === form.payment)?.label || form.payment}</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={closeConfirmSheet} style={{ flex: 1, padding: "10px 12px", borderRadius: 8 }}>Cancel</button>
              <button onClick={performCreate} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#0b78f6", color: "#fff", fontWeight: 800 }} disabled={creating}>{creating ? 'Creating...' : 'Confirm'}</button>
            </div>
          </div>
        </>
      )}

      {/* Full-screen success (20s) */}
      <SuccessScreen
        open={successOpen}
        orderNumber={successData.orderNumber}
        message={`Your pickup booking (Order #${successData.orderNumber ?? ""}) is placed. Our agent will reach you shortly.`}
        onClose={() => { setSuccessOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />

      <FloatingGroup phone={SUPPORT_PHONE} text={quickMsg(form)} />
    </div>
  );
}
