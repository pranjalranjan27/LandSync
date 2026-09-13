import type { RouteObject } from 'react-router-dom';
import type { User, Role } from '../types/user';
import { ProtectedRoute } from './ProtectedRoute';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { OtpVerificationPage } from '../features/auth/OtpVerificationPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { CaseNew } from '../pages/Cases/CaseNew';
import { RequiringBodyDashboard } from '../features/requiring-body/RequiringBodyDashboard';
import { CollectorDashboard } from '../features/collector/CollectorDashboard';
import { StateApproverView } from '../pages/Dashboard/StateApproverView';
import { SiaExpertView } from '../pages/Dashboard/SiaExpertView';
import { RrAdminView } from '../pages/Dashboard/RrAdminView';
import { PatwariLekhpalView } from '../pages/Dashboard/PatwariLekhpalView';
import { TehsildarView } from '../pages/Dashboard/TehsildarView';
import { AnalyticsPage } from '../features/policy-viewer/AnalyticsPage';
import { LogObjectionForm } from '../features/objections/LogObjectionForm';
import { CaseQueuePage } from '../features/cases/CaseQueuePage';
import { CaseDetailPage } from '../case-detail/CaseDetailPage';
import { DesignSystemPage } from '../features/design-system/DesignSystemPage';
import { NotificationsPage } from '../pages/Notifications/NotificationsPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';
import { DocumentsPage } from '../pages/Documents/DocumentsPage';
import { AuthorityDashboardShell } from '../features/authority-dashboard/AuthorityDashboardShell';

export function getAppRoutes(
  currentUser: User | null,
  onLogin: (role: Role) => void
): RouteObject[] {
  return [
    {
      path: '/',
      element: <LandingPage />
    },
    {
      path: '/login',
      element: <LoginPage onLogin={onLogin} />
    },
    {
      path: '/auth/otp',
      element: <OtpVerificationPage onLogin={onLogin} />
    },
    {
      path: '/forgot-password',
      element: <ForgotPasswordPage />
    },
    {
      path: '/register',
      element: <RegisterPage />
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <Dashboard />
        </ProtectedRoute>
      )
    },
    {
      path: '/analytics',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <AnalyticsPage />
        </ProtectedRoute>
      )
    },
    {
      path: '/cases',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <CaseQueuePage />
        </ProtectedRoute>
      )
    },
    {
      path: '/cases/new',
      element: (
        <ProtectedRoute currentUser={currentUser} allowedRoles={['REQUIRING_BODY']}>
          <CaseNew />
        </ProtectedRoute>
      )
    },
    {
      path: '/cases/:id',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <CaseDetailPage />
        </ProtectedRoute>
      )
    },
    {
      path: '/requiring-body',
      element: (
        <ProtectedRoute currentUser={currentUser} allowedRoles={['REQUIRING_BODY']}>
          <RequiringBodyDashboard />
        </ProtectedRoute>
      )
    },
    {
      path: '/collector',
      element: (
        <ProtectedRoute currentUser={currentUser} allowedRoles={['COLLECTOR']}>
          <CollectorDashboard />
        </ProtectedRoute>
      )
    },
    {
      path: '/state-approver',
      element: (
        <ProtectedRoute currentUser={currentUser} allowedRoles={['STATE_APPROVER']}>
          <StateApproverView />
        </ProtectedRoute>
      )
    },
    {
      path: '/sia-expert',
      element: (
        <ProtectedRoute currentUser={currentUser} allowedRoles={['SIA_EXPERT']}>
          <SiaExpertView />
        </ProtectedRoute>
      )
    },
    {
      path: '/rr-admin',
      element: (
        <ProtectedRoute currentUser={currentUser} allowedRoles={['RR_ADMIN']}>
          <RrAdminView />
        </ProtectedRoute>
      )
    },
    {
      path: '/field-officer',
      element: (
        <ProtectedRoute currentUser={currentUser} allowedRoles={['PATWARI_LEKHPAL', 'FIELD_OFFICER']}>
          <PatwariLekhpalView />
        </ProtectedRoute>
      )
    },
    {
      path: '/tehsildar',
      element: (
        <ProtectedRoute currentUser={currentUser} allowedRoles={['TEHSILDAR']}>
          <TehsildarView />
        </ProtectedRoute>
      )
    },
    {
      path: '/authority',
      element: (
        <ProtectedRoute
          currentUser={currentUser}
          allowedRoles={['LARR_AUTHORITY', 'INDEPENDENT_SIA_EXPERT', 'RR_MONITORING_COMMITTEE']}
        >
          <AuthorityDashboardShell currentUser={currentUser} />
        </ProtectedRoute>
      )
    },
    {
      path: '/policy-viewer',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <AnalyticsPage />
        </ProtectedRoute>
      )
    },
    {
      path: '/objections/new',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <LogObjectionForm />
        </ProtectedRoute>
      )
    },
    {
      path: '/design-system',
      element: <DesignSystemPage />
    },
    {
      path: '/documents',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <DocumentsPage />
        </ProtectedRoute>
      )
    },
    {
      path: '/notifications',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <NotificationsPage />
        </ProtectedRoute>
      )
    },
    {
      path: '/profile',
      element: (
        <ProtectedRoute currentUser={currentUser}>
          <ProfilePage />
        </ProtectedRoute>
      )
    },
    {
      path: '*',
      element: <LandingPage />
    }
  ];
}
