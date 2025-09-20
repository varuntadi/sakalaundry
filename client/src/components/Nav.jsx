// client/src/components/Nav.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../auth";
import logo from "../assets/sakalogo.jpg";
import "../styles/theme.css";

export default function Nav() {
  const nav = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!auth.isLoggedIn;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const panelRef = useRef(null);
  const prevFocusRef = useRef(null);

  // menu items — keep My Orders out of top-level list for guests
  const menuItems = [
    { name: "Home", to: "/" },
    { name: "About Us", to: "/about" },
    { name: "Contact", to: "/contact" },
    ...(isLoggedIn ? [{ name: "My Orders", to: "/my-orders" }] : []),
    { name: "Admin", to: "/admin" },
  ];

  const activeStyle = ({ isActive }) => ({
    color: isActive ? "#0b78f6" : "#111",
    fontWeight: isActive ? 600 : "normal",
    textDecoration: "none",
  });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setIsMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { document.body.style.overflow = isMenuOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [isMenuOpen]);

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) { try { prevFocusRef.current?.focus?.(); } catch {} ; return; }
    prevFocusRef.current = document.activeElement;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus(); else panel.focus();
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter(n => !!(n.offsetWidth || n.offsetHeight || n.getClientRects().length));
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    panel.addEventListener("keydown", onKey);
    return () => panel.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onClick = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setIsMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [isMenuOpen]);

  const handleLinkClick = () => setIsMenuOpen(false);

  return (
    <nav className="saka-nav">
      <Link to="/" className="brand" onClick={handleLinkClick}>
        <img src={logo} alt="Saka Laundry" className="brand-logo" />
        <span className="brand-text">SAKA Laundry</span>
      </Link>

      <div className="desktop-links">
        {menuItems.map((m) => (
          <NavLink key={m.name} to={m.to} style={activeStyle} className="nav-link-desktop">
            {m.name}
          </NavLink>
        ))}

        <NavLink to="/orders" className="btn btn-primary">
          Book Order
        </NavLink>

        {!isLoggedIn ? (
          <>
            <NavLink to="/login" style={activeStyle} className="nav-link-desktop">Login</NavLink>
            <NavLink to="/signup" className="btn btn-outline">Signup</NavLink>
          </>
        ) : (
          <button onClick={() => { auth.logout(); nav("/"); }} className="logout-btn" aria-label="Logout">Logout</button>
        )}
      </div>

      <button
        className={`hamburger ${isMenuOpen ? "open" : ""}`}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu-panel"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsMenuOpen((s) => !s)}
        type="button"
      >
        <span className="hb-line" />
        <span className="hb-line" />
        <span className="hb-line" />
      </button>

      {isMenuOpen && (
        <>
          <div className="mobile-backdrop visible" aria-hidden="true" onClick={() => setIsMenuOpen(false)} />
          <div id="mobile-menu-panel" ref={panelRef} className={`mobile-panel enter`} role="dialog" aria-modal="true" aria-label="Mobile menu" tabIndex={-1}>
            <div className="mobile-panel-inner">
              <ul className="mobile-menu-list">
                {menuItems.map((it, idx) => (
                  <li key={it.name} className="mobile-menu-item" style={{ animationDelay: `${idx * 60}ms` }}>
                    <NavLink to={it.to} className="mobile-menu-link" onClick={handleLinkClick}>
                      {it.name}
                    </NavLink>
                  </li>
                ))}

                <li className="mobile-menu-item" style={{ animationDelay: `${menuItems.length * 60}ms` }}>
                  <NavLink to="/orders" className="mobile-cta" onClick={handleLinkClick}>Book Order</NavLink>
                </li>

                <li className="mobile-menu-item" style={{ animationDelay: `${(menuItems.length + 1) * 60}ms` }}>
                  <div className="mobile-auth-row">
                    {!isLoggedIn ? (
                      <>
                        <NavLink to="/login" className="mobile-small-link" onClick={handleLinkClick}>Login</NavLink>
                        <NavLink to="/signup" className="btn btn-outline small" onClick={handleLinkClick}>Signup</NavLink>
                      </>
                    ) : (
                      <button onClick={() => { auth.logout(); nav("/"); handleLinkClick(); }} className="mobile-logout">Logout</button>
                    )}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
