import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { caseService } from '../../services/caseService';
import type { Case } from '../../types/case';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import {
  Landmark,
  ShieldCheck,
  Check,
  ChevronRight,
  Loader2
} from 'lucide-react';
import './StateApproverView.css';

export const StateApproverView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'needs_action' | 'all_state_cases'>('needs_action');
  const [stateCases, setStateCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  // Approver's state_id from session (spans multiple districts)
  const stateId = user?.state || 'Uttar Pradesh';

  useEffect(() => {
    let isMounted = true;
    caseService
      .getCases({
        state_id: stateId,
        state: stateId
      })
      .then((data) => {
        if (isMounted) {
          setStateCases(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch state cases', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [stateId]);

  // Tab 1: Needs My Action - cases in state_review stage within this approver's state
  const actionCases = useMemo(() => {
    return stateCases.filter((c) => c.stage === 'state_review');
  }, [stateCases]);

  // Tab 2: All State Cases - every case across every district in this approver's state
  const filteredAllCases = useMemo(() => {
    if (selectedStage === 'ALL') return stateCases;
    return stateCases.filter((c) => c.stage === selectedStage);
  }, [stateCases, selectedStage]);

  const calculateDaysInStage = (c: Case) => {
    const refDate = c.lastUpdated || c.dateInitiated;
    return Math.max(
      1,
      Math.ceil(Math.abs(new Date().getTime() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24))
    );
  };

  return (
    <div className="state-approver-container">
      {/* Header with State Jurisdiction Card */}
      <div className="state-header-row">
        <div className="state-title-area">
          <h1>State Approver Dashboard</h1>
          <p className="state-subtitle">
            Principal Secretary (Revenue) • State statutory review, SIA sanction &amp; inter-district oversight.
          </p>
        </div>

        <div className="state-jurisdiction-card">
          <div className="state-card-icon-wrap">
            <Landmark size={22} />
          </div>
          <div>
            <div className="state-card-label">State Jurisdiction</div>
            <div className="state-card-name">{stateId}</div>
            <div className="state-card-scope">All Districts • Inter-Departmental</div>
          </div>
        </div>
      </div>

      {/* Two Tabs */}
      <div className="state-tabs-row">
        <div className="state-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'needs_action'}
            className={`state-tab-btn ${activeTab === 'needs_action' ? 'active' : ''}`}
            onClick={() => setActiveTab('needs_action')}
          >
            <span>Needs My Action</span>
            <span className="state-tab-count">{actionCases.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all_state_cases'}
            className={`state-tab-btn ${activeTab === 'all_state_cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('all_state_cases')}
          >
            <span>All State Cases</span>
            <span className="state-tab-count">{stateCases.length}</span>
          </button>
        </div>

        {activeTab === 'all_state_cases' && (
          <div className="state-filter-area">
            <label htmlFor="state-stage-filter" style={{ fontSize: '0.85rem', color: '#64748B' }}>
              Filter by Stage:
            </label>
            <select
              id="state-stage-filter"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '0.85rem'
              }}
            >
              <option value="ALL">All Stages</option>
              <option value="proposal_submitted">Proposal Submitted</option>
              <option value="state_review">State Review</option>
              <option value="sia_complete">SIA Complete</option>
              <option value="objections_window">Objections Window</option>
              <option value="award_issued">Award Issued</option>
              <option value="rr_in_progress">R&amp;R In Progress</option>
              <option value="compensation_disbursed">Compensation Disbursed</option>
              <option value="possession_taken">Possession Taken</option>
            </select>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '10px' }}>
          <Loader2 className="spinning" size={24} color="var(--color-accent-kesari)" />
          <span style={{ color: '#64748B' }}>Loading state cases...</span>
        </div>
      )}

      {/* TAB 1: Needs My Action */}
      {!isLoading && activeTab === 'needs_action' && (
        <div>
          {actionCases.length > 0 ? (
            <div className="state-queue">
              {actionCases.map((c) => (
                <CaseCard
                  key={c.id}
                  caseItem={c}
                  layout="row"
                  actionTag={{
                    title: 'Sanction Pending',
                    subtitle: 'Approve & forward to SIA / Return to Collector / Reject',
                    icon: <ShieldCheck size={18} color="#2563EB" />,
                    variant: 'blue'
                  }}
                  daysInStage={calculateDaysInStage(c)}
                />
              ))}
            </div>
          ) : (
            <div className="state-empty-card">
              <div className="state-empty-icon">
                <Check size={38} color="#16A34A" strokeWidth={2.8} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '1.25rem' }}>
                You're all caught up
              </h3>
              <p style={{ margin: '0 0 6px 0', color: '#64748B', fontSize: '0.95rem' }}>
                There are no cases in state review awaiting your sanction right now.
              </p>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
                New proposals forwarded by District Collectors will appear here for secretariat scrutiny.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: All State Cases (Read-only Overview) */}
      {!isLoading && activeTab === 'all_state_cases' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748B' }}>Case ID</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748B' }}>Project Name</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748B' }}>District</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748B' }}>Current Stage</th>
                <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748B' }}>Days in Stage</th>
                <th style={{ padding: '12px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredAllCases.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                  onClick={() => navigate(`/cases/${c.id}`)}
                >
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0B192C' }}>
                    {c.caseNumber}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                    {c.projectTitle}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {c.district}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge stage={c.stage} />
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                    {calculateDaysInStage(c)} days
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94A3B8' }}>
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAllCases.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
              No cases found matching the selected filter in this state.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StateApproverView;
