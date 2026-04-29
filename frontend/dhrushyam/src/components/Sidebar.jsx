import { Link, useLocation } from 'react-router-dom';

const navItems = [
  {
    to: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    to: '/music',
    label: 'Music',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="6" cy="18" r="3" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="18" cy="16" r="3" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside style={{
      position: 'fixed',
      top: 'var(--navbar-height)',
      left: 0,
      bottom: 0,
      width: 'var(--sidebar-width)',
      background: '#ffffff',
      paddingTop: 12,
      overflowY: 'auto',
      zIndex: 100,
    }}>
      {navItems.map(({ to, label, icon }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '16px 0', gap: 6, width: '100%',
            color: active ? '#0f0f0f' : '#606060',
            background: active ? '#f2f2f2' : 'transparent',
            borderRadius: 10,
            fontWeight: active ? 600 : 400,
            fontSize: 10,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f9f9f9'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            {icon(active)}
            {label}
          </Link>
        );
      })}

      <div style={{ height: 1, background: '#e5e5e5', margin: '8px 16px' }} />

      {/* Categories */}
      {['Trending', 'Gaming', 'Music', 'News', 'Sports', 'Learning'].map(cat => (
        <Link key={cat} to={`/?category=${cat}`} style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 24px', gap: 20,
          color: '#0f0f0f', fontSize: 14,
          borderRadius: 10, margin: '0 4px',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#f2f2f2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#606060">
            <circle cx="12" cy="12" r="3"/>
          </svg>
          {cat}
        </Link>
      ))}
    </aside>
  );
}