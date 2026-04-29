// ─────────────────────────────────────────────
//  middleware/upload.middleware.js  —  Multer config
//
//  Handles chunked multipart uploads up to 2 GB.
//
//  How chunked uploads work:
//  • The frontend splits the file into chunks
//    (e.g. 10 MB each) and POSTs them in sequence.
//  • Each chunk carries: chunkIndex, totalChunks,
//    uploadId (uuid), and the binary chunk data.
//  • This middleware saves each chunk to a temp dir.
//  • The controller assembles them into a single file
//    once all chunks arrive.
//
//  Why not just stream the whole file in one request?
//  • Browser memory limits + network drops make
//    multi-GB single uploads fragile. Chunking lets
//    us resume from the last successful chunk.
// ─────────────────────────────────────────────
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Ensure upload directories exist at startup
const RAW_DIR = process.env.UPLOAD_DIR || "./uploads/raw";
const CHUNK_DIR = "./uploads/chunks";

[RAW_DIR, CHUNK_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Chunk storage ─────────────────────────────
// Each chunk is stored as: chunks/<uploadId>/<chunkIndex>
const chunkStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uploadId = req.body.uploadId || uuidv4();
    req.uploadId = uploadId; // pass to controller via req

    const dest = path.join(CHUNK_DIR, uploadId);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, _file, cb) => {
    // Name each chunk by its index for ordered reassembly
    const chunkIndex = req.body.chunkIndex ?? "0";
    cb(null, `chunk_${String(chunkIndex).padStart(5, "0")}`);
  },
});

// ── File type filter ──────────────────────────
// Accept only common video mime types
const videoFileFilter = (_req, file, cb) => {
  const allowed = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",   // .mov
    "video/x-matroska",  // .mkv
    "video/avi",
    "video/x-msvideo",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

// ── Multer instance for chunk uploads ─────────
// Each chunk is small (e.g. 10 MB); the 2 GB limit
// applies to the ASSEMBLED file in the controller.
const uploadChunk = multer({
  storage: chunkStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB per chunk
  },
}).single("chunk"); // field name must be "chunk" from the frontend

// ── Multer instance for thumbnail uploads ─────
const THUMB_DIR = process.env.THUMB_DIR || "./uploads/thumbnails";
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });

const thumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, THUMB_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${uuidv4()}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed for thumbnails"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
}).single("thumbnail");

// ── Helper: assemble chunks into one file ─────
/**
 * Reads all chunk_XXXXX files in uploadDir in order,
 * pipes them into a single output file at destPath.
 * Cleans up the chunk directory when done.
 *
 * @param {string} uploadDir - path to the chunks folder
 * @param {string} destPath  - where to write the assembled video
 * @returns {Promise<void>}
 */
const assembleChunks = (uploadDir, destPath) => {
  return new Promise((resolve, reject) => {
    const chunks = fs
      .readdirSync(uploadDir)
      .filter((f) => f.startsWith("chunk_"))
      .sort(); // lexicographic sort works because of zero-padding

    if (chunks.length === 0) return reject(new Error("No chunks found"));

    const writeStream = fs.createWriteStream(destPath);

    const writeChunk = (index) => {
      if (index >= chunks.length) {
        writeStream.end();
        // Cleanup chunk directory
        fs.rmSync(uploadDir, { recursive: true, force: true });
        return resolve();
      }

      const chunkPath = path.join(uploadDir, chunks[index]);
      const readStream = fs.createReadStream(chunkPath);

      readStream.on("error", reject);
      readStream.on("end", () => writeChunk(index + 1));
      readStream.pipe(writeStream, { end: false });
    };

    writeStream.on("error", reject);
    writeChunk(0);
  });
};

module.exports = { uploadChunk, uploadThumbnail, assembleChunks };
