import React, { useState } from 'react';
import {
  CASE_STAGES_ORDER,
  FAMILY_STAGES_ORDER,
  BRANCH_STAGES,
  getStageConfig
} from '../../constants/stages';
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import './WorkflowStepper.css';

export interface WorkflowHistoryItem {
  stage: string;
  enteredAt: string;
  actorName?: string;
  actorRole?: string;
  remarks?: string;
  documentUrl?: string;
}

export interface WorkflowStepperProps {
  variant?: 'case' | 'family';
  currentStage: string;
  history?: WorkflowHistoryItem[];
  currentStepNumber?: number; // Legacy compatibility
  className?: string;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  variant = 'case',
  currentStage,
  history = [],
  className = ''
}) => {
  const normCurrentStage = currentStage?.toLowerCase().trim() || 'proposal_submitted';
  const isBranchStage = (BRANCH_STAGES as readonly string[]).includes(normCurrentStage);

  // Choose the stage list according to the variant
  const mainStages: readonly string[] = variant === 'family' ? FAMILY_STAGES_ORDER : CASE_STAGES_ORDER;

  // Build history map by stage
  const historyMap = new Map<string, WorkflowHistoryItem>();
  history.forEach((h) => {
    historyMap.set(h.stage.toLowerCase().trim(), h);
  });

  // Calculate the current active index on the main path
  let activeIndex = mainStages.indexOf(normCurrentStage);

  // If it's a branch stage (rejected or returned_for_clarification), find where it branched off
  let branchInfo: WorkflowHistoryItem | undefined;
  if (isBranchStage) {
    branchInfo = historyMap.get(normCurrentStage);
    // Find highest mainStage present in history
    let lastValidIndex = 0;
    mainStages.forEach((st, idx) => {
      if (historyMap.has(st)) {
        lastValidIndex = idx;
      }
    });
    activeIndex = lastValidIndex;
  } else if (activeIndex === -1) {
    activeIndex = 0;
  }

  // Set of expanded stage keys: only the current stage is expanded by default
  const [expandedStages, setExpandedStages] = useState<Set<string>>(() => {
    const set = new Set<string>();
    if (!isBranchStage) {
      set.add(normCurrentStage);
    }
    return set;
  });

  const toggleExpand = (stageKey: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageKey)) {
        next.delete(stageKey);
      } else {
        next.add(stageKey);
      }
      return next;
    });
  };

  // Determine stages to display: if branched, only display up to the branch point
  const displayStages = isBranchStage
    ? mainStages.slice(0, activeIndex + 1)
    : mainStages;

  return (
    <div className={`workflow-stepper-container ${className}`}>
      <ol className="workflow-stepper-list">
        {displayStages.map((stageKey, idx) => {
          const isCurrent = !isBranchStage && idx === activeIndex;
          const isDone = isBranchStage ? true : idx < activeIndex;
          const isPending = !isBranchStage && idx > activeIndex;

          const stageCfg = getStageConfig(stageKey);
          const historyEntry = historyMap.get(stageKey);
          const isExpanded = isCurrent || expandedStages.has(stageKey);
          const isLast = idx === displayStages.length - 1 && !isBranchStage;

          return (
            <li key={stageKey} className="workflow-step-item">
              {/* Vertical Track / Dot */}
              <div className="workflow-step-track">
                {!isLast && (
                  <div
                    className={`workflow-step-line ${
                      isDone || (isBranchStage && idx < displayStages.length - 1)
                        ? 'line-done'
                        : ''
                    }`}
                  />
                )}
                <div
                  className={`workflow-step-dot ${
                    isDone
                      ? 'dot-done'
                      : isCurrent
                      ? 'dot-current'
                      : 'dot-pending'
                  }`}
                  aria-hidden="true"
                >
                  {isDone && <Check size={13} strokeWidth={3} />}
                </div>
              </div>

              {/* Step Content */}
              <div className="workflow-step-content">
                <button
                  type="button"
                  className="workflow-step-header"
                  onClick={() => (isDone ? toggleExpand(stageKey) : null)}
                  disabled={!isDone}
                  aria-expanded={isExpanded}
                >
                  <div className="workflow-step-title-wrap">
                    <span
                      className={`workflow-step-title ${
                        isCurrent ? 'current' : isPending ? 'pending' : ''
                      }`}
                    >
                      {stageCfg.label}
                    </span>

                    {/* Date if completed */}
                    {isDone && historyEntry?.enteredAt && (
                      <span className="workflow-step-date">
                        • {historyEntry.enteredAt}
                      </span>
                    )}
                  </div>

                  {/* Accordion toggle indicator for completed stages */}
                  {isDone && (
                    <span className="workflow-step-toggle-icon" aria-hidden="true">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  )}
                </button>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div
                    className={`workflow-step-details ${
                      isCurrent ? 'current-details' : ''
                    }`}
                  >
                    {(historyEntry?.actorName || historyEntry?.actorRole) && (
                      <div className="workflow-step-meta">
                        <span className="workflow-actor-badge">
                          <User size={13} />
                          <span>
                            {historyEntry.actorName || 'Authorized Officer'}
                            {historyEntry.actorRole && ` (${historyEntry.actorRole})`}
                          </span>
                        </span>
                      </div>
                    )}

                    {historyEntry?.remarks ? (
                      <div className="workflow-step-remarks">
                        {historyEntry.remarks}
                      </div>
                    ) : (
                      <div className="workflow-step-remarks" style={{ color: 'var(--color-text-secondary)' }}>
                        {isCurrent
                          ? stageCfg.description || 'Statutory proceedings underway.'
                          : 'Milestone verified and signed into official record.'}
                      </div>
                    )}

                    {historyEntry?.documentUrl && (
                      <a
                        href={historyEntry.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="workflow-step-doc-link"
                      >
                        <FileText size={13} />
                        <span>View Verified Gazette / Document</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}

        {/* Branch Outcome: Rejected or Returned for Clarification */}
        {isBranchStage && (
          <li className="workflow-step-item">
            <div className="workflow-step-track">
              <div
                className={`workflow-step-dot ${
                  normCurrentStage === 'rejected' ? 'dot-rejected' : 'dot-warning'
                }`}
                style={{
                  backgroundColor: normCurrentStage === 'rejected' ? '#DC2626' : '#D97706',
                  borderColor: normCurrentStage === 'rejected' ? '#991B1B' : '#B45309',
                  color: '#FFFFFF'
                }}
              >
                {normCurrentStage === 'rejected' ? (
                  <XCircle size={14} />
                ) : (
                  <AlertTriangle size={13} />
                )}
              </div>
            </div>

            <div className="workflow-step-content">
              <div
                className={`workflow-branch-card ${
                  normCurrentStage === 'rejected'
                    ? 'rejected'
                    : 'returned_for_clarification'
                }`}
              >
                <div className="workflow-branch-icon">
                  {normCurrentStage === 'rejected' ? (
                    <XCircle size={20} color="#DC2626" />
                  ) : (
                    <AlertTriangle size={20} color="#D97706" />
                  )}
                </div>

                <div className="workflow-branch-body">
                  <div className="workflow-branch-title">
                    {normCurrentStage === 'rejected'
                      ? 'Proposal Rejected'
                      : 'Returned for Clarification'}
                  </div>

                  {(branchInfo?.actorName || branchInfo?.actorRole) && (
                    <div className="workflow-step-meta" style={{ marginTop: 2 }}>
                      <span className="workflow-actor-badge">
                        <User size={13} />
                        <span>
                          {branchInfo.actorName}
                          {branchInfo.actorRole && ` (${branchInfo.actorRole})`}
                        </span>
                      </span>
                      {branchInfo.enteredAt && (
                        <span className="workflow-step-date">
                          • {branchInfo.enteredAt}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="workflow-branch-remarks">
                    {branchInfo?.remarks ||
                      (normCurrentStage === 'rejected'
                        ? 'This acquisition proposal has been formally rejected following administrative review.'
                        : 'Action required: Case returned to Requiring Agency to provide supplemental survey data.')}
                  </div>

                  {branchInfo?.documentUrl && (
                    <a
                      href={branchInfo.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="workflow-step-doc-link"
                      style={{
                        color:
                          normCurrentStage === 'rejected' ? '#991B1B' : '#92400E'
                      }}
                    >
                      <FileText size={13} />
                      <span>View Rejection / Clarification Order</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </li>
        )}
      </ol>
    </div>
  );
};

export default WorkflowStepper;
