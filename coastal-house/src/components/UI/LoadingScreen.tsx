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
        background: 'linear-gradient(180deg, #4ca3d6 0%, #86c9e6 65%, #f3efe6 100%)',
        opacity: loaded ? 0 : 1,
        pointerEvents: loaded ? 'none' : 'auto',
        transition: 'opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 252, 245, 0.9)',
          backdropFilter: 'blur(12px)',
          padding: '32px 44px',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(9, 75, 105, 0.18)',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.7)',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#0d89b3',
            marginBottom: '8px',
          }}
        >
          Mediterranean Coastal Diorama
        </div>
        <h1
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '34px',
            color: '#143847',
            margin: '0 0 6px 0',
            fontWeight: 400,
          }}
        >
          Sumomalo Coffee
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#527380',
            marginBottom: '22px',
          }}
        >
          Preparing stucco facade, palm fronds & wandering ronin...
        </p>

        <div
          style={{
            width: '220px',
            height: '6px',
            background: 'rgba(13, 137, 179, 0.15)',
            borderRadius: '999px',
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.round(progress))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0d89b3, #ee8422)',
              borderRadius: '999px',
              transition: 'width 0.18s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
