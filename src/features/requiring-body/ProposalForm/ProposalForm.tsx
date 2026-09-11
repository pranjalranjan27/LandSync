import React, { useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { ParcelMapStub } from './ParcelMapStub';
import { Send, Plus, Trash2 } from 'lucide-react';

interface ProposalFormProps {
  onSuccess: () => void;
}

export function ProposalForm({ onSuccess }: ProposalFormProps) {
  const [projectTitle, setProjectTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [district, setDistrict] = useState('Pauri Garhwal');
  const [mauza, setMauza] = useState('');
  const [khasraInput, setKhasraInput] = useState('');
  const [khasras, setKhasras] = useState<string[]>(['101/A', '102/B']);
  const [areaHectares, setAreaHectares] = useState('');
  const [budgetCr, setBudgetCr] = useState('');

  const addKhasra = () => {
    if (khasraInput.trim() && !khasras.includes(khasraInput.trim())) {
      setKhasras([...khasras, khasraInput.trim()]);
      setKhasraInput('');
    }
  };

  const removeKhasra = (k: string) => {
    setKhasras(khasras.filter((item) => item !== k));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Land Acquisition Proposal "${projectTitle}" under Section 4 submitted successfully!`);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      <h3 style={{ color: 'var(--color-primary-navy)' }}>Form-1: Land Acquisition Proposal (Section 4)</h3>
      <p className="text-caption">
        Statutory proposal submission by Requiring Body to the District Collector under RFCTLARR Act, 2013.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-4)' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Project Title *</label>
          <input
            required
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g. 4-Lane Bypass Highway Package II"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Requiring Department / Agency *</label>
          <input
            required
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. National Highways Authority of India (NHAI)"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>District *</label>
          <input
            required
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Mauza / Village *</label>
          <input
            required
            type="text"
            value={mauza}
            onChange={(e) => setMauza(e.target.value)}
            placeholder="e.g. Mauza Rampur"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Estimated Land Area (Hectares) *</label>
          <input
            required
            type="number"
            step="0.01"
            value={areaHectares}
            onChange={(e) => setAreaHectares(e.target.value)}
            placeholder="e.g. 24.50"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Estimated Budget (₹ Crores) *</label>
          <input
            required
            type="number"
            step="0.01"
            value={budgetCr}
            onChange={(e) => setBudgetCr(e.target.value)}
            placeholder="e.g. 150.00"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
      </div>

      {/* Khasra Schedule Builder */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
          Cadastral Khasra Schedule
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-2)' }}>
          <input
            type="text"
            value={khasraInput}
            onChange={(e) => setKhasraInput(e.target.value)}
            placeholder="Add Khasra No. (e.g. 442/19-A)"
            style={{ padding: '6px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)', width: '220px' }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addKhasra}>
            <Plus size={14} /> Add Khasra
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {khasras.map((k) => (
            <span key={k} className="khasra-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {k}
              <button
                type="button"
                onClick={() => removeKhasra(k)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <ParcelMapStub khasras={khasras} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-2)' }}>
        <Button type="submit" variant="primary" size="lg">
          <Send size={16} /> Submit Proposal to District Collector
        </Button>
      </div>
    </form>
  );
}
