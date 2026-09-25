import { useState, useEffect } from 'react';
import IslandScene from './components/Scene/IslandScene';
import LoadingScreen from './components/UI/LoadingScreen';
import HeroOverlay from './components/UI/HeroOverlay';
import SceneControls from './components/UI/SceneControls';
import ExploreIndicator from './components/UI/ExploreIndicator';
import { useInteraction } from './hooks/useInteraction';

function App() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const {
    hoveredObject,
    activePreset,
    cameraMode,
    presetTarget,
    hasExplored,
    setCameraMode,
    handlePointerOver,
    handlePointerOut,
    selectPreset,
    markExplored,
  } = useInteraction();

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 25 + 15;
      if (current >= 100) {
        setProgress(100);
        clearInterval(interval);
        const timer = setTimeout(() => {
          setLoaded(true);
        }, 400);
        return () => clearTimeout(timer);
      } else {
        setProgress(current);
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <LoadingScreen progress={progress} loaded={loaded} />
      <HeroOverlay visible={loaded} />
      <ExploreIndicator visible={loaded && !hasExplored} />
      <SceneControls
        onPresetSelect={selectPreset}
        activePreset={activePreset}
        visible={loaded}
      />
      <IslandScene
        cameraMode={cameraMode}
        presetTarget={presetTarget}
        hoveredObject={hoveredObject}
        onModeChange={setCameraMode}
        onHover={handlePointerOver}
        onUnhover={handlePointerOut}
        onSelectObject={selectPreset}
        onUserInteract={markExplored}
      />
    </main>
  );
}

export default App;
