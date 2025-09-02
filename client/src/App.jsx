// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/responsive.css";
import "./styles/theme.css";

/* PAGES */
import Landing from "./pages/Landing.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import Orders from "./pages/Orders.jsx";
import Admin from "./pages/Admin.jsx";
import ContactUs from "./pages/contactUs.jsx";   // ✅ added import

/* COMPONENTS / GUARDS */
import Nav from "./components/nav.jsx";
import Footer from "./components/Footer.jsx";
import Protected from "./components/protected.jsx";
import AdminOnly from "./components/adminonly.jsx";

function Page({ children, full = false }) {
  return full ? <>{children}</> : <div className="container">{children}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main>
        <section className="section">
          <Routes>
            <Route path="/" element={<Page full><Landing /></Page>} />
            <Route path="/about" element={<Page full><About /></Page>} />
            <Route path="/contact" element={<Page full><ContactUs /></Page>} />   {/* ✅ new Contact route */}

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
