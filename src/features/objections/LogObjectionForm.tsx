import React, { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { ShieldAlert, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LogObjectionForm() {
  const [objectorName, setObjectorName] = useState('');
  const [caseId, setCaseId] = useState('case-001');
  const [khasraNo, setKhasraNo] = useState('442/19-A');
  const [grounds, setGrounds] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page-container" style={{ maxWidth: '780px' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2>File Statutory Objection under Section 15(1)</h2>
        <p className="text-caption">
          Any person interested in any land notified under Section 11(1) may, within 60 days from the date of publication, object to the acquisition.
        </p>
      </div>

      {submitted ? (
        <div className="card" style={{ backgroundColor: 'var(--color-accent-green-surface)', border: '1px solid var(--color-accent-green)', padding: 'var(--spacing-6)' }}>
          <h3 style={{ color: 'var(--color-accent-green)', marginBottom: 'var(--spacing-2)' }}>
            ✓ Objection Registered Successfully
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-body)', marginBottom: 'var(--spacing-4)' }}>
            Your objection under Section 15 has been recorded in the statutory audit registry under Docket No:{' '}
            <strong className="text-mono-id">OBJ-2026-UK-0841</strong>. Notice for hearing before the District Collector will be issued via SMS/Postal delivery.
          </p>
          <Button variant="primary" onClick={() => navigate('/cases')}>
            Return to Case Registry
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border-slate)', paddingBottom: 'var(--spacing-3)' }}>
            <ShieldAlert size={20} color="var(--color-accent-kesari)" />
            <h4 style={{ margin: 0 }}>Section 15 Landowner Grievance Form</h4>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
              Full Name of Landowner / Interested Person *
            </label>
            <input
              required
              type="text"
              value={objectorName}
              onChange={(e) => setObjectorName(e.target.value)}
              placeholder="e.g. Surendra Singh Rawat"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                Case File ID *
              </label>
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="case-001">UK-PAURI-2026-00192 (Rishikesh-Karanprayag Rail)</option>
                <option value="case-002">MH-THN-2026-00814 (Bullet Train Thane Corridor)</option>
                <option value="case-003">UP-NOIDA-2026-00045 (Noida Airport Jewar)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                Affected Khasra Number *
              </label>
              <input
                required
                type="text"
                value={khasraNo}
                onChange={(e) => setKhasraNo(e.target.value)}
                placeholder="e.g. 442/19-A"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
              Statutory Grounds of Objection *
            </label>
            <select style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
              <option>Objection to Public Purpose (Section 15(1)(a))</option>
              <option>Objection to Suitability of Land Proposed (Section 15(1)(b))</option>
              <option>Objection to Justification in SIA Report (Section 15(1)(c))</option>
              <option>Dispute in Boundary, Area, or Tree/Structure Enumeration</option>
              <option>Non-inclusion of Co-sharer / Joint Title Holder</option>
            </select>

            <textarea
              required
              rows={4}
              value={grounds}
              onChange={(e) => setGrounds(e.target.value)}
              placeholder="State detailed grounds with specific reference to revenue records, Mauza map discrepancies, or dwelling structures..."
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-2)' }}>
            <Button type="submit" variant="accent-kesari" size="lg">
              <Send size={16} /> File Formal Section 15 Objection
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
