// server/middleware/auth.js
import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  // Accept cookie OR Authorization header (Bearer) for backwards compatibility
  const cookieToken = req.cookies?.access_token;
  const header = req.headers.authorization || "";
  const headerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ error: "No access token", code: "no_token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired", code: "token_expired" });
    }
    return res.status(401).json({ error: "Invalid token", code: "invalid_token" });
  }
}
