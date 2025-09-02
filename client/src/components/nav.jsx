import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { auth } from "../auth";
import logo from "../assets/sakalogo.jpg"; // ✅ make sure logo is inside src/assets

export default function Nav() {
  const nav = useNavigate();
  const isLoggedIn = !!auth.isLoggedIn;

  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav
      style={{
        position: "sticky", // navbar stays on top
        top: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        background: "#fff",
        borderBottom: "1px solid #eee",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Logo + brand */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#111",
        }}
      >
        <img src={logo} alt="Saka Laundry" style={{ height: 40 }} />
        <span>SAKA Laundry</span>
      </Link>

      {/* Desktop Links */}
      <div className="desktop-links" style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <NavLink to="/about" className="nav-link">About Us</NavLink>
        <NavLink to="/contact" className="nav-link">Contact</NavLink>
        <NavLink to="/admin" className="nav-link">Admin</NavLink>

        {/* ✅ Book Order button */}
        <NavLink 
          to="/orders" 
          className="btn-primary" 
          style={{ padding: "8px 14px", borderRadius: "6px" }}
        >
          Book Order
        </NavLink>

        {!isLoggedIn ? (
          <>
            <NavLink to="/login" className="nav-link">Login</NavLink>
            <NavLink to="/signup" className="btn-outline">Signup</NavLink>
          </>
        ) : (
          <button
            onClick={() => {
              auth.logout();
              nav("/");
            }}
            className="nav-link"
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Hamburger for mobile */}
      <button
        onClick={() => setMenuOpen(!isMenuOpen)}
        className="mobile-toggle"
        style={{
          display: "none", // hidden by default, CSS will show on mobile
          background: "none",
          border: "none",
          fontSize: 26,
          cursor: "pointer",
        }}
      >
        ☰
      </button>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div
          className="mobile-menu"
          style={{
            position: "absolute",
            top: 64,
            right: 16,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <NavLink to="/about" onClick={handleLinkClick}>About Us</NavLink>
          <NavLink to="/contact" onClick={handleLinkClick}>Contact</NavLink>
          <NavLink to="/admin" onClick={handleLinkClick}>Admin</NavLink>

          {/* ✅ Book Order button in mobile menu */}
          <NavLink 
            to="/orders" 
            className="btn-primary" 
            onClick={handleLinkClick}
            style={{ padding: "8px 14px", borderRadius: "6px", textAlign: "center" }}
          >
            Book Order
          </NavLink>

          {!isLoggedIn ? (
            <>
              <NavLink to="/login" onClick={handleLinkClick}>Login</NavLink>
              <NavLink to="/signup" className="btn-outline" onClick={handleLinkClick}>
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
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
