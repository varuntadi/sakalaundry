import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./styles/responsive.css";

// 🔧 Disable any previously installed service workers (prevents API "Network Error")
if ("serviceWorker" in navigator) {
  // Unregister all existing SWs and clear caches
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(reg => reg.unregister()))
    .catch(() => {});
  if (window.caches?.keys) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ❌ Do NOT register a service worker anymore
// (If you want PWA later, use the safe SW in option B)
