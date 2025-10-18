// client/src/pages/Prices.jsx
import React, { useEffect, useMemo, useState } from "react";
import PRICES from "../assets/prices"; // default export with your categories
import "../styles/prices.css";

/* ----------------- helpers ----------------- */

// Turn any raw value into display text with ₹, handling "-", numbers, "29+", "20 & 25", etc.
function formatPrice(v) {
  if (v === undefined || v === null) return "-";
  const s = String(v).trim();
  if (!s || s === "-") return "-";
  // If it already looks like a rupee string, keep it; otherwise prefix ₹
  return s.startsWith("₹") ? s : `₹${s}`;
}

// Map various possible keys from prices.js into { steam, wash, dry }
function normalizePrices(pricesObj = {}) {
  const out = { steam: "-", wash: "-", dry: "-" };

  const keyMap = {
    steam: ["steam iron", "steam", "steamiron"],
    wash: [
      "wash iron",
      "wash & iron",
      "wash and iron",
      "washiron",
      "wash",
      "wash n iron",
    ],
    dry: ["dry clean", "dryclean", "dry cleaning", "dry"],
  };

  for (const [rawKey, rawVal] of Object.entries(pricesObj)) {
    const k = String(rawKey).trim().toLowerCase();
    if (keyMap.steam.some((a) => k === a)) out.steam = formatPrice(rawVal);
    else if (keyMap.wash.some((a) => k === a)) out.wash = formatPrice(rawVal);
    else if (keyMap.dry.some((a) => k === a)) out.dry = formatPrice(rawVal);
    // Unknown keys are ignored gracefully
  }

  // Ensure formatted strings even if missing in data
  out.steam = formatPrice(out.steam);
  out.wash = formatPrice(out.wash);
  out.dry = formatPrice(out.dry);

  return out;
}

/* ---------- HERO (matches your reference) ---------- */
const Hero = () => (
  <header className="hero-section">
    <div className="hero-left">
      <p className="hero-question">
        Looking for the <br />
        <strong>Best Laundry &amp; Dry Cleaning Shop in Kakinada?</strong>
      </p>
    </div>

    <div className="hero-right">
      <h2 className="hero-welcome">Welcome to</h2>
      <h1 className="hero-brand">SAKA Laundry</h1>
      <h3 className="hero-sub">
        EXPLORE DRY CLEANING &amp; LAUNDRY PRICES AT YOUR LOCATION IN KAKINADA
      </h3>
      <div className="hero-underline" />
    </div>
  </header>
);

/* ---------- price card/grid ---------- */
function PriceCard({ item, index = 0 }) {
  const { name, prices = {} } = item;
  const p = normalizePrices(prices);

  return (
    <div className="price-card reveal" style={{ "--i": index }}>
      <h3>{name}</h3>

      <div className="price-row">
        <span>STEAM IRON</span>
        <span className="dots" />
        <span className="amount">{p.steam}</span>
      </div>

      <div className="price-row">
        <span>WASH AND IRON</span>
        <span className="dots" />
        <span className="amount">{p.wash}</span>
      </div>

      <div className="price-row">
        <span>DRY CLEAN</span>
        <span className="dots" />
        <span className="amount">{p.dry}</span>
      </div>
    </div>
  );
}

function Grid({ items }) {
  return (
    <div className="card-grid">
      {items.map((it, idx) => (
        <PriceCard key={`${it.name}-${idx}`} item={it} index={idx} />
      ))}
    </div>
  );
}

/* ---------- Mobile accordion ---------- */
function AccordionSection({ title, items, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`acc-item ${open ? "open" : ""}`}>
      <button className="acc-header" onClick={() => setOpen((o) => !o)}>
        <span className="acc-title">{title}</span>
        <span className="acc-right" aria-hidden>
          <svg
            className="chev"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      <div className="acc-body">
        <Grid items={items} />
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Prices() {
  const categories = useMemo(() => Object.keys(PRICES || {}), []);
  const [active, setActive] = useState(categories[0] || "MEN");
  const [q, setQ] = useState("");

  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia("(max-width: 768px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // reveal-on-scroll
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  // filter
  const filtered = useMemo(() => {
    const find = (arr) =>
      (arr || []).filter((it) =>
        (it.name || "").toLowerCase().includes(q.trim().toLowerCase())
      );
    if (isMobile) {
      const obj = {};
      for (const c of categories) obj[c] = find(PRICES[c]);
      return obj;
    }
    return find(PRICES[active] || []);
  }, [q, isMobile, active, categories]);

  /* ---------- render ---------- */
  if (isMobile) {
    return (
      <div className="price-container">
        <Hero />

        <div className="price-content">
          <input
            className="search-box mb16"
            placeholder="Search items…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="accordion">
            {categories.map((cat, i) => (
              <AccordionSection
                key={cat}
                title={pretty(cat)}
                items={filtered[cat] || []}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // desktop
  return (
    <div className="price-container">
      <aside className="price-sidebar">
        <input
          className="search-box"
          placeholder="Search items…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="category-list">
          {categories.map((cat) => (
            <li
              key={cat}
              className={active === cat ? "active" : ""}
              onClick={() => setActive(cat)}
            >
              {pretty(cat)}
            </li>
          ))}
        </ul>
      </aside>

      <section className="price-content">
        <Hero />
        <h2 className="category-title">{pretty(active)}</h2>
        <Grid items={filtered} />
      </section>
    </div>
  );
}

function pretty(s) {
  return (s || "")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
