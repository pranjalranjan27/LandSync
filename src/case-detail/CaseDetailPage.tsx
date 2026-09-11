/**
 * CaseDetailPage — Phase 3, Prompt 3
 * Four-tab shell: Overview | Section 4 Proposal | Cadastral Map | Audit Ledger
 * Jurisdiction-based: any authenticated user can view; actions are gated in OverviewTab.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Case } from '../types/case';
import { fetchCaseById } from '../lib/api/casesApi';
import { CaseHeader } from './CaseHeader';
import { OverviewTab } from './tabs/OverviewTab';
import { ProposalTab } from './tabs/ProposalTab';
import { MapTab } from './tabs/MapTab';
import { TimelineTab } from './tabs/TimelineTab';
import { mockCases } from '../mock-data/cases';
import './CaseDetailPage.css';

type TabKey = 'overview' | 'proposal' | 'map' | 'timeline';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Case Overview & Parcels' },
  { key: 'proposal', label: 'Section 4 Proposal' },
  { key: 'map', label: 'Cadastral GIS Map' },
  { key: 'timeline', label: 'Audit Ledger & Timeline' },
];

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [caseItem, setCaseItem] = useState<Case | null>(() => (!id ? mockCases[0] : null));
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCaseById(id).then((found) => {
      setCaseItem(found ?? mockCases[0]);
      setLoading(false);
    });
  }, [id]);

  const handleCaseUpdate = useCallback((updated: Case) => {
    setCaseItem(updated);
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="card cd-loading">
          <div className="cd-spinner" />
          <p>Loading case records…</p>
        </div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="page-container">
        <div className="card cd-loading">
          <p>Case not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header: case number, title, stepper */}
      <CaseHeader caseItem={caseItem} />

      {/* Tab Bar */}
      <div className="cd-tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tab-item${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div role="tabpanel">
        {activeTab === 'overview' && (
          <OverviewTab caseItem={caseItem} onCaseUpdate={handleCaseUpdate} />
        )}
        {activeTab === 'proposal' && <ProposalTab caseItem={caseItem} />}
        {activeTab === 'map' && <MapTab caseItem={caseItem} />}
        {activeTab === 'timeline' && <TimelineTab caseItem={caseItem} />}
      </div>
    </div>
  );
}
