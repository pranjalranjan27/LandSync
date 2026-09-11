import React from 'react';
import './ProgressBarRow.css';

export interface ProgressBarRowProps {
  current: number;
  total: number;
  label?: string; // e.g. "families verified"
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBarRow: React.FC<ProgressBarRowProps> = ({
  current,
  total,
  label = 'families verified',
  showPercentage = true,
  className = ''
}) => {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(0, current), safeTotal);
  const percentage = Math.round((safeCurrent / safeTotal) * 100);
  const isComplete = percentage >= 100;

  return (
    <div className={`progress-bar-row-container ${className}`}>
      <div className="progress-bar-row-header">
        <span className="progress-bar-row-label">
          {safeCurrent} of {safeTotal} {label}
        </span>
        {showPercentage && (
          <span className="progress-bar-row-percentage">
            {percentage}%
          </span>
        )}
      </div>
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${isComplete ? 'success' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBarRow;
