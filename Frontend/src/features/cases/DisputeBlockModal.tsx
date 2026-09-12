import React, { useState, useEffect } from 'react';
import { AlertOctagon, AlertTriangle, X, ShieldAlert, CheckSquare, Square, ArrowRight, ExternalLink } from 'lucide-react';
import type { DisputeValidationResult } from '../../types/parcel';
import { Button } from '../../components/Button/Button';

interface DisputeBlockModalProps {
  isOpen: boolean;
  validationResult: DisputeValidationResult | null;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function DisputeBlockModal({
  isOpen,
  validationResult,
  onClose,
  onConfirm,
  isSubmitting = false,
}: DisputeBlockModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
    }
  }, [isOpen]);

  if (!isOpen || !validationResult) return null;

  const { has_prohibited, has_litigation, flagged_parcels, prohibited_parcels, litigation_parcels } =
    validationResult;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Banner */}
        <div
          className={`px-6 py-4 flex items-center justify-between text-white ${
            has_prohibited
              ? 'bg-red-600'
              : 'bg-amber-600'
          }`}
        >
          <div className="flex items-center gap-3">
            {has_prohibited ? (
              <AlertOctagon size={24} className="text-white shrink-0" />
            ) : (
              <AlertTriangle size={24} className="text-white shrink-0" />
            )}
            <div>
              <h3 id="dispute-modal-title" className="font-semibold text-lg text-white m-0 leading-tight">
                {has_prohibited
                  ? 'Data-Integrity Gate: Statutory Acquisition Blocked'
                  : 'Data-Integrity Gate: Active Land Litigation Advisory'}
              </h3>
              <p className="text-xs text-white/90 m-0 mt-0.5">
                Statutory GIS Cross-Verification (NGDRS / NJDG Real Property Registry)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Regulatory explanation block */}
          {has_prohibited ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-sm leading-relaxed flex items-start gap-3">
              <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-1 text-red-800">
                  Statutory Injunction &amp; Inalienable Prohibition
                </strong>
                One or more selected Khasra parcels carry an active judicial stay order or statutory
                prohibition (registered in NGDRS / State IGR). Under Section 11 &amp; Section 12
                guidelines of the RFCTLARR Act, 2013, proposal submission is strictly prohibited. You
                must remove prohibited parcels from the cadastral schedule before proceeding.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm leading-relaxed flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-1 text-amber-800">
                  Legal Dispute Notice &amp; Conditional Allowance
                </strong>
                The selected cadastral schedule includes parcels under active litigation registered in
                the National Judicial Data Grid (NJDG). The proposal may be submitted, but the case will
                be flagged with a permanent <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-xs">has_dispute_warning</code> tag.
                Disputed compensation may be deposited before the Authority under Section 77.
              </div>
            </div>
          )}

          {/* Flagged Parcels List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Flagged Cadastral Parcels ({flagged_parcels.length})
              </span>
              <span className="text-xs text-slate-500">Gautam Buddha Nagar Revenue Division</span>
            </div>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto bg-slate-50/50">
              {flagged_parcels.map((p) => {
                const isProhibited = p.dispute_status === 'prohibited';
                return (
                  <div key={p.parcel_id || p.khasra_number} className="p-3.5 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm px-2 py-0.5 bg-slate-100 rounded border border-slate-300">
                          {p.khasra_number}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">
                          Village {p.village}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.dispute_source && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            <ExternalLink size={10} /> {p.dispute_source}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wide ${
                            isProhibited
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isProhibited ? 'Prohibited' : 'Under Litigation'}
                        </span>
                      </div>
                    </div>

                    {p.dispute_notes && (
                      <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/80 leading-relaxed font-sans">
                        <strong className="text-slate-700">Encumbrance Record: </strong>
                        {p.dispute_notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Litigation Acknowledgment Checkbox (Only if NOT prohibited) */}
          {!has_prohibited && has_litigation && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-300 hover:bg-slate-100/70 transition-colors">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <div className="mt-0.5 shrink-0 text-indigo-700">
                  {acknowledged ? (
                    <CheckSquare size={19} className="text-indigo-600" />
                  ) : (
                    <Square size={19} className="text-slate-400" />
                  )}
                </div>
                <div className="text-xs text-slate-800 leading-relaxed font-medium">
                  <strong>Statutory Declaration: </strong>
                  I acknowledge this parcel has an active litigation flag and am proceeding with the
                  proposal under Section 4 of the RFCTLARR Act, 2013, with full departmental awareness.
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
          >
            {has_prohibited ? 'Return to Parcel Selection' : 'Cancel'}
          </Button>

          {has_prohibited ? (
            <button
              type="button"
              disabled
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
            >
              Submission Blocked by Statutory Prohibition
            </button>
          ) : (
            <Button
              variant="primary"
              size="md"
              type="button"
              disabled={!acknowledged || isSubmitting}
              onClick={onConfirm}
            >
              {isSubmitting ? (
                'Submitting Proposal…'
              ) : (
                <>
                  Acknowledge &amp; Submit Proposal <ArrowRight size={16} />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
