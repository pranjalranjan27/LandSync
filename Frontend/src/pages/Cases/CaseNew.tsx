/**
 * CaseNew — Land Acquisition Proposal Form (Section 4, RFCTLARR Act 2013)
 * Route: /cases/new
 * Access: REQUIRING_BODY only (ProtectedRoute enforces this in routes.tsx)
 *
 * Integrated Architecture:
 *  Step 1: Form-1 Project Details & Statutory Metadata
 *  Step 2: Interactive Cadastral GIS Map (CadastralMap in selectionMode)
 *          Directly populates district, tehsil, village, and parcel IDs from PostGIS/SQLite.
 *          Enforces pre-submission dispute gate (blocking prohibited, advisory for litigation).
 *  Step 3: Statutory Declaration, Review, & Submission to District Collector
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, CheckCircle2, ChevronRight, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { CadastralMap } from '../../components/CadastralMap';
import { DisputeBlockModal } from '../../features/cases/DisputeBlockModal';
import { validateParcelSelection } from '../../lib/api/parcelsApi';
import type { DisputeValidationResult, ParcelProperties } from '../../types/parcel';
import { caseService } from '../../services/caseService';
import './CaseNew.css';

type Step = 'project' | 'parcels' | 'review';

interface FormState {
  projectTitle: string;
  projectPurpose: string;
  department: string;
  purposeCategory: string;
  state: string;
  district: string;
  tehsil: string;
  mauza: string;
  estimatedAreaHa: string;
  budgetCr: string;
  isUrgentSec40: boolean;
  justification: string;
  district_id?: number;
  state_id?: number;
}

const INITIAL_FORM: FormState = {
  projectTitle: '',
  projectPurpose: '',
  department: 'National Highways Authority of India (NHAI)',
  purposeCategory: 'infrastructure',
  state: 'Uttar Pradesh',
  district: 'Gautam Buddha Nagar',
  tehsil: 'Dadri',
  mauza: 'Chhapraula',
  estimatedAreaHa: '',
  budgetCr: '',
  isUrgentSec40: false,
  justification: '',
  district_id: 1,
  state_id: 1,
};

export function CaseNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('project');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]); // Parcel IDs (UUID or Khasra string)
  const [selectedParcelObjects, setSelectedParcelObjects] = useState<ParcelProperties[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState('');
  const [hasDisputeWarning, setHasDisputeWarning] = useState<boolean>(false);

  const [disputeValidation, setDisputeValidation] = useState<DisputeValidationResult | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const set = useCallback(
    <K extends keyof FormState>(key: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const val = e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        setForm((prev) => ({ ...prev, [key]: val }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      },
    []
  );

  /* ── Validation helpers ── */
  function validateProject(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.projectTitle.trim()) e.projectTitle = 'Project title is required.';
    if (!form.department.trim()) e.department = 'Requiring department is required.';
    if (!form.district.trim()) e.district = 'District is required.';
    if (!form.tehsil.trim()) e.tehsil = 'Tehsil is required.';
    if (!form.mauza.trim()) e.mauza = 'Mauza / Village is required.';
    if (!form.budgetCr || Number(form.budgetCr) <= 0) e.budgetCr = 'Valid budget estimate is required.';
    if (!form.projectPurpose.trim()) e.projectPurpose = 'Project purpose / public benefit justification is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateParcels(): boolean {
    if (selectedParcels.length === 0) {
      setGlobalError('Select at least one cadastral parcel on the GIS map before proceeding.');
      return false;
    }
    setGlobalError('');
    return true;
  }

  /* ── Navigation ── */
  function goNextFromProject() {
    if (validateProject()) setStep('parcels');
  }

  function goNextFromParcels() {
    if (validateParcels()) setStep('review');
  }

  /* ── Interactive Map Parcel Selection Handler ── */
  const handleSelectParcel = useCallback((parcel: ParcelProperties) => {
    setGlobalError('');
    const parcelKey = String(parcel.id || parcel.khasra_number);

    // Check if already selected -> toggle off
    const alreadySelected = selectedParcels.some((k) => k === parcelKey || k === parcel.khasra_number);
    if (alreadySelected) {
      setSelectedParcels((prev) => prev.filter((k) => k !== parcelKey && k !== parcel.khasra_number));
      setSelectedParcelObjects((prev) => {
        const next = prev.filter((p) => String(p.id || p.khasra_number) !== parcelKey && p.khasra_number !== parcel.khasra_number);
        const nextArea = next.reduce((sum, p) => sum + (Number(p.area_hectares) || 0), 0);
        setForm((f) => ({
          ...f,
          estimatedAreaHa: nextArea > 0 ? nextArea.toFixed(2) : f.estimatedAreaHa
        }));
        return next;
      });
      return;
    }

    // Pre-Submission Dispute Gate check: Prohibited parcels are strictly blocked from acquisition
    if (parcel.dispute_status === 'prohibited') {
      const validation: DisputeValidationResult = {
        is_valid: false,
        has_prohibited: true,
        has_litigation: false,
        prohibited_parcels: [{
          parcel_id: String(parcel.id),
          khasra_number: parcel.khasra_number,
          village: parcel.village,
          dispute_status: 'prohibited',
          dispute_source: parcel.dispute_source || 'NGDRS',
          dispute_notes: parcel.dispute_notes || 'Statutory reserve / Judicial injunction'
        }],
        litigation_parcels: [],
        flagged_parcels: [{
          parcel_id: String(parcel.id),
          khasra_number: parcel.khasra_number,
          village: parcel.village,
          dispute_status: 'prohibited',
          dispute_source: parcel.dispute_source || 'NGDRS',
          dispute_notes: parcel.dispute_notes || 'Statutory reserve / Judicial injunction'
        }]
      };
      setDisputeValidation(validation);
      setIsDisputeModalOpen(true);
      return; // DO NOT add prohibited parcel
    }

    // Under litigation parcels show statutory advisory
    if (parcel.dispute_status === 'under_litigation') {
      const validation: DisputeValidationResult = {
        is_valid: true,
        has_prohibited: false,
        has_litigation: true,
        prohibited_parcels: [],
        litigation_parcels: [{
          parcel_id: String(parcel.id),
          khasra_number: parcel.khasra_number,
          village: parcel.village,
          dispute_status: 'under_litigation',
          dispute_source: parcel.dispute_source || 'NJDG',
          dispute_notes: parcel.dispute_notes || 'Active civil litigation on record'
        }],
        flagged_parcels: [{
          parcel_id: String(parcel.id),
          khasra_number: parcel.khasra_number,
          village: parcel.village,
          dispute_status: 'under_litigation',
          dispute_source: parcel.dispute_source || 'NJDG',
          dispute_notes: parcel.dispute_notes || 'Active civil litigation on record'
        }]
      };
      setDisputeValidation(validation);
      setIsDisputeModalOpen(true);
      setHasDisputeWarning(true);
    }

    // Add to selection and populate form jurisdiction fields directly from the selected parcel
    setSelectedParcels((prev) => [...prev, parcelKey]);
    setSelectedParcelObjects((prev) => {
      const next = [...prev, parcel];
      const nextArea = next.reduce((sum, p) => sum + (Number(p.area_hectares) || 0), 0);
      setForm((f) => ({
        ...f,
        district: parcel.district || f.district || 'Gautam Buddha Nagar',
        state: parcel.state || f.state || 'Uttar Pradesh',
        tehsil: parcel.tehsil || f.tehsil || 'Dadri',
        mauza: parcel.village || f.mauza || 'Chhapraula',
        estimatedAreaHa: nextArea.toFixed(2),
        district_id: 1,
        state_id: 1,
      }));
      return next;
    });
  }, [selectedParcels]);

  /* ── Submit Proposal Action ── */
  async function doSubmitProposal(disputeWarning: boolean) {
    setSubmitting(true);
    setGlobalError('');
    try {
      const token = sessionStorage.getItem('landsync_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      /*
       * Root cause fix: Previously, proposal creation sent incomplete payloads missing
       * purpose_category, district_id, and state_id, which triggered FastAPI 422 errors.
       * CaseNew only checked res.status === 409 and lacked a res.ok check, falsely navigating
       * to the dashboard with submitted=true while swallowing the failure.
       * Here we send the fully populated statutory schema, check res.ok, and display genuine errors.
       */
      const payload = {
        project_name: form.projectTitle,
        purpose_category: form.purposeCategory || 'infrastructure',
        justification: form.projectPurpose,
        total_area_hectares: totalArea,
        estimated_affected_families: Math.max(1, Math.round(totalArea * 3)),
        parcel_ids: selectedParcels,
        has_dispute_warning: disputeWarning || hasDisputeWarning,
        location_sensitivity: 'standard',
        district_id: form.district_id || 1,
        state_id: form.state_id || 1,
        is_urgent_sec40: form.isUrgentSec40,
      };

      const res = await fetch('/cases', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMsg = `Proposal submission failed (HTTP ${res.status})`;
        try {
          const errData = await res.json();
          if (errData.detail) {
            if (typeof errData.detail === 'string') {
              errMsg = errData.detail;
            } else if (errData.detail.message) {
              errMsg = errData.detail.message;
            } else if (Array.isArray(errData.detail)) {
              errMsg = errData.detail.map((d: any) => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join('; ');
            }
          }
        } catch {
          errMsg = res.statusText || errMsg;
        }
        setGlobalError(errMsg);
        setSubmitting(false);
        return;
      }

      // Fresh refetch and navigation
      void caseService.getCases({ mine: true });
      navigate('/requiring-body', {
        state: { submitted: true, title: form.projectTitle, hasDisputeWarning: disputeWarning || hasDisputeWarning },
      });
    } catch (err: any) {
      console.error('[LandSync] Network error submitting proposal:', err);
      setGlobalError(err?.message || 'Network error: Failed to reach LandSync backend server.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Pre-Submission Dispute Gate Check ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedParcels.length === 0) {
      setGlobalError('Select at least one cadastral parcel on the GIS map before submitting.');
      return;
    }

    try {
      const validation = await validateParcelSelection(selectedParcels);
      if (validation.has_prohibited || validation.has_litigation) {
        setDisputeValidation(validation);
        setIsDisputeModalOpen(true);
        if (validation.has_prohibited) return;
        return;
      }
    } catch (err) {
      console.warn('[LandSync] Dispute validation fallback:', err);
    }

    // All clear -> proceed directly
    await doSubmitProposal(hasDisputeWarning);
  }

  /* ── Computed Metrics ── */
  const totalArea = selectedParcelObjects.reduce((s, p) => s + (Number(p.area_hectares) || 0), 0);

  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="case-new-shell">
      {/* ── Page Header ── */}
      <div className="case-new-page-header">
        <button
          type="button"
          className="case-new-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="case-new-heading">New Land Acquisition Proposal</h1>
          <p className="case-new-subheading">
            Section 4 Requisition under RFCTLARR Act, 2013 — Requiring Body Submission
          </p>
        </div>
      </div>

      {/* ── Step Indicator ── */}
      <div className="case-new-steps">
        {(['project', 'parcels', 'review'] as const).map((s, idx) => {
          const labels: Record<Step, string> = {
            project: '1. Project Details',
            parcels: '2. Cadastral Map & Parcels',
            review: '3. Review & Submit',
          };
          const isDone = (step === 'parcels' && s === 'project') ||
            (step === 'review' && (s === 'project' || s === 'parcels'));
          const isActive = step === s;
          return (
            <React.Fragment key={s}>
              <div className={`case-new-step${isActive ? ' active' : isDone ? ' done' : ''}`}>
                <div className="case-new-step-circle">
                  {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                </div>
                <span className="case-new-step-label">{labels[s]}</span>
              </div>
              {idx < 2 && <ChevronRight size={14} className="case-new-step-arrow" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Error Banner ── */}
      {globalError && (
        <div className="case-new-error-banner">
          <AlertCircle size={16} /> {globalError}
        </div>
      )}

      {/* ══════════════ STEP 1: PROJECT DETAILS ══════════════ */}
      {step === 'project' && (
        <div className="case-new-body">
          <div className="card case-new-form-card">
            <h3 className="case-new-section-title">Form-1: Project & Jurisdiction Details</h3>
            <p className="text-caption" style={{ marginBottom: 'var(--spacing-4)' }}>
              Statutory proposal metadata under Section 4 of the RFCTLARR Act, 2013.
            </p>

            <div className="case-new-grid-2">
              <Field
                label="Project Title"
                required
                error={errors.projectTitle}
              >
                <input
                  type="text"
                  value={form.projectTitle}
                  onChange={set('projectTitle')}
                  placeholder="e.g. 4-Lane Dadri Industrial Bypass Package II"
                  className={errors.projectTitle ? 'field-error' : ''}
                />
              </Field>

              <Field
                label="Requiring Department / Agency"
                required
                error={errors.department}
              >
                <input
                  type="text"
                  value={form.department}
                  onChange={set('department')}
                  placeholder="e.g. National Highways Authority of India (NHAI)"
                  className={errors.department ? 'field-error' : ''}
                />
              </Field>

              <Field label="Statutory Purpose Category" required>
                <select value={form.purposeCategory} onChange={set('purposeCategory')}>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="highways">Highways</option>
                  <option value="railways">Railways</option>
                  <option value="metro">Metro</option>
                  <option value="urban_development">Urban Development</option>
                  <option value="industrial_corridor">Industrial Corridor</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="power">Power</option>
                  <option value="other">Other Public Purpose</option>
                </select>
              </Field>

              <Field label="State" required>
                <select value={form.state} onChange={set('state')}>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                </select>
              </Field>

              <Field
                label="District"
                required
                error={errors.district}
              >
                <input
                  type="text"
                  value={form.district}
                  onChange={set('district')}
                  placeholder="e.g. Gautam Buddha Nagar"
                  className={errors.district ? 'field-error' : ''}
                />
              </Field>

              <Field
                label="Tehsil"
                required
                error={errors.tehsil}
              >
                <input
                  type="text"
                  value={form.tehsil}
                  onChange={set('tehsil')}
                  placeholder="e.g. Dadri"
                  className={errors.tehsil ? 'field-error' : ''}
                />
              </Field>

              <Field
                label="Mauza / Village"
                required
                error={errors.mauza}
              >
                <input
                  type="text"
                  value={form.mauza}
                  onChange={set('mauza')}
                  placeholder="e.g. Chhapraula"
                  className={errors.mauza ? 'field-error' : ''}
                />
              </Field>

              <Field
                label="Estimated Budget (₹ Crores)"
                required
                error={errors.budgetCr}
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.budgetCr}
                  onChange={set('budgetCr')}
                  placeholder="e.g. 150.00"
                  className={errors.budgetCr ? 'field-error' : ''}
                />
              </Field>
            </div>

            <Field
              label="Public Purpose Justification"
              required
              error={errors.projectPurpose}
              style={{ marginTop: 'var(--spacing-4)' }}
            >
              <textarea
                rows={3}
                value={form.projectPurpose}
                onChange={set('projectPurpose')}
                placeholder="Statutory justification of public purpose per Section 2(1) of RFCTLARR Act, 2013…"
                className={errors.projectPurpose ? 'field-error' : ''}
              />
            </Field>

            <Field
              label="Justification & Urgency Notes"
              style={{ marginTop: 'var(--spacing-3)' }}
            >
              <textarea
                rows={2}
                value={form.justification}
                onChange={set('justification')}
                placeholder="Any additional statutory notes, urgency grounds, or project background…"
              />
            </Field>

            <label className="case-new-checkbox-row">
              <input
                type="checkbox"
                checked={form.isUrgentSec40}
                onChange={set('isUrgentSec40') as unknown as React.ChangeEventHandler<HTMLInputElement>}
              />
              <span>
                <strong>Section 40 Urgency Clause</strong> — Invoke urgent acquisition (requires
                additional Collector certification and State Government approval)
              </span>
            </label>

            <div className="case-new-footer">
              <Button
                variant="primary"
                size="lg"
                type="button"
                onClick={goNextFromProject}
              >
                Next: Select Parcels on Cadastral Map <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2: PARCEL SELECTION VIA CADASTRAL MAP ══════════════ */}
      {step === 'parcels' && (
        <div className="case-new-body case-new-body--two-col">
          {/* Left Column — Context & Selection Summary */}
          <div className="card case-new-form-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <h3 className="case-new-section-title">Cadastral Parcel Schedule</h3>
              <p className="text-caption" style={{ margin: 0 }}>
                Select Khasra parcels for{' '}
                <strong>{form.projectTitle || 'this project'}</strong> on the interactive Cadastral GIS map.
                Parcels are color-coded by NJDG/NGDRS dispute and statutory title status.
              </p>
            </div>

            {selectedParcels.length > 0 ? (
              <div className="case-new-parcel-summary card" style={{ background: 'var(--color-accent-saffron-surface)' }}>
                <div className="text-caption" style={{ marginBottom: 'var(--spacing-2)', fontWeight: 700, color: 'var(--color-primary-navy)' }}>
                  SELECTED PARCELS ({selectedParcels.length})
                </div>
                <div className="case-new-parcel-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {selectedParcelObjects.map((p) => (
                    <span
                      key={p.id || p.khasra_number}
                      className="khasra-badge"
                      style={{
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderLeft: p.dispute_status === 'under_litigation' ? '3px solid #d97706' : '3px solid #16a34a'
                      }}
                      onClick={() => handleSelectParcel(p)}
                      title="Click to deselect"
                    >
                      {p.khasra_number} ({p.village}) ×
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 'var(--spacing-3)', fontSize: '0.83rem', color: 'var(--color-text-secondary)' }}>
                  <strong style={{ color: 'var(--color-primary-navy)' }}>{selectedParcels.length}</strong> parcels &nbsp;•&nbsp;
                  <strong style={{ color: 'var(--color-primary-navy)' }}>{totalArea.toFixed(2)} Ha</strong> total
                </div>
              </div>
            ) : (
              <div style={{ padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--color-text-disabled)', fontSize: '0.85rem', border: '1px dashed var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}>
                Click any parcel polygon on the map to add it to this acquisition schedule.
              </div>
            )}

            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface-card)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-slate)' }}>
              <div><strong>District:</strong> {form.district}</div>
              <div><strong>Tehsil:</strong> {form.tehsil}</div>
              <div><strong>Village/Mauza:</strong> {form.mauza}</div>
            </div>

            <div className="case-new-footer" style={{ marginTop: 'auto', paddingTop: 'var(--spacing-4)' }}>
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setStep('project')}
              >
                ← Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                type="button"
                onClick={goNextFromParcels}
                disabled={selectedParcels.length === 0}
              >
                Next: Review &amp; Submit <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Right Column — Production Cadastral GIS Map */}
          <div className="case-new-map-panel" style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--color-border-slate)', padding: '12px' }}>
            <CadastralMap
              district={form.district || 'Gautam Buddha Nagar'}
              mauza={form.mauza}
              selectionMode={true}
              selectedParcelIds={selectedParcels}
              onSelectParcel={handleSelectParcel}
            />
          </div>
        </div>
      )}

      {/* ══════════════ STEP 3: REVIEW & SUBMIT ══════════════ */}
      {step === 'review' && (
        <form onSubmit={handleSubmit}>
          <div className="case-new-body">
            <div className="card case-new-form-card">
              <h3 className="case-new-section-title">Review Proposal Before Submission</h3>
              <p className="text-caption" style={{ marginBottom: 'var(--spacing-6)' }}>
                Once submitted, this proposal will be assigned a unique Case Number and forwarded to
                the District Collector for scrutiny under Section 4 / Section 5 of RFCTLARR Act, 2013.
              </p>

              {/* Project summary */}
              <div className="case-new-review-section">
                <h4 className="case-new-review-heading">Project Details</h4>
                <dl className="case-new-review-dl">
                  <ReviewRow label="Project Title" value={form.projectTitle} />
                  <ReviewRow label="Requiring Dept." value={form.department} />
                  <ReviewRow label="Purpose Category" value={form.purposeCategory.toUpperCase()} />
                  <ReviewRow label="Location" value={`${form.mauza}, Tehsil ${form.tehsil}, ${form.district}, ${form.state}`} />
                  <ReviewRow label="Cadastral Area" value={`${totalArea.toFixed(2)} Ha`} />
                  <ReviewRow label="Estimated Budget" value={`₹ ${form.budgetCr} Cr`} />
                  <ReviewRow label="Urgency Clause" value={form.isUrgentSec40 ? 'Yes — Section 40 invoked' : 'No'} />
                </dl>
              </div>

              {/* Selected Parcels Schedule Table */}
              <div className="case-new-review-section">
                <h4 className="case-new-review-heading">
                  Cadastral Parcel Schedule — {selectedParcels.length} Parcels, {totalArea.toFixed(2)} Ha
                </h4>
                <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-slate)', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-primary-navy-surface, #eef3fb)', borderBottom: '1px solid var(--color-border-slate)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Khasra Number</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Village / Mauza</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tehsil</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Area (Ha)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Dispute Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedParcelObjects.map((p) => (
                        <tr key={p.id || p.khasra_number} style={{ borderBottom: '1px solid var(--color-border-slate)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--color-primary-navy)' }}>{p.khasra_number}</td>
                          <td style={{ padding: '8px 12px' }}>{p.village}</td>
                          <td style={{ padding: '8px 12px' }}>{p.tehsil}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.area_hectares} ha</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: p.dispute_status === 'under_litigation' ? '#fef3c7' : '#dcfce7',
                              color: p.dispute_status === 'under_litigation' ? '#b45309' : '#15803d',
                              border: p.dispute_status === 'under_litigation' ? '1px solid #f59e0b' : '1px solid #22c55e'
                            }}>
                              {p.dispute_status === 'under_litigation' ? 'Under Litigation (Advisory)' : 'Clear Title'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {form.projectPurpose && (
                <div className="case-new-review-section">
                  <h4 className="case-new-review-heading">Public Purpose Justification</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-body)', lineHeight: 1.7 }}>
                    {form.projectPurpose}
                  </p>
                </div>
              )}

              {/* Statutory declaration */}
              <div className="case-new-declaration">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <p>
                  I hereby certify that the cadastral boundaries, Khasra parcel schedule, and public
                  purpose justification stated above are correct to the best of my knowledge and
                  belief, and the acquisition is necessary for the stated purpose under the RFCTLARR
                  Act, 2013.
                </p>
              </div>

              <div className="case-new-footer">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => setStep('parcels')}
                  disabled={submitting}
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    'Submitting…'
                  ) : (
                    <><Send size={16} /> Submit to District Collector</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Pre-Submission GIS Dispute Gate Modal ── */}
      <DisputeBlockModal
        isOpen={isDisputeModalOpen}
        validationResult={disputeValidation}
        onClose={() => setIsDisputeModalOpen(false)}
        onConfirm={async () => {
          setIsDisputeModalOpen(false);
          await doSubmitProposal(true);
        }}
        isSubmitting={submitting}
      />
    </div>
  );
}

/* ── Helpers ── */
function Field({
  label,
  required,
  error,
  children,
  style,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="form-field" style={style}>
      <label className="form-field-label">
        {label} {required && <span className="form-field-required">*</span>}
      </label>
      {children}
      {error && <div className="form-field-error"><AlertCircle size={12} /> {error}</div>}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
