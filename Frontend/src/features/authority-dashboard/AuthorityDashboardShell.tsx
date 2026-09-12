import React from 'react';
import type { User, Role } from '../../types/user';
import { useAuth } from '../../hooks/useAuth';
import { LarrAuthorityQueue } from './LarrAuthorityQueue';
import { SiaExpertQueue } from './SiaExpertQueue';
import { RrCommitteeOverview } from './RrCommitteeOverview';
import { Scale, FileSearch, Landmark, Shield } from 'lucide-react';
import './AuthorityDashboard.css';

interface AuthorityDashboardShellProps {
  currentUser?: User | null;
}

export const AuthorityDashboardShell: React.FC<AuthorityDashboardShellProps> = ({ currentUser }) => {
  const { user } = useAuth();
  const activeUser = currentUser || user;
  const role = (activeUser?.role || 'LARR_AUTHORITY') as Role;

  const getRoleHeader = () => {
    switch (role) {
      case 'LARR_AUTHORITY':
        return {
          title: 'Land Acquisition, Rehabilitation & Resettlement Authority',
          subtitle: 'Presiding Officer Quasi-Judicial Docket • Adjudication of compensation and entitlement disputes under RFCTLARR Act 2013, Chapter VIII (Sections 51–74).',
          badgeText: 'Chapter VIII Authority • Referral Jurisdiction',
          icon: <Scale size={28} style={{ color: '#FCD34D' }} />
        };
      case 'INDEPENDENT_SIA_EXPERT':
        return {
          title: 'Independent SIA Expert Group Portal',
          subtitle: 'Multi-disciplinary evaluation & appraisal of Social Impact Assessments under RFCTLARR Act 2013, Section 7. Public hearing reviews and statutory recommendations.',
          badgeText: 'Section 7 Expert Group • Pan-India Scope',
          icon: <FileSearch size={28} style={{ color: '#60A5FA' }} />
        };
      case 'RR_MONITORING_COMMITTEE':
      default:
        return {
          title: 'National R&R Monitoring Committee',
          subtitle: 'Apex Committee for oversight of Rehabilitation & Resettlement implementation under RFCTLARR Act 2013, Section 50. Multi-state audit and compliance monitoring.',
          badgeText: 'Section 50 National Committee • Read-Only Oversight',
          icon: <Landmark size={28} style={{ color: '#C084FC' }} />
        };
    }
  };

  const headerInfo = getRoleHeader();

  return (
    <div className="authority-shell-container">
      {/* National Portal Masthead Banner */}
      <div className="authority-banner">
        <div className="authority-banner-left">
          <div className="authority-emblem-wrap">
            <img
              src="/assets/Ashoka emblem.png"
              alt="State Emblem of India"
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', fontWeight: 600 }}>
                Government of India • Ministry of Rural Development &amp; Land Resources
              </span>
            </div>
            <h1 className="authority-header-title">{headerInfo.title}</h1>
            <p className="authority-header-sub">{headerInfo.subtitle}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div className="authority-badge-national">
            <Shield size={14} />
            {headerInfo.badgeText}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>
            Officer: <strong>{activeUser?.name || 'Authorized Presiding Officer'}</strong>
          </div>
        </div>
      </div>

      {/* Role View Routing */}
      {role === 'LARR_AUTHORITY' && <LarrAuthorityQueue />}
      {role === 'INDEPENDENT_SIA_EXPERT' && <SiaExpertQueue />}
      {role === 'RR_MONITORING_COMMITTEE' && <RrCommitteeOverview />}
      {role !== 'LARR_AUTHORITY' && role !== 'INDEPENDENT_SIA_EXPERT' && role !== 'RR_MONITORING_COMMITTEE' && (
        <RrCommitteeOverview />
      )}
    </div>
  );
};

export default AuthorityDashboardShell;
