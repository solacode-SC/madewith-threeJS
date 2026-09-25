interface LoadingScreenProps {
  progress: number;
  loaded: boolean;
}

export default function LoadingScreen({ progress, loaded }: LoadingScreenProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(165deg, #1045a8 0%, #2675e2 52%, #7bb9f8 85%, #f2f7ff 100%)',
        opacity: loaded ? 0 : 1,
        pointerEvents: loaded ? 'none' : 'auto',
        transition: 'opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          background: 'rgba(250, 253, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          padding: '36px 48px',
          borderRadius: '26px',
          boxShadow: '0 24px 60px rgba(8, 38, 102, 0.28)',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          maxWidth: '420px',
        }}
      >
        <div
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#1b62d0',
            marginBottom: '8px',
          }}
        >
          ✧ Interactive Fantasy Flight ✧
        </div>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '36px',
            color: '#0e2c66',
            margin: '0 0 8px 0',
            fontWeight: 700,
          }}
        >
          Lumina & the Azure Steps
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#436294',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
        >
          Painting cobalt medina steps, white amphora bouquets & awakening sky-flight magic...
        </p>

        <div
          style={{
            width: '240px',
            height: '6px',
            background: 'rgba(27, 98, 208, 0.16)',
            borderRadius: '999px',
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.round(progress))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #1b62d0, #55a6ff, #f29586)',
              borderRadius: '999px',
              transition: 'width 0.18s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
