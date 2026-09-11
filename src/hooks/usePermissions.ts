import { useAuth } from './useAuth';
import type { Role } from '../types/user';
import type { CaseStage } from '../types/case';
import { isReadOnlyRole, canPerformCaseAction } from '../lib/permissions';
import { roleConfigs } from '../mock-data/users';

export interface UsePermissionsReturn {
  role: Role;
  isReadOnly: boolean;
  canMutate: boolean;
  canPerformAction: (stage: CaseStage) => boolean;
  hasRole: (...roles: Role[]) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { role } = useAuth();
  const normalized = (role || '').toUpperCase() as Role;
  const isPolicyViewer = normalized === 'POLICY_VIEWER';

  return {
    role,
    isReadOnly: isPolicyViewer || isReadOnlyRole(normalized),
    canMutate: isPolicyViewer ? false : (roleConfigs[normalized]?.canMutate ?? false),
    canPerformAction: (stage: CaseStage) => isPolicyViewer ? false : canPerformCaseAction(normalized, stage),
    hasRole: (...roles: Role[]) => roles.includes(normalized)
  };
}
