import { useEffect, useRef, useState } from 'react';
import MeadowCanvas from './components/scene/MeadowCanvas';
import LoadingScreen from './components/ui/LoadingScreen';
import MinimalHud from './components/ui/MinimalHud';
import { MeadowSoundscapeEngine } from './audio/SoundtrackEngine';
import type { CameraPreset, SkyMood } from './domain/meadowConfig';

export default function App() {
  const [skyMood, setSkyMood] = useState<SkyMood>('painterly-noon');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('reference-canvas');
  const [windSpeed, setWindSpeed] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Soundscape state
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.5);
  const soundEngineRef = useRef<MeadowSoundscapeEngine | null>(null);

  // Initialize soundscape engine on first toggle
  const handleToggleAudio = () => {
    if (!soundEngineRef.current) {
      soundEngineRef.current = new MeadowSoundscapeEngine();
      soundEngineRef.current.init();
      soundEngineRef.current.setVolume(audioVolume);
      setIsAudioActive(true);
    } else {
      const muted = soundEngineRef.current.toggleMute();
      setIsAudioActive(!muted);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    if (soundEngineRef.current) {
      soundEngineRef.current.setVolume(vol);
    }
  };

  useEffect(() => {
    return () => {
      soundEngineRef.current?.dispose();
    };
  }, []);

  return (
    <main
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0B111E',
      }}
    >
      {/* 3D WebGL Canvas Scene */}
      <MeadowCanvas
        skyMood={skyMood}
        cameraPreset={cameraPreset}
        windSpeed={windSpeed}
        onPresetChange={setCameraPreset}
      />

      {/* Hand-Painted Cold-Press Watercolor Paper Grain Overlay */}
      <div className="paper-canvas-overlay" />

      {/* Modern Japanese Fine-Art Minimal HUD */}
      <MinimalHud
        skyMood={skyMood}
        onSelectMood={setSkyMood}
        cameraPreset={cameraPreset}
        onSelectPreset={setCameraPreset}
        windSpeed={windSpeed}
        onWindSpeedChange={setWindSpeed}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
        audioVolume={audioVolume}
        onVolumeChange={handleVolumeChange}
      />

      {/* Loading Screen Overlay */}
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
    </main>
  );
}
