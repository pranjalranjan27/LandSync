import type { AnalyticsTranslations } from '../types';

export const analytics: AnalyticsTranslations = {
  title: 'Statutory Analytics & Policy Monitor',
  subtitle: 'National overview of RFCTLARR procedural metrics, judicial pendency, and acquisition velocity.',
  metrics: {
    overallProgress: 'National Acquisition Velocity',
    avgTimelineDays: 'Average Days per Notification',
    slaComplianceRate: 'Statutory SLA Compliance',
    totalCompensationPaid: 'Direct Benefit Compensation Disbursed'
  },
  charts: {
    monthlySubmissions: 'Monthly Acquisition Gazette Releases',
    disputeBreakdown: 'Classification of Landowner Objections',
    stageDurations: 'Average Days Spent in Each Stage',
    stateWisePendency: 'State-wise Clearance Backlog'
  },
  generateReport: 'Export Statutory Compliance Dossier',
  filterByYear: 'Financial Year'
};
