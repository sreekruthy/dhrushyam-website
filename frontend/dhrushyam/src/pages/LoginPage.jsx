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
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>

      <div style={{
        background: '#181818',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: 400
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 55,
            height: 55,
            borderRadius: '50%',
            background: '#ff0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px'
          }}>
            <Video size={26} color="white" />
          </div>
          <h2 style={{ fontWeight: 700 }}>Sign in</h2>
        </div>

        {error && (
          <div style={{
            background: '#2a0000',
            border: '1px solid red',
            padding: '0.6rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{
              background: '#121212',
              border: '1px solid #303030',
              padding: '0.7rem',
              borderRadius: '6px',
              color: 'white'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{
              background: '#121212',
              border: '1px solid #303030',
              padding: '0.7rem',
              borderRadius: '6px',
              color: 'white'
            }}
          />

          <button
            onClick={handle}
            disabled={loading}
            style={{
              background: '#ff0000',
              border: 'none',
              padding: '0.7rem',
              borderRadius: '20px',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          New here?{' '}
          <Link to="/register" style={{ color: '#3ea6ff' }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}