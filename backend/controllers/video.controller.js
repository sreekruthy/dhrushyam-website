// ─────────────────────────────────────────────
//  controllers/video.controller.js
//
//  Handles:
//  • initUpload      — creates the Video doc and returns an uploadId
//  • uploadChunk     — receives one chunk, saves to disk
//  • finalizeUpload  — assembles all chunks, queues transcoding job
//  • getAllVideos     — paginated feed (public)
//  • getVideoById    — single video detail (public)
//  • updateVideo     — edit title/description/tags (owner only)
//  • deleteVideo     — remove video + files (owner only)
//  • toggleLike      — like or un-like a video
//  • toggleDislike   — dislike or un-dislike a video
//  • incrementView   — bump view counter (called by the player)
// ─────────────────────────────────────────────
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Video = require("../models/Video");
const { assembleChunks } = require("../middleware/upload.middleware");

const RAW_DIR = process.env.UPLOAD_DIR || "./uploads/raw";

// ── Utility ───────────────────────────────────
const isOwner = (video, userId) => video.uploader.toString() === userId.toString();

// ─────────────────────────────────────────────
//  POST /api/videos/init-upload
//  Creates a Video doc in "uploading" state and
//  returns the videoId + a fresh uploadId so the
//  client can POST chunks to /api/videos/chunk.
// ─────────────────────────────────────────────
exports.initUpload = async (req, res, next) => {
  try {
    const { title, description, tags, category } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const video = await Video.create({
      title,
      description: description || "",
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      category: category || "General",
      uploader: req.user._id,
      status: "uploading",
    });

    const uploadId = uuidv4();

    res.status(201).json({
      success: true,
      videoId: video._id,
      uploadId, // client sends this with each chunk
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/videos/chunk
//  Receives a single binary chunk.
//  Body (multipart/form-data):
//    chunk        — binary file data
//    uploadId     — from initUpload response
//    chunkIndex   — 0-based integer
//    totalChunks  — total number of chunks
//    videoId      — MongoDB _id of the Video doc
// ─────────────────────────────────────────────
exports.receiveChunk = async (req, res, next) => {
  // uploadChunk middleware already saved the chunk file
  // and set req.uploadId from req.body.uploadId
  try {
    const { chunkIndex, totalChunks, videoId } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No chunk data received" });
    }

    res.json({
      success: true,
      message: `Chunk ${chunkIndex} of ${totalChunks} received`,
      videoId,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/videos/finalize
//  Called after the last chunk is uploaded.
//  Assembles chunks → raw video file,
//  updates Video.status to "processing",
//  and writes a job file that Member 3's worker polls.
//
//  Body: { videoId, uploadId, originalName }
// ─────────────────────────────────────────────
// POST /api/videos
// Saves the current frontend's multipart video upload and creates a ready Video doc.
exports.createVideo = async (req, res, next) => {
  try {
    const { title, description, tags, category } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Video file is required" });
    }

    const publicPath = `/uploads/raw/${req.file.filename}`;
    const video = await Video.create({
      title: title.trim(),
      description: description || "",
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      category: category || "General",
      uploader: req.user._id,
      rawFilePath: req.file.path,
      hlsPath: publicPath,
      status: "ready",
      isPublic: true,
    });

    await video.populate("uploader", "username avatar");

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video,
    });
  } catch (err) {
    next(err);
  }
};

exports.finalizeUpload = async (req, res, next) => {
  try {
    const { videoId, uploadId, originalName } = req.body;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    if (!isOwner(video, req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Where the assembled file will live
    const ext = path.extname(originalName || ".mp4") || ".mp4";
    const fileName = `${videoId}${ext}`;
    const destPath = path.join(RAW_DIR, fileName);

    const chunkDir = path.join("./uploads/chunks", uploadId);
    await assembleChunks(chunkDir, destPath);

    // Update DB: store raw path, advance status
    video.rawFilePath = destPath;
    video.status = "processing";
    await video.save();

    // ── Write a job file for Member 3's worker ──
    // Member 3's transcoder/worker.js polls ./uploads/jobs/
    // and picks up any .json file to start FFmpeg.
    const jobsDir = "./uploads/jobs";
    if (!fs.existsSync(jobsDir)) fs.mkdirSync(jobsDir, { recursive: true });

    const job = {
      videoId: videoId.toString(),
      rawFilePath: destPath,
      outputDir: path.join(process.env.HLS_DIR || "./uploads/hls", videoId.toString()),
      thumbDir: process.env.THUMB_DIR || "./uploads/thumbnails",
    };

    fs.writeFileSync(path.join(jobsDir, `${videoId}.json`), JSON.stringify(job, null, 2));

    res.json({
      success: true,
      message: "Upload complete, transcoding queued",
      videoId,
      status: "processing",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  GET /api/videos?page=1&limit=12&category=&q=
//  Public — paginated video feed
// ─────────────────────────────────────────────
exports.getAllVideos = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;
    const { category, q, uploaderId } = req.query;

    // Build dynamic filter
    const filter = { status: "ready", isPublic: true };
    if (category) filter.category = category;
    if (uploaderId) filter.uploader = uploaderId;
    if (q) filter.$text = { $search: q }; // uses the text index

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploader", "username avatar") // embed uploader info
        .select("-rawFilePath -likedBy -dislikedBy"), // don't expose internal paths/arrays
      Video.countDocuments(filter),
    ]);

    res.json({
      success: true,
      videos,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  GET /api/videos/:id
//  Public — single video detail
//  If authenticated, also returns hasLiked/hasDisliked
// ─────────────────────────────────────────────
exports.getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("uploader", "username avatar bio subscribers");

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (!video.isPublic && (!req.user || !isOwner(video, req.user._id))) {
      return res.status(403).json({ success: false, message: "This video is private" });
    }

    // Extra fields for authenticated users
    const response = video.toJSON();
    if (req.user) {
      response.likeCount = video.likedBy.length;
      response.dislikeCount = video.dislikedBy.length;
      response.isSubscribed = video.uploader.subscribers.some((id) => id.equals(req.user._id));
    }

    // Remove internal arrays from public response
    delete response.likedBy;
    delete response.dislikedBy;

    res.json({ success: true, video: response });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  PUT /api/videos/:id
//  Protected — owner only
// ─────────────────────────────────────────────
exports.updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });
    if (!isOwner(video, req.user._id)) return res.status(403).json({ success: false, message: "Forbidden" });

    const { title, description, tags, category, isPublic } = req.body;
    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (tags !== undefined) video.tags = Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim());
    if (category !== undefined) video.category = category;
    if (isPublic !== undefined) video.isPublic = isPublic;

    await video.save();
    res.json({ success: true, video });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  DELETE /api/videos/:id
//  Protected — owner or admin only
// ─────────────────────────────────────────────
exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });

    const canDelete = isOwner(video, req.user._id) || req.user.role === "admin";
    if (!canDelete) return res.status(403).json({ success: false, message: "Forbidden" });

    // Delete files from disk (non-blocking — don't fail if files already gone)
    const filesToDelete = [
      video.rawFilePath,
      video.thumbnailPath,
    ];

    filesToDelete.forEach((filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
    });

    // Delete HLS folder (Member 3 creates this)
    const hlsFolder = path.join(process.env.HLS_DIR || "./uploads/hls", video._id.toString());
    if (fs.existsSync(hlsFolder)) {
      try { fs.rmSync(hlsFolder, { recursive: true, force: true }); } catch { /* ignore */ }
    }

    await video.deleteOne();

    res.json({ success: true, message: "Video deleted" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/videos/:id/like
//  Protected — toggles like on/off
//  Also removes dislike if present (mutual exclusion)
// ─────────────────────────────────────────────
exports.toggleLike = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });

    const userId = req.user._id;
    const alreadyLiked = video.likedBy.some((id) => id.equals(userId));

    if (alreadyLiked) {
      // Un-like
      video.likedBy = video.likedBy.filter((id) => !id.equals(userId));
    } else {
      // Like — also remove any dislike
      video.likedBy.push(userId);
      video.dislikedBy = video.dislikedBy.filter((id) => !id.equals(userId));
    }

    await video.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: video.likedBy.length,
      dislikeCount: video.dislikedBy.length,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/videos/:id/dislike
//  Protected — toggles dislike on/off
// ─────────────────────────────────────────────
exports.toggleDislike = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });

    const userId = req.user._id;
    const alreadyDisliked = video.dislikedBy.some((id) => id.equals(userId));

    if (alreadyDisliked) {
      video.dislikedBy = video.dislikedBy.filter((id) => !id.equals(userId));
    } else {
      video.dislikedBy.push(userId);
      video.likedBy = video.likedBy.filter((id) => !id.equals(userId));
    }

    await video.save();

    res.json({
      success: true,
      disliked: !alreadyDisliked,
      likeCount: video.likedBy.length,
      dislikeCount: video.dislikedBy.length,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/videos/:id/view
//  Public — increments view count
//  Called by Member 4's player on playback start
// ─────────────────────────────────────────────
exports.incrementView = async (req, res, next) => {
  try {
    // Use $inc for atomic increment — avoids race conditions with concurrent viewers
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
