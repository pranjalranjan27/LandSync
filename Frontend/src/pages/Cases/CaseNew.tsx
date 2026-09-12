/**
 * CaseNew — Land Acquisition Proposal Form (Section 4, RFCTLARR Act 2013)
 * Route: /cases/new
 * Access: REQUIRING_BODY only (ProtectedRoute enforces this in routes.tsx)
 *
 * Two-panel layout:
 *  Left  — form fields (project metadata, cadastral schedule builder)
 *  Right — ParcelSelectStub (parcel pool driven by mauza / district input)
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { ParcelSelectStub, type Parcel } from '../../components/ParcelSelectStub/ParcelSelectStub';
import { DisputeBlockModal } from '../../features/cases/DisputeBlockModal';
import { validateParcelSelection } from '../../lib/api/parcelsApi';
import type { DisputeValidationResult } from '../../types/parcel';
import { caseService } from '../../services/caseService';
import './CaseNew.css';

/* ──────────────────────────────────────────────────────── */
/*  Demo parcel pool — in prod comes from /parcels?mauza=  */
/* ──────────────────────────────────────────────────────── */
const POOL_RAMPUR: Parcel[] = [
  { khasraNumber: '442/19-A', mauza: 'Mauza Rampur', soilType: 'Terraced Irrigated (Talaon)', areaHectares: 12.4, ownerName: 'Surendra Singh Rawat', circleRatePerSqMtr: 1450, solatiumMultiplier: 2.0, dispute_status: 'clear' },
  { khasraNumber: '442/19-B', mauza: 'Mauza Rampur', soilType: 'Non-irrigated (Upraon)', areaHectares: 8.1, ownerName: 'Govind Ram Bhatt', circleRatePerSqMtr: 950, solatiumMultiplier: 2.0, dispute_status: 'under_litigation', dispute_source: 'NJDG', dispute_notes: 'Active partition suit in Civil Court Dadri (O.S. 312/2024)' },
  { khasraNumber: '445/02', mauza: 'Mauza Rampur', soilType: 'Settlement Residential', areaHectares: 4.75, ownerName: 'Kamala Devi Negi', circleRatePerSqMtr: 2800, solatiumMultiplier: 2.0, dispute_status: 'prohibited', dispute_source: 'NGDRS', dispute_notes: 'Statutory injunction — High Court stay order in PIL 1402/2023' },
  { khasraNumber: '448/11-C', mauza: 'Mauza Rampur', soilType: 'Pasture / Barren', areaHectares: 9.0, ownerName: 'Gram Sabha Rampur', circleRatePerSqMtr: 600, solatiumMultiplier: 2.0, dispute_status: 'clear' },
  { khasraNumber: '450/A', mauza: 'Mauza Rampur', soilType: 'Orchard / Horticulture', areaHectares: 2.3, ownerName: 'Prema Devi', circleRatePerSqMtr: 1900, solatiumMultiplier: 2.0, dispute_status: 'clear' },
  { khasraNumber: '101/A', mauza: 'Mauza Kanda', soilType: 'Terraced Irrigated (Talaon)', areaHectares: 3.2, ownerName: 'Ramesh Kumar Singh', circleRatePerSqMtr: 1200, solatiumMultiplier: 2.0, dispute_status: 'clear' },
  { khasraNumber: '102/B', mauza: 'Mauza Kanda', soilType: 'Non-irrigated (Upraon)', areaHectares: 1.8, ownerName: 'Suresh Prasad Rawat', circleRatePerSqMtr: 900, solatiumMultiplier: 2.0, dispute_status: 'under_litigation', dispute_source: 'State IGR', dispute_notes: 'Succession title dispute pending before Sub-Divisional Officer' },
  { khasraNumber: '103/C', mauza: 'Mauza Shivpuri', soilType: 'Forest Adjacent', areaHectares: 5.5, ownerName: 'Parbati Devi', circleRatePerSqMtr: 750, solatiumMultiplier: 2.0, dispute_status: 'clear' },
];

/* ──────────────────────────────────────────────────────── */

type Step = 'project' | 'parcels' | 'review';

interface FormState {
  projectTitle: string;
  projectPurpose: string;
  department: string;
  state: string;
  district: string;
  tehsil: string;
  mauza: string;
  estimatedAreaHa: string;
  budgetCr: string;
  isUrgentSec40: boolean;
  justification: string;
}

const INITIAL_FORM: FormState = {
  projectTitle: '',
  projectPurpose: '',
  department: '',
  state: 'Uttarakhand',
  district: 'Pauri Garhwal',
  tehsil: '',
  mauza: '',
  estimatedAreaHa: '',
  budgetCr: '',
  isUrgentSec40: false,
  justification: '',
};

export function CaseNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('project');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState('');

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
    if (!form.mauza.trim()) e.mauza = 'Mauza is required.';
    if (!form.estimatedAreaHa || Number(form.estimatedAreaHa) <= 0) e.estimatedAreaHa = 'Valid area is required.';
    if (!form.budgetCr || Number(form.budgetCr) <= 0) e.budgetCr = 'Valid budget estimate is required.';
    if (!form.projectPurpose.trim()) e.projectPurpose = 'Project purpose / public benefit justification is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateParcels(): boolean {
    if (selectedParcels.length === 0) {
      setGlobalError('Select at least one cadastral parcel before proceeding.');
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

  /* ── Submit Proposal Action ── */
  async function doSubmitProposal(hasDisputeWarning: boolean) {
    setSubmitting(true);
    setGlobalError('');
    try {
      const token = sessionStorage.getItem('landsync_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/cases', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          project_name: form.projectTitle,
          justification: form.projectPurpose,
          total_area_hectares: totalArea,
          estimated_affected_families: Math.max(1, Math.round(totalArea * 3)),
          parcel_ids: selectedParcels,
          has_dispute_warning: hasDisputeWarning,
          is_urgent_sec40: form.isUrgentSec40,
        }),
      });

      if (res.status === 409) {
        const errData = await res.json();
        setGlobalError(errData.detail?.message || 'Proposal rejected by pre-submission dispute gate.');
        setSubmitting(false);
        return;
      }

      void caseService.getCases({ mine: true });
      navigate('/requiring-body', {
        state: { submitted: true, title: form.projectTitle, hasDisputeWarning },
      });
    } catch {
      // Fallback simulation for offline demo
      void caseService.getCases({ mine: true });
      navigate('/requiring-body', {
        state: { submitted: true, title: form.projectTitle, hasDisputeWarning },
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Pre-Submission Dispute Gate Check ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedParcels.length === 0) return;

    // Check pool and API for disputes
    const poolFlagged = POOL_RAMPUR.filter(
      (p) => selectedParcels.includes(p.khasraNumber) && p.dispute_status && p.dispute_status !== 'clear'
    );

    let validation = await validateParcelSelection(selectedParcels);

    // Merge any POOL_RAMPUR mock disputes if offline/demo
    if (poolFlagged.length > 0 && validation.flagged_parcels.length === 0) {
      const flaggedItems = poolFlagged.map((p) => ({
        parcel_id: p.khasraNumber,
        khasra_number: p.khasraNumber,
        village: p.mauza.replace('Mauza ', ''),
        dispute_status: p.dispute_status!,
        dispute_source: p.dispute_source || 'NGDRS',
        dispute_notes: p.dispute_notes || 'Judicial encumbrance on record',
      }));

      const prohibited = flaggedItems.filter((f) => f.dispute_status === 'prohibited');
      const litigation = flaggedItems.filter((f) => f.dispute_status === 'under_litigation');

      validation = {
        is_valid: prohibited.length === 0,
        has_prohibited: prohibited.length > 0,
        has_litigation: litigation.length > 0,
        prohibited_parcels: prohibited,
        litigation_parcels: litigation,
        flagged_parcels: flaggedItems,
      };
    }

    // If any parcel is under litigation or prohibited, trigger the explanatory data-integrity modal
    if (validation.flagged_parcels.length > 0) {
      setDisputeValidation(validation);
      setIsDisputeModalOpen(true);
      return;
    }

    // All clear -> proceed directly
    await doSubmitProposal(false);
  }

  /* ── Computed ── */
  const selectedParcelObjects = POOL_RAMPUR.filter((p) =>
    selectedParcels.includes(p.khasraNumber)
  );
  const totalArea = selectedParcelObjects.reduce((s, p) => s + p.areaHectares, 0);

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
            project: 'Project Details',
            parcels: 'Parcel Selection',
            review: 'Review & Submit',
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
                  placeholder="e.g. 4-Lane Bypass Highway Package II"
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

              <Field label="State" required>
                <select value={form.state} onChange={set('state')}>
                  <option>Uttarakhand</option>
                  <option>Uttar Pradesh</option>
                  <option>Maharashtra</option>
                  <option>Rajasthan</option>
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
                  placeholder="e.g. Pauri Garhwal"
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
                  placeholder="e.g. Srinagar"
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
                  placeholder="e.g. Mauza Rampur"
                  className={errors.mauza ? 'field-error' : ''}
                />
              </Field>

              <Field
                label="Estimated Land Area (Hectares)"
                required
                error={errors.estimatedAreaHa}
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.estimatedAreaHa}
                  onChange={set('estimatedAreaHa')}
                  placeholder="e.g. 24.50"
                  className={errors.estimatedAreaHa ? 'field-error' : ''}
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
                Next: Select Parcels <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2: PARCEL SELECTION ══════════════ */}
      {step === 'parcels' && (
        <div className="case-new-body case-new-body--two-col">
          {/* Left — context + summary */}
          <div className="card case-new-form-card">
            <h3 className="case-new-section-title">Cadastral Parcel Schedule</h3>
            <p className="text-caption" style={{ marginBottom: 'var(--spacing-4)' }}>
              Select all Khasra parcels to be acquired for{' '}
              <strong>{form.projectTitle || 'this project'}</strong> in{' '}
              <strong>{form.mauza}, {form.district}</strong>. Only parcels verified in
              the Revenue Record (Khasra Register / Form-12) should be included.
            </p>

            {selectedParcels.length > 0 ? (
              <div className="case-new-parcel-summary card" style={{ background: 'var(--color-accent-saffron-surface)' }}>
                <div className="text-caption" style={{ marginBottom: 'var(--spacing-2)' }}>SELECTED PARCELS</div>
                <div className="case-new-parcel-tags">
                  {selectedParcels.map((k) => (
                    <span key={k} className="khasra-badge">{k}</span>
                  ))}
                </div>
                <div style={{ marginTop: 'var(--spacing-3)', fontSize: '0.83rem', color: 'var(--color-text-secondary)' }}>
                  <strong style={{ color: 'var(--color-primary-navy)' }}>{selectedParcels.length}</strong> parcels &nbsp;•&nbsp;
                  <strong style={{ color: 'var(--color-primary-navy)' }}>{totalArea.toFixed(2)} Ha</strong> total
                </div>
              </div>
            ) : (
              <div style={{ padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--color-text-disabled)', fontSize: '0.85rem', border: '1px dashed var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}>
                No parcels selected yet. Use the list on the right →
              </div>
            )}

            <div className="case-new-footer" style={{ marginTop: 'var(--spacing-6)' }}>
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
              >
                Next: Review &amp; Submit <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Right — parcel selector */}
          <div className="case-new-parcel-panel">
            <ParcelSelectStub
              selected={selectedParcels}
              onChange={setSelectedParcels}
              parcels={POOL_RAMPUR}
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
                the District Collector for scrutiny under Section 5 of RFCTLARR Act, 2013.
              </p>

              {/* Project summary */}
              <div className="case-new-review-section">
                <h4 className="case-new-review-heading">Project Details</h4>
                <dl className="case-new-review-dl">
                  <ReviewRow label="Project Title" value={form.projectTitle} />
                  <ReviewRow label="Requiring Dept." value={form.department} />
                  <ReviewRow label="Location" value={`${form.mauza}, Tehsil ${form.tehsil}, ${form.district}, ${form.state}`} />
                  <ReviewRow label="Estimated Area" value={`${form.estimatedAreaHa} Ha`} />
                  <ReviewRow label="Estimated Budget" value={`₹ ${form.budgetCr} Cr`} />
                  <ReviewRow label="Urgency Clause" value={form.isUrgentSec40 ? 'Yes — Section 40 invoked' : 'No'} />
                </dl>
              </div>

              <div className="case-new-review-section">
                <h4 className="case-new-review-heading">
                  Cadastral Parcel Schedule — {selectedParcels.length} Parcels, {totalArea.toFixed(2)} Ha
                </h4>
                <ParcelSelectStub
                  selected={selectedParcels}
                  onChange={setSelectedParcels}
                  parcels={POOL_RAMPUR}
                  readOnly
                />
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
