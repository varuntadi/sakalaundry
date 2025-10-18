import React from "react";

export default function ContactUs() {
  return (
    <div
      className="section"
      style={{ padding: "50px 20px", maxWidth: "900px", margin: "0 auto" }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Get in Touch</h1>

      {/* Contact Info Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {/* Left Side - Info */}
        <div>
          <h3>📞 Phone</h3>
          <p>
            <a
              href="tel:+91-9121991113"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              +919121991113
            </a>
          </p>

          <h3>✉️ Email</h3>
          <p>
            <a
              href="mailto:sakafreshwash@gmail.com"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              sakafreshwash@gmail.com
            </a>
          </p>

          <h3>📍 Office Address</h3>
          <p>
            1st Floor, Indian Bank Building, Kokila Center, Bhaskar Nagar Rd,
            <br />
            Bhanugudi Junction, Kakinada, Andhra Pradesh 533003
          </p>

          <h3>💬 WhatsApp</h3>
          <p>
            <a
              href="https://wa.me/919121991113"
              target="_blank"
              rel="noreferrer"
            >
              Chat on WhatsApp
            </a>
          </p>
        </div>

        {/* Right Side - Contact Form */}
        <div>
          <h3>Send us a Message</h3>
          <form
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            onSubmit={(e) => {
              e.preventDefault();
              alert("Message sent! We will get back to you soon.");
            }}
          >
            <input
              type="text"
              placeholder="Your Name"
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <input
              type="email"
              placeholder="Your Email"
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <textarea
              placeholder="Your Message"
              rows="4"
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            ></textarea>
            <button
              type="submit"
              style={{
                padding: "12px",
                border: "none",
                borderRadius: "6px",
                background: "#007bff",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Google Map */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={{ textAlign: "center", marginBottom: "15px" }}>
          Find us on the Map
        </h3>

        {/* Clickable Map with Saka Laundry marker + hover effect */}
        <a
          href="https://www.google.com/maps/place/Saka+Laundry,+1st+Floor,+Indian+Bank+Building,+Kokila+Center,+Bhaskar+Nagar+Rd,+Bhanugudi+Junction,+Kakinada,+Andhra+Pradesh+533003/@16.989869,82.234685,19z"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            borderRadius: "15px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
          }}
        >
          <iframe
            title="Saka Laundry Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3808.4158157069415!2d82.23468507509374!3d16.98986908409519!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3827db0e7f0e47%3A0x2f3c68a1efc86cfb!2sSaka%20Laundry!5e0!3m2!1sen!2sin!4v1733967890000!5m2!1sen!2sin"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </a>

        {/* View on Google Maps Button */}
        <div style={{ textAlign: "center", marginTop: 15 }}>
          <a
            href="https://maps.app.goo.gl/TFrtPxz7EvxT2LCq6"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: "8px",
              background: "#1a73e8",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            }}
          >
            View on Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
