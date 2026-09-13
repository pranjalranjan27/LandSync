/**
 * Types for Section 4 Statutory Land Verification
 * Patwari/Lekhpal reports facts, Tehsildar certifies facts.
 */

export interface AssetItem {
  type: string; // 'tree' | 'well' | 'structure' | 'borewell' | 'crop' | 'other'
  description: string;
  estimated_count_or_area?: string;
}

export type LandVerificationStatus = 'submitted' | 'certified' | 'returned_for_correction';

export interface LandVerificationRecord {
  id: string;
  case_id: number;
  parcel_ids: string[];
  khasra_ownership_confirmed: boolean;
  ownership_notes?: string;
  boundary_verification_notes?: string;
  asset_inventory: AssetItem[];
  notice_served_at?: string;
  notice_served_notes?: string;
  submitted_by_officer_id: number;
  submitted_by_officer_name?: string;
  submitted_at: string;
  status: LandVerificationStatus;
  certified_by_tehsildar_id?: number;
  certified_by_tehsildar_name?: string;
  certified_at?: string;
  tehsildar_notes?: string;
  case_project_name?: string;
}

export interface LandVerificationCreate {
  parcel_ids?: string[];
  khasra_ownership_confirmed: boolean;
  ownership_notes?: string;
  boundary_verification_notes?: string;
  asset_inventory: AssetItem[];
  notice_served_at?: string;
  notice_served_notes?: string;
}
