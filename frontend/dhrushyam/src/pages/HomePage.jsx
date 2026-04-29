import { useEffect, useState } from 'react';
import api from '../api/axios';
import VideoCard from '../components/VideoCard';

export default function HomePage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    api.get('/videos').then(res => setVideos(res.data.videos));
  }, []);

  return (
    <div style={{ padding: 20 }}>
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