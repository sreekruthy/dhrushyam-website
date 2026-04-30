// ──────────────────────────────────────────────────────────────
//  server.js  —  Express app entry point
//  Boots the server, mounts all routes, and
//  connects to MongoDB via Mongoose.
// ──────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth.routes");
const videoRoutes = require("./routes/video.routes");
const commentRoutes = require("./routes/comments");
const recommendationRoutes = require("./routes/recommendations");

const app = express();

// ── Environment validation ──────────────────────────────────
const requiredEnv = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "CLIENT_URL"];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`❌ Missing required env variables: ${missing.join(", ")}`);
  process.exit(1);
}

// ── Middleware ──────────────────────────────────────────────
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "https://hlsjs.video-dev.org",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files for HLS segments (with CORS header for external players)
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Health check
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", ts: Date.now() })
);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.stack || err.message);
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ success: false, message });
});

// ── Graceful shutdown ──────────────────────────────────────
let server;
const shutdown = async () => {
  console.log("\n🛑 Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("👋 HTTP server closed");
    });
  }
  try {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
    console.log("📦 MongoDB disconnected");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`🎬 Dhrushyam server running on port ${PORT}`);
      console.log(`📁 Serving uploads from: ${path.join(__dirname, "uploads")}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();