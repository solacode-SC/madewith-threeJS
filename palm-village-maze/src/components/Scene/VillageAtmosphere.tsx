import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SunMood } from '../../hooks/useMazeState';

interface VillageAtmosphereProps {
  sunMood: SunMood;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export default function VillageAtmosphere({
  sunMood,
  characterPosRef,
}: VillageAtmosphereProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const dustPointsRef = useRef<THREE.Points>(null);

  const moodConfig = {
    'morning-gold': {
      bg: '#87CEEB',
      fogColor: '#B8D4E8',
      ambientColor: '#f7e5cc',
      ambientIntensity: 0.85,
      hemiTop: '#87CEEB',
      hemiBottom: '#C4A87C',
      hemiIntensity: 0.92,
      sunColor: '#fff5df',
      sunIntensity: 2.2,
    },
    'amber-afternoon': {
      bg: '#F4A460',
      fogColor: '#D4A870',
      ambientColor: '#f5d4a6',
      ambientIntensity: 0.72,
      hemiTop: '#E8C48A',
      hemiBottom: '#916742',
      hemiIntensity: 0.85,
      sunColor: '#ffdfa8',
      sunIntensity: 2.45,
    },
    'lantern-dusk': {
      bg: '#C76B3B',
      fogColor: '#A85E38',
      ambientColor: '#d9b084',
      ambientIntensity: 0.52,
      hemiTop: '#E87040',
      hemiBottom: '#573c26',
      hemiIntensity: 0.62,
      sunColor: '#ffc985',
      sunIntensity: 1.35,
    },
  }[sunMood];

  // Floating golden dust motes in the sunlit village air
  const dustGeo = useMemo(() => {
    const count = 280;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 32;
      positions[i * 3 + 1] = 0.4 + pseudoRandom(i * 3 + 2) * 5.5;
      positions[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 32;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const lastLightTargetRef = useRef<{ x: number; z: number }>({ x: -999, z: -999 });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const charPos = characterPosRef.current;

    // Keep shadow-casting directional light tracking the character
    if (dirLightRef.current) {
      const dx = charPos.x - lastLightTargetRef.current.x;
      const dz = charPos.z - lastLightTargetRef.current.z;
      if (dx * dx + dz * dz > 0.0025) {
        lastLightTargetRef.current.x = charPos.x;
        lastLightTargetRef.current.z = charPos.z;
        dirLightRef.current.position.set(charPos.x - 5.0, 8.5, charPos.z + 3.0);
        dirLightRef.current.target.position.set(charPos.x, 0.5, charPos.z);
        dirLightRef.current.target.updateMatrixWorld();
      }
    }

    if (dustPointsRef.current) {
      dustPointsRef.current.position.y = Math.sin(t * 0.35) * 0.12;
      dustPointsRef.current.rotation.y = t * 0.012;
    }
  });

  return (
    <>
      <color attach="background" args={[moodConfig.bg]} />
      <fog attach="fog" args={[moodConfig.fogColor, 12, 35]} />

      <ambientLight color={moodConfig.ambientColor} intensity={moodConfig.ambientIntensity} />
      <hemisphereLight
        args={[moodConfig.hemiTop, moodConfig.hemiBottom, moodConfig.hemiIntensity]}
      />

      <directionalLight
        ref={dirLightRef}
        color={moodConfig.sunColor}
        intensity={moodConfig.sunIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />

      <points ref={dustPointsRef} geometry={dustGeo}>
        <pointsMaterial
          color="#fff1cc"
          size={0.05}
          transparent
          opacity={0.58}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
