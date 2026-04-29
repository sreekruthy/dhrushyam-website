import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Eye, ThumbsUp, ThumbsDown, Share2, Download,
         Send, Maximize, Play } from 'lucide-react';

const fmt = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n;
};

export default function VideoPlayerPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [sidebar, setSidebar] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetchVideo();
    fetchSidebar();
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (video?.hlsPath && videoRef.current) {
      const src = `http://localhost:5000/${video.hlsPath}`;
      if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = src;
      }
    }
  }, [video]);

  const fetchVideo = async () => {
    try {
      const { data } = await api.get(`/videos/${id}`);
      setVideo(data.video);
      setLiked(data.video.hasLiked || false);
      setDisliked(data.video.hasDisliked || false);
      setLikeCount(data.video.likeCount || 0);
      setDislikeCount(data.video.dislikeCount || 0);
      // log view
      await api.post(`/videos/${id}/view`).catch(() => {});
    } catch (e) { console.error(e); }
  };

  const fetchSidebar = async () => {
    try {
      const { data } = await api.get(`/recommendations/sidebar/${id}`);
      setSidebar(data);
    } catch { setSidebar([]); }
  };

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${id}`);
      setComments(Array.isArray(data) ? data : []);
    } catch { setComments([]); }
  };

  const handleLike = async () => {
    if (!user) return alert('Login to like');
    try {
      const { data } = await api.post(`/videos/${id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      setDislikeCount(data.dislikeCount);
      if (data.liked) setDisliked(false);
    } catch {}
  };

  const handleDislike = async () => {
    if (!user) return alert('Login to dislike');
    try {
      const { data } = await api.post(`/videos/${id}/dislike`);
      setDisliked(data.disliked);
      setDislikeCount(data.dislikeCount);
      setLikeCount(data.likeCount);
      if (data.disliked) setLiked(false);
    } catch {}
  };

  const handleComment = async () => {
    if (!user) return alert('Login to comment');
    if (!commentText.trim()) return;
    try {
      await api.post(`/comments/${id}`, { text: commentText });
      setCommentText('');
      fetchComments();
    } catch {}
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) videoRef.current.requestFullscreen?.();
  };

  if (!video) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '60vh', color: '#a78bfa', fontSize: '1.2rem' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem',
      display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>

      {/* ── Left: Player + Info ── */}
      <div>
        {/* Video Player */}
        <div style={{ position: 'relative', background: '#000', borderRadius: '12px',
          overflow: 'hidden', aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={togglePlay}
          />
          {/* Overlay controls */}
          {!playing && (
            <div onClick={togglePlay} style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(124,58,237,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={30} color="white" style={{ marginLeft: 4 }} />
              </div>
            </div>
          )}
          <button onClick={toggleFullscreen} style={{
            position: 'absolute', bottom: 12, right: 12,
            background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
            borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
          }}>
            <Maximize size={18} />
          </button>
        </div>

        {/* Title + Actions */}
        <div style={{ marginTop: '1rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {video.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem',
            flexWrap: 'wrap', color: '#9ca3af', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={16} /> {fmt(video.views)}
            </span>
            <span>📅 {new Date(video.createdAt).toISOString().split('T')[0]}</span>

            {/* Like */}
            <button onClick={handleLike} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: liked ? '#7c3aed' : '#1a1a2e',
              border: '1px solid #3d3d6b', borderRadius: '2rem',
              color: 'white', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600,
            }}>
              <ThumbsUp size={16} /> {fmt(likeCount)}
            </button>

            {/* Dislike */}
            <button onClick={handleDislike} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: disliked ? '#dc2626' : '#1a1a2e',
              border: '1px solid #3d3d6b', borderRadius: '2rem',
              color: 'white', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600,
            }}>
              <ThumbsDown size={16} /> {fmt(dislikeCount)}
            </button>

            <button onClick={() => navigator.clipboard?.writeText(window.location.href)}
              style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: '#1a1a2e', border: '1px solid #3d3d6b', borderRadius: '2rem',
                color: 'white', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
              <Share2 size={16} /> Share
            </button>

            <button style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: '#7c3aed', border: 'none', borderRadius: '2rem',
              color: 'white', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
              <Download size={16} /> Download
            </button>
          </div>

          {/* Uploader */}
          <div style={{ marginTop: '0.75rem', color: '#c4b5fd', fontWeight: 600 }}>
            {video.uploader?.username}
          </div>
          {video.description && (
            <p style={{ marginTop: '0.4rem', color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {video.description}
            </p>
          )}
        </div>

        {/* Comments */}
        <div style={{ marginTop: '1.5rem', background: '#1a1a2e', borderRadius: '12px', padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            💬 Comments ({comments.length})
          </h3>

          {/* Input */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Add a comment..."
              style={{
                flex: 1, background: '#0d0d1a', border: '1px solid #3d3d6b',
                borderRadius: '8px', padding: '0.6rem 1rem', color: 'white',
                fontSize: '0.9rem', outline: 'none',
              }}
            />
            <button onClick={handleComment} style={{
              background: '#7c3aed', border: 'none', borderRadius: '8px',
              padding: '0.6rem 1rem', color: 'white', cursor: 'pointer',
            }}>
              <Send size={18} />
            </button>
          </div>

          {/* Comment list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.map((c, i) => (
              <div key={c._id || i} style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `hsl(${(c.user?.username?.charCodeAt(0) || 65) * 5}, 60%, 50%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem',
                }}>
                  {(c.user?.username || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {c.user?.username || 'User'}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      {new Date(c.createdAt || Date.now()).toISOString().split('T')[0]}
                    </span>
                  </div>
                  <p style={{ color: '#d1d5db', fontSize: '0.9rem', marginTop: 2 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Sidebar ── */}
      <div>
        <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Recommended</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sidebar.map(v => (
            <Link key={v._id} to={`/video/${v._id}`}
              style={{ display: 'flex', gap: '0.75rem', textDecoration: 'none', color: 'inherit',
                background: '#1a1a2e', borderRadius: '10px', overflow: 'hidden',
                transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <img
                src={v.thumbnailPath
                  ? `http://localhost:5000/${v.thumbnailPath}`
                  : `https://picsum.photos/seed/${v._id}/160/90`}
                alt={v.title}
                style={{ width: 120, height: 68, objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ padding: '0.5rem 0.5rem 0.5rem 0', flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {v.title}
                </p>
                <p style={{ color: '#9b59b6', fontSize: '0.75rem', marginTop: 4 }}>
                  {v.uploader?.username}
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {fmt(v.views)} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}