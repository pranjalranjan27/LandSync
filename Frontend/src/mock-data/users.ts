import type { User, RoleConfig } from '../types/user';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: 'Priya Singh, IAS',
    email: 'collector.gbnagar@up.gov.in',
    role: 'COLLECTOR',
    designation: 'District Magistrate & Collector',
    department: 'Department of Revenue & Land Acquisition',
    district: 'Gautam Buddha Nagar',
    district_id: 'gautam_buddha_nagar',
    state: 'Uttar Pradesh',
    isOfficial: true
  },
  {
    id: 'user-002',
    name: 'Deepak Sharma',
    email: 'd.sharma@rvnl.org',
    role: 'REQUIRING_BODY',
    designation: 'Chief Project Manager (Land & Infrastructure)',
    department: 'Rail Vikas Nigam Limited (RVNL)',
    district: 'Pauri Garhwal',
    state: 'Uttarakhand',
    isOfficial: true
  },
  {
    id: 'user-003',
    name: 'Anand Kumar, IAS',
    email: 'secy.revenue@uk.gov.in',
    role: 'STATE_APPROVER',
    designation: 'Principal Secretary (Revenue)',
    department: 'Government of Uttarakhand',
    district: 'Dehradun',
    state: 'Uttarakhand',
    isOfficial: true
  },
  {
    id: 'user-004',
    name: 'Dr. Meenakshi Sundaram',
    email: 'sia.expert@gov.in',
    role: 'SIA_EXPERT',
    designation: 'Chairperson, Expert SIA Committee',
    department: 'State Directorate of Social Impact Assessment',
    district: 'Pauri Garhwal',
    state: 'Uttarakhand',
    isOfficial: true
  },
  {
    id: 'user-005',
    name: 'Ritu Maheshwari, IAS',
    email: 'rr.admin@up.gov.in',
    role: 'RR_ADMIN',
    designation: 'Commissioner Rehabilitation & Resettlement',
    department: 'State Directorate of R&R',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    isOfficial: true
  },
  {
    id: 'user-006',
    name: 'Rameshwar Dayal Sharma',
    email: 'patwari_lekhpal@landsync.gov.in',
    role: 'PATWARI_LEKHPAL',
    designation: 'Patwari / Lekhpal (Chhapraula / Bisrakh)',
    department: 'Tehsil Land Revenue Wing',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    isOfficial: true,
    jurisdiction_level: 'village',
    jurisdiction_value: 'Chhapraula,Bisrakh Jalalpur'
  },
  {
    id: 'user-007',
    name: 'Sunita Narain',
    email: 'policy.viewer@niti.gov.in',
    role: 'POLICY_VIEWER',
    designation: 'Senior Advisor (Public Lands)',
    department: 'NITI Aayog / MoRD',
    district: 'New Delhi',
    state: 'National',
    isOfficial: true
  },
  {
    id: 'user-008',
    name: 'Smt. Sudha Upadhyay',
    email: 'tehsildar@landsync.gov.in',
    role: 'TEHSILDAR',
    designation: 'Tehsildar / Executive Magistrate (Dadri)',
    department: 'Office of the Tehsildar, Dadri',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    isOfficial: true,
    jurisdiction_level: 'tehsil',
    jurisdiction_value: 'Dadri'
  },
  {
    id: 'user-009',
    name: 'Hon. Justice V.K. Sharma',
    email: 'larr_authority@landsync.gov.in',
    role: 'LARR_AUTHORITY',
    designation: 'Presiding Officer, LARR Authority',
    department: 'Land Acquisition, Rehabilitation and Resettlement Authority',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    isOfficial: true
  },
  {
    id: 'user-010',
    name: 'Prof. Ananya Sen',
    email: 'independent_sia_expert@landsync.gov.in',
    role: 'INDEPENDENT_SIA_EXPERT',
    designation: 'National SIA Evaluator',
    department: 'Independent SIA Expert Group (National)',
    district: 'National',
    state: 'National',
    isOfficial: true
  },
  {
    id: 'user-011',
    name: 'Dr. K. Radhakrishnan',
    email: 'rr_committee@landsync.gov.in',
    role: 'RR_MONITORING_COMMITTEE',
    designation: 'Member Secretary, National R&R Monitoring Committee',
    department: 'National Monitoring Committee for R&R (MoRD)',
    district: 'National',
    state: 'National',
    isOfficial: true
  }
];

export const roleConfigs: Record<string, RoleConfig> = {
  COLLECTOR: {
    role: 'COLLECTOR',
    displayName: 'District Collector & DM',
    hindiName: 'जिला कलेक्टर',
    dashboardPath: '/collector',
    description: 'Statutory authority under Section 11 & 19 for notifications, hearings, and land awards.',
    canMutate: true
  },
  REQUIRING_BODY: {
    role: 'REQUIRING_BODY',
    displayName: 'Requiring Body / Project Proponent',
    hindiName: 'अपेक्षी निकाय',
    dashboardPath: '/requiring-body',
    description: 'Submits land proposals, project justifications, and funding commitments.',
    canMutate: true
  },
  STATE_APPROVER: {
    role: 'STATE_APPROVER',
    displayName: 'State Revenue Department (Approver)',
    hindiName: 'राज्य अनुमोदनकर्ता',
    dashboardPath: '/state-approver',
    description: 'State government sanction authority for commissioning SIA and high-value approvals.',
    canMutate: true
  },
  SIA_EXPERT: {
    role: 'SIA_EXPERT',
    displayName: 'SIA Team Leader / Expert Group',
    hindiName: 'एसआईए विशेषज्ञ समिति',
    dashboardPath: '/sia-expert',
    description: 'Conducts social impact hearings, environmental assessments, and submits verdicts.',
    canMutate: true
  },
  RR_ADMIN: {
    role: 'RR_ADMIN',
    displayName: 'Administrator (R&R)',
    hindiName: 'पुनर्वास एवं पुनर्व्यवस्था प्रशासक',
    dashboardPath: '/rr-admin',
    description: 'Formulates Rehabilitation & Resettlement schemes and tracks solatium disbursements.',
    canMutate: true
  },
  PATWARI_LEKHPAL: {
    role: 'PATWARI_LEKHPAL',
    displayName: 'Patwari / Lekhpal (Village Revenue Officer)',
    hindiName: 'पटवारी / लेखपाल',
    dashboardPath: '/field-officer',
    description: 'Performs on-ground cadastral surveys, ground-truthing, and tree/structure inventories.',
    canMutate: true
  },
  TEHSILDAR: {
    role: 'TEHSILDAR',
    displayName: 'Tehsildar (Quasi-Judicial Revenue Authority)',
    hindiName: 'तहसीलदार',
    dashboardPath: '/tehsildar',
    description: 'Conducts quasi-judicial Section 4 ground-verification certification and tehsil-level revenue reviews.',
    canMutate: true
  },
  FIELD_OFFICER: {
    role: 'FIELD_OFFICER',
    displayName: 'Patwari / Lekhpal (Village Revenue Officer)',
    hindiName: 'क्षेत्र अधिकारी / पटवारी',
    dashboardPath: '/field-officer',
    description: 'Performs on-ground cadastral surveys, ground-truthing, and tree/structure inventories.',
    canMutate: true
  },
  POLICY_VIEWER: {
    role: 'POLICY_VIEWER',
    displayName: 'Policy Viewer (National / Public Portal)',
    hindiName: 'नीति समीक्षक / लेखा परीक्षक',
    dashboardPath: '/policy-viewer',
    description: 'Read-only nation-wide land acquisition analytics and audit compliance monitoring.',
    canMutate: false
  },
  LARR_AUTHORITY: {
    role: 'LARR_AUTHORITY',
    displayName: 'LARR Authority',
    hindiName: 'भूमि अर्जन, पुनर्वास एवं पुनर्व्यवस्था प्राधिकरण',
    dashboardPath: '/authority',
    description: 'Adjudicates statutory compensation disputes and enhanced claims under Chapter VIII.',
    canMutate: true
  },
  INDEPENDENT_SIA_EXPERT: {
    role: 'INDEPENDENT_SIA_EXPERT',
    displayName: 'Independent SIA Expert Group',
    hindiName: 'स्वतंत्र एसआईए विशेषज्ञ समूह',
    dashboardPath: '/authority',
    description: 'Evaluates and reviews Social Impact Assessment reports nationwide under Section 7-8.',
    canMutate: true
  },
  RR_MONITORING_COMMITTEE: {
    role: 'RR_MONITORING_COMMITTEE',
    displayName: 'National R&R Monitoring Committee',
    hindiName: 'राष्ट्रीय पुनर्वास एवं पुनर्व्यवस्था निगरानी समिति',
    dashboardPath: '/authority',
    description: 'Statutory national oversight over implementation of Rehabilitation & Resettlement schemes (Read-Only).',
    canMutate: false
  }
};
