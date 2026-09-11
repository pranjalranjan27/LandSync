import React from 'react';

export const IndianFlagIcon: React.FC<{ width?: number; height?: number; className?: string }> = ({
  width = 24,
  height = 16,
  className = ''
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: '2px', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Flag of India"
      role="img"
    >
      <rect width="24" height="16" fill="#FFFFFF" rx="2" />
      {/* Saffron band */}
      <rect width="24" height="5.33" fill="#FF9933" />
      {/* White middle band (background) */}
      {/* Green band */}
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      {/* Ashoka Chakra */}
      <circle cx="12" cy="8" r="2.2" stroke="#000080" strokeWidth="0.5" fill="none" />
      <circle cx="12" cy="8" r="0.45" fill="#000080" />
      {/* Spokes simplified */}
      <g stroke="#000080" strokeWidth="0.25">
        <line x1="12" y1="5.8" x2="12" y2="10.2" />
        <line x1="9.8" y1="8" x2="14.2" y2="8" />
        <line x1="10.4" y1="6.4" x2="13.6" y2="9.6" />
        <line x1="10.4" y1="9.6" x2="13.6" y2="6.4" />
      </g>
    </svg>
  );
};
