import { MapPin } from 'lucide-react';

interface ParcelMapStubProps {
  khasras: string[];
}

export function ParcelMapStub({ khasras }: ParcelMapStubProps) {
  return (
    <div style={{
      height: '180px',
      backgroundColor: '#e5e7eb',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--color-border-slate)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      color: 'var(--color-text-secondary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        opacity: 0.5
      }} />

      <MapPin size={24} color="var(--color-primary-navy)" style={{ zIndex: 1 }} />
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-heading)', zIndex: 1 }}>
        Cadastral GIS Map Layer (BhuNaksha Integration)
      </span>
      <div style={{ display: 'flex', gap: '4px', zIndex: 1 }}>
        {khasras.map((k) => (
          <span key={k} className="khasra-badge" style={{ background: '#FFFFFF' }}>
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
