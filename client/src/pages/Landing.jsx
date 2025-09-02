import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const services = [
  { title: "Wash & Fold", desc: "Everyday laundry neatly folded and fresh.", img: "/services/washandfold.png" },
  { title: "Wash & Iron", desc: "Crisp, ready-to-wear finish.", img: "/services/22.png" },
  { title: "Dry Cleaning", desc: "Delicate care for suits, sarees & formals.", img: "/services/2.png" },
  { title: "Shoe & Leather Care", desc: "Deep clean & condition for shoes/bags.", img: "/services/3.png" },
  { title: "Curtain & Home Linen", desc: "Freshen up curtains, bedsheets & more.", img: "/services/4.png" },
  { title: "Premium Care", desc: "Luxury garments with extra attention.", img: "/services/5.png" },
];

const slides = [
  "/services/washandfold.png",
  "/services/22.png",
  "/services/2.png",
  "/services/4.png",
  "/services/5.png",
];

export default function Landing() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((n) => (n + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Hero with background slideshow */}
      <section
        className="hero-min full-bleed"
        style={{
          position: "relative",
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        {slides.map((src, i) => (
          <div
            key={src + i}
            style={{
              position: "absolute",
              inset: 0,
              background: `url("${src}") center/cover no-repeat`,
              transition: "opacity 900ms ease-in-out",
              opacity: i === idx ? 1 : 0,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.35))",
          }}
        />

        <div
          className="content"
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 800,
            padding: 20,
          }}
        >
          <h1 style={{ fontSize: "clamp(2rem, 1.2rem + 2.5vw, 3rem)", marginBottom: 12 }}>
            Fresh laundry, delivered with style.
          </h1>
          <p style={{ marginBottom: 20, fontSize: "1.1rem", opacity: 0.9 }}>
            Doorstep pickup. Eco-friendly clean. On-time delivery.
            A modern, clutter-free experience you can trust.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" className="btn-primary">Book pickup</Link>
            <Link to="/about" className="btn-outline">How it works</Link>
          </div>
        </div>
      </section>

      {/* Services row */}
      <section className="section" style={{ width: "100%", padding: "40px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            maxWidth: "1200px",
            marginInline: "auto",
            flexWrap: "wrap",
          }}
        >
          <h2 className="section-title" style={{ margin: 0 }}>Services</h2>
          <a href="/order" className="link">View all →</a>
        </div>

        <div
          className="services-row"
          style={{
            display: "flex",
            gap: "20px",
            overflowX: "auto",
            paddingBottom: "10px",
            scrollbarWidth: "none",
          }}
        >
          {services.map((s, i) => (
            <a
              key={i}
              href="/order"
              className="card card-min"
              style={{
                textDecoration: "none",
                color: "inherit",
                flex: "0 0 250px",
                borderRadius: "10px",
                background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
              }}
            >
              <div className="thumb">
                <img src={s.img} alt={s.title} loading="lazy" style={{ width: "100%", borderRadius: "8px 8px 0 0" }} />
              </div>
              <div className="card-body" style={{ padding: "10px" }}>
                <div className="card-title" style={{ fontWeight: "bold" }}>{s.title}</div>
                <div className="card-text" style={{ fontSize: "0.9rem", margin: "6px 0" }}>{s.desc}</div>
                <div className="card-cta">
                  <span className="link" style={{ color: "#007bff" }}>Book now</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Van + Services Info */}
      <section
        className="section"
        style={{
          maxWidth: "1200px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "30px",
            alignItems: "center",
          }}
          className="md:grid-cols-2"
        >
          {/* Left - Van Image */}
          <div style={{ textAlign: "center" }}>
            <img
              src="/services/van.jpg"
              alt="Saka Laundry Van"
              style={{
                width: "100%",
                maxWidth: "400px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                margin: "0 auto",
              }}
            />
          </div>

          {/* Right - Info */}
          <div>
            <h2 style={{ marginBottom: "15px" }}>Fast & Reliable Services</h2>
            <p style={{ marginBottom: "20px", fontSize: "1.05rem", opacity: 0.9 }}>
              Choose the service that fits your needs. Regular for everyday use,
              Express for urgent requirements 🚀
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Regular Service */}
              <div
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <h3 style={{ color: "#2f7cff", marginBottom: "10px" }}>
                  REGULAR SERVICE
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.95rem" }}>
                  <li>✅ Free Pickup & Delivery</li>
                  <li>✅ Laundry in 24 Hrs</li>
                  <li>✅ Dry Clean in 72 Hrs</li>
                  <li>✅ Shoe Cleaning 3–5 Days</li>
                </ul>
              </div>

              {/* Express Service */}
              <div
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <h3 style={{ color: "#e63946", marginBottom: "10px" }}>
                  EXPRESS SERVICE
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.95rem" }}>
                  <li>⚡ 1.5x Extra Charges</li>
                  <li>⚡ Same-day / Next-day</li>
                  <li>⚡ Available in Select Areas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Services */}
      <section
        style={{
          padding: "60px 20px",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ marginBottom: "20px" }}>Our Expert Services</h2>
            <p style={{ marginBottom: "30px" }}>
              From delicate fabrics to premium items, we’ve got you covered.
            </p>
            <ul style={{ listStyle: "none", padding: 0, fontSize: "1rem" }}>
              <li style={{ marginBottom: "15px" }}>🧺 <strong>Laundry:</strong> Wash & Fold | Wash & Iron</li>
              <li style={{ marginBottom: "15px" }}>👔 <strong>Dry Cleaning:</strong> Suits, Sarees, Woollens</li>
              <li style={{ marginBottom: "15px" }}>👟 <strong>Shoe Cleaning:</strong> Restoration & Protection</li>
              <li style={{ marginBottom: "15px" }}>👜 <strong>Leather Care:</strong> Bags, Jackets & Wallets</li>
              <li style={{ marginBottom: "15px" }}>🪟 <strong>Curtain Cleaning:</strong> Cotton, Velvet & Blackout</li>
              <li style={{ marginBottom: "15px" }}>🖼️ <strong>Carpet Cleaning:</strong> Persian, Silk & Wool</li>
            </ul>
          </div>

          <div>
            <img
              src="/services/meet.png"
              alt="Expert Services"
              style={{
                width: "100%",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section className="section" style={{ background: "#f5f5f5", padding: "40px 20px" }}>
        <div
          className="stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "20px",
            maxWidth: "1000px",
            marginInline: "auto",
            textAlign: "center",
          }}
        >
          <Stat k="10k+" v="Orders delivered" />
          <Stat k="4.8★" v="Average rating" />
          <Stat k="24h" v="Turnaround" />
          <Stat k="100%" v="Fabric-safe care" />
        </div>
      </section>
    </>
  );
}

function Stat({ k, v }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="stat-k" style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{k}</div>
      <div className="stat-v" style={{ fontSize: "1rem", opacity: 0.8 }}>{v}</div>
    </div>
  );
}
