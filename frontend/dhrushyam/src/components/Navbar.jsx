import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Music, User, LogOut, Video } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #e53e3e 0%, #9b2c9b 40%, #4c1d95 70%, #3730a3 100%)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '80px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f6ad55, #ed8936)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Video size={24} color="white" />
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>Dhrushyam</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontStyle: 'italic' }}>
            Exploring the unknown with fun
          </div>
        </div>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {[
          { to: '/', icon: <Home size={18} />, label: 'Home' },
          { to: '/music', icon: <Music size={18} />, label: 'Music' },
        ].map(({ to, icon, label }) => (
          <Link key={to} to={to} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: 'white', textDecoration: 'none',
            background: 'rgba(255,255,255,0.15)',
            padding: '0.5rem 1.25rem', borderRadius: '2rem',
            fontWeight: 600, fontSize: '0.95rem',
            backdropFilter: 'blur(8px)',
          }}>
            {icon} {label}
          </Link>
        ))}

        {user ? (
          <>
            <Link to="/profile" style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: 'white', textDecoration: 'none',
              background: 'rgba(255,255,255,0.15)',
              padding: '0.5rem 1.25rem', borderRadius: '2rem',
              fontWeight: 600, fontSize: '0.95rem',
            }}>
              <User size={18} /> Profile
            </Link>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: 'white', background: 'rgba(239,68,68,0.3)',
              border: 'none', padding: '0.5rem 1.25rem', borderRadius: '2rem',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem',
            }}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: 'white', textDecoration: 'none',
            background: 'rgba(255,255,255,0.15)',
            padding: '0.5rem 1.25rem', borderRadius: '2rem',
            fontWeight: 600,
          }}>
            <User size={18} /> Profile
          </Link>
        )}
      </div>
    </nav>
  );
}