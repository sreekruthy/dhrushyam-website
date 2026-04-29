// ─────────────────────────────────────────────
//  utils/jwt.js  —  JWT helper functions
//
//  We use TWO tokens:
//  • Access token  — short-lived (15 min), sent in
//    Authorization header with every request.
//  • Refresh token — long-lived (7 days), stored in
//    MongoDB AND returned to client. Used to silently
//    issue a new access token when it expires.
//
//  This pattern means stolen access tokens expire
//  quickly, and refresh tokens can be invalidated
//  server-side (logout from all devices).
// ─────────────────────────────────────────────
const jwt = require("jsonwebtoken");

/**
 * Generate a short-lived access token.
 * Payload contains userId and role — enough for
 * most middleware checks without a DB round-trip.
 */
const generateAccessToken = (userId, role = "user") => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
};

/**
 * Generate a long-lived refresh token.
 * Only contains userId — minimal payload to reduce
 * exposure if the token is ever compromised.
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );
};

/**
 * Verify an access token.
 * Returns the decoded payload or throws a jwt error.
 * The auth middleware uses this.
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify a refresh token.
 * Returns the decoded payload or throws a jwt error.
 * The refresh endpoint uses this.
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
