/**
 * NALAMS Case & Workflow Domain Types
 * Single Source of Truth for RFCTLARR 2013 Stages and Records
 */

export type CaseStage =
  | 'STAGE_1_PROPOSAL_PENDING'       // Section 4 proposal submitted by Requiring Body
  | 'STAGE_2_COLLECTOR_SCRUTINY'     // District Collector initial scrutiny & boundary vetting
  | 'STAGE_3_SIA_EVALUATION'         // Social Impact Assessment & Expert Committee
  | 'STAGE_4_SEC11_NOTIFICATION'     // Section 11(1) Preliminary Gazette Notification
  | 'STAGE_5_OBJECTIONS_HEARING'     // Section 15 Objections & Landowner Hearings
  | 'STAGE_6_SEC19_DECLARATION'      // Section 19 Declaration of Acquisition
  | 'STAGE_7_RR_AWARD_DISBURSEMENT'  // Sections 23-31 Rehabilitation & Resettlement Award
  | 'STAGE_8_POSSESSION_COMPLETED'   // Section 38 Vesting & Possession Complete
  | 'returned_for_clarification'     // Collector returned proposal for clarifications
  | 'proposal_submitted'             // Requisition body initial submission
  | 'district_review'                // Collector district scrutiny
  | 'sia_in_progress'                // Social Impact Assessment under evaluation
  | 'sia_complete'                   // SIA finished, ready for Sec 11 notification
  | 'notification_published'         // Section 11 gazette published
  | 'objections_window'              // Hearing window, ready for award formulation
  | 'award_declared'                 // Section 19 declaration / award
  | 'compensation_disbursed'         // R&R DBT finished, ready for possession confirmation
  | 'state_review'                   // State Secretariat review
  | 'award_issued'                   // Final statutory award drafted
  | 'rr_in_progress'                 // Solatium and rehabilitation processing
  | 'possession_taken'               // Possession handed over to Requiring Body
  | 'rejected'                       // Proposal rejected
  | 'completed';                     // Workflow completed

export type CaseAction =
  | 'SUBMIT_PROPOSAL'
  | 'APPROVE_FORWARD'
  | 'REQUEST_CLARIFICATION'
  | 'REJECT'
  | 'COMMISSION_SIA'
  | 'SUBMIT_SIA_VERDICT'
  | 'PUBLISH_GAZETTE_SEC11'
  | 'LOG_OBJECTION'
  | 'RESOLVE_OBJECTION'
  | 'PUBLISH_DECLARATION_SEC19'
  | 'CALCULATE_RR_AWARD'
  | 'DISBURSE_COMPENSATION'
  | 'HANDOVER_POSSESSION';

export interface AffectedFamily {
  id: string;
  headName: string;
  aadharHash: string;
  category: 'SC' | 'ST' | 'OBC' | 'GENERAL' | 'BPL';
  landAreaAcres: number;
  structuresLost: string[];
  displacementStatus: 'DISPLACED' | 'AFFECTED_NON_DISPLACED';
  compensationAmount: number;
  rehabilitationPackage: string;
  paymentStatus: 'PENDING' | 'APPROVED' | 'DISBURSED';
}

export interface ObjectionRecord {
  id: string;
  caseId: string;
  objectorName: string;
  khasraNo: string;
  filingDate: string;
  grounds: string;
  hearingDate?: string;
  collectorVerdict?: 'UPHELD' | 'DISMISSED' | 'AMENDED';
  verdictReason?: string;
  verdictDate?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: CaseAction | string;
  stage: CaseStage;
  details: string;
  sha256Hash: string;
  justificationReason?: string;
}

export interface LandParcel {
  khasraNumber: string;
  mauza: string;
  soilType: string;
  areaHectares: number;
  ownerName: string;
  circleRatePerSqMtr: number;
  solatiumMultiplier: number;
}

export interface Case {
  id: string;
  caseNumber: string; // e.g. DL-SEC11-2026-004928-E
  projectTitle: string;
  projectPurpose: string;
  requiringDepartment: string;
  state: string;
  district: string;
  tehsil: string;
  mauza: string;
  khasraNumbers: string[];
  stage: CaseStage;
  stageNumber: number; // 1 through 8
  totalAreaHectares: number;
  affectedFamiliesCount: number;
  totalEstimatedCompensation: number;
  disbursedCompensation: number;
  dateInitiated: string;
  lastUpdated: string;
  isUrgentSec40: boolean;
  rfctlarrActCitation: string;
  auditTrail: AuditLogItem[];
  parcels: LandParcel[];
  state_id?: string;
  district_id?: string;
  hearingLogged?: boolean;
  assignedTo?: string;
  assignedFieldOfficerId?: string;
  verificationTaskPending?: boolean;
  rrFamiliesTotal?: number;
  rrFamiliesVerified?: number;
  has_active_dispute?: boolean;
  active_dispute?: import('./referral').DisputeReferral | null;
  dispute_referrals?: import('./referral').DisputeReferral[];
}

export const CASE_DOMAIN_VERSION = '1.0.0';

