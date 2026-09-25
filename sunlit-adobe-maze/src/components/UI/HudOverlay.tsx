import { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  INITIAL_SUN_RELICS,
  LANDMARK_ZONES,
  MAZE_COLS,
  MAZE_DATA,
  MAZE_ROWS,
  cellToWorld,
  isPassageOpen,
  worldToCell,
  type LandmarkZone,
} from '../../utils/mazeLayout';
import {
  CAMERA_MODE_LABELS,
  type CameraMode,
  type SunMood,
  type VirtualWalkInput,
} from '../../hooks/useMazeState';

interface HudOverlayProps {
  visible: boolean;
  cameraMode: CameraMode;
  sunMood: SunMood;
  showGuidePath: boolean;
  autoWalk: boolean;
  hoveredItem: string | null;
  currentZoneId: string;
  targetZoneId: string;
  discoveredZones: string[];
  discoveryToast: LandmarkZone | null;
  collectedRelics: number[];
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterYawRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualWalkInput>;
  onSelectCameraMode: (mode: CameraMode) => void;
  onCycleSunMood: () => void;
  onToggleGuidePath: () => void;
  onToggleAutoWalk: () => void;
  onTriggerWave: () => void;
  onNavigateToZone: (zone: LandmarkZone, teleport?: boolean) => void;
  onMiniMapCellClick: (worldPt: THREE.Vector3) => void;
}

export default function HudOverlay({
  visible,
  cameraMode,
  sunMood,
  showGuidePath,
  autoWalk,
  hoveredItem,
  currentZoneId,
  targetZoneId,
  discoveredZones,
  discoveryToast,
  collectedRelics,
  characterPosRef,
  characterYawRef: _characterYawRef,
  virtualInputRef,
  onSelectCameraMode,
  onCycleSunMood,
  onToggleGuidePath,
  onToggleAutoWalk,
  onTriggerWave,
  onNavigateToZone,
  onMiniMapCellClick,
}: HudOverlayProps) {
  // Poll character cell coordinates and only trigger React re-render when crossing into a new cell
  const [liveCharState, setLiveCharState] = useState<{
    row: number;
    col: number;
  }>({ row: 5, col: 1 });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const p = characterPosRef.current;
      const cell = worldToCell(p.x, p.z);
      setLiveCharState((prev) =>
        prev.row === cell.row && prev.col === cell.col
          ? prev
          : { row: cell.row, col: cell.col }
      );
    }, 100);
    return () => window.clearInterval(timer);
  }, [characterPosRef]);

  const setInput = (key: keyof VirtualWalkInput, active: boolean) => {
    virtualInputRef.current[key] = active;
  };

  const currentZone =
    LANDMARK_ZONES.find((z) => z.id === currentZoneId) || LANDMARK_ZONES[0];

  const moodLabel =
    sunMood === 'morning-gold'
      ? '☀️ Morning Lattice Gold'
      : sunMood === 'amber-afternoon'
        ? '🌅 Warm Amber Siesta'
        : '🏮 Sanctuary Lantern Dusk';

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
        padding: '16px 20px',
      }}
    >
      {/* ================================================================= */}
      {/* TOP BAR: Title Card + Chamber Stepper + POV & Lighting Pills      */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Brand & Maze Progress Card */}
        <div
          style={{
            background: 'rgba(252, 246, 236, 0.9)',
            backdropFilter: 'blur(14px)',
            padding: '12px 18px',
            borderRadius: '18px',
            border: '1px solid rgba(224, 196, 162, 0.88)',
            boxShadow: '0 10px 28px rgba(52, 30, 14, 0.18)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '15px',
                color: '#d4241b',
                animation: 'floatSparkle 2.4s ease-in-out infinite',
              }}
            >
              ✦
            </span>
            <span
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '23px',
                fontWeight: 700,
                color: '#362011',
                letterSpacing: '0.01em',
              }}
            >
              Mina & the Sunlit Labyrinth
            </span>
          </div>

          <div
            style={{
              fontSize: '11.5px',
              color: '#6e4c32',
              marginTop: '2px',
              fontWeight: 600,
            }}
          >
            📍 {currentZone.title} —{' '}
            <span style={{ opacity: 0.85 }}>{currentZone.subtitle}</span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
              fontSize: '11px',
              fontWeight: 700,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                background: 'rgba(156, 76, 39, 0.13)',
                color: '#8a3e1b',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              🏛️ {discoveredZones.length} / {LANDMARK_ZONES.length} Chambers
            </span>
            <span
              style={{
                background: 'rgba(212, 36, 27, 0.12)',
                color: '#b81d15',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              ✧ {collectedRelics.length} / {INITIAL_SUN_RELICS.length} Sun Relics
            </span>
          </div>
        </div>

        {/* Center Interactive Chamber Guide Stepper */}
        <div
          style={{
            background: 'rgba(252, 246, 236, 0.88)',
            backdropFilter: 'blur(14px)',
            padding: '6px 8px',
            borderRadius: '999px',
            border: '1px solid rgba(224, 196, 162, 0.85)',
            boxShadow: '0 8px 24px rgba(52, 30, 14, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
            pointerEvents: 'auto',
          }}
        >
          {LANDMARK_ZONES.map((zone) => {
            const isCurrent = zone.id === currentZoneId;
            const isTarget = zone.id === targetZoneId;
            const isDiscovered = discoveredZones.includes(zone.id);
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onNavigateToZone(zone, false)}
                onDoubleClick={() => onNavigateToZone(zone, true)}
                title={`Click to guide Mina to ${zone.title} (Double-click to teleport)`}
                style={{
                  background: isCurrent
                    ? '#9c4c27'
                    : isTarget
                      ? 'rgba(212, 36, 27, 0.14)'
                      : isDiscovered
                        ? 'rgba(156, 76, 39, 0.1)'
                        : 'transparent',
                  color: isCurrent
                    ? '#ffffff'
                    : isTarget
                      ? '#b01e16'
                      : isDiscovered
                        ? '#4a2c18'
                        : '#8c6f56',
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
                  {zone.index + 1}.{' '}
                  {zone.title
                    .replace('Gallery of ', '')
                    .replace('Hall of ', '')
                    .replace("The Weaver's ", '')
                    .replace('Cloister of ', '')
                    .replace('Sanctuary of ', '')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Top-Right Action Pills: POV Toggle, Sun-Thread Guide, Auto-Walk, Sun Mood */}
        <div
          style={{
            display: 'flex',
            gap: '7px',
            flexWrap: 'wrap',
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() =>
              onSelectCameraMode(cameraMode === 'pov' ? 'follow' : 'pov')
            }
            style={{
              background:
                cameraMode === 'pov'
                  ? 'linear-gradient(135deg, #d4241b, #9c381f)'
                  : 'rgba(252, 246, 236, 0.92)',
              color: cameraMode === 'pov' ? '#ffffff' : '#3b2313',
              border: '1px solid rgba(224, 196, 162, 0.9)',
              backdropFilter: 'blur(12px)',
              padding: '8px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(52, 30, 14, 0.16)',
            }}
          >
            {cameraMode === 'pov' ? '👁️ Character POV: ON (V)' : '👁️ Switch to Character POV (V)'}
          </button>

          <button
            type="button"
            onClick={onToggleGuidePath}
            style={{
              background: showGuidePath
                ? 'rgba(156, 76, 39, 0.92)'
                : 'rgba(252, 246, 236, 0.9)',
              color: showGuidePath ? '#fff8ec' : '#4a2c18',
              border: '1px solid rgba(224, 196, 162, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 13px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(52, 30, 14, 0.14)',
            }}
          >
            {showGuidePath ? '✨ Sun-Thread: ON' : '✨ Sun-Thread: OFF'}
          </button>

          <button
            type="button"
            onClick={onToggleAutoWalk}
            style={{
              background: autoWalk
                ? 'linear-gradient(135deg, #b85d28, #d98238)'
                : 'rgba(252, 246, 236, 0.9)',
              color: autoWalk ? '#ffffff' : '#4a2c18',
              border: '1px solid rgba(224, 196, 162, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 13px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(52, 30, 14, 0.14)',
            }}
          >
            {autoWalk ? '🧭 Auto-Stroll: ON' : '🧭 Auto-Stroll'}
          </button>

          <button
            type="button"
            onClick={onCycleSunMood}
            style={{
              background: 'rgba(252, 246, 236, 0.9)',
              color: '#4a2c18',
              border: '1px solid rgba(224, 196, 162, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 13px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(52, 30, 14, 0.14)',
            }}
          >
            {moodLabel}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CENTER TOASTS & HOVER TOOLTIP                                     */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {discoveryToast && (
          <div
            style={{
              background: 'rgba(46, 28, 16, 0.92)',
              color: '#fff6e8',
              padding: '12px 24px',
              borderRadius: '18px',
              border: '1px solid rgba(235, 190, 128, 0.55)',
              boxShadow: '0 16px 36px rgba(28, 14, 6, 0.38)',
              textAlign: 'center',
              animation: 'toastPop 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#f0b865',
                fontWeight: 700,
              }}
            >
              ✦ Chamber Discovered ✦
            </div>
            <div
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '22px',
                fontWeight: 700,
                marginTop: '2px',
              }}
            >
              {discoveryToast.title}
            </div>
            <div style={{ fontSize: '11.5px', opacity: 0.86 }}>
              {discoveryToast.subtitle}
            </div>
          </div>
        )}

        {hoveredItem && (
          <div
            style={{
              background: 'rgba(48, 29, 16, 0.86)',
              color: '#fdf3e3',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(232, 196, 152, 0.35)',
            }}
          >
            {hoveredItem}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* BOTTOM BAR: Parchment Maze Map + Camera Switcher + Tactile D-Pad  */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        {/* Bottom-Left Interactive 7x7 Architectural Maze Mini-Map */}
        <div
          style={{
            background: 'rgba(250, 242, 228, 0.92)',
            backdropFilter: 'blur(14px)',
            padding: '11px 13px',
            borderRadius: '18px',
            border: '1px solid rgba(214, 182, 144, 0.9)',
            boxShadow: '0 12px 30px rgba(48, 26, 12, 0.22)',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#5c3b23',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span>🗺️ Labyrinth Floorplan</span>
            <span style={{ fontSize: '9.5px', opacity: 0.75 }}>Click tile to walk</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${MAZE_COLS}, 20px)`,
              gridTemplateRows: `repeat(${MAZE_ROWS}, 20px)`,
              background: '#dfcbb0',
              border: '2px solid #6e482b',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {MAZE_DATA.cells.map((cell) => {
              const isPlayerHere =
                liveCharState.row === cell.row && liveCharState.col === cell.col;
              const zone = LANDMARK_ZONES.find(
                (z) => z.row === cell.row && z.col === cell.col
              );
              const hasUncollectedRelic = INITIAL_SUN_RELICS.some(
                (r) =>
                  r.row === cell.row &&
                  r.col === cell.col &&
                  !collectedRelics.includes(r.id)
              );

              const wallColor = '#6b4428';
              const borderTop = isPassageOpen(cell.row, cell.col, 'N')
                ? '1px solid rgba(107, 68, 40, 0.12)'
                : `2.5px solid ${wallColor}`;
              const borderBottom = isPassageOpen(cell.row, cell.col, 'S')
                ? '1px solid rgba(107, 68, 40, 0.12)'
                : `2.5px solid ${wallColor}`;
              const borderLeft = isPassageOpen(cell.row, cell.col, 'W')
                ? '1px solid rgba(107, 68, 40, 0.12)'
                : `2.5px solid ${wallColor}`;
              const borderRight = isPassageOpen(cell.row, cell.col, 'E')
                ? '1px solid rgba(107, 68, 40, 0.12)'
                : `2.5px solid ${wallColor}`;

              return (
                <button
                  key={`map-${cell.row}-${cell.col}`}
                  type="button"
                  onClick={() => {
                    const w = cellToWorld(cell.row, cell.col);
                    onMiniMapCellClick(new THREE.Vector3(w.x, 0, w.z));
                  }}
                  title={
                    zone
                      ? `${zone.title} — Click to walk here`
                      : `Corridor [${cell.row + 1}, ${cell.col + 1}] — Click to walk here`
                  }
                  style={{
                    width: '20px',
                    height: '20px',
                    padding: 0,
                    background: isPlayerHere
                      ? 'rgba(212, 36, 27, 0.25)'
                      : zone
                        ? 'rgba(196, 128, 62, 0.32)'
                        : '#efe2ce',
                    borderTop,
                    borderBottom,
                    borderLeft,
                    borderRight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {isPlayerHere ? (
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: '#d4241b',
                        border: '1.5px solid #ffffff',
                        boxShadow: '0 0 6px rgba(212, 36, 27, 0.8)',
                        display: 'inline-block',
                      }}
                    />
                  ) : zone ? (
                    <span style={{ fontSize: '9px', color: '#8a3e1b', fontWeight: 700 }}>
                      {zone.index + 1}
                    </span>
                  ) : hasUncollectedRelic ? (
                    <span style={{ fontSize: '8px', color: '#c97b16' }}>✧</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom-Center Camera Mode Switcher & Controls Guide */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              background: 'rgba(252, 246, 236, 0.9)',
              backdropFilter: 'blur(14px)',
              padding: '5px',
              borderRadius: '999px',
              border: '1px solid rgba(224, 196, 162, 0.88)',
              boxShadow: '0 10px 28px rgba(52, 30, 14, 0.16)',
              display: 'flex',
              gap: '4px',
            }}
          >
            {(['follow', 'pov', 'painting'] as CameraMode[]).map((mode) => {
              const active = cameraMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelectCameraMode(mode)}
                  style={{
                    background: active ? '#8c4220' : 'transparent',
                    color: active ? '#ffffff' : '#4a2c18',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {CAMERA_MODE_LABELS[mode].label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              background: 'rgba(46, 28, 16, 0.78)',
              color: '#f8ebd8',
              padding: '5px 14px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 500,
              backdropFilter: 'blur(8px)',
            }}
          >
            <strong>WASD / Arrows</strong> Move • <strong>Drag / Q & E</strong> Look •{' '}
            <strong>V</strong> Character POV • <strong>Shift</strong> Sprint •{' '}
            <strong>F / Space</strong> Wave • <strong>Click Floor</strong> Walk
          </div>
        </div>

        {/* Bottom-Right On-Screen Tactile Movement & Look Pad */}
        <div
          style={{
            background: 'rgba(252, 246, 236, 0.9)',
            backdropFilter: 'blur(14px)',
            padding: '10px 12px',
            borderRadius: '18px',
            border: '1px solid rgba(224, 196, 162, 0.88)',
            boxShadow: '0 10px 28px rgba(52, 30, 14, 0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto',
          }}
        >
          {/* D-Pad Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 32px)',
              gridTemplateRows: 'repeat(2, 32px)',
              gap: '4px',
            }}
          >
            <button
              type="button"
              title="Look Left (Q)"
              onPointerDown={() => setInput('turnLeft', true)}
              onPointerUp={() => setInput('turnLeft', false)}
              onPointerLeave={() => setInput('turnLeft', false)}
              style={padBtnStyle('#ede0cd', '#5c3b23')}
            >
              ↶
            </button>
            <button
              type="button"
              title="Walk Forward (W)"
              onPointerDown={() => setInput('up', true)}
              onPointerUp={() => setInput('up', false)}
              onPointerLeave={() => setInput('up', false)}
              style={padBtnStyle('#9c4c27', '#ffffff')}
            >
              ▲
            </button>
            <button
              type="button"
              title="Look Right (E)"
              onPointerDown={() => setInput('turnRight', true)}
              onPointerUp={() => setInput('turnRight', false)}
              onPointerLeave={() => setInput('turnRight', false)}
              style={padBtnStyle('#ede0cd', '#5c3b23')}
            >
              ↷
            </button>
            <button
              type="button"
              title="Step Left (A)"
              onPointerDown={() => setInput('left', true)}
              onPointerUp={() => setInput('left', false)}
              onPointerLeave={() => setInput('left', false)}
              style={padBtnStyle('#e6d5bd', '#4a2c18')}
            >
              ◀
            </button>
            <button
              type="button"
              title="Step Back (S)"
              onPointerDown={() => setInput('down', true)}
              onPointerUp={() => setInput('down', false)}
              onPointerLeave={() => setInput('down', false)}
              style={padBtnStyle('#e6d5bd', '#4a2c18')}
            >
              ▼
            </button>
            <button
              type="button"
              title="Step Right (D)"
              onPointerDown={() => setInput('right', true)}
              onPointerUp={() => setInput('right', false)}
              onPointerLeave={() => setInput('right', false)}
              style={padBtnStyle('#e6d5bd', '#4a2c18')}
            >
              ▶
            </button>
          </div>

          {/* Sprint & Wave Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              onPointerDown={() => setInput('sprint', true)}
              onPointerUp={() => setInput('sprint', false)}
              onPointerLeave={() => setInput('sprint', false)}
              style={{
                ...padBtnStyle('#d4241b', '#ffffff'),
                width: '66px',
                fontSize: '11px',
              }}
            >
              ⚡ Sprint
            </button>
            <button
              type="button"
              onClick={onTriggerWave}
              style={{
                ...padBtnStyle('#ede0cd', '#4a2c18'),
                width: '66px',
                fontSize: '11px',
              }}
            >
              👋 Wave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function padBtnStyle(bg: string, color: string): React.CSSProperties {
  return {
    width: '32px',
    height: '32px',
    borderRadius: '9px',
    border: '1px solid rgba(156, 106, 68, 0.32)',
    background: bg,
    color,
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  };
}
