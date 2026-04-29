import { Link } from 'react-router-dom';

export default function VideoCard({ video }) {
  return (
    <Link to={`/video/${video._id}`}>
      <div style={{
        background: '#181818',
        borderRadius: 10,
        overflow: 'hidden'
      }}>
        <img
          src={`http://localhost:5000/${video.thumbnailPath}`}
          style={{ width: '100%', aspectRatio: '16/9' }}
        />

        <div style={{ padding: 10 }}>
          <h4 style={{ fontSize: 14 }}>{video.title}</h4>
          <p style={{ color: '#aaa', fontSize: 12 }}>
            {video.uploader?.username}
          </p>
        </div>
      </div>
    </Link>
  );
}