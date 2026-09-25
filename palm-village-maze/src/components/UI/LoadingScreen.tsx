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
          'linear-gradient(165deg, #3A2A1A 0%, #8c7e6c 48%, #D4A853 85%, #87CEEB 100%)',
        opacity: loaded ? 0 : 1,
        pointerEvents: loaded ? 'none' : 'auto',
        transition: 'opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          background: 'rgba(245, 235, 220, 0.94)',
          backdropFilter: 'blur(16px)',
          padding: '36px 48px',
          borderRadius: '26px',
          boxShadow: '0 24px 60px rgba(58, 42, 26, 0.36)',
          textAlign: 'center',
          border: '1px solid rgba(186, 153, 115, 0.85)',
          maxWidth: '440px',
        }}
      >
        <div
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#D4A853',
            marginBottom: '8px',
          }}
        >
          ✧ Palm Village Labyrinth ✧
        </div>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '35px',
            color: '#3A2A1A',
            margin: '0 0 8px 0',
            fontWeight: 700,
          }}
        >
          Hana & the Palm Village Maze
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#5c4832',
            marginBottom: '24px',
            lineHeight: 1.55,
          }}
        >
          Explore ancient Iraqi alleyways, bustling markets, and quiet date palm groves...
        </p>

        <div
          style={{
            width: '240px',
            height: '6px',
            background: 'rgba(186, 153, 115, 0.3)',
            borderRadius: '999px',
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.round(progress))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #b88d3e, #D4A853, #f0c975)',
              borderRadius: '999px',
              transition: 'width 0.18s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
