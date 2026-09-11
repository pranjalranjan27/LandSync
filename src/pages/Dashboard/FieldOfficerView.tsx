import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { caseService } from '../../services/caseService';
import type { Case } from '../../types/case';
import { CaseCard } from '../../components/CaseCard/CaseCard';
import {
  Compass,
  MapPin,
  Check,
  Loader2
} from 'lucide-react';
import './FieldOfficerView.css';

export const FieldOfficerView: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const officerDistrict = user?.district || 'Pauri Garhwal';
  const officerDistrictId = user?.district_id || officerDistrict;

  useEffect(() => {
    let isMounted = true;

    // Fetch both assigned verification tasks and compensation_disbursed cases in the district
    Promise.all([
      caseService.getCases({ assigned_to: user?.id || 'user-006' }),
      caseService.getCases({ stage: 'compensation_disbursed', district_id: officerDistrictId, district: officerDistrict })
    ])
      .then(([assigned, disbursed]) => {
        if (!isMounted) return;

        // Combine tasks with distinct deduplication
        const taskMap = new Map<string, Case>();

        // 1. Assigned verification tasks
        assigned
          .filter((c) => c.verificationTaskPending || c.assignedFieldOfficerId === user?.id || c.assignedFieldOfficerId === 'user-006')
          .forEach((c) => taskMap.set(c.id, c));

        // 2. Compensation disbursed cases awaiting possession confirmation in their district
        disbursed.forEach((c) => taskMap.set(c.id, c));

        setTasks(Array.from(taskMap.values()));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch field officer tasks', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, officerDistrictId, officerDistrict]);

  return (
    <div className="field-officer-container">
      {/* Header with Field Officer Profile Card */}
      <div className="fo-header-row">
        <div className="fo-title-area">
          <h1>Field Officer Dashboard</h1>
          <p className="fo-subtitle">
            Cadastral Ground-Truthing &amp; Possession • Boundary pillar verification, tree/structure counts &amp; joint handover.
          </p>
        </div>

        <div className="fo-badge-card">
          <div className="fo-card-icon-wrap">
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Field Kanungo / Patwari
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              {user?.name || 'Vikram Singh Rawat'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
              {officerDistrict} • {user?.state || 'Uttarakhand'}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Tasks Section */}
      <div>
        <div className="fo-section-header">
          <h2 className="fo-section-title">Verification Tasks</h2>
          <span className="fo-section-count">{tasks.length}</span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '10px' }}>
            <Loader2 className="spinning" size={24} color="var(--color-accent-kesari)" />
            <span style={{ color: '#64748B' }}>Loading verification tasks...</span>
          </div>
        )}

        {/* Task Cards List */}
        {!isLoading && tasks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {tasks.map((c) => {
              const isPossessionConfirmation = c.stage === 'compensation_disbursed';

              return (
                <CaseCard
                  key={c.id}
                  caseItem={c}
                  layout="row"
                  actionTag={
                    isPossessionConfirmation
                      ? {
                          title: 'Confirm Possession',
                          subtitle: 'Shared with Collector — Section 38 joint site possession handover.',
                          icon: <MapPin size={18} color="#2563EB" />,
                          variant: 'blue'
                        }
                      : {
                          title: 'Field Verification Pending',
                          subtitle: 'Cadastral boundary inspection & physical asset enumeration required.',
                          icon: <Compass size={18} color="#C2410C" />,
                          variant: 'peach'
                        }
                  }
                />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tasks.length === 0 && (
          <div className="fo-empty-card">
            <div className="fo-empty-icon">
              <Check size={38} strokeWidth={2.8} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '1.25rem' }}>
              No verification tasks assigned to you right now
            </h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', maxWidth: '420px' }}>
              New on-site cadastral inspection orders and possession confirmation requisitions will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldOfficerView;
