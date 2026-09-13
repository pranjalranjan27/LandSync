/**
 * LandSync User & Role Authorization Types
 */

export type Role =
  | 'REQUIRING_BODY'
  | 'COLLECTOR'
  | 'STATE_APPROVER'
  | 'SIA_EXPERT'
  | 'RR_ADMIN'
  | 'PATWARI_LEKHPAL'
  | 'TEHSILDAR'
  | 'FIELD_OFFICER' // Backward compatibility alias
  | 'POLICY_VIEWER'
  | 'LARR_AUTHORITY'
  | 'INDEPENDENT_SIA_EXPERT'
  | 'RR_MONITORING_COMMITTEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  department: string;
  district: string;
  district_id?: string;
  state: string;
  phone?: string;
  avatarUrl?: string;
  isOfficial: boolean;
  jurisdiction_level?: 'national' | 'state' | 'district' | 'tehsil' | 'village' | string;
  jurisdiction_value?: string;
}

export interface RoleConfig {
  role: Role;
  displayName: string;
  hindiName: string;
  dashboardPath: string;
  description: string;
  canMutate: boolean;
}

export const USER_ROLES_LIST: Role[] = [
  'REQUIRING_BODY',
  'COLLECTOR',
  'STATE_APPROVER',
  'SIA_EXPERT',
  'RR_ADMIN',
  'PATWARI_LEKHPAL',
  'TEHSILDAR',
  'FIELD_OFFICER',
  'POLICY_VIEWER',
  'LARR_AUTHORITY',
  'INDEPENDENT_SIA_EXPERT',
  'RR_MONITORING_COMMITTEE'
];
