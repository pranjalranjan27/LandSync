import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent-kesari';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  style,
  ...props
}: ButtonProps) {
  const variantClass = 
    variant === 'secondary' ? 'btn-secondary' :
    variant === 'accent-kesari' ? 'btn-accent-kesari' : 'btn-primary';

  const sizeStyle: React.CSSProperties = 
    size === 'sm' ? { padding: '4px 8px', fontSize: '0.78rem' } :
    size === 'lg' ? { padding: '12px 24px', fontSize: '1rem' } : {};

  return (
    <button
      className={`btn ${variantClass} ${className}`}
      style={{ ...sizeStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
