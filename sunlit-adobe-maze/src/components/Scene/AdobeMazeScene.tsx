import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import InteriorAtmosphere from './InteriorAtmosphere';
import AdobeMazeArchitecture from './AdobeMazeArchitecture';
import TerracottaPottery from './TerracottaPottery';
import RedCoatChibiGirl from './RedCoatChibiGirl';
import MazeCameraRig from './MazeCameraRig';
import PostProcessing from './PostProcessing';
import type { CameraMode, SunMood, VirtualWalkInput } from '../../hooks/useMazeState';

interface AdobeMazeSceneProps {
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

export default function AdobeMazeScene({
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
}: AdobeMazeSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [-4.45, 1.48, 12.6], fov: 46, near: 0.08, far: 65 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.06,
      }}
    >
      <Suspense fallback={null}>
        <InteriorAtmosphere sunMood={sunMood} characterPosRef={characterPosRef} />

        <MazeCameraRig
          cameraMode={cameraMode}
          characterPosRef={characterPosRef}
          characterSpeedRef={characterSpeedRef}
          cameraYawRef={cameraYawRef}
          cameraPitchRef={cameraPitchRef}
          virtualInputRef={virtualInputRef}
          onCycleCameraMode={onCycleCameraMode}
        />

        <AdobeMazeArchitecture
          sunMood={sunMood}
          showGuidePath={showGuidePath}
          targetZoneId={targetZoneId}
          collectedRelics={collectedRelics}
          walkMarker={walkMarker}
          characterPosRef={characterPosRef}
          onFloorClick={onFloorClick}
          onHover={onHover}
        />

        <TerracottaPottery onHover={onHover} />

        <RedCoatChibiGirl
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
