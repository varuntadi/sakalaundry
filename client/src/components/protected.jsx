import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../auth";

export default function Protected({ children }) {
  if (!auth.isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}
