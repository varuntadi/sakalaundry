import React, { useEffect, useRef } from "react";

/**
 * About – Saka Laundry (Blue Minimal • Responsive)
 * Layout:
 *  0) About Saka + Open in Maps
 *  1) Left image (about.png) + right text
 *  2) Right image (delivery.png) + left text (desktop only)
 *  3) Refer-a-friend banner (10% off)
 */

const IMG = {
  ABOUT: "/about.png",
  DELIVERY: "/delivery.png",
};

// Google Maps
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Kokila%20Center%20Bhaskar%20Nagar%20Road%20Indian%20Bank%20Building%20Kakinada%20Andhra%20Pradesh";

// WhatsApp referral link
const REFER_WA =
  "https://wa.me/919121991113?text=Hi%20Saka%20Laundry!%20I%27d%20like%20a%20referral%20%E2%80%94%20Get%2010%25%20off%20on%20my%20next%20order.";

export default function About() {
  const rootRef = useRef(null);

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById("saka-about-blue-v8")) return;
    const el = document.createElement("style");
    el.id = "saka-about-blue-v8";
    el.innerHTML = styles;
    document.head.appendChild(el);
  }, []);

  // Fade-up reveal
  useEffect(() => {
    const root = rootRef.current || document;
    const targets = root.querySelectorAll(".reveal");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (rm.matches) {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "100px 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <main ref={rootRef} className="about-min">
      {/* 0️⃣ ABOUT SAKA */}
      <section className="about-top">
        <div className="container narrow">
          <p className="label reveal">About Saka</p>
          <p className="lead reveal">
            We’re a Kakinada-based team making laundry effortless — doorstep
            pickup, fabric-safe cleaning, and on-time delivery. From students to
            families and offices, we handle every order with care and clear
            communication.
          </p>
          <nav className="actions reveal">
            <a className="btn btn--primary" href="tel:+919121991113">
              Call for Pickup
            </a>
            <a
              className="btn btn--ghost"
              target="_blank"
              rel="noreferrer"
              href="https://wa.me/919121991113?text=Hi%20Saka%20Laundry!%20Pickup%20please."
            >
              WhatsApp Us
            </a>
            <a
              className="btn btn--map"
              target="_blank"
              rel="noreferrer"
              href={MAPS_URL}
            >
              Open in Maps
            </a>
          </nav>
        </div>
      </section>

      {/* 1️⃣ LEFT IMAGE + RIGHT TEXT */}
      <section className="intro">
        <div className="container intro__wrap">
          <figure className="intro__image reveal">
            <img src={IMG.ABOUT} alt="Saka Laundry — professional care" />
          </figure>

          <div className="intro__text reveal">
            <p className="kicker">Saka Laundry</p>
            <h2 className="heading">
              Clean Clothes, <span className="accent">Zero Hassle.</span>
            </h2>
            <p className="copy">
              Doorstep pickup, fabric-safe cleaning, and on-time delivery across
              Kakinada — so you can focus on life, not laundry.
            </p>
            <ul className="points">
              <li>Pickup windows from 7:00 AM – 10:00 PM</li>
              <li>Skin-gentle detergents & fabric-smart cycles</li>
              <li>Neat, labeled packaging — wardrobe ready</li>
            </ul>

            <nav className="actions">
              <a className="btn btn--primary" href="tel:+919121991113">
                Call for Pickup
              </a>
              <a
                className="btn btn--ghost"
                target="_blank"
                rel="noreferrer"
                href="https://wa.me/919121991113?text=Hi%20Saka%20Laundry!%20Pickup%20please."
              >
                WhatsApp Us
              </a>
            </nav>
          </div>
        </div>
      </section>

      {/* 2️⃣ RIGHT IMAGE + LEFT TEXT (on desktop) */}
      <section className="intro reverse">
        <div className="container intro__wrap">
          <figure className="intro__image reveal">
            <img src={IMG.DELIVERY} alt="Saka Laundry — quick delivery" />
          </figure>

          <div className="intro__text reveal">
            <p className="kicker">Fast Delivery</p>
            <h2 className="heading">
              Fresh. Crisp. <span className="accent">On Time.</span>
            </h2>
            <p className="copy">
              Standard turnaround in <strong>24–48 hours</strong>. Need it
              faster? Ask for express.
            </p>
            <ul className="points">
              <li>Steam-pressed finish and tidy fold</li>
              <li>Delivery confirmation on WhatsApp</li>
              <li>UPI or Cash — easy payments</li>
            </ul>

            <nav className="actions">
              <a className="btn btn--primary" href="tel:+919121991113">
                Schedule Delivery
              </a>
              <a
                className="btn btn--ghost"
                target="_blank"
                rel="noreferrer"
                href="https://wa.me/919121991113?text=Hi%20Saka%20Laundry!%20Delivery%20query."
              >
                Chat on WhatsApp
              </a>
            </nav>
          </div>
        </div>
      </section>

      {/* 3️⃣ REFER A FRIEND */}
      <section className="refer">
        <div className="container">
          <div className="refer__wrap reveal">
            <div className="refer__text">
              <p className="refer__eyebrow">Share the Freshness</p>
              <h3 className="refer__title">
                Refer a Friend &amp; Get <span>10% Off</span> Your Next Order
              </h3>
              <p className="refer__desc">
                When your friend places their first order, we’ll apply 10% off
                to your next bill. Simple and instant.
              </p>
            </div>
            <div className="refer__actions">
              <a
                className="btn btn--light"
                href={REFER_WA}
                target="_blank"
                rel="noreferrer"
              >
                Refer on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================
   STYLES
   ========================= */
const styles = `
:root {
  --navy: #0b1b63;
  --royal: #1e4fff;
  --cyan: #30a6ff;
  --ink: #0b1320;
  --muted: #5f6f8a;
  --bg: #ffffff;
}

* { box-sizing: border-box; }
.about-min {
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}
.container { width: min(1180px, 92%); margin-inline: auto; }
.narrow { max-width: 860px; }

/* fade */
.reveal { opacity: 0; transform: translateY(14px); transition: opacity .5s ease, transform .5s ease; }
.reveal.in { opacity: 1; transform: none; }

/* top */
.about-top { padding: 44px 0 10px; text-align: left; }
.label { font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--royal); margin: 0 0 8px; }
.lead { font-size: 1.06rem; color: var(--muted); max-width: 60ch; line-height: 1.6; }
.actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 18px; border-radius: 999px; font-weight: 800; text-decoration: none; transition: .25s ease; }
.btn--primary { background: var(--royal); color: #fff; }
.btn--ghost { background: #fff; color: var(--ink); border: 1px solid rgba(0,0,0,.1); }
.btn--map { background: #0EA5E9; color: #041426; }
.btn:hover { transform: translateY(-2px); }

/* layout */
.intro { padding: 38px 0; }
.intro__wrap { display: grid; grid-template-columns: 1.05fr 1fr; gap: 28px; align-items: center; }
.intro__image img { width: 100%; height: auto; display: block; border-radius: 20px; box-shadow: 0 10px 28px rgba(0,0,0,.06); }
.kicker { font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--royal); margin: 0 0 8px; }
.heading { font-size: clamp(1.8rem, 3.6vw, 2.6rem); line-height: 1.08; margin: 0 0 10px; }
.accent { color: var(--royal); }
.copy { font-size: 1.02rem; color: var(--muted); line-height: 1.6; max-width: 52ch; }
.points { margin: 12px 0 0 18px; color: var(--ink); }
.points li { margin: 6px 0; line-height: 1.5; }

/* reverse section (desktop only) */
@media (min-width: 981px) {
  .reverse .intro__wrap { grid-template-columns: 1fr 1.05fr; }
  .reverse .intro__image { order: 2; }
  .reverse .intro__text { order: 1; }
}

/* refer banner */
.refer { padding: 44px 0 70px; }
.refer__wrap {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 22px 24px; border-radius: 24px;
  background: linear-gradient(90deg, var(--royal), var(--cyan));
  color: #fff; box-shadow: 0 18px 50px rgba(0,0,0,.12);
}
.refer__eyebrow { margin: 0 0 6px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .95; }
.refer__title { margin: 0; font-size: clamp(1.2rem, 2.4vw, 1.8rem); font-weight: 900; }
.refer__title span { color: #e6f0ff; }
.refer__desc { margin: 6px 0 0; opacity: .95; }
.btn--light { background: #fff; color: #0b1320; border: 1px solid rgba(0,0,0,.06); }

/* responsive */
@media (max-width:980px) {
  .intro__wrap { grid-template-columns: 1fr; gap: 18px; }
  .reverse .intro__image { order: 0; }
  .reverse .intro__text { order: 0; }
  .title { font-size: clamp(1.8rem, 6vw, 2.4rem); }
  .refer__wrap { flex-direction: column; text-align: center; }
}
@media (prefers-reduced-motion: reduce) {
  .reveal { transition: none; opacity: 1 !important; transform: none !important; }
}
`;
