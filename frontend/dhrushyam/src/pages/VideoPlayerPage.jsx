import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import api from '../api/axios';

// Handles both full CDN URLs and local server paths
function resolveUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
}

function formatViews(n = 0) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n;
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function VideoPlayerPage() {
  const { id } = useParams();
  const videoRef = useRef();
  const hlsRef = useRef();

  const [video, setVideo]         = useState(null);
  const [sidebar, setSidebar]     = useState([]);
  const [comments, setComments]   = useState([]);
  const [text, setText]           = useState('');
  const [liked, setLiked]         = useState(false);
  const [disliked, setDisliked]   = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [levels, setLevels]       = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [loading, setLoading]     = useState(true);

  // ── Fetch video + comments + sidebar ──────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/videos/${id}`),
      api.get(`/comments/${id}`),
      api.get('/videos/feed'),          // sidebar: most-viewed videos
    ]).then(([vRes, cRes, feedRes]) => {
      const v = vRes.data.video;
      setVideo(v);
      setLikeCount(v.likedBy?.length || 0);
      setComments(cRes.data || []);
      // exclude current video from sidebar
      setSidebar((feedRes.data.videos || []).filter(s => s._id !== id).slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // ── HLS player setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!video?.hlsPath || !videoRef.current) return;

    const src = resolveUrl(video.hlsPath);

    if (hlsRef.current) { hlsRef.current.destroy(); }

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1 });
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        videoRef.current.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src; // Safari native HLS
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [video]);

  const handleQuality = (e) => {
    const level = parseInt(e.target.value, 10);
    setCurrentLevel(level);
    if (hlsRef.current) hlsRef.current.currentLevel = level;
  };

  const qualityLabel = (lvl) => {
    if (!lvl) return 'Auto';
    if (lvl.height >= 1080) return '1080p';
    if (lvl.height >= 720)  return '720p';
    if (lvl.height >= 480)  return '480p';
    return '360p';
  };

  // ── Like / Dislike ────────────────────────────────────────────────────────
  const handleLike = async () => {
    try {
      const res = await api.post(`/videos/${id}/like`);
      setLikeCount(res.data.likes);
      setLiked(prev => !prev);
      if (disliked) setDisliked(false);
    } catch { /* not logged in — ignore */ }
  };

  const handleDislike = async () => {
    try {
      await api.post(`/videos/${id}/dislike`);
      setDisliked(prev => !prev);
      if (liked) { setLiked(false); setLikeCount(c => c - 1); }
    } catch { /* not logged in — ignore */ }
  };

  // ── Add comment ───────────────────────────────────────────────────────────
  const addComment = async () => {
    if (!text.trim()) return;
    await api.post(`/comments/${id}`, { text });
    setText('');
    const res = await api.get(`/comments/${id}`);
    setComments(res.data || []);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    page:    { display: 'flex', gap: 24, padding: '20px 24px', background: '#0f0f0f', minHeight: '100vh', color: '#fff' },
    main:    { flex: 1, minWidth: 0 },
    sidebar: { width: 360, flexShrink: 0 },

    playerWrap: { position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden' },
    video:      { width: '100%', display: 'block' },

    qualitySelect: {
      position: 'absolute', bottom: 52, right: 10, zIndex: 10,
      background: 'rgba(0,0,0,0.78)', color: '#fff',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: 4, padding: '3px 8px', fontSize: 13, cursor: 'pointer',
    },

    title:   { fontSize: 20, fontWeight: 700, margin: '14px 0 6px' },
    metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    meta:    { color: '#aaa', fontSize: 14 },

    actions: { display: 'flex', gap: 10 },
    btn: (active) => ({
      display: 'flex', alignItems: 'center', gap: 6,
      background: active ? '#ff0000' : '#272727',
      color: active ? '#fff' : '#aaa',
      border: 'none', borderRadius: 20, padding: '7px 16px',
      fontSize: 14, fontWeight: 600, cursor: 'pointer',
      transition: 'background 0.15s',
    }),

    divider: { border: 'none', borderTop: '1px solid #272727', margin: '18px 0' },

    commentInput: {
      flex: 1, background: '#181818', border: '1px solid #303030',
      borderRadius: 20, padding: '10px 15px', color: '#fff', fontSize: 14,
      outline: 'none',
    },
    postBtn: {
      background: '#ff0000', color: '#fff', border: 'none',
      borderRadius: 20, padding: '10px 18px', fontWeight: 600,
      fontSize: 14, cursor: 'pointer',
    },

    avatar: (size = 36) => ({
      width: size, height: size, borderRadius: '50%',
      background: '#ff0000', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }),

    // Sidebar card
    sideCard: {
      display: 'flex', gap: 10, marginBottom: 12,
      textDecoration: 'none', color: '#fff',
    },
    sideThumb: { width: 168, height: 94, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#272727' },
    sideInfo:  { flex: 1, overflow: 'hidden' },
    sideTitle: {
      fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 4,
      display: '-webkit-box', WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical', overflow: 'hidden',
    },
    sideMeta: { fontSize: 12, color: '#aaa', margin: 0 },
  };

  if (loading) return (
    <div style={{ ...S.page, justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: '#aaa' }}>Loading…</p>
    </div>
  );

  if (!video) return (
    <div style={{ ...S.page, justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: '#aaa' }}>Video not found.</p>
    </div>
  );

  return (
    <div style={S.page}>

      {/* ── Main column ── */}
      <div style={S.main}>

        {/* Player */}
        <div style={S.playerWrap}>
          <video ref={videoRef} controls style={S.video} poster={resolveUrl(video.thumbnailPath)} />
          {levels.length > 1 && (
            <select style={S.qualitySelect} value={currentLevel} onChange={handleQuality}>
              <option value={-1}>Auto</option>
              {levels.map((lvl, i) => (
                <option key={i} value={i}>{qualityLabel(lvl)}</option>
              ))}
            </select>
          )}
        </div>

        {/* Title */}
        <h2 style={S.title}>{video.title}</h2>

        {/* Meta + actions */}
        <div style={S.metaRow}>
          <p style={S.meta}>
            {formatViews(video.views)} views
            {video.category ? ` · ${video.category}` : ''}
            {video.createdAt ? ` · ${timeAgo(video.createdAt)}` : ''}
          </p>

          <div style={S.actions}>
            <button style={S.btn(liked)} onClick={handleLike}>
              👍 {likeCount}
            </button>
            <button style={S.btn(disliked)} onClick={handleDislike}>
              👎
            </button>
            <button style={S.btn(false)}>
              🔗 Share
            </button>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div style={{ background: '#181818', borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
            <p style={{ fontSize: 14, color: '#ccc', margin: 0, lineHeight: 1.6 }}>
              {video.description}
            </p>
            {video.tags?.length > 0 && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#ff0000' }}>
                {video.tags.map(t => `#${t}`).join(' ')}
              </p>
            )}
          </div>
        )}

        <hr style={S.divider} />

        {/* Comments */}
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Comments ({comments.length})
        </h3>

        {/* Add comment */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
          <div style={S.avatar(36)}>U</div>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addComment()}
            placeholder="Add a comment…"
            style={S.commentInput}
          />
          <button onClick={addComment} style={S.postBtn}>Post</button>
        </div>

        {/* Comment list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {comments.map(c => (
            <div key={c._id} style={{ display: 'flex', gap: 12 }}>
              <div style={S.avatar(36)}>
                {(c.user?.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 3 }}>
                  {c.user?.username || 'User'}
                  <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                    {timeAgo(c.createdAt)}
                  </span>
                </p>
                <p style={{ color: '#ccc', fontSize: 14, margin: 0 }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div style={S.sidebar}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#aaa' }}>
          Up next
        </h3>

        {sidebar.map(s => (
          <Link key={s._id} to={`/video/${s._id}`} style={S.sideCard}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={resolveUrl(s.thumbnailPath)}
                alt={s.title}
                style={S.sideThumb}
                onError={e => { e.target.src = `https://picsum.photos/seed/${s._id}/320/180`; }}
              />
              {s.duration && (
                <span style={{
                  position: 'absolute', bottom: 4, right: 4,
                  background: 'rgba(0,0,0,0.82)', color: '#fff',
                  fontSize: 11, fontWeight: 600, padding: '1px 4px', borderRadius: 3,
                }}>
                  {formatDuration(s.duration)}
                </span>
              )}
            </div>
            <div style={S.sideInfo}>
              <p style={S.sideTitle}>{s.title}</p>
              <p style={S.sideMeta}>{s.uploader?.username || 'Unknown'}</p>
              <p style={S.sideMeta}>{formatViews(s.views)} views</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}