/**
 * ProfilePage — /profile
 * My Profile with tabbed sections, role/jurisdiction sidebar, account security panel.
 */
import { useState } from 'react';
import {
  User, Phone, Building2, Settings, Shield, Clock,
  Edit2, Camera, Trash2, ChevronRight, Lock,
  Smartphone, MonitorDot, AlertTriangle, CheckCircle2,
  Save, X
} from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { roleConfigs } from '../../mock-data/users';
import './ProfilePage.css';

/* ─── Section tabs ─────────────────────────────── */
type ProfileSection =
  | 'personal'
  | 'contact'
  | 'official'
  | 'preferences'
  | 'security'
  | 'activity';

const SECTIONS: { key: ProfileSection; label: string; icon: React.ReactNode }[] = [
  { key: 'personal', label: 'Personal Information', icon: <User size={16} /> },
  { key: 'contact', label: 'Contact Details', icon: <Phone size={16} /> },
  { key: 'official', label: 'Official Details', icon: <Building2 size={16} /> },
  { key: 'preferences', label: 'Preferences', icon: <Settings size={16} /> },
  { key: 'security', label: 'Security', icon: <Shield size={16} /> },
  { key: 'activity', label: 'Activity Log', icon: <Clock size={16} /> },
];

/* ─── Mock activity log ─────────────────────────── */
const ACTIVITY_LOG = [
  { action: 'Approved case LA-2025-0214', time: '10 Sep 2026, 11:24 AM', ip: '103.27.12.45' },
  { action: 'Returned case LA-2025-0128 for clarification', time: '9 Sep 2026, 3:10 PM', ip: '103.27.12.45' },
  { action: 'Logged into system', time: '10 Sep 2026, 9:00 AM', ip: '103.27.12.45' },
  { action: 'Reviewed SIA report for case LA-2025-0187', time: '8 Sep 2026, 2:45 PM', ip: '103.27.12.45' },
  { action: 'Exported district case report (PDF)', time: '7 Sep 2026, 10:30 AM', ip: '103.27.12.45' },
  { action: 'Password changed', time: '1 Sep 2026, 5:00 PM', ip: '103.27.12.45' },
];

/* ─── Avatar helpers ─────────────────────────────── */
function getInitials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/* ─── Component ─────────────────────────────────── */
export function ProfilePage() {
  const { user } = useAuth();
  const roleConfig = roleConfigs[user.role];

  const [section, setSection] = useState<ProfileSection>('personal');
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

  /* Form state */
  const [fullName, setFullName] = useState(user.name.replace(/,.*/, '').trim());
  const [dob, setDob] = useState('14 Mar 1992');
  const [gender, setGender] = useState('Female');
  const [about, setAbout] = useState(
    'Committed to transparent, efficient and people-centric land acquisition and rehabilitation processes.'
  );
  const [phone, setPhone] = useState('+91-9876543210');
  const [altEmail, setAltEmail] = useState(user.email);
  const [officeAddr, setOfficeAddr] = useState(`Collectorate, ${user.district}`);

  function handleSave() {
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const initials = getInitials(user.name);

  return (
    <div className="page-container profile-page">
      {/* ── Page Header ── */}
      <div className="profile-page-header">
        <div>
          <h1 className="profile-page-title">My Profile</h1>
          <p className="profile-page-subtitle">
            View and manage your personal information, account settings and preferences.
          </p>
        </div>
        <Button
          variant={editMode ? 'secondary' : 'primary'}
          size="md"
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? <><X size={15} /> Cancel</> : <><Edit2 size={15} /> Edit Profile</>}
        </Button>
      </div>

      {/* ── Hero card ── */}
      <div className="profile-hero card">
        <div className="profile-hero-identity">
          {/* Avatar */}
          <div className="profile-avatar">
            <span className="profile-avatar-initials">{initials}</span>
            {editMode && (
              <button className="profile-avatar-overlay" title="Change photo" onClick={() => {}}>
                <Camera size={16} />
              </button>
            )}
          </div>

          {/* Name + role */}
          <div>
            <div className="profile-hero-name-row">
              <h2 className="profile-hero-name">{user.name.replace(/,.*/, '').trim()}</h2>
              <span className="profile-hero-status-badge">Active</span>
            </div>
            <div className="profile-hero-designation">{user.designation}</div>
            <div className="profile-hero-location">{user.district}, {user.state}</div>
          </div>
        </div>

        {/* Quote / tagline */}
        <blockquote className="profile-hero-quote">
          "Land governance for a more<br />equitable and developed India."
        </blockquote>
      </div>

      {saved && (
        <div className="profile-save-banner">
          <CheckCircle2 size={16} /> Profile updated successfully.
        </div>
      )}

      {/* ── Three-col content ── */}
      <div className="profile-layout">
        {/* Left nav */}
        <nav className="profile-sidenav card" aria-label="Profile sections">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              className={`profile-sidenav-item${section === s.key ? ' active' : ''}`}
              onClick={() => setSection(s.key)}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Main content */}
        <div className="card profile-main">
          {/* ── Personal Information ── */}
          {section === 'personal' && (
            <Section title="Personal Information" subtitle="Your basic personal details as per official records.">
              <div className="profile-form-grid">
                <Field label="Full Name">
                  {editMode
                    ? <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    : <ReadValue>{fullName}</ReadValue>}
                </Field>
                <Field label="Date of Birth">
                  {editMode
                    ? <input value={dob} onChange={(e) => setDob(e.target.value)} placeholder="DD Mon YYYY" />
                    : <ReadValue>{dob}</ReadValue>}
                </Field>
                <Field label="Gender">
                  {editMode
                    ? (
                      <select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Prefer not to say</option>
                      </select>
                    )
                    : <ReadValue>{gender}</ReadValue>}
                </Field>
                <Field label="Profile Picture">
                  <div className="profile-pic-control">
                    <div className="profile-pic-mini">{initials}</div>
                    {editMode && (
                      <div className="profile-pic-actions">
                        <button className="profile-pic-btn" onClick={() => {}}>
                          <Camera size={13} /> Change Photo
                        </button>
                        <button className="profile-pic-btn profile-pic-btn--danger" onClick={() => {}}>
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </Field>
              </div>

              <Field label="About" style={{ marginTop: 'var(--spacing-4)' }}>
                {editMode
                  ? <textarea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} />
                  : <ReadValue>{about}</ReadValue>}
              </Field>

              {editMode && (
                <div className="profile-form-footer">
                  <Button variant="secondary" size="md" onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button variant="primary" size="md" onClick={handleSave}>
                    <Save size={14} /> Save Changes
                  </Button>
                </div>
              )}
            </Section>
          )}

          {/* ── Contact Details ── */}
          {section === 'contact' && (
            <Section title="Contact Details" subtitle="Your registered contact information.">
              <div className="profile-form-grid">
                <Field label="Official Email">
                  <ReadValue>{user.email}</ReadValue>
                </Field>
                <Field label="Phone Number">
                  {editMode
                    ? <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    : <ReadValue>{phone}</ReadValue>}
                </Field>
                <Field label="Alternate Email">
                  {editMode
                    ? <input value={altEmail} onChange={(e) => setAltEmail(e.target.value)} />
                    : <ReadValue>{altEmail}</ReadValue>}
                </Field>
                <Field label="Office Address">
                  {editMode
                    ? <input value={officeAddr} onChange={(e) => setOfficeAddr(e.target.value)} />
                    : <ReadValue>{officeAddr}</ReadValue>}
                </Field>
              </div>
              {editMode && (
                <div className="profile-form-footer">
                  <Button variant="secondary" size="md" onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button variant="primary" size="md" onClick={handleSave}>
                    <Save size={14} /> Save Changes
                  </Button>
                </div>
              )}
            </Section>
          )}

          {/* ── Official Details ── */}
          {section === 'official' && (
            <Section title="Official Details" subtitle="Government-assigned details. Contact system admin to update.">
              <div className="profile-form-grid">
                <Field label="Role / Designation">
                  <ReadValue>{user.designation}</ReadValue>
                </Field>
                <Field label="Employee ID">
                  <ReadValue className="mono">IAS-UP-2018-0042</ReadValue>
                </Field>
                <Field label="Department">
                  <ReadValue>{user.department}</ReadValue>
                </Field>
                <Field label="Jurisdiction District">
                  <ReadValue>{user.district}</ReadValue>
                </Field>
                <Field label="State">
                  <ReadValue>{user.state}</ReadValue>
                </Field>
                <Field label="RFCTLARR Authority">
                  <ReadValue>Section 11 & 19 Notification Authority</ReadValue>
                </Field>
              </div>
              <div className="profile-official-note">
                <AlertTriangle size={14} />
                Official details are managed by the system administrator. Raise a support ticket to request changes.
              </div>
            </Section>
          )}

          {/* ── Preferences ── */}
          {section === 'preferences' && (
            <Section title="Preferences" subtitle="Configure your display and notification preferences.">
              <div className="profile-prefs">
                {[
                  { label: 'Email notifications for case updates', default: true },
                  { label: 'SMS alerts for urgent actions', default: true },
                  { label: 'Browser push notifications', default: false },
                  { label: 'Weekly digest email', default: true },
                ].map((pref) => (
                  <PrefToggle key={pref.label} label={pref.label} defaultOn={pref.default} />
                ))}
              </div>
              <div style={{ marginTop: 'var(--spacing-4)' }}>
                <Field label="Interface Language">
                  <select defaultValue="en" style={{ maxWidth: 260 }}>
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                  </select>
                </Field>
              </div>
              <div className="profile-form-footer" style={{ marginTop: 'var(--spacing-6)' }}>
                <Button variant="primary" size="md" onClick={handleSave}>
                  <Save size={14} /> Save Preferences
                </Button>
              </div>
            </Section>
          )}

          {/* ── Security ── */}
          {section === 'security' && (
            <Section title="Security Settings" subtitle="Manage your account password and authentication options.">
              <div className="profile-security-list">
                {[
                  { icon: <Lock size={18} />, label: 'Change Password', sub: 'Last changed 1 Sep 2026' },
                  { icon: <Smartphone size={18} />, label: 'Two-Factor Authentication', sub: 'Enabled via TOTP app' },
                  { icon: <MonitorDot size={18} />, label: 'Active Sessions', sub: '1 active session — 103.27.12.45' },
                ].map((item) => (
                  <button key={item.label} className="profile-security-item" onClick={() => alert(`${item.label} — coming soon`)}>
                    <div className="profile-security-icon">{item.icon}</div>
                    <div className="profile-security-text">
                      <div className="profile-security-label">{item.label}</div>
                      <div className="profile-security-sub">{item.sub}</div>
                    </div>
                    <ChevronRight size={16} className="profile-security-chevron" />
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* ── Activity Log ── */}
          {section === 'activity' && (
            <Section title="Activity Log" subtitle="Recent actions performed on your account.">
              <div className="profile-activity-list">
                {ACTIVITY_LOG.map((entry, i) => (
                  <div key={i} className="profile-activity-item">
                    <div className="profile-activity-dot" />
                    <div className="profile-activity-body">
                      <div className="profile-activity-action">{entry.action}</div>
                      <div className="profile-activity-meta">{entry.time} &nbsp;•&nbsp; IP: {entry.ip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="profile-right-col">
          {/* Role & Jurisdiction */}
          <div className="card profile-sidebar-card">
            <div className="profile-sidebar-card-header">
              <span>Role &amp; Jurisdiction</span>
              <Building2 size={16} />
            </div>
            <div className="profile-sidebar-fields">
              <SidebarField label="Role" value={roleConfig?.displayName || user.role} />
              <SidebarField label="District" value={user.district} />
              <SidebarField label="State" value={user.state} />
            </div>
          </div>

          {/* Account & Security */}
          <div className="card profile-sidebar-card">
            <div className="profile-sidebar-card-header">
              <span>Account &amp; Security</span>
              <Lock size={16} />
            </div>
            <div className="profile-sidebar-security">
              {[
                { label: 'Change Password', sub: 'Update your account password' },
                { label: 'Multi-Factor Authentication', sub: 'Manage your MFA settings' },
                { label: 'Active Sessions', sub: 'View and manage your active sessions' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="profile-sidebar-sec-item"
                  onClick={() => setSection('security')}
                >
                  <div>
                    <div className="profile-sidebar-sec-label">{item.label}</div>
                    <div className="profile-sidebar-sec-sub">{item.sub}</div>
                  </div>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card profile-danger-zone">
            <div className="profile-danger-header">
              <Trash2 size={16} />
              <span>Danger Zone</span>
            </div>
            <p className="profile-danger-sub">These actions are irreversible.</p>
            <button
              className="profile-danger-btn"
              onClick={() => alert('Please contact the system administrator to deactivate your account.')}
            >
              <Trash2 size={14} /> Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="profile-page-footer">
        <span>Last login: 10 Sep 2026, 11:24 AM &nbsp;|&nbsp; IP: 103.27.12.45</span>
        <div className="profile-footer-links">
          <button onClick={() => {}}>Privacy Policy</button>
          <button onClick={() => {}}>Terms of Use</button>
          <button onClick={() => {}}>Help &amp; Support</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Section wrapper ─────────────────────────── */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="profile-section-title">{title}</h3>
      {subtitle && <p className="profile-section-sub">{subtitle}</p>}
      <div className="profile-section-body">{children}</div>
    </div>
  );
}

/* ─── Form field ──────────────────────────────── */
function Field({
  label, children, style
}: {
  label: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div className="profile-field" style={style}>
      <label className="profile-field-label">{label}</label>
      {children}
    </div>
  );
}

/* ─── Read-only value ─────────────────────────── */
function ReadValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`profile-read-value${className ? ` ${className}` : ''}`}>{children}</div>
  );
}

/* ─── Sidebar field ───────────────────────────── */
function SidebarField({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-sidebar-field">
      <span className="profile-sidebar-field-label">{label}</span>
      <div className="profile-sidebar-field-value">{value}</div>
    </div>
  );
}

/* ─── Preference toggle ───────────────────────── */
function PrefToggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <label className="pref-toggle-row">
      <span className="pref-toggle-label">{label}</span>
      <button
        role="switch"
        aria-checked={on}
        className={`pref-toggle-switch${on ? ' pref-toggle-switch--on' : ''}`}
        onClick={() => setOn((v) => !v)}
      >
        <span className="pref-toggle-thumb" />
      </button>
    </label>
  );
}
