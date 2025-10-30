// client/src/pages/PrivacyPolicy.jsx
import React from "react";

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        padding: "40px 20px",
        maxWidth: "900px",
        margin: "0 auto",
        color: "#222",
        lineHeight: "1.7",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#007bff" }}>
        Privacy Policy
      </h1>

      <p>
        Welcome to <strong>Saka Laundry</strong>. Your privacy is important to us.
        This policy describes how we collect, use, and protect your personal information
        when you use our services or visit our website <b>(www.sakalaundry.in)</b>.
      </p>

      <h3>1. Information We Collect</h3>
      <p>We may collect the following information to provide better service:</p>
      <ul>
        <li>Full name, phone number, and email address</li>
        <li>Pickup and delivery address</li>
        <li>Payment details (processed securely via trusted partners)</li>
        <li>Order history and preferences</li>
      </ul>

      <h3>2. How We Use Your Information</h3>
      <ul>
        <li>To process and deliver laundry orders efficiently</li>
        <li>To communicate updates or offers related to your orders</li>
        <li>To improve our services and website experience</li>
      </ul>

      <h3>3. Data Security</h3>
      <p>
        Your personal data is securely stored and used only for service-related purposes.
        We do not sell or share your information with third parties except payment gateways
        or logistics partners required to fulfill your orders.
      </p>

      <h3>4. Cookies</h3>
      <p>
        Our website may use cookies to enhance your browsing experience. You can disable cookies
        anytime in your browser settings.
      </p>

      <h3>5. Contact Us</h3>
      <p>
        If you have any questions about this Privacy Policy, feel free to contact us:
      </p>
      <ul>
        <li>Email: <a href="mailto:sakafreshwash@gmail.com">sakafreshwash@gmail.com</a></li>
        <li>Phone: <a href="tel:+919121991113">+91 9121991113</a></li>
      </ul>

      <p style={{ marginTop: "40px", fontSize: "14px", color: "#555" }}>
        Last updated: <strong>October 30, 2025</strong>
      </p>
    </div>
  );
}
