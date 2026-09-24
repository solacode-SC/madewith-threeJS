import React, { useState } from 'react';

interface SceneControlsProps {
  onPresetSelect: (preset: string) => void;
  activePreset: string;
  visible: boolean;
}

const SceneControls: React.FC<SceneControlsProps> = ({ onPresetSelect, activePreset, visible }) => {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    right: 0,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 100,
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    transition: 'opacity 1s ease-in-out',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  const presets = ['Overview', 'Cabin', 'Palms', 'Boat', 'Island'];

  const getButtonStyle = (isActive: boolean, isHovered: boolean): React.CSSProperties => ({
    background: 'transparent',
    border: `1px solid ${isActive ? 'rgba(126,200,200,0.5)' : isHovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
    color: isActive ? '#7ec8c8' : 'white',
    opacity: isActive ? 1 : isHovered ? 0.9 : 0.6,
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left',
  });

  const getResetButtonStyle = (isHovered: boolean): React.CSSProperties => ({
    ...getButtonStyle(false, isHovered),
    marginTop: '8px',
    opacity: isHovered ? 0.9 : 0.4,
    borderStyle: 'dashed',
  });

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div style={containerStyle}>
      {presets.map((preset) => (
        <button
          key={preset}
          onClick={() => onPresetSelect(preset)}
          onMouseEnter={() => setHoveredButton(preset)}
          onMouseLeave={() => setHoveredButton(null)}
          style={getButtonStyle(activePreset === preset, hoveredButton === preset)}
        >
          {preset}
        </button>
      ))}
      <button
        onClick={() => onPresetSelect('Reset')}
        onMouseEnter={() => setHoveredButton('Reset')}
        onMouseLeave={() => setHoveredButton(null)}
        style={getResetButtonStyle(hoveredButton === 'Reset')}
      >
        Reset View
      </button>
    </div>
  );
};

export default SceneControls;
