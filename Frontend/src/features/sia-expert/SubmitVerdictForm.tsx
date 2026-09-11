import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FileCheck } from 'lucide-react';

interface SubmitVerdictFormProps {
  onSuccess: () => void;
}

export function SubmitVerdictForm({ onSuccess }: SubmitVerdictFormProps) {
  const [verdict, setVerdict] = useState<'RECOMMENDED' | 'RECOMMENDED_WITH_CONDITIONS' | 'REJECTED'>('RECOMMENDED_WITH_CONDITIONS');
  const [summary, setSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Expert Committee Evaluation report submitted: ${verdict}`);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
      <h4 style={{ color: 'var(--color-primary-navy)' }}>Submit Expert Group Recommendation (Section 7)</h4>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
          Statutory Recommendation Finding
        </label>
        <select
          value={verdict}
          onChange={(e) => setVerdict(e.target.value as any)}
          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
        >
          <option value="RECOMMENDED">Public Purpose Validated — Acquisition Recommended</option>
          <option value="RECOMMENDED_WITH_CONDITIONS">Recommended With Additional Rehabilitation Mitigation</option>
          <option value="REJECTED">Acquisition Not Justified (Adverse Social Cost Exceeds Public Benefit)</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
          Mitigation Conditions &amp; Justification
        </label>
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Specify conditions regarding alternative agricultural livelihoods, grazing lands, and mandatory employment..."
          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="accent-kesari" size="sm">
          <FileCheck size={14} /> Submit SIA Verdict to Collector
        </Button>
      </div>
    </form>
  );
}
