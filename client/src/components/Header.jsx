import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="container navbar">
        <Link to="/" className="brand">
          {/* Put /public/logo.png if you have one */}
          <img src="/logo.png" alt="Saka Laundry" onError={(e)=>{e.currentTarget.style.display='none'}}/>
          <span>Saka Laundry</span>
        </Link>

        <nav className="menu">
          <Link to="/services">Services</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
          <a href="tel:+91XXXXXXXXXX" className="btn cta-sm">Book Pickup</a>
        </nav>

        <button className="burger only-mobile" onClick={() => setOpen(v => !v)} aria-label="Menu">
          <span />
        </button>
      </div>

      <div className={`drawer only-mobile ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
        <Link to="/services">Services</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/contact">Contact</Link>
        <a className="btn" href="tel:+91XXXXXXXXXX" style={{margin:16}}>Book Pickup</a>
      </div>
    </header>
  );
}
