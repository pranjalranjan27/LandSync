/**
 * DocumentsPage — /documents
 * All case-related documents with search, filters, tabs, detail panel.
 * Design matches the provided mockup screenshot.
 */
import { useState, useMemo } from 'react';
import {
  FileText, FileSpreadsheet, Upload, Download, Eye,
  Share2, Trash2, Search, ChevronDown, ChevronLeft,
  ChevronRight, MoreVertical, X, CheckSquare, Square,
  Filter, SortAsc
} from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../locales';
import './DocumentsPage.css';

/* ─── Types ──────────────────────────────────────── */
type DocType = 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'IMG';
type DocTab = 'all' | 'my_uploads' | 'shared' | 'recycle_bin';

interface Document {
  id: string;
  name: string;
  description: string;
  caseId: string;
  type: DocType;
  stage: string;
  uploadedBy: string;
  uploaderRole: string;
  uploadDate: string; // ISO
  fileSizeMb: number;
  isShared: boolean;
  isMine: boolean;
  isDeleted: boolean;
}

/* ─── Mock data ──────────────────────────────────── */
const MOCK_DOCS: Document[] = [
  { id: 'd-001', name: 'Land Acquisition Proposal.pdf', description: 'Initial proposal submitted by requiring body', caseId: 'LA-2025-0214', type: 'PDF', stage: 'Proposal Submitted', uploadedBy: 'Rohit Mehta', uploaderRole: 'Requiring Body', uploadDate: '2026-09-10T11:24:00Z', fileSizeMb: 2.4, isShared: true, isMine: false, isDeleted: false },
  { id: 'd-002', name: 'SIA Report.docx', description: 'Social Impact Assessment Report', caseId: 'LA-2025-0187', type: 'DOCX', stage: 'SIA Complete', uploadedBy: 'Dr. Neha Verma', uploaderRole: 'SIA Expert', uploadDate: '2026-09-08T09:00:00Z', fileSizeMb: 5.1, isShared: true, isMine: false, isDeleted: false },
  { id: 'd-003', name: 'Public Hearing Minutes.pdf', description: 'Minutes of public hearing', caseId: 'LA-2025-0179', type: 'PDF', stage: 'Objections Window', uploadedBy: 'Amit Sharma', uploaderRole: 'State Approver', uploadDate: '2026-09-05T14:00:00Z', fileSizeMb: 1.2, isShared: false, isMine: false, isDeleted: false },
  { id: 'd-004', name: 'R&R Family List.xlsx', description: 'List of affected families', caseId: 'LA-2025-0168', type: 'XLSX', stage: 'R&R In Progress', uploadedBy: 'Vikram Patel', uploaderRole: 'R&R Administrator', uploadDate: '2026-09-02T10:00:00Z', fileSizeMb: 0.8, isShared: true, isMine: false, isDeleted: false },
  { id: 'd-005', name: 'Compensation Disbursal Order.pdf', description: 'Order for compensation disbursal', caseId: 'LA-2025-0156', type: 'PDF', stage: 'Compensation Disbursed', uploadedBy: 'Priya Singh', uploaderRole: 'District Collector', uploadDate: '2026-08-28T16:00:00Z', fileSizeMb: 0.6, isShared: false, isMine: true, isDeleted: false },
  { id: 'd-006', name: 'Possession Certificate.pdf', description: 'Field verification and possession report', caseId: 'LA-2025-0143', type: 'PDF', stage: 'Possession Taken', uploadedBy: 'Arjun Kumar', uploaderRole: 'Field Officer', uploadDate: '2026-08-20T09:30:00Z', fileSizeMb: 1.8, isShared: true, isMine: false, isDeleted: false },
  { id: 'd-007', name: 'Environmental Clearance.docx', description: 'Environmental clearance from MoEFCC', caseId: 'LA-2025-0128', type: 'DOCX', stage: 'State Review', uploadedBy: 'Amit Sharma', uploaderRole: 'State Approver', uploadDate: '2026-08-12T11:00:00Z', fileSizeMb: 3.3, isShared: true, isMine: false, isDeleted: false },
  { id: 'd-008', name: 'Gazette Notification.pdf', description: 'Notification under Section 11', caseId: 'LA-2025-0111', type: 'PDF', stage: 'Notification Issued', uploadedBy: 'Priya Singh', uploaderRole: 'District Collector', uploadDate: '2026-08-05T08:00:00Z', fileSizeMb: 0.4, isShared: false, isMine: true, isDeleted: false },
  { id: 'd-009', name: 'Site Inspection Report.pdf', description: 'Field inspection and geo-tag report', caseId: 'LA-2025-0108', type: 'PDF', stage: 'Field Verification', uploadedBy: 'Arjun Kumar', uploaderRole: 'Field Officer', uploadDate: '2026-08-01T07:00:00Z', fileSizeMb: 4.7, isShared: true, isMine: false, isDeleted: false },
  { id: 'd-010', name: 'R&R Development Plan.docx', description: 'Rehabilitation and resettlement plan', caseId: 'LA-2025-0101', type: 'DOCX', stage: 'R&R In Progress', uploadedBy: 'Vikram Patel', uploaderRole: 'R&R Administrator', uploadDate: '2026-07-25T12:00:00Z', fileSizeMb: 2.1, isShared: false, isMine: false, isDeleted: false },
  { id: 'd-011', name: 'Award Calculation Sheet.xlsx', description: 'Solatium and compensation computation', caseId: 'LA-2025-0092', type: 'XLSX', stage: 'Award Declared', uploadedBy: 'Priya Singh', uploaderRole: 'District Collector', uploadDate: '2026-07-18T10:00:00Z', fileSizeMb: 1.5, isShared: true, isMine: true, isDeleted: false },
  { id: 'd-012', name: 'Objection Register.pdf', description: 'Compiled Section 15 objections', caseId: 'LA-2025-0087', type: 'PDF', stage: 'Objections Window', uploadedBy: 'Priya Singh', uploaderRole: 'District Collector', uploadDate: '2026-07-10T09:00:00Z', fileSizeMb: 0.9, isShared: true, isMine: true, isDeleted: false },
  // Deleted
  { id: 'd-013', name: 'Draft Proposal v1.pdf', description: 'Draft — superseded', caseId: 'LA-2025-0214', type: 'PDF', stage: 'Proposal Submitted', uploadedBy: 'Rohit Mehta', uploaderRole: 'Requiring Body', uploadDate: '2026-09-01T10:00:00Z', fileSizeMb: 1.1, isShared: false, isMine: false, isDeleted: true },
];

const PAGE_SIZE = 10;

/* ─── Helpers ────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* Document type badge */
function TypeBadge({ type }: { type: DocType }) {
  const colors: Record<DocType, string> = {
    PDF: 'doc-type--pdf',
    DOCX: 'doc-type--docx',
    XLSX: 'doc-type--xlsx',
    CSV: 'doc-type--csv',
    IMG: 'doc-type--img',
  };
  return <span className={`doc-type-badge ${colors[type]}`}>{type}</span>;
}

/* Stage badge */
function StageBadge({ stage }: { stage: string }) {
  return <span className="doc-stage-badge">{stage}</span>;
}

/* ─── Component ──────────────────────────────────── */
export function DocumentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<DocTab>('all');
  const [search, setSearch] = useState('');
  const [caseFilter, setCaseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [selected, setSelected] = useState<Document | null>(MOCK_DOCS[0]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  /* ── Filtering ── */
  const baseList = useMemo(() => {
    switch (tab) {
      case 'my_uploads': return MOCK_DOCS.filter((d) => d.isMine && !d.isDeleted);
      case 'shared': return MOCK_DOCS.filter((d) => d.isShared && !d.isDeleted);
      case 'recycle_bin': return MOCK_DOCS.filter((d) => d.isDeleted);
      default: return MOCK_DOCS.filter((d) => !d.isDeleted);
    }
  }, [tab]);

  const filtered = useMemo(() => {
    return baseList.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.caseId.toLowerCase().includes(q) || d.uploadedBy.toLowerCase().includes(q);
      const matchCase = !caseFilter || d.caseId === caseFilter;
      const matchType = !typeFilter || d.type === typeFilter;
      const matchStage = !stageFilter || d.stage === stageFilter;
      return matchSearch && matchCase && matchType && matchStage;
    });
  }, [baseList, search, caseFilter, typeFilter, stageFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Unique filter options */
  const caseIds = [...new Set(MOCK_DOCS.filter((d) => !d.isDeleted).map((d) => d.caseId))];
  const types = [...new Set(MOCK_DOCS.map((d) => d.type))];
  const stages = [...new Set(MOCK_DOCS.filter((d) => !d.isDeleted).map((d) => d.stage))];

  /* ── Checkbox logic ── */
  const allChecked = pageItems.length > 0 && pageItems.every((d) => checked.has(d.id));
  function toggleAll() {
    if (allChecked) {
      const next = new Set(checked);
      pageItems.forEach((d) => next.delete(d.id));
      setChecked(next);
    } else {
      const next = new Set(checked);
      pageItems.forEach((d) => next.add(d.id));
      setChecked(next);
    }
  }
  function toggleOne(id: string) {
    const next = new Set(checked);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  }

  function resetFilters() {
    setSearch('');
    setCaseFilter('');
    setTypeFilter('');
    setStageFilter('');
    setPage(1);
  }

  function handleTabChange(t: DocTab) {
    setTab(t);
    setPage(1);
    setChecked(new Set());
  }

  return (
    <div className="page-container docs-page">
      {/* ── Page header ── */}
      <div className="docs-page-header">
        <div>
          <h1 className="docs-page-title">{t('common.nav.documents', 'Documents')}</h1>
          <p className="docs-page-subtitle">{t('cases.detailTabs.documents', 'Access, manage and download all case related documents.')}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => alert('Upload dialog — coming soon')}>
          <Upload size={15} /> {t('common.export', 'Upload Document')}
        </Button>
      </div>

      {/* ── Layout ── */}
      <div className="docs-layout">
        {/* ── Left: table panel ── */}
        <div className="docs-table-panel">
          {/* Tabs */}
          <div className="docs-tabs">
            {([
              { key: 'all', label: t('common.all', 'All Documents') },
              { key: 'my_uploads', label: t('dashboard.activeCases', 'My Uploads') },
              { key: 'shared', label: t('dashboard.pendingReview', 'Shared With Me') },
              { key: 'recycle_bin', label: t('common.delete', 'Recycle Bin') },
            ] as const).map((tItem) => (
              <button
                key={tItem.key}
                role="tab"
                aria-selected={tab === tItem.key}
                className={`docs-tab${tab === tItem.key ? ' docs-tab--active' : ''}`}
                onClick={() => handleTabChange(tItem.key)}
              >
                {tItem.label}
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className="docs-filters">
            <div className="docs-search-wrap">
              <Search size={14} className="docs-search-icon" />
              <input
                type="text"
                className="docs-search-input"
                placeholder={t('common.search', 'Search documents...')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <div className="docs-filter-selects">
              <label className="docs-filter-label">Case</label>
              <select className="docs-filter-select" value={caseFilter} onChange={(e) => { setCaseFilter(e.target.value); setPage(1); }}>
                <option value="">All Cases</option>
                {caseIds.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>

              <label className="docs-filter-label">Document Type</label>
              <select className="docs-filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>

              <label className="docs-filter-label">Stage</label>
              <select className="docs-filter-select" value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}>
                <option value="">All Stages</option>
                {stages.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <button className="docs-check-btn" onClick={toggleAll} aria-label="Select all">
                      {allChecked
                        ? <CheckSquare size={15} style={{ color: 'var(--color-primary-navy)' }} />
                        : <Square size={15} style={{ color: 'var(--color-text-disabled)' }} />}
                    </button>
                  </th>
                  <th>Document Name</th>
                  <th>Case ID</th>
                  <th>Type</th>
                  <th>Stage</th>
                  <th>Uploaded By</th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Date <SortAsc size={12} /></span>
                  </th>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="docs-empty-row">
                      No documents found. {(search || caseFilter || typeFilter || stageFilter) && (
                        <button className="docs-clear-filters" onClick={resetFilters}>Clear filters</button>
                      )}
                    </td>
                  </tr>
                )}
                {pageItems.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`docs-table-row${selected?.id === doc.id ? ' docs-table-row--active' : ''}`}
                    onClick={() => setSelected(doc)}
                  >
                    <td onClick={(e) => { e.stopPropagation(); toggleOne(doc.id); }}>
                      <button className="docs-check-btn" aria-label="Select document">
                        {checked.has(doc.id)
                          ? <CheckSquare size={15} style={{ color: 'var(--color-primary-navy)' }} />
                          : <Square size={15} style={{ color: 'var(--color-text-disabled)' }} />}
                      </button>
                    </td>
                    <td>
                      <div className="docs-name-cell">
                        <DocFileIcon type={doc.type} />
                        <div>
                          <div className="docs-filename">{doc.name}</div>
                          <div className="docs-filedesc">{doc.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="docs-case-id">{doc.caseId}</span>
                    </td>
                    <td><TypeBadge type={doc.type} /></td>
                    <td><StageBadge stage={doc.stage} /></td>
                    <td>
                      <div className="docs-uploader">{doc.uploadedBy}</div>
                      <div className="docs-uploader-role">{doc.uploaderRole}</div>
                    </td>
                    <td className="docs-date-cell">{shortDate(doc.uploadDate)}</td>
                    <td onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                      <button
                        className="docs-menu-btn"
                        onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                        aria-label="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenu === doc.id && (
                        <div className="docs-context-menu">
                          <button onClick={() => { alert(`Downloading ${doc.name}`); setOpenMenu(null); }}>
                            <Download size={13} /> Download
                          </button>
                          <button onClick={() => { alert(`Previewing ${doc.name}`); setOpenMenu(null); }}>
                            <Eye size={13} /> Preview
                          </button>
                          <button onClick={() => { alert(`Sharing ${doc.name}`); setOpenMenu(null); }}>
                            <Share2 size={13} /> Share
                          </button>
                          <button className="docs-context-danger" onClick={() => { alert(`Moving ${doc.name} to recycle bin`); setOpenMenu(null); }}>
                            <Trash2 size={13} /> Move to Recycle Bin
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="docs-pagination">
            <span className="docs-page-info">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} documents
            </span>
            <div className="docs-page-controls">
              <button className="docs-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`docs-page-btn${p === page ? ' docs-page-btn--active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="docs-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Detail panel ── */}
        {selected && (
          <div className="docs-detail-panel card">
            <div className="docs-detail-header">
              <span className="docs-detail-heading">Document Details</span>
              <button className="docs-detail-close" onClick={() => setSelected(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* File icon + name */}
            <div className="docs-detail-file">
              <DocFileIcon type={selected.type} size="lg" />
              <div>
                <div className="docs-detail-filename">{selected.name}</div>
                <div className="docs-detail-filedesc">{selected.description}</div>
              </div>
            </div>

            {/* Metadata */}
            <table className="docs-detail-meta">
              <tbody>
                <tr><td>Case ID</td><td><strong>{selected.caseId}</strong></td></tr>
                <tr><td>Document Type</td><td><TypeBadge type={selected.type} /></td></tr>
                <tr><td>Stage</td><td><StageBadge stage={selected.stage} /></td></tr>
                <tr><td>Uploaded By</td><td>{selected.uploadedBy}<br /><span className="docs-detail-meta-sub">{selected.uploaderRole}</span></td></tr>
                <tr><td>Upload Date</td><td>{formatDate(selected.uploadDate)}</td></tr>
                <tr><td>File Size</td><td>{selected.fileSizeMb} MB</td></tr>
              </tbody>
            </table>

            {/* Preview placeholder */}
            <div className="docs-detail-preview">
              <DocFileIcon type={selected.type} size="lg" />
              <span className="docs-detail-preview-label">{selected.name.replace(/\.[^.]+$/, '')}</span>
            </div>

            {/* CTAs */}
            <div className="docs-detail-ctas">
              <Button variant="secondary" size="md" onClick={() => alert(`Downloading ${selected.name}`)}>
                <Download size={14} /> Download
              </Button>
              <Button variant="secondary" size="md" onClick={() => alert(`Previewing ${selected.name}`)}>
                <Eye size={14} /> Preview
              </Button>
            </div>

            <Button
              variant="secondary"
              size="md"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => alert(`Sharing ${selected.name}`)}
            >
              <Share2 size={14} /> Share Document
            </Button>

            <button
              className="docs-detail-delete"
              onClick={() => alert(`Moving ${selected.name} to recycle bin`)}
            >
              <Trash2 size={14} /> Move to Recycle Bin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Doc file icon ── */
function DocFileIcon({ type, size = 'sm' }: { type: DocType; size?: 'sm' | 'lg' }) {
  const colorMap: Record<DocType, string> = {
    PDF: '#dc2626',
    DOCX: '#2563eb',
    XLSX: '#16a34a',
    CSV: '#16a34a',
    IMG: '#9333ea',
  };
  const dim = size === 'lg' ? 44 : 32;
  const icon = type === 'XLSX' || type === 'CSV'
    ? <FileSpreadsheet size={size === 'lg' ? 22 : 16} color="#fff" />
    : <FileText size={size === 'lg' ? 22 : 16} color="#fff" />;

  return (
    <div
      className="doc-file-icon"
      style={{
        width: dim, height: dim, minWidth: dim,
        background: colorMap[type],
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}
