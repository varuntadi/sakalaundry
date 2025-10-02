// client/src/components/AdminOnly.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { auth } from "../auth";

export default function AdminOnly({ children }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (auth.isAdmin) {
      setIsAdmin(true);
      setChecking(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const r = await api.get("/profile");
        if (mounted) setIsAdmin(r.data?.role === "admin" || r.data?.user?.role === "admin");
      } catch {
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (checking) return <div>Checking admin…</div>;
  if (!isAdmin) return <Navigate to="/orders" replace />;
  return children;
}
