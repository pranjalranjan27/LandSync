import type { Case } from '../../types/case';
import { FileText, Download } from 'lucide-react';
import { Button } from '../../components/Button/Button';

interface ProposalTabProps {
  caseItem: Case;
}

export function ProposalTab({ caseItem }: ProposalTabProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-slate)', paddingBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="var(--color-primary-navy)" />
          <h4 style={{ margin: 0 }}>Section 4 Proposal Submission File</h4>
        </div>
        <Button variant="secondary" size="sm" onClick={() => alert('Downloading official signed Form-1 PDF...')}>
          <Download size={14} /> Download Form-1 PDF
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
        <div>
          <span className="text-caption">PROJECT PURPOSE &amp; JUSTIFICATION</span>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-body)', marginTop: 4 }}>
            {caseItem.projectPurpose}
          </p>
        </div>

        <div>
          <span className="text-caption">FEASIBILITY &amp; ALIGNMENT REPORT</span>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-body)', marginTop: 4 }}>
            Detailed Project Report (DPR) verified with minimal agricultural displacement. Multi-crop irrigated lands minimized per Section 10.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface-offwhite)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-slate)' }}>
        <span className="text-caption">STATUTORY CERTIFICATE</span>
        <div style={{ fontSize: '0.82rem', marginTop: 4 }}>
          Certified that no suitable government barren/waste land was available for this public utility project within the alignment corridor.
        </div>
      </div>
    </div>
  );
}
