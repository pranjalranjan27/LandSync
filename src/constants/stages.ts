export type BadgeColor = 'gray' | 'yellow' | 'green' | 'red' | 'amber';

export interface StageConfig {
  label: string;
  color: BadgeColor;
  description?: string;
  statutoryDaysLimit?: number; // Days threshold before marked overdue
}

/**
 * Case variant stages in order:
 * proposal_submitted → state_review → sia_in_progress → sia_complete →
 * notification_published → objections_window → award_declared →
 * compensation_disbursed → possession_taken → rr_in_progress → completed
 */
export const CASE_STAGES_ORDER = [
  'proposal_submitted',
  'state_review',
  'sia_in_progress',
  'sia_complete',
  'notification_published',
  'objections_window',
  'award_declared',
  'compensation_disbursed',
  'possession_taken',
  'rr_in_progress',
  'completed'
] as const;

/**
 * Family variant stages in order:
 * scheme_communicated → compensation_processed → relocated → resettlement_verified
 */
export const FAMILY_STAGES_ORDER = [
  'scheme_communicated',
  'compensation_processed',
  'relocated',
  'resettlement_verified'
] as const;

/**
 * Branch/Terminal stages (not on the linear forward path)
 */
export const BRANCH_STAGES = ['rejected', 'returned_for_clarification'] as const;

/**
 * Single source of truth for all stage configurations, labels, and status badge colors
 */
export const STAGE_CONFIGS: Record<string, StageConfig> = {
  // Case Stages
  proposal_submitted: {
    label: 'Submitted',
    color: 'gray',
    description: 'Proposal received and pending initial verification',
    statutoryDaysLimit: 15
  },
  state_review: {
    label: 'State Review',
    color: 'yellow',
    description: 'Under departmental scrutiny by State Nodal Officer',
    statutoryDaysLimit: 30
  },
  sia_in_progress: {
    label: 'SIA In Progress',
    color: 'yellow',
    description: 'Social Impact Assessment study and public hearings underway',
    statutoryDaysLimit: 180
  },
  sia_complete: {
    label: 'SIA Complete',
    color: 'yellow',
    description: 'Expert committee evaluation report finalized',
    statutoryDaysLimit: 30
  },
  notification_published: {
    label: 'Notification Published',
    color: 'yellow',
    description: 'Section 11 Preliminary Notification gazetted',
    statutoryDaysLimit: 30
  },
  objections_window: {
    label: 'Objections Window',
    color: 'yellow',
    description: 'Statutory 60-day Section 15 landowner hearing window',
    statutoryDaysLimit: 60
  },
  award_declared: {
    label: 'Award Declared',
    color: 'yellow',
    description: 'Final land valuation and solatium award announced',
    statutoryDaysLimit: 365
  },
  compensation_disbursed: {
    label: 'Compensation Disbursed',
    color: 'yellow',
    description: 'Direct Benefit Transfer (PFMS) payments in execution',
    statutoryDaysLimit: 60
  },
  possession_taken: {
    label: 'Possession Taken',
    color: 'yellow',
    description: 'Physical possession handed over to Requiring Agency',
    statutoryDaysLimit: 30
  },
  rr_in_progress: {
    label: 'R&R In Progress',
    color: 'yellow',
    description: 'Rehabilitation & Resettlement schemes in execution',
    statutoryDaysLimit: 180
  },
  completed: {
    label: 'Completed',
    color: 'green',
    description: 'All statutory proceedings and verifications finalized',
    statutoryDaysLimit: 9999
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    description: 'Proposal rejected during administrative scrutiny',
    statutoryDaysLimit: 0
  },
  returned_for_clarification: {
    label: 'Returned for Clarification',
    color: 'amber',
    description: 'Returned to Requiring Body for deficit rectification',
    statutoryDaysLimit: 15
  },

  // Family Stages
  scheme_communicated: {
    label: 'Scheme Communicated',
    color: 'gray',
    description: 'Entitlement details communicated to affected household',
    statutoryDaysLimit: 30
  },
  compensation_processed: {
    label: 'Compensation Processed',
    color: 'yellow',
    description: 'Disbursement mandate generated and verified',
    statutoryDaysLimit: 30
  },
  relocated: {
    label: 'Relocated',
    color: 'yellow',
    description: 'Family transitioned to designated resettlement site',
    statutoryDaysLimit: 90
  },
  resettlement_verified: {
    label: 'Resettlement Verified',
    color: 'green',
    description: 'Physical occupancy and civic infrastructure verified',
    statutoryDaysLimit: 9999
  }
};

/**
 * Returns configuration for a given stage code (case-insensitive and formatted)
 */
export function getStageConfig(stage: string): StageConfig {
  const normalized = stage?.toLowerCase().trim() || '';
  if (STAGE_CONFIGS[normalized]) {
    return STAGE_CONFIGS[normalized];
  }
  
  // Clean fallback if stage isn't directly recognized
  const formatted = normalized
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    label: formatted || 'Pending',
    color: 'yellow',
    statutoryDaysLimit: 30
  };
}
