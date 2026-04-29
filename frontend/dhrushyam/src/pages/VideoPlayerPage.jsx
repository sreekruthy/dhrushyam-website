import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';
import api from '../api/axios';

export default function VideoPlayerPage() {
  const { id } = useParams();
  const videoRef = useRef();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    api.get(`/videos/${id}`).then(res => setVideo(res.data.video));
    api.get(`/comments/${id}`).then(res => setComments(res.data));
  }, [id]);

  useEffect(() => {
    if (video?.hlsPath && videoRef.current) {
      const hls = new Hls();
      hls.loadSource(`http://localhost:5000/${video.hlsPath}`);
      hls.attachMedia(videoRef.current);
    }
  }, [video]);

  const addComment = async () => {
    if (!text.trim()) return;
    await api.post(`/comments/${id}`, { text });
    setText('');
    const res = await api.get(`/comments/${id}`);
    setComments(res.data);
  };

  if (!video) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <video ref={videoRef} controls style={{ width: '100%' }} />

      <h2>{video.title}</h2>

      {/* COMMENTS */}
<div style={{
  marginTop: 30,
  maxWidth: 800
}}>
  <h3 style={{ marginBottom: 15 }}>
    Comments ({comments.length})
  </h3>

  {/* Add comment */}
  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
    <input
      value={text}
      onChange={e => setText(e.target.value)}
      placeholder="Add a comment..."
      style={{
        flex: 1,
        background: '#181818',
        border: '1px solid #303030',
        borderRadius: 20,
        padding: '10px 15px',
        color: 'white'
      }}
    />

    <button onClick={addComment} style={{
      background: '#ff0000',
      padding: '10px 16px',
      borderRadius: 20,
      color: 'white',
      fontWeight: 600
    }}>
      Post
    </button>
  </div>

  {/* Comment list */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
    {comments.map(c => (
      <div key={c._id} style={{ display: 'flex', gap: 10 }}>

        {/* Avatar */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#ff0000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700
        }}>
          {(c.user?.username || 'U')[0]}
        </div>

        {/* Content */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            {c.user?.username || 'User'}
          </p>

          <p style={{ color: '#aaa', fontSize: 13 }}>
            {c.text}
          </p>
        </div>

      </div>
    ))}
  </div>
</div>
    </div>
  );
}