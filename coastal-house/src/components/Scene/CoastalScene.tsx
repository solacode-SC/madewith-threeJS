import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import CoastalEnvironment from './CoastalEnvironment';
import CoastalHouse from './CoastalHouse';
import PalmTrees from './PalmTrees';
import ChibiRonin from './ChibiRonin';
import LightingAndParticles from './LightingAndParticles';
import CameraRig from './CameraRig';
import PostProcessing from './PostProcessing';
import type { CameraPreset, TimeOfDay } from '../../hooks/useSceneState';

interface CoastalSceneProps {
  activePreset: CameraPreset;
  timeOfDay: TimeOfDay;
  autoPatrol: boolean;
  doorOpen: boolean;
  walkMarker: [number, number, number] | null;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterAngleRef: React.MutableRefObject<number>;
  walkTargetRef: React.MutableRefObject<THREE.Vector3 | null>;
  virtualInputRef: React.MutableRefObject<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    sprint: boolean;
  }>;
  onSelectPreset: (preset: CameraPreset) => void;
  onToggleDoor: () => void;
  onGroundClick: (point: THREE.Vector3) => void;
  onClearWalkTarget: () => void;
  onManualMove: () => void;
  onHover: (label: string | null) => void;
}

export default function CoastalScene({
  activePreset,
  timeOfDay,
  autoPatrol,
  doorOpen,
  walkMarker,
  characterPosRef,
  characterAngleRef,
  walkTargetRef,
  virtualInputRef,
  onSelectPreset,
  onToggleDoor,
  onGroundClick,
  onClearWalkTarget,
  onManualMove,
  onHover,
}: CoastalSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2.35, 8.2], fov: 38, near: 0.1, far: 180 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
    >
      <Suspense fallback={null}>
        <LightingAndParticles timeOfDay={timeOfDay} />

        <CameraRig activePreset={activePreset} characterPosRef={characterPosRef} />

        <CoastalEnvironment
          timeOfDay={timeOfDay}
          walkMarker={walkMarker}
          onGroundClick={onGroundClick}
        />

        <CoastalHouse
          timeOfDay={timeOfDay}
          doorOpen={doorOpen}
          onToggleDoor={onToggleDoor}
          onSelectWindow={() => onSelectPreset('window')}
          onHover={onHover}
        />

        <PalmTrees />

        <ChibiRonin
          autoPatrol={autoPatrol}
          characterPosRef={characterPosRef}
          characterAngleRef={characterAngleRef}
          walkTargetRef={walkTargetRef}
          virtualInputRef={virtualInputRef}
          onClearWalkTarget={onClearWalkTarget}
          onManualMove={onManualMove}
          onSelectCharacter={() => onSelectPreset('follow')}
          onHover={onHover}
        />

        <PostProcessing />
      </Suspense>
    </Canvas>
  );
}
