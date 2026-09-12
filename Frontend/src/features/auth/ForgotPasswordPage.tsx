import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IndianFlagIcon } from './IndianFlagIcon';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useTranslation } from '../../locales';
import { resetPassword } from './authApi';
import './login.css';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('auth.errorIdentifierRequired', 'Please enter your registered email address.'));
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const result = await resetPassword(email.trim());
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error || 'Failed to send password reset email.');
      }
    } catch {
      setError('An error occurred while dispatching the reset email.');
    } finally {
      setIsLoading(false);
    }
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
      <main className="login-right-panel" id="forgot-password-content">
        <div className="login-top-bar">
          <button
            type="button"
            className="lang-selector-btn"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft size={16} />
            <span>{t('auth.backToLogin', 'Back to Login')}</span>
          </button>
        </div>

        <div className="login-form-wrapper">
          <h2 className="login-form-title">{t('auth.forgotPasswordTitle', 'Password Recovery')}</h2>
          <p className="login-form-subtitle">
            {t('auth.forgotPasswordSubtitle', 'Enter your registered email address to receive an official password reset link.')}
          </p>

          {isSubmitted ? (
            <div
              style={{
                padding: '28px 24px',
                background: 'var(--color-primary-navy-surface, #F8FAFC)',
                borderRadius: '12px',
                border: '1px solid var(--color-border-slate, #E2E8F0)',
                textAlign: 'center',
                marginTop: '16px'
              }}
            >
              <CheckCircle2 size={44} style={{ color: 'var(--color-accent-green, #16A34A)', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--color-primary-navy, #0B192C)', fontSize: '1.2rem', marginBottom: '8px', fontWeight: 700 }}>
                {t('auth.resetLinkSentTitle', 'Password Reset Email Sent')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #475569)', marginBottom: '24px', lineHeight: 1.5 }}>
                A password reset link has been dispatched to <strong>{email}</strong> via Firebase Authentication. Please check your inbox and spam folder.
              </p>
              <button
                type="button"
                className="login-submit-btn"
                onClick={() => navigate('/login')}
              >
                <span>{t('auth.returnToSignIn', 'Return to Login')}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form" noValidate>
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
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="login-field-group">
                <label className="login-field-label">{t('auth.recoveryInputLabel', 'Registered Email Address')}</label>
                <div className={`login-input-container ${error ? 'has-error' : ''}`}>
                  <span className="login-input-leading-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    className="login-input-element"
                    placeholder={t('auth.recoveryPlaceholder', 'e.g. collector.gbnagar@up.gov.in')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
                aria-busy={isLoading}
                style={{ marginTop: '12px' }}
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner" aria-hidden="true" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>{t('auth.sendResetLink', 'Send Password Reset Link')}</span>
                )}
              </button>
            </form>
          )}

          <div className="login-register-row">
            <span>{t('auth.rememberedPassword', 'Remember your password?')} </span>
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

export default ForgotPasswordPage;
