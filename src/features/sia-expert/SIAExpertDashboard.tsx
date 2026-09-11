import { useState } from 'react';
import { mockCases } from '../../mock-data/cases';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import { LogHearingForm } from './LogHearingForm';
import { SubmitVerdictForm } from './SubmitVerdictForm';
import { Users, FileText, Plus } from 'lucide-react';
import { Button } from '../../components/Button/Button';

export function SIAExpertDashboard() {
  const [activeForm, setActiveForm] = useState<'hearing' | 'verdict' | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2>SIA Expert Committee Portal (सामाजिक प्रभाव आकलन)</h2>
          <p className="text-caption">
            Statutory independent review of public purpose, affected families, and Social Impact Assessment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => setActiveForm(activeForm === 'hearing' ? null : 'hearing')}>
            <Users size={14} /> {activeForm === 'hearing' ? 'Close Hearing Form' : 'Log Public Hearing'}
          </Button>
          <Button variant="accent-kesari" size="sm" onClick={() => setActiveForm(activeForm === 'verdict' ? null : 'verdict')}>
            <Plus size={14} /> {activeForm === 'verdict' ? 'Close Verdict Form' : 'Submit Expert Report'}
          </Button>
        </div>
      </div>

      {activeForm === 'hearing' && (
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <LogHearingForm onSuccess={() => setActiveForm(null)} />
        </div>
      )}

      {activeForm === 'verdict' && (
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <SubmitVerdictForm onSuccess={() => setActiveForm(null)} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-4)' }}>
        <FileText size={18} color="var(--color-primary-navy)" />
        <h3 style={{ margin: 0 }}>Cases Under SIA Review</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--spacing-6)' }}>
        {mockCases.map((c) => (
          <CaseCard key={c.id} caseItem={c} />
        ))}
      </div>
    </div>
  );
}
