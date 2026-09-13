import type { Case, CaseStage } from '../../types/case';
import { mockCases } from '../../mock-data/cases';

function mapBackendCaseToFrontend(bc: any): Case {
  const match = mockCases.find(
    (m) =>
      m.id === String(bc.id) ||
      m.id === `case-${bc.id}` ||
      m.caseNumber.toLowerCase() === String(bc.id).toLowerCase() ||
      m.projectTitle.toLowerCase() === (bc.project_name || '').toLowerCase()
  );

  const stageMap: Record<string, CaseStage> = {
    proposal_submitted: 'proposal_submitted',
    district_review: 'STAGE_2_COLLECTOR_SCRUTINY',
    state_review: 'state_review',
    sia_in_progress: 'sia_in_progress',
    notification_published: 'STAGE_4_SEC11_NOTIFICATION',
    objections_window: 'objections_window',
    award_declared: 'award_issued',
    compensation_disbursed: 'compensation_disbursed',
    possession_taken: 'possession_taken',
    rr_in_progress: 'rr_in_progress',
    returned_for_clarification: 'returned_for_clarification',
    rejected: 'returned_for_clarification',
    completed: 'STAGE_8_POSSESSION_COMPLETED',
  };

  const mappedStage: CaseStage = stageMap[bc.current_stage] || bc.current_stage || 'STAGE_1_PROPOSAL_PENDING';

  return {
    id: String(bc.id),
    caseNumber: match?.caseNumber || `UP-SEC11-2026-00${bc.id}-E`,
    projectTitle: bc.project_name || match?.projectTitle || 'Infrastructure Acquisition Project',
    projectPurpose: bc.justification || match?.projectPurpose || 'Statutory public purpose land acquisition',
    requiringDepartment: match?.requiringDepartment || 'National Highways Authority of India (NHAI)',
    state: bc.parcels?.[0]?.state || (bc.state_id === 1 ? 'Uttar Pradesh' : match?.state || 'Uttar Pradesh'),
    district: bc.parcels?.[0]?.district || (bc.district_id === 1 ? 'Gautam Buddha Nagar' : match?.district || 'Gautam Buddha Nagar'),
    tehsil: bc.parcels?.[0]?.tehsil || match?.tehsil || 'Dadri',
    mauza: bc.parcels?.[0]?.village || match?.mauza || 'Chhapraula',
    khasraNumbers: (bc.parcels && bc.parcels.length > 0)
      ? bc.parcels.map((p: any) => p.khasra_number)
      : (match?.khasraNumbers || ['102/1', '102/2']),
    stage: mappedStage,
    stageNumber: match?.stageNumber || 2,
    totalAreaHectares: bc.total_area_hectares ?? (
      bc.parcels && bc.parcels.length > 0
        ? bc.parcels.reduce((sum: number, p: any) => sum + (Number(p.area_hectares) || 0), 0)
        : (match?.totalAreaHectares ?? 12.5)
    ),
    affectedFamiliesCount: bc.estimated_affected_families ?? match?.affectedFamiliesCount ?? 42,
    totalEstimatedCompensation: match?.totalEstimatedCompensation ?? 48500000,
    disbursedCompensation: match?.disbursedCompensation ?? 0,
    dateInitiated: bc.created_at ? bc.created_at.split('T')[0] : match?.dateInitiated ?? '2026-01-15',
    lastUpdated: bc.stage_entered_at ? bc.stage_entered_at.split('T')[0] : match?.lastUpdated ?? '2026-02-10',
    isUrgentSec40: match?.isUrgentSec40 ?? false,
    rfctlarrActCitation: match?.rfctlarrActCitation ?? 'Section 11(1) of RFCTLARR Act 2013',
    auditTrail: match?.auditTrail || [],
    parcels: (bc.parcels && bc.parcels.length > 0) ? bc.parcels : (match?.parcels || []),
    state_id: bc.state_id ? String(bc.state_id) : match?.state_id,
    district_id: bc.district_id ? String(bc.district_id) : match?.district_id,
    assignedTo: match?.assignedTo || 'Priya Singh, IAS (Collector)',
    hearingLogged: match?.hearingLogged,
    assignedFieldOfficerId: match?.assignedFieldOfficerId,
    verificationTaskPending: match?.verificationTaskPending,
    rrFamiliesTotal: match?.rrFamiliesTotal,
    rrFamiliesVerified: match?.rrFamiliesVerified,
    has_active_dispute: bc.has_active_dispute ?? match?.has_active_dispute ?? false,
    active_dispute: bc.active_dispute ?? match?.active_dispute,
    dispute_referrals: bc.dispute_referrals ?? match?.dispute_referrals ?? []
  };
}

export async function fetchAllCases(): Promise<Case[]> {
  try {
    const token = sessionStorage.getItem('landsync_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/cases', { headers, cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const backendMapped = data.map(mapBackendCaseToFrontend);
        const merged = [...backendMapped];
        for (const mc of mockCases) {
          if (!merged.some((c) => c.id === mc.id || c.caseNumber === mc.caseNumber)) {
            merged.push(mc);
          }
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('[LandSync] Backend fetchAllCases fallback to mock data:', err);
  }
  return [...mockCases];
}

export async function fetchCaseById(id: string): Promise<Case | null> {
  try {
    const token = sessionStorage.getItem('landsync_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const numericId = id.replace(/^[^\d]*/, '');
    if (numericId) {
      const res = await fetch(`/cases/${numericId}`, { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          return mapBackendCaseToFrontend(data);
        }
      }
    }
  } catch (err) {
    console.warn('[LandSync] Backend fetchCaseById fallback:', err);
  }

  const found = mockCases.find((c) => c.id === id || c.caseNumber.toLowerCase() === id.toLowerCase());
  return found || null;
}

export async function updateCaseStage(
  caseId: string,
  newStage: Case['stage'],
  newStageNumber: number
): Promise<Case | null> {
  try {
    const token = sessionStorage.getItem('landsync_token');
    const numericId = caseId.replace(/^[^\d]*/, '');
    if (numericId && token) {
      const res = await fetch(`/cases/${numericId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to_stage: newStage,
          justification: `Stage advanced to ${newStage} via LandSync portal`
        })
      });
      if (res.ok) {
        const data = await res.json();
        return mapBackendCaseToFrontend(data);
      }
    }
  } catch (err) {
    console.warn('[LandSync] Backend updateCaseStage fallback:', err);
  }

  const target = mockCases.find((c) => c.id === caseId);
  if (target) {
    target.stage = newStage;
    target.stageNumber = newStageNumber;
    target.lastUpdated = new Date().toISOString().split('T')[0];
    return { ...target };
  }
  return null;
}

export { caseService } from '../../services/caseService';
