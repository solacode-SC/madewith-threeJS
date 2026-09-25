import { useState, useEffect } from 'react';
import MedinaScene from './components/Scene/MedinaScene';
import LoadingScreen from './components/UI/LoadingScreen';
import HudOverlay from './components/UI/HudOverlay';
import { useSceneState } from './hooks/useSceneState';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const {
    cameraMode,
    timeOfDay,
    autoFly,
    hoveredItem,
    currentZoneId,
    discoveredZones,
    discoveryToast,
    collectedStars,
    flyMarker,
    characterPosRef,
    characterYawRef,
    flightAltitudeOffsetRef,
    flyTargetRef,
    virtualInputRef,
    setCameraMode,
    setHoveredItem,
    cycleTimeOfDay,
    toggleAutoFly,
    triggerZoneDiscovery,
    collectStar,
    handleRoadClick,
    clearFlyTarget,
    stopAutoFlyOnManualInput,
    jumpToZone,
  } = useSceneState();

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
        timeOfDay={timeOfDay}
        autoFly={autoFly}
        hoveredItem={hoveredItem}
        currentZoneId={currentZoneId}
        discoveredZones={discoveredZones}
        discoveryToast={discoveryToast}
        collectedStars={collectedStars}
        virtualInputRef={virtualInputRef}
        onSelectCameraMode={setCameraMode}
        onCycleTimeOfDay={cycleTimeOfDay}
        onToggleAutoFly={toggleAutoFly}
        onJumpToZone={jumpToZone}
      />

      <MedinaScene
        cameraMode={cameraMode}
        timeOfDay={timeOfDay}
        autoFly={autoFly}
        collectedStars={collectedStars}
        flyMarker={flyMarker}
        characterPosRef={characterPosRef}
        characterYawRef={characterYawRef}
        flightAltitudeOffsetRef={flightAltitudeOffsetRef}
        flyTargetRef={flyTargetRef}
        virtualInputRef={virtualInputRef}
        onSelectCameraMode={setCameraMode}
        onRoadClick={handleRoadClick}
        onClearFlyTarget={clearFlyTarget}
        onManualMove={stopAutoFlyOnManualInput}
        onDiscoverZone={triggerZoneDiscovery}
        onCollectStar={collectStar}
        onJumpToZone={jumpToZone}
        onHover={setHoveredItem}
      />
    </main>
  );
}
