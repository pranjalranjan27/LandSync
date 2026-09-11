import React, { useState } from 'react';
import { History, Shield, Flag, FileText } from 'lucide-react';
import './AuditLogFeed.css';

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  timestamp: string;
  remarks?: string;
  documentUrl?: string;
  flagged?: { by: string; at: string };
}

export interface AuditLogFeedProps {
  entries?: AuditLogEntry[];
  logs?: any[]; // Compatibility with legacy callers
  onFlag?: (entryId: string) => void;
  title?: string;
  className?: string;
}

export const AuditLogFeed: React.FC<AuditLogFeedProps> = ({
  entries,
  logs,
  onFlag,
  title = 'Statutory Audit Trail',
  className = ''
}) => {
  // Normalize incoming entries
  const initialEntries: AuditLogEntry[] = (entries || logs || []).map((item) => {
    return {
      id: item.id || `log-${Math.random().toString(36).substr(2, 9)}`,
      actorName: item.actorName || item.actor || item.userName || 'Authorized Officer',
      actorRole: item.actorRole || item.role || 'Official',
      action: item.action || item.event || item.description || 'Statutory Action Recorded',
      timestamp: item.timestamp || item.date || item.createdAt || new Date().toISOString(),
      remarks: item.remarks || item.notes || item.details,
      documentUrl: item.documentUrl || item.docUrl || item.attachmentUrl,
      flagged: item.flagged
    };
  });

  // Track flagged items locally so clicks immediately render the visual flag marker
  const [localFlagged, setLocalFlagged] = useState<Record<string, { by: string; at: string }>>({});

  const handleFlagClick = (id: string) => {
    if (localFlagged[id]) return;

    const newFlag = {
      by: 'Reviewing Officer',
      at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLocalFlagged((prev) => ({ ...prev, [id]: newFlag }));
    if (onFlag) {
      onFlag(id);
    }
  };

  // Render in reverse-chronological order (newest first)
  const sortedEntries = [...initialEntries].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    if (isNaN(timeA) || isNaN(timeB)) return 0;
    return timeB - timeA;
  });

  return (
    <div className={`audit-feed-container ${className}`}>
      <div className="audit-feed-header">
        <h4 className="audit-feed-title">
          <History size={18} />
          <span>{title}</span>
        </h4>
        <span className="audit-feed-badge-immutable">
          <Shield size={12} />
          <span>Append-Only Cryptographic Log</span>
        </span>
      </div>

      {sortedEntries.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', background: '#F8FAFC', borderRadius: '6px', fontSize: '0.88rem' }}>
          No audit entries recorded for this case yet.
        </div>
      ) : (
        <ul className="audit-feed-list">
          {sortedEntries.map((entry) => {
            const flagInfo = entry.flagged || localFlagged[entry.id];
            const isFlagged = Boolean(flagInfo);

            return (
              <li
                key={entry.id}
                className={`audit-entry-card ${isFlagged ? 'is-flagged' : ''}`}
              >
                <div className="audit-entry-top">
                  <div className="audit-entry-actor-block">
                    <span className="audit-entry-actor-name">{entry.actorName}</span>
                    <span className="audit-entry-role-badge">{entry.actorRole}</span>
                  </div>
                  <span className="audit-entry-time">{entry.timestamp}</span>
                </div>

                <div className="audit-entry-action">{entry.action}</div>

                {entry.remarks && (
                  <div className="audit-entry-remarks">{entry.remarks}</div>
                )}

                <div className="audit-entry-bottom">
                  {entry.documentUrl ? (
                    <a
                      href={entry.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="audit-entry-doc-link"
                    >
                      <FileText size={13} />
                      <span>View Gazette / Order Document</span>
                    </a>
                  ) : <div />}

                  {/* Flagging control: read-only if flagged, otherwise clickable */}
                  {isFlagged ? (
                    <span className="audit-flag-marker" title={`Flagged by ${flagInfo?.by || 'Officer'}`}>
                      <span>🚩</span>
                      <span>Flagged for review by {flagInfo?.by || 'Officer'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="audit-flag-btn"
                      onClick={() => handleFlagClick(entry.id)}
                      title="Flag this entry for supervisor audit review"
                    >
                      <Flag size={12} />
                      <span>Flag for Review</span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AuditLogFeed;
