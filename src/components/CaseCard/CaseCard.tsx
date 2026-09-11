import React from 'react';
import type { Case } from '../../types/case';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { IdBadge } from '../IdBadge/IdBadge';
import { ProgressBarRow } from '../ProgressBarRow/ProgressBarRow';
import { getStageConfig } from '../../constants/stages';
import { MapPin, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CaseCard.css';

export interface ActionTagConfig {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'peach' | 'blue' | 'green' | string;
}

export interface CaseCardProps {
  caseId?: string;
  projectName?: string;
  stage?: string;
  daysInStage?: number;
  district?: string;
  actionTag?: string | ActionTagConfig;
  progress?: { current: number; total: number; label: string };
  onClick?: () => void;

  // Legacy compatibility props:
  caseItem?: Case;
  hideActionButton?: boolean;
  extraAction?: React.ReactNode;
  isWarning?: boolean;
  layout?: 'card' | 'row';
  className?: string;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseId,
  projectName,
  stage,
  daysInStage,
  district,
  actionTag,
  progress,
  onClick,
  caseItem,
  isWarning = false,
  layout = 'card',
  className = ''
}) => {
  const navigate = useNavigate();

  // Normalize incoming props with caseItem fallback
  const effectiveCaseId = caseId || caseItem?.caseNumber || caseItem?.id || 'LA-2026-001';
  const effectiveProjectName = projectName || caseItem?.projectTitle || 'Infrastructure Project';
  const effectiveStage = stage || caseItem?.stage || 'proposal_submitted';
  const effectiveDistrict = district || (caseItem ? `${caseItem.district}${caseItem.state ? `, ${caseItem.state}` : ''}` : '');

  // Calculate days in current stage
  const effectiveDaysInStage = daysInStage !== undefined
    ? daysInStage
    : Math.max(
        1,
        Math.ceil(
          Math.abs(
            new Date().getTime() -
            new Date(caseItem?.lastUpdated || caseItem?.dateInitiated || new Date()).getTime()
          ) / (1000 * 60 * 60 * 24)
        )
      );

  // Check statutory deadline overdue threshold
  const stageConfig = getStageConfig(effectiveStage);
  const thresholdDays = stageConfig.statutoryDaysLimit ?? 30;
  const isOverdue = isWarning || effectiveDaysInStage > thresholdDays;
  const daysDelayed = Math.max(0, effectiveDaysInStage - thresholdDays);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (caseItem?.id) {
      navigate(`/cases/${caseItem.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Render Action Tag content
  const renderActionTag = () => {
    if (!actionTag) return null;
    if (typeof actionTag === 'string') {
      return (
        <span className="case-card-action-tag">
          {actionTag}
        </span>
      );
    }
    return (
      <span className="case-card-action-tag">
        {actionTag.icon && <span style={{ display: 'inline-flex' }}>{actionTag.icon}</span>}
        <span>{actionTag.title}</span>
      </span>
    );
  };

  // Row layout variant
  if (layout === 'row') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`case-card-row-wrapper ${className}`}
        aria-label={`Case ${effectiveCaseId}: ${effectiveProjectName}`}
      >
        <div className="case-card-row-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IdBadge value={effectiveCaseId} />
            {isOverdue && (
              <span
                className="case-card-overdue-flag"
                title={`Exceeds statutory timeline of ${thresholdDays} days (${daysDelayed} days delayed)`}
              >
                <AlertTriangle size={12} />
                <span>Delayed ({daysDelayed}d)</span>
              </span>
            )}
          </div>
          <h4 className="case-card-row-title">{effectiveProjectName}</h4>
          {effectiveDistrict && (
            <span className="case-card-row-location">
              <MapPin size={13} />
              <span>{effectiveDistrict}</span>
            </span>
          )}
        </div>

        <div className="case-card-row-badge">
          <StatusBadge stage={effectiveStage} />
          {renderActionTag()}
        </div>

        {progress ? (
          <div style={{ flex: '1 1 200px', maxWidth: '240px' }}>
            <ProgressBarRow
              current={progress.current}
              total={progress.total}
              label={progress.label}
            />
          </div>
        ) : (
          <div className="case-card-row-days">
            <span className="case-card-row-days-num">{effectiveDaysInStage}d</span>
            <span className="case-card-row-days-sub">in current stage</span>
          </div>
        )}

        <div className="case-card-row-chevron" aria-hidden="true">
          <ChevronRight size={18} />
        </div>
      </div>
    );
  }

  // Card layout variant (standard dashboard queue card)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`case-card-container ${className}`}
      aria-label={`Case ${effectiveCaseId}: ${effectiveProjectName}`}
    >
      <div className="case-card-header">
        <div className="case-card-header-left">
          <IdBadge value={effectiveCaseId} />
          {isOverdue && (
            <span
              className="case-card-overdue-flag"
              title={`Exceeds statutory timeline of ${thresholdDays} days (${daysDelayed} days delayed)`}
            >
              <AlertTriangle size={12} />
              <span>{daysDelayed > 0 ? `${daysDelayed}d delayed` : 'Overdue'}</span>
            </span>
          )}
        </div>

        <div className="case-card-badges">
          {renderActionTag()}
          <StatusBadge stage={effectiveStage} />
        </div>
      </div>

      <div className="case-card-body">
        <h4 className="case-card-title">{effectiveProjectName}</h4>
        {effectiveDistrict && (
          <span className="case-card-location">
            <MapPin size={13} />
            <span>{effectiveDistrict}</span>
          </span>
        )}
      </div>

      {/* Mutually exclusive footer: Progress row OR Days in Stage */}
      <div className="case-card-footer">
        {progress ? (
          <div className="case-card-progress-wrap">
            <ProgressBarRow
              current={progress.current}
              total={progress.total}
              label={progress.label}
            />
          </div>
        ) : (
          <div className="case-card-days-line">
            <span>Stage duration:</span>
            <span className="case-card-days-number">
              {effectiveDaysInStage} {effectiveDaysInStage === 1 ? 'day' : 'days'}
            </span>
            <span>in current stage</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseCard;
