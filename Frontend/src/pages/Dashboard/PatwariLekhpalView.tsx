import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { caseService } from '../../services/caseService';
import type { Case } from '../../types/case';
import type { LandVerificationRecord, AssetItem } from '../../types/verification';
import {
  fetchVerificationForCase,
  submitLandVerification
} from '../../lib/api/landVerificationApi';
import {
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Clock,
  MapPin,
  Trees,
  Plus,
  Trash2,
  Calendar,
  Send,
  Loader2,
  Eye,
  Check
} from 'lucide-react';
import './FieldOfficerView.css';

const ASSET_TYPES = [
  { value: 'tree', label: 'Trees (Timber / Fruit)' },
  { value: 'well', label: 'Masonry / Dug Well' },
  { value: 'tube_well', label: 'Tube-well / Borewell' },
  { value: 'pump_house', label: 'Pump House / Irrigation Unit' },
  { value: 'pucca_structure', label: 'Pucca Structure / Building' },
  { value: 'kuccha_structure', label: 'Kuccha House / Boundary Wall' },
  { value: 'standing_crop', label: 'Standing Crop' },
  { value: 'other', label: 'Other Fixed Asset' }
];

export const PatwariLekhpalView: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [verifications, setVerifications] = useState<Record<string, LandVerificationRecord | null>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Verification Form State
  const [khasraConfirmed, setKhasraConfirmed] = useState<boolean>(true);
  const [ownershipNotes, setOwnershipNotes] = useState<string>('Title and possession cross-verified against Jamabandi 1431F & Khasra Khatauni.');
  const [boundaryNotes, setBoundaryNotes] = useState<string>('Physical DGPS survey completed. Boundary pillars mapped and reconciled with village Shajra map.');
  const [assetInventory, setAssetInventory] = useState<AssetItem[]>([
    { type: 'tree', description: 'Mature Sheesham & Neem trees', estimated_count_or_area: '18 trees' },
    { type: 'well', description: 'Irrigation masonry tube-well', estimated_count_or_area: '1 unit' }
  ]);
  const [noticeDate, setNoticeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noticeNotes, setNoticeNotes] = useState<string>('Section 4 preliminary notice served personally upon khatedars and affixed on Panchayat Ghar notice board.');

  const assignedVillages = user?.jurisdiction_value || 'Chhapraula, Bisrakh Jalalpur';
  const districtName = user?.district || 'Gautam Buddha Nagar';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    caseService.getCases()
      .then(async (allCases) => {
        if (!isMounted) return;
        // Prioritize proposal_submitted and district_review cases
        const relevant = allCases.filter(
          (c) =>
            c.stage === 'proposal_submitted' ||
            c.stage === 'district_review' ||
            c.stage === 'STAGE_1_PROPOSAL_PENDING' ||
            c.stage === 'STAGE_2_COLLECTOR_SCRUTINY' ||
            c.stage === 'state_review'
        );
        setCases(relevant);

        // Fetch verification records for each case
        const verMap: Record<string, LandVerificationRecord | null> = {};
        await Promise.all(
          relevant.map(async (c) => {
            const ver = await fetchVerificationForCase(c.id);
            verMap[c.id] = ver;
          })
        );

        if (isMounted) {
          setVerifications(verMap);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load cases for Patwari:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, assignedVillages]);

  const handleOpenForm = (c: Case) => {
    setSelectedCase(c);
    setSubmitError(null);
    setSubmitSuccess(false);

    const existing = verifications[c.id];
    if (existing) {
      setKhasraConfirmed(existing.khasra_ownership_confirmed);
      setOwnershipNotes(existing.ownership_notes || '');
      setBoundaryNotes(existing.boundary_verification_notes || '');
      setAssetInventory(existing.asset_inventory?.length ? [...existing.asset_inventory] : []);
      setNoticeDate(existing.notice_served_at ? existing.notice_served_at.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNoticeNotes(existing.notice_served_notes || '');
    } else {
      setKhasraConfirmed(true);
      setOwnershipNotes('Title and possession cross-verified against Jamabandi 1431F & Khasra Khatauni.');
      setBoundaryNotes('Physical DGPS survey completed. Boundary pillars mapped and reconciled with village Shajra map.');
      setAssetInventory([
        { type: 'tree', description: 'Mature Sheesham & Neem trees', estimated_count_or_area: '18 trees' },
        { type: 'well', description: 'Irrigation masonry tube-well', estimated_count_or_area: '1 unit' }
      ]);
      setNoticeDate(new Date().toISOString().split('T')[0]);
      setNoticeNotes('Section 4 preliminary notice served personally upon khatedars and affixed on Panchayat Ghar notice board.');
    }
  };

  const handleAddAsset = () => {
    setAssetInventory([
      ...assetInventory,
      { type: 'tree', description: '', estimated_count_or_area: '' }
    ]);
  };

  const handleRemoveAsset = (index: number) => {
    setAssetInventory(assetInventory.filter((_, i) => i !== index));
  };

  const handleUpdateAsset = (index: number, field: keyof AssetItem, val: string) => {
    const updated = [...assetInventory];
    updated[index] = { ...updated[index], [field]: val };
    setAssetInventory(updated);
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const record = await submitLandVerification(selectedCase.id, {
        khasra_ownership_confirmed: khasraConfirmed,
        ownership_notes: ownershipNotes,
        boundary_verification_notes: boundaryNotes,
        asset_inventory: assetInventory,
        notice_served_at: noticeDate ? new Date(noticeDate).toISOString() : undefined,
        notice_served_notes: noticeNotes
      });

      setVerifications((prev) => ({ ...prev, [selectedCase.id]: record }));
      setSubmitSuccess(true);
      setTimeout(() => {
        setSelectedCase(null);
        setSubmitSuccess(false);
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit verification record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="field-officer-container">
      {/* Header */}
      <div className="fo-header-row">
        <div className="fo-title-area">
          <h1>Patwari / Lekhpal Revenue Dashboard</h1>
          <p className="fo-subtitle">
            Statutory Section 4 Ground Verification • Khasra Title Checks, Physical DGPS Boundary Surveys &amp; Asset Inventories.
          </p>
        </div>

        <div className="fo-badge-card">
          <div className="fo-card-icon-wrap" style={{ color: 'var(--color-primary-navy, #1E3A8A)' }}>
            <FileCheck2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Village Revenue Officer
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              {user?.name || 'Rameshwar Dayal Sharma'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Mauza: <strong style={{ color: '#0F172A' }}>{assignedVillages}</strong> • {districtName}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.85rem',
        color: '#1E40AF'
      }}>
        <AlertCircle size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>RFCTLARR Section 4 Statutory Gate:</strong> Proposals cannot advance to State Review until
          your on-ground verification facts are certified by the Tehsildar with quasi-judicial authority.
        </div>
      </div>

      {/* Case List Section */}
      <div>
        <div className="fo-section-header">
          <h2 className="fo-section-title">Assigned Acquisition Proposals</h2>
          <span className="fo-section-count">{cases.length}</span>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '10px' }}>
            <Loader2 className="spinning" size={24} color="var(--color-accent-kesari)" />
            <span style={{ color: '#64748B' }}>Loading village acquisition cases...</span>
          </div>
        )}

        {!isLoading && cases.length === 0 && (
          <div className="fo-empty-card">
            <div className="fo-empty-icon">
              <Check size={32} color="#16A34A" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0F172A' }}>
              No Pending Ground Verifications
            </h3>
            <p style={{ margin: 0, color: '#64748B', maxWidth: '400px', fontSize: '0.9rem' }}>
              All acquisition proposals situated in village(s) {assignedVillages} have verified cadastral records.
            </p>
          </div>
        )}

        {!isLoading && cases.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {cases.map((c) => {
              const ver = verifications[c.id];
              return (
                <div
                  key={c.id}
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
                        {c.caseNumber}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Village: <strong>{c.mauza || 'Chhapraula'}</strong> • Tehsil: <strong>{c.tehsil || 'Dadri'}</strong>
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 600 }}>
                      {c.projectTitle}
                    </h3>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#475569', flexWrap: 'wrap' }}>
                      <span>Khasras: <strong>{c.khasraNumbers?.join(', ') || '101/1, 102/1'}</strong></span>
                      <span>Area: <strong>{c.totalAreaHectares} Ha</strong></span>
                      <span>Families: <strong>{c.affectedFamiliesCount}</strong></span>
                    </div>

                    {/* Returned for correction alert */}
                    {ver?.status === 'returned_for_correction' && (
                      <div style={{
                        marginTop: '8px',
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        color: '#991B1B'
                      }}>
                        <strong>Tehsildar Deficiency Note:</strong> {ver.tehsildar_notes || 'Deficiencies found. Please re-verify boundaries.'}
                      </div>
                    )}
                  </div>

                  {/* Status & Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {ver ? (
                      ver.status === 'certified' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#DCFCE7',
                          color: '#166534',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          <CheckCircle2 size={14} /> Certified by Tehsildar
                        </span>
                      ) : ver.status === 'returned_for_correction' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#FEE2E2',
                          color: '#991B1B',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          <AlertCircle size={14} /> Returned for Correction
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#FEF3C7',
                          color: '#92400E',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          <Clock size={14} /> Awaiting Tehsildar Certification
                        </span>
                      )
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#F1F5F9',
                        color: '#475569',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}>
                        Ground Verification Pending
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenForm(c)}
                      style={{
                        background: ver?.status === 'certified' ? '#F8FAFC' : 'var(--color-primary-navy, #1E3A8A)',
                        color: ver?.status === 'certified' ? '#334155' : '#FFFFFF',
                        border: ver?.status === 'certified' ? '1px solid #CBD5E1' : 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {ver?.status === 'certified' ? (
                        <><Eye size={15} /> View Certified Record</>
                      ) : ver?.status === 'returned_for_correction' ? (
                        <><AlertCircle size={15} /> Rectify &amp; Resubmit</>
                      ) : ver ? (
                        <><Eye size={15} /> Update Submission</>
                      ) : (
                        <><FileCheck2 size={15} /> Verify Land (Sec 4)</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification Modal Dialog */}
      {selectedCase && (
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
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent-kesari, #E65A00)', textTransform: 'uppercase' }}>
                  Section 4 Ground Verification Record
                </span>
                <h2 style={{ margin: '2px 0', fontSize: '1.25rem', color: '#0F172A' }}>
                  {selectedCase.projectTitle}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Case ID: #{selectedCase.id} • Village: {selectedCase.mauza || 'Chhapraula'} • Khasras: {selectedCase.khasraNumbers?.join(', ')}
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#64748B', cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {submitSuccess && (
              <div style={{ background: '#DCFCE7', color: '#166534', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> Land verification submitted to Tehsildar successfully!
              </div>
            )}

            {submitError && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} /> {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitVerification} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 1. Khasra & Ownership Confirmation */}
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#16A34A" /> Khasra Title &amp; Ownership Verification
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={khasraConfirmed}
                      onChange={(e) => setKhasraConfirmed(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Confirmed with RoR / Jamabandi
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={ownershipNotes}
                  onChange={(e) => setOwnershipNotes(e.target.value)}
                  placeholder="Notes on Khatauni ledger, recorded khatedars, shareholding percentages..."
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              {/* 2. Boundary Verification Notes */}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', marginBottom: '6px' }}>
                  DGPS &amp; Shajra Boundary Survey Notes
                </label>
                <textarea
                  rows={3}
                  value={boundaryNotes}
                  onChange={(e) => setBoundaryNotes(e.target.value)}
                  placeholder="Record boundary stone coordinates, physical demarcation markers, encroachment observations..."
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  required
                />
              </div>

              {/* 3. Asset Inventory Builder */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>Asset Inventory (Trees, Wells, Structures)</strong>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Statutory count for solatium calculation under Section 30.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAsset}
                    style={{
                      background: '#EFF6FF',
                      color: '#1E40AF',
                      border: '1px solid #BFDBFE',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} /> Add Asset
                  </button>
                </div>

                {assetInventory.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', textAlign: 'center', padding: '12px' }}>
                    No fixed assets identified on parcel land.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {assetInventory.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={item.type}
                          onChange={(e) => handleUpdateAsset(idx, 'type', e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem', width: '190px' }}
                        >
                          {ASSET_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateAsset(idx, 'description', e.target.value)}
                          placeholder="Description (e.g. Sheesham tree, 20-ft well)"
                          style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                          required
                        />
                        <input
                          type="text"
                          value={item.estimated_count_or_area || ''}
                          onChange={(e) => handleUpdateAsset(idx, 'estimated_count_or_area', e.target.value)}
                          placeholder="Count / Area (e.g. 10 units)"
                          style={{ width: '130px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAsset(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Notice Served Date & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: '4px' }}>
                    Section 4 Notice Date
                  </label>
                  <input
                    type="date"
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: '4px' }}>
                    Notice Service Evidence / Notes
                  </label>
                  <input
                    type="text"
                    value={noticeNotes}
                    onChange={(e) => setNoticeNotes(e.target.value)}
                    placeholder="Mode of service (personal, beat of drum, registered post)..."
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
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
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--color-primary-navy, #1E3A8A)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {submitting ? <Loader2 className="spinning" size={16} /> : <Send size={16} />}
                  Submit to Tehsildar for Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatwariLekhpalView;
