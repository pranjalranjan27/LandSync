import React, { useState, useEffect } from 'react';
import type { Case } from '../../types/case';
import { fetchRrCommitteeCases } from '../../lib/api/authorityApi';
import {
  Building2,
  Search,
  Users,
  Home,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Landmark,
  Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const RrCommitteeOverview: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    fetchRrCommitteeCases()
      .then((data) => {
        if (isMounted) {
          setCases(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load RR Committee cases', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const states = Array.from(new Set(cases.map((c) => c.state).filter(Boolean)));

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState = selectedState === 'all' || c.state === selectedState;
    return matchesSearch && matchesState;
  });

  // Calculate national R&R metrics
  const totalFamilies = cases.reduce((sum, c) => sum + (c.affectedFamiliesCount || 0), 0);
  const totalArea = cases.reduce((sum, c) => sum + (c.totalAreaHectares || 0), 0);
  const activeDisputes = cases.filter((c) => c.has_active_dispute).length;
  const inRrStage = cases.filter((c) => c.stage === 'rr_in_progress' || c.stage === 'STAGE_7_RR_AWARD_DISBURSEMENT').length;

  if (loading) {
    return (
      <div className="authority-panel" style={{ padding: '60px 0', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: '#1D4ED8', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Loading National R&amp;R Oversight Matrix...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* High-Level Statutory Oversight Indicators */}
      <div className="authority-stats-grid">
        <div className="authority-stat-card">
          <div className="authority-stat-icon purple">
            <Building2 size={22} />
          </div>
          <div>
            <div className="authority-stat-number">{cases.length}</div>
            <div className="authority-stat-title">Total National Projects Monitored</div>
          </div>
        </div>

        <div className="authority-stat-card">
          <div className="authority-stat-icon blue">
            <Users size={22} />
          </div>
          <div>
            <div className="authority-stat-number">{totalFamilies.toLocaleString('en-IN')}</div>
            <div className="authority-stat-title">Total Displaced / Affected Families</div>
          </div>
        </div>

        <div className="authority-stat-card">
          <div className="authority-stat-icon emerald">
            <Home size={22} />
          </div>
          <div>
            <div className="authority-stat-number">{inRrStage}</div>
            <div className="authority-stat-title">Projects Under Active R&amp;R Implementation</div>
          </div>
        </div>

        <div className="authority-stat-card">
          <div className="authority-stat-icon amber">
            <Scale size={22} />
          </div>
          <div>
            <div className="authority-stat-number">{activeDisputes}</div>
            <div className="authority-stat-title">Active Compensation Disputes Flagged</div>
          </div>
        </div>
      </div>

      {/* Main Read-Only Data Panel */}
      <div className="authority-panel">
        <div className="authority-panel-header">
          <div className="authority-panel-title-area">
            <h2>
              <Landmark size={20} style={{ color: '#6D28D9' }} />
              National R&amp;R Monitoring Matrix (RFCTLARR Section 50)
            </h2>
            <p className="authority-panel-sub">
              Statutory Apex Committee oversight on Rehabilitation and Resettlement scheme delivery across all States and Union Territories. Read-only audit ledger.
            </p>
          </div>

          <div className="authority-controls">
            <div className="authority-search-box">
              <Search size={16} className="authority-search-icon" />
              <input
                type="text"
                placeholder="Search project or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="authority-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="all">All States / UTs</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="authority-table-wrap">
          <table className="authority-table">
            <thead>
              <tr>
                <th>Case Identifier</th>
                <th>Project Title &amp; Purpose</th>
                <th>State &amp; District</th>
                <th>Current Lifecycle Stage</th>
                <th>R&amp;R Status</th>
                <th>Affected Families</th>
                <th>Total Area (Ha)</th>
                <th>Dispute Flag</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    No acquisition projects match the selected state or search criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isRrInProgress = c.stage === 'rr_in_progress';
                  const isPossessionTaken = c.stage === 'possession_taken';
                  const isDisbursed = c.stage === 'compensation_disbursed';

                  return (
                    <tr key={c.id}>
                      <td>
                        <Link
                          to={`/cases/${c.id}`}
                          style={{ fontWeight: 600, color: '#1D4ED8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {c.caseNumber}
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.projectTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.requiringDepartment}</div>
                      </td>
                      <td>
                        <div>{c.state}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.district} • {c.tehsil || 'Dadri'}</div>
                      </td>
                      <td>
                        <span className={`stage-pill ${isRrInProgress ? 'rr' : isDisbursed ? 'disbursed' : ''}`}>
                          {c.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {isRrInProgress ? (
                          <span style={{ color: '#6D28D9', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                            <Home size={14} /> Resettlement In Progress
                          </span>
                        ) : isPossessionTaken ? (
                          <span style={{ color: '#047857', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                            <CheckCircle2 size={14} /> Possession Completed
                          </span>
                        ) : (
                          <span style={{ color: '#64748B', fontSize: '0.8rem' }}>
                            Pre-Possession Planning
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.affectedFamiliesCount}</div>
                        <div style={{ fontSize: '0.73rem', color: '#64748B' }}>PAF Entitled</div>
                      </td>
                      <td>{c.totalAreaHectares} Ha</td>
                      <td>
                        {c.has_active_dispute ? (
                          <span className="dispute-active-badge">
                            <Scale size={12} /> LARR Referral Active
                          </span>
                        ) : (
                          <span className="dispute-closed-badge">
                            <ShieldCheck size={12} /> Clear
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
