import React from "react";

export default function ContactUs() {
  return (
    <div className="section" style={{ padding: "50px 20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Get in Touch</h1>

      {/* Contact Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
        <div>
          <h3>📞 Phone</h3>
          <p><a href="tel:+919121991113" style={{ color: "inherit", textDecoration: "none" }}>+91 98765 43210</a></p>

          <h3>✉️ Email</h3>
          <p><a href="mailto:sakafreshwash@gmail.com" style={{ color: "inherit", textDecoration: "none" }}>info@sakalaundry.com</a></p>

          <h3>📍 Address</h3>
          <p>123, kakinada,<br />banugudi</p>

          <h3>💬 WhatsApp</h3>
          <p><a href="https://wa.me/919121991113" target="_blank" rel="noreferrer">Chat on WhatsApp</a></p>
        </div>

        {/* Contact Form */}
        <div>
          <h3>Send us a Message</h3>
          <form
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            onSubmit={(e) => {
              e.preventDefault();
              alert("Message sent! We will get back to you soon.");
            }}
          >
            <input type="text" placeholder="Your Name" required style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
            <input type="email" placeholder="Your Email" required style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
            <textarea placeholder="Your Message" rows="4" required style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}></textarea>
            <button type="submit" style={{ padding: "12px", border: "none", borderRadius: "6px", background: "#007bff", color: "#fff", cursor: "pointer" }}>
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Google Map */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={{ textAlign: "center", marginBottom: "15px" }}>Find us on the Map</h3>
        <iframe
          title="Saka Laundry Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3681.123456789!2d75.857725!3d22.719568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fcf7a4a1b9a5%3A0x123456789abcdef!2sIndore!5e0!3m2!1sen!2sin!4v1633012345678!5m2!1sen!2sin"
          width="100%"
          height="300"
          style={{ border: 0, borderRadius: "10px" }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}
