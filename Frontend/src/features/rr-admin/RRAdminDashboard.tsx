import { useState } from 'react';
import { FamilyStatusTable } from './FamilyStatusTable';
import { BeginRRForm } from './BeginRRForm';
import { HeartHandshake, IndianRupee, Users } from 'lucide-react';
import { Button } from '../../components/Button/Button';

export function RRAdminDashboard() {
  const [showSchemeForm, setShowSchemeForm] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2>R&amp;R Administrator Directorate (पुनर्वास एवं पुनर्व्यवस्था)</h2>
          <p className="text-caption">
            Statutory administration of R&amp;R schemes under Chapter V, solatium calculation, and DBT tracking.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowSchemeForm(!showSchemeForm)}>
          <HeartHandshake size={14} /> {showSchemeForm ? 'View Beneficiary Table' : 'Formulate New Scheme'}
        </Button>
      </div>

      {/* R&R KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
        <div className="card">
          <div className="text-caption">TOTAL FAMILIES TRACKED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary-navy)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Users size={22} /> 448 Families
          </div>
        </div>

        <div className="card">
          <div className="text-caption">COMPENSATION DISBURSED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-accent-green)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <IndianRupee size={22} /> 71.20 Cr
          </div>
        </div>

        <div className="card">
          <div className="text-caption">RESETTLEMENT HOUSING COMPLETED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-accent-kesari)', marginTop: 4 }}>
            88.4%
          </div>
        </div>
      </div>

      {showSchemeForm && (
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <BeginRRForm onSuccess={() => setShowSchemeForm(false)} />
        </div>
      )}

      <FamilyStatusTable />
    </div>
  );
}
