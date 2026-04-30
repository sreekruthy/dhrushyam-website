import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      height: 60,
      background: '#0f0f0f',
      borderBottom: '1px solid #303030',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ fontWeight: 700, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#ff0000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Video size={16} color="white" />
        </div>
        Dhrushyam
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 14 }}>
        <Link to="/" style={{ color: '#aaaaaa' }}>Home</Link>

        {user ? (
          <>
            {/* Profile link — Member 5 */}
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#181818',
                border: '1px solid #303030',
                borderRadius: 20,
                padding: '5px 14px',
                color: '#ffffff',
                fontSize: 13,
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: '50%', background: '#ff0000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {user.username ? user.username.slice(0, 2).toUpperCase() : 'ME'}
              </span>
              {user.username || 'Profile'}
            </Link>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{
                background: 'none',
                border: '1px solid #303030',
                color: '#aaaaaa',
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            style={{
              background: '#ff0000',
              color: '#fff',
              padding: '5px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
