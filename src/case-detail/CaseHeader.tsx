import type { Case } from '../types/case';
import { StatusBadge } from '../components/StatusBadge/StatusBadge';
import { WorkflowStepper } from '../components/WorkflowStepper/WorkflowStepper';
import { MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CaseHeaderProps {
  caseItem: Case;
}

export function CaseHeader({ caseItem }: CaseHeaderProps) {
  return (
    <div style={{ marginBottom: 'var(--spacing-6)' }}>
      <div style={{ marginBottom: 'var(--spacing-3)' }}>
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--color-primary-navy)', fontSize: '0.85rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Case Registry
        </Link>
      </div>

      <div className="card" style={{ padding: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 4 }}>
              <span className="text-mono-id" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-navy)' }}>
                {caseItem.caseNumber}
              </span>
              <StatusBadge stage={caseItem.stage} />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-text-heading)' }}>
              {caseItem.projectTitle}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
              <MapPin size={15} />
              <span>Mauza {caseItem.mauza}, Tehsil {caseItem.tehsil}, {caseItem.district} ({caseItem.state}) • Initiated: {caseItem.dateInitiated}</span>
            </div>
          </div>
        </div>

        {/* 8-Stage Horizontal Workflow Stepper */}
        <div style={{ marginTop: 'var(--spacing-6)', borderTop: '1px solid var(--color-border-slate)', paddingTop: 'var(--spacing-4)' }}>
          <WorkflowStepper currentStage={caseItem.stage} currentStepNumber={caseItem.stageNumber} />
        </div>
      </div>
    </div>
  );
}
