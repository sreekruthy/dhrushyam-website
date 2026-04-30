import { Link } from 'react-router-dom';

// Handles both full CDN URLs (seeded data) and local server paths (teammate's upload)
function resolveUrl(path) {
  if (!path) return 'https://picsum.photos/seed/default/640/360';
  if (path.startsWith('http')) return path;           // already a full URL
  return `http://localhost:5000${path}`;              // local server path
}

function formatViews(n) {
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

export default function VideoCard({ video }) {
  const initial = (video.uploader?.username || 'U')[0].toUpperCase();

  return (
    <Link to={`/video/${video._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#181818',
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'transform 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {/* Thumbnail with duration badge */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
          <img
            src={resolveUrl(video.thumbnailPath)}
            alt={video.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => {
              e.target.src = `https://picsum.photos/seed/${video._id}/640/360`;
            }}
          />
          {video.duration && (
            <span style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              background: 'rgba(0,0,0,0.82)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 5px',
              borderRadius: 4,
            }}>
              {formatDuration(video.duration)}
            </span>
          )}
        </div>

        {/* Info row */}
        <div style={{ display: 'flex', gap: 10, padding: '10px 10px 12px' }}>
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#ff0000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0,
          }}>
            {initial}
          </div>

          {/* Text */}
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{
              fontSize: 14, fontWeight: 600, color: '#fff',
              margin: 0, marginBottom: 4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {video.title}
            </h4>
            <p style={{ fontSize: 12, color: '#aaa', margin: 0, marginBottom: 2 }}>
              {video.uploader?.username || 'Unknown'}
            </p>
            <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>
              {formatViews(video.views)} views
              {video.category ? ` · ${video.category}` : ''}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}