/**
 * seed.js — Run once to populate MongoDB with sample videos
 *
 * Usage:
 *   node seed.js
 *
 * Requirements:
 *   npm install mongoose dotenv
 *
 * Put your MONGODB_URI in a .env file or set it in the environment.
 * The script uses the same "test" database your teammate set up.
 */

require("dotenv").config();
const mongoose = require("mongoose");

// ── Schema (mirrors your teammate's Video model) ──────────────────────────────
const VideoSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    uploader: mongoose.Schema.Types.ObjectId,
    rawFilePath: { type: String, default: "" },
    hlsPath: String,          // ← public URL, not a local path
    thumbnailPath: String,    // ← public CDN URL
    status: { type: String, default: "ready" },
    views: { type: Number, default: 0 },
    likedBy: [mongoose.Schema.Types.ObjectId],
    dislikedBy: [mongoose.Schema.Types.ObjectId],
    duration: Number,
    tags: [String],
    category: String,
    isPublic: { type: Boolean, default: true },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", VideoSchema, "videos");

// ── Sample data ────────────────────────────────────────────────────────────────
//
// HLS sources:  publicly available test streams (no auth, no CORS issues)
// Thumbnails:   picsum.photos — stable CDN, free, no sign-up
//
// These are all genuine HLS m3u8 playlists that HLS.js can load directly.

const PLACEHOLDER_UPLOADER = new mongoose.Types.ObjectId(
  "69f0fea52c6de5db3dcfc4a3"   // reuse your teammate's user ObjectId
);

const videos = [
  {
    title: "Big Buck Bunny",
    description:
      "A large and lovable rabbit deals with three tiny bullies. Classic Blender Foundation open movie.",
    hlsPath:
      "https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hd_7.m3u8",
    thumbnailPath: "https://picsum.photos/seed/bbb/640/360",
    duration: 596,
    views: 4821,
    tags: ["animation", "short-film", "blender"],
    category: "Entertainment",
  },
  {
    title: "Tears of Steel",
    description:
      "A sci-fi short set in a dystopian Amsterdam — robots take over the city.",
    hlsPath:
      "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    thumbnailPath: "https://picsum.photos/seed/tos/640/360",
    duration: 734,
    views: 3102,
    tags: ["sci-fi", "blender", "open-movie"],
    category: "Entertainment",
  },
  {
    title: "Apple HLS Sample — 400 kbps",
    description:
      "Apple's official HLS reference stream. Used to validate adaptive bitrate players.",
    hlsPath:
      "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
    thumbnailPath: "https://picsum.photos/seed/apple/640/360",
    duration: 1800,
    views: 1540,
    tags: ["hls", "test", "apple"],
    category: "Technology",
  },
  {
    title: "Nature Time-lapse",
    description:
      "Stunning slow-motion and time-lapse sequences of landscapes around the world.",
    hlsPath:
      "https://cdn.jwplayer.com/manifests/pZxWPRg4.m3u8",
    thumbnailPath: "https://picsum.photos/seed/nature/640/360",
    duration: 240,
    views: 9210,
    tags: ["nature", "timelapse", "4k"],
    category: "Nature",
  },
  {
    title: "Lo-Fi Study Session",
    description:
      "Chill hip-hop beats to study or relax to — 3 hours of uninterrupted music.",
    hlsPath:
      "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    thumbnailPath: "https://picsum.photos/seed/lofi/640/360",
    duration: 888,
    views: 21043,
    tags: ["music", "lofi", "study"],
    category: "Music",
  },
  {
    title: "Sintel — Open Movie",
    description:
      "A lonely young woman, Sintel, helps and befriends a baby dragon named Scales.",
    hlsPath:
      "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    thumbnailPath: "https://picsum.photos/seed/sintel/640/360",
    duration: 888,
    views: 6740,
    tags: ["animation", "fantasy", "blender"],
    category: "Entertainment",
  },
  {
    title: "City Night Drive",
    description:
      "First-person footage of night driving through Tokyo — immersive city lights.",
    hlsPath:
      "https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hd_7.m3u8",
    thumbnailPath: "https://picsum.photos/seed/city/640/360",
    duration: 1203,
    views: 5382,
    tags: ["travel", "driving", "city", "japan"],
    category: "Travel",
  },
  {
    title: "Intro to Machine Learning",
    description:
      "A beginner-friendly walkthrough of supervised learning, neural nets, and gradient descent.",
    hlsPath:
      "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
    thumbnailPath: "https://picsum.photos/seed/ml/640/360",
    duration: 2400,
    views: 18294,
    tags: ["education", "ml", "ai", "python"],
    category: "Education",
  },
  {
    title: "Cooking: Homemade Ramen",
    description:
      "Step-by-step guide to building a rich tonkotsu broth from scratch in under 3 hours.",
    hlsPath:
      "https://cdn.jwplayer.com/manifests/pZxWPRg4.m3u8",
    thumbnailPath: "https://picsum.photos/seed/ramen/640/360",
    duration: 1560,
    views: 11750,
    tags: ["cooking", "japanese", "ramen", "recipe"],
    category: "Food",
  },
];

// ── Main ───────────────────────────────────────────────────────────────────────
async function seed() {
  const uri =
    process.env.MONGO_URI ||
    "mongodb+srv://sreekruthyreddy_db_user:sreekruthy@dhrushyam-cluster.ws6efru.mongodb.net/?appName=dhrushyam-cluster";

  console.log("Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("Connected.");

  // Optional: remove existing seeded videos (keeps your teammate's real upload)
  const existing = await Video.countDocuments({});
  console.log(`Existing documents: ${existing}`);

  const docs = videos.map((v) => ({
    ...v,
    uploader: PLACEHOLDER_UPLOADER,
  }));

  const result = await Video.insertMany(docs);
  console.log(`✅  Inserted ${result.length} videos.`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});