import { useState } from 'react';
import { ProposalForm } from './ProposalForm/ProposalForm';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import { mockCases } from '../../mock-data/cases';
import { PlusCircle, FileText } from 'lucide-react';
import { Button } from '../../components/Button/Button';

export function RequiringBodyDashboard() {
  const [showNewProposal, setShowNewProposal] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2>Requiring Body Dashboard (अपेक्षी निकाय)</h2>
          <p className="text-caption">
            Railways, NHAI, Metro &amp; Infrastructure agencies managing Form-1 land acquisition requisitions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowNewProposal(!showNewProposal)}
        >
          <PlusCircle size={16} />
          {showNewProposal ? 'View Active Proposals' : 'Submit New Proposal (Form-1)'}
        </Button>
      </div>

      {showNewProposal ? (
        <ProposalForm onSuccess={() => setShowNewProposal(false)} />
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-4)' }}>
            <FileText size={18} color="var(--color-primary-navy)" />
            <h3 style={{ margin: 0 }}>Active Acquisition Proposals</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--spacing-6)' }}>
            {mockCases.map((c) => (
              <CaseCard key={c.id} caseItem={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
