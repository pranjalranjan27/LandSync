import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RequiringBodyView } from './RequiringBodyView';
import { CollectorView } from './CollectorView';
import { StateApproverView } from './StateApproverView';
import { SiaExpertView } from './SiaExpertView';
import { RrAdminView } from './RrAdminView';
import { FieldOfficerView } from './FieldOfficerView';

/**
 * Dashboard Shell: Reads the current user's role from session,
 * and renders exactly one of the six role-based view components.
 * For policy_viewer, redirects immediately to /analytics.
 */
export const Dashboard: React.FC = () => {
  const { role } = useAuth();

  // Normalize role string to handle uppercase or lowercase session storage values
  const normalizedRole = role ? role.toUpperCase() : 'COLLECTOR';

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

    case 'FIELD_OFFICER':
      return <FieldOfficerView />;

    case 'CITIZEN':
      // Citizen tracks cases directly
      return <Navigate to="/cases" replace />;

    case 'LARR_AUTHORITY':
    case 'INDEPENDENT_SIA_EXPERT':
    case 'RR_MONITORING_COMMITTEE':
      return <Navigate to="/authority" replace />;

    default:
      return <CollectorView />;
  }
};

export default Dashboard;
