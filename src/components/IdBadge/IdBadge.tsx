import React from 'react';
import './IdBadge.css';

export interface IdBadgeProps {
  value: string;
  className?: string;
  title?: string;
}

export const IdBadge: React.FC<IdBadgeProps> = ({
  value,
  className = '',
  title
}) => {
  return (
    <span
      className={`nalams-id-badge ${className}`}
      title={title || `Record ID: ${value}`}
    >
      {value}
    </span>
  );
};

export default IdBadge;
