import { useState } from 'react';
import { mockCases } from '../../mock-data/cases';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import { Search, Filter, Layers } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function CaseQueuePage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [query, setQuery] = useState(initialSearch);
  const [stageFilter, setStageFilter] = useState('ALL');

  const filteredCases = mockCases.filter((c) => {
    const matchesQuery = 
      !query.trim() ||
      c.projectTitle.toLowerCase().includes(query.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(query.toLowerCase()) ||
      c.khasraNumbers.some((k) => k.toLowerCase().includes(query.toLowerCase())) ||
      c.district.toLowerCase().includes(query.toLowerCase());

    const matchesStage = stageFilter === 'ALL' || c.stage === stageFilter;

    return matchesQuery && matchesStage;
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>National Land Acquisition Case Registry</h2>
          <p className="text-caption">
            Centralized public repository of all statutory RFCTLARR Act acquisition records and Khasra parcels.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Case ID, Khasra, Title..."
              style={{ padding: '6px 12px 6px 32px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)', width: '220px', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={16} color="var(--color-text-secondary)" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--color-border-slate)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Stages (1 to 8)</option>
              <option value="STAGE_4_SEC11_NOTIFICATION">Stage 4: Sec 11 Notification</option>
              <option value="STAGE_5_OBJECTIONS_HEARING">Stage 5: Sec 15 Objections</option>
              <option value="STAGE_7_RR_AWARD_DISBURSEMENT">Stage 7: Solatium &amp; R&amp;R</option>
            </select>
          </div>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <Layers size={32} color="var(--color-text-secondary)" style={{ margin: '0 auto var(--spacing-3)' }} />
          <h4>No Land Acquisition Records Found</h4>
          <p className="text-caption">No active cases matched your search query. Try searching for "UK-PAURI-2026-00192" or "442/19-A".</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--spacing-6)' }}>
          {filteredCases.map((c) => (
            <CaseCard key={c.id} caseItem={c} />
          ))}
        </div>
      )}
    </div>
  );
}
