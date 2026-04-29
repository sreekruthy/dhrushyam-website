import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', background: '#1a1a2e', border: '1px solid #3d3d6b',
    borderRadius: '10px', padding: '0.75rem 1rem', color: 'white',
    fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '2.5rem',
        width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 0.75rem',
            background: 'linear-gradient(135deg, #f6ad55, #ed8936)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Video size={30} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Welcome back</h1>
          <p style={{ color: '#9ca3af', marginTop: 4 }}>Sign in to Dhrushyam</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #dc2626',
            borderRadius: '8px', padding: '0.75rem', color: '#f87171',
            marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handle(e)}
            style={inputStyle}
          />
          <button onClick={handle} disabled={loading} style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            border: 'none', borderRadius: '10px', color: 'white',
            padding: '0.85rem', fontSize: '1rem', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}