import { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  BRUSH_MOOD_THEMES,
  CAMERA_MODES,
  type BrushMood,
  type CameraMode,
} from '../../domain/cityConfig';
import {
  CITY_CELLS,
  CITY_COLS,
  CITY_DISTRICTS,
  CITY_ROWS,
  cellToWorld,
  worldToCell,
  type CityDistrict,
} from '../../domain/cityLayout';
import { SONGS, type SongInfo } from '../../audio/SoundtrackEngine';

interface MinimalHudProps {
  visible: boolean;
  hudHidden: boolean;
  cameraMode: CameraMode;
  brushMood: BrushMood;
  autoWalk: boolean;
  hoveredItem: string | null;
  currentDistrictId: string;
  discoveredDistricts: string[];
  discoveryToast: CityDistrict | null;
  audioState: {
    isPlaying: boolean;
    song: SongInfo;
    songIndex: number;
  };
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  onSelectCameraMode: (mode: CameraMode) => void;
  onCycleBrushMood: () => void;
  onToggleAutoWalk: () => void;
  onToggleHudHidden: () => void;
  onToggleMusic: () => void;
  onNextSong: () => void;
  onNavigateToDistrict: (district: CityDistrict, teleport?: boolean) => void;
  onMiniMapCellClick: (point: THREE.Vector3) => void;
}

export default function MinimalHud({
  visible,
  hudHidden,
  cameraMode,
  brushMood,
  autoWalk,
  hoveredItem,
  currentDistrictId,
  discoveredDistricts,
  discoveryToast,
  audioState,
  characterPosRef,
  onSelectCameraMode,
  onCycleBrushMood,
  onToggleAutoWalk,
  onToggleHudHidden,
  onToggleMusic,
  onNextSong,
  onNavigateToDistrict,
  onMiniMapCellClick,
}: MinimalHudProps) {
  const [showMapPopover, setShowMapPopover] = useState(false);
  const [playerCell, setPlayerCell] = useState<{ row: number; col: number }>({
    row: 6,
    col: 5,
  });

  useEffect(() => {
    if (!showMapPopover) return;
    const timer = window.setInterval(() => {
      const p = characterPosRef.current;
      const cell = worldToCell(p.x, p.z);
      setPlayerCell((prev) =>
        prev.row === cell.row && prev.col === cell.col ? prev : cell
      );
    }, 140);
    return () => window.clearInterval(timer);
  }, [showMapPopover, characterPosRef]);

  const currentDistrict =
    CITY_DISTRICTS.find((d) => d.id === currentDistrictId) || CITY_DISTRICTS[0];
  const moodTheme = BRUSH_MOOD_THEMES[brushMood];
  const activeCamMeta =
    CAMERA_MODES.find((m) => m.id === cameraMode) || CAMERA_MODES[0];

  if (hudHidden) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '14px',
          right: '16px',
          zIndex: 20,
        }}
      >
        <button
          type="button"
          onClick={onToggleHudHidden}
          style={{
            background: 'rgba(251, 245, 233, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(92, 70, 54, 0.35)',
            color: '#382D27',
            borderRadius: '999px',
            padding: '6px 13px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          👁️ Show UI (H)
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px 18px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      {/* ================================================================= */}
      {/* ULTRA-CLEAN TOP PILL BAR (Title Pill + Music/Mood/Map Pill)       */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Compact Left Rice-Paper Title & District Pill */}
        <div
          style={{
            background: 'rgba(251, 246, 236, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(110, 86, 68, 0.32)',
            borderRadius: '999px',
            padding: '7px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(56, 42, 32, 0.10)',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: '15px' }}>🍁</span>
          <span
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '18px',
              fontWeight: 700,
              color: '#2F241E',
            }}
          >
            Maple Brush Valley
          </span>
          <span style={{ color: 'rgba(92, 70, 54, 0.35)' }}>•</span>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#5C473A',
            }}
          >
            {currentDistrict.icon} {currentDistrict.title}
          </span>
          <span
            style={{
              background: 'rgba(240, 100, 48, 0.14)',
              color: '#B8431B',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '10.5px',
              fontWeight: 800,
            }}
          >
            {discoveredDistricts.length}/{CITY_DISTRICTS.length}
          </span>
        </div>

        {/* Compact Right Studio Pill: Song Player + Brush Mood + Popover Map */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            pointerEvents: 'auto',
          }}
        >
          {/* High-Quality Song Play/Pause + Next Song Pill */}
          <div
            style={{
              background: 'rgba(251, 246, 236, 0.90)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(110, 86, 68, 0.34)',
              borderRadius: '999px',
              padding: '4px 6px 4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 8px 22px rgba(56, 42, 32, 0.10)',
            }}
          >
            <button
              type="button"
              onClick={onToggleMusic}
              title="Toggle Music (M)"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: audioState.isPlaying ? '#C2461D' : '#5E4B3E',
              }}
            >
              <span>{audioState.isPlaying ? '🎵' : '🔇'}</span>
              <span>
                {audioState.isPlaying
                  ? `${audioState.song.title} (${audioState.song.jpTitle})`
                  : 'Play Music'}
              </span>
            </button>

            <button
              type="button"
              onClick={onNextSong}
              title={`Switch Song (N) — ${SONGS.length} Studio Tracks`}
              style={{
                background: 'rgba(240, 100, 48, 0.14)',
                color: '#A83B15',
                border: 'none',
                borderRadius: '999px',
                padding: '3px 9px',
                fontSize: '10.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ⏭️ {audioState.songIndex + 1}/{SONGS.length}
            </button>
          </div>

          {/* Brush Lighting Mood Pill */}
          <button
            type="button"
            onClick={onCycleBrushMood}
            style={{
              background: 'rgba(251, 246, 236, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(110, 86, 68, 0.32)',
              color: '#382D27',
              borderRadius: '999px',
              padding: '7px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(56, 42, 32, 0.09)',
            }}
          >
            {moodTheme.label}
          </button>

          {/* Optional Compact Map Popover Toggle */}
          <button
            type="button"
            onClick={() => setShowMapPopover((p) => !p)}
            style={{
              background: showMapPopover
                ? '#E25B2B'
                : 'rgba(251, 246, 236, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(110, 86, 68, 0.32)',
              color: showMapPopover ? '#FFFFFF' : '#382D27',
              borderRadius: '999px',
              padding: '7px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(56, 42, 32, 0.09)',
            }}
          >
            🗺️ {showMapPopover ? 'Close Map' : 'City Map'}
          </button>

          {/* Clean View Toggle */}
          <button
            type="button"
            onClick={onToggleHudHidden}
            title="Hide UI for pure artwork view (H)"
            style={{
              background: 'rgba(251, 246, 236, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(110, 86, 68, 0.28)',
              color: '#5C473A',
              borderRadius: '999px',
              padding: '7px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            👁️
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CENTER FLOATING POPOVER MAP (Only visible when toggled!) & TOASTS */}
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
        {showMapPopover && (
          <div
            style={{
              background: 'rgba(252, 247, 238, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(120, 92, 70, 0.42)',
              borderRadius: '20px',
              padding: '14px 18px',
              boxShadow: '0 20px 48px rgba(48, 34, 24, 0.22)',
              pointerEvents: 'auto',
              display: 'flex',
              gap: '18px',
              alignItems: 'center',
              flexWrap: 'wrap',
              maxWidth: '640px',
            }}
          >
            {/* 11x11 Rice-Paper Road Grid */}
            <div>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#5C473A',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                11×11 City Roads (Click to walk)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${CITY_COLS}, 16px)`,
                  gridTemplateRows: `repeat(${CITY_ROWS}, 16px)`,
                  gap: '1px',
                  background: 'rgba(110, 86, 68, 0.25)',
                  padding: '3px',
                  borderRadius: '8px',
                }}
              >
                {CITY_CELLS.map((cell) => {
                  const isHere =
                    playerCell.row === cell.row && playerCell.col === cell.col;
                  const dist = CITY_DISTRICTS.find(
                    (d) => d.row === cell.row && d.col === cell.col
                  );
                  return (
                    <button
                      key={`${cell.row}-${cell.col}`}
                      type="button"
                      onClick={() => {
                        const w = cellToWorld(cell.row, cell.col);
                        onMiniMapCellClick(new THREE.Vector3(w.x, 0, w.z));
                      }}
                      title={
                        dist
                          ? `${dist.title} — Click to walk here`
                          : cell.isRoad
                            ? `Road [${cell.row + 1},${cell.col + 1}]`
                            : 'Village House'
                      }
                      style={{
                        width: '16px',
                        height: '16px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '2px',
                        background: isHere
                          ? '#E25B2B'
                          : dist
                            ? '#FAA252'
                            : cell.isRoad
                              ? '#F6EBD8'
                              : '#6D7A7A',
                        cursor: 'pointer',
                        fontSize: '8px',
                        color: '#2F241E',
                        fontWeight: 800,
                      }}
                    >
                      {isHere ? '●' : dist ? dist.index + 1 : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick District Teleport List */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#2F241E',
                  marginBottom: '6px',
                }}
              >
                🍁 12 Shanshui City Landmarks (Click to Walk, Double-Click to Teleport)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '5px',
                }}
              >
                {CITY_DISTRICTS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onNavigateToDistrict(d, false);
                      setShowMapPopover(false);
                    }}
                    onDoubleClick={() => {
                      onNavigateToDistrict(d, true);
                      setShowMapPopover(false);
                    }}
                    style={{
                      background:
                        d.id === currentDistrictId
                          ? 'rgba(226, 91, 43, 0.18)'
                          : 'rgba(238, 226, 206, 0.65)',
                      border:
                        d.id === currentDistrictId
                          ? '1px solid #E25B2B'
                          : '1px solid rgba(120, 92, 70, 0.22)',
                      borderRadius: '8px',
                      padding: '4px 7px',
                      textAlign: 'left',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#382D27',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {d.icon} {d.index + 1}. {d.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {discoveryToast && (
          <div
            style={{
              background: 'rgba(252, 247, 238, 0.94)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(226, 91, 43, 0.55)',
              borderRadius: '999px',
              padding: '8px 20px',
              boxShadow: '0 12px 30px rgba(56, 42, 32, 0.16)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#2F241E',
            }}
          >
            <span>{discoveryToast.icon}</span>
            <span>{discoveryToast.title}</span>
            <span style={{ opacity: 0.65, fontWeight: 500 }}>
              ({discoveryToast.jpTitle})
            </span>
          </div>
        )}

        {hoveredItem && !discoveryToast && (
          <div
            style={{
              background: 'rgba(251, 246, 236, 0.86)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(110, 86, 68, 0.28)',
              borderRadius: '999px',
              padding: '5px 14px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#382D27',
            }}
          >
            {hoveredItem}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* SINGLE SLEEK BOTTOM-CENTER CAMERA & EXPLORATION DOCK              */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <div
          style={{
            background: 'rgba(251, 246, 236, 0.90)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(110, 86, 68, 0.35)',
            borderRadius: '999px',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(52, 38, 28, 0.15)',
            pointerEvents: 'auto',
          }}
        >
          {CAMERA_MODES.map((m) => {
            const active = cameraMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectCameraMode(m.id)}
                title={m.hint}
                style={{
                  background: active
                    ? 'linear-gradient(135deg, #E25B2B, #F5843E)'
                    : 'transparent',
                  color: active ? '#FFFFFF' : '#3E3028',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 13px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.18s ease',
                }}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}

          <span
            style={{
              width: '1px',
              height: '18px',
              background: 'rgba(110, 86, 68, 0.25)',
              margin: '0 4px',
            }}
          />

          <button
            type="button"
            onClick={onToggleAutoWalk}
            title="Guided scenic stroll along the city roads"
            style={{
              background: autoWalk
                ? 'rgba(110, 140, 84, 0.9)'
                : 'rgba(110, 86, 68, 0.10)',
              color: autoWalk ? '#FFFFFF' : '#3E3028',
              border: 'none',
              borderRadius: '999px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {autoWalk ? '🧭 Strolling: ON' : '🧭 Auto-Stroll'}
          </button>
        </div>

        <div
          style={{
            fontSize: '10.5px',
            fontWeight: 600,
            color: 'rgba(56, 45, 39, 0.78)',
            background: 'rgba(251, 246, 236, 0.68)',
            padding: '2px 11px',
            borderRadius: '999px',
            backdropFilter: 'blur(6px)',
          }}
        >
          {activeCamMeta.hint} • <strong>WASD</strong> Walk • <strong>Click Road</strong> Pathfind • <strong>M / N</strong> Songs
        </div>
      </div>
    </div>
  );
}
