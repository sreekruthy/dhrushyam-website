/**
 * seed.js — Run once to populate MongoDB with sample videos
 *
 * Usage:
 *   node seed.js
 *
 * WARNING: This will DELETE all existing videos before inserting new ones.
 * Comment out the Video.deleteMany() line if you want to keep existing data.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    uploader: mongoose.Schema.Types.ObjectId,
    rawFilePath: { type: String, default: "" },
    hlsPath: String,
    thumbnailPath: String,
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

const PLACEHOLDER_UPLOADER = new mongoose.Types.ObjectId(
  "69f0fea52c6de5db3dcfc4a3"
);

// ── HLS streams (all publicly accessible, no auth/CORS issues) ────────────────
const MUX   = "https://test-streams.mux.dev/x36xhzz/url_6/193039199_mp4_h264_aac_hd_7.m3u8";
const APPLE = "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8";
const SINTEL = "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8";
const UNIFIED = "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8";
const JW    = "https://cdn.jwplayer.com/manifests/pZxWPRg4.m3u8";

const videos = [
  // ── Entertainment ──────────────────────────────────────────────────────────
  {
    title: "Big Buck Bunny",
    description: "A large and lovable rabbit deals with three tiny bullies in this classic Blender Foundation open movie. Full HD, family-friendly.",
    hlsPath: MUX,
    thumbnailPath: "https://picsum.photos/seed/bbb/640/360",
    duration: 596,
    tags: ["animation", "short-film", "blender", "family"],
    category: "Entertainment",
  },
  {
    title: "Tears of Steel",
    description: "A sci-fi short set in a dystopian Amsterdam where robots take over the city. Shot with real actors and Blender VFX.",
    hlsPath: UNIFIED,
    thumbnailPath: "https://picsum.photos/seed/tos/640/360",
    duration: 734,
    tags: ["sci-fi", "blender", "open-movie", "vfx"],
    category: "Entertainment",
  },
  {
    title: "Sintel — Open Movie",
    description: "A lonely young woman, Sintel, helps and befriends a baby dragon named Scales. Award-winning Blender Institute short film.",
    hlsPath: SINTEL,
    thumbnailPath: "https://picsum.photos/seed/sintel/640/360",
    duration: 888,
    tags: ["animation", "fantasy", "blender", "dragon"],
    category: "Entertainment",
  },
  {
    title: "Cosmos: Unknown Galaxies",
    description: "A journey through the farthest known galaxies captured by the James Webb Space Telescope. Narrated documentary.",
    hlsPath: MUX,
    thumbnailPath: "https://picsum.photos/seed/cosmos/640/360",
    duration: 2700,
    tags: ["space", "documentary", "jwst", "astronomy"],
    category: "Entertainment",
  },

  // ── Education ──────────────────────────────────────────────────────────────
  {
    title: "Intro to Machine Learning",
    description: "A beginner-friendly walkthrough of supervised learning, neural networks, and gradient descent with visual examples.",
    hlsPath: APPLE,
    thumbnailPath: "https://picsum.photos/seed/ml/640/360",
    duration: 2400,
    tags: ["education", "ml", "ai", "python"],
    category: "Education",
  },
  {
    title: "How the Internet Works",
    description: "From TCP/IP packets to DNS lookups — a clear visual explanation of every layer of the internet stack.",
    hlsPath: SINTEL,
    thumbnailPath: "https://picsum.photos/seed/internet/640/360",
    duration: 1860,
    tags: ["education", "networking", "cs", "technology"],
    category: "Education",
  },
  {
    title: "The History of Rome in 20 Minutes",
    description: "From Romulus and Remus to the fall of Constantinople — a rapid-fire history of one of the greatest civilisations.",
    hlsPath: MUX,
    thumbnailPath: "https://picsum.photos/seed/rome/640/360",
    duration: 1200,
    tags: ["history", "rome", "education", "documentary"],
    category: "Education",
  },
  {
    title: "Python for Beginners — Full Course",
    description: "Learn Python from absolute zero: variables, loops, functions, OOP, and your first web scraper. No prior experience needed.",
    hlsPath: APPLE,
    thumbnailPath: "https://picsum.photos/seed/python/640/360",
    duration: 14400,
    tags: ["python", "programming", "beginners", "coding"],
    category: "Education",
  },
  {
    title: "Understanding Quantum Computing",
    description: "Qubits, superposition, and entanglement explained without the maths. What quantum computers can actually do today.",
    hlsPath: SINTEL,
    thumbnailPath: "https://picsum.photos/seed/quantum/640/360",
    duration: 2100,
    tags: ["quantum", "computing", "physics", "education"],
    category: "Education",
  },

  // ── Technology ─────────────────────────────────────────────────────────────
  {
    title: "Apple HLS Reference Stream",
    description: "Apple's official HLS adaptive bitrate reference stream. Useful for testing video players and network conditions.",
    hlsPath: APPLE,
    thumbnailPath: "https://picsum.photos/seed/apple/640/360",
    duration: 1800,
    tags: ["hls", "test", "apple", "streaming"],
    category: "Technology",
  },
  {
    title: "Building a REST API with Node.js",
    description: "Code-along tutorial: build a production-ready REST API using Express, MongoDB, and JWT authentication from scratch.",
    hlsPath: MUX,
    thumbnailPath: "https://picsum.photos/seed/nodejs/640/360",
    duration: 5400,
    tags: ["nodejs", "api", "express", "mongodb", "tutorial"],
    category: "Technology",
  },
  {
    title: "React in 100 Seconds",
    description: "Everything you need to know about React — components, hooks, state, and the virtual DOM — in under two minutes.",
    hlsPath: SINTEL,
    thumbnailPath: "https://picsum.photos/seed/react/640/360",
    duration: 112,
    tags: ["react", "javascript", "frontend", "quicktip"],
    category: "Technology",
  },
  {
    title: "How GPUs Power Modern AI",
    description: "Why NVIDIA GPUs dominate AI training — CUDA cores, VRAM, tensor units, and what makes them different from CPUs.",
    hlsPath: UNIFIED,
    thumbnailPath: "https://picsum.photos/seed/gpu/640/360",
    duration: 1980,
    tags: ["gpu", "ai", "nvidia", "hardware"],
    category: "Technology",
  },

  // ── Nature ─────────────────────────────────────────────────────────────────
  {
    title: "Nature Time-lapse: Earth from Above",
    description: "Stunning slow-motion and time-lapse sequences of mountains, deserts, and oceans captured from aerial perspectives.",
    hlsPath: JW,
    thumbnailPath: "https://picsum.photos/seed/nature/640/360",
    duration: 1440,
    tags: ["nature", "timelapse", "4k", "aerial"],
    category: "Nature",
  },
  {
    title: "Deep Ocean: The Midnight Zone",
    description: "Rare footage from below 1,000 metres where sunlight never reaches. Bioluminescent creatures and hydrothermal vents.",
    hlsPath: MUX,
    thumbnailPath: "https://picsum.photos/seed/ocean/640/360",
    duration: 3300,
    tags: ["ocean", "nature", "documentary", "wildlife"],
    category: "Nature",
  },
  {
    title: "Rainforest Sounds — 4 Hours",
    description: "Immersive ambient recording from the Amazon rainforest. Birds, insects, rain, and wind. Perfect for focus or sleep.",
    hlsPath: SINTEL,
    thumbnailPath: "https://picsum.photos/seed/rainforest/640/360",
    duration: 14400,
    tags: ["ambient", "nature", "sounds", "relaxation"],
    category: "Nature",
  },

  // ── Music ──────────────────────────────────────────────────────────────────
  {
    title: "Lo-Fi Study Session — 3 Hours",
    description: "Chill hip-hop beats to study or relax to. No lyrics, consistent tempo, carefully curated for deep focus work.",
    hlsPath: SINTEL,
    thumbnailPath: "https://picsum.photos/seed/lofi/640/360",
    duration: 10800,
    tags: ["music", "lofi", "study", "chill"],
    category: "Music",
  },
  {
    title: "Jazz Piano: Late Night Sessions",
    description: "Solo jazz piano improvisation recorded live in a studio. Standards and originals in a warm, intimate setting.",
    hlsPath: JW,
    thumbnailPath: "https://picsum.photos/seed/jazz/640/360",
    duration: 4500,
    tags: ["jazz", "piano", "music", "live"],
    category: "Music",
  },

  // ── Travel ─────────────────────────────────────────────────────────────────
  {
    title: "City Night Drive — Tokyo",
    description: "First-person footage of night driving through Shinjuku, Shibuya, and Akihabara. Immersive city lights and neon signs.",
    hlsPath: MUX,
    thumbnailPath: "https://picsum.photos/seed/city/640/360",
    duration: 1203,
    tags: ["travel", "driving", "city", "japan", "tokyo"],
    category: "Travel",
  },
  {
    title: "Backpacking Southeast Asia — Full Documentary",
    description: "Six months, eight countries, one backpack. A raw travel documentary covering Vietnam, Thailand, Cambodia, and more.",
    hlsPath: UNIFIED,
    thumbnailPath: "https://picsum.photos/seed/backpack/640/360",
    duration: 6600,
    tags: ["travel", "backpacking", "asia", "documentary"],
    category: "Travel",
  },

  // ── Food ───────────────────────────────────────────────────────────────────
  {
    title: "Homemade Tonkotsu Ramen from Scratch",
    description: "Step-by-step guide to building a rich, creamy tonkotsu broth, hand-pulled noodles, and chashu pork in under 3 hours.",
    hlsPath: JW,
    thumbnailPath: "https://picsum.photos/seed/ramen/640/360",
    duration: 1560,
    tags: ["cooking", "japanese", "ramen", "recipe"],
    category: "Food",
  },
  {
    title: "Sourdough Bread: Beginner to Advanced",
    description: "From building your starter to achieving an open crumb — everything you need to bake bakery-quality sourdough at home.",
    hlsPath: APPLE,
    thumbnailPath: "https://picsum.photos/seed/sourdough/640/360",
    duration: 3900,
    tags: ["baking", "sourdough", "bread", "recipe", "cooking"],
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

  // Remove previously seeded videos
  // const deleted = await Video.deleteMany({});
  // console.log(`Deleted ${deleted.deletedCount} existing videos.`);

  const docs = videos.map((v) => ({
    ...v,
    views: 0,           // always start at 0 — player increments via /view endpoint
    uploader: PLACEHOLDER_UPLOADER,
  }));

  const result = await Video.insertMany(docs);
  console.log(`✅  Inserted ${result.length} videos across ${[...new Set(docs.map(d => d.category))].length} categories.`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});