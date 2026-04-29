import { useState, useEffect } from 'react';
import api from '../api/axios';
import VideoCard from '../components/VideoCard';
import VideoCardSkeleton from '../components/VideoCardSkeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVideos(page);
  }, [page]);

  const fetchVideos = async (p) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/videos?page=${p}&limit=12`);
      setVideos(data.videos);
      setTotalPages(data.pagination.totalPages);
    } catch {
      // fallback: show mock data so UI looks good during dev
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>
        Recommended Videos
      </h2>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {loading
          ? Array(12).fill(0).map((_, i) => <VideoCardSkeleton key={i} />)
          : videos.map(v => <VideoCard key={v._id} video={v} />)
        }
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              background: page === 1 ? '#2d2d4e' : '#7c3aed',
              border: 'none', color: 'white', padding: '0.5rem 1.25rem',
              borderRadius: '2rem', cursor: page === 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600,
            }}
          >
            <ChevronLeft size={18} /> Prev
          </button>

          <span style={{ color: '#a78bfa', fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              background: page === totalPages ? '#2d2d4e' : '#7c3aed',
              border: 'none', color: 'white', padding: '0.5rem 1.25rem',
              borderRadius: '2rem', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600,
            }}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}