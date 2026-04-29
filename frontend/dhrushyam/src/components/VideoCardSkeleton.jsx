export default function VideoCardSkeleton() {
  return (
    <div>
      {/* Thumbnail skeleton */}
      <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12 }} />
      
      {/* Info row */}
      <div style={{ display: 'flex', gap: 12, padding: '10px 4px 8px' }}>
        {/* Avatar */}
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '65%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 13, width: '50%' }} />
        </div>
      </div>
    </div>
  );
}