import type { Case } from '../../types/case';
import type { DisputeReferral, DisputeReferralCreate, DisputeReferralUpdate } from '../../types/referral';
import { fetchAllCases } from './casesApi';

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('landsync_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchLarrCases(): Promise<Case[]> {
  try {
    const res = await fetch('/api/v1/authority/larr/cases', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.map((bc: any) => ({
        id: String(bc.id),
        caseNumber: `UP-SEC11-2026-00${bc.id}-E`,
        projectTitle: bc.project_name || 'Infrastructure Acquisition Project',
        projectPurpose: bc.justification || 'Statutory public purpose land acquisition',
        requiringDepartment: 'National Highways Authority of India (NHAI)',
        state: bc.state_id === 1 ? 'Uttar Pradesh' : 'Uttar Pradesh',
        district: bc.district_id === 1 ? 'Gautam Buddha Nagar' : 'Gautam Buddha Nagar',
        tehsil: 'Dadri',
        mauza: 'Chhapraula',
        khasraNumbers: ['102/1', '102/2'],
        stage: bc.current_stage || 'compensation_disbursed',
        stageNumber: 8,
        totalAreaHectares: bc.total_area_hectares ?? 12.5,
        affectedFamiliesCount: bc.estimated_affected_families ?? 42,
        totalEstimatedCompensation: 48500000,
        disbursedCompensation: 48500000,
        dateInitiated: bc.created_at ? bc.created_at.split('T')[0] : '2026-01-15',
        lastUpdated: bc.stage_entered_at ? bc.stage_entered_at.split('T')[0] : '2026-02-10',
        isUrgentSec40: false,
        rfctlarrActCitation: 'Section 64 of RFCTLARR Act 2013',
        auditTrail: [],
        parcels: [],
        has_active_dispute: bc.has_active_dispute ?? true,
        active_dispute: bc.active_dispute,
        dispute_referrals: bc.dispute_referrals || []
      }));
    }
  } catch (err) {
    console.warn('[AuthorityApi] fetchLarrCases failed:', err);
  }
  // Fallback: filter cases that have active dispute or compensation_disbursed stage
  const all = await fetchAllCases();
  return all.filter((c) => c.has_active_dispute || c.stage === 'compensation_disbursed');
}

export async function fetchLarrReferrals(caseId: string | number): Promise<DisputeReferral[]> {
  try {
    const numericId = String(caseId).replace(/^[^\d]*/, '');
    const res = await fetch(`/api/v1/authority/larr/cases/${numericId}/referrals`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[AuthorityApi] fetchLarrReferrals failed:', err);
  }
  return [];
}

export async function updateLarrReferral(
  referralId: string,
  update: DisputeReferralUpdate
): Promise<DisputeReferral> {
  const res = await fetch(`/api/v1/authority/larr/referrals/${referralId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(update)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update referral' }));
    throw new Error(err.detail || 'Failed to update referral');
  }
  return await res.json();
}

export async function referCaseToLarr(
  caseId: string | number,
  data: DisputeReferralCreate
): Promise<DisputeReferral> {
  const numericId = String(caseId).replace(/^[^\d]*/, '');
  const res = await fetch(`/api/v1/cases/${numericId}/refer-to-larr`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to refer case to LARR Authority' }));
    throw new Error(err.detail || 'Failed to refer case to LARR Authority');
  }
  return await res.json();
}

export async function fetchSiaExpertCases(): Promise<Case[]> {
  try {
    const res = await fetch('/api/v1/authority/sia-expert/cases', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.map((bc: any) => ({
        id: String(bc.id),
        caseNumber: `UP-SEC11-2026-00${bc.id}-E`,
        projectTitle: bc.project_name || 'Infrastructure Acquisition Project',
        projectPurpose: bc.justification || 'Statutory public purpose land acquisition',
        requiringDepartment: 'National Highways Authority of India (NHAI)',
        state: bc.state_id === 1 ? 'Uttar Pradesh' : 'Uttar Pradesh',
        district: bc.district_id === 1 ? 'Gautam Buddha Nagar' : 'Gautam Buddha Nagar',
        tehsil: 'Dadri',
        mauza: 'Chhapraula',
        khasraNumbers: ['102/1', '102/2'],
        stage: bc.current_stage || 'sia_in_progress',
        stageNumber: 4,
        totalAreaHectares: bc.total_area_hectares ?? 12.5,
        affectedFamiliesCount: bc.estimated_affected_families ?? 42,
        totalEstimatedCompensation: 48500000,
        disbursedCompensation: 0,
        dateInitiated: bc.created_at ? bc.created_at.split('T')[0] : '2026-01-15',
        lastUpdated: bc.stage_entered_at ? bc.stage_entered_at.split('T')[0] : '2026-02-10',
        isUrgentSec40: false,
        rfctlarrActCitation: 'Section 7 of RFCTLARR Act 2013',
        auditTrail: [],
        parcels: [],
        has_active_dispute: bc.has_active_dispute ?? false,
        active_dispute: bc.active_dispute,
        dispute_referrals: bc.dispute_referrals || []
      }));
    }
  } catch (err) {
    console.warn('[AuthorityApi] fetchSiaExpertCases failed:', err);
  }
  return await fetchAllCases();
}

export async function fetchRrCommitteeCases(): Promise<Case[]> {
  try {
    const res = await fetch('/api/v1/authority/rr-committee/cases', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.map((bc: any) => ({
        id: String(bc.id),
        caseNumber: `UP-SEC11-2026-00${bc.id}-E`,
        projectTitle: bc.project_name || 'Infrastructure Acquisition Project',
        projectPurpose: bc.justification || 'Statutory public purpose land acquisition',
        requiringDepartment: 'National Highways Authority of India (NHAI)',
        state: bc.state_id === 1 ? 'Uttar Pradesh' : 'Uttar Pradesh',
        district: bc.district_id === 1 ? 'Gautam Buddha Nagar' : 'Gautam Buddha Nagar',
        tehsil: 'Dadri',
        mauza: 'Chhapraula',
        khasraNumbers: ['102/1', '102/2'],
        stage: bc.current_stage || 'rr_in_progress',
        stageNumber: 10,
        totalAreaHectares: bc.total_area_hectares ?? 12.5,
        affectedFamiliesCount: bc.estimated_affected_families ?? 42,
        totalEstimatedCompensation: 48500000,
        disbursedCompensation: 48500000,
        dateInitiated: bc.created_at ? bc.created_at.split('T')[0] : '2026-01-15',
        lastUpdated: bc.stage_entered_at ? bc.stage_entered_at.split('T')[0] : '2026-02-10',
        isUrgentSec40: false,
        rfctlarrActCitation: 'Section 50 of RFCTLARR Act 2013',
        auditTrail: [],
        parcels: [],
        has_active_dispute: bc.has_active_dispute ?? false,
        active_dispute: bc.active_dispute,
        dispute_referrals: bc.dispute_referrals || []
      }));
    }
  } catch (err) {
    console.warn('[AuthorityApi] fetchRrCommitteeCases failed:', err);
  }
  return await fetchAllCases();
}
