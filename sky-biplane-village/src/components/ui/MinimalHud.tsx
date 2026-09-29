import { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  CAMERA_MODES,
  SKY_MOOD_THEMES,
  type CameraMode,
  type FlightSpeedPreset,
  type SkyMood,
  type VirtualFlightInput,
} from '../../domain/skyConfig';
import {
  RIVER_BRIDGES,
  SKY_RINGS,
  VILLAGE_HOMESTEADS,
  VILLAGE_LANDMARKS,
  getRiverCenterX,
  type VillageLandmark,
} from '../../domain/villageLayout';
import type { SongInfo } from '../../audio/SoundtrackEngine';
import { MOOD_ORDER } from '../../state/useFlightController';

interface MinimalHudProps {
  visible: boolean;
  hudHidden: boolean;
  cameraMode: CameraMode;
  skyMood: SkyMood;
  speedPreset: FlightSpeedPreset;
  autoCruise: boolean;
  hoveredItem: string | null;
  currentLandmarkId: string;
  discoveredLandmarks: string[];
  discoveryToast: VillageLandmark | null;
  collectedRings: number[];
  audioState: {
    isPlaying: boolean;
    song: SongInfo;
    songIndex: number;
  };
  planePosRef: React.MutableRefObject<THREE.Vector3>;
  planeSpeedRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualFlightInput>;
  onSelectCameraMode: (mode: CameraMode) => void;
  onSelectSkyMood: (mood: SkyMood) => void;
  onCycleSpeedPreset: () => void;
  onToggleAutoCruise: () => void;
  onTriggerBarrelRoll: () => void;
  onToggleHudHidden: () => void;
  onToggleMusic: () => void;
  onNextSong: () => void;
  onFlyToLandmark: (landmark: VillageLandmark, instant?: boolean) => void;
}

export default function MinimalHud({
  visible,
  hudHidden,
  cameraMode,
  skyMood,
  speedPreset,
  autoCruise,
  hoveredItem,
  currentLandmarkId,
  discoveredLandmarks,
  discoveryToast,
  collectedRings,
  audioState,
  planePosRef,
  planeSpeedRef,
  virtualInputRef,
  onSelectCameraMode,
  onSelectSkyMood,
  onCycleSpeedPreset,
  onToggleAutoCruise,
  onTriggerBarrelRoll,
  onToggleHudHidden,
  onToggleMusic,
  onNextSong,
  onFlyToLandmark,
}: MinimalHudProps) {
  const [showRadarPopover, setShowRadarPopover] = useState(false);
  const [planeCoords, setPlaneCoords] = useState<{
    x: number;
    z: number;
    alt: number;
    knots: number;
  }>({
    x: 6,
    z: 22,
    alt: 19,
    knots: 85,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      const p = planePosRef.current;
      const spd = planeSpeedRef.current;
      setPlaneCoords({
        x: Math.round(p.x),
        z: Math.round(p.z),
        alt: Math.round(p.y),
        knots: Math.round(spd * 4.2),
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, [planePosRef, planeSpeedRef]);

  const currentLandmark =
    VILLAGE_LANDMARKS.find((l) => l.id === currentLandmarkId) || VILLAGE_LANDMARKS[0];

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
            background: 'rgba(250, 252, 244, 0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(64, 98, 58, 0.35)',
            color: '#1F301E',
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

  const speedLabel =
    speedPreset === 'turbo'
      ? '🔥 Turbo Anime'
      : speedPreset === 'fast'
        ? '⚡ Fast Flight'
        : '🍃 Relaxed';

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
      {/* TOP PILL BAR: Title + Landmark | Morning/Noon/Evening/Night + Map */}
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
        {/* Left Title & Overflight Village Landmark Pill */}
        <div
          style={{
            background: 'rgba(250, 252, 244, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(58, 92, 54, 0.32)',
            borderRadius: '999px',
            padding: '7px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(32, 52, 28, 0.12)',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: '15px' }}>✈️</span>
          <span
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1E2E1C',
            }}
          >
            Meadow Sky Biplane
          </span>
          <span style={{ color: 'rgba(58, 92, 54, 0.35)' }}>•</span>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#3F7836',
            }}
          >
            🏡 {currentLandmark.name}
          </span>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#5B7454',
              background: 'rgba(92, 148, 72, 0.14)',
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {planeCoords.knots} kt • Alt {planeCoords.alt}m • 🎐 {collectedRings.length}/{SKY_RINGS.length}
          </span>
        </div>

        {/* Right Controls Pill (Soundtrack + Morning/Noon/Evening/Night + Radar Map + Hide UI) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
            position: 'relative',
            flexWrap: 'wrap',
          }}
        >
          {/* Direct Time-of-Day Mode Selector: Morning | Noon | Evening | Night */}
          <div
            style={{
              background: 'rgba(250, 252, 244, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(58, 92, 54, 0.32)',
              borderRadius: '999px',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: '0 8px 24px rgba(32, 52, 28, 0.10)',
            }}
          >
            {MOOD_ORDER.map((mId) => {
              const m = SKY_MOOD_THEMES[mId];
              const isSelected = skyMood === mId;
              return (
                <button
                  key={mId}
                  type="button"
                  onClick={() => onSelectSkyMood(mId)}
                  title={`${m.label} (Press L to cycle)`}
                  style={{
                    background: isSelected
                      ? mId === 'starry-night'
                        ? '#1B3058'
                        : mId === 'evening-sunset'
                          ? '#C85E38'
                          : '#3E7835'
                      : 'transparent',
                    color: isSelected ? '#FFFFFF' : '#243622',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span>{m.badgeIcon}</span>
                  <span>{m.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Music Toggle & Next Song */}
          <div
            style={{
              background: 'rgba(250, 252, 244, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(58, 92, 54, 0.32)',
              borderRadius: '999px',
              padding: '4px 6px 4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 8px 24px rgba(32, 52, 28, 0.10)',
            }}
          >
            <button
              type="button"
              onClick={onToggleMusic}
              title="Play / Pause Soundtrack (M)"
              style={{
                background: 'none',
                border: 'none',
                color: '#1E2E1C',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{audioState.isPlaying ? '🔊' : '🔇'}</span>
              <span>{audioState.song.title}</span>
            </button>
            <button
              type="button"
              onClick={onNextSong}
              title="Next Pastoral Song (N)"
              style={{
                background: 'rgba(82, 136, 68, 0.16)',
                border: '1px solid rgba(58, 92, 54, 0.25)',
                color: '#2B4A26',
                borderRadius: '999px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⏭️ Next
            </button>
          </div>

          {/* 3x Village & Bridges Radar Map Button */}
          <button
            type="button"
            onClick={() => setShowRadarPopover((p) => !p)}
            style={{
              background: showRadarPopover
                ? '#3F7836'
                : 'rgba(250, 252, 244, 0.92)',
              color: showRadarPopover ? '#FFFFFF' : '#1E2E1C',
              border: '1.5px solid rgba(58, 92, 54, 0.32)',
              borderRadius: '999px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(32, 52, 28, 0.10)',
            }}
          >
            🗺️ 3x Village Map ({discoveredLandmarks.length}/{VILLAGE_LANDMARKS.length})
          </button>

          {/* Hide HUD Button */}
          <button
            type="button"
            onClick={onToggleHudHidden}
            title="Hide UI for Pure Anime Fullscreen (H)"
            style={{
              background: 'rgba(250, 252, 244, 0.92)',
              border: '1.5px solid rgba(58, 92, 54, 0.32)',
              color: '#1E2E1C',
              borderRadius: '999px',
              padding: '6px 10px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            👁️
          </button>

          {/* Popover 3x Village, River Bridges & Homestead Flight Map */}
          {showRadarPopover && (
            <div
              style={{
                position: 'absolute',
                top: '44px',
                right: 0,
                width: '345px',
                background: 'rgba(251, 252, 245, 0.96)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(58, 92, 54, 0.38)',
                borderRadius: '18px',
                padding: '14px',
                boxShadow: '0 18px 42px rgba(26, 44, 22, 0.18)',
                color: '#1E2E1C',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <strong style={{ fontSize: '12.5px' }}>
                  🏡 3x Village, River &amp; 4 Bridges
                </strong>
                <span style={{ fontSize: '10.5px', color: '#4E6B48' }}>
                  32 Homesteads • Click to Fly
                </span>
              </div>

              {/* Mini Radar Diagram showing 32 Homesteads, River, 4 Bridges & Biplane */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '152px',
                  background: 'linear-gradient(135deg, #B8DC78 0%, #74AE4E 100%)',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(42, 68, 38, 0.35)',
                  marginBottom: '10px',
                  overflow: 'hidden',
                }}
              >
                {/* River Path Indicator */}
                {[-90, -60, -30, 0, 30, 60, 90].map((rz) => {
                  const rx = getRiverCenterX(rz);
                  const leftPct = 50 + (rx / 230) * 100;
                  const topPct = 50 + (rz / 230) * 100;
                  return (
                    <div
                      key={`river-dot-${rz}`}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: '10px',
                        height: '28px',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(56, 178, 198, 0.75)',
                        borderRadius: '999px',
                      }}
                    />
                  );
                })}

                {/* 4 River Bridges on Radar */}
                {RIVER_BRIDGES.map((b) => {
                  const bx = getRiverCenterX(b.z);
                  const leftPct = 50 + (bx / 230) * 100;
                  const topPct = 50 + (b.z / 230) * 100;
                  return (
                    <div
                      key={b.id}
                      title={b.name}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: '16px',
                        height: '5px',
                        transform: 'translate(-50%, -50%)',
                        background: '#D95B43',
                        border: '1px solid #FFF',
                        borderRadius: '2px',
                        zIndex: 2,
                      }}
                    />
                  );
                })}

                {/* 32 Homesteads on Radar */}
                {VILLAGE_HOMESTEADS.map((plot) => {
                  const leftPct = 50 + (plot.centerX / 230) * 100;
                  const topPct = 50 + (plot.centerZ / 230) * 100;
                  return (
                    <div
                      key={plot.id}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: '8px',
                        height: '7px',
                        transform: 'translate(-50%, -50%)',
                        background: '#5E8E7A',
                        border: '1px solid #1E281E',
                        borderRadius: '2px',
                      }}
                      title={plot.name}
                    />
                  );
                })}

                {/* Live Biplane Marker on Radar */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${THREE.MathUtils.clamp(50 + (planeCoords.x / 230) * 100, 6, 94)}%`,
                    top: `${THREE.MathUtils.clamp(50 + (planeCoords.z / 230) * 100, 6, 94)}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: '14px',
                    zIndex: 3,
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
                  }}
                >
                  ✈️
                </div>
              </div>

              {/* Clickable Landmark List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  maxHeight: '215px',
                  overflowY: 'auto',
                }}
              >
                {VILLAGE_LANDMARKS.map((lm) => {
                  const isCurrent = lm.id === currentLandmarkId;
                  return (
                    <div
                      key={lm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 9px',
                        borderRadius: '10px',
                        background: isCurrent
                          ? 'rgba(78, 136, 64, 0.18)'
                          : 'rgba(255, 255, 255, 0.65)',
                        border: '1px solid rgba(58, 92, 54, 0.22)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onFlyToLandmark(lm, false);
                          setShowRadarPopover(false);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          flex: 1,
                          color: '#1E2E1C',
                        }}
                      >
                        <div style={{ fontSize: '11.5px', fontWeight: 700 }}>
                          {lm.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#526B4C' }}>
                          {lm.subtitle}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onFlyToLandmark(lm, true);
                          setShowRadarPopover(false);
                        }}
                        title="Instant Teleport Over Landmark"
                        style={{
                          background: 'rgba(78, 136, 64, 0.16)',
                          border: '1px solid rgba(58, 92, 54, 0.28)',
                          borderRadius: '6px',
                          padding: '3px 7px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#2A4E24',
                          cursor: 'pointer',
                        }}
                      >
                        Warp
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* CENTER DISCOVERY TOAST & HOVER TOOLTIP                            */}
      {/* ================================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {discoveryToast && (
          <div
            style={{
              background: 'rgba(250, 252, 244, 0.94)',
              border: '1.5px solid rgba(64, 108, 56, 0.42)',
              borderRadius: '16px',
              padding: '8px 18px',
              boxShadow: '0 12px 32px rgba(28, 48, 24, 0.16)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#467E3E' }}>
              ✦ VILLAGE LANDMARK BELOW ✦
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E2E1C' }}>
              {discoveryToast.name} ({discoveryToast.jpName})
            </div>
          </div>
        )}

        {hoveredItem && (
          <div
            style={{
              background: 'rgba(30, 44, 28, 0.84)',
              color: '#F6F8F0',
              padding: '5px 13px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            {hoveredItem}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* BOTTOM DOCK: 6 Camera Modes + Speed Preset + Biplane Flight Pad   */}
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
        {/* Left: 6 Camera Mode Selector Pills (including Anime Full View!) */}
        <div
          style={{
            background: 'rgba(250, 252, 244, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(58, 92, 54, 0.32)',
            borderRadius: '999px',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 8px 24px rgba(32, 52, 28, 0.12)',
            pointerEvents: 'auto',
            flexWrap: 'wrap',
          }}
        >
          {CAMERA_MODES.map((m) => {
            const active = cameraMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectCameraMode(m.id)}
                title={m.description}
                style={{
                  background: active ? '#3E7835' : 'transparent',
                  color: active ? '#FFFFFF' : '#263824',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '6px 11px',
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
                <span>{m.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Biplane Speed Preset + Flight Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
            flexWrap: 'wrap',
          }}
        >
          {/* Interactive Hold-to-Steer / Speed / Roll Flight Pad */}
          <div
            style={{
              background: 'rgba(250, 252, 244, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(58, 92, 54, 0.32)',
              borderRadius: '999px',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 8px 24px rgba(32, 52, 28, 0.12)',
            }}
          >
            <button
              type="button"
              onClick={onCycleSpeedPreset}
              title="Switch Flight Speed Preset: Relaxed / Fast / Turbo Anime (G)"
              style={{
                background:
                  speedPreset === 'turbo'
                    ? '#D94B38'
                    : speedPreset === 'fast'
                      ? '#2F6E8E'
                      : 'rgba(78, 136, 64, 0.18)',
                color: speedPreset === 'relaxed' ? '#1E2E1C' : '#FFFFFF',
                border: 'none',
                borderRadius: '999px',
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {speedLabel} (G)
            </button>

            <button
              type="button"
              onPointerDown={() => {
                virtualInputRef.current.turnLeft = true;
              }}
              onPointerUp={() => {
                virtualInputRef.current.turnLeft = false;
              }}
              onPointerLeave={() => {
                virtualInputRef.current.turnLeft = false;
              }}
              title="Bank Left (A / Left Arrow)"
              style={{
                background: 'rgba(78, 136, 64, 0.15)',
                border: '1px solid rgba(58, 92, 54, 0.25)',
                borderRadius: '999px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#1E2E1C',
                cursor: 'pointer',
              }}
            >
              ↺ Bank L
            </button>

            <button
              type="button"
              onPointerDown={() => {
                virtualInputRef.current.forward = true;
                virtualInputRef.current.boost = true;
              }}
              onPointerUp={() => {
                virtualInputRef.current.forward = false;
                virtualInputRef.current.boost = false;
              }}
              onPointerLeave={() => {
                virtualInputRef.current.forward = false;
                virtualInputRef.current.boost = false;
              }}
              title="Hold for Afterburner Boost (W / Shift)"
              style={{
                background: 'rgba(78, 136, 64, 0.15)',
                border: '1px solid rgba(58, 92, 54, 0.25)',
                borderRadius: '999px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#1E2E1C',
                cursor: 'pointer',
              }}
            >
              ⚡ Boost
            </button>

            <button
              type="button"
              onPointerDown={() => {
                virtualInputRef.current.turnRight = true;
              }}
              onPointerUp={() => {
                virtualInputRef.current.turnRight = false;
              }}
              onPointerLeave={() => {
                virtualInputRef.current.turnRight = false;
              }}
              title="Bank Right (D / Right Arrow)"
              style={{
                background: 'rgba(78, 136, 64, 0.15)',
                border: '1px solid rgba(58, 92, 54, 0.25)',
                borderRadius: '999px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#1E2E1C',
                cursor: 'pointer',
              }}
            >
              Bank R ↻
            </button>

            <button
              type="button"
              onClick={onTriggerBarrelRoll}
              title="Perform Aviator Barrel Roll (F)"
              style={{
                background: '#E07A38',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '999px',
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🌀 Roll (F)
            </button>

            <button
              type="button"
              onClick={onToggleAutoCruise}
              title="Toggle Scenic Auto-Cruise"
              style={{
                background: autoCruise ? '#3E7835' : 'rgba(58, 92, 54, 0.15)',
                color: autoCruise ? '#FFFFFF' : '#263824',
                border: 'none',
                borderRadius: '999px',
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {autoCruise ? '✈️ Cruise: ON' : '⏸️ Cruise: OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
