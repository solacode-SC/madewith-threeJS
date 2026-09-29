interface LoadingScreenProps {
  progress: number;
  loaded: boolean;
  onEnterWithMusic: () => void;
}

export default function LoadingScreen({
  progress,
  loaded,
  onEnterWithMusic,
}: LoadingScreenProps) {
  return (
    <div
      onClick={onEnterWithMusic}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'linear-gradient(180deg, #EAF4E2 0%, #D4E8C6 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loaded ? 0 : 1,
        pointerEvents: loaded ? 'none' : 'auto',
        transition: 'opacity 0.65s ease',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        color: '#223322',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          padding: '28px 38px',
          borderRadius: '24px',
          background: 'rgba(252, 253, 246, 0.92)',
          border: '1.5px solid rgba(72, 108, 68, 0.35)',
          boxShadow: '0 20px 50px rgba(38, 64, 34, 0.14)',
          textAlign: 'center',
          maxWidth: '440px',
        }}
      >
        <div style={{ fontSize: '30px', marginBottom: '8px' }}>✈️</div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#467E3E',
          }}
        >
          Hand-Drawn Sky &amp; Village Flight World
        </div>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '30px',
            fontWeight: 700,
            margin: '6px 0 8px',
            color: '#1E2F1D',
          }}
        >
          Sora &amp; the Meadow Sky Biplane
        </h1>
        <p
          style={{
            fontSize: '12.5px',
            color: '#4A5E46',
            margin: '0 0 18px',
            lineHeight: 1.5,
          }}
        >
          Inking rustic fenced cottages, gouache meadow brushstrokes, morning sunbeams &amp;
          your vintage open-cockpit biplane...
        </p>

        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '999px',
            background: 'rgba(72, 108, 68, 0.18)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.round(progress))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #529442, #98C850)',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        <div
          style={{
            marginTop: '10px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#46783E',
          }}
        >
          🎵 Click anywhere to take off with Pastoral Guitar, Accordion &amp; Flute Soundtrack
        </div>
      </div>
    </div>
  );
}
