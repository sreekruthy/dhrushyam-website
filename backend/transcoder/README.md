# Dhrushyam — Transcoder (Member 3)

FFmpeg-based HLS video transcoding worker that integrates directly with the Member 1 & 2 backend.

---

## How It Fits Into the System

```
Frontend (Member 4)
    │  uploads video in chunks
    ▼
video.controller.js → finalizeUpload()
    │  assembles chunks → uploads/raw/<videoId>.mp4
    │  sets Video.status = "processing"
    │  writes uploads/jobs/<videoId>.json
    ▼
transcoder/worker.js  ◄── YOU ARE HERE
    │  polls uploads/jobs/ every 3 seconds
    │  runs FFmpeg → produces HLS segments
    │  extracts thumbnail via ffprobe
    │  writes master.m3u8
    │  updates MongoDB: status = "ready"
    ▼
Video Player (Member 4 — HLS.js)
    uses Video.hlsPath = /uploads/hls/<videoId>/master.m3u8
```

---

## Prerequisites

### 1. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify:**
```bash
ffmpeg -version
ffprobe -version
```

### 2. Install Node dependencies
```bash
cd transcoder
npm install
```

---

## Setup & Run

### Step 1 — Verify everything is ready
```bash
node check-setup.js
```

This checks: FFmpeg installation, MongoDB connection, env vars, directory permissions.

### Step 2 — Start the worker (in its own terminal)
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The worker runs alongside the main Express server — open a **separate terminal** for it.

---

## Testing Locally (Without the Frontend)

If you want to test the transcoder before the full frontend is ready:

```bash
# First, have a sample MP4 in uploads/raw/
# Then create a fake job:
node test-job.js <some-mongo-id> ../uploads/raw/your-video.mp4

# The worker will pick it up within 3 seconds
```

---

## Output Structure

For a video with `_id = 6639abc123def456`:

```
uploads/
├── raw/
│   └── 6639abc123def456.mp4          ← assembled by Member 1
├── hls/
│   └── 6639abc123def456/
│       ├── master.m3u8               ← main playlist (HLS.js uses this)
│       ├── 1080p/
│       │   ├── index.m3u8
│       │   ├── segment_000.ts
│       │   └── segment_001.ts ...
│       ├── 720p/
│       │   ├── index.m3u8
│       │   └── segment_000.ts ...
│       ├── 480p/
│       └── 360p/
└── thumbnails/
    └── 6639abc123def456.jpg          ← auto-generated at 5% mark
```

The Express server serves everything under `/uploads/` as static files (configured in `server.js` by Member 1).

---

## What Gets Updated in MongoDB

After successful transcoding, the `Video` document is updated:

| Field | Value set by worker |
|-------|-------------------|
| `status` | `"ready"` |
| `hlsPath` | `/uploads/hls/<videoId>/master.m3u8` |
| `thumbnailPath` | `/uploads/thumbnails/<videoId>.jpg` |
| `duration` | Number (seconds, from ffprobe) |

On failure:

| Field | Value |
|-------|-------|
| `status` | `"failed"` |

---

## Quality Ladder

| Name | Resolution | Video Bitrate | Audio Bitrate |
|------|-----------|---------------|---------------|
| 1080p | 1920×1080 | 4000k | 192k |
| 720p  | 1280×720  | 2500k | 128k |
| 480p  | 854×480   | 1000k | 128k |
| 360p  | 640×360   |  600k |  96k |

**Smart upscaling prevention:** If the source video is 480p, only 480p and 360p will be generated — no pointless upscaling.

---

## Environment Variables (from root `.env`)

The worker uses the **same `.env`** as the backend (loaded from `../.env`):

```env
MONGO_URI=mongodb+srv://...       # Atlas connection string
HLS_DIR=./uploads/hls             # where to write HLS output
THUMB_DIR=./uploads/thumbnails    # where to write thumbnails
UPLOAD_DIR=./uploads/raw          # where assembled raw files live
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `FFmpeg not found` | Install FFmpeg, verify with `ffmpeg -version` |
| `MongoDB connection failed` | Check `MONGO_URI` in `.env`, verify Atlas network access |
| `Source file not found` | Make sure Member 1's `finalizeUpload` ran first |
| Video stuck in `processing` | Check worker terminal for errors; check `uploads/jobs/` for leftover `.json` |
| Thumbnail is blank/missing | Non-fatal — video still plays; short videos (<2s) may not have a 5% mark |
