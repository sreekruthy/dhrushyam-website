import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      zIndex: 100
    }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: 20 }}>
        ▶ Dhrushyam
      </Link>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/">Home</Link>

        {user ? (
          <button onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </div>
  );
}