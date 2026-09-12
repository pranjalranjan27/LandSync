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
  canViewRiskAssessment: boolean;
  canSignAction: (actionType: 'notification_published' | 'award_declared' | 'rejected') => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { role } = useAuth();
  const normalized = (role || 'COLLECTOR').toUpperCase() as Role;
  const isPolicyViewer = normalized === 'POLICY_VIEWER';

  return {
    role: normalized,
    isReadOnly: isPolicyViewer || isReadOnlyRole(normalized),
    canMutate: isPolicyViewer ? false : (roleConfigs[normalized]?.canMutate ?? false),
    canPerformAction: (stage: CaseStage) => isPolicyViewer ? false : canPerformCaseAction(normalized, stage),
    hasRole: (...roles: Role[]) => roles.includes(normalized),
    canViewRiskAssessment: ['COLLECTOR', 'STATE_APPROVER', 'POLICY_VIEWER'].includes(normalized),
    canSignAction: (actionType: 'notification_published' | 'award_declared' | 'rejected') => {
      if (isPolicyViewer || isReadOnlyRole(normalized)) return false;
      if (actionType === 'notification_published') {
        return normalized === 'COLLECTOR' || normalized === 'STATE_APPROVER';
      }
      if (actionType === 'award_declared') {
        return normalized === 'COLLECTOR' || normalized === 'STATE_APPROVER';
      }
      if (actionType === 'rejected') {
        return normalized === 'COLLECTOR' || normalized === 'STATE_APPROVER';
      }
      return false;
    }
  };
}
