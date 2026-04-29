import { Link } from 'react-router-dom';
import { FaYoutube, FaTwitter, FaInstagram, FaFacebook } from 'react-icons/fa';
export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0d1a 100%)',
      borderTop: '1px solid #2d2d4e',
      padding: '2.5rem 3rem',
      marginTop: '3rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '1rem',
    }}>
      <div>
        <div style={{ color: '#f6ad55', fontSize: '1.5rem', fontWeight: 800 }}>Dhrushyam</div>
        <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: 4 }}>
          Exploring the unknown with fun
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {[
          { icon: <FaYoutube size={20} />, href: '#' },
          { icon: <FaTwitter size={20} />, href: '#' },
          { icon: <FaInstagram size={20} />, href: '#' },
          { icon: <FaFacebook size={20} />, href: '#' },
        ].map(({ icon, href }, i) => (
          <a key={i} href={href} style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', textDecoration: 'none', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.7)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.3)'}
          >
            {icon}
          </a>
        ))}
      </div>

      <div style={{ color: '#6b7280', fontSize: '0.85rem', textAlign: 'right' }}>
        © 2026 Dhrushyam. All rights reserved.<br />
        Made with ❤️ for creators
      </div>
    </footer>
  );
}