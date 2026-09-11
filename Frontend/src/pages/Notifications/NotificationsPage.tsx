/**
 * NotificationsPage — /notifications
 * Four filter tabs, paginated list, side-panel detail view.
 */
import { useState, useMemo } from 'react';
import {
  Bell, FileText, MessageSquare, Users, CheckCircle2,
  Megaphone, FileCheck, TriangleAlert, Settings2,
  ChevronRight, ChevronLeft, X, Check, MapPin, Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button/Button';
import { useTranslation } from '../../locales';
import './NotificationsPage.css';

/* ─── Types ──────────────────────────────────────── */
type NotifCategory = 'case_update' | 'system' | 'action_required' | 'info';

interface Notification {
  id: string;
  title: string;
  body: string;
  category: NotifCategory;
  timestamp: string; // ISO
  isRead: boolean;
  caseId?: string;
  projectName?: string;
  location?: string;
  currentStage?: string;
}

/* ─── Mock data ──────────────────────────────────── */
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-001', title: 'Case requires your review',
    body: 'A new land acquisition proposal has been submitted for your review and action.',
    category: 'action_required', timestamp: '2026-09-10T11:24:00Z', isRead: false,
    caseId: 'LA-2025-0214', projectName: 'Peripheral Ring Road', location: 'Gautam Buddha Nagar, Uttar Pradesh', currentStage: 'Proposal Submitted'
  },
  {
    id: 'n-002', title: 'Objections window opened',
    body: 'Public objections window is now open for case LA-2025-0179.',
    category: 'case_update', timestamp: '2026-09-10T06:45:00Z', isRead: false,
    caseId: 'LA-2025-0179', projectName: 'Yamuna Expressway Extension', location: 'Agra, Uttar Pradesh', currentStage: 'Objections Window'
  },
  {
    id: 'n-003', title: 'SIA Report submitted',
    body: 'SIA report has been submitted by the assigned expert for case LA-2025-0187.',
    category: 'case_update', timestamp: '2026-09-09T09:00:00Z', isRead: false,
    caseId: 'LA-2025-0187', projectName: 'Solar Energy Grid UP-IV', location: 'Mathura, Uttar Pradesh', currentStage: 'SIA Complete'
  },
  {
    id: 'n-004', title: 'Compensation disbursed',
    body: 'Compensation has been disbursed to all eligible landowners for case LA-2025-0168.',
    category: 'case_update', timestamp: '2026-09-08T14:30:00Z', isRead: true,
    caseId: 'LA-2025-0168', projectName: 'DMIC Industrial Corridor', location: 'Greater Noida, Uttar Pradesh', currentStage: 'Compensation Disbursed'
  },
  {
    id: 'n-005', title: 'New notification published',
    body: 'Gazette notification for LA-2025-0143 has been published under Section 11.',
    category: 'case_update', timestamp: '2026-09-07T08:00:00Z', isRead: true,
    caseId: 'LA-2025-0143', projectName: 'NH-19 Four-Laning', location: 'Aligarh, Uttar Pradesh', currentStage: 'Notification Published'
  },
  {
    id: 'n-006', title: 'State approval received',
    body: 'Case LA-2025-0134 has been approved by State Government. Forwarded to SIA.',
    category: 'case_update', timestamp: '2026-09-06T16:00:00Z', isRead: true,
    caseId: 'LA-2025-0134', projectName: 'Purvanchal Expressway Phase II', location: 'Lucknow, Uttar Pradesh', currentStage: 'State Review'
  },
  {
    id: 'n-007', title: 'Case returned for clarification',
    body: 'Case LA-2025-0128 has been returned to Requiring Body for additional documents.',
    category: 'action_required', timestamp: '2026-09-05T10:15:00Z', isRead: true,
    caseId: 'LA-2025-0128', projectName: 'Ganga Expressway Package 4', location: 'Prayagraj, Uttar Pradesh', currentStage: 'Returned for Clarification'
  },
  {
    id: 'n-008', title: 'System update',
    body: 'The system will be under maintenance on 12 Sep 2026, 10:00 PM – 1:00 AM.',
    category: 'system', timestamp: '2026-09-08T06:00:00Z', isRead: true,
  },
  {
    id: 'n-009', title: 'Field verification completed',
    body: 'Field verification report has been submitted for case LA-2025-0111.',
    category: 'case_update', timestamp: '2026-09-07T09:00:00Z', isRead: true,
    caseId: 'LA-2025-0111', projectName: 'Bundelkhand Expressway', location: 'Jhansi, Uttar Pradesh', currentStage: 'Field Verification'
  },
  {
    id: 'n-010', title: 'R&R plan submitted',
    body: 'R&R scheme and development plan has been submitted for case LA-2025-0108.',
    category: 'case_update', timestamp: '2026-09-06T08:00:00Z', isRead: true,
    caseId: 'LA-2025-0108', projectName: 'Eastern Peripheral Expressway', location: 'Baghpat, Uttar Pradesh', currentStage: 'R&R In Progress'
  },
  {
    id: 'n-011', title: 'New case assigned to you',
    body: 'Case LA-2025-0099 has been assigned to your jurisdiction for review.',
    category: 'action_required', timestamp: '2026-09-05T07:00:00Z', isRead: true,
    caseId: 'LA-2025-0099', projectName: 'Metro Extension Phase 3', location: 'Noida, Uttar Pradesh', currentStage: 'Proposal Submitted'
  },
  {
    id: 'n-012', title: 'System notification',
    body: 'New RFCTLARR Act circular issued. Please review the updated compliance guidelines.',
    category: 'system', timestamp: '2026-09-04T12:00:00Z', isRead: true,
  },
];

const PAGE_SIZE = 10;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function NotifIcon({ category }: { category: NotifCategory }) {
  const cls = `notif-icon notif-icon--${category}`;
  switch (category) {
    case 'action_required': return <div className={cls}><FileText size={18} /></div>;
    case 'case_update': return <div className={cls}><MessageSquare size={18} /></div>;
    case 'system': return <div className={cls}><Settings2 size={18} /></div>;
    case 'info': return <div className={cls}><Megaphone size={18} /></div>;
  }
}

/* ─── Component ──────────────────────────────────── */
type TabKey = 'all' | 'unread' | 'case_updates' | 'system';

export function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [selected, setSelected] = useState<Notification | null>(MOCK_NOTIFICATIONS[0]);
  const [page, setPage] = useState(1);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'unread': return notifications.filter((n) => !n.isRead);
      case 'case_updates': return notifications.filter((n) => n.category === 'case_update' || n.category === 'action_required');
      case 'system': return notifications.filter((n) => n.category === 'system');
      default: return notifications;
    }
  }, [notifications, activeTab]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const caseUpdateCount = notifications.filter((n) => n.category === 'case_update' || n.category === 'action_required').length;
  const systemCount = notifications.filter((n) => n.category === 'system').length;

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function selectNotif(n: Notification) {
    setSelected(n);
    markRead(n.id);
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <div className="page-container notif-page">
      {/* ── Page Header ── */}
      <div className="notif-page-header">
        <div>
          <h1 className="notif-page-title">
            <Bell size={24} style={{ color: 'var(--color-primary-navy)' }} />
            {t('common.nav.notifications', 'Notifications')}
          </h1>
          <p className="notif-page-subtitle">
            Stay updated on the latest updates, actions and events related to land acquisition cases.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={markAllRead}>
          <Check size={14} /> {t('common.confirm', 'Mark all as read')}
        </Button>
      </div>

      {/* ── Main two-col layout ── */}
      <div className="notif-layout">
        {/* ── Left: list ── */}
        <div className="notif-list-panel">
          {/* Tabs */}
          <div className="notif-tabs">
            <TabBtn id="all" active={activeTab === 'all'} count={notifications.length} label={t('common.all', 'All')} onClick={() => handleTabChange('all')} />
            <TabBtn id="unread" active={activeTab === 'unread'} count={unreadCount} label={t('dashboard.priorityAlerts', 'Unread')} onClick={() => handleTabChange('unread')} highlighted />
            <TabBtn id="case_updates" active={activeTab === 'case_updates'} count={caseUpdateCount} label={t('dashboard.recentActivities', 'Case Updates')} onClick={() => handleTabChange('case_updates')} />
            <TabBtn id="system" active={activeTab === 'system'} count={systemCount} label={t('common.status', 'System')} onClick={() => handleTabChange('system')} />
          </div>

          {/* List */}
          <div className="notif-list">
            {pageItems.length === 0 && (
              <div className="notif-empty">
                <Bell size={32} style={{ color: 'var(--color-text-disabled)' }} />
                <p>No notifications in this category.</p>
              </div>
            )}
            {pageItems.map((n) => (
              <div
                key={n.id}
                className={`notif-row${selected?.id === n.id ? ' notif-row--active' : ''}${!n.isRead ? ' notif-row--unread' : ''}`}
                onClick={() => selectNotif(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectNotif(n)}
              >
                <div className="notif-row-left">
                  {!n.isRead && <span className="notif-unread-dot" aria-label="Unread" />}
                  <NotifIcon category={n.category} />
                </div>
                <div className="notif-row-body">
                  <div className="notif-row-title">{n.title}</div>
                  <div className="notif-row-sub">
                    {n.caseId && <span className="notif-case-id">{n.caseId}</span>}
                    {' – '}{n.body.length > 60 ? n.body.slice(0, 60) + '…' : n.body}
                  </div>
                </div>
                <div className="notif-row-meta">
                  <span className="notif-timestamp">{timeAgo(n.timestamp)}</span>
                  <ChevronRight size={14} className="notif-chevron" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="notif-pagination">
              <span className="notif-page-info">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} notifications
              </span>
              <div className="notif-page-controls">
                <button
                  className="notif-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`notif-page-btn${p === page ? ' notif-page-btn--active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="notif-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Detail panel ── */}
        {selected && (
          <div className="notif-detail-panel card">
            <div className="notif-detail-header">
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-navy)' }}>
                Notification Details
              </span>
              <button className="notif-detail-close" onClick={() => setSelected(null)} aria-label="Close details">
                <X size={16} />
              </button>
            </div>

            {/* Icon */}
            <div className="notif-detail-icon-wrap">
              <NotifIcon category={selected.category} />
            </div>

            <h3 className="notif-detail-title">{selected.title}</h3>
            <div className="notif-detail-time">{timeAgo(selected.timestamp)} &nbsp;•&nbsp; {fullDate(selected.timestamp)}</div>

            <p className="notif-detail-body">{selected.body}</p>

            {/* Case metadata */}
            {selected.caseId && (
              <table className="notif-detail-meta-table">
                <tbody>
                  <tr>
                    <td>Case ID</td>
                    <td><strong>{selected.caseId}</strong></td>
                  </tr>
                  {selected.projectName && (
                    <tr>
                      <td>Project Name</td>
                      <td>{selected.projectName}</td>
                    </tr>
                  )}
                  {selected.location && (
                    <tr>
                      <td>Location</td>
                      <td>{selected.location}</td>
                    </tr>
                  )}
                  {selected.currentStage && (
                    <tr>
                      <td>Current Stage</td>
                      <td>{selected.currentStage}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* CTAs */}
            {selected.caseId && (
              <div className="notif-detail-ctas">
                <Button variant="primary" size="md" onClick={() => alert(`Navigating to case ${selected.caseId}`)}>
                  View Case <ChevronRight size={14} />
                </Button>
                <Button variant="secondary" size="md" onClick={() => markRead(selected.id)}>
                  <Eye size={14} /> Mark as read
                </Button>
              </div>
            )}

            {/* Related actions */}
            <div className="notif-related">
              <div className="notif-related-title">Related Actions</div>
              {[
                { icon: <Bell size={14} />, label: 'View all notifications' },
                { icon: <FileCheck size={14} />, label: 'Go to case' },
                { icon: <MapPin size={14} />, label: 'View project on map' },
              ].map((a) => (
                <button key={a.label} className="notif-related-item" onClick={() => {}}>
                  {a.icon} <span>{a.label}</span> <ChevronRight size={13} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── TabBtn helper ── */
function TabBtn({
  id, label, count, active, highlighted, onClick
}: {
  id: string; label: string; count: number; active: boolean; highlighted?: boolean; onClick: () => void;
}) {
  return (
    <button
      id={`notif-tab-${id}`}
      role="tab"
      aria-selected={active}
      className={`notif-tab${active ? ' notif-tab--active' : ''}`}
      onClick={onClick}
    >
      {label}
      <span className={`notif-tab-count${highlighted && count > 0 ? ' notif-tab-count--alert' : ''}`}>
        {count}
      </span>
    </button>
  );
}
