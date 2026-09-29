import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { BrushMood, CameraMode, VirtualWalkInput } from '../../domain/cityConfig';
import BrushSkyAndClouds from './BrushSkyAndClouds';
import ShanshuiMountains from './ShanshuiMountains';
import VillageBuildings from './VillageBuildings';
import BrushBotanyAndRoads from './BrushBotanyAndRoads';
import GreenMeadowAndAnimals from './GreenMeadowAndAnimals';
import VillageNpcs from './VillageNpcs';
import VillageTraveler from './VillageTraveler';
import CityCameraRig from './CityCameraRig';
import PainterlyPostFX from './PainterlyPostFX';

interface CityCanvasProps {
  cameraMode: CameraMode;
  brushMood: BrushMood;
  autoWalk: boolean;
  collectedCharms: number[];
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
  onRoadClick: (point: THREE.Vector3) => void;
  onClearWalkTarget: () => void;
  onManualMove: () => void;
  onDiscoverDistrict: (districtId: string) => void;
  onCollectCharm: (charmId: number) => void;
  onHover: (label: string | null) => void;
}

export default function CityCanvas({
  cameraMode,
  brushMood,
  autoWalk,
  collectedCharms,
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
  onRoadClick,
  onClearWalkTarget,
  onManualMove,
  onDiscoverDistrict,
  onCollectCharm,
  onHover,
}: CityCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [-0.38, 1.45, 13.6], fov: 52, near: 0.1, far: 440 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.06,
      }}
    >
      <Suspense fallback={null}>
        <BrushSkyAndClouds brushMood={brushMood} characterPosRef={characterPosRef} />
        <ShanshuiMountains brushMood={brushMood} />

        <CityCameraRig
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

        <VillageBuildings onHover={onHover} />

        <BrushBotanyAndRoads
          collectedCharms={collectedCharms}
          walkMarker={walkMarker}
          onRoadClick={onRoadClick}
          onHover={onHover}
        />

        <GreenMeadowAndAnimals
          onRoadClick={onRoadClick}
          onHover={onHover}
        />

        <VillageNpcs
          characterPosRef={characterPosRef}
          waveTimerRef={waveTimerRef}
          onRoadClick={onRoadClick}
          onHover={onHover}
        />

        <VillageTraveler
          cameraMode={cameraMode}
          autoWalk={autoWalk}
          collectedCharms={collectedCharms}
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
          onDiscoverDistrict={onDiscoverDistrict}
          onCollectCharm={onCollectCharm}
          onSelectCharacter={onCycleCameraMode}
          onHover={onHover}
        />

        <PainterlyPostFX />
      </Suspense>
    </Canvas>
  );
}
