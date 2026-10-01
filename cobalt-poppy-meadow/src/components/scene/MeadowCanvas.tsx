import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import AtmosphericLighting from './AtmosphericLighting';
import DistantRidgeMountains from './DistantRidgeMountains';
import FloatingNatureParticles from './FloatingNatureParticles';
import IndigoCanopyTrees from './IndigoCanopyTrees';
import InstancedWildflowers from './InstancedWildflowers';
import MeadowCameraRig from './MeadowCameraRig';
import MeadowTerrain from './MeadowTerrain';
import PainterlyCloudSky from './PainterlyCloudSky';
import PainterlyPostFX from './PainterlyPostFX';
import { CAMERA_PRESETS, type CameraPreset, type SkyMood } from '../../domain/meadowConfig';

interface MeadowCanvasProps {
  skyMood: SkyMood;
  cameraPreset: CameraPreset;
  windSpeed: number;
  onPresetChange?: (preset: CameraPreset) => void;
}

export default function MeadowCanvas({
  skyMood,
  cameraPreset,
  windSpeed,
  onPresetChange,
}: MeadowCanvasProps) {
  const initialCam = CAMERA_PRESETS[cameraPreset];

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        powerPreference: 'high-performance',
      }}
      camera={{
        position: initialCam.position,
        fov: initialCam.fov,
        near: 0.1,
        far: 450,
      }}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <Suspense fallback={null}>
        {/* 1. Camera & View Navigation */}
        <MeadowCameraRig cameraPreset={cameraPreset} onPresetChange={onPresetChange} />

        {/* 2. Sun, Ambient & Atmosphere Fog */}
        <AtmosphericLighting skyMood={skyMood} />

        {/* 3. Painterly Layered Cloud Dome */}
        <PainterlyCloudSky skyMood={skyMood} />

        {/* 4. Distant Atmospheric Mountain Ridges */}
        <DistantRidgeMountains skyMood={skyMood} />

        {/* 5. Procedural Sculpted Rolling Hills & Earthen Path */}
        <MeadowTerrain skyMood={skyMood} />

        {/* 6. Signature Dark Indigo & Navy Canopy Trees */}
        <IndigoCanopyTrees skyMood={skyMood} />

        {/* 7. Instanced Wildflowers (Cobalt Poppies, Scarlet Poppies, Cornflowers, Chamomile, Grasses) */}
        <InstancedWildflowers skyMood={skyMood} windSpeed={windSpeed} />

        {/* 8. Fluttering Azure Butterflies & Floating Pollen */}
        <FloatingNatureParticles skyMood={skyMood} />

        {/* 9. Bloom & Vignette Postprocessing */}
        <PainterlyPostFX />
      </Suspense>
    </Canvas>
  );
}
