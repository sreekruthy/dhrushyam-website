export default function VideoCardSkeleton() {
  const pulse = {
    background: 'linear-gradient(90deg, #1a1a2e 25%, #2d2d4e 50%, #1a1a2e 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
  };

  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ ...pulse, aspectRatio: '16/9', width: '100%' }} />
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ ...pulse, height: 18, width: '90%' }} />
          <div style={{ ...pulse, height: 14, width: '50%' }} />
          <div style={{ ...pulse, height: 12, width: '70%' }} />
        </div>
      </div>
    </>
  );
}