import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { HeartHandshake } from 'lucide-react';

interface BeginRRFormProps {
  onSuccess: () => void;
}

export function BeginRRForm({ onSuccess }: BeginRRFormProps) {
  const [familiesCount, setFamiliesCount] = useState(86);
  const [resettlementArea, setResettlementArea] = useState('Mauza Rampur Resettlement Colony Site A');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Rehabilitation Scheme initiated for ${familiesCount} families.`);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
      <h4 style={{ color: 'var(--color-primary-navy)' }}>Formulate R&amp;R Scheme (Sections 16–18)</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
            Identified Displaced / Affected Families
          </label>
          <input
            type="number"
            value={familiesCount}
            onChange={(e) => setFamiliesCount(Number(e.target.value))}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
            Designated Resettlement Site
          </label>
          <input
            type="text"
            value={resettlementArea}
            onChange={(e) => setResettlementArea(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="primary" size="sm">
          <HeartHandshake size={14} /> Formalize R&amp;R Scheme
        </Button>
      </div>
    </form>
  );
}
