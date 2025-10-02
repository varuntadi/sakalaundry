// server/middleware/requireAdmin.js

/**
 * Middleware: requireAdmin
 * Checks if the logged-in user has role === "admin"
 */
export default function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}
