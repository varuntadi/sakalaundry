import React, { useEffect, useState } from "react";

const DURATION_MS = 2800; // total time splash is visible

export default function Splash({ onDone }) {
  const [show, setShow] = useState(
    sessionStorage.getItem("splash_seen") !== "1"
  );

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      sessionStorage.setItem("splash_seen", "1");
      setShow(false);
      onDone?.();
    }, DURATION_MS);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div className="splash-root" role="dialog" aria-modal="true" aria-label="Welcome to SAKA">
      <div className="splash-content">
        {/* Waves behind the logo */}
        <div className="splash-waves" aria-hidden="true">
          {/* back wave */}
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="wave wave-back">
            <path d="M0,120 C150,60 300,180 450,120 C600,60 750,120 900,100 C1050,80 1200,120 1200,120 L1200,200 L0,200 Z" />
          </svg>
          {/* front wave */}
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="wave wave-front">
            <path d="M0,140 C180,80 340,180 520,120 C700,60 880,140 1040,110 C1160,90 1200,120 1200,120 L1200,200 L0,200 Z" />
          </svg>
        </div>

        {/* Logo + tagline */}
        <img src="/img/
        sakalogo.jpg" alt="Saka Laundry Logo" className="splash-logo" />
        <p className="splash-tagline">Where Purity Meets Flow</p>

        {/* Progress bar */}
        <div className="splash-bar" aria-hidden="true">
          <div className="splash-fill" />
        </div>
      </div>
    </div>
  );
}
