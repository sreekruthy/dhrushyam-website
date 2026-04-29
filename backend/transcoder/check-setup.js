// ──────────────────────────────────────────────────────────────────────────
//  transcoder/check-setup.js  —  Pre-flight system check
//
//  Run this BEFORE starting the worker to verify everything is in place:
//    node check-setup.js
// ──────────────────────────────────────────────────────────────────────────

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const ffmpeg = require("fluent-ffmpeg");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

let allPassed = true;

function pass(msg)  { console.log(`  ✅  ${msg}`); }
function fail(msg)  { console.log(`  ❌  ${msg}`); allPassed = false; }
function warn(msg)  { console.log(`  ⚠️   ${msg}`); }
function header(msg){ console.log(`\n${msg}\n${"─".repeat(40)}`); }

async function run() {
  console.log("━".repeat(50));
  console.log("🔍  Dhrushyam Transcoder — Setup Check");
  console.log("━".repeat(50));

  // ── 1. FFmpeg ─────────────────────────────────────────────────────────
  header("1. FFmpeg");
  await new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        fail(`FFmpeg not found: ${err.message}`);
        fail("Install it: sudo apt install ffmpeg  OR  brew install ffmpeg");
      } else {
        const hasHLS = !!formats["hls"];
        if (hasHLS) pass("FFmpeg found with HLS support");
        else warn("FFmpeg found but HLS format not listed (may still work)");
      }
      resolve();
    });
  });

  await new Promise((resolve) => {
    ffmpeg.getAvailableCodecs((err, codecs) => {
      if (!err) {
        if (codecs["libx264"]) pass("libx264 codec available");
        else warn("libx264 not found — H.264 encoding may fail");
        if (codecs["aac"]) pass("AAC audio codec available");
        else warn("AAC codec not found — audio encoding may fail");
      }
      resolve();
    });
  });

  // ── 2. Environment variables ──────────────────────────────────────────
  header("2. Environment Variables (.env)");
  const required = ["MONGO_URI", "HLS_DIR", "THUMB_DIR", "UPLOAD_DIR"];
  for (const key of required) {
    if (process.env[key]) pass(`${key} is set`);
    else fail(`${key} is NOT set in .env`);
  }

  // ── 3. MongoDB connection ─────────────────────────────────────────────
  header("3. MongoDB Atlas Connection");
  if (!process.env.MONGO_URI) {
    fail("Cannot test — MONGO_URI not set");
  } else {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      pass(`Connected to: ${mongoose.connection.host}`);
      await mongoose.disconnect();
    } catch (err) {
      fail(`MongoDB connection failed: ${err.message}`);
    }
  }

  // ── 4. Directory access ────────────────────────────────────────────────
  header("4. Upload Directories");
  const dirs = [
    process.env.UPLOAD_DIR  || "../uploads/raw",
    process.env.HLS_DIR     || "../uploads/hls",
    process.env.THUMB_DIR   || "../uploads/thumbnails",
    "../uploads/jobs",
    "../uploads/chunks",
  ];

  for (const dir of dirs) {
    const resolved = path.resolve(__dirname, dir);
    try {
      fs.mkdirSync(resolved, { recursive: true });
      fs.accessSync(resolved, fs.constants.W_OK);
      pass(`Writable: ${resolved}`);
    } catch {
      fail(`Not writable: ${resolved}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n" + "━".repeat(50));
  if (allPassed) {
    console.log("🎉  All checks passed! Run: npm start");
  } else {
    console.log("❗  Some checks failed. Fix the issues above before starting the worker.");
    process.exit(1);
  }
  console.log("━".repeat(50) + "\n");
}

run().catch((err) => {
  console.error("Unexpected error during setup check:", err);
  process.exit(1);
});
