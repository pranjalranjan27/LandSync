import { useState } from 'react';
import { mockCases } from '../../mock-data/cases';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import { ApproveForwardToSIA } from './actions/ApproveForwardToSIA';
import { ReturnToCollector } from './actions/ReturnToCollector';
import { Landmark, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '../../components/Button/Button';

export function StateApproverDashboard() {
  const [activeModal, setActiveModal] = useState<'approve' | 'return' | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const handleConfirm = (action: string, reason: string) => {
    setActiveModal(null);
    setBanner(`State Action "${action}" recorded. Justification: "${reason}"`);
    setTimeout(() => setBanner(null), 5000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2>State Approver Directorate (राज्य अनुमोदनकर्ता)</h2>
          <p className="text-caption">
            Principal Secretary (Revenue) • Statutory sanction for SIA commissions and major projects.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => setActiveModal('return')}>
            <RotateCcw size={14} /> Return to Collector
          </Button>
          <Button variant="primary" size="sm" onClick={() => setActiveModal('approve')}>
            <CheckCircle2 size={14} /> Commission SIA Expert Body
          </Button>
        </div>
      </div>

      {banner && (
        <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-accent-green-surface)', border: '1px solid var(--color-accent-green)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-4)', fontSize: '0.85rem' }}>
          {banner}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-4)' }}>
        <Landmark size={20} color="var(--color-primary-navy)" />
        <h3 style={{ margin: 0 }}>State High-Value Land Proposals</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--spacing-6)' }}>
        {mockCases.map((c) => (
          <CaseCard key={c.id} caseItem={c} />
        ))}
      </div>

      <ApproveForwardToSIA
        isOpen={activeModal === 'approve'}
        onClose={() => setActiveModal(null)}
        onConfirm={(reason) => handleConfirm('Commission SIA', reason)}
      />

      <ReturnToCollector
        isOpen={activeModal === 'return'}
        onClose={() => setActiveModal(null)}
        onConfirm={(reason) => handleConfirm('Return to Collector', reason)}
      />
    </div>
  );
}
