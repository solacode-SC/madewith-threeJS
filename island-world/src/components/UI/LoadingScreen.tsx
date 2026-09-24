import React from 'react';

interface LoadingScreenProps {
  progress: number;
  loaded: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, loaded }) => {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a3a3a',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: loaded ? 0 : 1,
    visibility: loaded ? 'hidden' : 'visible',
    transition: 'opacity 1.5s ease-in-out, visibility 1.5s ease-in-out',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5em',
    color: '#7ec8c8',
    fontWeight: 400,
  };

  const subtitleStyle: React.CSSProperties = {
    margin: '12px 0 24px 0',
    fontSize: '11px',
    fontStyle: 'italic',
    color: 'white',
    opacity: 0.6,
  };

  const trackStyle: React.CSSProperties = {
    width: '200px',
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#7ec8c8',
    width: `${Math.min(100, Math.max(0, progress))}%`,
    transition: 'width 0.3s ease-out',
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>ISLAND / 01</h2>
      <p style={subtitleStyle}>Loading world...</p>
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
    </div>
  );
};

export default LoadingScreen;
