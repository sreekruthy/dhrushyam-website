import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, Clock } from 'lucide-react';

const formatCount = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n;
};

const formatDate = (d) => new Date(d).toISOString().split('T')[0];

export default function VideoCard({ video }) {
  return (
    <Link to={`/video/${video._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden',
        transition: 'transform 0.2s', cursor: 'pointer',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative' }}>
          <img
            src={video.thumbnailPath
              ? `http://localhost:5000/${video.thumbnailPath}`
              : `https://picsum.photos/seed/${video._id}/480/270`}
            alt={video.title}
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
          />
          {video.duration > 0 && (
            <span style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(0,0,0,0.8)', color: 'white',
              padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
            }}>
              {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.3rem',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {video.title}
          </h3>
          <p style={{ color: '#a78bfa', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
            {video.uploader?.username || 'Unknown'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={14} /> {formatCount(video.views)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ThumbsUp size={14} /> {formatCount(video.likeCount || 0)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> {formatDate(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}