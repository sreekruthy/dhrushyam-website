import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';
import api, { API_ORIGIN } from '../api/axios';

// Handles both full CDN URLs and local server paths
function resolveUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}

function formatViews(n = 0) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n;
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
  const [comments, setComments]   = useState([]);
  const [text, setText]           = useState('');
  const [liked, setLiked]         = useState(false);
  const [disliked, setDisliked]   = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [levels, setLevels]       = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [loading, setLoading]     = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  // ── Fetch video + comments ────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    api.get(`/videos/${id}`)
      .then(vRes => {
        const v = vRes.data.video;
        setVideo(v);
        setLikeCount(v.likeCount || 0);
        setLiked(v.hasLiked || false);
        setDisliked(v.hasDisliked || false);
        setSubscribed(v.isSubscribed || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    api.get(`/comments/${id}`)
      .then(res => setComments(res.data || []))
      .catch(() => setComments([]));
  }, [id]);

  // ── HLS player setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!video?.hlsPath || !videoRef.current) return;

    const src = resolveUrl(video.hlsPath);
    const isHls = src.includes('.m3u8');

    if (hlsRef.current) { hlsRef.current.destroy(); }
    videoRef.current.removeAttribute('src');

    if (!isHls) {
      videoRef.current.src = src;
      videoRef.current.load();
      api.post(`/videos/${id}/view`).catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1 });
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        videoRef.current.play().catch(() => {});
        api.post(`/videos/${id}/view`).catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src;
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [video, id]);

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
      setLikeCount(res.data.likeCount);
      setLiked(res.data.liked);
      if (res.data.liked) setDisliked(false);
    } catch (err) {
      if (err.response?.status === 401) alert('Please login to like videos');
    }
  };

  const handleDislike = async () => {
    try {
      const res = await api.post(`/videos/${id}/dislike`);
      setDisliked(res.data.disliked);
      if (res.data.disliked) { setLiked(false); setLikeCount(res.data.likeCount); }
    } catch (err) {
      if (err.response?.status === 401) alert('Please login to dislike videos');
    }
  };

  // ── Subscribe ─────────────────────────────────────────────────────────────
  const handleSubscribe = async () => {
    try {
      setSubLoading(true);
      const uploaderId = video?.uploader?._id;
      if (!uploaderId) return;
      const res = await api.post(`/auth/users/${uploaderId}/subscribe`);
      setSubscribed(res.data.subscribed);
    } catch (err) {
      if (err.response?.status === 401) alert('Please login to subscribe');
    } finally {
      setSubLoading(false);
    }
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
    page: {
      display: 'flex',
      justifyContent: 'center',
      padding: '20px 24px',
      background: '#0f0f0f',
      minHeight: '100vh',
      color: '#fff',
    },
    // Centered single-column, wider layout
    main: {
      width: '100%',
      maxWidth: 960,
    },

    playerWrap: {
      position: 'relative',
      background: '#000',
      borderRadius: 10,
      overflow: 'hidden',
      aspectRatio: '16/9',
    },
    video: { width: '100%', height: '100%', display: 'block', objectFit: 'contain' },

    qualitySelect: {
      position: 'absolute', bottom: 52, right: 10, zIndex: 10,
      background: 'rgba(0,0,0,0.78)', color: '#fff',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: 4, padding: '3px 8px', fontSize: 13, cursor: 'pointer',
    },

    title: { fontSize: 22, fontWeight: 700, margin: '14px 0 10px' },

    // Row: uploader info + subscribe on left, actions on right
    channelRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 10,
    },
    channelLeft: { display: 'flex', alignItems: 'center', gap: 12 },

    avatar: (size = 40) => ({
      width: size, height: size, borderRadius: '50%',
      background: '#ff0000', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }),

    channelName: { fontSize: 15, fontWeight: 600 },
    subCount:    { fontSize: 13, color: '#aaa', marginTop: 1 },

    subscribeBtn: (active) => ({
      background: active ? '#272727' : '#ff0000',
      color: active ? '#aaa' : '#fff',
      border: 'none',
      borderRadius: 20,
      padding: '9px 20px',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'background 0.2s',
      letterSpacing: 0.3,
    }),

    metaRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    meta: { color: '#aaa', fontSize: 14 },

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

  const uploaderName = video.uploader?.username || 'Unknown';

  return (
    <div style={S.page}>
      <div style={S.main}>

        {/* ── Player ── */}
        <div style={S.playerWrap}>
          <video
            ref={videoRef}
            controls
            style={S.video}
            poster={resolveUrl(video.thumbnailPath)}
          />
          {levels.length > 1 && (
            <select style={S.qualitySelect} value={currentLevel} onChange={handleQuality}>
              <option value={-1}>Auto</option>
              {levels.map((lvl, i) => (
                <option key={i} value={i}>{qualityLabel(lvl)}</option>
              ))}
            </select>
          )}
        </div>

        {/* ── Title ── */}
        <h2 style={S.title}>{video.title}</h2>

        {/* ── Channel row: avatar + name + subscribe ── */}
        <div style={S.channelRow}>
          <div style={S.channelLeft}>
            <div style={S.avatar(40)}>
              {uploaderName[0].toUpperCase()}
            </div>
            <div>
              <div style={S.channelName}>{uploaderName}</div>
              {video.uploader?.subscribers != null && (
                <div style={S.subCount}>
                  {formatViews(video.uploader.subscribers?.length ?? 0)} subscribers
                </div>
              )}
            </div>
            <button
              style={S.subscribeBtn(subscribed)}
              onClick={handleSubscribe}
              disabled={subLoading}
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* ── Like / Dislike / Share ── */}
          <div style={S.actions}>
            <button style={S.btn(liked)} onClick={handleLike}>
              👍 {likeCount}
            </button>
            <button style={S.btn(disliked)} onClick={handleDislike}>
              👎
            </button>
            <button style={S.btn(false)} onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied!');
            }}>
              🔗 Share
            </button>
          </div>
        </div>

        {/* ── Views / meta ── */}
        <div style={S.metaRow}>
          <p style={S.meta}>
            {formatViews(video.views)} views
            {video.category ? ` · ${video.category}` : ''}
            {video.createdAt ? ` · ${timeAgo(video.createdAt)}` : ''}
          </p>
        </div>

        {/* ── Description ── */}
        {video.description && (
          <div style={{ background: '#181818', borderRadius: 8, padding: '12px 14px', marginTop: 4 }}>
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

        {/* ── Comments ── */}
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Comments ({comments.length})
        </h3>

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
    </div>
  );
}
