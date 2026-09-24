import React from 'react';

interface HeroOverlayProps {
  visible: boolean;
}

const HeroOverlay: React.FC<HeroOverlayProps> = ({ visible }) => {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 100,
    opacity: visible ? 1 : 0,
    transition: 'opacity 1s ease-in-out',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: 'white',
  };

  const topContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '40px',
    left: '40px',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 300,
    textTransform: 'uppercase',
    letterSpacing: '0.3em',
    opacity: 0.7,
  };

  const subtitleStyle: React.CSSProperties = {
    margin: '8px 0 0 0',
    fontSize: '11px',
    fontStyle: 'italic',
    opacity: 0.5,
  };

  const bottomContainerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '40px',
    right: '40px',
  };

  const exploreTextStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    opacity: 0.5,
  };

  return (
    <div style={containerStyle}>
      <div style={topContainerStyle}>
        <h1 style={titleStyle}>ISOLATED</h1>
        <p style={subtitleStyle}>A quiet place between sea and sky.</p>
      </div>
      <div style={bottomContainerStyle}>
        <p style={exploreTextStyle}>EXPLORE</p>
      </div>
    </div>
  );
};

export default HeroOverlay;
