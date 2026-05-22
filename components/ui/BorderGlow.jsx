import { useRef, useCallback } from 'react';
import './BorderGlow.css';

const BorderGlow = ({
  children,
  className = '',
  edgeSensitivity = 30, // Kept for backward compatibility
  glowColor = '40 80 80',
  backgroundColor = 'transparent',
  borderRadius = 28,
  glowRadius = 150,
  glowIntensity = 1.0,
  coneSpread = 25, // Kept for backward compatibility
  animated = false, // Kept for backward compatibility
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5, // Kept for backward compatibility
}) => {
  const cardRef = useRef(null);

  const handlePointerMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  // Parse glowColor (can be HSL string like '220 80 80', hex, or standard color name)
  let borderGlowColor = 'rgba(99, 102, 241, 0.4)';
  let shadowGlowColor = 'rgba(99, 102, 241, 0.15)';

  if (glowColor) {
    if (typeof glowColor === 'string' && glowColor.trim().split(/\s+/).length >= 3) {
      const parts = glowColor.trim().split(/\s+/);
      borderGlowColor = `hsla(${parts[0]}, ${parts[1]}%, ${parts[2]}%, ${glowIntensity})`;
      shadowGlowColor = `hsla(${parts[0]}, ${parts[1]}%, ${parts[2]}%, 0.15)`;
    } else {
      borderGlowColor = glowColor;
      shadowGlowColor = glowColor; // fallback
    }
  } else if (colors && colors.length > 0) {
    borderGlowColor = colors[0];
    shadowGlowColor = colors[0];
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`border-glow-card ${className}`}
      style={{
        '--card-bg': backgroundColor,
        '--border-radius': `${borderRadius}px`,
        '--glow-radius': `${glowRadius}px`,
        '--glow-color-solid': borderGlowColor,
        '--glow-shadow-color': shadowGlowColor,
      }}
    >
      <div className="border-glow-inner">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;

