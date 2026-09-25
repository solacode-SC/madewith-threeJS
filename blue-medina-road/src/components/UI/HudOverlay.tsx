import {
  INITIAL_SKY_STARS,
  LANDMARK_ZONES,
  type LandmarkZone,
} from '../../utils/roadPath';
import {
  CAMERA_MODES,
  type CameraMode,
  type TimeOfDay,
  type VirtualFlightInput,
} from '../../hooks/useSceneState';

interface HudOverlayProps {
  visible: boolean;
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  autoFly: boolean;
  hoveredItem: string | null;
  currentZoneId: string;
  discoveredZones: string[];
  discoveryToast: LandmarkZone | null;
  collectedStars: number[];
  virtualInputRef: React.MutableRefObject<VirtualFlightInput>;
  onSelectCameraMode: (mode: CameraMode) => void;
  onCycleTimeOfDay: () => void;
  onToggleAutoFly: () => void;
  onJumpToZone: (zone: LandmarkZone) => void;
}

export default function HudOverlay({
  visible,
  cameraMode,
  timeOfDay,
  autoFly,
  hoveredItem,
  currentZoneId,
  discoveredZones,
  discoveryToast,
  collectedStars,
  virtualInputRef,
  onSelectCameraMode,
  onCycleTimeOfDay,
  onToggleAutoFly,
  onJumpToZone,
}: HudOverlayProps) {
  const setInput = (key: keyof VirtualFlightInput, active: boolean) => {
    virtualInputRef.current[key] = active;
  };

  const currentZone =
    LANDMARK_ZONES.find((z) => z.id === currentZoneId) || LANDMARK_ZONES[0];

  const timeLabel =
    timeOfDay === 'noon'
      ? '☀️ Chefchaouen Noon'
      : timeOfDay === 'sunset'
        ? '🌅 Golden Medina'
        : '✨ Starlit Fantasy';

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
        padding: '18px 22px',
      }}
    >
      {/* ========================================================= */}
      {/* TOP BAR: Brand Card + Road Discovery Map + Action Pills   */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Brand & Discovery Stats Card */}
        <div
          style={{
            background: 'rgba(248, 252, 255, 0.88)',
            backdropFilter: 'blur(14px)',
            padding: '12px 18px',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 10px 30px rgba(12, 48, 120, 0.16)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '15px',
                color: '#f28b7d',
                animation: 'floatSparkle 2.4s ease-in-out infinite',
              }}
            >
              ✧
            </span>
            <span
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '23px',
                fontWeight: 700,
                color: '#0e2d68',
                letterSpacing: '0.01em',
              }}
            >
              Lumina & the Azure Steps
            </span>
          </div>

          <div
            style={{
              fontSize: '11.5px',
              color: '#3a5d96',
              marginTop: '2px',
              fontWeight: 600,
            }}
          >
            📍 {currentZone.title} — <span style={{ opacity: 0.85 }}>{currentZone.subtitle}</span>
          </div>

          {/* Discovery & Star Badges */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                background: 'rgba(26, 95, 200, 0.12)',
                color: '#1652b8',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              🧭 {discoveredZones.length} / {LANDMARK_ZONES.length} Landmarks Discovered
            </span>
            <span
              style={{
                background: 'rgba(242, 149, 134, 0.18)',
                color: '#b84b3e',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              ✧ {collectedStars.length} / {INITIAL_SKY_STARS.length} Sky Stars
            </span>
          </div>
        </div>

        {/* Center Interactive Long-Road Landmark Stepper */}
        <div
          style={{
            background: 'rgba(248, 252, 255, 0.86)',
            backdropFilter: 'blur(14px)',
            padding: '6px 8px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 8px 26px rgba(12, 48, 120, 0.14)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
            pointerEvents: 'auto',
          }}
        >
          {LANDMARK_ZONES.map((zone) => {
            const isCurrent = zone.id === currentZoneId;
            const isDiscovered = discoveredZones.includes(zone.id);
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onJumpToZone(zone)}
                title={`Fly to ${zone.title}`}
                style={{
                  background: isCurrent
                    ? '#1b63d4'
                    : isDiscovered
                      ? 'rgba(27, 99, 212, 0.1)'
                      : 'transparent',
                  color: isCurrent
                    ? '#ffffff'
                    : isDiscovered
                      ? '#13469e'
                      : '#6882ad',
                  border: 'none',
                  padding: '6px 11px',
                  borderRadius: '999px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{isDiscovered ? '✦' : '○'}</span>
                <span>
                  {zone.index + 1}. {zone.title.replace("The ", '').replace('Courtyard of the ', '')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Top-Right Flight & Atmosphere Toggles */}
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
            onClick={onToggleAutoFly}
            style={{
              background: autoFly
                ? 'linear-gradient(135deg, #1b63d4, #3d8ef5)'
                : 'rgba(248, 252, 255, 0.88)',
              color: autoFly ? '#ffffff' : '#103478',
              border: '1px solid rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '9px 15px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(12, 48, 120, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            {autoFly ? '✨ Auto-Fly Journey: ON' : '🕊️ Auto-Fly Road'}
          </button>

          <button
            type="button"
            onClick={onCycleTimeOfDay}
            style={{
              background:
                timeOfDay === 'starlight'
                  ? 'rgba(18, 38, 92, 0.92)'
                  : timeOfDay === 'sunset'
                    ? 'rgba(224, 112, 56, 0.92)'
                    : 'rgba(248, 252, 255, 0.88)',
              color: timeOfDay === 'noon' ? '#103478' : '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '9px 15px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(12, 48, 120, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            {timeLabel}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CENTER DISCOVERY NOTIFICATION BANNER & HOVER TOOLTIP      */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {discoveryToast && (
          <div
            style={{
              background: 'rgba(14, 45, 108, 0.9)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '20px',
              border: '1px solid rgba(155, 218, 255, 0.5)',
              boxShadow: '0 14px 36px rgba(6, 24, 68, 0.35)',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
              maxWidth: '460px',
              animation: 'toastPop 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#8ce0ff',
                marginBottom: '2px',
              }}
            >
              ✧ New Landmark Discovered ({discoveredZones.length}/{LANDMARK_ZONES.length}) ✧
            </div>
            <div
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '22px',
                fontWeight: 700,
                color: '#fff8e8',
              }}
            >
              {discoveryToast.title}
            </div>
            <div style={{ fontSize: '11.5px', color: '#cfe6ff', marginTop: '2px' }}>
              {discoveryToast.description}
            </div>
          </div>
        )}

        {hoveredItem && (
          <div
            style={{
              background: 'rgba(14, 45, 104, 0.86)',
              color: '#f7fbff',
              padding: '7px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            {hoveredItem}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* BOTTOM BAR: Flight Pad + Altitude Controls + Camera Modes */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        {/* On-Screen Flight & Altitude Controller */}
        <div
          style={{
            background: 'rgba(248, 252, 255, 0.88)',
            backdropFilter: 'blur(14px)',
            padding: '12px 15px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 10px 30px rgba(12, 48, 120, 0.16)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Directional Flight Pad */}
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
              aria-label="Fly Forward"
              onPointerDown={() => setInput('up', true)}
              onPointerUp={() => setInput('up', false)}
              onPointerLeave={() => setInput('up', false)}
              style={padBtnStyle}
            >
              ▲
            </button>
            <div />
            <button
              type="button"
              aria-label="Fly Left"
              onPointerDown={() => setInput('left', true)}
              onPointerUp={() => setInput('left', false)}
              onPointerLeave={() => setInput('left', false)}
              style={padBtnStyle}
            >
              ◀
            </button>
            <button
              type="button"
              aria-label="Fly Backward"
              onPointerDown={() => setInput('down', true)}
              onPointerUp={() => setInput('down', false)}
              onPointerLeave={() => setInput('down', false)}
              style={padBtnStyle}
            >
              ▼
            </button>
            <button
              type="button"
              aria-label="Fly Right"
              onPointerDown={() => setInput('right', true)}
              onPointerUp={() => setInput('right', false)}
              onPointerLeave={() => setInput('right', false)}
              style={padBtnStyle}
            >
              ▶
            </button>
          </div>

          {/* Vertical Altitude & Boost Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              onPointerDown={() => setInput('ascend', true)}
              onPointerUp={() => setInput('ascend', false)}
              onPointerLeave={() => setInput('ascend', false)}
              style={altBtnStyle}
              title="Hold to Fly Higher (Space / E)"
            >
              ⬆ Soar Up
            </button>
            <button
              type="button"
              onPointerDown={() => setInput('descend', true)}
              onPointerUp={() => setInput('descend', false)}
              onPointerLeave={() => setInput('descend', false)}
              style={altBtnStyle}
              title="Hold to Swoop Lower (C / Q)"
            >
              ⬇ Swoop Low
            </button>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: '11.5px', color: '#2b4f85', lineHeight: 1.45 }}>
            <div style={{ fontWeight: 700, color: '#0e2d68' }}>
              🕊️ Fly Lumina Along the Blue Road
            </div>
            <div>
              <strong>WASD / Arrows</strong> to Glide • <strong>Shift</strong> Boost
            </div>
            <div>
              <strong>Space / C</strong> Altitude • <strong>Click Steps</strong> to Fly
            </div>
          </div>
        </div>

        {/* Camera Viewpoint Selector Bar */}
        <div
          style={{
            background: 'rgba(248, 252, 255, 0.88)',
            backdropFilter: 'blur(14px)',
            padding: '6px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 10px 30px rgba(12, 48, 120, 0.16)',
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            pointerEvents: 'auto',
          }}
        >
          {(Object.keys(CAMERA_MODES) as CameraMode[]).map((mode) => {
            const isActive = cameraMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onSelectCameraMode(mode)}
                style={{
                  background: isActive ? '#1b63d4' : 'transparent',
                  color: isActive ? '#ffffff' : '#183f82',
                  border: 'none',
                  padding: '8px 13px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {CAMERA_MODES[mode].label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const padBtnStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '8px',
  border: '1px solid rgba(27, 99, 212, 0.28)',
  background: 'rgba(255, 255, 255, 0.92)',
  color: '#1b63d4',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
};

const altBtnStyle: React.CSSProperties = {
  height: '30px',
  padding: '0 10px',
  borderRadius: '8px',
  border: '1px solid rgba(27, 99, 212, 0.28)',
  background: 'rgba(255, 255, 255, 0.92)',
  color: '#1b63d4',
  fontSize: '10.5px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};
