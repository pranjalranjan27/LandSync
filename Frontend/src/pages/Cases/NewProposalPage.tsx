import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProposalForm } from '../../features/requiring-body/ProposalForm/ProposalForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button/Button';

export const NewProposalPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> Back
        </Button>
        <div>
          <h2 style={{ color: 'var(--color-primary-navy)', margin: 0 }}>Create Land Acquisition Proposal</h2>
          <p className="text-caption" style={{ margin: 0 }}>
            Requisition under Section 4 of RFCTLARR Act, 2013 with cadastral parcel schedule.
          </p>
        </div>
      </div>

      <ProposalForm onSuccess={() => navigate('/dashboard')} />
    </div>
  );
};
