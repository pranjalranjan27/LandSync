import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getSessionUser } from '../../hooks/useAuth';
import { RequiringBodyView } from './RequiringBodyView';
import { CollectorView } from './CollectorView';
import { StateApproverView } from './StateApproverView';
import { SiaExpertView } from './SiaExpertView';
import { RrAdminView } from './RrAdminView';
import { PatwariLekhpalView } from './PatwariLekhpalView';
import { TehsildarView } from './TehsildarView';

/**
 * Dashboard Shell: Reads the current user's role from session,
 * and renders exactly one of the statutory role-based view components.
 * For policy_viewer, redirects immediately to /analytics.
 */
export const Dashboard: React.FC = () => {
  const { role, user, isLoading } = useAuth();

  const sessionUser = getSessionUser();
  const effectiveRole = role || user?.role || sessionUser?.role;

  // Root cause fix: Do not prematurely fall back to CollectorView if Firebase auth is still resolving
  if (isLoading && !effectiveRole) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="login-spinner" style={{ width: '32px', height: '32px', borderTopColor: 'var(--color-primary-navy)' }} />
      </div>
    );
  }

  // Normalize role string to handle uppercase or lowercase session storage values
  const normalizedRole = effectiveRole ? effectiveRole.toUpperCase() : 'COLLECTOR';

  switch (normalizedRole) {
    case 'POLICY_VIEWER':
      // For policy_viewer, don't render anything here — redirect immediately to /analytics
      return <Navigate to="/analytics" replace />;

    case 'REQUIRING_BODY':
      return <RequiringBodyView />;

    case 'COLLECTOR':
      return <CollectorView />;

    case 'STATE_APPROVER':
      return <StateApproverView />;

    case 'SIA_EXPERT':
      return <SiaExpertView />;

    case 'RR_ADMIN':
      return <RrAdminView />;

    case 'PATWARI_LEKHPAL':
    case 'FIELD_OFFICER':
      return <PatwariLekhpalView />;

    case 'TEHSILDAR':
      return <TehsildarView />;

    case 'LARR_AUTHORITY':
    case 'INDEPENDENT_SIA_EXPERT':
    case 'RR_MONITORING_COMMITTEE':
      return <Navigate to="/authority" replace />;

    default:
      return <CollectorView />;
  }
};

export default Dashboard;
