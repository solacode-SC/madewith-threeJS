import { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  INITIAL_GOLDEN_DATES,
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
  onSelectCameraMode: (mode: CameraMode | ((prev: CameraMode) => CameraMode)) => void;
  onCycleSunMood: () => void;
  onToggleGuidePath: () => void;
  onToggleAutoWalk: () => void;
  onTriggerWave: () => void;
  onNavigateToZone: (zone: LandmarkZone, teleport?: boolean) => void;
  onMiniMapCellClick: (point: THREE.Vector3) => void;
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
      ? '☀️ Morning Gold'
      : sunMood === 'amber-afternoon'
        ? '🌅 Warm Amber Afternoon'
        : '🏮 Lantern Dusk';

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
            background: 'rgba(245, 235, 220, 0.88)',
            backdropFilter: 'blur(14px)',
            padding: '12px 18px',
            borderRadius: '18px',
            border: '1px solid rgba(186, 153, 115, 0.88)',
            boxShadow: '0 10px 28px rgba(58, 42, 26, 0.18)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '15px',
                color: '#D4A853',
                animation: 'floatSparkle 2.4s ease-in-out infinite',
              }}
            >
              🌴
            </span>
            <span
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '23px',
                fontWeight: 700,
                color: '#3A2A1A',
                letterSpacing: '0.01em',
              }}
            >
              Hana & the Palm Village Maze
            </span>
          </div>

          <div
            style={{
              fontSize: '11.5px',
              color: '#5c4832',
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
                background: 'rgba(186, 153, 115, 0.2)',
                color: '#3A2A1A',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              🏛️ {discoveredZones.length} / {LANDMARK_ZONES.length} Zones
            </span>
            <span
              style={{
                background: 'rgba(212, 168, 83, 0.2)',
                color: '#8c6b22',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              🌴 {collectedRelics.length} / {INITIAL_GOLDEN_DATES.length} Golden Dates
            </span>
          </div>
        </div>

        {/* Center Interactive Chamber Guide Stepper */}
        <div
          style={{
            background: 'rgba(245, 235, 220, 0.88)',
            backdropFilter: 'blur(14px)',
            padding: '6px 8px',
            borderRadius: '999px',
            border: '1px solid rgba(186, 153, 115, 0.85)',
            boxShadow: '0 8px 24px rgba(58, 42, 26, 0.15)',
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
                title={`Click to guide Hana to ${zone.title} (Double-click to teleport)`}
                style={{
                  background: isCurrent
                    ? '#D4A853'
                    : isTarget
                      ? 'rgba(212, 168, 83, 0.25)'
                      : isDiscovered
                        ? 'rgba(186, 153, 115, 0.15)'
                        : 'transparent',
                  color: isCurrent
                    ? '#3A2A1A'
                    : isTarget
                      ? '#8c6b22'
                      : isDiscovered
                        ? '#4a3b2a'
                        : '#8c7e6c',
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
                <span>{isDiscovered ? '🌴' : '○'}</span>
                <span>
                  {zone.index + 1}.{' '}
                  {zone.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Top-Right Action Pills: POV Toggle, Guide, Auto-Walk, Sun Mood */}
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
              onSelectCameraMode((prev) => (prev === 'pov' ? 'follow' : 'pov'))
            }
            style={{
              background:
                cameraMode === 'pov'
                  ? 'linear-gradient(135deg, #D4A853, #b88d3e)'
                  : 'rgba(245, 235, 220, 0.92)',
              color: cameraMode === 'pov' ? '#3A2A1A' : '#3A2A1A',
              border: '1px solid rgba(186, 153, 115, 0.9)',
              backdropFilter: 'blur(12px)',
              padding: '8px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(58, 42, 26, 0.16)',
            }}
          >
            {cameraMode === 'pov' ? '👁️ Character POV: ON (V)' : '👁️ Switch to Character POV (V)'}
          </button>

          <button
            type="button"
            onClick={onToggleGuidePath}
            style={{
              background: showGuidePath
                ? 'rgba(212, 168, 83, 0.92)'
                : 'rgba(245, 235, 220, 0.9)',
              color: showGuidePath ? '#3A2A1A' : '#3A2A1A',
              border: '1px solid rgba(186, 153, 115, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 13px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(58, 42, 26, 0.14)',
            }}
          >
            {showGuidePath ? '✨ Guide: ON' : '✨ Guide: OFF'}
          </button>

          <button
            type="button"
            onClick={onToggleAutoWalk}
            style={{
              background: autoWalk
                ? 'linear-gradient(135deg, #D4A853, #e6c581)'
                : 'rgba(245, 235, 220, 0.9)',
              color: autoWalk ? '#3A2A1A' : '#3A2A1A',
              border: '1px solid rgba(186, 153, 115, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 13px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(58, 42, 26, 0.14)',
            }}
          >
            {autoWalk ? '🧭 Auto-Stroll: ON' : '🧭 Auto-Stroll'}
          </button>

          <button
            type="button"
            onClick={onCycleSunMood}
            style={{
              background: 'rgba(245, 235, 220, 0.9)',
              color: '#3A2A1A',
              border: '1px solid rgba(186, 153, 115, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 13px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(58, 42, 26, 0.14)',
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
              background: 'rgba(245, 235, 220, 0.92)',
              color: '#3A2A1A',
              padding: '12px 24px',
              borderRadius: '18px',
              border: '1px solid rgba(212, 168, 83, 0.85)',
              boxShadow: '0 16px 36px rgba(58, 42, 26, 0.38)',
              textAlign: 'center',
              animation: 'toastPop 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#D4A853',
                fontWeight: 700,
              }}
            >
              🌴 Zone Discovered 🌴
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
              background: 'rgba(245, 235, 220, 0.86)',
              color: '#3A2A1A',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(186, 153, 115, 0.35)',
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
            background: 'rgba(245, 235, 220, 0.92)',
            backdropFilter: 'blur(14px)',
            padding: '11px 13px',
            borderRadius: '18px',
            border: '1px solid rgba(186, 153, 115, 0.9)',
            boxShadow: '0 12px 30px rgba(58, 42, 26, 0.22)',
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
              color: '#3A2A1A',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span>🗺️ Village Layout</span>
            <span style={{ fontSize: '9.5px', opacity: 0.75 }}>Click tile to walk</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${MAZE_COLS}, 20px)`,
              gridTemplateRows: `repeat(${MAZE_ROWS}, 20px)`,
              background: '#e0cfa8',
              border: '2px solid #8c7e6c',
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
              const hasUncollectedRelic = INITIAL_GOLDEN_DATES.some(
                (r) =>
                  r.row === cell.row &&
                  r.col === cell.col &&
                  !collectedRelics.includes(r.id)
              );

              const wallColor = '#8c7e6c';
              const borderTop = isPassageOpen(cell.row, cell.col, 'N')
                ? '1px solid rgba(140, 126, 108, 0.12)'
                : `2.5px solid ${wallColor}`;
              const borderBottom = isPassageOpen(cell.row, cell.col, 'S')
                ? '1px solid rgba(140, 126, 108, 0.12)'
                : `2.5px solid ${wallColor}`;
              const borderLeft = isPassageOpen(cell.row, cell.col, 'W')
                ? '1px solid rgba(140, 126, 108, 0.12)'
                : `2.5px solid ${wallColor}`;
              const borderRight = isPassageOpen(cell.row, cell.col, 'E')
                ? '1px solid rgba(140, 126, 108, 0.12)'
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
                      : `Alley [${cell.row + 1}, ${cell.col + 1}] — Click to walk here`
                  }
                  style={{
                    width: '20px',
                    height: '20px',
                    padding: 0,
                    background: isPlayerHere
                      ? 'rgba(212, 168, 83, 0.4)'
                      : zone
                        ? 'rgba(186, 153, 115, 0.32)'
                        : '#f5ebdc',
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
                        background: '#D4A853',
                        border: '1.5px solid #ffffff',
                        boxShadow: '0 0 6px rgba(212, 168, 83, 0.8)',
                        display: 'inline-block',
                      }}
                    />
                  ) : zone ? (
                    <span style={{ fontSize: '9px', color: '#3A2A1A', fontWeight: 700 }}>
                      {zone.index + 1}
                    </span>
                  ) : hasUncollectedRelic ? (
                    <span style={{ fontSize: '8px', color: '#c97b16' }}>🌴</span>
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
              background: 'rgba(245, 235, 220, 0.9)',
              backdropFilter: 'blur(14px)',
              padding: '5px',
              borderRadius: '999px',
              border: '1px solid rgba(186, 153, 115, 0.88)',
              boxShadow: '0 10px 28px rgba(58, 42, 26, 0.16)',
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
                    background: active ? '#D4A853' : 'transparent',
                    color: active ? '#3A2A1A' : '#3A2A1A',
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
              background: 'rgba(245, 235, 220, 0.78)',
              color: '#3A2A1A',
              padding: '5px 14px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(186, 153, 115, 0.5)',
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
            background: 'rgba(245, 235, 220, 0.9)',
            backdropFilter: 'blur(14px)',
            padding: '10px 12px',
            borderRadius: '18px',
            border: '1px solid rgba(186, 153, 115, 0.88)',
            boxShadow: '0 10px 28px rgba(58, 42, 26, 0.18)',
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
              style={padBtnStyle('#e0cfa8', '#3A2A1A')}
            >
              ↶
            </button>
            <button
              type="button"
              title="Walk Forward (W)"
              onPointerDown={() => setInput('up', true)}
              onPointerUp={() => setInput('up', false)}
              onPointerLeave={() => setInput('up', false)}
              style={padBtnStyle('#D4A853', '#3A2A1A')}
            >
              ▲
            </button>
            <button
              type="button"
              title="Look Right (E)"
              onPointerDown={() => setInput('turnRight', true)}
              onPointerUp={() => setInput('turnRight', false)}
              onPointerLeave={() => setInput('turnRight', false)}
              style={padBtnStyle('#e0cfa8', '#3A2A1A')}
            >
              ↷
            </button>
            <button
              type="button"
              title="Step Left (A)"
              onPointerDown={() => setInput('left', true)}
              onPointerUp={() => setInput('left', false)}
              onPointerLeave={() => setInput('left', false)}
              style={padBtnStyle('#f5ebdc', '#3A2A1A')}
            >
              ◀
            </button>
            <button
              type="button"
              title="Step Back (S)"
              onPointerDown={() => setInput('down', true)}
              onPointerUp={() => setInput('down', false)}
              onPointerLeave={() => setInput('down', false)}
              style={padBtnStyle('#f5ebdc', '#3A2A1A')}
            >
              ▼
            </button>
            <button
              type="button"
              title="Step Right (D)"
              onPointerDown={() => setInput('right', true)}
              onPointerUp={() => setInput('right', false)}
              onPointerLeave={() => setInput('right', false)}
              style={padBtnStyle('#f5ebdc', '#3A2A1A')}
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
                ...padBtnStyle('#D4A853', '#3A2A1A'),
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
                ...padBtnStyle('#e0cfa8', '#3A2A1A'),
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
    border: '1px solid rgba(186, 153, 115, 0.5)',
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
