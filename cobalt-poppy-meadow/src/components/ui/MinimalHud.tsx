import { useState } from 'react';
import {
  CAMERA_PRESETS,
  MOOD_THEMES,
  type CameraPreset,
  type SkyMood,
} from '../../domain/meadowConfig';

interface MinimalHudProps {
  skyMood: SkyMood;
  onSelectMood: (mood: SkyMood) => void;
  cameraPreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
  windSpeed: number;
  onWindSpeedChange: (speed: number) => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  audioVolume: number;
  onVolumeChange: (vol: number) => void;
}

export default function MinimalHud({
  skyMood,
  onSelectMood,
  cameraPreset,
  onSelectPreset,
  windSpeed,
  onWindSpeedChange,
  isAudioActive,
  onToggleAudio,
  audioVolume,
  onVolumeChange,
}: MinimalHudProps) {
  const [showRefArtModal, setShowRefArtModal] = useState(false);
  const [showControlsHint, setShowControlsHint] = useState(true);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 24px',
        color: '#F8FAFC',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {/* 1. TOP HEADER BAR */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Title and Japanese Category */}
        <div
          style={{
            background: 'rgba(11, 17, 30, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 18px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.24em',
              color: '#60A5FA',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>// NATURE SANCTUARY</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <span>蒼碧のポピー花野</span>
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: '#F8FAFC',
              margin: 0,
            }}
          >
            Cobalt Poppy Meadow
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '6px',
              fontSize: '11px',
              color: '#94A3B8',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px #10B981',
              }}
            />
            <span>Pure Nature • Zero Houses or Humans</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>7,950+ Instanced Plants</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ color: '#FCD34D' }}>Locked 60 FPS</span>
          </div>
        </div>

        {/* Action Buttons: Reference Art Modal & Audio */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Reference Art Toggle Button */}
          <button
            onClick={() => setShowRefArtModal(!showRefArtModal)}
            style={{
              background: showRefArtModal ? 'rgba(37, 99, 235, 0.85)' : 'rgba(11, 17, 30, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '10px 16px',
              color: '#F8FAFC',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
          >
            <span>🎨</span>
            <span>{showRefArtModal ? 'Close Painting' : 'View Reference Artwork'}</span>
          </button>

          {/* Generative Nature Audio Toggle */}
          <button
            onClick={onToggleAudio}
            style={{
              background: isAudioActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(11, 17, 30, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${isAudioActive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '12px',
              padding: '10px 16px',
              color: isAudioActive ? '#34D399' : '#94A3B8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
          >
            <span>{isAudioActive ? '🔊' : '🔈'}</span>
            <span>{isAudioActive ? 'Nature Sound On' : 'Unmute Soundscape'}</span>
          </button>
        </div>
      </header>

      {/* 2. SIDE FLOATING CONTROLS (Wind & Volume) */}
      <div
        style={{
          alignSelf: 'flex-end',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'auto',
          marginTop: 'auto',
          marginBottom: '16px',
        }}
      >
        {/* Wind Speed Controller */}
        <div
          style={{
            background: 'rgba(11, 17, 30, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '180px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#94A3B8',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>🍃 Meadow Breeze</span>
            <span style={{ color: '#60A5FA' }}>{windSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={windSpeed}
            onChange={(e) => onWindSpeedChange(parseFloat(e.target.value))}
            style={{
              accentColor: '#3B82F6',
              cursor: 'pointer',
              height: '4px',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Audio Volume (only if active) */}
        {isAudioActive && (
          <div
            style={{
              background: 'rgba(11, 17, 30, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              width: '180px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#94A3B8',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>🎵 Nature Ambiance</span>
              <span style={{ color: '#10B981' }}>{Math.round(audioVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioVolume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              style={{
                accentColor: '#10B981',
                cursor: 'pointer',
                height: '4px',
                borderRadius: '2px',
              }}
            />
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROL DOCK (Camera Views + Mood Presets) */}
      <footer
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'auto',
          width: '100%',
        }}
      >
        {/* Navigation Hint */}
        {showControlsHint && (
          <div
            style={{
              background: 'rgba(11, 17, 30, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '20px',
              padding: '5px 14px',
              fontSize: '11px',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span>💡 <strong>WASD / Arrow Keys</strong> to stroll along path</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <span><strong>Click & Drag</strong> to orbit look</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <span><strong>Scroll</strong> to zoom</span>
            <button
              onClick={() => setShowControlsHint(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div
          style={{
            background: 'rgba(11, 17, 30, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '18px',
            padding: '10px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
            maxWidth: '960px',
          }}
        >
          {/* CAMERA VIEW SELECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: '#60A5FA',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginRight: '4px',
              }}
            >
              Camera:
            </span>
            {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((key) => {
              const preset = CAMERA_PRESETS[key];
              const isSelected = cameraPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => onSelectPreset(key)}
                  title={preset.description}
                  style={{
                    background: isSelected ? 'rgba(37, 99, 235, 0.85)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isSelected ? 'rgba(96, 165, 250, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '10px',
                    padding: '6px 12px',
                    color: isSelected ? '#FFFFFF' : '#CBD5E1',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(37, 99, 235, 0.4)' : 'none',
                  }}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              width: '1px',
              height: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            }}
          />

          {/* ATMOSPHERE MOOD SELECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: '#FCD34D',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginRight: '4px',
              }}
            >
              Atmosphere:
            </span>
            {(Object.keys(MOOD_THEMES) as SkyMood[]).map((key) => {
              const theme = MOOD_THEMES[key];
              const isSelected = skyMood === key;
              const moodIcons: Record<SkyMood, string> = {
                'painterly-noon': '☀️',
                'golden-hour': '🌅',
                'lavender-twilight': '🌌',
                'misty-dawn': '🪷',
              };

              return (
                <button
                  key={key}
                  onClick={() => onSelectMood(key)}
                  title={theme.description}
                  style={{
                    background: isSelected ? 'rgba(245, 158, 11, 0.85)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isSelected ? 'rgba(251, 191, 36, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '10px',
                    padding: '6px 12px',
                    color: isSelected ? '#FFFFFF' : '#CBD5E1',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
                  }}
                >
                  <span>{moodIcons[key]}</span>
                  <span>{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {/* 4. REFERENCE ARTWORK SIDE-BY-SIDE MODAL */}
      {showRefArtModal && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            width: '320px',
            background: 'rgba(11, 17, 30, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'auto',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#60A5FA', fontWeight: 700 }}>
                ORIGINAL INSPIRATION
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
                Hand-Painted Gouache Artwork
              </div>
            </div>
            <button
              onClick={() => setShowRefArtModal(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ width: '100%', height: '420px', overflow: 'hidden', background: '#000' }}>
            <img
              src="/reference-art.jpg"
              alt="Reference Painting"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          <div style={{ padding: '12px 16px', fontSize: '11px', color: '#94A3B8', lineHeight: 1.45 }}>
            Notice the signature dark indigo sentinel trees, the winding sandy path, vibrant cobalt and scarlet poppies, and tiered sage hills captured in full real-time 3D.
          </div>
        </div>
      )}
    </div>
  );
}
