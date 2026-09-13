import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { LandVerificationRecord } from '../../types/verification';
import {
  fetchTehsildarQueue,
  certifyLandVerification,
  returnLandVerification
} from '../../lib/api/landVerificationApi';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Trees,
  FileText,
  UserCheck,
  Loader2,
  Calendar,
  Send,
  Eye
} from 'lucide-react';
import './FieldOfficerView.css';

export const TehsildarView: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<LandVerificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<LandVerificationRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState<boolean>(false);
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Certify notes state
  const [certifyNotes, setCertifyNotes] = useState<string>('Examined revenue records, boundary survey, and asset inventories under Section 4. Found in order and certified.');

  const assignedTehsil = user?.jurisdiction_value || 'Dadri';
  const districtName = user?.district || 'Gautam Buddha Nagar';

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const records = await fetchTehsildarQueue();
      setQueue(records);
    } catch (err) {
      console.error('Failed to load Tehsildar queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [user?.id, assignedTehsil]);

  const handleCertify = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);
    setActionError(null);

    try {
      await certifyLandVerification(selectedRecord.id, certifyNotes);
      setActionSuccess(`Record #${selectedRecord.id.slice(0, 8)} certified successfully. Gate to State Review unlocked!`);
      setTimeout(() => {
        setSelectedRecord(null);
        setActionSuccess(null);
        loadQueue();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || 'Failed to certify land verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !returnNotes.trim()) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await returnLandVerification(selectedRecord.id, returnNotes.trim());
      setActionSuccess(`Record #${selectedRecord.id.slice(0, 8)} returned to Patwari/Lekhpal with deficiency notes.`);
      setReturnDialogOpen(false);
      setTimeout(() => {
        setSelectedRecord(null);
        setActionSuccess(null);
        loadQueue();
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || 'Failed to return land verification');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="field-officer-container">
      {/* Header */}
      <div className="fo-header-row">
        <div className="fo-title-area">
          <h1>Tehsildar Quasi-Judicial Revenue Dashboard</h1>
          <p className="fo-subtitle">
            Statutory Section 4 Ground Certification • Revenue Oversight, Deficiencies Review &amp; Statutory Clearance for State Review.
          </p>
        </div>

        <div className="fo-badge-card">
          <div className="fo-card-icon-wrap" style={{ color: 'var(--color-primary-navy, #1E3A8A)' }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quasi-Judicial Revenue Authority
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              {user?.name || 'Smt. Sudha Upadhyay, Tehsildar'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Tehsil: <strong style={{ color: '#0F172A' }}>{assignedTehsil}</strong> • {districtName}
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Role Banner */}
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.85rem',
        color: '#166534'
      }}>
        <ShieldCheck size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>Statutory Certification Authority:</strong> Under the RFCTLARR Act 2013 and UP Revenue Code,
          your quasi-judicial certification confirms that ground boundaries and khasra titles have been reconciled.
          Certification automatically clears the statutory gate to proceed from District Scrutiny to State Review.
        </div>
      </div>

      {/* Submitted Queue Section */}
      <div>
        <div className="fo-section-header">
          <h2 className="fo-section-title">Submitted Ground Verification Records</h2>
          <span className="fo-section-count">{queue.length}</span>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '10px' }}>
            <Loader2 className="spinning" size={24} color="var(--color-accent-kesari)" />
            <span style={{ color: '#64748B' }}>Loading submitted verification queue...</span>
          </div>
        )}

        {!isLoading && queue.length === 0 && (
          <div className="fo-empty-card">
            <div className="fo-empty-icon" style={{ backgroundColor: '#DCFCE7' }}>
              <CheckCircle2 size={32} color="#16A34A" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0F172A' }}>
              Verification Queue is Clear
            </h3>
            <p style={{ margin: 0, color: '#64748B', maxWidth: '450px', fontSize: '0.9rem' }}>
              No pending Section 4 ground verification records awaiting certification in Tehsil {assignedTehsil}.
            </p>
          </div>
        )}

        {!isLoading && queue.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {queue.map((rec) => (
              <div
                key={rec.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E3A8A', background: '#DBEAFE', padding: '2px 8px', borderRadius: '4px' }}>
                      Case #{rec.case_id}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Submitted by: <strong>{rec.submitted_by_officer_name || 'Patwari / Lekhpal'}</strong> on {new Date(rec.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 600 }}>
                    {rec.case_project_name || `Acquisition Proposal Case #${rec.case_id}`}
                  </h3>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#475569', flexWrap: 'wrap' }}>
                    <span>Khasra Ownership: <strong style={{ color: rec.khasra_ownership_confirmed ? '#16A34A' : '#DC2626' }}>{rec.khasra_ownership_confirmed ? 'Confirmed' : 'Unconfirmed'}</strong></span>
                    <span>Assets Counted: <strong>{rec.asset_inventory?.length || 0} items</strong></span>
                    <span>Notice Served: <strong>{rec.notice_served_at ? new Date(rec.notice_served_at).toLocaleDateString() : 'Recorded'}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedRecord(rec);
                    setActionError(null);
                    setActionSuccess(null);
                  }}
                  style={{
                    background: 'var(--color-primary-navy, #1E3A8A)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(30, 58, 138, 0.2)'
                  }}
                >
                  <Eye size={15} /> Inspect &amp; Adjudicate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary-navy, #1E3A8A)', textTransform: 'uppercase' }}>
                  Section 4 Quasi-Judicial Verification Review
                </span>
                <h2 style={{ margin: '2px 0', fontSize: '1.25rem', color: '#0F172A' }}>
                  Case #{selectedRecord.case_id} — Ground Verification Record
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Reporting Officer: <strong>{selectedRecord.submitted_by_officer_name || 'Patwari / Lekhpal'}</strong> • Submitted at: {new Date(selectedRecord.submitted_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#64748B', cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {actionSuccess && (
              <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {actionSuccess}
              </div>
            )}

            {actionError && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> {actionError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Khasra Ownership Card */}
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Khasra &amp; Ownership Verification</strong>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: selectedRecord.khasra_ownership_confirmed ? '#DCFCE7' : '#FEE2E2',
                    color: selectedRecord.khasra_ownership_confirmed ? '#166534' : '#991B1B'
                  }}>
                    {selectedRecord.khasra_ownership_confirmed ? 'Title Confirmed' : 'Discrepancy Reported'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                  {selectedRecord.ownership_notes || 'No specific ownership notes recorded.'}
                </p>
              </div>

              {/* Boundary Verification Notes */}
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0F172A', marginBottom: '4px' }}>
                  Boundary Demarcation &amp; DGPS Survey
                </strong>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
                  {selectedRecord.boundary_verification_notes || 'No boundary survey notes provided.'}
                </p>
              </div>

              {/* Asset Inventory Table */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0F172A', marginBottom: '8px' }}>
                  Asset Inventory ({selectedRecord.asset_inventory?.length || 0} items)
                </strong>
                {(!selectedRecord.asset_inventory || selectedRecord.asset_inventory.length === 0) ? (
                  <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>No assets reported.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #E2E8F0' }}>Category</th>
                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #E2E8F0' }}>Description</th>
                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #E2E8F0' }}>Count / Area</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.asset_inventory.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{item.type}</td>
                          <td style={{ padding: '6px 10px', color: '#475569' }}>{item.description}</td>
                          <td style={{ padding: '6px 10px', color: '#475569' }}>{item.estimated_count_or_area || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Notice Served Information */}
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0F172A', marginBottom: '4px' }}>
                  Preliminary Notice Served Under Section 4
                </strong>
                <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                  <span>Date Served: <strong>{selectedRecord.notice_served_at ? new Date(selectedRecord.notice_served_at).toLocaleDateString() : 'Not recorded'}</strong></span>
                  <div style={{ marginTop: '4px' }}>Notes: {selectedRecord.notice_served_notes || 'Served in accordance with statutory rules.'}</div>
                </div>
              </div>

              {/* Tehsildar Certification Remarks */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: '4px' }}>
                  Tehsildar Certification Order / Endorsement Remarks
                </label>
                <textarea
                  rows={2}
                  value={certifyNotes}
                  onChange={(e) => setCertifyNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setReturnDialogOpen(true)}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#B91C1C',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <XCircle size={16} /> Return for Correction
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#475569',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleCertify}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 22px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#15803D',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)'
                    }}
                  >
                    {actionLoading ? <Loader2 className="spinning" size={16} /> : <CheckCircle2 size={16} />}
                    Certify Section 4 Verification (Approve Gate)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return for Correction Modal */}
      {returnDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '550px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#B91C1C', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Return Verification with Deficiency Order</h3>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#64748B' }}>
              Specify the exact statutory deficiencies, boundary stone discrepancies, or Khatauni mismatches
              that the Patwari / Lekhpal must rectify before re-submission.
            </p>

            <form onSubmit={handleReturn}>
              <textarea
                rows={4}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="e.g. Northern boundary pillar #4 overlaps with Gram Sabha plot 102/3. Re-verify with Revenue Inspector..."
                required
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #FCA5A5', marginBottom: '16px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReturnDialogOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !returnNotes.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {actionLoading ? <Loader2 className="spinning" size={16} /> : <Send size={16} />}
                  Issue Return Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TehsildarView;
