import React, { useEffect, useRef, useState } from "react";

/* ---------- TEAM DATA ---------- */
const team = [
  {
    name: "ESWAR",
    role: "Founder & CEO",
    photo: "/services/eswar.jpg",
    bio: "Started Saka to make laundry simple — focuses on operations & partnerships.",
  },
  {
    name: "SUDHEER",
    role: "Operations Head",
    photo: "/services/sudheer.jpg",
    bio: "Makes sure pickups, cleaning and deliveries run like clockwork.",
  },
  {
    name: "NARAYANA",
    role: "Team Management",
    photo: "/services/narayanaimage.jpg",
    bio: "Builds and coaches the on-ground team to deliver excellent customer experience.",
  },
  {
    name: "VEERABABU",
    role: "Sales & Marketing",
    photo: "/services/veerababu.jpg",
    bio: "Gets the word out and helps customers discover our services.",
  },
  {
    name: "VARUN",
    role: "Developer & IT Specialist",
    photo: "/services/varunimage.jpg",
    bio: "Keeps our web & app experience fast, secure and delightful",
  },
];

/* ---------- COMPONENT ---------- */
export default function About() {
  const revealRef = useRef([]);
  const [pressed, setPressed] = useState(-1);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  function handlePress(i) {
    setPressed(i);
    setTimeout(() => setPressed(-1), 220);
  }

  // inject CSS once
  useEffect(() => {
    if (document.getElementById("about-page-styles")) return;
    const el = document.createElement("style");
    el.id = "about-page-styles";
    el.innerHTML = styles;
    document.head.appendChild(el);
  }, []);

  return (
    <div className="about-page">
      {/* HERO */}
      <section className="about-hero">
        <div className="hero-inner">
          <h1 className="hero-title">Meet Our Leadership Team</h1>
          <p className="hero-sub">
            Passionate people driving Saka Laundry forward with innovation and trust.
          </p>
        </div>
      </section>

      {/* ABOUT */}
      <section
        className="about-model reveal"
        ref={(el) => (revealRef.current[0] = el)}
      >
        <div className="model-card">
          <h2>About Saka Laundry</h2>
          <p>
            We started with one goal — to make laundry stress-free. With{" "}
            <strong>doorstep pickup, eco-friendly cleaning, and reliable delivery</strong>, 
            we save time so our customers can focus on what truly matters.
          </p>
          <a className="btn-primary" href="tel:+919121991113">
            Book a Pickup
          </a>
        </div>
      </section>

      {/* TEAM */}
      <div className="team-section">
        <div className="team-full">
          <div
            className="team-grid reveal"
            ref={(el) => (revealRef.current[1] = el)}
          >
            {team.map((m, i) => (
              <article
                key={i}
                className={`team-card ${pressed === i ? "pressed" : ""}`}
                style={{ ["--i"]: i }}
              >
                <div className="card-top">
                  <button
                    className="avatar-btn"
                    onClick={() => handlePress(i)}
                    aria-label={`Press ${m.name}`}
                  >
                    <span className="avatar-inner">
                      <img
                        src={m.photo}
                        alt={m.name}
                        className="avatar-img"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="avatar-shine" aria-hidden />
                    </span>
                  </button>
                </div>

                <div className="team-info">
                  <h3 className="member-name">{m.name}</h3>
                  <div className="member-role">{m.role}</div>
                  <p className="bio">{m.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const styles = `
:root {
  --accent: #2f7cff;
  --accent-2: #7b46ff;
  --muted: #616b78;
  --bg: #f6f8fb;
  --card-radius: 14px;
  --gap: 28px;
  --avatar-lg: 180px;
  --avatar-md: 160px;
  --avatar-mobile: 180px;
}

/* HERO */
.about-hero { text-align:center; padding:40px 16px; }
.hero-title {
  font-size:clamp(1.8rem,3.6vw,2.6rem); font-weight:900;
  background:linear-gradient(90deg,var(--accent),var(--accent-2));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
}
.hero-sub { margin-top:12px; color:var(--muted); }

/* ABOUT */
.about-model { display:grid; place-items:center; padding:20px 16px; }
.model-card { background:#fff; border-radius:16px; padding:24px; max-width:850px; text-align:center; }
.btn-primary { background:linear-gradient(90deg,var(--accent),var(--accent-2)); color:#fff; padding:10px 16px; border-radius:10px; font-weight:700; text-decoration:none; display:inline-block; }

/* TEAM GRID */
.team-section { padding:28px 0 64px; }
.team-full { width:100%; max-width:1200px; margin:0 auto; padding:0 16px; }
.team-grid {
  display:grid; gap:var(--gap);
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  grid-auto-rows:1fr; /* ensures equal height rows */
}
@media(min-width:1200px){
  .team-full { max-width:none; padding:0; }
  .team-grid { grid-template-columns:repeat(5,1fr); gap:32px; }
}

/* CARD */
.team-card {
  background:#fff; border-radius:var(--card-radius);
  padding:22px; display:flex; flex-direction:column;
  align-items:center; justify-content:space-between;
  height:100%; /* stretch to equal height */
  text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.05);
  transition:transform .25s, box-shadow .25s;
}
.team-card:hover { transform:translateY(-8px) scale(1.02); box-shadow:0 20px 60px rgba(0,0,0,0.12); }

/* AVATAR */
.avatar-btn { width:var(--avatar-lg); height:var(--avatar-lg); border-radius:50%; overflow:hidden;
  border:4px solid #f2f2f2; box-shadow:0 12px 30px rgba(2,6,23,0.08); position:relative; background:#fff; }
.avatar-img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
.avatar-shine { position:absolute; inset:0; background:linear-gradient(120deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0) 100%); transform:translateX(-100%); transition:transform .6s; }
.avatar-btn:hover .avatar-shine { transform:translateX(100%); }

/* TEXT */
.member-name { font-weight:800; margin:6px 0 4px; }
.member-role { color:var(--accent); font-weight:700; margin-bottom:8px; }
.bio { color:var(--muted); font-size:.95rem; }

/* MOBILE */
@media(max-width:1000px){ .avatar-btn{ width:var(--avatar-md); height:var(--avatar-md);} }
@media(max-width:640px){
  .team-grid{ grid-template-columns:1fr; gap:20px; }
  .avatar-btn{ width:var(--avatar-mobile); height:var(--avatar-mobile);}
}
`;
