import type { CasesTranslations } from '../types';

export const cases: CasesTranslations = {
  caseQueueTitle: 'Land Acquisition Case Queue',
  caseQueueSubtitle: 'Monitor statutory timelines, gazette publications, and multi-department clearances across all districts.',
  filterByStage: 'Filter by Stage',
  filterByStatus: 'Filter by Status',
  searchCasesPlaceholder: 'Search by Case ID, Project Title, Village or Requiring Body...',
  tableHeaders: {
    caseId: 'Case ID',
    projectName: 'Project Name',
    requiringBody: 'Requiring Agency',
    district: 'District / State',
    totalArea: 'Total Area (Ha)',
    stage: 'Statutory Stage',
    status: 'Status',
    lastUpdated: 'Last Updated',
    action: 'Action'
  },
  stages: {
    preliminary: 'Preliminary Proposal',
    section11: 'Section 11 Preliminary Notification',
    sia: 'Social Impact Assessment (SIA)',
    section19: 'Section 19 Declaration',
    award: 'Award Inquiry & Determination',
    possession: 'Possession & Handover'
  },
  statuses: {
    draft: 'Draft',
    underReview: 'Under Review',
    inProgress: 'In Progress',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed'
  },
  detailTabs: {
    overview: 'Case Summary',
    timeline: 'Statutory Timeline',
    surveys: 'Cadastral Surveys',
    compensation: 'Compensation & Awards',
    objections: 'Public Objections (Sec 15)',
    documents: 'Gazette & Documents'
  }
};
