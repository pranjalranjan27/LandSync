import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { caseService } from '../../services/caseService';
import type { Case } from '../../types/case';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import { ProgressBarRow } from '../../components/ProgressBarRow/ProgressBarRow';
import { Button } from '../../components/Button/Button';
import {
  HeartHandshake,
  UploadCloud,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useTranslation } from '../../locales';
import './RrAdminView.css';

export const RrAdminView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [rrCases, setRrCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const district = user?.district || 'Gautam Buddha Nagar';
  const districtId = user?.district_id || district;

  useEffect(() => {
    let isMounted = true;
    // Query cases in possession_taken and rr_in_progress scoped by district_id
    caseService
      .getCases({
        stage: 'possession_taken,rr_in_progress',
        district_id: districtId,
        district: district
      })
      .then((data) => {
        if (isMounted) {
          setRrCases(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch R&R cases', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [districtId, district]);

  // Group 1: Ready to Begin R&R (possession_taken stage)
  const readyCases = useMemo(() => {
    return rrCases.filter((c) => c.stage === 'possession_taken');
  }, [rrCases]);

  // Group 2: In Progress (rr_in_progress stage)
  const inProgressCases = useMemo(() => {
    return rrCases.filter((c) => c.stage === 'rr_in_progress');
  }, [rrCases]);

  return (
    <div className="rr-admin-container">
      {/* Header with R&R Jurisdiction Card */}
      <div className="rr-header-row">
        <div className="rr-title-area">
          <h1>{t('dashboard.rrAdminViewTitle', 'R&R Administrator Dashboard')}</h1>
          <p className="rr-subtitle">
            Rehabilitation &amp; Resettlement Schemes • Family enumeration, solatium package calculation &amp; DBT execution.
          </p>
        </div>

        <div className="rr-badge-card">
          <div className="rr-card-icon-wrap">
            <HeartHandshake size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              R&amp;R Jurisdiction
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{district}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{user?.state || 'Uttar Pradesh'}</div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '10px' }}>
          <Loader2 className="spinning" size={24} color="var(--color-accent-kesari)" />
          <span style={{ color: '#64748B' }}>Loading R&amp;R cases...</span>
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* GROUP 1: Ready to Begin R&R */}
          <section className="rr-group-section">
            <div className="rr-group-header">
              <h2 className="rr-group-title">Ready to Begin R&amp;R</h2>
              <span className="rr-group-count">{readyCases.length}</span>
            </div>

            {readyCases.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {readyCases.map((c) => (
                  <CaseCard
                    key={c.id}
                    caseItem={c}
                    layout="row"
                    actionTag={{
                      title: 'Possession Taken',
                      subtitle: 'Land transferred. Upload Chapter V Scheme & formulate family entitlement.',
                      icon: <UploadCloud size={18} color="#C2410C" />,
                      variant: 'peach'
                    }}
                    extraAction={
                      <Button
                        variant="accent-kesari"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/cases/${c.id}?tab=rr`);
                        }}
                      >
                        Begin R&amp;R
                      </Button>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rr-empty-box">
                No cases currently ready to begin R&amp;R in this jurisdiction.
              </div>
            )}
          </section>

          {/* GROUP 2: In Progress */}
          <section className="rr-group-section">
            <div className="rr-group-header">
              <h2 className="rr-group-title">In Progress</h2>
              <span className="rr-group-count" style={{ backgroundColor: '#0284C7' }}>
                {inProgressCases.length}
              </span>
            </div>

            {inProgressCases.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {inProgressCases.map((c) => {
                  const verified = c.rrFamiliesVerified ?? 6;
                  const total = c.rrFamiliesTotal ?? 10;

                  return (
                    <div
                      key={c.id}
                      className="case-card-row-wrapper"
                      onClick={() => navigate(`/cases/${c.id}?tab=rr`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="case-card-row-left">
                        <span className="case-card-row-id">{c.caseNumber}</span>
                        <h4 className="case-card-row-title">{c.projectTitle}</h4>
                        <span className="case-card-row-location">
                          {c.district}, {c.state}
                        </span>
                      </div>

                      {/* Aggregate ProgressBarRow instead of single StatusBadge */}
                      <div style={{ flex: '1 1 340px', padding: '0 16px' }}>
                        <ProgressBarRow
                          current={verified}
                          total={total}
                          label="families verified"
                        />
                      </div>

                      <div className="case-card-row-days">
                        <span className="case-card-row-days-num">R&amp;R Active</span>
                        <span className="case-card-row-days-sub">Solatium Tranche 1</span>
                      </div>

                      <div className="case-card-row-chevron">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rr-empty-box">
                No R&amp;R cases in progress in this jurisdiction.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default RrAdminView;
