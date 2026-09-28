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
        background: 'linear-gradient(180deg, #FDF9EE 0%, #F4E8D2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loaded ? 0 : 1,
        pointerEvents: loaded ? 'none' : 'auto',
        transition: 'opacity 0.65s ease',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        color: '#382D27',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          padding: '28px 38px',
          borderRadius: '24px',
          background: 'rgba(255, 252, 244, 0.88)',
          border: '1.5px solid rgba(138, 104, 78, 0.35)',
          boxShadow: '0 20px 50px rgba(72, 52, 38, 0.12)',
          textAlign: 'center',
          maxWidth: '430px',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍁</div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#C85628',
          }}
        >
          Watercolor Shanshui Mountain City
        </div>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '30px',
            fontWeight: 700,
            margin: '6px 0 8px',
            color: '#2E231D',
          }}
        >
          Kaede &amp; the Maple Brush Valley
        </h1>
        <p
          style={{
            fontSize: '12.5px',
            color: '#635247',
            margin: '0 0 18px',
            lineHeight: 1.5,
          }}
        >
          Painting curved slate-tiled roofs, persimmon maple canopies, celadon mountain peaks &amp;
          drifting watercolor brush clouds...
        </p>

        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '999px',
            background: 'rgba(138, 104, 78, 0.18)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.round(progress))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #E25B2B, #F78E44)',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
        <div
          style={{
            marginTop: '10px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#8C6246',
          }}
        >
          🎵 Click anywhere to enter with Guzheng &amp; Bamboo Flute Soundtrack
        </div>
      </div>
    </div>
  );
}
