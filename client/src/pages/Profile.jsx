import React, { useEffect, useState } from "react";
import api from "../api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get("/profile")
      .then((r) => setUser(r.data))
      .catch((e) => setErr(e?.response?.data?.error || "Failed"));
  }, []);

  // Error state
  if (err)
    return (
      <div className="container">
        <div className="layout-box error-box">❌ {err}</div>
      </div>
    );

  // Loading state
  if (!user)
    return (
      <div className="container">
        <div className="layout-box loading-box">Loading profile…</div>
      </div>
    );

  // Loaded profile
  return (
    <div className="container">
      <h2 className="section-title">My Profile</h2>
      <div className="layout-box profile-box">
        <div className="profile-grid">
          <div><strong>Name:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          {user.role && <div><strong>Role:</strong> {user.role}</div>}
          <div className="helper">User ID: {user._id}</div>
        </div>
      </div>
    </div>
  );
}