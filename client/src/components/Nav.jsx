import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../auth";
import api from "../api";
import "../styles/theme.css";

// ✅ Lucide icons
import {
  Home,
  Info,
  Phone,
  Package,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
  ShoppingCart,
  Truck, // ⭐ delivery icon
} from "lucide-react";

export default function Nav() {
  const nav = useNavigate();
  const location = useLocation();
  const [authVersion, setAuthVersion] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const panelRef = useRef(null);

  /* =========================
     Ensure auth user on refresh
  ========================== */
  useEffect(() => {
    const ensureUser = async () => {
      try {
        if (!auth.user && auth.token) {
          const res = await api.get("/profile");
          if (res?.data) {
            auth.user = res.data;
            window.dispatchEvent(new Event("authChanged"));
          }
        }
      } catch {}
    };
    ensureUser();
  }, []);

  /* =========================
     React to auth changes
  ========================== */
  useEffect(() => {
    const onAuth = () => setAuthVersion((v) => v + 1);
    window.addEventListener("authChanged", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("authChanged", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onClick = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  /* =========================
     Role flags
  ========================== */
  const isLoggedIn = auth.isLoggedIn;
  const isAdmin = auth.isAdmin;
  const isDelivery = auth.user?.role === "delivery"; // ⭐ new

  /* =========================
     Menu items
  ========================== */
  const menuItems = [
    { name: "Home", to: "/", icon: <Home size={18} /> },
    { name: "About Us", to: "/about", icon: <Info size={18} /> },
    { name: "Contact", to: "/contact", icon: <Phone size={18} /> },
    ...(isLoggedIn
      ? [{ name: "My Orders", to: "/my-orders", icon: <Package size={18} /> }]
      : []),
    ...(isAdmin
      ? [{ name: "Admin", to: "/admin", icon: <Shield size={18} /> }]
      : []),
    ...(isDelivery
      ? [{ name: "Delivery Panel", to: "/delivery", icon: <Truck size={18} /> }]
      : []),
  ];

  const activeStyle = ({ isActive }) => ({
    color: isActive ? "var(--primary)" : "var(--text)",
    fontWeight: isActive ? 800 : 600,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "transform 0.15s ease, color 0.2s ease",
  });

  const handleLogout = () => {
    auth.logout();
    nav("/", { replace: true });
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="saka-nav" aria-label="Main navigation">
        <div className="saka-inner-edge">
          {/* LEFT: Brand */}
          <Link
            to="/"
            className="brand-edge"
            onClick={handleLinkClick}
            aria-label="SAKA home"
          >
            <div className="brand-text-wrap">
              <span className="saka">SAKA</span>
              <span className="brand-sub">Laundry · Dry Clean</span>
            </div>
          </Link>

          {/* RIGHT: Menu */}
          <div className="desktop-links-edge" role="navigation">
            <div className="desktop-links-list">
              {menuItems.map((m) => (
                <NavLink
                  key={m.name}
                  to={m.to}
                  style={activeStyle}
                  className="nav-link-edge clickable"
                >
                  <span className="menu-icon">{m.icon}</span>
                  <span>{m.name}</span>
                </NavLink>
              ))}
              <NavLink
                to="/orders"
                className="btn btn-primary desktop-cta-edge clickable"
              >
                <ShoppingCart size={16} style={{ marginRight: "8px" }} />
                <span>Book Order</span>
              </NavLink>
              {!isLoggedIn ? (
                <>
                  <NavLink
                    to="/login"
                    style={activeStyle}
                    className="nav-link-edge login-desktop clickable"
                  >
                    <LogIn size={16} style={{ marginRight: "6px" }} />
                    <span>Login</span>
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className="nav-link-edge signup-desktop-edge clickable"
                  >
                    <UserPlus size={16} style={{ marginRight: "6px" }} />
                    <span>Signup</span>
                  </NavLink>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="logout-btn-edge clickable"
                  aria-label="Logout"
                >
                  <LogOut size={16} style={{ marginRight: "6px" }} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* HAMBURGER */}
          <button
            className={`hamburger-svg ${isMenuOpen ? "open" : ""}`}
            onClick={() => setIsMenuOpen((s) => !s)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu-panel"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            type="button"
          >
            <svg viewBox="0 0 36 30" width="36" height="30">
              <rect className="hb-line l1" x="0" y="2" width="36" height="4" rx="2"></rect>
              <rect className="hb-line l2" x="0" y="13" width="36" height="4" rx="2"></rect>
              <rect className="hb-line l3" x="0" y="24" width="36" height="4" rx="2"></rect>
            </svg>
          </button>
        </div>
      </nav>

      {/* BACKDROP */}
      <div
        className={`menu-backdrop ${isMenuOpen ? "open" : ""}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* MOBILE MENU */}
      <aside
        id="mobile-menu-panel"
        ref={panelRef}
        className={`mobile-panel-card ${isMenuOpen ? "open" : ""}`}
        role="dialog"
      >
        <div className="mobile-panel-inner">
          <div className="mobile-panel-header">
            <div className="mobile-brand">
              <span className="saka">SAKA</span>
            </div>
            <button
              className="mobile-close"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              style={{
                background: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <ul className="mobile-menu-list">
            {menuItems.map((it) => (
              <li key={it.name} className="mobile-menu-item">
                <NavLink
                  to={it.to}
                  className="mobile-menu-link"
                  onClick={handleLinkClick}
                >
                  <span className="menu-icon">{it.icon}</span>
                  <span>{it.name}</span>
                </NavLink>
              </li>
            ))}
            <li className="mobile-menu-item">
              <NavLink
                to="/orders"
                className="mobile-cta"
                onClick={handleLinkClick}
              >
                <ShoppingCart size={16} />
                <span>Book Order</span>
              </NavLink>
            </li>
            <li className="mobile-menu-item">
              {!isLoggedIn ? (
                <div className="mobile-auth-row">
                  <NavLink
                    to="/login"
                    className="mobile-small-link"
                    onClick={handleLinkClick}
                  >
                    <LogIn size={16} />
                    <span>Login</span>
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className="mobile-signup-pill"
                    onClick={handleLinkClick}
                  >
                    <UserPlus size={16} />
                    <span>Signup</span>
                  </NavLink>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleLogout();
                    handleLinkClick();
                  }}
                  className="mobile-logout"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              )}
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
