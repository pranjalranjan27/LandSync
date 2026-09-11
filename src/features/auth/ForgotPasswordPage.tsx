import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianFlagIcon } from './IndianFlagIcon';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../locales';
import './login.css';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('auth.errorIdentifierRequired'));
      return;
    }
    setError(null);
    setIsSubmitted(true);
  };

  return (
    <div className="login-page-root">
      {/* LEFT PANEL */}
      <div className="login-left-panel">
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

          <hr className="login-kesari-divider" />

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
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right-panel">
        <div className="login-top-bar">
          <button
            type="button"
            className="lang-selector-btn"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft size={16} />
            {t('auth.backToLogin')}
          </button>
        </div>

        <div className="login-form-wrapper">
          <h2 className="login-form-title">{t('auth.forgotPasswordTitle')}</h2>
          <p className="login-form-subtitle">
            {t('auth.forgotPasswordSubtitle')}
          </p>

          {isSubmitted ? (
            <div style={{ padding: '24px', background: 'var(--color-primary-navy-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-slate)', textAlign: 'center' }}>
              <CheckCircle2 size={42} style={{ color: 'var(--color-accent-green)', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--color-primary-navy)', marginBottom: '8px' }}>{t('auth.resetLinkSentTitle')}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                {t('auth.resetLinkSentDesc')}
              </p>
              <button
                type="button"
                className="login-submit-btn"
                onClick={() => navigate('/login')}
              >
                {t('auth.returnToSignIn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="login-error-banner">
                  <div className="login-error-banner-content">
                    <div className="login-error-banner-title">{error}</div>
                  </div>
                </div>
              )}

              <div className="login-field-group">
                <label className="login-field-label">{t('auth.recoveryInputLabel')}</label>
                <div className={`login-input-container ${error ? 'has-error' : ''}`}>
                  <span className="login-input-leading-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    type="text"
                    className="login-input-element"
                    placeholder={t('auth.recoveryPlaceholder')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              </div>

              <button type="submit" className="login-submit-btn" style={{ marginTop: '12px' }}>
                {t('auth.sendResetLink')}
              </button>
            </form>
          )}

          <div className="login-register-row">
            <span>{t('auth.rememberedPassword')} </span>
            <span
              className="login-register-link"
              onClick={() => navigate('/login')}
              style={{ cursor: 'pointer' }}
            >
              {t('auth.signInHere')}
            </span>
          </div>
        </div>

        <footer className="login-right-footer">
          {t('common.officialSystemNotice')}
        </footer>
      </div>
    </div>
  );
};
