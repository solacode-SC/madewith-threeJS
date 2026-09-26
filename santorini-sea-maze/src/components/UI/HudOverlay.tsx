import { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  INITIAL_SEA_PEARLS,
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
  onTriggerJump: () => void;
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
  onTriggerJump,
  onNavigateToZone,
  onMiniMapCellClick,
}: HudOverlayProps) {
  const [liveCharState, setLiveCharState] = useState<{
    row: number;
    col: number;
  }>({ row: 6, col: 3 });

  const [showAllPlacesModal, setShowAllPlacesModal] = useState<boolean>(false);

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
    sunMood === 'aegean-noon'
      ? '☀️ Aegean Noon'
      : sunMood === 'caldera-sunset'
        ? '🌅 Caldera Sunset'
        : '🌙 Starlight Blue';

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
        padding: '14px 18px',
      }}
    >
      {/* ================================================================= */}
      {/* TOP BAR: Title Card + 16-Place Stepper + Action Pills             */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Brand & Maze Progress Card */}
        <div
          style={{
            background: 'rgba(246, 251, 255, 0.92)',
            backdropFilter: 'blur(14px)',
            padding: '11px 16px',
            borderRadius: '18px',
            border: '1px solid rgba(124, 198, 242, 0.88)',
            boxShadow: '0 10px 28px rgba(18, 66, 120, 0.16)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '16px',
                animation: 'floatSparkle 2.4s ease-in-out infinite',
              }}
            >
              🩵
            </span>
            <span
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '22px',
                fontWeight: 700,
                color: '#123A63',
                letterSpacing: '0.01em',
              }}
            >
              Midori & the Santorini Sea Maze
            </span>
          </div>

          <div
            style={{
              fontSize: '11.5px',
              color: '#2B5B84',
              marginTop: '2px',
              fontWeight: 600,
            }}
          >
            {currentZone.icon} <strong>Place {currentZone.index + 1}/16:</strong>{' '}
            {currentZone.title} —{' '}
            <span style={{ opacity: 0.86 }}>{currentZone.subtitle}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              marginTop: '8px',
              fontSize: '11px',
              fontWeight: 700,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                background: 'rgba(43, 136, 228, 0.14)',
                color: '#16528E',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              🏛️ {discoveredZones.length} / {LANDMARK_ZONES.length} Places
            </span>
            <span
              style={{
                background: 'rgba(72, 212, 238, 0.2)',
                color: '#0E6B82',
                padding: '3px 9px',
                borderRadius: '999px',
              }}
            >
              🫧 {collectedRelics.length} / {INITIAL_SEA_PEARLS.length} Sea Pearls
            </span>
            <button
              type="button"
              onClick={() => setShowAllPlacesModal((p) => !p)}
              style={{
                background: showAllPlacesModal
                  ? '#228BE6'
                  : 'linear-gradient(135deg, #56B848, #84D454)',
                color: showAllPlacesModal ? '#FFFFFF' : '#102A12',
                border: 'none',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(86, 184, 72, 0.28)',
              }}
            >
              {showAllPlacesModal ? '✕ Close 16 Places' : '🗺️ All 16 Places Directory'}
            </button>
          </div>
        </div>

        {/* Center Scrollable 16-Place Interactive Quick-Stepper */}
        <div
          style={{
            background: 'rgba(246, 251, 255, 0.90)',
            backdropFilter: 'blur(14px)',
            padding: '6px 10px',
            borderRadius: '18px',
            border: '1px solid rgba(124, 198, 242, 0.85)',
            boxShadow: '0 8px 24px rgba(18, 66, 120, 0.14)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            maxWidth: '520px',
            overflowX: 'auto',
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
                title={`Click to walk Midori to ${zone.title} • Double-click to teleport`}
                style={{
                  background: isCurrent
                    ? 'linear-gradient(135deg, #228BE6, #4AD8F0)'
                    : isTarget
                      ? 'rgba(54, 214, 242, 0.25)'
                      : isDiscovered
                        ? 'rgba(132, 212, 84, 0.22)'
                        : 'rgba(215, 234, 250, 0.45)',
                  color: isCurrent
                    ? '#FFFFFF'
                    : isTarget
                      ? '#0C5C78'
                      : '#164570',
                  border: isTarget && !isCurrent ? '1px solid #228BE6' : 'none',
                  padding: '5px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                <span>{zone.icon}</span>
                <span>
                  {zone.index + 1}. {zone.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Top-Right Action Pills */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            pointerEvents: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() =>
              onSelectCameraMode((prev) =>
                prev === 'painting' ? 'follow' : 'painting'
              )
            }
            style={{
              background:
                cameraMode === 'painting'
                  ? 'linear-gradient(135deg, #228BE6, #4AD8F0)'
                  : 'rgba(246, 251, 255, 0.92)',
              color: cameraMode === 'painting' ? '#FFFFFF' : '#123A63',
              border: '1px solid rgba(124, 198, 242, 0.9)',
              backdropFilter: 'blur(12px)',
              padding: '8px 13px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(18, 66, 120, 0.14)',
            }}
          >
            🖼️ Reference Vista
          </button>

          <button
            type="button"
            onClick={onToggleGuidePath}
            style={{
              background: showGuidePath
                ? 'rgba(74, 216, 240, 0.92)'
                : 'rgba(246, 251, 255, 0.9)',
              color: '#0D3B5E',
              border: '1px solid rgba(124, 198, 242, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 12px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(18, 66, 120, 0.12)',
            }}
          >
            {showGuidePath ? '✨ Guide: ON' : '✨ Guide: OFF'}
          </button>

          <button
            type="button"
            onClick={onToggleAutoWalk}
            style={{
              background: autoWalk
                ? 'linear-gradient(135deg, #68C642, #9CE668)'
                : 'rgba(246, 251, 255, 0.9)',
              color: '#123A63',
              border: '1px solid rgba(124, 198, 242, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 12px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(18, 66, 120, 0.12)',
            }}
          >
            {autoWalk ? '🧭 16-Place Tour: ON' : '🧭 Auto-Tour'}
          </button>

          <button
            type="button"
            onClick={onCycleSunMood}
            style={{
              background: 'rgba(246, 251, 255, 0.9)',
              color: '#123A63',
              border: '1px solid rgba(124, 198, 242, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 12px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(18, 66, 120, 0.12)',
            }}
          >
            {moodLabel}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* EXPANDABLE 16-PLACE INTERACTIVE DIRECTORY DRAWER + TOASTS         */}
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
        {showAllPlacesModal && (
          <div
            style={{
              background: 'rgba(246, 251, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              padding: '16px 20px',
              borderRadius: '22px',
              border: '1px solid rgba(114, 196, 242, 0.92)',
              boxShadow: '0 20px 48px rgba(14, 54, 98, 0.28)',
              maxWidth: '780px',
              width: '94vw',
              maxHeight: '52vh',
              overflowY: 'auto',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#123A63',
                  }}
                >
                  🏛️ Explore All 16 Santorini Sea Maze Places
                </div>
                <div style={{ fontSize: '11px', color: '#3E6B94' }}>
                  Click <strong>Walk</strong> for guided pathfinding or <strong>Teleport</strong> to jump directly there
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPlacesModal(false)}
                style={{
                  background: 'rgba(34, 139, 230, 0.12)',
                  color: '#123A63',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '4px 11px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
                gap: '8px',
              }}
            >
              {LANDMARK_ZONES.map((zone) => {
                const isCurrent = zone.id === currentZoneId;
                const isDiscovered = discoveredZones.includes(zone.id);
                return (
                  <div
                    key={`dir-${zone.id}`}
                    style={{
                      background: isCurrent
                        ? 'rgba(54, 214, 242, 0.22)'
                        : isDiscovered
                          ? 'rgba(132, 212, 84, 0.14)'
                          : 'rgba(225, 240, 252, 0.55)',
                      border: isCurrent
                        ? '1.5px solid #228BE6'
                        : '1px solid rgba(145, 202, 242, 0.6)',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '6px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 800,
                          color: '#123A63',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>
                          {zone.icon} {zone.index + 1}. {zone.title}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            color: '#2B72B5',
                            fontWeight: 700,
                          }}
                        >
                          {zone.district}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#436B92',
                          marginTop: '2px',
                        }}
                      >
                        {zone.subtitle}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToZone(zone, false);
                          setShowAllPlacesModal(false);
                        }}
                        style={{
                          flex: 1,
                          background: '#228BE6',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '7px',
                          padding: '4px 0',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🚶‍♀️ Walk Here
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToZone(zone, true);
                          setShowAllPlacesModal(false);
                        }}
                        style={{
                          flex: 1,
                          background: 'rgba(132, 212, 84, 0.85)',
                          color: '#102E12',
                          border: 'none',
                          borderRadius: '7px',
                          padding: '4px 0',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Teleport
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {discoveryToast && (
          <div
            style={{
              background: 'rgba(246, 251, 255, 0.95)',
              color: '#123A63',
              padding: '12px 24px',
              borderRadius: '18px',
              border: '1.5px solid rgba(54, 214, 242, 0.9)',
              boxShadow: '0 16px 36px rgba(18, 66, 120, 0.28)',
              textAlign: 'center',
              animation: 'toastPop 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#228BE6',
                fontWeight: 800,
              }}
            >
              {discoveryToast.icon} Place {discoveryToast.index + 1} of 16 Discovered {discoveryToast.icon}
            </div>
            <div
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '23px',
                fontWeight: 700,
                marginTop: '2px',
              }}
            >
              {discoveryToast.title}
            </div>
            <div style={{ fontSize: '11.5px', color: '#39628A' }}>
              {discoveryToast.subtitle}
            </div>
          </div>
        )}

        {hoveredItem && (
          <div
            style={{
              background: 'rgba(246, 251, 255, 0.90)',
              color: '#123A63',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(114, 196, 242, 0.5)',
            }}
          >
            {hoveredItem}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* BOTTOM BAR: 9x9 + Sea Map + 5-Mode Camera Bar + Tactile Controls  */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Bottom-Left Interactive 9x9 Santorini Maze + Aegean Sea Mini-Map */}
        <div
          style={{
            background: 'rgba(246, 251, 255, 0.92)',
            backdropFilter: 'blur(14px)',
            padding: '10px 12px',
            borderRadius: '18px',
            border: '1px solid rgba(124, 198, 242, 0.9)',
            boxShadow: '0 12px 30px rgba(18, 66, 120, 0.2)',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              fontSize: '10px',
              fontWeight: 800,
              color: '#123A63',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            <span>🗺️ City & Sea Map (16 Places)</span>
            <span style={{ fontSize: '9px', color: '#228BE6' }}>Click to walk</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* Western Aegean Sea Strip on the Side of the Mini-Map! */}
            <div
              style={{
                width: '16px',
                background: 'linear-gradient(180deg, #1D9BE8, #5CE8F8, #1D9BE8)',
                borderRadius: '8px 0 0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                writingMode: 'vertical-rl',
                fontSize: '8px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '0.12em',
              }}
              title="Aegean Sea Coastline"
            >
              🌊 SEA
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${MAZE_COLS}, 18px)`,
                gridTemplateRows: `repeat(${MAZE_ROWS}, 18px)`,
                background: '#DCEBFA',
                border: '2px solid #2B72B5',
                borderRadius: '0 8px 8px 0',
                overflow: 'hidden',
              }}
            >
              {MAZE_DATA.cells.map((cell) => {
                const isPlayerHere =
                  liveCharState.row === cell.row && liveCharState.col === cell.col;
                const zone = LANDMARK_ZONES.find(
                  (z) => z.row === cell.row && z.col === cell.col
                );
                const hasUncollectedRelic = INITIAL_SEA_PEARLS.some(
                  (r) =>
                    r.row === cell.row &&
                    r.col === cell.col &&
                    !collectedRelics.includes(r.id)
                );

                const wallColor = '#2B72B5';
                const borderTop = isPassageOpen(cell.row, cell.col, 'N')
                  ? '1px solid rgba(43, 114, 181, 0.12)'
                  : `2px solid ${wallColor}`;
                const borderBottom = isPassageOpen(cell.row, cell.col, 'S')
                  ? '1px solid rgba(43, 114, 181, 0.12)'
                  : `2px solid ${wallColor}`;
                const borderLeft = isPassageOpen(cell.row, cell.col, 'W')
                  ? '1px solid rgba(43, 114, 181, 0.12)'
                  : `2px solid ${wallColor}`;
                const borderRight = isPassageOpen(cell.row, cell.col, 'E')
                  ? '1px solid rgba(43, 114, 181, 0.12)'
                  : `2px solid ${wallColor}`;

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
                        ? `Place ${zone.index + 1}: ${zone.title} — Click to walk here`
                        : `Road [${cell.row + 1}, ${cell.col + 1}] — Click to walk here`
                    }
                    style={{
                      width: '18px',
                      height: '18px',
                      padding: 0,
                      background: isPlayerHere
                        ? 'rgba(132, 212, 84, 0.55)'
                        : zone
                          ? 'rgba(66, 212, 242, 0.38)'
                          : cell.roadStyle === 'turquoise-steps'
                            ? '#D4F5FC'
                            : '#F7FBFF',
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
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#68C642',
                          border: '1.5px solid #142212',
                          boxShadow: '0 0 6px rgba(104, 198, 66, 0.9)',
                          display: 'inline-block',
                        }}
                      />
                    ) : zone ? (
                      <span
                        style={{
                          fontSize: '8.5px',
                          color: '#0D3B66',
                          fontWeight: 800,
                        }}
                      >
                        {zone.index + 1}
                      </span>
                    ) : hasUncollectedRelic ? (
                      <span style={{ fontSize: '7px' }}>🫧</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom-Center 5-Mode Camera Angle Switcher & Controls Guide */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '7px',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              background: 'rgba(246, 251, 255, 0.92)',
              backdropFilter: 'blur(14px)',
              padding: '5px',
              borderRadius: '999px',
              border: '1px solid rgba(124, 198, 242, 0.88)',
              boxShadow: '0 10px 28px rgba(18, 66, 120, 0.16)',
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {(
              ['follow', 'painting', 'cinematic', 'sea-breeze', 'pov'] as CameraMode[]
            ).map((mode) => {
              const active = cameraMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelectCameraMode(mode)}
                  title={CAMERA_MODE_LABELS[mode].description}
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #228BE6, #4AD8F0)'
                      : 'transparent',
                    color: active ? '#FFFFFF' : '#123A63',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '11.5px',
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
              background: 'rgba(246, 251, 255, 0.84)',
              color: '#123A63',
              padding: '5px 14px',
              borderRadius: '999px',
              fontSize: '10.5px',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(124, 198, 242, 0.5)',
            }}
          >
            <strong>WASD / Arrows</strong> Move • <strong>Drag / Q & E</strong> Look •{' '}
            <strong>Space</strong> Jump Twirl • <strong>Shift</strong> Sprint •{' '}
            <strong>F</strong> Wave • <strong>V</strong> Cycle Camera
          </div>
        </div>

        {/* Bottom-Right On-Screen Tactile Movement, Jump, Sprint & Wave Pad */}
        <div
          style={{
            background: 'rgba(246, 251, 255, 0.92)',
            backdropFilter: 'blur(14px)',
            padding: '10px 12px',
            borderRadius: '18px',
            border: '1px solid rgba(124, 198, 242, 0.88)',
            boxShadow: '0 10px 28px rgba(18, 66, 120, 0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            pointerEvents: 'auto',
          }}
        >
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
              style={padBtnStyle('#DCEBFA', '#123A63')}
            >
              ↶
            </button>
            <button
              type="button"
              title="Walk Forward (W)"
              onPointerDown={() => setInput('up', true)}
              onPointerUp={() => setInput('up', false)}
              onPointerLeave={() => setInput('up', false)}
              style={padBtnStyle('#228BE6', '#FFFFFF')}
            >
              ▲
            </button>
            <button
              type="button"
              title="Look Right (E)"
              onPointerDown={() => setInput('turnRight', true)}
              onPointerUp={() => setInput('turnRight', false)}
              onPointerLeave={() => setInput('turnRight', false)}
              style={padBtnStyle('#DCEBFA', '#123A63')}
            >
              ↷
            </button>
            <button
              type="button"
              title="Step Left (A)"
              onPointerDown={() => setInput('left', true)}
              onPointerUp={() => setInput('left', false)}
              onPointerLeave={() => setInput('left', false)}
              style={padBtnStyle('#EFF7FF', '#123A63')}
            >
              ◀
            </button>
            <button
              type="button"
              title="Step Back (S)"
              onPointerDown={() => setInput('down', true)}
              onPointerUp={() => setInput('down', false)}
              onPointerLeave={() => setInput('down', false)}
              style={padBtnStyle('#EFF7FF', '#123A63')}
            >
              ▼
            </button>
            <button
              type="button"
              title="Step Right (D)"
              onPointerDown={() => setInput('right', true)}
              onPointerUp={() => setInput('right', false)}
              onPointerLeave={() => setInput('right', false)}
              style={padBtnStyle('#EFF7FF', '#123A63')}
            >
              ▶
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              onClick={onTriggerJump}
              style={{
                ...padBtnStyle('#84D454', '#102A12'),
                width: '68px',
                height: '21px',
                fontSize: '10.5px',
              }}
            >
              ✨ Jump
            </button>
            <button
              type="button"
              onPointerDown={() => setInput('sprint', true)}
              onPointerUp={() => setInput('sprint', false)}
              onPointerLeave={() => setInput('sprint', false)}
              style={{
                ...padBtnStyle('#4AD8F0', '#0D3B5E'),
                width: '68px',
                height: '21px',
                fontSize: '10.5px',
              }}
            >
              ⚡ Sprint
            </button>
            <button
              type="button"
              onClick={onTriggerWave}
              style={{
                ...padBtnStyle('#DCEBFA', '#123A63'),
                width: '68px',
                height: '21px',
                fontSize: '10.5px',
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
    border: '1px solid rgba(114, 196, 242, 0.6)',
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
