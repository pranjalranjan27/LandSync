import React from 'react';

export const DigitalSevaIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Digital Seva Connect"
    >
      {/* Upper Saffron Wave */}
      <path
        d="M17.5 7.5 C15.5 4 11 4 8.5 6 C6.5 7.6 6 10.5 7.5 12.5 C8.5 13.8 11.2 15 13.5 14 C16 13 18.5 11 17.5 7.5 Z"
        fill="#FF9933"
      />
      {/* Lower Green Wave */}
      <path
        d="M6.5 16.5 C8.5 20 13 20 15.5 18 C17.5 16.4 18 13.5 16.5 11.5 C15.5 10.2 12.8 9 10.5 10 C8 11 5.5 13 6.5 16.5 Z"
        fill="#138808"
      />
      {/* White center separation */}
      <circle cx="12" cy="12" r="2" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="1" fill="#000080" />
    </svg>
  );
};
