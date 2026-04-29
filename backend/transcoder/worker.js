// ──────────────────────────────────────────────────────────────────────────
//  transcoder/worker.js  —  Member 3: FFmpeg HLS Transcoding Worker
//
//  WHAT THIS DOES:
//  ┌─────────────────────────────────────────────────────────────────────┐
//  │  1. Polls ./uploads/jobs/ every 3 seconds for new .json job files   │
//  │  2. For each job: runs FFmpeg to produce HLS at 4 quality levels    │
//  │  3. Extracts thumbnail at 5% mark via ffprobe + ffmpeg              │
//  │  4. Gets video duration via ffprobe                                 │
//  │  5. Writes master.m3u8 playlist referencing all quality streams     │
//  │  6. Updates MongoDB Video doc: hlsPath, thumbnailPath, duration,    │
//  │     status = "ready" (or "failed" on error)                        │
//  │  7. Deletes the job file so it isn't processed again                │
//  └─────────────────────────────────────────────────────────────────────┘
//
//  INTEGRATION POINTS (matches Member 1 & 2's code exactly):
//  • Job files written by: controllers/video.controller.js → finalizeUpload()
//  • Job format: { videoId, rawFilePath, outputDir, thumbDir }
//  • Video model fields updated: hlsPath, thumbnailPath, duration, status
//  • Model file: models/Video.js  (status enum: uploading|processing|ready|failed)
//  • DB: uses same MONGO_URI from .env (Atlas cloud)
//
//  HOW TO RUN:
//  $ cd transcoder && npm install
//  $ npm start          (production)
//  $ npm run dev        (development with auto-restart)
//
//  PREREQUISITES:
//  • FFmpeg must be installed on the system
//      Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg
//      macOS:         brew install ffmpeg
//      Verify:        ffmpeg -version
// ──────────────────────────────────────────────────────────────────────────

// Load .env from the parent backend directory (where the team's .env lives)
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const mongoose = require("mongoose");

// ── Configuration ─────────────────────────────────────────────────────────

const JOBS_DIR   = path.join(__dirname, "../uploads/jobs");
const HLS_DIR    = path.resolve(process.env.HLS_DIR   || path.join(__dirname, "../uploads/hls"));
const THUMB_DIR  = path.resolve(process.env.THUMB_DIR || path.join(__dirname, "../uploads/thumbnails"));
const POLL_MS    = 3000;   // poll interval in milliseconds
const CHUNK_SECS = 6;      // HLS segment length (seconds)

// 4-quality HLS ladder — matches industry standard adaptive bitrate
const QUALITY_LADDER = [
  { name: "1080p", scale: "1920:1080", videoBitrate: "4000k", audioBitrate: "192k", bandwidth: 4200000 },
  { name: "720p",  scale: "1280:720",  videoBitrate: "2500k", audioBitrate: "128k", bandwidth: 2628000 },
  { name: "480p",  scale: "854:480",   videoBitrate: "1000k", audioBitrate: "128k", bandwidth: 1128000 },
  { name: "360p",  scale: "640:360",   videoBitrate: "600k",  audioBitrate: "96k",  bandwidth:  696000 },
];

// ── Minimal Video schema (mirrors models/Video.js exactly) ────────────────
// We only define the fields we read/write to avoid importing from parent dir.

const videoSchema = new mongoose.Schema(
  {
    status:        { type: String, enum: ["uploading", "processing", "ready", "failed"] },
    hlsPath:       { type: String, default: "" },
    thumbnailPath: { type: String, default: "" },
    duration:      { type: Number, default: 0 },
    rawFilePath:   { type: String, default: "" },
  },
  { strict: false } // allow other fields from the real schema to pass through
);

// Use existing model if already registered (prevents OverwriteModelError
// if this module is hot-reloaded by nodemon)
const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

// ── MongoDB connection ─────────────────────────────────────────────────────

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  [Transcoder] MongoDB connected");
}

// ── FFprobe helpers ───────────────────────────────────────────────────────

/**
 * Returns video duration in seconds using ffprobe.
 * Falls back to 0 if probe fails (non-fatal).
 */
function getDuration(inputPath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        console.warn("⚠️  [ffprobe] Could not read duration:", err.message);
        return resolve(0);
      }
      resolve(Math.round(metadata.format?.duration || 0));
    });
  });
}

/**
 * Returns { width, height } of the first video stream, or null on failure.
 * Used to skip qualities that would upscale a low-res source.
 */
function getVideoDimensions(inputPath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return resolve(null);
      const stream = metadata.streams?.find((s) => s.codec_type === "video");
      resolve(stream ? { width: stream.width, height: stream.height } : null);
    });
  });
}

// ── Thumbnail extraction ──────────────────────────────────────────────────

/**
 * Captures a single frame at 5% of the video duration as a JPEG thumbnail.
 * Output: <thumbDir>/<videoId>.jpg
 * Returns the relative URL path string, or null on failure.
 */
function extractThumbnail(inputPath, videoId, thumbDir) {
  return new Promise((resolve) => {
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    const filename = `${videoId}.jpg`;

    ffmpeg(inputPath)
      .on("end", () => {
        console.log(`🖼️  [Thumbnail] Saved: ${filename}`);
        resolve(`/uploads/thumbnails/${filename}`);
      })
      .on("error", (err) => {
        console.warn("⚠️  [Thumbnail] Failed:", err.message);
        resolve(null); // thumbnail failure is non-fatal
      })
      .screenshots({
        count: 1,
        timemarks: ["5%"],       // at 5% of total duration
        filename,
        folder: thumbDir,
        size: "1280x720",        // standard 720p thumbnail
      });
  });
}

// ── Single-quality HLS transcode ──────────────────────────────────────────

/**
 * Transcodes inputPath to HLS at a single quality level.
 *
 * Output structure:
 *   <qualityDir>/index.m3u8          (playlist)
 *   <qualityDir>/segment_000.ts      (first segment)
 *   <qualityDir>/segment_001.ts      ...
 *
 * @param {string} inputPath  - path to assembled raw video file
 * @param {string} qualityDir - output directory for this quality level
 * @param {object} q          - quality config object from QUALITY_LADDER
 * @returns {Promise<void>}
 */
function transcodeQuality(inputPath, qualityDir, q) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(qualityDir)) {
      fs.mkdirSync(qualityDir, { recursive: true });
    }

    const playlistPath = path.join(qualityDir, "index.m3u8");
    const segmentPattern = path.join(qualityDir, "segment_%03d.ts");

    ffmpeg(inputPath)
      .outputOptions([
        // Video encoding
        "-c:v libx264",
        "-preset fast",        // fast preset — good speed/quality balance for a server
        "-crf 23",             // constant rate factor — quality target
        `-vf scale=${q.scale}`,         // resize to target resolution
        `-b:v ${q.videoBitrate}`,       // target video bitrate
        "-maxrate", String(parseInt(q.videoBitrate) * 1.5) + "k",
        "-bufsize", String(parseInt(q.videoBitrate) * 2) + "k",
        "-profile:v baseline",          // H.264 baseline — widest device compat
        "-level 3.0",

        // Audio encoding
        "-c:a aac",
        `-b:a ${q.audioBitrate}`,
        "-ac 2",               // stereo

        // HLS muxer options
        `-hls_time ${CHUNK_SECS}`,              // segment duration
        "-hls_playlist_type vod",               // Video On Demand (not live)
        `-hls_segment_filename ${segmentPattern}`,
        "-hls_flags independent_segments",      // each segment independently decodable
      ])
      .output(playlistPath)
      .on("start", (cmd) => {
        console.log(`   ⚙️  [FFmpeg ${q.name}] Starting...`);
        // Uncomment for full FFmpeg command logging:
        // console.log(`   CMD: ${cmd}`);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          process.stdout.write(
            `\r   📊 [${q.name}] ${Math.round(progress.percent)}% — timemark: ${progress.timemark}   `
          );
        }
      })
      .on("end", () => {
        process.stdout.write("\n");
        console.log(`   ✅ [FFmpeg ${q.name}] Done`);
        resolve();
      })
      .on("error", (err) => {
        process.stdout.write("\n");
        console.error(`   ❌ [FFmpeg ${q.name}] Error: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

// ── Master HLS playlist ───────────────────────────────────────────────────

/**
 * Writes the master.m3u8 playlist that lists all quality renditions.
 * HLS.js (Member 4's player) uses this to do adaptive bitrate switching.
 *
 * Format follows HLS spec (RFC 8216):
 *   #EXT-X-STREAM-INF:BANDWIDTH=...,RESOLUTION=...,NAME="720p"
 *   720p/index.m3u8
 *
 * @param {string} outputDir     - base HLS dir for this video
 * @param {string[]} doneQualities - names of successfully transcoded qualities
 * @returns {string} absolute path to master.m3u8
 */
function writeMasterPlaylist(outputDir, doneQualities) {
  const masterPath = path.join(outputDir, "master.m3u8");

  // Resolution map matches the QUALITY_LADDER scale values
  const RES_MAP = {
    "1080p": "1920x1080",
    "720p":  "1280x720",
    "480p":  "854x480",
    "360p":  "640x360",
  };

  let content = "#EXTM3U\n#EXT-X-VERSION:3\n\n";

  // Only include qualities that were actually transcoded successfully
  for (const q of QUALITY_LADDER) {
    if (!doneQualities.includes(q.name)) continue;

    const resolution = RES_MAP[q.name];
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${q.bandwidth},RESOLUTION=${resolution},NAME="${q.name}"\n`;
    content += `${q.name}/index.m3u8\n\n`;
  }

  fs.writeFileSync(masterPath, content, "utf8");
  console.log(`📋  [Master Playlist] Written: master.m3u8 (${doneQualities.join(", ")})`);

  return masterPath;
}

// ── Main transcode job ────────────────────────────────────────────────────

/**
 * Processes a single transcoding job end-to-end:
 *   1. Validate inputs
 *   2. Get source video dimensions (skip upscaling)
 *   3. Extract thumbnail
 *   4. Get duration
 *   5. Transcode each quality (in parallel for speed)
 *   6. Write master playlist
 *   7. Update MongoDB
 *   8. Delete job file
 *
 * @param {string} jobFilePath - path to the .json job file
 */
async function processJob(jobFilePath) {
  const jobFileName = path.basename(jobFilePath);

  // ── Read and validate job ────────────────────────────────────────────
  let job;
  try {
    job = JSON.parse(fs.readFileSync(jobFilePath, "utf8"));
  } catch (err) {
    console.error(`❌  [Job] Could not parse ${jobFileName}:`, err.message);
    fs.unlinkSync(jobFilePath); // remove corrupt job file
    return;
  }

  const { videoId, rawFilePath, outputDir, thumbDir } = job;

  if (!videoId || !rawFilePath) {
    console.error(`❌  [Job] Invalid job format in ${jobFileName}`);
    fs.unlinkSync(jobFilePath);
    return;
  }

  // Resolve paths relative to the project root (where the backend server runs)
  const resolvedInput  = path.resolve(__dirname, "..", rawFilePath);
  const resolvedOutput = outputDir
    ? path.resolve(__dirname, "..", outputDir)
    : path.join(HLS_DIR, videoId);
  const resolvedThumb  = thumbDir
    ? path.resolve(__dirname, "..", thumbDir)
    : THUMB_DIR;

  console.log(`\n${"─".repeat(60)}`);
  console.log(`🎬  [Job] Processing video: ${videoId}`);
  console.log(`   Input:  ${resolvedInput}`);
  console.log(`   Output: ${resolvedOutput}`);
  console.log(`${"─".repeat(60)}`);

  // ── Validate source file exists ──────────────────────────────────────
  if (!fs.existsSync(resolvedInput)) {
    console.error(`❌  [Job] Source file not found: ${resolvedInput}`);
    await Video.findByIdAndUpdate(videoId, { status: "failed" }).catch(() => {});
    fs.unlinkSync(jobFilePath);
    return;
  }

  // Create output dir
  if (!fs.existsSync(resolvedOutput)) {
    fs.mkdirSync(resolvedOutput, { recursive: true });
  }

  try {
    // ── Step 1: Get source dimensions (avoid upscaling) ───────────────
    const dims = await getVideoDimensions(resolvedInput);
    const sourceHeight = dims?.height || 9999;
    console.log(`📐  [Source] Dimensions: ${dims?.width ?? "?"}x${sourceHeight}`);

    // Only transcode qualities that DON'T upscale the source
    const qualitiesToProcess = QUALITY_LADDER.filter((q) => {
      const targetHeight = parseInt(q.name); // "720p" → 720
      return targetHeight <= sourceHeight;
    });

    // Always include at least the lowest quality (360p) even if source is very small
    if (qualitiesToProcess.length === 0) {
      qualitiesToProcess.push(QUALITY_LADDER[QUALITY_LADDER.length - 1]);
    }

    console.log(`🎚️  [Qualities] Will process: ${qualitiesToProcess.map((q) => q.name).join(", ")}`);

    // ── Step 2: Extract thumbnail ─────────────────────────────────────
    console.log("🖼️  [Thumbnail] Extracting...");
    const thumbnailUrl = await extractThumbnail(resolvedInput, videoId, resolvedThumb);

    // ── Step 3: Get duration ──────────────────────────────────────────
    const duration = await getDuration(resolvedInput);
    console.log(`⏱️  [Duration] ${duration}s`);

    // ── Step 4: Transcode all qualities in parallel ───────────────────
    // Running in parallel significantly cuts total time on multi-core systems.
    // Each quality writes to its own subdirectory so there's no contention.
    console.log("🔄  [Transcode] Starting parallel HLS encoding...");

    const successfulQualities = [];
    await Promise.all(
      qualitiesToProcess.map(async (q) => {
        const qualityDir = path.join(resolvedOutput, q.name);
        try {
          await transcodeQuality(resolvedInput, qualityDir, q);
          successfulQualities.push(q.name);
        } catch (err) {
          // One quality failing doesn't kill the whole job
          console.error(`⚠️  [Transcode] ${q.name} failed, skipping: ${err.message}`);
        }
      })
    );

    if (successfulQualities.length === 0) {
      throw new Error("All quality levels failed during transcoding");
    }

    // ── Step 5: Write master playlist ────────────────────────────────
    writeMasterPlaylist(resolvedOutput, successfulQualities);

    // ── Step 6: Build the hlsPath URL ─────────────────────────────────
    // This matches how Member 1 serves static files:
    //   app.use("/uploads", express.static(path.join(__dirname, "uploads")))
    // So ./uploads/hls/<videoId>/master.m3u8  →  /uploads/hls/<videoId>/master.m3u8
    const hlsPath = `/uploads/hls/${videoId}/master.m3u8`;

    // ── Step 7: Update MongoDB Video document ─────────────────────────
    await Video.findByIdAndUpdate(videoId, {
      status:        "ready",
      hlsPath,
      thumbnailPath: thumbnailUrl || "",
      duration,
    });

    console.log(`\n🎉  [Job] Complete — video ${videoId} is now READY`);
    console.log(`   hlsPath:       ${hlsPath}`);
    console.log(`   thumbnailPath: ${thumbnailUrl}`);
    console.log(`   duration:      ${duration}s`);

    // ── Step 8: Delete processed job file ────────────────────────────
    fs.unlinkSync(jobFilePath);

  } catch (err) {
    console.error(`\n❌  [Job] FAILED for video ${videoId}:`, err.message);

    // Mark video as failed in DB so the frontend can show an error state
    await Video.findByIdAndUpdate(videoId, { status: "failed" }).catch((dbErr) => {
      console.error("   [DB] Could not mark video as failed:", dbErr.message);
    });

    // Remove job file so the worker doesn't retry it infinitely
    try { fs.unlinkSync(jobFilePath); } catch { /* already gone */ }
  }
}

// ── Polling loop ──────────────────────────────────────────────────────────

// Track which jobs are currently being processed so we don't double-process
// if a job takes longer than the poll interval.
const activeJobs = new Set();

async function poll() {
  // Ensure jobs directory exists
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
    return;
  }

  const jobFiles = fs
    .readdirSync(JOBS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(JOBS_DIR, f));

  for (const jobFile of jobFiles) {
    if (activeJobs.has(jobFile)) continue; // already in progress

    activeJobs.add(jobFile);
    // Process async — don't await, so multiple jobs can run concurrently
    processJob(jobFile).finally(() => activeJobs.delete(jobFile));
  }
}

// ── Entry point ───────────────────────────────────────────────────────────

(async () => {
  console.log("━".repeat(60));
  console.log("🎬  Dhrushyam Transcoding Worker — Member 3");
  console.log("━".repeat(60));
  console.log(`📂  Jobs dir:  ${JOBS_DIR}`);
  console.log(`📂  HLS dir:   ${HLS_DIR}`);
  console.log(`📂  Thumb dir: ${THUMB_DIR}`);
  console.log(`⏱️   Poll interval: ${POLL_MS}ms`);
  console.log(`🎚️   Quality ladder: ${QUALITY_LADDER.map((q) => q.name).join(" | ")}`);
  console.log("━".repeat(60));

  try {
    await connectDB();
  } catch (err) {
    console.error("❌  Could not connect to MongoDB:", err.message);
    process.exit(1);
  }

  // Initial poll immediately, then repeat
  await poll();
  setInterval(poll, POLL_MS);

  console.log(`\n👂  Listening for jobs in: ${JOBS_DIR}\n`);
})();
