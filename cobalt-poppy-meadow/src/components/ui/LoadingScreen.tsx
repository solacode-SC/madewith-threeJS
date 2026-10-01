import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => onComplete?.(), 650);
          }, 200);
          return 100;
        }
        return prev + 15;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0D1424',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto',
        transform: isFadingOut ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '420px',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        {/* Botanical Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, rgba(15,23,42,0) 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            border: '1px solid rgba(96,165,250,0.3)',
            boxShadow: '0 0 24px rgba(37,99,235,0.4)',
          }}
        >
          🌺
        </div>

        {/* Japanese Subtitle */}
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.3em',
            color: '#60A5FA',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          // 原風景の自然 • 蒼碧のポピー花野
        </div>

        {/* English Title */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
            fontSize: '28px',
            fontWeight: 600,
            color: '#F8FAFC',
            letterSpacing: '0.04em',
            lineHeight: 1.2,
          }}
        >
          Cobalt Poppy Meadow
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: '#94A3B8',
            lineHeight: 1.5,
          }}
        >
          Sculpting 7,950+ wind-animated wildflowers, rolling sage hills, and dark indigo sentinel trees...
        </p>

        {/* Progress Bar */}
        <div
          style={{
            width: '180px',
            height: '3px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#3B82F6',
              boxShadow: '0 0 8px #60A5FA',
              transition: 'width 0.15s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
