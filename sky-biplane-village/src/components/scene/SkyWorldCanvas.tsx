import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type {
  CameraMode,
  FlightSpeedPreset,
  SkyMood,
  VirtualFlightInput,
} from '../../domain/skyConfig';
import SkyMistAndSunbeams from './SkyMistAndSunbeams';
import MeadowTerrainAndBotany from './MeadowTerrainAndBotany';
import VillageHomesteadsAndFences from './VillageHomesteadsAndFences';
import PastoralVillageLife from './PastoralVillageLife';
import VintageBiplane from './VintageBiplane';
import BiplaneCameraRig from './BiplaneCameraRig';
import PainterlyPostFX from './PainterlyPostFX';

interface SkyWorldCanvasProps {
  cameraMode: CameraMode;
  skyMood: SkyMood;
  speedPreset: FlightSpeedPreset;
  autoCruise: boolean;
  collectedRings: number[];
  flightMarker: [number, number, number] | null;
  planePosRef: React.MutableRefObject<THREE.Vector3>;
  planeYawRef: React.MutableRefObject<number>;
  planePitchRef: React.MutableRefObject<number>;
  planeRollRef: React.MutableRefObject<number>;
  planeSpeedRef: React.MutableRefObject<number>;
  targetPointRef: React.MutableRefObject<THREE.Vector3 | null>;
  barrelRollTimerRef: React.MutableRefObject<number>;
  cameraYawOffsetRef: React.MutableRefObject<number>;
  cameraPitchOffsetRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualFlightInput>;
  onCycleCameraMode: () => void;
  onGroundClick: (point: THREE.Vector3) => void;
  onClearFlightTarget: () => void;
  onDiscoverLandmark: (landmarkId: string) => void;
  onCollectRing: (ringId: number) => void;
  onHover: (label: string | null) => void;
}

export default function SkyWorldCanvas({
  cameraMode,
  skyMood,
  speedPreset,
  autoCruise,
  collectedRings,
  flightMarker,
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
  onCycleCameraMode,
  onGroundClick,
  onClearFlightTarget,
  onDiscoverLandmark,
  onCollectRing,
  onHover,
}: SkyWorldCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [12.5, 31.5, 28.5], fov: 52, near: 0.1, far: 920 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <Suspense fallback={null}>
        <SkyMistAndSunbeams skyMood={skyMood} planePosRef={planePosRef} />

        <BiplaneCameraRig
          cameraMode={cameraMode}
          planePosRef={planePosRef}
          planeYawRef={planeYawRef}
          planePitchRef={planePitchRef}
          planeRollRef={planeRollRef}
          planeSpeedRef={planeSpeedRef}
          cameraYawOffsetRef={cameraYawOffsetRef}
          cameraPitchOffsetRef={cameraPitchOffsetRef}
          onCycleCameraMode={onCycleCameraMode}
        />

        <MeadowTerrainAndBotany
          skyMood={skyMood}
          flightMarker={flightMarker}
          onGroundClick={onGroundClick}
          onHover={onHover}
        />

        <VillageHomesteadsAndFences
          skyMood={skyMood}
          onGroundClick={onGroundClick}
          onHover={onHover}
        />

        <PastoralVillageLife
          skyMood={skyMood}
          collectedRings={collectedRings}
          planePosRef={planePosRef}
          onGroundClick={onGroundClick}
          onHover={onHover}
        />

        <VintageBiplane
          cameraMode={cameraMode}
          skyMood={skyMood}
          speedPreset={speedPreset}
          autoCruise={autoCruise}
          collectedRings={collectedRings}
          planePosRef={planePosRef}
          planeYawRef={planeYawRef}
          planePitchRef={planePitchRef}
          planeRollRef={planeRollRef}
          planeSpeedRef={planeSpeedRef}
          targetPointRef={targetPointRef}
          barrelRollTimerRef={barrelRollTimerRef}
          virtualInputRef={virtualInputRef}
          onClearFlightTarget={onClearFlightTarget}
          onDiscoverLandmark={onDiscoverLandmark}
          onCollectRing={onCollectRing}
          onHover={onHover}
        />

        <PainterlyPostFX />
      </Suspense>
    </Canvas>
  );
}
