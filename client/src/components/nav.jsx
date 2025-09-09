// src/components/nav.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { auth } from "../auth";
import logo from "../assets/sakalogo.jpg";
import "../styles/theme.css"; // single global theme file

export default function Nav() {
  const nav = useNavigate();
  const isLoggedIn = !!auth.isLoggedIn;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const panelRef = useRef(null);

  const menuItems = [
    { name: "Home", to: "/" },
    { name: "About Us", to: "/about" },
    { name: "Contact", to: "/contact" },
    { name: "Admin", to: "/admin" },
  ];

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll while menu open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [isMenuOpen]);

  // Close when clicking outside panel (backdrop) — only active while open
  useEffect(() => {
    if (!isMenuOpen) return;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [isMenuOpen]);

  const handleLinkClick = () => setIsMenuOpen(false);

  const activeStyle = ({ isActive }) => ({
    color: isActive ? "#0b78f6" : "#111",
    fontWeight: isActive ? 600 : "normal",
    textDecoration: "none",
  });

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
            <NavLink to="/login" style={activeStyle} className="nav-link-desktop">
              Login
            </NavLink>
            <NavLink to="/signup" className="btn btn-outline">
              Signup
            </NavLink>
          </>
        ) : (
          <button
            onClick={() => {
              auth.logout();
              nav("/");
            }}
            className="logout-btn"
            aria-label="Logout"
          >
            Logout
          </button>
        )}
      </div>

      {/* mobile hamburger (button element for accessibility) */}
      <button
        className={`hamburger ${isMenuOpen ? "open" : ""}`}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsMenuOpen((s) => !s)}
        type="button"
      >
        <span className="hb-line" />
        <span className="hb-line" />
        <span className="hb-line" />
      </button>

      {/* render backdrop + panel only when open — prevents stray visuals */}
      {isMenuOpen && (
        <>
          <div className="mobile-backdrop visible" aria-hidden="true" />
          <div
            ref={panelRef}
            className={`mobile-panel enter`}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <div className="mobile-panel-inner">
              <ul className="mobile-menu-list">
                {menuItems.map((it, idx) => (
                  <li
                    key={it.name}
                    className="mobile-menu-item"
                    style={{ animationDelay: `${idx * 60}ms` }}
                    onTouchStart={(e) => e.currentTarget.classList.add("pressed")}
                    onTouchEnd={(e) => e.currentTarget.classList.remove("pressed")}
                    onMouseDown={(e) => e.currentTarget.classList.add("pressed")}
                    onMouseUp={(e) => e.currentTarget.classList.remove("pressed")}
                  >
                    <NavLink to={it.to} className="mobile-menu-link" onClick={handleLinkClick}>
                      {it.name}
                    </NavLink>
                  </li>
                ))}

                <li className="mobile-menu-item" style={{ animationDelay: `${menuItems.length * 60}ms` }}>
                  <NavLink to="/orders" className="mobile-cta" onClick={handleLinkClick}>
                    Book Order
                  </NavLink>
                </li>

                <li className="mobile-menu-item" style={{ animationDelay: `${(menuItems.length + 1) * 60}ms` }}>
                  <div className="mobile-auth-row">
                    {!isLoggedIn ? (
                      <>
                        <NavLink to="/login" className="mobile-small-link" onClick={handleLinkClick}>
                          Login
                        </NavLink>
                        <NavLink to="/signup" className="btn btn-outline small" onClick={handleLinkClick}>
                          Signup
                        </NavLink>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          auth.logout();
                          nav("/");
                          handleLinkClick();
                        }}
                        className="mobile-logout"
                      >
                        Logout
                      </button>
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
