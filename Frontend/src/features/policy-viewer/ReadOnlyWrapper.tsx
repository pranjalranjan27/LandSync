import React from 'react';
import { Eye } from 'lucide-react';

interface ReadOnlyWrapperProps {
  isReadOnly: boolean;
  roleName: string;
  children: React.ReactNode;
}

export function ReadOnlyWrapper({ isReadOnly, roleName, children }: ReadOnlyWrapperProps) {
  if (!isReadOnly) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        backgroundColor: 'var(--color-accent-saffron-surface)',
        border: '1px solid var(--color-accent-kesari)',
        color: 'var(--color-primary-navy)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        marginBottom: 'var(--spacing-4)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.8rem',
        fontWeight: 600
      }}>
        <Eye size={15} color="var(--color-accent-kesari)" />
        <span>READ-ONLY VIEW MODE ({roleName}) — Action buttons and data mutations are disabled per statutory access policy.</span>
      </div>

      <div style={{ opacity: 0.95 }}>
        {children}
      </div>
    </div>
  );
}
