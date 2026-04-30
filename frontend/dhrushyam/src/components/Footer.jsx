import { FaYoutube, FaTwitter, FaInstagram, FaFacebook } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer style={{
      background: '#0f0f0f',
      borderTop: '1px solid #2a2a2a',
      padding: '2rem 3rem',
      marginTop: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>

      {/* Left */}
      <div>
        <div style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700 }}>
          Dhrushyam
        </div>
        <div style={{ color: '#aaaaaa', fontSize: '0.85rem', marginTop: 4 }}>
          Exploring the unknown with fun
        </div>
      </div>

      {/* Social Icons */}
      <div style={{ display: 'flex', gap: '0.8rem' }}>
        {[
          { icon: <FaYoutube size={18} />, color: '#ff0000' },
          { icon: <FaTwitter size={18} />, color: '#1da1f2' },
          { icon: <FaInstagram size={18} />, color: '#e1306c' },
          { icon: <FaFacebook size={18} />, color: '#1877f2' },
        ].map(({ icon, color }, i) => (
          <div key={i} style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#181818',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            cursor: 'pointer',
            border: '1px solid #2a2a2a'
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
            onMouseLeave={e => e.currentTarget.style.background = '#181818'}
          >
            {icon}
          </div>
        ))}
      </div>

      {/* Right */}
      <div style={{
        color: '#777',
        fontSize: '0.8rem',
        textAlign: 'right'
      }}>
        © 2026 Dhrushyam<br />
        Made with ❤️ for creators
      </div>

    </footer>
  );
}