// client/src/App.jsx
import React, { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

/* Global styles */
import "./styles/responsive.css";
import "./styles/theme.css";
import "./styles/orders.css";

/* PAGES */
import Landing from "./pages/Landing.jsx";
import About from "./pages/About.jsx";
import ContactUs from "./pages/ContactUs.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";  // ✅ add import

const Orders = React.lazy(() => import("./pages/Orders.jsx"));
const MyOrders = React.lazy(() => import("./pages/MyOrders.jsx"));
import Admin from "./pages/Admin.jsx";

/* COMPONENTS / GUARDS */
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Protected from "./components/Protected.jsx";
import AdminOnly from "./components/AdminOnly.jsx";

/* ----------------- Session Expiry ----------------- */
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
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("authExpiry");
        } catch {}
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
        try {
          localStorage.removeItem("authExpiry");
        } catch {}
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

/* ----------------- MAIN APP ----------------- */
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
            <Route path="/forgot-password" element={<Page><ForgotPassword /></Page>} /> {/* ✅ Added */}

            <Route
              path="/profile"
              element={
                <Protected>
                  <Page>
                    <div className="layout-box responsive-block"><Profile /></div>
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
                        <Suspense fallback={<div className="card">Loading orders…</div>}>
                          <Orders />
                        </Suspense>
                      </div>
                    </div>
                  </Page>
                </Protected>
              }
            />

            <Route
              path="/my-orders"
              element={
                <Protected>
                  <Page>
                    <div className="layout-box">
                      <div className="table-wrap">
                        <Suspense fallback={<div className="card">Loading your orders…</div>}>
                          <MyOrders />
                        </Suspense>
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
                    <div className="layout-box"><Admin /></div>
                  </Page>
                </AdminOnly>
              }
            />

            {/* wildcard LAST */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </section>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
