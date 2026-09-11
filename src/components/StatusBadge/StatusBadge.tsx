import React from 'react';
import { getStageConfig } from '../../constants/stages';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import './StatusBadge.css';

export interface StatusBadgeProps {
  stage: string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  stage,
  className = '',
  showIcon = true
}) => {
  const config = getStageConfig(stage);
  const normalized = stage?.toLowerCase().trim() || '';

  const renderIcon = () => {
    if (!showIcon) return null;
    if (normalized === 'returned_for_clarification') {
      return <AlertTriangle size={12} strokeWidth={2.5} />;
    }
    if (normalized === 'rejected') {
      return <XCircle size={12} strokeWidth={2.5} />;
    }
    if (normalized === 'completed' || normalized === 'resettlement_verified') {
      return <CheckCircle2 size={12} strokeWidth={2.5} />;
    }
    return null;
  };

  return (
    <span
      className={`nalams-status-badge badge-${config.color} ${className}`}
      title={config.description}
      role="status"
    >
      {renderIcon()}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
