import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function MusicPage() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    api.get('/music').then(res => setTracks(res.data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {tracks.map(t => (
        <div key={t._id} style={{
          background: '#181818',
          padding: 10,
          marginBottom: 10
        }}>
          <h4>{t.title}</h4>
          <button onClick={() => api.post(`/music/${t._id}/like`)}>
            Like
          </button>
        </div>
      ))}
    </div>
  );
}