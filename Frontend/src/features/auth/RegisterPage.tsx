import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IndianFlagIcon } from './IndianFlagIcon';
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Shield,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { useTranslation } from '../../locales';
import { registerUser } from './authApi';
import type { Role } from '../../types/user';
import { roleConfigs } from '../../mock-data/users';
import './login.css';

const AVAILABLE_ROLES: { role: Role; label: string; description: string }[] = [
  { role: 'COLLECTOR', label: 'District Collector / DM', description: 'Statutory authority under Section 11 & 19 for land notifications and awards' },
  { role: 'REQUIRING_BODY', label: 'Requiring Body (NHAI, RVNL, Metro, etc.)', description: 'Submits land proposals, project justifications, and funding commitments' },
  { role: 'STATE_APPROVER', label: 'State Approver (Principal Secretary)', description: 'State government sanction authority for SIA and high-value approvals' },
  { role: 'SIA_EXPERT', label: 'SIA Expert Committee', description: 'Conducts social impact hearings and submits expert assessment verdicts' },
  { role: 'RR_ADMIN', label: 'R&R Administrator / Commissioner', description: 'Formulates Rehabilitation & Resettlement schemes and tracks solatium' },
  { role: 'FIELD_OFFICER', label: 'Field Officer / Patwari / Kanungo', description: 'Performs on-ground cadastral surveys and ground-truthing' },
  { role: 'POLICY_VIEWER', label: 'Policy Viewer / Auditor', description: 'Read-only nation-wide analytics and audit compliance monitoring' },
  { role: 'CITIZEN', label: 'Citizen / Affected Landowner', description: 'Track ancestral land parcels and compensation status' }
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: 'Department of Revenue & Land Acquisition',
    role: 'COLLECTOR' as Role,
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!formData.password) {
      setError('Please enter a password.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        role: formData.role,
        district: formData.district.trim(),
        state: formData.state.trim()
      });

      if (result.success && result.user) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Failed to create departmental account.');
      }
    } catch (err: unknown) {
      setError('An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    const targetPath = roleConfigs[formData.role]?.dashboardPath || '/collector';
    navigate(targetPath);
  };

  return (
    <div className="login-page-root">
      {/* LEFT PANEL */}
      <section className="login-left-panel" aria-label="LandSync National Portal Information">
        <div className="login-left-content">
          <div className="login-emblem-wrapper">
            <img
              src="/assets/Ashoka emblem.png"
              alt={t('common.emblemAlt')}
              className="login-emblem-img"
            />
          </div>

          <h1 className="login-brand-heading">LandSync</h1>
          <p className="login-brand-subtitle">
            {t('common.appSubtitle')}
          </p>

          <hr className="login-kesari-divider" aria-hidden="true" />

          <p className="login-hindi-tagline">
            {t('common.hindiTagline')}
          </p>
        </div>

        <div className="login-india-gate-container">
          <img
            src="/assets/login page image.png"
            alt="India Gate Silhouette"
            className="login-india-gate-img"
          />
        </div>

        <div className="login-left-bottom-bar">
          <IndianFlagIcon width={22} height={15} />
          <span className="login-left-bottom-text">
            {t('common.digitalIndiaTagline')}
          </span>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <main className="login-right-panel" id="register-main-content">
        <div className="login-top-bar">
          <button
            type="button"
            className="lang-selector-btn"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft size={16} />
            <span>{t('auth.backToLogin')}</span>
          </button>
        </div>

        <div className="login-form-wrapper" style={{ maxWidth: '560px', paddingBottom: '32px' }}>
          <h2 className="login-form-title">{t('auth.registerTitle', 'Official Portal Registration')}</h2>
          <p className="login-form-subtitle">
            {t('auth.registerSubtitle', 'Create your authorized credentials for National Land Acquisition System')}
          </p>

          {/* Error Banner */}
          {error && (
            <div className="login-error-banner" role="alert" aria-live="assertive">
              <div className="login-error-banner-icon">
                <AlertCircle size={20} />
              </div>
              <div className="login-error-banner-content">
                <div className="login-error-banner-title">{error}</div>
              </div>
              <button
                type="button"
                className="login-error-banner-close"
                onClick={() => setError(null)}
                aria-label="Dismiss error banner"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {isSuccess ? (
            <div
              style={{
                padding: '32px 24px',
                background: 'var(--color-primary-navy-surface, #F8FAFC)',
                borderRadius: '12px',
                border: '1px solid var(--color-border-slate, #E2E8F0)',
                textAlign: 'center',
                marginTop: '16px'
              }}
            >
              <CheckCircle2 size={48} style={{ color: 'var(--color-accent-green, #16A34A)', margin: '0 auto 16px' }} />
              <h3 style={{ color: 'var(--color-primary-navy, #0B192C)', fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>
                {t('auth.registrationSuccessTitle', 'Account Registered Successfully!')}
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary, #475569)', marginBottom: '24px', lineHeight: 1.5 }}>
                Your authorized departmental profile has been created and verified in Firebase Authentication for <strong>{formData.email}</strong>.
              </p>
              <button
                type="button"
                className="login-submit-btn"
                onClick={handleGoToDashboard}
              >
                <span>Proceed to Authorized Dashboard</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Full Name */}
              <div className="login-field-group">
                <label className="login-field-label">{t('auth.fullNameLabel', 'Official Full Name')}</label>
                <div className="login-input-container">
                  <span className="login-input-leading-icon">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    className="login-input-element"
                    placeholder="e.g. Dr. Rajesh Kumar, IAS"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              {/* Official Email */}
              <div className="login-field-group">
                <label className="login-field-label">{t('auth.emailLabel', 'Official Email Address')}</label>
                <div className="login-input-container">
                  <span className="login-input-leading-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    className="login-input-element"
                    placeholder="e.g. collector.gbnagar@up.gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Password & Confirm Password in 2 cols */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="login-field-group">
                  <label className="login-field-label">{t('auth.passwordLabel', 'Password')}</label>
                  <div className="login-input-container">
                    <span className="login-input-leading-icon">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="login-input-element"
                      placeholder="Min 6 chars"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="login-password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="login-field-group">
                  <label className="login-field-label">Confirm Password</label>
                  <div className="login-input-container">
                    <span className="login-input-leading-icon">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="login-input-element"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      className="login-password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Designation */}
              <div className="login-field-group">
                <label className="login-field-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={16} />
                    <span>Designated Role / Jurisdiction</span>
                  </span>
                </label>
                <div className="login-input-container" style={{ padding: '0 8px' }}>
                  <select
                    className="login-input-element"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    style={{ cursor: 'pointer', background: 'transparent', border: 'none', outline: 'none' }}
                  >
                    {AVAILABLE_ROLES.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                  {AVAILABLE_ROLES.find((r) => r.role === formData.role)?.description}
                </div>
              </div>

              {/* Department */}
              <div className="login-field-group">
                <label className="login-field-label">{t('auth.departmentLabel', 'Department / Agency')}</label>
                <div className="login-input-container">
                  <span className="login-input-leading-icon">
                    <Building size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    className="login-input-element"
                    placeholder="e.g. Department of Revenue & Land Acquisition"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              {/* State & District in 2 cols */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="login-field-group">
                  <label className="login-field-label">State</label>
                  <div className="login-input-container">
                    <span className="login-input-leading-icon">
                      <MapPin size={18} />
                    </span>
                    <input
                      type="text"
                      className="login-input-element"
                      placeholder="e.g. Uttar Pradesh"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="login-field-group">
                  <label className="login-field-label">District</label>
                  <div className="login-input-container">
                    <span className="login-input-leading-icon">
                      <MapPin size={18} />
                    </span>
                    <input
                      type="text"
                      className="login-input-element"
                      placeholder="e.g. Gautam Buddha Nagar"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="login-field-group">
                <label className="login-field-label">{t('auth.phoneLabel', 'Official Contact Number (Optional)')}</label>
                <div className="login-input-container">
                  <span className="login-input-leading-icon">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    className="login-input-element"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
                aria-busy={isLoading}
                style={{ marginTop: '8px' }}
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner" aria-hidden="true" />
                    <span>Creating Official Account...</span>
                  </>
                ) : (
                  <span>{t('auth.submitRegistration', 'Register Account')}</span>
                )}
              </button>
            </form>
          )}

          <div className="login-register-row">
            <span>{t('auth.alreadyRegistered', 'Already registered?')} </span>
            <Link to="/login" className="login-register-link">
              {t('auth.signInHere', 'Sign In here')}
            </Link>
          </div>
        </div>

        <footer className="login-right-footer">
          {t('common.officialSystemNotice')}
        </footer>
      </main>
    </div>
  );
};

export default RegisterPage;
