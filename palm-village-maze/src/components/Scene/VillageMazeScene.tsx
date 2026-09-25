import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import VillageAtmosphere from './VillageAtmosphere';
import VillageArchitecture from './VillageArchitecture';
import PalmTrees from './PalmTrees';
import YellowCoatChibiGirl from './YellowCoatChibiGirl';
import VillageCameraRig from './VillageCameraRig';
import PostProcessing from './PostProcessing';
import type { CameraMode, SunMood, VirtualWalkInput } from '../../hooks/useMazeState';

interface VillageMazeSceneProps {
  cameraMode: CameraMode;
  sunMood: SunMood;
  showGuidePath: boolean;
  autoWalk: boolean;
  targetZoneId: string;
  collectedRelics: number[];
  walkMarker: [number, number, number] | null;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterYawRef: React.MutableRefObject<number>;
  characterSpeedRef: React.MutableRefObject<number>;
  cameraYawRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
  walkPathRef: React.MutableRefObject<THREE.Vector3[]>;
  waveTimerRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualWalkInput>;
  onCycleCameraMode: () => void;
  onFloorClick: (point: THREE.Vector3) => void;
  onClearWalkTarget: () => void;
  onManualMove: () => void;
  onDiscoverZone: (zoneId: string) => void;
  onCollectRelic: (relicId: number) => void;
  onSelectCharacter: () => void;
  onHover: (label: string | null) => void;
}

export default function VillageMazeScene({
  cameraMode,
  sunMood,
  showGuidePath,
  autoWalk,
  targetZoneId,
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
  onCycleCameraMode,
  onFloorClick,
  onClearWalkTarget,
  onManualMove,
  onDiscoverZone,
  onCollectRelic,
  onSelectCharacter,
  onHover,
}: VillageMazeSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [-4.45, 1.68, 12.6], fov: 48, near: 0.08, far: 70 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.12,
      }}
    >
      <Suspense fallback={null}>
        <VillageAtmosphere sunMood={sunMood} characterPosRef={characterPosRef} />

        <VillageCameraRig
          cameraMode={cameraMode}
          characterPosRef={characterPosRef}
          characterSpeedRef={characterSpeedRef}
          cameraYawRef={cameraYawRef}
          cameraPitchRef={cameraPitchRef}
          virtualInputRef={virtualInputRef}
          onCycleCameraMode={onCycleCameraMode}
        />

        <VillageArchitecture
          sunMood={sunMood}
          showGuidePath={showGuidePath}
          targetZoneId={targetZoneId}
          collectedRelics={collectedRelics}
          walkMarker={walkMarker}
          characterPosRef={characterPosRef}
          onFloorClick={onFloorClick}
          onHover={onHover}
        />

        <PalmTrees />

        <YellowCoatChibiGirl
          cameraMode={cameraMode}
          autoWalk={autoWalk}
          collectedRelics={collectedRelics}
          characterPosRef={characterPosRef}
          characterYawRef={characterYawRef}
          characterSpeedRef={characterSpeedRef}
          cameraYawRef={cameraYawRef}
          walkPathRef={walkPathRef}
          waveTimerRef={waveTimerRef}
          virtualInputRef={virtualInputRef}
          onClearWalkTarget={onClearWalkTarget}
          onManualMove={onManualMove}
          onDiscoverZone={onDiscoverZone}
          onCollectRelic={onCollectRelic}
          onSelectCharacter={onSelectCharacter}
          onHover={onHover}
        />

        <PostProcessing />
      </Suspense>
    </Canvas>
  );
}
