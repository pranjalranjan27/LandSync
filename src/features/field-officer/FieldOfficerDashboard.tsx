import { useState } from 'react';
import { mockCases } from '../../mock-data/cases';
import { Compass, UploadCloud, MapPin } from 'lucide-react';
import { Button } from '../../components/Button/Button';

export function FieldOfficerDashboard() {
  const [selectedCase, setSelectedCase] = useState(mockCases[0]);
  const [inspectionNote, setInspectionNote] = useState('');

  const handleUploadGeo = () => {
    alert(`Georeferenced cadastral inspection log uploaded for Khasra ${selectedCase.khasraNumbers[0]}`);
    setInspectionNote('');
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2>Field Officer / Patwari Ground-Truthing Portal (क्षेत्र अधिकारी)</h2>
        <p className="text-caption">
          On-site cadastral inspection, tree/structure inventory verification, and GPS coordinate tagging.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
        {/* Inspection Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-3)' }}>
            <Compass size={18} color="var(--color-primary-navy)" />
            <h4 style={{ margin: 0 }}>Log Ground Inspection (Form-B)</h4>
          </div>

          <div style={{ marginBottom: 'var(--spacing-3)' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Select Acquisition Project</label>
            <select
              value={selectedCase.id}
              onChange={(e) => {
                const found = mockCases.find((c) => c.id === e.target.value);
                if (found) setSelectedCase(found);
              }}
              style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
            >
              {mockCases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.projectTitle.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-3)' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Khasra Verification Checklist</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" defaultChecked /> Boundary pillars matched with Mauza Shajra Map
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" defaultChecked /> Standing crop type and age recorded
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" /> Wells / Tubewells / Irrigation structures enumerated
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-3)' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Inspection Field Notes</label>
            <textarea
              rows={3}
              value={inspectionNote}
              onChange={(e) => setInspectionNote(e.target.value)}
              placeholder="e.g. 12 mature mango trees verified on Khasra 442/19-A; boundary dispute on eastern edge resolved."
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" size="sm" onClick={handleUploadGeo}>
              <UploadCloud size={14} /> Submit Verified Field Log
            </Button>
          </div>
        </div>

        {/* Cadastral Schedule Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-3)' }}>
            <MapPin size={18} color="var(--color-accent-kesari)" />
            <h4 style={{ margin: 0 }}>Active Parcels under Inspection</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {selectedCase.parcels.map((p) => (
              <div key={p.khasraNumber} style={{ padding: 'var(--spacing-3)', background: 'var(--color-surface-offwhite)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-slate)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="khasra-badge">{p.khasraNumber}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.areaHectares} Hectares</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Owner: {p.ownerName} • Soil: {p.soilType}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
