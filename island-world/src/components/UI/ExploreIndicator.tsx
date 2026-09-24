import React from 'react';

interface ExploreIndicatorProps {
  visible: boolean;
}

const ExploreIndicator: React.FC<ExploreIndicatorProps> = ({ visible }) => {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    zIndex: 100,
    opacity: visible ? 0.5 : 0,
    pointerEvents: 'none',
    transition: 'opacity 1s ease-in-out',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: 'white',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '14px',
  };

  const textStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>↔</div>
      <p style={textStyle}>Drag to explore</p>
    </div>
  );
};

export default ExploreIndicator;
