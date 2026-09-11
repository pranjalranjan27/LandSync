import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Role } from '../../types/user';
import { loginUser } from './authApi';
import { IndianFlagIcon } from './IndianFlagIcon';
import { useTranslation } from '../../locales';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  ChevronDown,
  Check
} from 'lucide-react';
import './login.css';

interface LoginPageProps {
  onLogin: (role: Role) => void;
}

export function LoginPage({ onLogin: _onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const { t, language, setLanguage, languages, activeLanguage } = useTranslation();

  // Form input states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & Error states
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Language selector state
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(e.target as Node)
      ) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    if (identifierError) setIdentifierError(null);
    if (authError) setAuthError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError(null);
    if (authError) setAuthError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!identifier.trim()) {
      setIdentifierError(t('auth.errorIdentifierRequired'));
      isValid = false;
    } else {
      setIdentifierError(null);
    }

    if (!password) {
      setPasswordError(t('auth.errorPasswordRequired'));
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setAuthError(null);

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser({
        identifier,
        password,
        rememberMe
      });

      if (result.success && result.user) {
        navigate('/auth/otp', {
          state: {
            user: result.user,
            identifier: identifier.trim()
          }
        });
      } else {
        setAuthError(result.error || t('auth.errorInvalidCredentials'));
      }
    } catch {
      setAuthError(t('auth.errorInvalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (type: 'valid' | 'invalid') => {
    setAuthError(null);
    setIdentifierError(null);
    setPasswordError(null);

    if (type === 'valid') {
      setIdentifier('collector.pauri@uk.gov.in');
      setPassword('Admin@123');
    } else {
      setIdentifier('unknown.user@example.com');
      setPassword('wrong');
    }
  };

  return (
    <div className="login-page-root">
      {/* ==========================================================================
          LEFT PANEL (approx. 35% width, fixed, dark navy #1B3F75)
          ========================================================================== */}
      <section className="login-left-panel" aria-label="LandSync National Portal Information">
        <div className="login-left-content">
          {/* Ashoka Emblem icon */}
          <div className="login-emblem-wrapper">
            <img
              src="/assets/Ashoka emblem.png"
              alt={t('common.emblemAlt')}
              className="login-emblem-img"
            />
          </div>

          {/* "LandSync" as largest heading on the panel */}
          <h1 className="login-brand-heading">LandSync</h1>

          {/* Subtitle */}
          <p className="login-brand-subtitle">
            {t('common.appSubtitle')}
          </p>

          {/* Thin horizontal divider in kesari/orange #E65A00 */}
          <hr className="login-kesari-divider" aria-hidden="true" />

          {/* Hindi/Regional translation */}
          <p className="login-hindi-tagline">
            {t('common.hindiTagline')}
          </p>
        </div>

        {/* Bottom of panel: simple line-art silhouette illustration of India Gate */}
        <div className="login-india-gate-container">
          <img
            src="/assets/login page image.png"
            alt="India Gate Silhouette"
            className="login-india-gate-img"
          />
        </div>

        {/* Very bottom: small Indian flag icon + tagline */}
        <div className="login-left-bottom-bar">
          <IndianFlagIcon width={22} height={15} />
          <span className="login-left-bottom-text">
            {t('common.digitalIndiaTagline')}
          </span>
        </div>
      </section>

      {/* ==========================================================================
          RIGHT PANEL (remaining width, white/card-background)
          ========================================================================== */}
      <main className="login-right-panel" id="login-main-content">
        {/* Top-right corner: language selector dropdown */}
        <div className="login-top-bar">
          <div className="lang-selector-wrapper" ref={langDropdownRef}>
            <button
              type="button"
              className="lang-selector-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={langDropdownOpen}
              aria-label={t('auth.selectLanguage')}
            >
              <span>{activeLanguage.name}</span>
              <ChevronDown
                size={16}
                style={{
                  transform: langDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            {langDropdownOpen && (
              <ul className="lang-dropdown-menu" role="listbox">
                {languages.map((lang) => (
                  <li key={lang.code}>
                    <button
                      type="button"
                      className={`lang-dropdown-item ${language === lang.code ? 'active' : ''}`}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={language === lang.code}
                    >
                      <span>
                        {lang.name} {lang.nativeName !== lang.name && `(${lang.nativeName})`}
                      </span>
                      {language === lang.code && (
                        <Check size={14} color="var(--color-primary-navy)" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Form Card */}
        <div className="login-form-wrapper">
          <h2 className="login-form-title">{t('auth.loginTitle')}</h2>
          <p className="login-form-subtitle">{t('auth.loginSubtitle')}</p>

          {/* Inline Error Banner */}
          {authError && (
            <div className="login-error-banner" role="alert" aria-live="assertive">
              <div className="login-error-banner-icon">
                <AlertCircle size={20} />
              </div>
              <div className="login-error-banner-content">
                <div className="login-error-banner-title">
                  {authError}
                </div>
              </div>
              <button
                type="button"
                className="login-error-banner-close"
                onClick={() => setAuthError(null)}
                aria-label="Dismiss error banner"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Field 1: Username / Email / Mobile */}
            <div className="login-field-group">
              <label htmlFor="login-identifier" className="login-field-label">
                {t('auth.identifierLabel')}
              </label>
              <div
                className={`login-input-container ${identifierError ? 'has-error' : ''}`}
              >
                <span className="login-input-leading-icon" aria-hidden="true">
                  <User size={18} />
                </span>
                <input
                  id="login-identifier"
                  type="text"
                  className="login-input-element"
                  placeholder={t('auth.identifierPlaceholder')}
                  value={identifier}
                  onChange={handleIdentifierChange}
                  autoComplete="username"
                  aria-invalid={!!identifierError}
                  aria-describedby={identifierError ? 'identifier-error' : undefined}
                />
              </div>
              {identifierError && (
                <div id="identifier-error" className="login-inline-error">
                  {identifierError}
                </div>
              )}
            </div>

            {/* Field 2: Password */}
            <div className="login-field-group">
              <label htmlFor="login-password" className="login-field-label">
                {t('auth.passwordLabel')}
              </label>
              <div
                className={`login-input-container ${passwordError ? 'has-error' : ''}`}
              >
                <span className="login-input-leading-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input-element"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="login-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && (
                <div id="password-error" className="login-inline-error">
                  {passwordError}
                </div>
              )}
            </div>

            {/* Right-aligned "Forgot Password?" link */}
            <div className="login-forgot-row">
              <Link to="/forgot-password" className="login-forgot-link">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {/* "Remember me" checkbox */}
            <label className="login-remember-row">
              <input
                type="checkbox"
                className="login-checkbox-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="login-remember-label">{t('auth.rememberMe')}</span>
            </label>

            {/* Primary full-width button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  <span>{t('auth.loggingIn')}</span>
                </>
              ) : (
                <span>{t('auth.loginButton')}</span>
              )}
            </button>

            {/* Centered below: "New user? Register here" */}
            <div className="login-register-row">
              <span>{t('auth.newUserPrompt')}</span>
              <Link to="/register" className="login-register-link">
                {t('auth.registerHere')}
              </Link>
            </div>

            {/* Quick Demo Test Helper for review */}
            <div className="login-demo-helper">
              <span>{t('auth.quickTestLabel')}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="login-demo-btn"
                  onClick={() => handleFillDemo('valid')}
                  title="Fill working District Collector credentials"
                >
                  {t('auth.quickTestCollector')}
                </button>
                <button
                  type="button"
                  className="login-demo-btn"
                  onClick={() => handleFillDemo('invalid')}
                  title="Fill credentials that trigger error banner"
                >
                  Fill Invalid
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Small centered footer text below the card */}
        <footer className="login-right-footer">
          {t('common.officialSystemNotice')}
        </footer>
      </main>
    </div>
  );
}
