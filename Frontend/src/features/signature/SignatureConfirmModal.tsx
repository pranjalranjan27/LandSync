import React, { useState, useEffect } from 'react';
import { FileSignature, ShieldCheck, X, CheckSquare, Square, Lock, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/Button/Button';
import type { SignatureActionType } from '../../types/signature';

interface SignatureConfirmModalProps {
  isOpen: boolean;
  actionTitle: string;
  actionType: SignatureActionType;
  caseId: string | number;
  onClose: () => void;
  onSubmit: (result: {
    remarks: string;
    evidenceDocumentId: string;
    payloadHash?: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function SignatureConfirmModal({
  isOpen,
  actionTitle,
  actionType,
  caseId,
  onClose,
  onSubmit,
  isSubmitting = false,
}: SignatureConfirmModalProps) {
  const { user } = useAuth();
  const [remarks, setRemarks] = useState('');
  const [evidenceDocId, setEvidenceDocId] = useState(
    actionType === 'notification_published'
      ? 'DOC-SEC11-GAZETTE-2026-001'
      : actionType === 'award_declared'
      ? 'DOC-SEC19-AWARD-SCHEDULE-2026'
      : 'DOC-COLLECTOR-REJECT-ORDER-2026'
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsConfirmed(false);
      setError(null);
      setRemarks('');
      setEvidenceDocId(
        actionType === 'notification_published'
          ? 'DOC-SEC11-GAZETTE-2026-001'
          : actionType === 'award_declared'
          ? 'DOC-SEC19-AWARD-SCHEDULE-2026'
          : 'DOC-COLLECTOR-REJECT-ORDER-2026'
      );
    }
  }, [isOpen, actionType]);

  if (!isOpen) return null;

  const officerName = user?.name || 'Priya Singh, IAS';
  const officerRole = user?.role || 'COLLECTOR';
  const officerDesignation = user?.designation || 'District Collector & Magistrate';
  const officerJurisdiction = `${user?.district || 'Gautam Buddha Nagar'}, ${user?.state || 'Uttar Pradesh'}`;
  const timestamp = new Date().toISOString();

  // Simulated client-side preview hash for the officer's signature block preview
  const previewPayload = `${caseId}|${actionType}|${officerRole}|${timestamp}|${user?.id || 'uid-1'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setError('You must confirm the statutory declaration and digitally sign before proceeding.');
      return;
    }
    if (!evidenceDocId.trim()) {
      setError('An evidence document reference is mandatory under RFCTLARR statutory rules.');
      return;
    }

    try {
      await onSubmit({
        remarks: remarks.trim() || `Officially certified and digitally signed: ${actionTitle}`,
        evidenceDocumentId: evidenceDocId.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signature authorization failed.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sig-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <FileSignature size={22} />
            </div>
            <div>
              <h3 id="sig-modal-title" className="font-bold text-lg text-white m-0 leading-tight">
                Digital Signature Authorization: {actionTitle}
              </h3>
              <p className="text-xs text-slate-300 m-0 mt-0.5">
                Section 3 IT Act, 2000 • e-Office Framework Tamper-Evident Attestation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              {error}
            </div>
          )}

          {/* Evidence Document Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Evidence / Decision Document Reference *
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FileText size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={evidenceDocId}
                  onChange={(e) => setEvidenceDocId(e.target.value)}
                  placeholder="e.g. DOC-GAZETTE-SEC11-2026-001"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-2 rounded-lg border border-slate-200">
                Mandatory Upload
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Every status-advancing statutory order must reference an officially uploaded Gazette, Award, or Rejection proceeding.
            </p>
          </div>

          {/* Officer Remarks / Statutory Justification */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Officer Statutory Remarks &amp; Recorded Justification
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={`Enter official remarks supporting this statutory decision under the RFCTLARR Act, 2013…`}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Cryptographic Signature Block Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-indigo-200 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-950">
                <Lock size={13} className="text-indigo-600" />
                <span>e-Office Cryptographic Signature Certificate Preview</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Section 3 IT Act
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Signer Officer</span>
                <span className="font-semibold text-slate-900">{officerName}</span>
                <span className="text-slate-500 block text-[11px]">{officerDesignation}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Department &amp; Jurisdiction</span>
                <span className="font-semibold text-slate-900">{officerRole}</span>
                <span className="text-slate-500 block text-[11px]">{officerJurisdiction}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Statutory Action</span>
                <span className="font-mono font-semibold text-indigo-900">{actionType}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Attestation Timestamp</span>
                <span className="font-mono text-slate-700">{timestamp.replace('T', ' ').slice(0, 19)} UTC</span>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-100 text-[11px] text-slate-600 space-y-1">
              <div className="font-mono text-[10px] text-slate-500 truncate bg-white p-1.5 rounded border border-slate-200">
                <strong>Payload Hash: </strong>
                <span>sha256(case_id:{caseId} + action:{actionType} + user:{user?.id || 'uid'} + ts:{timestamp})</span>
              </div>
              <p className="text-[10px] text-slate-400 m-0 leading-tight">
                * Simulated CCA Class-3 DSC / Aadhaar e-Sign. Generates a tamper-evident SHA-256 digest appended to the immutable case audit ledger.
              </p>
            </div>
          </div>

          {/* Mandatory Checkbox UI Gate */}
          <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-200 hover:bg-indigo-50 transition-colors">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              <div className="mt-0.5 shrink-0 text-indigo-700">
                {isConfirmed ? (
                  <CheckSquare size={20} className="text-indigo-600" />
                ) : (
                  <Square size={20} className="text-slate-400" />
                )}
              </div>
              <div className="text-xs text-indigo-950 font-medium leading-relaxed">
                <strong>Digital Signature Affirmation: </strong>
                I confirm this action and am digitally signing this document in my official capacity as{' '}
                <strong>{officerDesignation}</strong> under the RFCTLARR Act, 2013.
              </div>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={!isConfirmed || isSubmitting}
            >
              {isSubmitting ? (
                'Applying Digital Signature…'
              ) : (
                <>
                  <ShieldCheck size={16} /> Sign &amp; Commit Action
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
