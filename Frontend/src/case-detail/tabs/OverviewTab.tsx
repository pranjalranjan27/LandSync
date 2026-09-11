/**
 * OverviewTab — Phase 3, Prompt 4
 * KPI cards + parcel table + role-gated action loop
 * Every action requires a remark via ReasonModal before submission.
 */
import { useState } from 'react';
import type { Case } from '../../types/case';
import {
  IndianRupee, MapPin, Users, Award,
  CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp,
  AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { ReasonModal } from '../../components/ReasonModal/ReasonModal';
import { usePermissions } from '../../hooks/usePermissions';
import { caseService } from '../../services/caseService';
import './OverviewTab.css';

interface OverviewTabProps {
  caseItem: Case;
  onCaseUpdate?: (updated: Case) => void;
}

/* ─────────────────────────────────────────────
   Action definitions per stage + role
───────────────────────────────────────────── */
interface ActionDef {
  key: string;
  label: string;
  description: string;
  variant: 'primary' | 'secondary' | 'accent-kesari';
  /** Which roles can take this action */
  allowedRoles: string[];
  /** Which stages expose this action */
  activeAtStages: string[];
  /** Next stage after this action */
  nextStage?: string;
  /** Style for urgency / danger */
  isDanger?: boolean;
}

const ACTIONS: ActionDef[] = [
  // Collector: approve → forward to State Review
  {
    key: 'approve_forward',
    label: 'Approve & Forward',
    description: 'Approve proposal and forward to State Secretariat for Section 5 scrutiny',
    variant: 'primary',
    allowedRoles: ['COLLECTOR'],
    activeAtStages: ['proposal_submitted'],
    nextStage: 'state_review',
  },
  // Collector: return for clarification
  {
    key: 'return_clarification',
    label: 'Return for Clarification',
    description: 'Return proposal to Requiring Body for deficit rectification',
    variant: 'accent-kesari',
    allowedRoles: ['COLLECTOR'],
    activeAtStages: ['proposal_submitted'],
    nextStage: 'returned_for_clarification',
  },
  // Collector: reject
  {
    key: 'reject',
    label: 'Reject Proposal',
    description: 'Reject proposal with statutory reasoning on record',
    variant: 'accent-kesari',
    allowedRoles: ['COLLECTOR'],
    activeAtStages: ['proposal_submitted'],
    nextStage: 'rejected',
    isDanger: true,
  },
  // Requiring Body: resubmit after return
  {
    key: 'resubmit',
    label: 'Resubmit with Revisions',
    description: 'Resubmit the corrected proposal to the Collector',
    variant: 'primary',
    allowedRoles: ['REQUIRING_BODY'],
    activeAtStages: ['returned_for_clarification'],
    nextStage: 'proposal_submitted',
  },
  // State Approver: approve SIA commissioning
  {
    key: 'commission_sia',
    label: 'Commission SIA Study',
    description: 'Commission Social Impact Assessment with Expert Committee',
    variant: 'primary',
    allowedRoles: ['STATE_APPROVER', 'COLLECTOR'],
    activeAtStages: ['state_review'],
    nextStage: 'sia_in_progress',
  },
  // SIA Expert: submit verdict
  {
    key: 'submit_sia_verdict',
    label: 'Submit SIA Verdict',
    description: 'Submit Expert Committee Social Impact Assessment report',
    variant: 'primary',
    allowedRoles: ['SIA_EXPERT'],
    activeAtStages: ['sia_in_progress'],
    nextStage: 'sia_complete',
  },
  // Collector: publish Sec 11 notification
  {
    key: 'publish_sec11',
    label: 'Publish Sec.11 Notification',
    description: 'Issue Section 11(1) Preliminary Gazette Notification',
    variant: 'primary',
    allowedRoles: ['COLLECTOR', 'STATE_APPROVER'],
    activeAtStages: ['sia_complete'],
    nextStage: 'notification_published',
  },
  // Collector: declare Section 19 award
  {
    key: 'declare_award',
    label: 'Declare Sec.19 Award',
    description: 'Issue Section 19 Declaration of Land Acquisition',
    variant: 'primary',
    allowedRoles: ['COLLECTOR'],
    activeAtStages: ['objections_window', 'notification_published'],
    nextStage: 'award_declared',
  },
  // RR Admin: disburse compensation
  {
    key: 'disburse_compensation',
    label: 'Confirm DBT Disbursement',
    description: 'Mark Aadhaar-linked Direct Benefit Transfer as executed',
    variant: 'primary',
    allowedRoles: ['RR_ADMIN', 'COLLECTOR'],
    activeAtStages: ['award_declared'],
    nextStage: 'compensation_disbursed',
  },
  // Field Officer: confirm possession
  {
    key: 'confirm_possession',
    label: 'Confirm Possession Taken',
    description: 'Confirm physical possession handed over to Requiring Body',
    variant: 'primary',
    allowedRoles: ['FIELD_OFFICER', 'COLLECTOR', 'RR_ADMIN'],
    activeAtStages: ['compensation_disbursed'],
    nextStage: 'possession_taken',
  },
];

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export function OverviewTab({ caseItem, onCaseUpdate }: OverviewTabProps) {
  const { role } = usePermissions();
  const [activeModal, setActiveModal] = useState<ActionDef | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [parcelExpanded, setParcelExpanded] = useState(false);

  const currentStage = caseItem.stage.toLowerCase();

  /* Filter actions visible to this role at this stage */
  const availableActions = ACTIONS.filter(
    (a) =>
      a.allowedRoles.includes(role) &&
      a.activeAtStages.some((s) => s === currentStage)
  );

  async function handleAction(action: ActionDef, reason: string) {
    setActiveModal(null);
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let updated: Case;
      if (action.key === 'resubmit') {
        updated = await caseService.resubmitCase(caseItem.id, reason);
      } else {
        // Generic mock: simulate a stage transition
        await new Promise((r) => setTimeout(r, 600));
        updated = {
          ...caseItem,
          stage: (action.nextStage || caseItem.stage) as Case['stage'],
          lastUpdated: new Date().toISOString().split('T')[0],
          auditTrail: [
            ...caseItem.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toISOString(),
              actorName: `[${role}] (current session)`,
              actorRole: role,
              action: action.key.toUpperCase() as Case['auditTrail'][number]['action'],
              stage: (action.nextStage || caseItem.stage) as Case['stage'],
              details: reason,
              sha256Hash: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
            },
          ],
        };
      }

      setSuccessMsg(`Action "${action.label}" recorded. Case moved to ${action.nextStage?.replace(/_/g, ' ') ?? 'next stage'}.`);
      onCaseUpdate?.(updated);
    } catch (err) {
      setErrorMsg(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>

      {/* ── Action Zone (role-gated) ── */}
      {availableActions.length > 0 && (
        <div className="overview-action-zone">
          <div className="overview-action-zone-header">
            <span className="text-caption">PENDING ACTION FOR YOUR ROLE</span>
            <StatusBadge stage={caseItem.stage} />
          </div>

          {loading && (
            <div className="overview-action-loading">
              <Loader2 size={16} className="spin-icon" />
              Processing action…
            </div>
          )}

          {successMsg && (
            <div className="overview-action-success">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="overview-action-error">
              <XCircle size={16} /> {errorMsg}
            </div>
          )}

          {!loading && (
            <div className="overview-action-buttons">
              {availableActions.map((action) => (
                <div key={action.key} className="overview-action-item">
                  <Button
                    variant={action.isDanger ? 'accent-kesari' : action.variant}
                    size="md"
                    type="button"
                    onClick={() => setActiveModal(action)}
                  >
                    {action.key === 'approve_forward' && <CheckCircle2 size={15} />}
                    {action.key === 'reject' && <XCircle size={15} />}
                    {action.key === 'return_clarification' && <RotateCcw size={15} />}
                    {action.key === 'resubmit' && <RotateCcw size={15} />}
                    {action.label}
                  </Button>
                  <span className="overview-action-desc">{action.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {availableActions.length === 0 && (
        <div className="overview-readonly-notice">
          <AlertTriangle size={15} />
          No actions are available for your role (<strong>{role}</strong>) at the current stage
          (<strong>{currentStage.replace(/_/g, ' ')}</strong>). This case is read-only for you.
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
        <div className="card">
          <div className="text-caption">TOTAL NOTIFIED AREA</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-navy)', marginTop: 4 }}>
            {caseItem.totalAreaHectares} Ha
          </div>
          <span className="text-caption">Across {caseItem.khasraNumbers.length} Khasra parcels</span>
        </div>

        <div className="card">
          <div className="text-caption">AFFECTED FAMILIES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-heading)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Users size={20} /> {caseItem.affectedFamiliesCount}
          </div>
          <span className="text-caption">Eligible for R&amp;R Second Schedule</span>
        </div>

        <div className="card">
          <div className="text-caption">ESTIMATED COMPENSATION</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent-kesari)', display: 'flex', alignItems: 'center', marginTop: 4 }}>
            <IndianRupee size={20} /> {(caseItem.totalEstimatedCompensation / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-caption">Includes 100% statutory solatium</span>
        </div>

        <div className="card">
          <div className="text-caption">DISBURSED VIA DBT</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent-green)', display: 'flex', alignItems: 'center', marginTop: 4 }}>
            <Award size={20} /> {(caseItem.disbursedCompensation / 10000000).toFixed(2)} Cr
          </div>
          <span className="text-caption">Direct Aadhaar Bank Transfer</span>
        </div>
      </div>

      {/* ── Details ── */}
      <div className="card">
        <h4 style={{ marginBottom: 'var(--spacing-4)', color: 'var(--color-primary-navy)' }}>
          Statutory Jurisdiction &amp; Administrative Hierarchy
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-4)' }}>
          <div>
            <span className="text-caption">STATE &amp; DISTRICT</span>
            <div style={{ fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={14} /> {caseItem.district}, {caseItem.state}
            </div>
          </div>
          <div>
            <span className="text-caption">TEHSIL &amp; MAUZA</span>
            <div style={{ fontWeight: 600, marginTop: 2 }}>
              Tehsil {caseItem.tehsil} • Mauza {caseItem.mauza}
            </div>
          </div>
          <div>
            <span className="text-caption">REQUIRING DEPARTMENT</span>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{caseItem.requiringDepartment}</div>
          </div>
          <div>
            <span className="text-caption">LEGAL CITATION</span>
            <div style={{ fontWeight: 600, marginTop: 2, color: 'var(--color-primary-navy)' }}>
              {caseItem.rfctlarrActCitation}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cadastral Parcel Schedule (collapsible) ── */}
      <div className="card">
        <button
          type="button"
          className="overview-parcel-toggle"
          onClick={() => setParcelExpanded((v) => !v)}
          aria-expanded={parcelExpanded}
        >
          <h4 style={{ margin: 0, color: 'var(--color-primary-navy)' }}>
            Cadastral Land Schedule ({caseItem.parcels.length} Khasra parcels)
          </h4>
          {parcelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {parcelExpanded && (
          <div style={{ marginTop: 'var(--spacing-4)', overflowX: 'auto' }}>
            <table className="type-table">
              <thead>
                <tr>
                  <th>Khasra Number</th>
                  <th>Mauza</th>
                  <th>Soil / Land Class</th>
                  <th>Area (Ha)</th>
                  <th>Recorded Title Holder</th>
                  <th>Circle Rate (₹/m²)</th>
                  <th>Solatium Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {caseItem.parcels.map((p) => (
                  <tr key={p.khasraNumber}>
                    <td><span className="khasra-badge">{p.khasraNumber}</span></td>
                    <td>{p.mauza}</td>
                    <td>{p.soilType}</td>
                    <td style={{ fontWeight: 600 }}>{p.areaHectares}</td>
                    <td>{p.ownerName}</td>
                    <td>₹ {p.circleRatePerSqMtr}</td>
                    <td><span className="badge-green">{p.solatiumMultiplier}x (100%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Reason Modal ── */}
      {activeModal && (
        <ReasonModal
          isOpen
          title={activeModal.label}
          actionName={`Confirm: ${activeModal.label}`}
          actionVariant={activeModal.isDanger ? 'accent-kesari' : 'primary'}
          onClose={() => setActiveModal(null)}
          onSubmit={(reason) => handleAction(activeModal, reason)}
        />
      )}
    </div>
  );
}
