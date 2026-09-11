import type { Case } from '../../types/case';
import { ParcelMapStub } from '../../features/requiring-body/ProposalForm/ParcelMapStub';
import { Map } from 'lucide-react';

interface MapTabProps {
  caseItem: Case;
}

export function MapTab({ caseItem }: MapTabProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-slate)', paddingBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Map size={20} color="var(--color-primary-navy)" />
          <h4 style={{ margin: 0 }}>BhuNaksha Cadastral GIS Alignment Map</h4>
        </div>
        <span className="text-caption">WGS-84 / UTM Zone 44N</span>
      </div>

      <ParcelMapStub khasras={caseItem.khasraNumbers} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)' }}>
        <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-surface-offwhite)', borderRadius: 'var(--radius-sm)' }}>
          <span className="text-caption">CADASTRAL REVENUE SHEET</span>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Sheet No. 14-B (Mauza {caseItem.mauza})</div>
        </div>
        <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-surface-offwhite)', borderRadius: 'var(--radius-sm)' }}>
          <span className="text-caption">GEO-COORDINATES</span>
          <div className="text-mono-id" style={{ fontSize: '0.8rem' }}>30.2241° N, 78.7818° E</div>
        </div>
        <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-surface-offwhite)', borderRadius: 'var(--radius-sm)' }}>
          <span className="text-caption">ENCROACHMENT STATUS</span>
          <div style={{ fontWeight: 600, color: 'var(--color-accent-green)', fontSize: '0.85rem' }}>Nil / Clear Title</div>
        </div>
      </div>
    </div>
  );
}
