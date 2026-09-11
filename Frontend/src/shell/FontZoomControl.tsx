import { useState } from 'react';

export function FontZoomControl() {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const applyZoom = (level: number) => {
    setZoomLevel(level);
    document.documentElement.style.fontSize = `${(16 * level) / 100}px`;
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 4px', borderRadius: 'var(--radius-sm)' }}>
      <button
        onClick={() => applyZoom(90)}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          cursor: 'pointer',
          padding: '2px 4px',
          fontWeight: zoomLevel === 90 ? 700 : 400
        }}
        title="Decrease text size (A-)"
      >
        A-
      </button>
      <button
        onClick={() => applyZoom(100)}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          cursor: 'pointer',
          padding: '2px 4px',
          fontWeight: zoomLevel === 100 ? 700 : 400
        }}
        title="Normal text size (A)"
      >
        A
      </button>
      <button
        onClick={() => applyZoom(115)}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          cursor: 'pointer',
          padding: '2px 4px',
          fontWeight: zoomLevel === 115 ? 700 : 400
        }}
        title="Increase text size (A+)"
      >
        A+
      </button>
    </div>
  );
}
