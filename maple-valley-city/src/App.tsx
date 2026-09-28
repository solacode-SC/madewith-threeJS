import { useEffect, useState } from 'react';
import CityCanvas from './components/scene/CityCanvas';
import LoadingScreen from './components/ui/LoadingScreen';
import MinimalHud from './components/ui/MinimalHud';
import { useCityController } from './state/useCityController';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const {
    cameraMode,
    brushMood,
    autoWalk,
    hudHidden,
    hoveredItem,
    currentDistrictId,
    discoveredDistricts,
    discoveryToast,
    collectedCharms,
    walkMarker,
    audioState,
    characterPosRef,
    characterYawRef,
    characterSpeedRef,
    cameraYawRef,
    cameraPitchRef,
    walkPathRef,
    waveTimerRef,
    jumpVelRef,
    jumpHeightRef,
    virtualInputRef,
    setCameraMode,
    cycleCameraMode,
    cycleBrushMood,
    setHudHidden,
    setHoveredItem,
    toggleAutoWalk,
    handleRoadClick,
    clearWalkTarget,
    stopAutoWalkOnManualInput,
    triggerDistrictDiscovery,
    collectCharm,
    navigateToDistrict,
    toggleMusic,
    nextSong,
    startMusic,
  } = useCityController();

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 32 + 22;
      if (current >= 100) {
        setProgress(100);
        clearInterval(interval);
        const timer = setTimeout(() => {
          setLoaded(true);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setProgress(current);
      }
    }, 90);

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
        brushMood={brushMood}
        autoWalk={autoWalk}
        hoveredItem={hoveredItem}
        currentDistrictId={currentDistrictId}
        discoveredDistricts={discoveredDistricts}
        discoveryToast={discoveryToast}
        audioState={audioState}
        characterPosRef={characterPosRef}
        onSelectCameraMode={setCameraMode}
        onCycleBrushMood={cycleBrushMood}
        onToggleAutoWalk={toggleAutoWalk}
        onToggleHudHidden={() => setHudHidden((p) => !p)}
        onToggleMusic={toggleMusic}
        onNextSong={nextSong}
        onNavigateToDistrict={navigateToDistrict}
        onMiniMapCellClick={handleRoadClick}
      />

      <CityCanvas
        cameraMode={cameraMode}
        brushMood={brushMood}
        autoWalk={autoWalk}
        collectedCharms={collectedCharms}
        walkMarker={walkMarker}
        characterPosRef={characterPosRef}
        characterYawRef={characterYawRef}
        characterSpeedRef={characterSpeedRef}
        cameraYawRef={cameraYawRef}
        cameraPitchRef={cameraPitchRef}
        walkPathRef={walkPathRef}
        waveTimerRef={waveTimerRef}
        jumpVelRef={jumpVelRef}
        jumpHeightRef={jumpHeightRef}
        virtualInputRef={virtualInputRef}
        onCycleCameraMode={cycleCameraMode}
        onRoadClick={handleRoadClick}
        onClearWalkTarget={clearWalkTarget}
        onManualMove={stopAutoWalkOnManualInput}
        onDiscoverDistrict={triggerDistrictDiscovery}
        onCollectCharm={collectCharm}
        onHover={setHoveredItem}
      />
    </main>
  );
}
