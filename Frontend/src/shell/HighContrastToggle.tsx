import { Contrast } from 'lucide-react';

interface HighContrastToggleProps {
  isHighContrast: boolean;
  onToggle: () => void;
}

export function HighContrastToggle({ isHighContrast, onToggle }: HighContrastToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="btn btn-secondary"
      style={{
        padding: '2px 8px',
        fontSize: '0.75rem',
        color: isHighContrast ? '#FFFF00' : '#FFFFFF',
        borderColor: isHighContrast ? '#FFFF00' : '#FF9933',
        backgroundColor: 'transparent'
      }}
      aria-label="Toggle High Contrast Mode (WCAG AAA)"
    >
      <Contrast size={13} />
      <span>{isHighContrast ? 'Normal Contrast' : 'High Contrast (AAA)'}</span>
    </button>
  );
}
