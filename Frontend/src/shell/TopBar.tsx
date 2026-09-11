import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types/user';
import { roleConfigs } from '../mock-data/users';
import {
  Menu,
  Search,
  MapPin,
  ChevronDown,
  Globe,
  LogOut,
  Check,
  User as UserIcon,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../locales';
import { useAuth } from '../hooks/useAuth';
import './TopBar.css';

interface TopBarProps {
  currentUser: User;
  onToggleMobileNav?: () => void;
}

const ROLE_LOCALE_MAP: Record<string, string> = {
  COLLECTOR: 'common.roles.collector',
  REQUIRING_BODY: 'common.roles.requiringBody',
  STATE_APPROVER: 'common.roles.stateApprover',
  SIA_EXPERT: 'common.roles.siaExpert',
  RR_ADMIN: 'common.roles.rrAdmin',
  FIELD_OFFICER: 'common.roles.fieldOfficer'
};

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  onToggleMobileNav
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, language, setLanguage, languages } = useTranslation();
  const { logout } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Derive initials (e.g., "PS" for "Priya Singh")
  const getInitials = (name: string) => {
    const parts = name.replace(/,.*$/, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'PS';
  };

  const displayName = currentUser.name.replace(/,.*$/, '');
  const userRoleMeta = roleConfigs[currentUser.role];
  const roleTranslationKey = ROLE_LOCALE_MAP[currentUser.role];
  const roleDisplay = roleTranslationKey ? t(roleTranslationKey, userRoleMeta?.displayName) : (userRoleMeta?.displayName || currentUser.designation);

  const handleSignOut = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="app-topbar-header">
      {/* Left: Mobile Drawer Trigger + Search Input */}
      <div className="topbar-left-group">
        {onToggleMobileNav && (
          <button
            type="button"
            className="topbar-hamburger-btn"
            onClick={onToggleMobileNav}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="topbar-search-wrap">
          <Search size={16} className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder={t('common.search', 'Search cases, ID, or location...')}
            aria-label="Search cases"
          />
        </div>
      </div>

      {/* Right: Location & Profile Area */}
      <div className="topbar-right-area" ref={dropdownRef}>
        {/* Location Info */}
        <div className="topbar-location-wrap" title={`${currentUser.district || 'Gautam Buddha Nagar'}, ${currentUser.state || 'Uttar Pradesh'}`}>
          <div className="topbar-location-icon">
            <MapPin size={18} />
          </div>
          <div className="topbar-location-text">
            <span className="topbar-location-name">{currentUser.district || 'Gautam Buddha Nagar'}</span>
            <span className="topbar-location-role">
              {roleDisplay}
            </span>
          </div>
        </div>

        <div className="topbar-divider" />

        {/* Profile Pill Trigger */}
        <button
          type="button"
          className="topbar-profile-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="topbar-avatar-circle">
            {getInitials(currentUser.name)}
          </div>
          <span className="topbar-user-name">{displayName}</span>
          <div className="topbar-profile-chevron">
            <ChevronDown size={14} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="topbar-dropdown-menu">
            {/* Authenticated User Banner */}
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: '4px'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                {currentUser.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  color: '#0B192C',
                  fontWeight: 600,
                  marginTop: '2px'
                }}
              >
                <Shield size={12} color="#0B192C" />
                <span>{roleDisplay}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                {currentUser.department}
              </div>
            </div>

            {/* Navigation links */}
            <button
              type="button"
              className="dropdown-action-item"
              onClick={() => {
                setDropdownOpen(false);
                navigate('/profile');
              }}
            >
              <UserIcon size={15} />
              <span>{t('common.nav.profile', 'My Profile & Settings')}</span>
            </button>

            <div className="dropdown-divider" />

            {/* Language Selection */}
            <div className="dropdown-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={12} />
              <span>{t('auth.selectLanguage', 'Select Language')}</span>
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className={`dropdown-role-item ${language === lang.code ? 'active' : ''}`}
                onClick={() => {
                  setLanguage(lang.code);
                  setDropdownOpen(false);
                }}
              >
                <span>{lang.name} ({lang.nativeName})</span>
                {language === lang.code && <Check size={14} color="#0B192C" />}
              </button>
            ))}

            <div className="dropdown-divider" />

            {/* Sign Out */}
            <button
              type="button"
              className="dropdown-action-item"
              onClick={handleSignOut}
              style={{ color: '#DC2626' }}
            >
              <LogOut size={15} />
              <span>{t('auth.returnToSignIn', 'Sign Out')}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
