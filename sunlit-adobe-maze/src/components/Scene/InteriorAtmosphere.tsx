import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SunMood } from '../../hooks/useMazeState';

interface InteriorAtmosphereProps {
  sunMood: SunMood;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export default function InteriorAtmosphere({
  sunMood,
  characterPosRef,
}: InteriorAtmosphereProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const dustPointsRef = useRef<THREE.Points>(null);

  const moodConfig = {
    'morning-gold': {
      bg: '#bea07c',
      fogColor: '#c7a985',
      ambientColor: '#f7e5cc',
      ambientIntensity: 0.78,
      hemiTop: '#fff3de',
      hemiBottom: '#a68059',
      hemiIntensity: 0.88,
      sunColor: '#fff5df',
      sunIntensity: 1.95,
    },
    'amber-afternoon': {
      bg: '#b08960',
      fogColor: '#ba9268',
      ambientColor: '#f5d4a6',
      ambientIntensity: 0.68,
      hemiTop: '#ffe3b8',
      hemiBottom: '#916742',
      hemiIntensity: 0.82,
      sunColor: '#ffdfa8',
      sunIntensity: 2.15,
    },
    'lantern-dusk': {
      bg: '#6e5038',
      fogColor: '#78583e',
      ambientColor: '#d9b084',
      ambientIntensity: 0.46,
      hemiTop: '#e6be94',
      hemiBottom: '#573c26',
      hemiIntensity: 0.58,
      sunColor: '#ffc985',
      sunIntensity: 1.15,
    },
  }[sunMood];

  // Floating Golden Dust Motes in the Sunlit Corridors
  const dustGeo = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 30;
      positions[i * 3 + 1] = 0.25 + pseudoRandom(i * 3 + 2) * 3.1;
      positions[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 30;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const lastLightTargetRef = useRef<{ x: number; z: number }>({ x: -999, z: -999 });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const charPos = characterPosRef.current;

    // Keep shadow-casting directional light tracking the character's local corridor
    if (dirLightRef.current) {
      const dx = charPos.x - lastLightTargetRef.current.x;
      const dz = charPos.z - lastLightTargetRef.current.z;
      if (dx * dx + dz * dz > 0.0025) {
        lastLightTargetRef.current.x = charPos.x;
        lastLightTargetRef.current.z = charPos.z;
        dirLightRef.current.position.set(charPos.x - 4.2, 6.2, charPos.z + 2.4);
        dirLightRef.current.target.position.set(charPos.x, 0.5, charPos.z);
        dirLightRef.current.target.updateMatrixWorld();
      }
    }

    if (dustPointsRef.current) {
      dustPointsRef.current.position.y = Math.sin(t * 0.45) * 0.08;
      dustPointsRef.current.rotation.y = t * 0.015;
    }
  });

  return (
    <>
      {/* Warm Adobe Interior Background & Watercolor Depth Fog (Zero Sky!) */}
      <color attach="background" args={[moodConfig.bg]} />
      <fog attach="fog" args={[moodConfig.fogColor, 9.5, 28]} />

      {/* Soft Warm Plaster Bounce Ambient & Hemisphere Lighting */}
      <ambientLight color={moodConfig.ambientColor} intensity={moodConfig.ambientIntensity} />
      <hemisphereLight
        args={[moodConfig.hemiTop, moodConfig.hemiBottom, moodConfig.hemiIntensity]}
      />

      {/* Local Corridor Shadow-Casting Sunlight (Simulating Diagonal Window Light) */}
      <directionalLight
        ref={dirLightRef}
        color={moodConfig.sunColor}
        intensity={moodConfig.sunIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={18}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
      />

      {/* Shimmering Golden Dust Motes Floating in the Window Beams */}
      <points ref={dustPointsRef} geometry={dustGeo}>
        <pointsMaterial
          color="#fff1cc"
          size={0.045}
          transparent
          opacity={0.62}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
