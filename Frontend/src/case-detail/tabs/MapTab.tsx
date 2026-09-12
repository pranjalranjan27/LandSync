import type { Case } from '../../types/case';
import { CadastralMap } from '../../components/CadastralMap';

interface MapTabProps {
  caseItem: Case;
}

export function MapTab({ caseItem }: MapTabProps) {
  return (
    <div
      className="card"
      style={{
        padding: 'var(--spacing-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
      }}
    >
      <CadastralMap
        caseId={caseItem.id}
        district={caseItem.district || 'Gautam Buddha Nagar'}
        mauza={caseItem.mauza}
        khasraNumbers={caseItem.khasraNumbers}
      />
    </div>
  );
}
