export type LanguageCode = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export interface CommonTranslations {
  appName: string;
  appSubtitle: string;
  hindiTagline: string;
  emblemAlt: string;
  digitalIndiaTagline: string;
  officialSystemNotice: string;
  save: string;
  cancel: string;
  submit: string;
  confirm: string;
  edit: string;
  delete: string;
  back: string;
  next: string;
  viewDetails: string;
  search: string;
  filter: string;
  export: string;
  loading: string;
  actions: string;
  status: string;
  stage: string;
  date: string;
  all: string;
  yes: string;
  no: string;
  roles: {
    collector: string;
    requiringBody: string;
    stateApprover: string;
    siaExpert: string;
    rrAdmin: string;
    fieldOfficer: string;
  };
  nav?: {
    dashboard: string;
    cases: string;
    reports: string;
    notifications: string;
    documents: string;
    profile: string;
  };
}

export interface AuthTranslations {
  loginTitle: string;
  loginSubtitle: string;
  officialSystemBadge: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierHelp: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberMe: string;
  forgotPassword: string;
  loginButton: string;
  loggingIn: string;
  newUserPrompt: string;
  registerHere: string;
  selectLanguage: string;
  quickTestLabel: string;
  quickTestCollector: string;
  quickTestRequiringBody: string;
  quickTestFieldOfficer: string;
  
  // Validation errors
  errorIdentifierRequired: string;
  errorIdentifierInvalid: string;
  errorPasswordRequired: string;
  errorPasswordShort: string;
  errorInvalidCredentials: string;

  // Register page
  registerTitle: string;
  registerSubtitle: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  departmentLabel: string;
  departmentPlaceholder: string;
  submitRegistration: string;
  alreadyRegistered: string;
  signInHere: string;
  registrationSuccessTitle: string;
  registrationSuccessDesc: string;
  returnToLogin: string;

  // OTP Verification
  otpTitle: string;
  otpSubtitle: string;
  mfaBadge: string;
  otpInputLabel: string;
  verifyOtpButton: string;
  verifying: string;
  resendOtp: string;
  resendIn: string;
  otpInvalid: string;
  backToLogin: string;

  // Forgot password
  forgotPasswordTitle: string;
  forgotPasswordSubtitle: string;
  recoveryInputLabel: string;
  recoveryPlaceholder: string;
  sendResetLink: string;
  resetLinkSentTitle: string;
  resetLinkSentDesc: string;
  returnToSignIn: string;
  rememberedPassword: string;
}

export interface LandingTranslations {
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  accessPortal: string;
  exploreFeatures: string;
  keyPillarsTitle: string;
  pillars: {
    transparency: { title: string; desc: string };
    compliance: { title: string; desc: string };
    directBenefit: { title: string; desc: string };
    gisMapping: { title: string; desc: string };
  };
  statsTitle: string;
  statProjects: string;
  statAcquiredLand: string;
  statDisbursedCompensation: string;
  statDisputeReduction: string;
  nationalEmblemNotice: string;
}

export interface DashboardTranslations {
  welcomeBack: string;
  overview: string;
  activeCases: string;
  pendingReview: string;
  approvedCases: string;
  slaBreached: string;
  recentActivities: string;
  priorityAlerts: string;
  viewAllCases: string;
  createNewProposal: string;
  compensationDisbursed: string;
  objectionsPending: string;
  surveysCompleted: string;
  collectorViewTitle: string;
  requiringBodyViewTitle: string;
  stateApproverViewTitle: string;
  siaExpertViewTitle: string;
  rrAdminViewTitle: string;
  fieldOfficerViewTitle: string;
  needsAction?: string;
  allDistrictCases?: string;
  filterByStage?: string;
  districtLabel?: string;
  collectorSubtitle?: string;
  allStateCases?: string;
}

export interface CasesTranslations {
  caseQueueTitle: string;
  caseQueueSubtitle: string;
  filterByStage: string;
  filterByStatus: string;
  searchCasesPlaceholder: string;
  tableHeaders: {
    caseId: string;
    projectName: string;
    requiringBody: string;
    district: string;
    totalArea: string;
    stage: string;
    status: string;
    lastUpdated: string;
    action: string;
  };
  stages: {
    preliminary: string;
    section11: string;
    sia: string;
    section19: string;
    award: string;
    possession: string;
  };
  statuses: {
    draft: string;
    underReview: string;
    inProgress: string;
    approved: string;
    rejected: string;
    completed: string;
  };
  detailTabs: {
    overview: string;
    timeline: string;
    surveys: string;
    compensation: string;
    objections: string;
    documents: string;
  };
}

export interface ProposalsTranslations {
  createProposalTitle: string;
  createProposalSubtitle: string;
  steps: {
    projectDetails: string;
    landSchedule: string;
    affectedFamilies: string;
    documents: string;
    review: string;
  };
  projectDetails: {
    projectName: string;
    projectNamePlaceholder: string;
    projectCategory: string;
    department: string;
    district: string;
    estimatedBudget: string;
    purpose: string;
  };
  landSchedule: {
    village: string;
    surveyNumbers: string;
    totalAreaHectares: string;
    landClassification: string;
  };
  submitForReview: string;
  saveAsDraft: string;
  proposalSuccessMessage: string;
}

export interface ObjectionsTranslations {
  logObjectionTitle: string;
  logObjectionSubtitle: string;
  caseSelectionLabel: string;
  caseSelectionPlaceholder: string;
  petitionerName: string;
  petitionerPhone: string;
  petitionerEmail: string;
  surveyNumber: string;
  objectionCategory: string;
  objectionDescription: string;
  objectionDescriptionPlaceholder: string;
  supportingDocuments: string;
  hearingPreference: string;
  hearingInPerson: string;
  hearingVirtual: string;
  submitObjection: string;
  objectionSuccessNotice: string;
}

export interface AnalyticsTranslations {
  title: string;
  subtitle: string;
  metrics: {
    overallProgress: string;
    avgTimelineDays: string;
    slaComplianceRate: string;
    totalCompensationPaid: string;
  };
  charts: {
    monthlySubmissions: string;
    disputeBreakdown: string;
    stageDurations: string;
    stateWisePendency: string;
  };
  generateReport: string;
  filterByYear: string;
}

export interface TranslationSchema {
  common: CommonTranslations;
  auth: AuthTranslations;
  landing: LandingTranslations;
  dashboard: DashboardTranslations;
  cases: CasesTranslations;
  proposals: ProposalsTranslations;
  objections: ObjectionsTranslations;
  analytics: AnalyticsTranslations;
}
