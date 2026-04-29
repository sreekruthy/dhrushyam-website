// ─────────────────────────────────────────────
//  routes/video.routes.js
//  All routes are prefixed with /api/videos in server.js
// ─────────────────────────────────────────────
const router = require("express").Router();
const { protect, optionalAuth } = require("../middleware/auth.middleware");
const { uploadChunk } = require("../middleware/upload.middleware");
const {
  initUpload,
  receiveChunk,
  finalizeUpload,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleLike,
  toggleDislike,
  incrementView,
} = require("../controllers/video.controller");

// ── Chunked upload flow (all protected) ───────
router.post("/init-upload", protect, initUpload);
router.post("/chunk", protect, uploadChunk, receiveChunk);  // Multer runs first
router.post("/finalize", protect, finalizeUpload);

// ── Standard CRUD ─────────────────────────────
router.get("/", optionalAuth, getAllVideos);          // feed — public
router.get("/:id", optionalAuth, getVideoById);      // detail — public, extras if authed
router.put("/:id", protect, updateVideo);            // edit — owner only
router.delete("/:id", protect, deleteVideo);         // delete — owner or admin

// ── Engagement ────────────────────────────────
router.post("/:id/like", protect, toggleLike);
router.post("/:id/dislike", protect, toggleDislike);
router.post("/:id/view", incrementView);             // public — no auth needed to count views

module.exports = router;
