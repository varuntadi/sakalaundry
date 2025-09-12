import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";

export default function AdminOnly({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.get("/profile");
        if (mounted) setIsAdmin(r.data?.role === "admin");
      } catch {
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (loading) return <div>Checking admin…</div>;
  if (!isAdmin) return <Navigate to="/orders" replace />;
  return children;
}
