import type { ProposalsTranslations } from '../types';

export const proposals: ProposalsTranslations = {
  createProposalTitle: 'Submit New Land Acquisition Proposal',
  createProposalSubtitle: 'Complete formal requisitions in compliance with RFCTLARR Act 2013 guidelines.',
  steps: {
    projectDetails: '1. Project Overview',
    landSchedule: '2. Land Schedule',
    affectedFamilies: '3. Affected Families & SIA',
    documents: '4. Statutory Documents',
    review: '5. Review & Submission'
  },
  projectDetails: {
    projectName: 'Infrastructure Project Title',
    projectNamePlaceholder: 'e.g. NH-58 Bypass 4-Lane Expansion Corridor',
    projectCategory: 'Category of Public Purpose',
    department: 'Nodal Department / Ministry',
    district: 'Target District & Tehsil',
    estimatedBudget: 'Estimated Compensation Outlay (₹ Cr)',
    purpose: 'Detailed Justification & Public Purpose'
  },
  landSchedule: {
    village: 'Revenue Village',
    surveyNumbers: 'Cadastral Survey / Khasra Numbers',
    totalAreaHectares: 'Total Requisitioned Area (Hectares)',
    landClassification: 'Land Classification (Agricultural, Barren, Irrigated, Commercial)'
  },
  submitForReview: 'Submit Proposal to District Collector',
  saveAsDraft: 'Save Progress as Draft',
  proposalSuccessMessage: 'Proposal successfully logged. Acquisition file tracking token generated.'
};
