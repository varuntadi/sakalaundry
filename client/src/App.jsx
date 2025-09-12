// client/src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./styles/responsive.css";
import "./styles/theme.css";

/* PAGES â€” use actual filenames (case-sensitive on Linux). 
   I'm using lowercase filenames (landing.jsx, about.jsx, login.jsx, etc.)
   â€” change these if your files are PascalCase. */
import Landing from "./pages/Landing.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import Orders from "./pages/Orders.jsx";
import Admin from "./pages/Admin.jsx";
import ContactUs from "./pages/ContactUs.jsx";

/* COMPONENTS / GUARDS */
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Protected from "./components/Protected.jsx";
import AdminOnly from "./components/AdminOnly.jsx";

/**
 * AppExpiryHandler
 * - Reads authExpiry from localStorage.
 * - If expired: clears auth and navigates to /login?reason=session_expired.
 * - Otherwise sets a timeout to expire exactly when authExpiry arrives.
 * - Also listens to 'storage' events so other tabs can trigger logout/redirect.
 */
function AppExpiryHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId = null;

    function scheduleOrCheck() {
      try {
        const raw = localStorage.getItem("authExpiry");
        if (!raw) return;
        const expiry = Number(raw);
        if (!expiry || Number.isNaN(expiry)) {
          localStorage.removeItem("token");
          localStorage.removeItem("authExpiry");
          navigate("/login?reason=session_expired", { replace: true });
          return;
        }

        const timeLeft = expiry - Date.now();
        if (timeLeft <= 0) {
          localStorage.removeItem("token");
          localStorage.removeItem("authExpiry");
          navigate("/login?reason=session_expired", { replace: true });
          return;
        }

        timeoutId = setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("authExpiry");
          navigate("/login?reason=session_expired", { replace: true });
        }, timeLeft);
      } catch (e) {
        try { localStorage.removeItem("token"); localStorage.removeItem("authExpiry"); } catch {}
        navigate("/login?reason=session_expired", { replace: true });
      }
    }

    scheduleOrCheck();

    function onStorage(e) {
      if (e.key === "authExpiry") {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        scheduleOrCheck();
      }
      if (e.key === "token" && e.newValue === null) {
        try { localStorage.removeItem("authExpiry"); } catch {}
        navigate("/login?reason=session_expired", { replace: true });
      }
    }

    window.addEventListener("storage", onStorage);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("storage", onStorage);
    };
  }, [navigate]);

  return null;
}

function Page({ children, full = false }) {
  return full ? <>{children}</> : <div className="container">{children}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppExpiryHandler />
      <Nav />
      <main>
        <section className="section">
          <Routes>
            <Route path="/" element={<Page full><Landing /></Page>} />
            <Route path="/about" element={<Page full><About /></Page>} />
            <Route path="/contact" element={<Page full><ContactUs /></Page>} />

            <Route path="/login" element={<Page><Login /></Page>} />
            <Route path="/signup" element={<Page><Signup /></Page>} />

            <Route
              path="/profile"
              element={
                <Protected>
                  <Page>
                    <div className="layout-box responsive-block">
                      <Profile />
                    </div>
                  </Page>
                </Protected>
              }
            />

            <Route
              path="/orders"
              element={
                <Protected>
                  <Page>
                    <div className="layout-box">
                      <div className="table-wrap">
                        <Orders />
                      </div>
                    </div>
                  </Page>
                </Protected>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminOnly>
                  <Page>
                    <div className="layout-box">
                      <Admin />
                    </div>
                  </Page>
                </AdminOnly>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </section>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
