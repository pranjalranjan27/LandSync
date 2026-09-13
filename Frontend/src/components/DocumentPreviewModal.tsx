import React, { useState, useEffect } from 'react';
import {
  X, Download, Eye, AlertCircle, FileText, FileSpreadsheet,
  Loader2, ShieldCheck, ExternalLink
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { downloadBlob } from '../utils/downloadBlob';

export interface DocumentItem {
  id: string | number;
  title?: string;
  filename?: string;
  mime_type?: string;
  stage?: string;
  fileSize?: string;
  category?: string;
  actSection?: string;
}

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is415Fallback, setIs415Fallback] = useState(false);
  const [fallbackDetail, setFallbackDetail] = useState<string>('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !doc) {
      if (previewBlobUrl) {
        window.URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      setError(null);
      setIs415Fallback(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    setIs415Fallback(false);

    const fetchPreview = async () => {
      try {
        let token: string | null = null;
        if (auth.currentUser) {
          try {
            token = await auth.currentUser.getIdToken();
          } catch {
            // fallback
          }
        }
        if (!token) {
          token = sessionStorage.getItem('landsync_token');
        }

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const numericId = String(doc.id).replace(/^[^\d]*/, '') || '1';
        const endpoints = [
          `/api/v1/documents/${numericId}/preview`,
          `/documents/${numericId}/preview`
        ];

        let res: Response | null = null;
        let lastErrDetail = '';

        for (const ep of endpoints) {
          try {
            const r = await fetch(ep, { headers });
            if (r.status === 415) {
              const data = await r.json().catch(() => ({}));
              lastErrDetail = data.detail || 'Inline preview not available for this file type — please download to view';
              res = r;
              break;
            } else if (r.ok) {
              res = r;
              break;
            } else if (r.status === 403) {
              const data = await r.json().catch(() => ({}));
              lastErrDetail = data.detail || 'Access denied: your jurisdiction does not have access to this document.';
              res = r;
              break;
            }
          } catch {
            // fallback
          }
        }

        if (!active) return;

        if (res && res.status === 415) {
          setIs415Fallback(true);
          setFallbackDetail(lastErrDetail);
          setLoading(false);
          return;
        }

        if (!res || !res.ok) {
          throw new Error(lastErrDetail || `Document preview unavailable (status ${res?.status || 500}).`);
        }

        const blob = await res.blob();
        if (!active) return;

        const url = window.URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
      } catch (err) {
        if (!active) return;
        console.error('[DocumentPreviewModal] Preview fetch failed:', err);
        setError((err as Error).message || 'Failed to load document preview.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      active = false;
      if (previewBlobUrl) {
        window.URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [isOpen, doc?.id]);

  const handleDownload = async () => {
    if (!doc) return;
    setIsDownloading(true);

    try {
      let token: string | null = null;
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch {
          // fallback
        }
      }
      if (!token) {
        token = sessionStorage.getItem('landsync_token');
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const numericId = String(doc.id).replace(/^[^\d]*/, '') || '1';
      const endpoints = [
        `/api/v1/documents/${numericId}/download`,
        `/documents/${numericId}/download`
      ];

      let res: Response | null = null;
      for (const ep of endpoints) {
        try {
          const r = await fetch(ep, { headers });
          if (r.ok) {
            res = r;
            break;
          }
        } catch {
          // fallback
        }
      }

      if (!res || !res.ok) {
        throw new Error('Failed to download document from server.');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      const filename = doc.filename || `${doc.title || 'document'}.pdf`;

      downloadBlob(blob, filename, disposition);
    } catch (err) {
      alert((err as Error).message || 'Failed to download document.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !doc) return null;

  const mimeType = (doc.mime_type || '').toLowerCase();
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType.includes('pdf') || (!mimeType.includes('spreadsheet') && !mimeType.includes('word') && !mimeType.includes('officedocument'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              <FileText size={20} />
            </div>
            <div className="truncate">
              <h3 className="text-base font-bold text-slate-900 truncate m-0">
                {doc.title || doc.filename || 'Statutory Document Preview'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                {doc.actSection && (
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.actSection}
                  </span>
                )}
                {doc.category && <span>Category: {doc.category}</span>}
                {doc.fileSize && <span>• {doc.fileSize}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-sm disabled:opacity-60"
            >
              {isDownloading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
              <span>{isDownloading ? 'Downloading...' : 'Download File'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 flex flex-col items-center justify-center min-h-[420px]">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-sm font-medium">Fetching verified statutory document...</span>
            </div>
          )}

          {/* 415 Fallback Notice (Honest unsupported preview message) */}
          {!loading && is415Fallback && (
            <div className="max-w-md w-full p-6 bg-white border border-amber-200 rounded-2xl shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Preview Not Available for this File Format
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-5">
                {fallbackDetail ||
                  'Inline browser preview is not supported for formatted workbooks (.xlsx) or Word documents (.docx). Please download the file to inspect the complete figures and statutory schedules.'}
              </p>
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownload}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                {isDownloading ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
                <span>{isDownloading ? 'Downloading...' : 'Download Document to View'}</span>
              </button>
            </div>
          )}

          {/* Error State */}
          {!loading && !is415Fallback && error && (
            <div className="max-w-md w-full p-6 bg-white border border-red-200 rounded-2xl shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Unable to Load Document
              </h4>
              <p className="text-xs text-red-600 mb-4">{error}</p>
              <button
                type="button"
                onClick={handleDownload}
                className="py-2 px-4 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                Try Direct Download
              </button>
            </div>
          )}

          {/* Success: PDF Rendering */}
          {!loading && !is415Fallback && !error && previewBlobUrl && isPdf && (
            <div className="w-full h-full flex-1 flex flex-col">
              <iframe
                src={previewBlobUrl}
                title={doc.title || 'Document Preview'}
                className="w-full h-[620px] rounded-xl border border-slate-200 bg-white shadow-inner"
              />
            </div>
          )}

          {/* Success: Image Rendering */}
          {!loading && !is415Fallback && !error && previewBlobUrl && isImage && (
            <div className="w-full flex items-center justify-center p-4">
              <img
                src={previewBlobUrl}
                alt={doc.title || 'Document image'}
                className="max-h-[620px] max-w-full rounded-xl border border-slate-200 object-contain bg-white shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-white">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck size={14} />
            <span>e-Office / LandSync Verified Document</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
