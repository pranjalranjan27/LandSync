/**
 * Role-Based Access Control (RBAC) Module for LandSync (NALAMS)
 * Aligns frontend authorization with backend authentication.
 * Enforces statutory boundaries per RFCTLARR Act 2013 and GIGW 3.0.
 */

import type { User, Role } from '../types/user';
import { roleConfigs } from '../mock-data/users';

export type Permission =
  // Cases & Proposals
  | 'cases:view'
  | 'cases:create'
  | 'cases:edit'
  | 'cases:delete'
  | 'proposal:submit'
  | 'proposal:state_review'
  | 'proposal:sia_assign'
  // Statutory Workflow Stages
  | 'workflow:conduct_sia'
  | 'workflow:submit_sia_report'
  | 'workflow:issue_sec11'
  | 'workflow:conduct_survey'
  | 'workflow:manage_rr'
  | 'workflow:approve_award'
  | 'workflow:log_objection'
  | 'workflow:hear_objection'
  // Documents & Records
  | 'documents:view'
  | 'documents:upload'
  | 'documents:delete'
  // Analytics & Oversight
  | 'analytics:view_all'
  | 'analytics:view_state'
  | 'analytics:view_district';

/**
 * Statutory RBAC Permissions Matrix
 * Defined as per the official LandSync statutory role specifications.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // 1. Requiring Body (e.g. NHAI, RVNL, Metro Rail)
  REQUIRING_BODY: [
    'cases:view',
    'cases:create',
    'proposal:submit',
    'documents:view',
    'documents:upload',
    'analytics:view_district'
  ],

  // 2. District Collector / District Magistrate (Apex District Statutory Authority)
  COLLECTOR: [
    'cases:view',
    'cases:edit',
    'proposal:sia_assign',
    'workflow:issue_sec11',
    'workflow:conduct_survey',
    'workflow:approve_award',
    'workflow:hear_objection',
    'documents:view',
    'documents:upload',
    'documents:delete',
    'analytics:view_district',
    'analytics:view_state'
  ],

  // 3. State Approver (Principal Secretary / Revenue Department)
  STATE_APPROVER: [
    'cases:view',
    'proposal:state_review',
    'documents:view',
    'analytics:view_all',
    'analytics:view_state'
  ],

  // 4. SIA Expert (State Social Impact Assessment Directorate)
  SIA_EXPERT: [
    'cases:view',
    'workflow:conduct_sia',
    'workflow:submit_sia_report',
    'documents:view',
    'documents:upload'
  ],

  // 5. Rehabilitation & Resettlement Administrator (Commissioner R&R)
  RR_ADMIN: [
    'cases:view',
    'workflow:manage_rr',
    'workflow:approve_award',
    'documents:view',
    'documents:upload',
    'analytics:view_district'
  ],

  // 6. Patwari / Lekhpal (Village Revenue Officer)
  PATWARI_LEKHPAL: [
    'cases:view',
    'workflow:conduct_survey',
    'documents:view',
    'documents:upload'
  ],

  // 7. Tehsildar (Quasi-Judicial Revenue Authority)
  TEHSILDAR: [
    'cases:view',
    'workflow:conduct_survey',
    'documents:view',
    'documents:upload'
  ],

  // Backward compatibility alias for Field Officer
  FIELD_OFFICER: [
    'cases:view',
    'workflow:conduct_survey',
    'documents:view',
    'documents:upload'
  ],

  // 8. Policy Viewer (Observer / Auditor / Parliamentarian)
  POLICY_VIEWER: [
    'cases:view',
    'documents:view',
    'analytics:view_all'
  ],

  // 9. LARR Authority (Chapter VIII - Compensation Disputes)
  LARR_AUTHORITY: [
    'cases:view',
    'documents:view'
  ],

  // 10. Independent SIA Expert Group (National SIA Evaluation)
  INDEPENDENT_SIA_EXPERT: [
    'cases:view',
    'workflow:conduct_sia',
    'workflow:submit_sia_report',
    'documents:view',
    'analytics:view_all'
  ],

  // 11. National R&R Monitoring Committee (Section 50 RFCTLARR - Strictly Read-only Oversight)
  RR_MONITORING_COMMITTEE: [
    'cases:view',
    'documents:view',
    'analytics:view_all'
  ]
};

/**
 * Dedicated dashboard route for each role.
 * User is automatically routed here upon authentication and cannot access others.
 */
export const ROLE_DASHBOARD_ROUTES: Record<Role, string> = {
  REQUIRING_BODY: '/requiring-body',
  COLLECTOR: '/collector',
  STATE_APPROVER: '/state-approver',
  SIA_EXPERT: '/sia-expert',
  RR_ADMIN: '/rr-admin',
  PATWARI_LEKHPAL: '/field-officer',
  TEHSILDAR: '/tehsildar',
  FIELD_OFFICER: '/field-officer',
  POLICY_VIEWER: '/analytics',
  LARR_AUTHORITY: '/authority',
  INDEPENDENT_SIA_EXPERT: '/authority',
  RR_MONITORING_COMMITTEE: '/authority'
};

/**
 * Route protection RBAC mapping
 * Strict access control: only the assigned role can view their specific dashboard.
 */
export const ROUTE_ACCESS_RULES: Record<string, Role[]> = {
  '/requiring-body': ['REQUIRING_BODY'],
  '/collector': ['COLLECTOR'],
  '/state-approver': ['STATE_APPROVER'],
  '/sia-expert': ['SIA_EXPERT'],
  '/rr-admin': ['RR_ADMIN'],
  '/field-officer': ['PATWARI_LEKHPAL', 'FIELD_OFFICER'],
  '/tehsildar': ['TEHSILDAR'],
  '/cases/new': ['REQUIRING_BODY'],
  '/authority': ['LARR_AUTHORITY', 'INDEPENDENT_SIA_EXPERT', 'RR_MONITORING_COMMITTEE']
};

/**
 * Check whether a user has a specific statutory permission.
 */
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user || !user.role) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Check whether a user has a specific role.
 */
export function hasRole(user: User | null | undefined, role: Role): boolean {
  return !!user && user.role === role;
}

/**
 * Check whether a user has any of the specified roles.
 */
export function hasAnyRole(user: User | null | undefined, allowedRoles: Role[]): boolean {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Check whether a user has statutory clearance for a given path.
 */
export function isRouteAllowed(user: User | null | undefined, path: string): boolean {
  if (!user) return false;
  const allowed = ROUTE_ACCESS_RULES[path];
  if (!allowed) return true; // Unrestricted authenticated route
  return allowed.includes(user.role);
}

/**
 * Get display title and metadata for an official role.
 */
export function getRoleMetadata(role: Role) {
  return roleConfigs[role] || {
    role,
    displayName: role,
    hindiName: role,
    dashboardPath: '/dashboard',
    description: '',
    canMutate: false
  };
}
