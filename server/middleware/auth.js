// server/middleware/auth.js
import jwt from "jsonwebtoken";
import crypto from "crypto";

// fingerprint helper (logs 8 chars of SHA-256 for debugging; safe to keep)
const fp = (s) => crypto.createHash("sha256").update(String(s || "")).digest("hex").slice(0, 8);

/** Require Bearer token; attaches payload to req.user */
export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    console.warn("AUTH ❌ no token. authorization header:", header);
    return res.status(401).json({ error: "No access token", code: "no_token" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("AUTH ❌ JWT_SECRET missing");
      return res.status(500).json({ error: "Server auth misconfigured" });
    }

    console.log("VERIFY using JWT_SECRET fingerprint:", fp(secret));
    const payload = jwt.verify(token, secret); // { id, role, name, iat, exp }
    req.user = payload;
    return next();
  } catch (err) {
    console.warn("AUTH ❌ verify failed:", err?.name, err?.message);
    return res.status(401).json({
      error: err?.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
      code: err?.name === "TokenExpiredError" ? "token_expired" : "invalid_token",
    });
  }
}
