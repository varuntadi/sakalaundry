import React from "react";
import { Link, useLocation } from "react-router-dom";  // ✅ import useLocation
import { 
  FaPhoneAlt, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaFacebook, 
  FaInstagram, 
  FaTwitter, 
  FaWhatsapp, 
  FaInfoCircle, 
  FaShoppingCart, 
  FaSignInAlt, 
  FaUserPlus 
} from "react-icons/fa";

export default function Footer() {
  const location = useLocation(); // ✅ get current route

  return (
    <footer
      style={{
        background: "#f9f9f9",
        color: "#111",
        padding: "40px 20px",
        marginTop: "40px",
        position: "relative",
        borderTop: "1px solid #ddd",
      }}
    >
      <div
        className="footer-container"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          gap: "30px",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Contact Info */}
        <div className="footer-contact">
          <h3 style={{ marginBottom: "12px" }}>Contact Us</h3>
          <p>
            <FaPhoneAlt style={{ marginRight: "8px", color: "#25D366" }} />
            <a href="tel:+919121991113" style={{ color: "#111", textDecoration: "none" }}>
              +91 9121991113
            </a>
          </p>
          <p>
            <FaEnvelope style={{ marginRight: "8px", color: "#e63946" }} />
            <a href="mailto:sakafreshwash@gmail.com" style={{ color: "#111", textDecoration: "none" }}>
              sakafreshwash@gmail.com
            </a>
          </p>
          <p style={{ color: "#111", fontWeight: "500" }}>
            <FaMapMarkerAlt style={{ marginRight: "8px", color: "#0077b6" }} />
            Kakinada, Andhra Pradesh
          </p>

          {/* Social Links */}
          <div style={{ marginTop: "15px", display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://facebook.com/sakalaundrysolutions" target="_blank" rel="noreferrer" style={{ color: "#3b5998", fontSize: "20px" }}>
              <FaFacebook />
            </a>
            <a href="https://instagram.com/sakalaundrysolutions" target="_blank" rel="noreferrer" style={{ color: "#E4405F", fontSize: "20px" }}>
              <FaInstagram />
            </a>
            <a href="https://twitter.com/sakalaundrysolutions" target="_blank" rel="noreferrer" style={{ color: "#1DA1F2", fontSize: "20px" }}>
              <FaTwitter />
            </a>
          </div>

          {/* Google Map */}
          <div style={{ marginTop: "20px" }}>
            <iframe
              title="Saka Laundry Location - Kakinada"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3826.458835791064!2d82.24746421469358!3d16.989064288352457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a38282b6f2f1c6f%3A0x1a39edb98c2c3a0a!2sKakinada%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1693489398371!5m2!1sen!2sin"
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: "10px" }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h3 style={{ marginBottom: "12px" }}>Quick Links</h3>
          <ul style={{ 
            listStyle: "none", 
            padding: 0, 
            margin: 0, 
            lineHeight: "2", 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px" 
          }}>
            <li>
              <Link to="/about" style={{ color: "#111", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaInfoCircle /> About Us
              </Link>
            </li>
            <li>
              <Link to="/orders" style={{ color: "#111", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaShoppingCart /> My Orders
              </Link>
            </li>
            <li>
              <Link to="/login" style={{ color: "#111", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaSignInAlt /> Login
              </Link>
            </li>
            <li>
              <Link to="/signup" style={{ color: "#111", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaUserPlus /> Signup
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* ✅ Floating WhatsApp Button (hide if on /orders page) */}
      {location.pathname !== "/orders" && (
        <a
          href="https://wa.me/919121991113"
          target="_blank"
          rel="noreferrer"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#25D366",
            color: "#fff",
            borderRadius: "50%",
            width: "55px",
            height: "55px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            zIndex: 1000,
            textDecoration: "none",
          }}
        >
          <FaWhatsapp />
        </a>
      )}

      {/* ✅ Responsive CSS */}
      <style>
        {`
          @media (max-width: 768px) {
            .footer-container {
              flex-direction: column;
              text-align: center;
            }
            .footer-links {
              margin-top: 30px;
            }
            .footer-links ul {
              align-items: center;
            }
          }
        `}
      </style>
    </footer>
  );
}
