// client/src/components/Protected.jsx
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../auth";

export default function Protected({ roles, children }) {
  const token = auth.token;
  const user = auth.user;
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login?reason=session_expired" state={{ from: location }} replace />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
