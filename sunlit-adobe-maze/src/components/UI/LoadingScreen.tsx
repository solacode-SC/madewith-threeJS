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
          'linear-gradient(165deg, #3c2617 0%, #7d5436 48%, #c29b72 85%, #f0e1cc 100%)',
        opacity: loaded ? 0 : 1,
        pointerEvents: loaded ? 'none' : 'auto',
        transition: 'opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          background: 'rgba(252, 246, 236, 0.94)',
          backdropFilter: 'blur(16px)',
          padding: '36px 48px',
          borderRadius: '26px',
          boxShadow: '0 24px 60px rgba(42, 24, 12, 0.36)',
          textAlign: 'center',
          border: '1px solid rgba(226, 198, 164, 0.85)',
          maxWidth: '440px',
        }}
      >
        <div
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#9c4c27',
            marginBottom: '8px',
          }}
        >
          ✧ Watercolor Architectural Labyrinth ✧
        </div>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '35px',
            color: '#362112',
            margin: '0 0 8px 0',
            fontWeight: 700,
          }}
        >
          Mina & the Sunlit Maze
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#6b4c35',
            marginBottom: '24px',
            lineHeight: 1.55,
          }}
        >
          Carving cedar ceiling beams, Mashrabiya lattice windows, pointed adobe arches & weaving Persian kilim runners...
        </p>

        <div
          style={{
            width: '240px',
            height: '6px',
            background: 'rgba(156, 76, 39, 0.18)',
            borderRadius: '999px',
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.round(progress))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #9c4c27, #d4241b, #e8a850)',
              borderRadius: '999px',
              transition: 'width 0.18s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
