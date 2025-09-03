import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  FaUserPlus,
} from "react-icons/fa";

export default function Footer() {
  const location = useLocation();

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
      <div className="footer-container">
        {/* Contact Info */}
        <div className="footer-contact">
          <h3 style={{ marginBottom: "12px" }}>Contact Us</h3>
          <p>
            <FaPhoneAlt style={{ marginRight: "8px", color: "#25D366" }} />
            <a
              href="tel:+919121991113"
              style={{ color: "#111", textDecoration: "none" }}
            >
              +91 9121991113
            </a>
          </p>
          <p>
            <FaEnvelope style={{ marginRight: "8px", color: "#e63946" }} />
            <a
              href="mailto:sakafreshwash@gmail.com"
              style={{ color: "#111", textDecoration: "none" }}
            >
              sakafreshwash@gmail.com
            </a>
          </p>
          <p style={{ color: "#111", fontWeight: "500" }}>
            <FaMapMarkerAlt style={{ marginRight: "8px", color: "#0077b6" }} />
            Kakinada, Andhra Pradesh
          </p>

          {/* Social Links */}
          <div
            style={{
              marginTop: "15px",
              display: "flex",
              gap: "15px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://facebook.com/sakalaundrysolutions"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#3b5998", fontSize: "20px" }}
            >
              <FaFacebook />
            </a>
            <a
              href="https://instagram.com/sakalaundrysolutions"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#E4405F", fontSize: "20px" }}
            >
              <FaInstagram />
            </a>
            <a
              href="https://twitter.com/sakalaundrysolutions"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#1DA1F2", fontSize: "20px" }}
            >
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
          <ul>
            <li>
              <Link to="/about">
                <FaInfoCircle /> <span>About Us</span>
              </Link>
            </li>
            <li>
              <Link to="/orders">
                <FaShoppingCart /> <span>My Orders</span>
              </Link>
            </li>
            <li>
              <Link to="/login">
                <FaSignInAlt /> <span>Login</span>
              </Link>
            </li>
            <li>
              <Link to="/signup">
                <FaUserPlus /> <span>Signup</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* ✅ Floating Buttons (hide on login, signup & orders) */}
      {location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/orders" && (
          <div className="floating-buttons">
            {/* Call Button */}
            <div className="tooltip-container call-tooltip">
              <a href="tel:+919121991113" className="floating-btn call-btn">
                <FaPhoneAlt />
              </a>
              <span className="tooltip-text">📞 Call Us</span>
            </div>

            {/* WhatsApp Button */}
            <div className="tooltip-container whatsapp-tooltip">
              <a
                href="https://wa.me/919121991113"
                target="_blank"
                rel="noreferrer"
                className="floating-btn whatsapp-btn"
              >
                <FaWhatsapp />
              </a>
              <span className="tooltip-text">💬 Chat on WhatsApp</span>
            </div>
          </div>
        )}

      {/* ✅ Styles */}
      <style>
        {`
          .footer-container {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            gap: 30px;
            justify-content: space-between;
            align-items: flex-start;
          }
          .footer-links ul {
            list-style: none;
            padding: 0;
            margin: 0;
            line-height: 2;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .footer-links ul li a {
            color: #111;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: 0.2s;
          }
          .footer-links ul li a:hover {
            color: #007bff;
          }

          /* ✅ Mobile: stack Contact Us & Quick Links */
          @media (max-width: 768px) {
            .footer-container {
              flex-direction: column;
              text-align: center;
              gap: 40px;
            }
            .footer-links {
              margin-top: 20px;
            }
            .footer-links ul {
              align-items: center;
            }
            /* ✅ On mobile: icons above text */
            .footer-links ul li a {
              flex-direction: column;
              font-size: 15px;
            }
            .footer-links ul li a span {
              margin-top: 5px;
            }
          }

          /* Floating buttons */
          .floating-buttons {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          .floating-btn {
            width: 55px;
            height: 55px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 24px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            text-decoration: none;
            transition: transform 0.2s ease;
          }
          .floating-btn:hover {
            transform: scale(1.1);
          }
          .call-btn {
            background-color: #007bff;
          }
          .call-btn:hover {
            background-color: #0056b3;
          }
          .whatsapp-btn {
            background-color: #25D366;
            font-size: 28px;
          }
          .whatsapp-btn:hover {
            background-color: #128c7e;
          }

          /* ✅ Tooltips (desktop only) */
          .tooltip-container {
            position: relative;
            display: inline-block;
          }
          .tooltip-text {
            visibility: hidden;
            background-color: #000;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px 8px;
            position: absolute;
            right: 70px;
            top: 50%;
            transform: translateY(-50%) translateX(-10px);
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            font-size: 13px;
            white-space: nowrap;
          }
          .tooltip-container:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }

          /* ✅ Mobile: hide tooltips, only icons */
          @media (max-width: 768px) {
            .tooltip-text {
              display: none !important;
            }
          }
        `}
      </style>
    </footer>
  );
}
