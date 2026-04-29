// ─────────────────────────────────────────────
//  routes/auth.routes.js
//  All routes are prefixed with /api/auth in server.js
// ─────────────────────────────────────────────
const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateMe,
  changePassword,
} = require("../controllers/auth.controller");

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);

// Protected
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
