import React, { useEffect, useRef, useState } from "react";

/* ---------- TEAM & FEATURES ---------- */
const team = [
  { name: "ESWAR", role: "Founder & CEO", photo: "/services/eswar.jpg" },
  { name: "SUDHEER", role: "Operations Head", photo: "/services/sudheer.jpg" },
  { name: "NARAYANA", role: "Team management", photo: "/services/narayanaimage.jpg" },
  { name: "VEERABABU", role: "Sales & Marketing", photo: "/services/veerababu.jpg" },
  { name: "VARUN", role: "Developer & IT Specialist", photo: "/services/varunimage.jpg" },
];

const features = [
  { title: "Doorstep Pickup", desc: "We pick up & deliver on your schedule.", img: "/services/doorstep.png" },
  { title: "Eco-friendly Care", desc: "Fabric-safe detergents & hygienic wash.", img: "/services/ecofriendly.png" },
  { title: "Fast Turnaround", desc: "Same-day / next-day options.", img: "/services/turnaround.png" },
  { title: "Live Tracking", desc: "Know your order status in real time.", img: "/services/live.png" },
  { title: "Affordable Pricing", desc: "Transparent & budget-friendly plans.", img: "/services/afordable.png" },
  { title: "Premium Care", desc: "Special handling for delicate & luxury fabrics.", img: "/services/premium.png" },
];

const steps = [
  { n: 1, title: "Book", text: "Choose service, time & address." },
  { n: 2, title: "Pickup", text: "Our rider collects your laundry." },
  { n: 3, title: "Clean", text: "Professionally washed & ironed." },
  { n: 4, title: "Deliver", text: "Fresh clothes back at your door." },
];

/* ---------- HERO SLIDES ---------- */
const slides = ["/services/sakavanbike.png", "/services/s.png", "/services/ss.png", "/services/gg.png"];

function useLoadedSlides(srcs = []) {
  const [loaded, setLoaded] = useState([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      srcs.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => resolve(null);
            img.src = src;
          })
      )
    ).then((arr) => {
      if (!cancelled) setLoaded(arr.filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
  }, [srcs]);
  return loaded;
}

const FIT_MODE = "cover";

export default function About() {
  const revealRef = useRef([]);
  const [idx, setIdx] = useState(0);

  const loadedSlides = useLoadedSlides(slides);
  const activeSlides = loadedSlides.length ? loadedSlides : slides;

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("reveal-in")),
      { threshold: 0.15 }
    );
    revealRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!activeSlides.length) return;
    const id = setInterval(() => setIdx((n) => (n + 1) % activeSlides.length), 4000);
    return () => clearInterval(id);
  }, [activeSlides.length]);

  return (
    <div className="about-page" style={{ overflowX: "hidden" }}>
      {/* ---------- HERO ---------- */}
      <section
        className="about-hero full-bleed"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          color: "#fff",
          backgroundColor: "#0b1220",
        }}
      >
        {activeSlides.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: FIT_MODE,
              objectPosition: "center",
              opacity: i === idx ? 1 : 0,
              transition: "opacity 900ms ease-in-out",
              willChange: "opacity",
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
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            padding: "2.5rem 1rem",
            maxWidth: 900,
          }}
        >
          <h1 style={{ fontSize: "clamp(2rem,4.5vw,3rem)", marginBottom: 6 }}>About Saka Laundry</h1>
          <p style={{ opacity: 0.96 }}>
            Fresh clothes. Zero hassle. Doorstep pickup, eco-friendly cleaning, and on-time delivery—so your week stays
            light book a pickup regular/express delivery are available.
          </p>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={pillStyle}><b>10k+</b>&nbsp;orders</div>
            <div style={pillStyle}><b>4.8★</b>&nbsp;rating</div>
            <div style={pillStyle}><b>24h</b>&nbsp;turnaround</div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES (Why Saka) ---------- */}
      <div style={{ width: "100%", padding: "40px 16px" }}>
        <h2 className="section-title" style={{ textAlign: "center" }}>Why Saka</h2>
        <p className="helper" style={{ textAlign: "center", marginBottom: 24 }}>
          Everything you expect from a modern laundry—done right.
        </p>

        <div
          className="grid reveal why-saka-grid"
          ref={(el) => (revealRef.current[1] = el)}
        >
          {features.map((f, i) => (
            <div key={i} className="feature-card why-saka-card">
              <div className="feature-img">
                <img src={f.img} alt={f.title} loading="lazy" />
              </div>
              <div className="feature-text">
                <h4>{f.title}</h4>
                <p className="helper">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- PROCESS STEPS ---------- */}
      <div
        className="reveal"
        ref={(el) => (revealRef.current[2] = el)}
        style={{
          background: "#f0f6ff",
          borderTop: "1px solid #e6efff",
          borderBottom: "1px solid #e6efff",
          padding: "16px 0",
          marginTop: 8,
        }}
      >
        <div className="container steps-grid">
          {steps.map((s) => (
            <div className="card" key={s.n} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 6px",
                  background: "#2f7cff",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {s.n}
              </div>
              <h4>{s.title}</h4>
              <p className="helper">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- TEAM ---------- */}
      <div style={{ width: "100%", padding: "40px 16px" }}>
        <h2 className="section-title" style={{ textAlign: "center" }}>Meet the Team</h2>
        <p className="helper" style={{ textAlign: "center", marginBottom: 24 }}>
          The people making Saka Laundry fast, friendly, and dependable.
        </p>

        <div
          className="team-grid reveal"
          ref={(el) => (revealRef.current[3] = el)}
        >
          {team.map((m, i) => (
            <div key={i} className="team-card">
              <div className="team-img">
                <img src={m.photo} alt={m.name} loading="lazy" />
              </div>
              <div className="team-text">
                <h4>{m.name}</h4>
                <p className="helper">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- CTA ---------- */}
      <div className="container" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3>Ready to skip laundry this week?</h3>
            <p className="helper">Book a pickup now and get your first wash at a special price.</p>
          </div>
          <a href="/order" className="btn-primary" style={btnPrimary}>Book Pickup</a>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const pillStyle = {
  background: "rgba(255,255,255,.12)",
  border: "1px solid rgba(255,255,255,.25)",
  padding: ".6rem .8rem",
  borderRadius: 12,
};

const btnPrimary = {
  textDecoration: "none",
  background: "#2f7cff",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 10,
  fontWeight: 600,
  border: "1px solid #0b4fd6",
};
