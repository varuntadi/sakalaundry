import React, { useEffect, useRef } from "react";

/** =========================
 *  About – Saka Laundry (v11: removed "Free Pickup" pill)
 *  ========================= */
export default function About() {
  const rootRef = useRef(null);

  // Inject CSS once
  useEffect(() => {
    if (document.getElementById("about-saka-styles-v11")) return;
    const el = document.createElement("style");
    el.id = "about-saka-styles-v11";
    el.innerHTML = styles;
    document.head.appendChild(el);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const root = rootRef.current || document;
    const targets = root.querySelectorAll(
      ".reveal, .card, .timeline__item, .accordion__item, .cta__box, .hero__mid, .mini-card"
    );

    const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReduce.matches) {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "80px 0px" }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main ref={rootRef} className="about">
      {/* HERO */}
      <section className="hero">
        <div className="hero__decor" aria-hidden />
        <div className="hero__content reveal">
          <h1 className="hero__title">Laundry Made Effortless</h1>
          <p className="hero__subtitle">
            Doorstep pickup, eco-friendly cleaning, on-time delivery. Saka
            Laundry is the smarter way to care for your clothes.
          </p>

          {/* MIDDLE MATTER */}
          <div className="hero__mid">
            <ul className="pills">
              {/* Removed "Free Pickup" */}
              <li className="pill">24–48h Delivery</li>
              <li className="pill">Eco-friendly</li>
            </ul>

            <div className="mini-card">
              <div className="mini-card__left">
                <div className="mini-card__title">Pickup Window</div>
                <div className="mini-card__text muted">
                  7:00 AM – 10:00 PM, all week
                </div>
              </div>
              <a className="mini-card__btn" href="tel:+919121991113">
                Call
              </a>
            </div>
          </div>

          {/* Buttons (lifted a bit from bottom) */}
          <div className="hero__cta">
            <a className="btn btn--primary tilt" href="tel:+919121991113">
              Call to Book Pickup
            </a>
            <a
              className="btn btn--ghost tilt"
              href="https://wa.me/919121991113?text=Hi%20Saka%20Laundry!%20I%20want%20a%20pickup."
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="values">
        <div className="section__head reveal">
          <h2>Why Choose Saka</h2>
          <p className="muted">
            Consistently reliable service built for busy students, families and
            professionals.
          </p>
        </div>

        <div className="grid grid--3">
          {[
            { icon: "📦", title: "Doorstep Pickup", desc: "We pick up & drop at your preferred time slots." },
            { icon: "🧴", title: "Eco-Friendly Wash", desc: "Skin-safe detergents, fabric-care first approach." },
            { icon: "⏱️", title: "On-Time Delivery", desc: "Standard 24–48h turnaround. Express available." },
            { icon: "🧺", title: "Neat Packaging", desc: "Fresh, folded, labelled. Ready for your wardrobe." },
            { icon: "💬", title: "Live Support", desc: "WhatsApp updates & human support when you need it." },
            { icon: "💳", title: "Easy Payments", desc: "UPI, cash, and invoice options for hostels & offices." },
          ].map((v, i) => (
            <article key={i} className="card card--value">
              <div className="card__icon" aria-hidden>
                {v.icon}
              </div>
              <h3 className="card__title">{v.title}</h3>
              <p className="card__desc">{v.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="process">
        <div className="section__head reveal">
          <h2>How It Works</h2>
        </div>

        <ol className="timeline">
          {[
            { title: "Schedule Pickup", desc: "Call/WhatsApp. Choose your convenient time." },
            { title: "Sorted & Tagged", desc: "We check care labels, separate by fabric & color." },
            { title: "Wash & Care", desc: "Eco detergents, right cycles, low-heat drying." },
            { title: "Neat Delivery", desc: "Folded/ironed, packed, and delivered on time." },
          ].map((t, i) => (
            <li key={i} className="timeline__item">
              <span className="timeline__dot" aria-hidden />
              <div className="timeline__content">
                <h3>{t.title}</h3>
                <p className="muted">{t.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* SERVICES */}
      <section className="services">
        <div className="section__head reveal">
          <h2>Services We Offer</h2>
        </div>

        <div className="grid grid--3">
          {[
            { title: "Wash & Fold", desc: "Everyday laundry, fresh and neatly folded." },
            { title: "Wash & Iron", desc: "Crisp finish for a sharp look." },
            { title: "Dry Cleaning", desc: "Delicates & formals, handled right." },
            { title: "Stain Care", desc: "Targeted treatment for tough spots." },
            { title: "Shoe & Bag Care", desc: "Refresh and restore accessories." },
            { title: "Corporate / Hostel", desc: "Bulk & scheduled pickups." },
          ].map((s, i) => (
            <article key={i} className="card card--service">
              <h3 className="card__title">{s.title}</h3>
              <p className="card__desc">{s.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <div className="section__head reveal">
          <h2>Frequently Asked</h2>
        </div>

        <div className="accordion">
          {[
            { q: "What areas do you cover?", a: "We currently serve within city limits and nearby hostels/apartments. Message us on WhatsApp to check your location." },
            { q: "Do you offer express delivery?", a: "Yes, express options are available on request with an additional fee." },
            { q: "How do I pay?", a: "UPI, cash, or invoice for partners. We’ll share details at delivery." },
            { q: "Are detergents skin-safe?", a: "Yes, we use gentle, eco-friendly detergents. Ask for hypoallergenic on request." },
          ].map((f, i) => (
            <details key={i} className="accordion__item">
              <summary>{f.q}</summary>
              <p className="muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="cta">
        <div className="cta__box">
          <h2>Ready for Pickup?</h2>
          <p className="muted">Tell us when and where. We’ll handle the rest.</p>
          <div className="cta__actions">
            <a className="btn btn--primary tilt" href="tel:+919121991113">
              Call Now
            </a>
            <a
              className="btn btn--white tilt"
              href="https://wa.me/919121991113?text=Hi%20Saka%20Laundry!%20Pickup%20please."
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Pickup
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================
   Styles (injected)
   ============================ */
const styles = `
:root{
  --bg:#f7f9fc;
  --card:#ffffff;
  --ink:#0f172a;
  --muted:#64748b;
  --primary:#2f7cff;
  --secondary:#7b46ff;
  --radius:16px;
  --shadow:0 10px 30px rgba(15,23,42,.06);

  /* hero layout controls */
  --hero-top: clamp(24px, 3.2vh, 40px);
  --hero-min-h: 68vh;
}

*{box-sizing:border-box}
.about{background:var(--bg); color:var(--ink);}
section{padding:40px 16px}
.section__head{text-align:center; margin-bottom:18px}
.section__head h2{font-size:clamp(1.25rem,2.6vw,1.8rem); font-weight:900}
.muted{color:var(--muted)}

/* ===== HERO ===== */
.hero{
  position:relative; overflow:hidden;
  padding: var(--hero-top) 16px 18px;
  padding-top: calc(var(--hero-top) + env(safe-area-inset-top, 0px));
  display:flex; justify-content:center;
  isolation:isolate; /* blob behind content */
}
.hero__content{
  position:relative; z-index:1;
  width:100%; max-width:980px;
  display:flex; flex-direction:column; align-items:center;
  min-height: var(--hero-min-h);
  text-align:center;
}
.hero__title{
  font-weight:900; letter-spacing:-.02em; line-height:1.1;
  font-size:clamp(1.85rem, 5.4vw, 2.8rem);
  background:linear-gradient(90deg,var(--primary),var(--secondary));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  margin:2px 0 6px;
}
.hero__subtitle{max-width:760px; margin:6px auto 0; color:var(--muted)}

/* === MIDDLE “MATTER” === */
.hero__mid{
  width:min(980px,100%);
  margin-top:14px;
  display:flex; flex-direction:column; align-items:center; gap:12px;
  opacity:0; transform:translateY(10px); transition:opacity .5s ease, transform .5s ease;
}
.hero__mid.in{opacity:1; transform:none}
.hero__mid::before{
  content:"";
  position:absolute; left:50%; transform:translateX(-50%);
  width:min(720px, 92%); height:92px; background:rgba(255,255,255,.65);
  filter:saturate(120%) blur(0.5px); border-radius:18px; z-index:-1;
}
.pills{display:flex; gap:8px; flex-wrap:wrap; padding:0; margin:0; list-style:none; justify-content:center}
.pill{font-size:.82rem; font-weight:700; color:#1f2a44; background:#fff; border:1px solid rgba(2,6,23,.08); border-radius:999px; padding:6px 10px; box-shadow:0 6px 18px rgba(2,6,23,.06)}
.mini-card{display:flex; align-items:center; justify-content:space-between; gap:12px; width:min(520px, 92%); background:#fff; border:1px solid rgba(2,6,23,.06); border-radius:14px; padding:10px 12px; box-shadow:0 10px 26px rgba(2,6,23,.08); opacity:0; transform:translateY(10px); transition:opacity .5s ease .05s, transform .5s ease .05s}
.mini-card.in{opacity:1; transform:none}
.mini-card__title{font-weight:900; font-size:.95rem; color:#0f172a}
.mini-card__text{font-size:.9rem}
.mini-card__btn{flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; min-height:38px; padding:0 14px; border-radius:12px; text-decoration:none; font-weight:800; color:#fff; background:linear-gradient(90deg,var(--primary),var(--secondary))}

/* CTA — lifted a bit */
.hero__cta{
  display:flex; gap:10px; justify-content:center; flex-wrap:wrap;
  margin-top:auto;
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
}
.hero .btn{min-height:46px; padding:12px 16px; border-radius:14px}

/* ===== Animated Glow / Blob (behind) ===== */
.hero__decor{
  position:absolute; right:-200px; bottom:-300px; width:760px; height:760px;
  pointer-events:none; filter: blur(18px) saturate(115%); z-index:0;
}
.hero__decor::before, .hero__decor::after{
  content:""; position:absolute; inset:0; border-radius:50%;
  background:
    radial-gradient(280px 280px at 65% 35%, rgba(47,124,255,.24), transparent 62%),
    radial-gradient(260px 260px at 35% 70%, rgba(123,70,255,.18), transparent 64%);
  animation: blobMove 10s ease-in-out infinite alternate, blobRotate 22s linear infinite;
  transform-origin: 60% 40%;
}
.hero__decor::after{
  background:
    radial-gradient(240px 240px at 30% 35%, rgba(47,124,255,.12), transparent 64%),
    radial-gradient(220px 220px at 70% 75%, rgba(123,70,255,.10), transparent 66%);
  animation: blobMove2 12s ease-in-out infinite alternate, blobRotate 28s linear infinite reverse;
  mix-blend-mode: screen;
}
@keyframes blobMove{0%{transform:translate3d(0,0,0) scale(1);filter:hue-rotate(0deg)}50%{transform:translate3d(-12px,-10px,0) scale(1.05)}100%{transform:translate3d(-18px,-4px,0) scale(1.08);filter:hue-rotate(10deg)}}
@keyframes blobMove2{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(10px,-6px,0) scale(1.06)}100%{transform:translate3d(16px,6px,0) scale(1.07)}}
@keyframes blobRotate{to{transform:rotate(360deg)}}

/* Buttons base */
.btn{display:inline-flex; align-items:center; justify-content:center; padding:10px 16px; border-radius:12px; text-decoration:none; font-weight:800; transition:transform .14s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease; box-shadow:0 6px 18px rgba(2,6,23,.06); user-select:none}
.btn:active{transform:translateY(1px) scale(.99)}
.btn--primary{color:#fff; background:linear-gradient(90deg,var(--primary),var(--secondary))}
.btn--ghost{border:1px solid rgba(2,6,23,.12); background:#fff; color:#0f172a}
.btn--white{background:#fff; color:#0f172a; border:1px solid rgba(2,6,23,.08)}
.tilt{transform:perspective(600px) translateZ(0)}
.tilt:hover{transform:perspective(600px) translateZ(8px)}
.tilt:focus-visible{outline:2px solid color-mix(in oklab, var(--primary) 60%, white); outline-offset:2px}

/* Process timeline */
.grid{display:grid; gap:16px; max-width:1100px; margin:0 auto}
.grid--3{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.grid--4{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
.card{background:var(--card); border-radius:var(--radius); box-shadow:var(--shadow); padding:18px; opacity:0; transform:translateY(14px) scale(.98); transition:opacity .5s ease, transform .5s ease}
.card.in{opacity:1; transform:translateY(0) scale(1)}
.card--value{text-align:center; padding:20px}
.card--service{padding:18px}
.card__icon{font-size:26px; line-height:1; margin-bottom:8px}
.card__title{font-weight:900; margin:2px 0 6px}
.card__desc{color:var(--muted); font-size:.96rem}

.process .timeline{max-width:900px; margin:0 auto; list-style:none; padding:0}
.timeline__item{position:relative; padding-left:28px; margin:14px 0; background:#fff; border-radius:12px; box-shadow:var(--shadow); padding:16px 16px 16px 40px; opacity:0; transform:translateX(-10px); transition:opacity .45s ease, transform .45s ease}
.timeline__item.in{opacity:1; transform:translateX(0)}
.timeline__dot{position:absolute; left:14px; top:20px; width:10px; height:10px; border-radius:50%; background:linear-gradient(90deg,var(--primary),var(--secondary)); box-shadow:0 0 0 3px rgba(47,124,255,.12); animation:pulse 2.2s ease-in-out infinite}
.timeline__content h3{margin:0 0 4px; font-weight:900}
.timeline__content p{margin:0}

/* FAQ */
.accordion{max-width:900px; margin:0 auto}
.accordion__item{background:#fff; border-radius:12px; box-shadow:var(--shadow); padding:14px 16px; margin:10px 0; cursor:pointer; opacity:0; transform:translateY(8px); transition:opacity .4s ease, transform .4s ease, box-shadow .2s ease}
.accordion__item:hover{box-shadow:0 12px 36px rgba(2,6,23,.08)}
.accordion__item.in{opacity:1; transform:translateY(0)}
.accordion__item summary{font-weight:800; outline:none; list-style:none}
.accordion__item summary::-webkit-details-marker{display:none}
.accordion__item[open] summary{color:var(--primary)}
.accordion__item p{margin:8px 0 4px}

/* CTA */
.cta{padding:32px 16px 60px}
.cta__box{max-width:980px; margin:0 auto; text-align:center; background:#0f172a; color:#fff; border-radius:20px; padding:26px; box-shadow:0 20px 60px rgba(2,6,23,.25); background-image: radial-gradient(120px 120px at 80% 20%, rgba(47,124,255,.25), transparent 60%), radial-gradient(120px 120px at 20% 80%, rgba(123,70,255,.25), transparent 60%); opacity:0; transform:translateY(14px) scale(.99); transition:opacity .5s ease, transform .5s ease}
.cta__box.in{opacity:1; transform:translateY(0) scale(1)}
.cta__actions{display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:10px}

/* Reveal + pulse */
.reveal{opacity:0; transform:translateY(14px); transition:opacity .5s ease, transform .5s ease}
.reveal.in{opacity:1; transform:none}
@keyframes pulse{0%,100%{box-shadow:0 0 0 3px rgba(47,124,255,.16)}50%{box-shadow:0 0 0 6px rgba(47,124,255,.08)}}

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  .hero__decor::before, .hero__decor::after{animation:none}
  .timeline__dot{animation:none}
  .tilt:hover{transform:none}
  .reveal, .card, .timeline__item, .accordion__item, .cta__box, .hero__mid, .mini-card{
    transition:none; opacity:1 !important; transform:none !important;
  }
}

/* Desktop tweaks */
@media(min-width:1024px){
  :root{ --hero-top: 72px; --hero-min-h: 56vh; }
  .hero__content{min-height:auto}
  .hero__mid::before{height:84px}
  .hero__cta{margin-top:18px; padding-bottom:0}
}

/* Micro-interactions */
.card:hover{transform:translateY(-2px) scale(1.01)}
.btn--ghost:hover{border-color:rgba(2,6,23,.2)}
.btn--white:hover{border-color:rgba(255,255,255,.9)}
`;
