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
          'linear-gradient(160deg, #165B9E 0%, #3E98E4 45%, #6CE4F4 82%, #F5FAFF 100%)',
        opacity: loaded ? 0 : 1,
        pointerEvents: loaded ? 'none' : 'auto',
        transition: 'opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          background: 'rgba(248, 252, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '36px 48px',
          borderRadius: '26px',
          boxShadow: '0 24px 60px rgba(18, 66, 120, 0.32)',
          textAlign: 'center',
          border: '1px solid rgba(114, 196, 242, 0.85)',
          maxWidth: '460px',
        }}
      >
        <div
          style={{
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#228BE6',
            marginBottom: '8px',
          }}
        >
          ✧ Cycladic Coastal Labyrinth ✧
        </div>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '35px',
            color: '#123A63',
            margin: '0 0 8px 0',
            fontWeight: 700,
          }}
        >
          Midori & the Santorini Sea Maze
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#3B648C',
            marginBottom: '24px',
            lineHeight: 1.55,
          }}
        >
          Preparing 16 whitewashed coastal landmarks, turquoise stepped roads, Dracaena dragon palms, and the shimmering Aegean Sea...
        </p>

        <div
          style={{
            width: '250px',
            height: '6px',
            background: 'rgba(114, 196, 242, 0.3)',
            borderRadius: '999px',
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.round(progress))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #228BE6, #4AD8F0, #86D654)',
              borderRadius: '999px',
              transition: 'width 0.18s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
