import React from 'react';
import type { User, Role } from '../types/user';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Home } from 'lucide-react';
import { getRoleMetadata, ROLE_DASHBOARD_ROUTES } from '../utils/rbac';

interface ProtectedRouteProps {
  currentUser: User | null;
  allowedRoles?: Role[];
  children: React.ReactNode;
}

export function ProtectedRoute({
  currentUser,
  allowedRoles,
  children
}: ProtectedRouteProps) {
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const userRoleMeta = getRoleMetadata(currentUser.role);
    const dashboardPath = ROLE_DASHBOARD_ROUTES[currentUser.role] || '/dashboard';

    return (
      <div
        style={{
          maxWidth: '620px',
          margin: 'var(--spacing-12, 48px) auto',
          padding: 'var(--spacing-8, 32px)',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-4, 16px)'
          }}
        >
          <ShieldAlert size={34} />
        </div>

        <span
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            marginBottom: 'var(--spacing-3, 12px)'
          }}
        >
          HTTP 403 · Access Restricted
        </span>

        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: 'var(--spacing-2, 8px)'
          }}
        >
          Statutory Access Boundary
        </h2>

        <p
          style={{
            fontSize: '0.92rem',
            color: '#475569',
            lineHeight: 1.55,
            marginBottom: 'var(--spacing-4, 16px)'
          }}
        >
          Your authenticated session as <strong>{currentUser.name}</strong> (
          <span style={{ color: '#0B192C', fontWeight: 600 }}>{userRoleMeta.displayName}</span>
          ) does not possess administrative jurisdiction for this module under the statutory RBAC
          framework of the RFCTLARR Act 2013 &amp; GIGW 3.0 guidelines.
        </p>

        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '0.82rem',
            color: '#64748B',
            marginBottom: 'var(--spacing-6, 24px)',
            textAlign: 'left'
          }}
        >
          <div><strong>Authenticated Role:</strong> {userRoleMeta.displayName}</div>
          <div><strong>Department:</strong> {currentUser.department}</div>
          <div><strong>Authorized Dashboard:</strong> <code>{dashboardPath}</code></div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(dashboardPath)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#0B192C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Home size={16} />
            <span>Return to My Dashboard</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'transparent',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
