import { useState, useEffect } from 'react';
import VillageMazeScene from './components/Scene/VillageMazeScene';
import LoadingScreen from './components/UI/LoadingScreen';
import HudOverlay from './components/UI/HudOverlay';
import { useMazeState } from './hooks/useMazeState';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const {
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
    walkMarker,
    characterPosRef,
    characterYawRef,
    characterSpeedRef,
    cameraYawRef,
    cameraPitchRef,
    walkPathRef,
    waveTimerRef,
    virtualInputRef,
    setCameraMode,
    cycleCameraMode,
    setHoveredItem,
    cycleSunMood,
    setShowGuidePath,
    toggleAutoWalk,
    triggerWave,
    triggerZoneDiscovery,
    collectRelic,
    handleFloorClick,
    clearWalkTarget,
    stopAutoWalkOnManualInput,
    navigateToZone,
  } = useMazeState();

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 28 + 18;
      if (current >= 100) {
        setProgress(100);
        clearInterval(interval);
        const timer = setTimeout(() => {
          setLoaded(true);
        }, 350);
        return () => clearTimeout(timer);
      } else {
        setProgress(current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <LoadingScreen progress={progress} loaded={loaded} />

      <HudOverlay
        visible={loaded}
        cameraMode={cameraMode}
        sunMood={sunMood}
        showGuidePath={showGuidePath}
        autoWalk={autoWalk}
        hoveredItem={hoveredItem}
        currentZoneId={currentZoneId}
        targetZoneId={targetZoneId}
        discoveredZones={discoveredZones}
        discoveryToast={discoveryToast}
        collectedRelics={collectedRelics}
        characterPosRef={characterPosRef}
        characterYawRef={characterYawRef}
        virtualInputRef={virtualInputRef}
        onSelectCameraMode={setCameraMode}
        onCycleSunMood={cycleSunMood}
        onToggleGuidePath={() => setShowGuidePath((p) => !p)}
        onToggleAutoWalk={toggleAutoWalk}
        onTriggerWave={triggerWave}
        onNavigateToZone={navigateToZone}
        onMiniMapCellClick={handleFloorClick}
      />

      <VillageMazeScene
        cameraMode={cameraMode}
        sunMood={sunMood}
        showGuidePath={showGuidePath}
        autoWalk={autoWalk}
        targetZoneId={targetZoneId}
        collectedRelics={collectedRelics}
        walkMarker={walkMarker}
        characterPosRef={characterPosRef}
        characterYawRef={characterYawRef}
        characterSpeedRef={characterSpeedRef}
        cameraYawRef={cameraYawRef}
        cameraPitchRef={cameraPitchRef}
        walkPathRef={walkPathRef}
        waveTimerRef={waveTimerRef}
        virtualInputRef={virtualInputRef}
        onCycleCameraMode={cycleCameraMode}
        onFloorClick={handleFloorClick}
        onClearWalkTarget={clearWalkTarget}
        onManualMove={stopAutoWalkOnManualInput}
        onDiscoverZone={triggerZoneDiscovery}
        onCollectRelic={collectRelic}
        onSelectCharacter={() =>
          setCameraMode((prev) => (prev === 'follow' ? 'pov' : 'follow'))
        }
        onHover={setHoveredItem}
      />
    </main>
  );
}
