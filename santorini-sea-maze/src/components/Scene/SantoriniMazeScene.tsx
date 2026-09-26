import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import CoastalAtmosphere from './CoastalAtmosphere';
import SantoriniArchitecture from './SantoriniArchitecture';
import AegeanSeaAndBotany from './AegeanSeaAndBotany';
import GreenAnimeChibiGirl from './GreenAnimeChibiGirl';
import CoastalCameraRig from './CoastalCameraRig';
import PostProcessing from './PostProcessing';
import type { CameraMode, SunMood, VirtualWalkInput } from '../../hooks/useMazeState';

interface SantoriniMazeSceneProps {
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
  jumpVelRef: React.MutableRefObject<number>;
  jumpHeightRef: React.MutableRefObject<number>;
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

export default function SantoriniMazeScene({
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
  jumpVelRef,
  jumpHeightRef,
  virtualInputRef,
  onCycleCameraMode,
  onFloorClick,
  onClearWalkTarget,
  onManualMove,
  onDiscoverZone,
  onCollectRelic,
  onSelectCharacter,
  onHover,
}: SantoriniMazeSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [-4.8, 1.52, 13.0], fov: 48, near: 0.08, far: 110 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
    >
      <Suspense fallback={null}>
        <CoastalAtmosphere sunMood={sunMood} characterPosRef={characterPosRef} />

        <CoastalCameraRig
          cameraMode={cameraMode}
          characterPosRef={characterPosRef}
          characterYawRef={characterYawRef}
          characterSpeedRef={characterSpeedRef}
          cameraYawRef={cameraYawRef}
          cameraPitchRef={cameraPitchRef}
          jumpHeightRef={jumpHeightRef}
          virtualInputRef={virtualInputRef}
          onCycleCameraMode={onCycleCameraMode}
        />

        <SantoriniArchitecture
          sunMood={sunMood}
          showGuidePath={showGuidePath}
          targetZoneId={targetZoneId}
          collectedRelics={collectedRelics}
          walkMarker={walkMarker}
          characterPosRef={characterPosRef}
          onFloorClick={onFloorClick}
          onHover={onHover}
        />

        <AegeanSeaAndBotany />

        <GreenAnimeChibiGirl
          cameraMode={cameraMode}
          autoWalk={autoWalk}
          collectedRelics={collectedRelics}
          characterPosRef={characterPosRef}
          characterYawRef={characterYawRef}
          characterSpeedRef={characterSpeedRef}
          cameraYawRef={cameraYawRef}
          walkPathRef={walkPathRef}
          waveTimerRef={waveTimerRef}
          jumpVelRef={jumpVelRef}
          jumpHeightRef={jumpHeightRef}
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
