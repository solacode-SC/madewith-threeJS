import { useEffect, useState } from 'react';
import SkyWorldCanvas from './components/scene/SkyWorldCanvas';
import LoadingScreen from './components/ui/LoadingScreen';
import MinimalHud from './components/ui/MinimalHud';
import { useFlightController } from './state/useFlightController';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const {
    cameraMode,
    skyMood,
    speedPreset,
    autoCruise,
    hudHidden,
    hoveredItem,
    currentLandmarkId,
    discoveredLandmarks,
    discoveryToast,
    collectedRings,
    flightMarker,
    audioState,
    planePosRef,
    planeYawRef,
    planePitchRef,
    planeRollRef,
    planeSpeedRef,
    targetPointRef,
    barrelRollTimerRef,
    cameraYawOffsetRef,
    cameraPitchOffsetRef,
    virtualInputRef,
    setCameraMode,
    cycleCameraMode,
    setSkyMood,
    cycleSpeedPreset,
    setHudHidden,
    setHoveredItem,
    toggleAutoCruise,
    triggerBarrelRoll,
    handleGroundOrVillageClick,
    clearFlightTarget,
    triggerLandmarkDiscovery,
    collectSkyRing,
    flyToLandmark,
    toggleMusic,
    nextSong,
    startMusic,
  } = useFlightController();

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 34 + 24;
      if (current >= 100) {
        setProgress(100);
        clearInterval(interval);
        const timer = setTimeout(() => {
          setLoaded(true);
        }, 280);
        return () => clearTimeout(timer);
      } else {
        setProgress(current);
      }
    }, 85);

    return () => clearInterval(interval);
  }, []);

  const handleEnterWithMusic = () => {
    void startMusic();
    setLoaded(true);
  };

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <LoadingScreen
        progress={progress}
        loaded={loaded}
        onEnterWithMusic={handleEnterWithMusic}
      />

      <MinimalHud
        visible={loaded}
        hudHidden={hudHidden}
        cameraMode={cameraMode}
        skyMood={skyMood}
        speedPreset={speedPreset}
        autoCruise={autoCruise}
        hoveredItem={hoveredItem}
        currentLandmarkId={currentLandmarkId}
        discoveredLandmarks={discoveredLandmarks}
        discoveryToast={discoveryToast}
        collectedRings={collectedRings}
        audioState={audioState}
        planePosRef={planePosRef}
        planeSpeedRef={planeSpeedRef}
        virtualInputRef={virtualInputRef}
        onSelectCameraMode={setCameraMode}
        onSelectSkyMood={setSkyMood}
        onCycleSpeedPreset={cycleSpeedPreset}
        onToggleAutoCruise={toggleAutoCruise}
        onTriggerBarrelRoll={triggerBarrelRoll}
        onToggleHudHidden={() => setHudHidden((p) => !p)}
        onToggleMusic={toggleMusic}
        onNextSong={nextSong}
        onFlyToLandmark={flyToLandmark}
      />

      <SkyWorldCanvas
        cameraMode={cameraMode}
        skyMood={skyMood}
        speedPreset={speedPreset}
        autoCruise={autoCruise}
        collectedRings={collectedRings}
        flightMarker={flightMarker}
        planePosRef={planePosRef}
        planeYawRef={planeYawRef}
        planePitchRef={planePitchRef}
        planeRollRef={planeRollRef}
        planeSpeedRef={planeSpeedRef}
        targetPointRef={targetPointRef}
        barrelRollTimerRef={barrelRollTimerRef}
        cameraYawOffsetRef={cameraYawOffsetRef}
        cameraPitchOffsetRef={cameraPitchOffsetRef}
        virtualInputRef={virtualInputRef}
        onCycleCameraMode={cycleCameraMode}
        onGroundClick={handleGroundOrVillageClick}
        onClearFlightTarget={clearFlightTarget}
        onDiscoverLandmark={triggerLandmarkDiscovery}
        onCollectRing={collectSkyRing}
        onHover={setHoveredItem}
      />
    </main>
  );
}
