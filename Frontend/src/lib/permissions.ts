import type { Role } from '../types/user';
import type { CaseStage } from '../types/case';

export function isReadOnlyRole(role: Role | string): boolean {
  const r = (role || '').toUpperCase();
  return r === 'POLICY_VIEWER' || r === 'RR_MONITORING_COMMITTEE';
}

export function canPerformCaseAction(role: Role | string, stage: CaseStage | string): boolean {
  const r = (role || '').toUpperCase();
  // Blanket rule: POLICY_VIEWER never has any action-gated mutation permissions
  if (r === 'POLICY_VIEWER' || isReadOnlyRole(r)) {
    return false;
  }

  const s = stage.toLowerCase();

  switch (s) {
    case 'proposal_submitted':
    case 'stage_1_proposal_pending':
      return r === 'COLLECTOR' || r === 'REQUIRING_BODY';
    case 'state_review':
    case 'stage_2_collector_scrutiny':
      return r === 'STATE_APPROVER' || r === 'COLLECTOR';
    case 'sia_in_progress':
    case 'sia_complete':
    case 'stage_3_sia_evaluation':
      return r === 'SIA_EXPERT' || r === 'INDEPENDENT_SIA_EXPERT' || r === 'STATE_APPROVER';
    case 'stage_4_sec11_notification':
      return r === 'COLLECTOR';
    case 'objections_window':
    case 'stage_5_objections_hearing':
      return r === 'COLLECTOR' || r === 'FIELD_OFFICER' || r === 'PATWARI_LEKHPAL' || r === 'TEHSILDAR';
    case 'award_issued':
    case 'stage_6_sec19_declaration':
      return r === 'COLLECTOR' || r === 'STATE_APPROVER';
    case 'rr_in_progress':
    case 'stage_7_rr_award_disbursement':
      return r === 'RR_ADMIN' || r === 'COLLECTOR';
    case 'compensation_disbursed':
      return r === 'COLLECTOR' || r === 'FIELD_OFFICER' || r === 'PATWARI_LEKHPAL' || r === 'TEHSILDAR';
    case 'possession_taken':
    case 'stage_8_possession_completed':
      return r === 'RR_ADMIN' || r === 'COLLECTOR' || r === 'FIELD_OFFICER' || r === 'PATWARI_LEKHPAL' || r === 'TEHSILDAR';
    default:
      return false;
  }
}
