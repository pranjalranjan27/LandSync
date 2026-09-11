import type { AuditLogItem } from '../../types/case';
import { Shield, Clock } from 'lucide-react';

interface AuditLogEntryProps {
  entry: AuditLogItem;
}

export function AuditLogEntry({ entry }: AuditLogEntryProps) {
  const formattedDate = new Date(entry.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div style={{ 
      display: 'flex', 
      gap: 'var(--spacing-3)', 
      padding: 'var(--spacing-3) 0', 
      borderBottom: '1px solid var(--color-border-slate)' 
    }}>
      <div style={{ marginTop: '2px', color: 'var(--color-primary-navy)' }}>
        <Shield size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-heading)' }}>
              {entry.actorName}
            </span>
            <span className="text-caption" style={{ marginLeft: 6 }}>
              ({entry.actorRole})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
            <Clock size={12} />
            <span>{formattedDate}</span>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-body)', marginTop: 4 }}>
          {entry.details}
        </p>

        {entry.justificationReason && (
          <div style={{ 
            marginTop: 4, 
            padding: '4px 8px', 
            background: 'var(--color-accent-saffron-surface)', 
            borderLeft: '2px solid var(--color-accent-kesari)', 
            fontSize: '0.75rem', 
            color: 'var(--color-text-heading)' 
          }}>
            <strong>Official Reason:</strong> {entry.justificationReason}
          </div>
        )}

        <div style={{ marginTop: 4 }}>
          <span className="text-mono-id" style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>
            SHA-256: {entry.sha256Hash}
          </span>
        </div>
      </div>
    </div>
  );
}
