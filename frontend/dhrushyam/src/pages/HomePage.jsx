import { useEffect, useState } from 'react';
import api from '../api/axios';
import VideoCard from '../components/VideoCard';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/videos')
      .then(res => {
        setVideos(res.data.videos || []);
        setError('');
      })
      .catch(() => {
        setVideos([]);
        setError('Cannot connect to the backend. Please make sure it is running.');
      });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {error && (
        <div style={{
          background: '#2a0000',
          border: '1px solid #ff0000',
          borderRadius: 8,
          color: '#ff6666',
          marginBottom: 20,
          padding: '12px 14px',
        }}>
          {error}
        </div>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20
      }}>
        {videos.map(v => <VideoCard key={v._id} video={v} />)}
      </div>
    </div>
  );
}
