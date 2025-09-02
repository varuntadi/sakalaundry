import React, { useEffect, useMemo, useState } from "react";

/** CONFIG **/
const LOGO_SRC = "/img/sakalogo.jpg";                 // put file in /public/img/
const TAGLINE  = "Where purity meets flow";
const DURATION_MS = 2800;                              // total time before auto-hide
const SHOW_ONCE_PER_SESSION = true;

export default function Splash({ onDone }) {
  const [show, setShow] = useState(
    () => SHOW_ONCE_PER_SESSION ? sessionStorage.getItem("splash_seen") !== "1" : true
  );
  const [loaded, setLoaded] = useState(false);

  const reduced = useMemo(() => {
    if (!window?.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // preload logo
  useEffect(() => {
    const img = new Image();
    img.src = LOGO_SRC;
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
  }, []);

  useEffect(() => {
    if (!show || !loaded) return;
    const tFade = setTimeout(() => {
      document.documentElement.classList.add("splash-out");
    }, Math.max(0, DURATION_MS - 650));

    const tDone = setTimeout(() => {
      if (SHOW_ONCE_PER_SESSION) sessionStorage.setItem("splash_seen", "1");
      document.documentElement.classList.remove("splash-out");
      setShow(false);
      onDone?.();
    }, reduced ? 1000 : DURATION_MS);

    return () => {
      clearTimeout(tFade);
      clearTimeout(tDone);
      document.documentElement.classList.remove("splash-out");
    };
  }, [show, loaded, reduced, onDone]);

  if (!show) return null;

  return (
    <div className="splash-pro" role="dialog" aria-modal="true" aria-label="Welcome to SAKA">
      {!reduced &&
        Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="splash-particle"
            style={{
              left: `${(i * 9 + 8) % 95}%`,
              animationDuration: `${6 + (i % 7)}s`,
              animationDelay: `${(i % 5) * 0.25}s`,
            }}
          />
        ))}

      <div className="splash-stack">
        <div className={`logo-wrap ${reduced ? "no-anim" : ""}`}>
          <img src={LOGO_SRC} alt="SAKA Laundry logo" className="splash-logo" draggable="false" />
          {!reduced && <div className="logo-ripple" aria-hidden="true" />}
        </div>

        <p className="splash-tagline">{TAGLINE}</p>

        <div className="splash-bar" aria-hidden="true">
          <div className="splash-fill" />
        </div>
      </div>
    </div>
  );
}
