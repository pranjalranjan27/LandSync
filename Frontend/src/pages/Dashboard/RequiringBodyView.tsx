import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Case } from '../../types/case';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import { caseService } from '../../services/caseService';
import {
  PlusCircle,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  FilePlus2
} from 'lucide-react';
import { useTranslation } from '../../locales';
import './RequiringBodyView.css';

export const RequiringBodyView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(() => {
    const st = location.state as { submitted?: boolean; title?: string; hasDisputeWarning?: boolean } | null;
    if (st?.submitted) {
      return `Proposal "${st.title || 'New Proposal'}" submitted successfully under Section 4. Forwarded to District Collectorate.`;
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    caseService.getCases({ mine: true }).then((data) => {
      if (isMounted) {
        setCases(data);
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Failed to fetch requiring body cases', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter cases into "Needs Your Attention" vs "My Proposals"
  const attentionCases = cases.filter(
    (c) => c.stage === 'returned_for_clarification'
  );

  const regularProposals = cases.filter(
    (c) => c.stage !== 'returned_for_clarification'
  );

  // Handle Resubmit action: flips case back to proposal_submitted
  const handleResubmit = async (caseId: string, caseNumber: string) => {
    try {
      setResubmittingId(caseId);
      const updatedCase = await caseService.resubmitCase(caseId);

      // Dynamically update cases state: the case now leaves attention and moves to regular proposals
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? updatedCase : c))
      );

      setFeedbackMsg(
        `Case "${caseNumber}" has been resubmitted back to District Collectorate as "proposal_submitted" for review.`
      );
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err) {
      console.error('Failed to resubmit case', err);
    } finally {
      setResubmittingId(null);
    }
  };

  return (
    <div className="requiring-body-view">
      {/* ==========================================================================
          1. TOP ACTION BAR (Prominent "+ New Proposal" button)
          ========================================================================== */}
      <div className="requiring-body-top-bar">
        <div className="requiring-body-title-group">
          <h2>{t('dashboard.requiringBodyViewTitle', 'Requiring Body Dashboard')}</h2>
          <p>
            Railways, NHAI, Metro &amp; Public Infrastructure Authorities • Form-1 Land Requisitions
          </p>
        </div>

        <button
          type="button"
          className="btn-new-proposal"
          onClick={() => navigate('/cases/new')}
          aria-label="Create New Land Acquisition Proposal"
        >
          <PlusCircle size={18} />
          <span>{t('dashboard.createNewProposal', '+ New Proposal')}</span>
        </button>
      </div>

      {/* Success / Resubmit Toast Banner */}
      {feedbackMsg && (
        <div className="resubmit-toast" role="status" aria-live="polite">
          <CheckCircle2 size={18} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ==========================================================================
          2. SECTION: NEEDS YOUR ATTENTION (Cases in returned_for_clarification)
          ========================================================================== */}
      <section className="section-attention" aria-labelledby="heading-attention">
        <div className="attention-header">
          <div className="attention-title-wrapper">
            <h3 id="heading-attention">
              <AlertTriangle size={20} color="#D97706" />
              {t('dashboard.priorityAlerts', 'Needs Your Attention')}
            </h3>
            {attentionCases.length > 0 && (
              <span className="attention-badge-count">
                {attentionCases.length} {t('common.actions', 'Action Required')}
              </span>
            )}
          </div>
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Proposals returned by Collectorate requiring boundary rectifications or clarifications
          </span>
        </div>

        {loading ? (
          <div className="empty-state-card" style={{ padding: 'var(--spacing-6)' }}>
            <span className="text-caption">Loading cases under review...</span>
          </div>
        ) : attentionCases.length > 0 ? (
          <div className="attention-grid">
            {attentionCases.map((caseItem) => {
              // Extract the latest clarification ground from audit trail if available
              const clarificationItem = caseItem.auditTrail
                .slice()
                .reverse()
                .find(
                  (a) =>
                    a.stage === 'returned_for_clarification' ||
                    a.action === 'REQUEST_CLARIFICATION'
                );

              const isResubmitting = resubmittingId === caseItem.id;

              return (
                <div key={caseItem.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <CaseCard
                    caseItem={caseItem}
                    isWarning={true}
                    hideActionButton={true}
                    extraAction={
                      <button
                        type="button"
                        className="btn-resubmit"
                        disabled={isResubmitting}
                        onClick={() => handleResubmit(caseItem.id, caseItem.caseNumber)}
                        aria-label={`Resubmit case ${caseItem.caseNumber}`}
                      >
                        {isResubmitting ? (
                          <>
                            <RefreshCw size={14} className="login-spinner" />
                            <span>Resubmitting...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} />
                            <span>Resubmit Proposal</span>
                          </>
                        )}
                      </button>
                    }
                  />

                  {clarificationItem?.details && (
                    <div className="attention-collector-note">
                      <strong>Collector Remarks:</strong> {clarificationItem.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state for "Needs Your Attention" */
          <div className="empty-state-card">
            <div className="empty-state-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Sparkles size={24} />
            </div>
            <div className="empty-state-title">All proposals in good standing</div>
            <div className="empty-state-description">
              You have no proposals returned for clarification. All active files are currently progressing through collector scrutiny and statutory SIA stages.
            </div>
          </div>
        )}
      </section>

      {/* ==========================================================================
          3. SECTION: MY PROPOSALS (All other submitted cases)
          ========================================================================== */}
      <section className="section-proposals" aria-labelledby="heading-my-proposals">
        <div className="proposals-header">
          <div className="proposals-title-wrapper">
            <h3 id="heading-my-proposals">
              <FolderKanban size={20} color="var(--color-primary-navy)" />
              {t('dashboard.activeCases', 'My Proposals')}
            </h3>
            <span className="badge-saffron" style={{ fontSize: '0.72rem' }}>
              {regularProposals.length} {t('common.status', 'Active')}
            </span>
          </div>
          <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Track statutory progress across Sections 4, 11, 15 &amp; 19
          </span>
        </div>

        {loading ? (
          <div className="empty-state-card" style={{ padding: 'var(--spacing-6)' }}>
            <span className="text-caption">Loading your proposals...</span>
          </div>
        ) : regularProposals.length > 0 ? (
          <div className="proposals-grid">
            {regularProposals.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                hideActionButton={true}
              />
            ))}
          </div>
        ) : (
          /* Empty state for "My Proposals" (no proposals yet at all) */
          <div className="empty-state-card">
            <div className="empty-state-icon" style={{ backgroundColor: 'var(--color-primary-navy-surface)', color: 'var(--color-primary-navy)' }}>
              <FilePlus2 size={24} />
            </div>
            <div className="empty-state-title">No proposals submitted yet</div>
            <div className="empty-state-description">
              You haven't initiated any land acquisition proposals. Create and submit your first Form-1 requisition under Section 4 with cadastral parcel schedules.
            </div>
            <button
              type="button"
              className="btn-new-proposal"
              onClick={() => navigate('/cases/new')}
              style={{ marginTop: '8px' }}
            >
              <PlusCircle size={16} />
              <span>+ New Proposal</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default RequiringBodyView;
