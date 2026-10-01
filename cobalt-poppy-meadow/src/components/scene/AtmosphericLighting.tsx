import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MOOD_THEMES, type SkyMood } from '../../domain/meadowConfig';

interface AtmosphericLightingProps {
  skyMood: SkyMood;
}

export default function AtmosphericLighting({ skyMood }: AtmosphericLightingProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambLightRef = useRef<THREE.AmbientLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();

  const theme = MOOD_THEMES[skyMood];

  useEffect(() => {
    // Atmospheric linear fog
    scene.fog = new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar);
    return () => {
      scene.fog = null;
    };
  }, [scene, theme.fogColor, theme.fogNear, theme.fogFar]);

  return (
    <group name="AtmosphericLighting">
      {/* 1. Main Sun Directional Light with Soft Shadows */}
      <directionalLight
        ref={dirLightRef}
        position={theme.sunPosition}
        color={theme.sunColor}
        intensity={theme.sunIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={180}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0004}
      />

      {/* 2. Ambient Fill Light */}
      <ambientLight
        ref={ambLightRef}
        color={theme.ambientColor}
        intensity={theme.ambientIntensity}
      />

      {/* 3. Hemisphere Sky / Ground Bounce */}
      <hemisphereLight
        ref={hemiLightRef}
        color={theme.skyTopColor}
        groundColor="#556B2F"
        intensity={0.65}
      />
    </group>
  );
}
