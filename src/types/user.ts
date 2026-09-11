/**
 * NALAMS User & Role Authorization Types
 */

export type Role =
  | 'REQUIRING_BODY'
  | 'COLLECTOR'
  | 'STATE_APPROVER'
  | 'SIA_EXPERT'
  | 'RR_ADMIN'
  | 'FIELD_OFFICER'
  | 'POLICY_VIEWER'
  | 'CITIZEN';

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
  avatarUrl?: string;
  isOfficial: boolean;
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
  'FIELD_OFFICER',
  'POLICY_VIEWER',
  'CITIZEN'
];

