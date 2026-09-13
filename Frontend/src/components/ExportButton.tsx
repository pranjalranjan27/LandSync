import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { downloadBlob } from '../utils/downloadBlob';

export interface ExportButtonProps {
  resource: string;
  filters?: Record<string, string | number | boolean | undefined | null>;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

type ExportFormat = 'csv' | 'xlsx' | 'docx';

export const ExportButton: React.FC<ExportButtonProps> = ({
  resource,
  filters = {},
  label = 'Export',
  variant = 'secondary',
  size = 'sm',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleExport = async (format: ExportFormat) => {
    setIsOpen(false);
    setIsExporting(true);
    setActiveFormat(format);
    setErrorMessage(null);

    try {
      // Build query string matching active screen filters
      const params = new URLSearchParams();
      params.set('format', format);

      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
          params.set(k, String(v));
        }
      });

      // Retrieve Firebase auth token or session fallback
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

      const headers: Record<string, string> = {
        Accept: '*/*'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Try /api/v1/export/{resource} first, fallback to /export/{resource}
      const endpoints = [
        `/api/v1/export/${resource}?${params.toString()}`,
        `/export/${resource}?${params.toString()}`
      ];

      let res: Response | null = null;
      let lastErr: string | null = null;

      for (const ep of endpoints) {
        try {
          const r = await fetch(ep, { headers });
          if (r.ok) {
            res = r;
            break;
          } else if (r.status === 403) {
            const errData = await r.json().catch(() => ({}));
            lastErr = errData.detail || 'Access denied: You do not have permission to export records outside your jurisdiction.';
            break;
          } else if (r.status === 400) {
            const errData = await r.json().catch(() => ({}));
            lastErr = errData.detail || 'Invalid export request criteria.';
            break;
          }
        } catch (e) {
          lastErr = (e as Error).message;
        }
      }

      if (!res || !res.ok) {
        throw new Error(lastErr || `Export failed with status ${res?.status || 500}.`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      const fallbackName = `${resource}_export.${format}`;

      downloadBlob(blob, fallbackName, disposition);
    } catch (err) {
      console.error('[ExportButton] Failed to export resource:', err);
      const msg = (err as Error).message || 'Failed to export records. Please try again.';
      setErrorMessage(msg);
      // Auto-clear error after 6 seconds
      setTimeout(() => setErrorMessage(null), 6000);
    } finally {
      setIsExporting(false);
      setActiveFormat(null);
    }
  };

  // Base styling matching LandSync UI system
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const variantClasses =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
      : variant === 'outline'
      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        disabled={isExporting}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 font-medium rounded-lg border transition-all duration-150 ${sizeClasses} ${variantClasses} disabled:opacity-60 disabled:cursor-not-allowed`}
        title="Export records in CSV, Excel, or Word format"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isExporting ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />
        ) : (
          <Download size={size === 'sm' ? 14 : 16} className="text-slate-500" />
        )}
        <span>{isExporting ? `Exporting (${activeFormat?.toUpperCase()})...` : label}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Choose Format
          </div>

          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
          >
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
              CSV
            </div>
            <div>
              <div className="font-semibold text-slate-900">CSV Spreadsheet</div>
              <div className="text-[10px] text-slate-400">Plain text data interchange</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
          >
            <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center">
              <FileSpreadsheet size={13} />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Excel (.xlsx)</div>
              <div className="text-[10px] text-slate-400">Formatted workbook with headers</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport('docx')}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
          >
            <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center">
              <FileText size={13} />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Word Document (.docx)</div>
              <div className="text-[10px] text-slate-400">Official statutory table layout</div>
            </div>
          </button>
        </div>
      )}

      {/* Error notification banner */}
      {errorMessage && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Export Failed</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-700 font-bold ml-1"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
