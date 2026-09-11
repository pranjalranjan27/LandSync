import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { caseService } from '../../services/caseService';
import type { Case } from '../../types/case';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import {
  Users,
  Calendar,
  FileCheck2,
  Inbox,
  Loader2
} from 'lucide-react';
import './SiaExpertView.css';

export const SiaExpertView: React.FC = () => {
  const { user } = useAuth();
  const [assignedCases, setAssignedCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    // Query cases in sia_in_progress assigned specifically to this expert (GET /cases?stage=sia_in_progress&assigned_to=me)
    caseService
      .getCases({
        stage: 'sia_in_progress',
        assigned_to: 'me'
      })
      .then((data) => {
        if (isMounted) {
          setAssignedCases(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch SIA assigned cases', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const calculateDaysSinceAssignment = (c: Case) => {
    const refDate = c.lastUpdated || c.dateInitiated;
    return Math.max(
      1,
      Math.ceil(Math.abs(new Date().getTime() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24))
    );
  };

  return (
    <div className="sia-expert-container">
      {/* Header with SIA Expert Profile Badge */}
      <div className="sia-header-row">
        <div className="sia-title-area">
          <h1>SIA Expert Dashboard</h1>
          <p className="sia-subtitle">
            Social Impact Assessment Committee • Public hearings, demographic impact review &amp; recommendations.
          </p>
        </div>

        <div className="sia-expert-badge-card">
          <div className="sia-expert-icon-wrap">
            <Users size={22} />
          </div>
          <div>
            <div className="sia-expert-label">Committee Expert</div>
            <div className="sia-expert-name">{user?.name || 'Dr. Meenakshi Sundaram'}</div>
            <div className="sia-expert-desig">State Directorate of SIA • Statutory Reviewer</div>
          </div>
        </div>
      </div>

      {/* Section: Assigned Cases */}
      <div>
        <div className="sia-section-header">
          <h2 className="sia-section-title">Assigned Cases</h2>
          <span className="sia-section-count">{assignedCases.length}</span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '10px' }}>
            <Loader2 className="spinning" size={24} color="var(--color-accent-kesari)" />
            <span style={{ color: '#64748B' }}>Loading assigned SIA cases...</span>
          </div>
        )}

        {/* Cases List */}
        {!isLoading && assignedCases.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {assignedCases.map((c) => {
              const days = calculateDaysSinceAssignment(c);
              const isHearingLogged = !!c.hearingLogged;

              return (
                <CaseCard
                  key={c.id}
                  caseItem={c}
                  layout="row"
                  daysInStage={days}
                  actionTag={{
                    title: isHearingLogged ? 'Hearing logged — verdict pending' : 'Hearing not yet logged',
                    subtitle: isHearingLogged
                      ? 'Public hearings concluded. Proceed to submit SIA recommendation report.'
                      : 'Section 7 public hearing not yet conducted. Schedule hearing before verdict.',
                    icon: isHearingLogged ? (
                      <FileCheck2 size={18} color="#2563EB" />
                    ) : (
                      <Calendar size={18} color="#B45309" />
                    ),
                    variant: isHearingLogged ? 'blue' : 'peach'
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && assignedCases.length === 0 && (
          <div className="sia-empty-card">
            <div className="sia-empty-icon">
              <Inbox size={38} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '1.25rem' }}>
              No cases currently assigned to you for SIA review
            </h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', maxWidth: '420px' }}>
              When the State Approver sanctions new land acquisition projects for Social Impact Assessment, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiaExpertView;
