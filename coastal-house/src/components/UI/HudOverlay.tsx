import { CAMERA_PRESETS, type CameraPreset, type TimeOfDay } from '../../hooks/useSceneState';

interface HudOverlayProps {
  visible: boolean;
  activePreset: CameraPreset;
  timeOfDay: TimeOfDay;
  autoPatrol: boolean;
  doorOpen: boolean;
  hoveredItem: string | null;
  virtualInputRef: React.MutableRefObject<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    sprint: boolean;
  }>;
  onSelectPreset: (preset: CameraPreset) => void;
  onToggleTimeOfDay: () => void;
  onToggleAutoPatrol: () => void;
  onToggleDoor: () => void;
}

export default function HudOverlay({
  visible,
  activePreset,
  timeOfDay,
  autoPatrol,
  doorOpen,
  hoveredItem,
  virtualInputRef,
  onSelectPreset,
  onToggleTimeOfDay,
  onToggleAutoPatrol,
  onToggleDoor,
}: HudOverlayProps) {
  const setDir = (dir: 'up' | 'down' | 'left' | 'right', active: boolean) => {
    virtualInputRef.current[dir] = active;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease 0.2s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 24px',
      }}
    >
      {/* TOP BAR: Title Card & Interactive Scene Toggles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            background: 'rgba(255, 252, 246, 0.84)',
            backdropFilter: 'blur(12px)',
            padding: '12px 18px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.75)',
            boxShadow: '0 8px 28px rgba(10, 68, 92, 0.12)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#ee8422',
                boxShadow: '0 0 0 3px rgba(238, 132, 34, 0.22)',
              }}
            />
            <span
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: '21px',
                color: '#103747',
                letterSpacing: '0.02em',
              }}
            >
              Sumomalo Coffee
            </span>
          </div>
          <div
            style={{
              fontSize: '11.5px',
              color: '#496a78',
              marginTop: '2px',
              fontWeight: 500,
            }}
          >
            Coastal House & Wandering Ronin • 360° Interactive World
          </div>
        </div>

        {/* Top-Right Action Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            onClick={onToggleAutoPatrol}
            style={{
              background: autoPatrol
                ? 'rgba(13, 137, 179, 0.92)'
                : 'rgba(255, 252, 246, 0.86)',
              color: autoPatrol ? '#ffffff' : '#163f50',
              border: '1px solid rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(10px)',
              padding: '9px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(10, 68, 92, 0.12)',
              transition: 'all 0.2s ease',
            }}
          >
            {autoPatrol ? '🌿 Ronin: Auto-Strolling' : '🎮 Ronin: Manual Control'}
          </button>

          <button
            type="button"
            onClick={onToggleDoor}
            style={{
              background: doorOpen
                ? 'rgba(238, 132, 34, 0.92)'
                : 'rgba(255, 252, 246, 0.86)',
              color: doorOpen ? '#ffffff' : '#163f50',
              border: '1px solid rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(10px)',
              padding: '9px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(10, 68, 92, 0.12)',
              transition: 'all 0.2s ease',
            }}
          >
            {doorOpen ? '🚪 Front Door: Open' : '🚪 Front Door: Closed'}
          </button>

          <button
            type="button"
            onClick={onToggleTimeOfDay}
            style={{
              background:
                timeOfDay === 'golden'
                  ? 'rgba(224, 112, 36, 0.92)'
                  : 'rgba(255, 252, 246, 0.86)',
              color: timeOfDay === 'golden' ? '#ffffff' : '#163f50',
              border: '1px solid rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(10px)',
              padding: '9px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(10, 68, 92, 0.12)',
              transition: 'all 0.2s ease',
            }}
          >
            {timeOfDay === 'sunny' ? '☀️ Mediterranean Noon' : '🌅 Golden Sunset'}
          </button>
        </div>
      </div>

      {/* CENTER HOVER TOOLTIP */}
      {hoveredItem && (
        <div
          style={{
            alignSelf: 'center',
            background: 'rgba(16, 55, 71, 0.86)',
            color: '#fff9ed',
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '12.5px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.18)',
          }}
        >
          {hoveredItem}
        </div>
      )}

      {/* BOTTOM BAR: D-Pad Character Controls + Camera Viewpoint Presets */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* On-Screen Character Movement Pad & Keyboard Instructions */}
        <div
          style={{
            background: 'rgba(255, 252, 246, 0.84)',
            backdropFilter: 'blur(12px)',
            padding: '12px 14px',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.75)',
            boxShadow: '0 8px 28px rgba(10, 68, 92, 0.12)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Mini Directional Pad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 30px)',
              gridTemplateRows: 'repeat(2, 30px)',
              gap: '4px',
            }}
          >
            <div />
            <button
              type="button"
              aria-label="Walk Forward"
              onPointerDown={() => setDir('up', true)}
              onPointerUp={() => setDir('up', false)}
              onPointerLeave={() => setDir('up', false)}
              style={dpadButtonStyle}
            >
              ▲
            </button>
            <div />
            <button
              type="button"
              aria-label="Walk Left"
              onPointerDown={() => setDir('left', true)}
              onPointerUp={() => setDir('left', false)}
              onPointerLeave={() => setDir('left', false)}
              style={dpadButtonStyle}
            >
              ◀
            </button>
            <button
              type="button"
              aria-label="Walk Backward"
              onPointerDown={() => setDir('down', true)}
              onPointerUp={() => setDir('down', false)}
              onPointerLeave={() => setDir('down', false)}
              style={dpadButtonStyle}
            >
              ▼
            </button>
            <button
              type="button"
              aria-label="Walk Right"
              onPointerDown={() => setDir('right', true)}
              onPointerUp={() => setDir('right', false)}
              onPointerLeave={() => setDir('right', false)}
              style={dpadButtonStyle}
            >
              ▶
            </button>
          </div>

          <div style={{ fontSize: '11.5px', color: '#2b5363', lineHeight: 1.45 }}>
            <div style={{ fontWeight: 700, color: '#103747' }}>Move Ronin Around House</div>
            <div>
              <strong>WASD / Arrows</strong> or <strong>Click Ground</strong>
            </div>
            <div style={{ opacity: 0.8 }}>Drag to Orbit 360° • Scroll to Zoom</div>
          </div>
        </div>

        {/* Camera Preset Selector Bar */}
        <div
          style={{
            background: 'rgba(255, 252, 246, 0.84)',
            backdropFilter: 'blur(12px)',
            padding: '6px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.75)',
            boxShadow: '0 8px 28px rgba(10, 68, 92, 0.14)',
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            pointerEvents: 'auto',
          }}
        >
          {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((key) => {
            const isActive = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectPreset(key)}
                style={{
                  background: isActive ? '#0d89b3' : 'transparent',
                  color: isActive ? '#ffffff' : '#1c4959',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {CAMERA_PRESETS[key].label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const dpadButtonStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '8px',
  border: '1px solid rgba(13, 137, 179, 0.28)',
  background: 'rgba(255, 255, 255, 0.9)',
  color: '#0d89b3',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
};
