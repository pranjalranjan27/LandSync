import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianFlagIcon } from './IndianFlagIcon';
import { ArrowLeft, User, Mail, Building, Phone, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../locales';
import './login.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    role: 'COLLECTOR'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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

        <div className="login-form-wrapper" style={{ maxWidth: '520px' }}>
          <h2 className="login-form-title">{t('auth.registerTitle')}</h2>
          <p className="login-form-subtitle">
            {t('auth.registerSubtitle')}
          </p>

          {submitted ? (
            <div style={{ padding: '24px', background: 'var(--color-primary-navy-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-slate)', textAlign: 'center' }}>
              <CheckCircle2 size={42} style={{ color: 'var(--color-accent-green)', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--color-primary-navy)', marginBottom: '8px' }}>{t('auth.registrationSuccessTitle')}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                {t('auth.registrationSuccessDesc')}
              </p>
              <button
                type="button"
                className="login-submit-btn"
                onClick={() => navigate('/login')}
              >
                {t('auth.returnToLogin')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field-group">
                <label className="login-field-label">{t('auth.fullNameLabel')}</label>
                <div className="login-input-container">
                  <span className="login-input-leading-icon">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    className="login-input-element"
                    placeholder={t('auth.fullNamePlaceholder')}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label className="login-field-label">{t('auth.emailLabel')}</label>
                <div className="login-input-container">
                  <span className="login-input-leading-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    className="login-input-element"
                    placeholder={t('auth.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label className="login-field-label">{t('auth.phoneLabel')}</label>
                <div className="login-input-container">
                  <span className="login-input-leading-icon">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    required
                    className="login-input-element"
                    placeholder={t('auth.phonePlaceholder')}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label className="login-field-label">{t('auth.departmentLabel')}</label>
                <div className="login-input-container">
                  <span className="login-input-leading-icon">
                    <Building size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    className="login-input-element"
                    placeholder={t('auth.departmentPlaceholder')}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="login-submit-btn" style={{ marginTop: '12px' }}>
                {t('auth.submitRegistration')}
              </button>
            </form>
          )}

          <div className="login-register-row">
            <span>{t('auth.alreadyRegistered')} </span>
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
