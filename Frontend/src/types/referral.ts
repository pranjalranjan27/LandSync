/**
 * Statutory Dispute Referral Types under Chapter VIII of the RFCTLARR Act, 2013
 */

export type DisputeReferralStatus =
  | 'referred'
  | 'under_hearing'
  | 'decided'
  | 'appealed_high_court'
  | 'closed';

export interface DisputeReferral {
  id: string;
  case_id: number;
  referred_at: string;
  referred_by_user_id: number;
  reason: string;
  larr_case_number?: string | null;
  hearing_dates?: string[] | null;
  status: DisputeReferralStatus;
  outcome?: string | null;
  high_court_appeal_outcome?: string | null;
  resolved_at?: string | null;
}

export interface DisputeReferralCreate {
  reason: string;
}

export interface DisputeReferralUpdate {
  status?: DisputeReferralStatus;
  larr_case_number?: string;
  hearing_dates?: string[];
  outcome?: string;
  high_court_appeal_outcome?: string;
}
