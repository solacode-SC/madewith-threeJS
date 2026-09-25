import { useState, useEffect } from 'react';
import CoastalScene from './components/Scene/CoastalScene';
import LoadingScreen from './components/UI/LoadingScreen';
import HudOverlay from './components/UI/HudOverlay';
import { useSceneState } from './hooks/useSceneState';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const {
    activePreset,
    timeOfDay,
    autoPatrol,
    doorOpen,
    hoveredItem,
    walkMarker,
    characterPosRef,
    characterAngleRef,
    walkTargetRef,
    virtualInputRef,
    setHoveredItem,
    selectPreset,
    toggleTimeOfDay,
    toggleAutoPatrol,
    toggleDoor,
    handleGroundClick,
    clearWalkTarget,
    stopAutoPatrolOnManualInput,
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
        activePreset={activePreset}
        timeOfDay={timeOfDay}
        autoPatrol={autoPatrol}
        doorOpen={doorOpen}
        hoveredItem={hoveredItem}
        virtualInputRef={virtualInputRef}
        onSelectPreset={selectPreset}
        onToggleTimeOfDay={toggleTimeOfDay}
        onToggleAutoPatrol={toggleAutoPatrol}
        onToggleDoor={toggleDoor}
      />

      <CoastalScene
        activePreset={activePreset}
        timeOfDay={timeOfDay}
        autoPatrol={autoPatrol}
        doorOpen={doorOpen}
        walkMarker={walkMarker}
        characterPosRef={characterPosRef}
        characterAngleRef={characterAngleRef}
        walkTargetRef={walkTargetRef}
        virtualInputRef={virtualInputRef}
        onSelectPreset={selectPreset}
        onToggleDoor={toggleDoor}
        onGroundClick={handleGroundClick}
        onClearWalkTarget={clearWalkTarget}
        onManualMove={stopAutoPatrolOnManualInput}
        onHover={setHoveredItem}
      />
    </main>
  );
}
