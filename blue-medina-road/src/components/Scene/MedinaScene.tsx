import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import SkyAndAtmosphere from './SkyAndAtmosphere';
import BlueMedinaRoad from './BlueMedinaRoad';
import AmphoraFlowerPots from './AmphoraFlowerPots';
import FlyingChibiGirl from './FlyingChibiGirl';
import CameraRig from './CameraRig';
import PostProcessing from './PostProcessing';
import { LANDMARK_ZONES, type LandmarkZone } from '../../utils/roadPath';
import type { CameraMode, TimeOfDay, VirtualFlightInput } from '../../hooks/useSceneState';

interface MedinaSceneProps {
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  autoFly: boolean;
  collectedStars: number[];
  flyMarker: [number, number, number] | null;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterYawRef: React.MutableRefObject<number>;
  characterSpeedRef: React.MutableRefObject<number>;
  waveTimerRef: React.MutableRefObject<number>;
  flightAltitudeOffsetRef: React.MutableRefObject<number>;
  flyTargetRef: React.MutableRefObject<THREE.Vector3 | null>;
  virtualInputRef: React.MutableRefObject<VirtualFlightInput>;
  onSelectCameraMode: (mode: CameraMode) => void;
  onCycleCameraMode: () => void;
  onRoadClick: (point: THREE.Vector3) => void;
  onClearFlyTarget: () => void;
  onManualMove: () => void;
  onDiscoverZone: (zoneId: string) => void;
  onCollectStar: (starId: number) => void;
  onJumpToZone: (zone: LandmarkZone) => void;
  onHover: (label: string | null) => void;
}

export default function MedinaScene({
  cameraMode,
  timeOfDay,
  autoFly,
  collectedStars,
  flyMarker,
  characterPosRef,
  characterYawRef,
  characterSpeedRef,
  waveTimerRef,
  flightAltitudeOffsetRef,
  flyTargetRef,
  virtualInputRef,
  onSelectCameraMode,
  onCycleCameraMode,
  onRoadClick,
  onClearFlyTarget,
  onManualMove,
  onDiscoverZone,
  onCollectStar,
  onJumpToZone,
  onHover,
}: MedinaSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.75, 4.95], fov: 40, near: 0.1, far: 240 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
    >
      <Suspense fallback={null}>
        <SkyAndAtmosphere timeOfDay={timeOfDay} characterPosRef={characterPosRef} />

        <CameraRig
          cameraMode={cameraMode}
          characterPosRef={characterPosRef}
          onCycleCameraMode={onCycleCameraMode}
        />

        <BlueMedinaRoad
          timeOfDay={timeOfDay}
          collectedStars={collectedStars}
          flyMarker={flyMarker}
          onRoadClick={onRoadClick}
          onSelectZone={(zoneId) => {
            const z = LANDMARK_ZONES.find((item) => item.id === zoneId);
            if (z) onJumpToZone(z);
          }}
          onHover={onHover}
        />

        <AmphoraFlowerPots timeOfDay={timeOfDay} onHover={onHover} />

        <FlyingChibiGirl
          autoFly={autoFly}
          cameraMode={cameraMode}
          collectedStars={collectedStars}
          characterPosRef={characterPosRef}
          characterYawRef={characterYawRef}
          characterSpeedRef={characterSpeedRef}
          waveTimerRef={waveTimerRef}
          flightAltitudeOffsetRef={flightAltitudeOffsetRef}
          flyTargetRef={flyTargetRef}
          virtualInputRef={virtualInputRef}
          onClearFlyTarget={onClearFlyTarget}
          onManualMove={onManualMove}
          onDiscoverZone={onDiscoverZone}
          onCollectStar={onCollectStar}
          onSelectCharacter={() => onSelectCameraMode('follow')}
          onHover={onHover}
        />

        <PostProcessing />
      </Suspense>
    </Canvas>
  );
}
