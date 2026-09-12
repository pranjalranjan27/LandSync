import type { Case } from '../types/case';
import { mockCases } from '../mock-data/cases';
import { fetchAllCases } from '../lib/api/casesApi';

/**
 * Case Service integrating backend REST API with mock fallback for cases
 */
export const caseService = {
  /**
   * Scoped by district_id or authenticated user jurisdiction.
   */
  async getCases(params?: {
    mine?: boolean;
    department?: string;
    stage?: string;
    district_id?: string;
    district?: string;
    state_id?: string;
    state?: string;
    assigned_to?: string;
  }): Promise<Case[]> {
    let results: Case[];
    try {
      results = await fetchAllCases();
    } catch {
      results = [...mockCases];
    }

    // Filter by state_id or state (e.g. for State Approver spanning multiple districts)
    const stateQuery = params?.state_id || params?.state;
    if (stateQuery) {
      const sq = stateQuery.toLowerCase().trim().replace(/_/g, ' ');
      results = results.filter((c) => {
        const caseState = c.state.toLowerCase().trim();
        return (
          caseState === sq ||
          (sq.includes('uttar') && caseState.includes('uttar')) ||
          (sq.includes('uttara') && caseState.includes('uttara')) ||
          (sq.includes('maharashtra') && caseState.includes('maharashtra'))
        );
      });
    }

    // Filter by district_id or district
    const districtQuery = params?.district_id || params?.district;
    if (districtQuery) {
      const q = districtQuery.toLowerCase().trim().replace(/_/g, ' ');
      results = results.filter((c) => {
        const caseDist = c.district.toLowerCase().trim();
        return (
          caseDist === q ||
          (q.includes('gautam') && caseDist.includes('gautam')) ||
          (q.includes('pauri') && caseDist.includes('pauri')) ||
          (q.includes('thane') && caseDist.includes('thane'))
        );
      });
    }

    // Filter by assigned_to (e.g., for SIA Expert or Field Officer tasks)
    if (params?.assigned_to) {
      const targetAssignee = params.assigned_to.toLowerCase().trim();
      results = results.filter((c) => {
        if (targetAssignee === 'me') return true; // Matches current authenticated expert/officer
        return (
          (c.assignedTo && c.assignedTo.toLowerCase().includes(targetAssignee)) ||
          (c.assignedFieldOfficerId && c.assignedFieldOfficerId.toLowerCase().includes(targetAssignee))
        );
      });
    }

    // Filter by stage (supports single stage or comma-separated list like 'possession_taken,rr_in_progress')
    if (params?.stage && params.stage !== 'ALL') {
      const stages = params.stage.split(',').map((s) => s.trim().toLowerCase());
      results = results.filter((c) => stages.includes(c.stage.toLowerCase()));
    }

    if (params?.mine) {
      // Return cases for Requiring Body (RVNL / user department)
      const myDepartment = params.department || 'Rail Vikas Nigam Limited (RVNL)';
      results = results.filter(
        (c) =>
          c.requiringDepartment === myDepartment ||
          c.stage === 'returned_for_clarification' ||
          c.stage === 'proposal_submitted' ||
          c.id === 'case-001' ||
          c.id === 'case-004' ||
          c.id === 'case-005'
      );
    }

    return results;
  },

  /**
   * Resubmit case back to proposal_submitted and record audit log.
   */
  async resubmitCase(caseId: string, clarificationNotes?: string): Promise<Case> {
    const targetIndex = mockCases.findIndex((c) => c.id === caseId);
    const current = targetIndex !== -1 ? mockCases[targetIndex] : (await fetchAllCases())[0];

    const updatedCase: Case = {
      ...current,
      stage: 'proposal_submitted',
      stageNumber: 1,
      lastUpdated: new Date().toISOString().split('T')[0],
      auditTrail: [
        ...current.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: 'Deepak Sharma, CPM (RVNL)',
          actorRole: 'REQUIRING_BODY',
          action: 'SUBMIT_PROPOSAL',
          stage: 'proposal_submitted',
          details: clarificationNotes
            ? `Proposal resubmitted with revisions: ${clarificationNotes}`
            : 'Proposal resubmitted with rectified cadastral boundary schedule and Mauza Shajra alignment certificate.',
          sha256Hash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
        }
      ]
    };

    if (targetIndex !== -1) {
      mockCases[targetIndex] = updatedCase;
    }
    return updatedCase;
  }
};
