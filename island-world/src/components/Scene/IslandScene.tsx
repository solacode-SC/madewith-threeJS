import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Atmosphere from './Atmosphere';
import Lighting from './Lighting';
import CameraController from './CameraController';
import Island from './Island';
import Ocean from './Ocean';
import Cabin from './Cabin';
import PalmTrees from './PalmTrees';
import Rocks from './Rocks';
import Boat from './Boat';
import Particles from './Particles';
import PostProcessing from './PostProcessing';
import type { CameraMode, PresetTarget } from '../../hooks/useInteraction';

export interface IslandSceneProps {
  cameraMode: CameraMode;
  presetTarget: PresetTarget;
  hoveredObject: string | null;
  onModeChange: (mode: CameraMode) => void;
  onHover: (name: string) => void;
  onUnhover: () => void;
  onSelectObject: (preset: string) => void;
  onUserInteract: () => void;
}

export default function IslandScene({
  cameraMode,
  presetTarget,
  hoveredObject,
  onModeChange,
  onHover,
  onUnhover,
  onSelectObject,
  onUserInteract,
}: IslandSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [3, 2.5, 6], fov: 45, near: 0.1, far: 200 }}
      onPointerDown={onUserInteract}
    >
      <Suspense fallback={null}>
        <Atmosphere />
        <Lighting />
        <CameraController
          mode={cameraMode}
          presetTarget={presetTarget}
          onModeChange={onModeChange}
        />

        <group>
          <Island />
          <Rocks />
          <Cabin
            position={[0.3, 0.45, 0]}
            hovered={hoveredObject === 'Cabin'}
            onPointerOver={(e) => {
              if (e && typeof e === 'object' && 'stopPropagation' in e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
              onHover('Cabin');
            }}
            onPointerOut={onUnhover}
            onClick={(e) => {
              e.stopPropagation();
              onSelectObject('Cabin');
            }}
          />
          <PalmTrees
            hovered={hoveredObject === 'Palms'}
            onPointerOver={() => onHover('Palms')}
            onPointerOut={onUnhover}
            onClick={() => onSelectObject('Palms')}
          />
          <Boat
            position={[0.8, 0.0, 1.2]}
            hovered={hoveredObject === 'Boat'}
            onPointerOver={() => onHover('Boat')}
            onPointerOut={onUnhover}
            onClick={() => onSelectObject('Boat')}
          />
        </group>

        <Ocean />
        <Particles count={60} />
        <PostProcessing />
      </Suspense>
    </Canvas>
  );
}
