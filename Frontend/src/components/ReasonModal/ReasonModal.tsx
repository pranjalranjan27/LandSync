import React, { useState } from 'react';
import { Button } from '../Button/Button';
import { AlertTriangle, X } from 'lucide-react';

interface ReasonModalProps {
  isOpen: boolean;
  title: string;
  actionName: string;
  actionVariant?: 'primary' | 'secondary' | 'accent-kesari';
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ReasonModal({
  isOpen,
  title,
  actionName,
  actionVariant = 'accent-kesari',
  onClose,
  onSubmit
}: ReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Statutory reason / justification is required under RFCTLARR Act.');
      return;
    }
    onSubmit(reason.trim());
    setReason('');
    setError('');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 'var(--spacing-4)'
    }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-slate)', paddingBottom: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="var(--color-accent-kesari)" />
            <h4 style={{ margin: 0, color: 'var(--color-text-heading)' }}>{title}</h4>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 'var(--spacing-4)' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
            Official Justification &amp; Order Citation <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter statutory grounds, section citation, or revenue record discrepancy..."
            rows={4}
            style={{
              width: '100%',
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-slate)',
              fontFamily: 'var(--font-family-bilingual)',
              fontSize: '0.85rem'
            }}
          />
          {error && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: 4 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--spacing-4)' }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant={actionVariant}>
              {actionName}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
