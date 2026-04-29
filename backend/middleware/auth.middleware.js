// ─────────────────────────────────────────────
//  middleware/auth.middleware.js
//  Full JWT verification, user attachment, admin guard
// ─────────────────────────────────────────────
const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");

/**
 * Protect middleware – rejects unauthenticated requests.
 * Attaches full user object to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token, authorisation denied" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token); // throws if invalid/expired

    const user = await User.findById(decoded.userId).select("-password -refreshTokens");
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/**
 * Optional auth – does not block anonymous users.
 * Sets req.user if a valid token exists.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select("-password -refreshTokens");
      if (user && user.isActive) req.user = user;
    }
  } catch {
    // Ignore errors – anonymous browsing allowed
  }
  next();
};

/**
 * Admin guard – use AFTER protect.
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

module.exports = { protect, optionalAuth, adminOnly };