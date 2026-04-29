// ──────────────────────────────────────────────────────────────────────────
//  transcoder/test-job.js  —  Manual job injection for local testing
//
//  Usage:
//    node test-job.js <videoId> <pathToVideoFile>
//
//  Example:
//    node test-job.js 6639abc123def456 ../uploads/raw/sample.mp4
//
//  This drops a .json job file into uploads/jobs/ exactly the way
//  video.controller.js → finalizeUpload() does it.
//  Run worker.js in another terminal to pick it up.
// ──────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

const [,, videoId, rawFilePath] = process.argv;

if (!videoId || !rawFilePath) {
  console.error("Usage: node test-job.js <videoId> <pathToVideoFile>");
  process.exit(1);
}

const JOBS_DIR = path.join(__dirname, "../uploads/jobs");
if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });

const job = {
  videoId,
  rawFilePath: path.resolve(rawFilePath),
  outputDir: path.join(__dirname, `../uploads/hls/${videoId}`),
  thumbDir: path.join(__dirname, "../uploads/thumbnails"),
};

const jobPath = path.join(JOBS_DIR, `${videoId}.json`);
fs.writeFileSync(jobPath, JSON.stringify(job, null, 2));

console.log(`✅  Job file written: ${jobPath}`);
console.log(`   videoId:     ${videoId}`);
console.log(`   rawFilePath: ${job.rawFilePath}`);
console.log("\nNow run 'npm start' (or 'npm run dev') in another terminal.");
console.log("The worker will pick up this job within 3 seconds.");
