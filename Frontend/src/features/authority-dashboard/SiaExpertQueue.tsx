import React, { useState, useEffect } from 'react';
import type { Case } from '../../types/case';
import { fetchSiaExpertCases } from '../../lib/api/authorityApi';
import {
  FileSearch,
  Search,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Upload,
  Loader2,
  ExternalLink,
  Info,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SiaExpertQueue: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [evaluatingCase, setEvaluatingCase] = useState<Case | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal Form State
  const [modalForm, setModalForm] = useState<{
    hearingDate: string;
    attendanceCount: number;
    concernsRaised: string;
    recommendation: 'approve' | 'recommend_against';
    fileName: string;
  }>({
    hearingDate: new Date().toISOString().split('T')[0],
    attendanceCount: 45,
    concernsRaised: '',
    recommendation: 'approve',
    fileName: ''
  });

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await fetchSiaExpertCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to load SIA Expert cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage =
      selectedStage === 'all' ||
      (selectedStage === 'sia_in_progress' && (c.stage === 'sia_in_progress' || c.stage === 'STAGE_3_SIA_EVALUATION')) ||
      c.stage === selectedStage;

    return matchesSearch && matchesStage;
  });

  const handleOpenReviewModal = (c: Case) => {
    setEvaluatingCase(c);
    setModalForm({
      hearingDate: new Date().toISOString().split('T')[0],
      attendanceCount: c.affectedFamiliesCount ? c.affectedFamiliesCount * 2 : 50,
      concernsRaised: '',
      recommendation: 'approve',
      fileName: 'Draft_SIA_Appraisal_Report_Signed.pdf'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setModalForm((prev) => ({ ...prev, fileName: e.target.files![0].name }));
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingCase) return;

    setSubmitting(true);
    try {
      // Simulate statutory submission of SIA appraisal
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSuccessToast(
        `SIA Appraisal successfully submitted for Case ${evaluatingCase.caseNumber}. Decision: ${
          modalForm.recommendation === 'approve'
            ? 'Approved (Proceed to Section 11 Notification)'
            : 'Negative Recommendation (Subject to Section 7(4) Government Override)'
        }`
      );

      // Advance stage in local view
      setCases((prev) =>
        prev.map((c) =>
          c.id === evaluatingCase.id
            ? {
                ...c,
                stage: 'sia_complete',
                lastUpdated: new Date().toISOString().split('T')[0]
              }
            : c
        )
      );

      setEvaluatingCase(null);
    } catch (err) {
      console.error('Failed to submit SIA evaluation', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="authority-panel" style={{ padding: '60px 0', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: '#1D4ED8', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Loading National SIA Appraisal Queue...</p>
      </div>
    );
  }

  return (
    <div className="authority-panel">
      <div className="authority-panel-header">
        <div className="authority-panel-title-area">
          <h2>
            <FileSearch size={20} style={{ color: '#1D4ED8' }} />
            National SIA Expert Appraisal Queue (RFCTLARR Section 7)
          </h2>
          <p className="authority-panel-sub">
            Independent multi-disciplinary expert appraisal of Social Impact Assessments. Review action is enabled exclusively during the statutory SIA stage.
          </p>
        </div>

        <div className="authority-controls">
          <div className="authority-search-box">
            <Search size={16} className="authority-search-icon" />
            <input
              type="text"
              placeholder="Search national cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="authority-select"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
          >
            <option value="all">All Statutory Stages</option>
            <option value="sia_in_progress">SIA In Progress (Pending Appraisal)</option>
            <option value="state_review">State Review</option>
            <option value="notification_published">Section 11 Notification</option>
            <option value="award_declared">Award Declared</option>
            <option value="compensation_disbursed">Compensation Disbursed</option>
          </select>
        </div>
      </div>

      {successToast && (
        <div style={{ margin: '16px 24px 0 24px', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '6px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem' }}>
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      <div className="authority-table-wrap">
        <table className="authority-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Project Name</th>
              <th>State &amp; District</th>
              <th>Affected Families</th>
              <th>Area (Ha)</th>
              <th>Statutory Stage</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                  No cases match your national filter query.
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => {
                const isSiaStage = c.stage === 'sia_in_progress' || c.stage === 'STAGE_3_SIA_EVALUATION';

                return (
                  <tr key={c.id}>
                    <td>
                      <Link
                        to={`/cases/${c.id}`}
                        style={{ fontWeight: 600, color: '#1D4ED8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {c.caseNumber}
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.projectTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.projectPurpose}</div>
                    </td>
                    <td>
                      <div>{c.state}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.district}</div>
                    </td>
                    <td>{c.affectedFamiliesCount}</td>
                    <td>{c.totalAreaHectares}</td>
                    <td>
                      <span className={`stage-pill ${isSiaStage ? 'sia' : ''}`}>
                        {c.stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {/* CRITICAL: Review action button appears STRICTLY when stage === 'sia_in_progress' (absent otherwise, not disabled) */}
                      {isSiaStage ? (
                        <button
                          type="button"
                          className="authority-btn-primary"
                          onClick={() => handleOpenReviewModal(c)}
                        >
                          <FileCheck2 size={16} /> Review SIA
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Review SIA Evaluation Modal */}
      {evaluatingCase && (
        <div className="authority-modal-backdrop">
          <div className="authority-modal">
            <div className="authority-modal-header">
              <div>
                <h3>Independent SIA Expert Appraisal</h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  Case: {evaluatingCase.caseNumber} • {evaluatingCase.projectTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingCase(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation}>
              <div className="authority-modal-body">
                <div className="authority-alert-box">
                  <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Statutory Requirement (Section 7(1)):</strong> The Expert Group must examine whether the SIA report has adequately assessed the public purpose, minimum required land area, and absence of feasible alternative unutilized lands.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="authority-form-group">
                    <label>Public Hearing Conducted Date</label>
                    <input
                      type="date"
                      required
                      value={modalForm.hearingDate}
                      onChange={(e) => setModalForm({ ...modalForm, hearingDate: e.target.value })}
                    />
                  </div>

                  <div className="authority-form-group">
                    <label>Public Attendance Count</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={modalForm.attendanceCount}
                      onChange={(e) => setModalForm({ ...modalForm, attendanceCount: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>

                <div className="authority-form-group">
                  <label>Public Concerns, Objections &amp; Livelihood Assessment</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Summarize key environmental, socio-economic, and displacement concerns raised during public hearings..."
                    value={modalForm.concernsRaised}
                    onChange={(e) => setModalForm({ ...modalForm, concernsRaised: e.target.value })}
                  />
                </div>

                <div className="authority-form-group">
                  <label>Signed Expert Appraisal Report (PDF)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label
                      htmlFor="sia-upload"
                      className="authority-btn-secondary"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={16} /> Choose File
                    </label>
                    <input
                      id="sia-upload"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <span style={{ fontSize: '0.84rem', color: '#334155' }}>
                      {modalForm.fileName || 'No file selected'}
                    </span>
                  </div>
                </div>

                <div className="authority-form-group">
                  <label>Recommendation Decision</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="sia_recommendation"
                        checked={modalForm.recommendation === 'approve'}
                        onChange={() => setModalForm({ ...modalForm, recommendation: 'approve' })}
                      />
                      <span style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> Recommend in Favor of Acquisition (Proceed to Section 11 Notification)
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="sia_recommendation"
                        checked={modalForm.recommendation === 'recommend_against'}
                        onChange={() => setModalForm({ ...modalForm, recommendation: 'recommend_against' })}
                      />
                      <span style={{ color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <XCircle size={16} /> Recommend Against Acquisition (Significant Adverse Impact)
                      </span>
                    </label>
                  </div>
                </div>

                {modalForm.recommendation === 'recommend_against' && (
                  <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '6px', padding: '12px 16px', fontSize: '0.83rem', color: '#9A3412', display: 'flex', gap: '10px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Section 7(4) Government Override Notice:</strong> Under the RFCTLARR Act 2013, if the Expert Group recommends that the project not proceed, the Appropriate Government may nevertheless override the recommendation by recording specific reasons in writing.
                    </div>
                  </div>
                )}
              </div>

              <div className="authority-modal-footer">
                <button
                  type="button"
                  className="authority-btn-secondary"
                  onClick={() => setEvaluatingCase(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="authority-btn-primary"
                  disabled={submitting || !modalForm.concernsRaised}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting Appraisal...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Submit Statutory Appraisal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
