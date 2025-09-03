import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

// Services
const services = [
  { title: "Wash & Fold", desc: "Everyday laundry neatly folded and fresh.", img: "/services/washandfold.png" },
  { title: "Wash & Iron", desc: "Crisp, ready-to-wear finish.", img: "/services/22.png" },
  { title: "Dry Cleaning", desc: "Delicate care for suits, sarees & formals.", img: "/services/2.png" },
  { title: "Shoe & Leather Care", desc: "Deep clean & condition for shoes/bags.", img: "/services/3.png" },
  { title: "Curtain & Home Linen", desc: "Freshen up curtains, bedsheets & more.", img: "/services/4.png" },
  { title: "Premium Care", desc: "Luxury garments with extra attention.", img: "/services/5.png" },
];

// Hero slideshow
const slides = [
  "/services/washandfold.png",
  "/services/22.png",
  "/services/2.png",
  "/services/4.png",
  "/services/5.png",
];

// Testimonials
const testimonials = [
  { name: "Rahul Sharma", review: "Super fast service! My clothes were fresh and neatly packed. Highly recommend!", rating: "★★★★★" },
  { name: "Ananya Gupta", review: "Affordable and very professional. I loved the doorstep pickup and delivery.", rating: "★★★★★" },
  { name: "Vikram Rao", review: "Eco-friendly cleaning and on-time delivery. Great for busy schedules.", rating: "★★★★☆" },
  { name: "Sneha Reddy", review: "Best laundry service I’ve used in the city. Totally hassle-free!", rating: "★★★★★" },
];

// FAQ
const faqs = [
  { q: "What services do you offer?", a: "We provide wash & fold, wash & iron, dry cleaning, shoe care, leather care, curtain & carpet cleaning, and premium garment care." },
  { q: "How do I schedule a pickup?", a: "You can book through our website or mobile app in just a few clicks." },
  { q: "Is pickup and delivery free?", a: "Yes, pickup and delivery are free for regular service orders." },
  { q: "How long does laundry take?", a: "Regular laundry is delivered in 24 hours, dry cleaning within 72 hours." },
  { q: "Do you offer express service?", a: "Yes, same-day or next-day delivery with 1.5x extra charge in select areas." },
  { q: "Are your detergents safe?", a: "We use fabric-safe, eco-friendly detergents suitable for sensitive skin." },
  { q: "Do you handle delicate fabrics?", a: "Yes, we specialize in handling silk, wool, sarees, and premium garments." },
  { q: "Can I track my order?", a: "Yes, live tracking is available on our app and website." },
  { q: "What are your operating hours?", a: "We operate 7 days a week, from 8 AM to 9 PM." },
  { q: "Do you offer shoe and bag cleaning?", a: "Yes, we clean and restore shoes, bags, and leather goods." },
  { q: "Is there a minimum order amount?", a: "No minimum order amount for laundry services." },
  { q: "How do I pay?", a: "We accept UPI, cards, net banking, and cash on delivery." },
  { q: "Can I reschedule my pickup?", a: "Yes, you can reschedule from the app or by contacting our support." },
  { q: "What if I am not at home during delivery?", a: "Our delivery agent will contact you to reschedule at a convenient time." },
  { q: "Do you serve all areas?", a: "We cover most city areas, but express delivery is available only in select zones." },
  { q: "Can I subscribe to regular service?", a: "Yes, we offer weekly and monthly subscription plans for laundry." },
  { q: "Do you provide corporate/office laundry?", a: "Yes, we serve corporate clients with bulk laundry services." },
  { q: "Are there hidden charges?", a: "No, all prices are transparent with no hidden charges." },
  { q: "How do you ensure hygiene?", a: "We use sanitized equipment, separate washes, and sealed packaging." },
  { q: "Do you offer discounts?", a: "Yes, discounts are available on bulk orders and subscription plans." },
];

// Hook for scroll animations
function useScrollAnimation() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          el.classList.add("animate");
          observer.unobserve(el);
        }
      }),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Landing() {
  const [idx, setIdx] = useState(0);

  const vanRef = useScrollAnimation();
  const expertRef = useScrollAnimation();
  const worksRef = useScrollAnimation();
  const reviewRef = useScrollAnimation();
  const faqRef = useScrollAnimation();

  // ✅ FAQ search
  const [search, setSearch] = useState("");
  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const id = setInterval(() => setIdx((n) => (n + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="hero-min full-bleed" style={{ position: "relative", minHeight: "70vh", display: "grid", placeItems: "center", color: "#fff", overflow: "hidden" }}>
        {slides.map((src, i) => (
          <div key={src + i} style={{ position: "absolute", inset: 0, background: `url("${src}") center/cover no-repeat`, transition: "opacity 900ms ease-in-out", opacity: i === idx ? 1 : 0 }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.35))" }} />
        <div className="content" style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 800, padding: 20 }}>
          <h1 style={{ fontSize: "clamp(2rem, 1.2rem + 2.5vw, 3rem)", marginBottom: 12 }}>Fresh laundry, delivered with style.</h1>
          <p style={{ marginBottom: 20, fontSize: "1.1rem", opacity: 0.9 }}>Doorstep pickup. Eco-friendly clean. On-time delivery.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" className="btn-primary">Book pickup</Link>
            <Link to="/about" className="btn-outline">How it works</Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section" style={{ width: "100%", padding: "40px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, maxWidth: "1200px", marginInline: "auto", flexWrap: "wrap" }}>
          <h2 className="section-title" style={{ margin: 0 }}>Services</h2>
          <a href="/order" className="link">View all →</a>
        </div>
        <div className="services-row" style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "10px", scrollbarWidth: "none" }}>
          {services.map((s, i) => (
            <a key={i} href="/order" className="card card-min" style={{ textDecoration: "none", color: "inherit", flex: "0 0 250px", borderRadius: "10px", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
              <div className="thumb">
                <img src={s.img} alt={s.title} loading="lazy" style={{ width: "100%", borderRadius: "8px 8px 0 0" }} />
              </div>
              <div className="card-body" style={{ padding: "10px" }}>
                <div className="card-title" style={{ fontWeight: "bold" }}>{s.title}</div>
                <div className="card-text" style={{ fontSize: "0.9rem", margin: "6px 0" }}>{s.desc}</div>
                <div className="card-cta"><span className="link" style={{ color: "#007bff" }}>Book now</span></div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Van Section */}
      <section ref={vanRef} className="section animate-on-scroll" style={{ maxWidth: "1200px", margin: "40px auto", padding: "20px" }}>
        <div className="van-info">
          <div className="van-img slide-left">
            <img src="/services/van.jpg" alt="Saka Laundry Van" className="info-img" />
          </div>
          <div className="van-text slide-right">
            <h2 style={{ marginBottom: "15px" }}>Fast & Reliable Services</h2>
            <p style={{ marginBottom: "20px", fontSize: "1.05rem", opacity: 0.9 }}>Choose the service that fits your needs. Regular for everyday use, Express for urgent requirements 🚀</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                <h3 style={{ color: "#2f7cff", marginBottom: "10px" }}>REGULAR SERVICE</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <li>✅ Free Pickup & Delivery</li>
                  <li>✅ Laundry in 24 Hrs</li>
                  <li>✅ Dry Clean in 72 Hrs</li>
                  <li>✅ Shoe Cleaning 3–5 Days</li>
                </ul>
              </div>
              <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                <h3 style={{ color: "#e63946", marginBottom: "10px" }}>EXPRESS SERVICE</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
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
      <section ref={expertRef} className="animate-on-scroll" style={{ padding: "60px 20px", background: "#fafafa" }}>
        <div className="expert-info">
          <div className="expert-text slide-left">
            <h2 style={{ marginBottom: "20px" }}>Our Expert Services</h2>
            <p style={{ marginBottom: "30px" }}>From delicate fabrics to premium items, we’ve got you covered.</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li>🧺 Laundry: Wash & Fold | Wash & Iron</li>
              <li>👔 Dry Cleaning: Suits, Sarees, Woollens</li>
              <li>👟 Shoe Cleaning: Restoration & Protection</li>
              <li>👜 Leather Care: Bags, Jackets & Wallets</li>
              <li>🪟 Curtain Cleaning: Cotton, Velvet & Blackout</li>
              <li>🖼️ Carpet Cleaning: Persian, Silk & Wool</li>
            </ul>
          </div>
          <div className="expert-img slide-right">
            <img src="/services/meet.png" alt="Expert Services" className="info-img" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={worksRef} className="section animate-on-scroll" style={{ padding: "60px 20px", background: "#fff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2>How It Works</h2>
          <p style={{ marginBottom: "40px" }}>Fresh clothes at your doorstep in just 4 simple steps.</p>
          <div className="how-steps">
            <Step icon="📅" title="Schedule Pickup" text="Book easily on our website or app." />
            <Step icon="🚚" title="We Collect" text="Doorstep pickup at your convenience." />
            <Step icon="🧼" title="We Clean" text="Eco-friendly detergents & premium care." />
            <Step icon="📦" title="We Deliver" text="Fresh clothes, on time – every time." />
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section ref={reviewRef} className="section animate-on-scroll" style={{ padding: "60px 20px", background: "#fafafa" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2>What Our Customers Say</h2>
          <p style={{ marginBottom: "40px" }}>Trusted by thousands of happy customers.</p>
          <div className="reviews">
            {testimonials.map((t, i) => (
              <div key={i} className="review fade-up">
                <p>"{t.review}"</p>
                <strong>{t.name}</strong>
                <div style={{ color: "#f5b50a" }}>{t.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="section animate-on-scroll" style={{ padding: "60px 20px", background: "#fff" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Frequently Asked Questions</h2>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <input
              type="text"
              placeholder="Search your question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "1rem"
              }}
            />
          </div>
          <div className="faq-list">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} search={search} />
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#666" }}>No results found.</p>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ background: "#f5f5f5", padding: "40px 20px" }}>
        <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px", maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
          <Stat k="10k+" v="Orders delivered" />
          <Stat k="4.8★" v="Average rating" />
          <Stat k="24h" v="Turnaround" />
          <Stat k="100%" v="Fabric-safe care" />
        </div>
      </section>
    </>
  );
}

// Reusable components
function Step({ icon, title, text }) {
  return (
    <div className="step fade-up">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Stat({ k, v }) {
  return (
    <div>
      <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>{k}</div>
      <div style={{ fontSize: "1rem", opacity: 0.8 }}>{v}</div>
    </div>
  );
}

function FaqItem({ q, a, search }) {
  const [open, setOpen] = useState(false);

  // Highlight matches
  const highlight = (text) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: "#ffe066", padding: "0 2px" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={`faq-item ${open ? "open" : ""}`} onClick={() => setOpen(!open)}>
      <div className="faq-question">
        <span>{highlight(q)}</span>
        <span className="faq-toggle">{open ? "−" : "+"}</span>
      </div>
      <div className="faq-answer">
        <p>{highlight(a)}</p>
      </div>
    </div>
  );
}
