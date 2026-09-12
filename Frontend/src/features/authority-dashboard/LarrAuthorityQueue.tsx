import React, { useState, useEffect } from 'react';
import type { Case } from '../../types/case';
import type { DisputeReferral, DisputeReferralStatus } from '../../types/referral';
import { fetchLarrCases, fetchLarrReferrals, updateLarrReferral } from '../../lib/api/authorityApi';
import {
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Plus,
  Loader2,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LarrAuthorityQueue: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [referralsMap, setReferralsMap] = useState<Record<string, DisputeReferral[]>>({});
  const [savingReferralId, setSavingReferralId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active referral edit state
  const [editFormData, setEditFormData] = useState<{
    larr_case_number: string;
    status: DisputeReferralStatus;
    outcome: string;
    high_court_appeal_outcome: string;
    newHearingDate: string;
    hearing_dates: string[];
  }>({
    larr_case_number: '',
    status: 'referred',
    outcome: '',
    high_court_appeal_outcome: '',
    newHearingDate: '',
    hearing_dates: []
  });

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await fetchLarrCases();
      setCases(data);
      // Automatically expand first case if present
      if (data.length > 0 && !expandedCaseId) {
        handleToggleExpand(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load LARR cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleToggleExpand = async (caseId: string) => {
    if (expandedCaseId === caseId) {
      setExpandedCaseId(null);
      return;
    }
    setExpandedCaseId(caseId);

    // Fetch referrals for this case if not already fetched
    if (!referralsMap[caseId]) {
      const refs = await fetchLarrReferrals(caseId);
      setReferralsMap((prev) => ({ ...prev, [caseId]: refs }));
      if (refs.length > 0) {
        initFormData(refs[0]);
      }
    } else {
      const existing = referralsMap[caseId];
      if (existing.length > 0) {
        initFormData(existing[0]);
      }
    }
  };

  const initFormData = (ref: DisputeReferral) => {
    setEditFormData({
      larr_case_number: ref.larr_case_number || '',
      status: ref.status,
      outcome: ref.outcome || '',
      high_court_appeal_outcome: ref.high_court_appeal_outcome || '',
      newHearingDate: '',
      hearing_dates: Array.isArray(ref.hearing_dates) ? [...ref.hearing_dates] : []
    });
  };

  const handleAddHearingDate = () => {
    if (!editFormData.newHearingDate) return;
    if (!editFormData.hearing_dates.includes(editFormData.newHearingDate)) {
      setEditFormData((prev) => ({
        ...prev,
        hearing_dates: [...prev.hearing_dates, prev.newHearingDate].sort(),
        newHearingDate: ''
      }));
    }
  };

  const handleRemoveHearingDate = (dateToRemove: string) => {
    setEditFormData((prev) => ({
      ...prev,
      hearing_dates: prev.hearing_dates.filter((d) => d !== dateToRemove)
    }));
  };

  const handleSaveReferral = async (referral: DisputeReferral, caseId: string) => {
    setSavingReferralId(referral.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await updateLarrReferral(referral.id, {
        status: editFormData.status,
        larr_case_number: editFormData.larr_case_number || undefined,
        outcome: editFormData.outcome || undefined,
        high_court_appeal_outcome: editFormData.high_court_appeal_outcome || undefined,
        hearing_dates: editFormData.hearing_dates
      });

      // Update local state
      setReferralsMap((prev) => ({
        ...prev,
        [caseId]: prev[caseId]?.map((r) => (r.id === updated.id ? updated : r)) || [updated]
      }));

      setSuccessMsg(
        `LARR Referral record successfully updated to status "${updated.status.toUpperCase()}". Audit log entry recorded.`
      );

      // If closed, reload queue as closed cases leave the active referral queue
      if (updated.status === 'closed') {
        setTimeout(() => {
          loadCases();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update LARR referral.');
    } finally {
      setSavingReferralId(null);
    }
  };

  if (loading) {
    return (
      <div className="authority-panel" style={{ padding: '60px 0', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: '#1D4ED8', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Loading LARR Authority Referral Queue...</p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="authority-panel">
        <div className="authority-empty-state">
          <div className="authority-empty-icon">
            <Scale size={32} />
          </div>
          <h3 className="authority-empty-title">No cases currently referred to your Authority.</h3>
          <p className="authority-empty-desc">
            Cases will appear here when referred by a District Collector or State Approver under Section 64 of the RFCTLARR Act, 2013.
            The LARR Authority operates strictly on a referral basis for disputed compensation awards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="authority-panel">
      <div className="authority-panel-header">
        <div className="authority-panel-title-area">
          <h2>
            <Scale size={20} style={{ color: '#B45309' }} />
            Active Dispute Referrals (RFCTLARR Section 64)
          </h2>
          <p className="authority-panel-sub">
            Quasi-judicial docket of compensation disputes referred by District Collectors. Case progression to possession is statutorily barred while referrals remain open.
          </p>
        </div>
        <div className="authority-controls">
          <span className="dispute-active-badge">
            <ShieldAlert size={14} />
            {cases.length} Referral{cases.length > 1 ? 's' : ''} Requiring Adjudication
          </span>
        </div>
      </div>

      {successMsg && (
        <div style={{ margin: '16px 24px 0 24px', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '6px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ margin: '16px 24px 0 24px', background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px 16px', borderRadius: '6px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem' }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="authority-table-wrap" style={{ marginTop: '12px' }}>
        <table className="authority-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Case ID / Docket</th>
              <th>Project Name</th>
              <th>District &amp; State</th>
              <th>Current Stage</th>
              <th>Dispute Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const isExpanded = expandedCaseId === c.id;
              const referrals = referralsMap[c.id] || (c.dispute_referrals as DisputeReferral[]) || [];
              const activeRef = referrals.find((r) => r.status !== 'closed') || referrals[0];

              return (
                <React.Fragment key={c.id}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(c.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                        title={isExpanded ? 'Collapse Referral Panel' : 'Expand Referral Panel'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{c.caseNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {activeRef?.larr_case_number ? `LARR: ${activeRef.larr_case_number}` : 'Docket: Pending Assignment'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.projectTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.totalAreaHectares} Ha • {c.affectedFamiliesCount} Families</div>
                    </td>
                    <td>
                      <div>{c.district}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.state}</div>
                    </td>
                    <td>
                      <span className="stage-pill disbursed">{c.stage.replace(/_/g, ' ')}</span>
                    </td>
                    <td>
                      {activeRef ? (
                        activeRef.status === 'under_hearing' ? (
                          <span className="dispute-hearing-badge">
                            <Clock size={12} /> Under Hearing
                          </span>
                        ) : activeRef.status === 'decided' ? (
                          <span className="dispute-closed-badge">
                            <CheckCircle2 size={12} /> Award Decided
                          </span>
                        ) : activeRef.status === 'appealed_high_court' ? (
                          <span className="dispute-active-badge">
                            <Scale size={12} /> High Court Appeal
                          </span>
                        ) : activeRef.status === 'closed' ? (
                          <span className="dispute-closed-badge">
                            <CheckCircle2 size={12} /> Closed
                          </span>
                        ) : (
                          <span className="dispute-active-badge">
                            <AlertTriangle size={12} /> Referred
                          </span>
                        )
                      ) : (
                        <span className="dispute-active-badge">Referred</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="authority-btn-secondary"
                        onClick={() => handleToggleExpand(c.id)}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        {isExpanded ? 'Hide Details' : 'Manage Hearing'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Referral Management Panel */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div className="authority-referral-panel">
                          <div className="authority-alert-box">
                            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Statutory Enforcement Gate (Section 38 RFCTLARR Act):</strong> Case progression to{' '}
                              <em>possession_taken</em> is strictly prohibited by law while this referral remains active.
                              Adjudicating and closing this referral will immediately unblock the District Collector from proceeding with legal possession.
                            </div>
                          </div>

                          {activeRef ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                              {/* Left Column: Case Meta & Hearing Scheduling */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div className="authority-form-group">
                                  <label>LARR Authority Case / Docket Number</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. LARR/GNB/2026/001"
                                    value={editFormData.larr_case_number}
                                    onChange={(e) => setEditFormData({ ...editFormData, larr_case_number: e.target.value })}
                                  />
                                </div>

                                <div className="authority-form-group">
                                  <label>Dispute Referral Status</label>
                                  <select
                                    value={editFormData.status}
                                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as DisputeReferralStatus })}
                                  >
                                    <option value="referred">Referred (Admissibility Assessment)</option>
                                    <option value="under_hearing">Under Hearing (Formal Examination)</option>
                                    <option value="decided">Decided (Order Pronounced)</option>
                                    <option value="appealed_high_court">Appealed to High Court (Section 74)</option>
                                    <option value="closed">Closed (Dispute Concluded - Unblock Possession)</option>
                                  </select>
                                </div>

                                <div className="authority-form-group">
                                  <label>Collector Referral Reason / Basis (Section 64)</label>
                                  <div style={{ padding: '10px 14px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.85rem', color: '#334155' }}>
                                    {activeRef.reason || 'Disputed quantum of land compensation and rehabilitation entitlements raised by affected titleholders.'}
                                  </div>
                                </div>

                                <div className="authority-form-group">
                                  <label>Schedule Hearing Date</label>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                      type="date"
                                      value={editFormData.newHearingDate}
                                      onChange={(e) => setEditFormData({ ...editFormData, newHearingDate: e.target.value })}
                                    />
                                    <button
                                      type="button"
                                      className="authority-btn-secondary"
                                      onClick={handleAddHearingDate}
                                      disabled={!editFormData.newHearingDate}
                                    >
                                      <Plus size={16} /> Add Date
                                    </button>
                                  </div>

                                  {editFormData.hearing_dates.length > 0 && (
                                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {editFormData.hearing_dates.map((dateStr) => (
                                        <span
                                          key={dateStr}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '4px 8px',
                                            background: '#EFF6FF',
                                            border: '1px solid #BFDBFE',
                                            borderRadius: '4px',
                                            fontSize: '0.78rem',
                                            color: '#1E40AF'
                                          }}
                                        >
                                          <Calendar size={12} /> {dateStr}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveHearingDate(dateStr)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 700, padding: 0 }}
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Column: Outcomes & Pronouncements */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div className="authority-form-group">
                                  <label>Authority Order / Dispute Outcome</label>
                                  <textarea
                                    rows={4}
                                    placeholder="Enter judicial ruling, enhanced compensation order, or settlement terms..."
                                    value={editFormData.outcome}
                                    onChange={(e) => setEditFormData({ ...editFormData, outcome: e.target.value })}
                                  />
                                </div>

                                <div className="authority-form-group">
                                  <label>High Court Appeal Outcome (Section 74 RFCTLARR)</label>
                                  <textarea
                                    rows={3}
                                    placeholder="If appealed to High Court, record stay orders, writ petition number, or appellate judgment..."
                                    value={editFormData.high_court_appeal_outcome}
                                    onChange={(e) => setEditFormData({ ...editFormData, high_court_appeal_outcome: e.target.value })}
                                  />
                                </div>

                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                  <Link
                                    to={`/cases/${c.id}`}
                                    className="authority-btn-secondary"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    <FileText size={16} /> View Full Case Dossier
                                  </Link>
                                  <button
                                    type="button"
                                    className="authority-btn-primary"
                                    disabled={savingReferralId === activeRef.id}
                                    onClick={() => handleSaveReferral(activeRef, c.id)}
                                  >
                                    {savingReferralId === activeRef.id ? (
                                      <>
                                        <Loader2 className="animate-spin" size={16} /> Saving Record...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 size={16} /> Save &amp; Pronounce Order
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p style={{ color: '#64748B', margin: 0 }}>No referral record found for this case.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
