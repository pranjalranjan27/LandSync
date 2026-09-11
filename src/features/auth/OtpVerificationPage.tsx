import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Role, User } from '../../types/user';
import { roleConfigs, mockUsers } from '../../mock-data/users';
import { IndianFlagIcon } from './IndianFlagIcon';
import { ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useTranslation } from '../../locales';
import './login.css';

interface OtpVerificationPageProps {
  onLogin: (role: Role) => void;
}

export const OtpVerificationPage: React.FC<OtpVerificationPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Retrieve user or identifier passed from login state
  const state = location.state as { user?: User; identifier?: string } | null;
  const user = state?.user || mockUsers[0];
  const identifier = state?.identifier || user.email;

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input
    inputRefs.current[0]?.focus();

    // Timer countdown
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError(t('auth.otpInvalid'));
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      // Successful verification
      onLogin(user.role);
      const dest = roleConfigs[user.role]?.dashboardPath || '/collector';
      navigate(dest);
    }, 600);
  };

  const handleFillDemoOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
    setError(null);
  };

  // Masked identifier
  const maskedId = identifier.includes('@')
    ? identifier.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : identifier.replace(/(\d{2})(\d+)(\d{2})/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--color-primary-navy-surface)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary-navy)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
            <ShieldCheck size={18} />
            <span>{t('auth.mfaBadge')}</span>
          </div>

          <h2 className="login-form-title">{t('auth.otpTitle')}</h2>
          <p className="login-form-subtitle">
            {t('auth.otpSubtitle')} <strong>{maskedId}</strong>
          </p>

          {error && (
            <div className="login-error-banner" role="alert">
              <div className="login-error-banner-content">
                <div className="login-error-banner-title">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleVerify} className="login-form">
            <div className="login-field-group">
              <label className="login-field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={16} />
                <span>{t('auth.otpInputLabel')}</span>
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'space-between',
                  marginTop: '8px'
                }}
                onPaste={handlePaste}
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: '52px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      border: error ? '1px solid #EF4444' : '1px solid var(--color-border-slate)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--color-primary-navy)',
                      outline: 'none',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-accent-saffron)';
                      e.target.style.boxShadow = 'var(--shadow-focus)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = error ? '#EF4444' : 'var(--color-border-slate)';
                      e.target.style.boxShadow = 'var(--shadow-sm)';
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleFillDemoOtp}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent-kesari)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Auto-fill Demo OTP (123456)
              </button>

              <span style={{ color: 'var(--color-text-secondary)' }}>
                {resendTimer > 0 ? (
                  `${t('auth.resendIn')} ${resendTimer}s`
                ) : (
                  <button
                    type="button"
                    onClick={() => setResendTimer(30)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary-navy)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={12} /> {t('auth.resendOtp')}
                  </button>
                )}
              </span>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isVerifying}
              style={{ marginTop: '16px' }}
            >
              {isVerifying ? (
                <>
                  <span className="login-spinner" />
                  <span>{t('auth.verifying')}</span>
                </>
              ) : (
                <span>{t('auth.verifyOtpButton')}</span>
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '12px 16px', background: 'var(--color-surface-offwhite)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            <strong>Official Notice:</strong> Pursuant to National Cybersecurity Guidelines for e-Governance applications, two-factor authentication is mandatory for all access to statutory land acquisition proceedings.
          </div>
        </div>

        <footer className="login-right-footer">
          {t('common.officialSystemNotice')}
        </footer>
      </div>
    </div>
  );
};
