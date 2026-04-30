# Dhrushyam Website

Dhrushyam is a full-stack video sharing web application built with React, Express, MongoDB, and Mongoose. It supports user registration and login, authenticated video uploads, a public home feed, video playback, likes/dislikes, comments, creator profile pages, analytics hooks, and recommendation endpoints.

The project is split into two main applications:

- `backend/` - Express API server, MongoDB models, authentication, uploads, comments, analytics, recommendations, and transcoder support.
- `frontend/dhrushyam/` - React client for browsing, uploading, watching, liking, commenting, logging in, registering, and viewing profile/dashboard screens.

## Features

- User registration and login with JWT access and refresh tokens
- Protected profile page and upload flow
- MongoDB-backed video records
- Single-request multipart video upload through `POST /api/videos`
- Chunked upload API support for larger/resumable upload flows
- Public home page feed for ready/public videos
- Video detail page with direct video playback and HLS playback support
- Like, dislike, view count, subscribe, and comment interactions
- Creator dashboard UI scaffold with chart components
- Analytics event logging and creator analytics endpoints
- Recommendation endpoints for most-viewed and sidebar videos
- Static serving for locally uploaded media through `/uploads`

## Tech Stack

### Frontend

- React 19
- React Router DOM
- Axios
- HLS.js
- Recharts
- React Icons / Lucide React
- Create React App scripts

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcryptjs password hashing
- Multer file uploads
- dotenv configuration
- nodemon for development

## Project Structure

```text
dhrushyam-website-main/
  backend/
    config/
      db.js
    controllers/
      analyticsController.js
      auth.controller.js
      commentsController.js
      recommendationsController.js
      video.controller.js
    middleware/
      auth.middleware.js
      upload.middleware.js
    models/
      AnalyticsEvent.js
      Comment.js
      User.js
      Video.js
    routes/
      analytics.js
      auth.routes.js
      comments.js
      recommendations.js
      video.routes.js
    transcoder/
      worker.js
      check-setup.js
      test-job.js
      README.md
    utils/
      jwt.js
    seed.js
    server.js
    package.json

  frontend/
    dhrushyam/
      public/
      src/
        api/
          axios.js
        components/
          Navbar.jsx
          Footer.jsx
          VideoCard.jsx
          VideoCardSkeleton.jsx
          Sidebar.jsx
          CommentSection.jsx
        context/
          AuthContext.js
        pages/
          HomePage.jsx
          LoginPage.jsx
          RegisterPage.jsx
          ProfilePage.jsx
          VideoPlayerPage.jsx
          MusicPage.jsx
        App.jsx
        index.js
      package.json
```

## Prerequisites

Install these before running the project:

- Node.js 18 or newer
- npm
- MongoDB connection string, either local MongoDB or MongoDB Atlas
- Git

Optional for the transcoder:

- FFmpeg and FFprobe installed and available in your system PATH

## Environment Variables

Create a `.env` file inside `backend/`.

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://127.0.0.1:27017/dhrushyam

JWT_ACCESS_SECRET=replace_with_a_long_random_access_secret
JWT_REFRESH_SECRET=replace_with_a_long_random_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

CLIENT_URL=http://localhost:3000

UPLOAD_DIR=./uploads/raw
HLS_DIR=./uploads/hls
THUMB_DIR=./uploads/thumbnails
MAX_FILE_SIZE=2147483648
```

Notes:

- Do not commit `.env` to GitHub.
- `CLIENT_URL` must match the frontend dev server URL. For Create React App this is usually `http://localhost:3000`.
- The frontend defaults to `http://localhost:5000/api`.
- To override the frontend API URL, create `frontend/dhrushyam/.env` with:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## Installation

From the repository root:

```bash
cd backend
npm install
```

Then install the frontend dependencies:

```bash
cd ../frontend/dhrushyam
npm install
```

If you want to use the transcoder worker:

```bash
cd ../../backend/transcoder
npm install
```

## Running The App Locally

Start the backend:

```bash
cd backend
npm run dev
```

The backend should run at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

Start the frontend in another terminal:

```bash
cd frontend/dhrushyam
npm start
```

The frontend should open at:

```text
http://localhost:3000
```

## Available Scripts

### Backend

```bash
npm start
```

Runs the Express server with Node.

```bash
npm run dev
```

Runs the Express server with nodemon.

### Frontend

```bash
npm start
```

Runs the React development server.

```bash
npm run build
```

Builds the production React app.

```bash
npm test
```

Runs the React test runner.

## Frontend Routes

| Route | Page | Description |
| --- | --- | --- |
| `/` | `HomePage` | Public feed of uploaded videos |
| `/video/:id` | `VideoPlayerPage` | Watch a single video, like/dislike, comment, subscribe |
| `/login` | `LoginPage` | User login |
| `/register` | `RegisterPage` | User registration |
| `/profile` | `ProfilePage` | Protected creator dashboard, upload form, report form |

## Backend API Overview

All backend routes are mounted under `/api`.

### Health

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | Confirms the API server is running |

### Auth Routes

Mounted under `/api/auth`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/register` | No | Create a user account |
| `POST` | `/login` | No | Login and receive access/refresh tokens |
| `POST` | `/refresh` | No | Rotate refresh token and receive a new access token |
| `POST` | `/logout` | Yes | Logout current refresh token/session |
| `GET` | `/me` | Yes | Fetch current user profile |
| `PUT` | `/me` | Yes | Update profile fields |
| `PUT` | `/change-password` | Yes | Change account password |
| `POST` | `/users/:id/subscribe` | Yes | Subscribe/unsubscribe to a creator |

### Video Routes

Mounted under `/api/videos`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Optional | Public paginated feed of ready/public videos |
| `GET` | `/:id` | Optional | Fetch a single video |
| `POST` | `/` | Yes | Upload a video with multipart field `video` |
| `PUT` | `/:id` | Yes | Update video metadata as owner |
| `DELETE` | `/:id` | Yes | Delete video as owner/admin |
| `POST` | `/:id/like` | Yes | Toggle like |
| `POST` | `/:id/dislike` | Yes | Toggle dislike |
| `POST` | `/:id/view` | No | Increment view count |
| `POST` | `/init-upload` | Yes | Start chunked upload flow |
| `POST` | `/chunk` | Yes | Upload one chunk with multipart field `chunk` |
| `POST` | `/finalize` | Yes | Assemble chunks and queue transcoding |

### Comment Routes

Mounted under `/api/comments`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/:videoId` | No | Get comments for a video |
| `POST` | `/:videoId` | Yes | Add a comment |
| `DELETE` | `/:commentId` | Yes | Delete a comment |

### Analytics Routes

Mounted under `/api/analytics`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/event` | No | Log a view/like/watch analytics event |
| `GET` | `/video/:videoId` | No | Get aggregated video analytics |
| `GET` | `/creator` | Yes | Get creator dashboard analytics |

### Recommendation Routes

Mounted under `/api/recommendations`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/most-viewed` | No | Get globally most-viewed videos |
| `GET` | `/sidebar/:videoId` | No | Get related sidebar recommendations |

## Upload Flow

The current frontend upload form in `ProfilePage.jsx` uses the simple upload endpoint:

```text
POST /api/videos
Content-Type: multipart/form-data
Authorization: Bearer <accessToken>
```

Required fields:

- `video` - video file
- `title` - video title

Optional fields:

- `description`
- `tags`
- `category`

When a video is uploaded:

1. Multer saves the file into `backend/uploads/raw`.
2. The backend creates a `Video` document in MongoDB.
3. The video is marked as `status: "ready"` for direct local playback.
4. `hlsPath` points to the local uploaded file path.
5. The home feed reads ready/public videos from MongoDB.

The backend also contains chunked upload endpoints for larger or resumable uploads:

1. `POST /api/videos/init-upload`
2. `POST /api/videos/chunk`
3. `POST /api/videos/finalize`

The finalize step assembles chunks and writes a transcoder job file under `uploads/jobs`.

## Video Playback

`VideoPlayerPage.jsx` supports two playback styles:

- Direct browser playback for uploaded video files such as MP4/WebM.
- HLS playback for `.m3u8` streams using HLS.js.

For best browser compatibility, upload MP4 or WebM files. Some browsers do not support MKV direct playback unless the transcoder converts the video to HLS.

## MongoDB Models

### User

The `User` model stores:

- `username`
- `email`
- hashed `password`
- `avatar`
- `channelBanner`
- `bio`
- `subscribers`
- `subscribedTo`
- `refreshTokens`
- `role`
- `isActive`

Passwords are hashed automatically in a pre-save hook.

### Video

The `Video` model stores:

- `title`
- `description`
- `uploader`
- `rawFilePath`
- `hlsPath`
- `thumbnailPath`
- `status`
- `views`
- `likedBy`
- `dislikedBy`
- `duration`
- `tags`
- `category`
- `isPublic`
- `commentCount`

The public feed filters for:

```js
{ status: "ready", isPublic: true }
```

### Comment

The comment model is used for video discussion and is connected to users and videos.

### AnalyticsEvent

The analytics event model stores viewer interaction events for later aggregation.

## Authentication

The app uses:

- Access tokens for authenticated API requests
- Refresh tokens for session renewal
- Local storage on the frontend for token persistence
- `Authorization: Bearer <token>` headers for protected routes

The Axios client automatically attaches the access token and attempts refresh on `401` responses.

## Important Configuration Details

The frontend API URL is centralized in:

```text
frontend/dhrushyam/src/api/axios.js
```

Default:

```text
http://localhost:5000/api
```

The backend port comes from:

```text
backend/.env
```

Default used by the project:

```text
PORT=5000
```

If the frontend points at the wrong backend port, Axios may show:

```text
Network Error
```

Make sure the backend and frontend ports match the environment configuration.

## Static Files And Uploads

Uploaded files are served by Express:

```text
GET /uploads/...
```

Local upload folders should not be committed to GitHub:

```text
backend/uploads/
```

These are ignored by the root `.gitignore`.

## Transcoder Notes

The `backend/transcoder` folder contains a worker intended to process queued video jobs into HLS output and thumbnails.

Typical job flow:

1. Upload is finalized.
2. Backend writes a job file under `uploads/jobs`.
3. Worker reads the job.
4. FFmpeg creates HLS output under `uploads/hls`.
5. The worker updates the `Video` document with HLS and thumbnail paths.

See:

```text
backend/transcoder/README.md
```

## Seeding Data

The backend contains:

```text
backend/seed.js
```

Use it only after checking its MongoDB target and sample data behavior.

Example:

```bash
cd backend
node seed.js
```

## Troubleshooting

### Axios Network Error

Check:

- Backend is running.
- Backend health endpoint works: `http://localhost:5000/api/health`
- Frontend API URL is `http://localhost:5000/api`
- `CLIENT_URL=http://localhost:3000` in `backend/.env`
- No firewall or port conflict is blocking the server.

### Route Not Found During Upload

The frontend upload form posts to:

```text
POST /api/videos
```

Make sure the backend has restarted after route changes.

### Videos Upload But Do Not Appear On Home Page

The home feed only shows:

```js
status: "ready"
isPublic: true
```

Check the saved `Video` document in MongoDB.

### Video Appears But Does Not Play

Use MP4 or WebM for direct browser playback. For MKV and other formats, use the transcoder/HLS pipeline.

### CORS Errors

Check `CLIENT_URL` in `backend/.env`.

For local development:

```env
CLIENT_URL=http://localhost:3000
```

### MongoDB Connection Failed

Check:

- `MONGO_URI` is correct.
- MongoDB server or Atlas cluster is running.
- Atlas network access allows your IP.
- Username/password in the URI are URL-encoded if they contain special characters.

## Git Hygiene

The root `.gitignore` excludes:

- `node_modules`
- `.env` files
- frontend build output
- coverage output
- logs
- local uploaded media

Do not commit secrets, MongoDB credentials, generated builds, uploaded videos, or dependency folders.

## Recommended Development Workflow

1. Pull the latest branch.
2. Install dependencies in `backend` and `frontend/dhrushyam`.
3. Create or update `backend/.env`.
4. Start MongoDB.
5. Start backend with `npm run dev`.
6. Start frontend with `npm start`.
7. Register/login.
8. Upload a video from `/profile`.
9. Confirm it appears on `/`.
10. Open the video and verify playback.

## Deployment Notes

For production deployment:

- Use a hosted MongoDB database such as MongoDB Atlas.
- Store secrets in the hosting provider's environment variable system.
- Set `CLIENT_URL` to the deployed frontend URL.
- Set `REACT_APP_API_BASE_URL` to the deployed backend API URL.
- Serve uploaded media from durable storage, not a temporary local filesystem.
- Consider using object storage such as S3, Cloudinary, or a CDN-backed bucket for video files and thumbnails.
- Run the transcoder worker separately if HLS output is required.

## Current Limitations

- The current direct upload flow stores video files on the backend filesystem.
- Uploaded media persistence depends on the server filesystem.
- The dashboard currently includes mock chart data in the frontend.
- MKV support depends on browser capabilities unless transcoded.
- The transcoder pipeline exists separately and may need environment/tooling setup before production use.

## Useful URLs In Local Development

```text
Frontend:       http://localhost:3000
Backend API:    http://localhost:5000/api
Health check:   http://localhost:5000/api/health
Uploads:        http://localhost:5000/uploads
```

## License

No license file is currently included. Add one before publishing or accepting external contributions.
