import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Heart, Share2, Download, Play } from 'lucide-react';

const fmt = (n) => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n;
};

const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function MusicPage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedTracks, setLikedTracks] = useState(new Set());

  useEffect(() => { fetchTracks(); }, []);

  const fetchTracks = async () => {
    try {
      const { data } = await api.get('/music');
      setTracks(data);
    } catch { setTracks([]); }
    finally { setLoading(false); }
  };

  const handlePlay = async (id) => {
    try { await api.post(`/music/${id}/play`); } catch {}
  };

  const handleLike = async (id) => {
    if (!user) return alert('Login to like');
    try {
      await api.post(`/music/${id}/like`);
      setLikedTracks(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    } catch {}
  };

  const handleShare = (track) => {
    navigator.clipboard?.writeText(window.location.origin + '/music');
    alert('Link copied!');
  };

  const handleDownload = (track) => {
    if (track.fileUrl) window.open(track.fileUrl, '_blank');
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
        Music Library
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
        Discover and enjoy amazing music from talented artists
      </p>

      {loading ? (
        <p style={{ color: '#a78bfa' }}>Loading tracks...</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
        }}>
          {tracks.map(track => (
            <div key={track._id} style={{
              background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden',
            }}>
              {/* Cover */}
              <div style={{ position: 'relative' }}>
                <img
                  src={track.coverArt || `https://picsum.photos/seed/${track._id}/480/270`}
                  alt={track.title}
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                />
                {track.duration > 0 && (
                  <span style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(0,0,0,0.75)', color: 'white',
                    padding: '2px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                  }}>
                    {fmtDuration(track.duration)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{track.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                  {track.artist}
                </p>
                <p style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {fmt(track.plays)} plays
                </p>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => { handleLike(track._id); }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: likedTracks.has(track._id) ? '#7c3aed' : '#2d2d4e',
                      border: 'none', borderRadius: '8px', color: 'white',
                      padding: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    }}
                  >
                    <Heart size={16} fill={likedTracks.has(track._id) ? 'white' : 'none'} /> Like
                  </button>
                  <button
                    onClick={() => handleShare(track)}
                    style={{
                      background: '#2d2d4e', border: 'none', borderRadius: '8px',
                      color: 'white', padding: '0.5rem 0.75rem', cursor: 'pointer',
                    }}
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(track)}
                    style={{
                      background: '#2d2d4e', border: 'none', borderRadius: '8px',
                      color: 'white', padding: '0.5rem 0.75rem', cursor: 'pointer',
                    }}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}