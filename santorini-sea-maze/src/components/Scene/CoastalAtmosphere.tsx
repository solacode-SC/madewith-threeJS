import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SunMood } from '../../hooks/useMazeState';

interface CoastalAtmosphereProps {
  sunMood: SunMood;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export default function CoastalAtmosphere({
  sunMood,
  characterPosRef,
}: CoastalAtmosphereProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const breezePointsRef = useRef<THREE.Points>(null);

  const moodConfig = {
    'aegean-noon': {
      bg: '#6BB8F2',
      fogColor: '#9ED2FA',
      ambientColor: '#E8F3FF',
      ambientIntensity: 0.92,
      hemiTop: '#78C4FA',
      hemiBottom: '#B8D4F2',
      hemiIntensity: 0.96,
      sunColor: '#FFFDF8',
      sunIntensity: 2.35,
      sparkleColor: '#D8F8FF',
    },
    'caldera-sunset': {
      bg: '#F29A76',
      fogColor: '#F5BCA0',
      ambientColor: '#FFE8DC',
      ambientIntensity: 0.78,
      hemiTop: '#FCA888',
      hemiBottom: '#9A82A8',
      hemiIntensity: 0.88,
      sunColor: '#FFE2B8',
      sunIntensity: 2.45,
      sparkleColor: '#FFEAB8',
    },
    'starlight-blue': {
      bg: '#1E467A',
      fogColor: '#2A5B96',
      ambientColor: '#98C0F0',
      ambientIntensity: 0.64,
      hemiTop: '#3C78C2',
      hemiBottom: '#1C3558',
      hemiIntensity: 0.74,
      sunColor: '#B8DCFF',
      sunIntensity: 1.45,
      sparkleColor: '#8CF4FF',
    },
  }[sunMood];

  // Floating sparkling Aegean sea-breeze motes
  const breezeGeo = useMemo(() => {
    const count = 320;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 44;
      positions[i * 3 + 1] = 0.4 + pseudoRandom(i * 3 + 2) * 6.0;
      positions[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 44;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const lastLightTargetRef = useRef<{ x: number; z: number }>({ x: -999, z: -999 });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const charPos = characterPosRef.current;

    // Keep shadow-casting directional light tracking Midori with the exact shadow angle from the reference photo
    if (dirLightRef.current) {
      const dx = charPos.x - lastLightTargetRef.current.x;
      const dz = charPos.z - lastLightTargetRef.current.z;
      if (dx * dx + dz * dz > 0.0025) {
        lastLightTargetRef.current.x = charPos.x;
        lastLightTargetRef.current.z = charPos.z;
        dirLightRef.current.position.set(charPos.x - 5.2, 9.4, charPos.z + 3.2);
        dirLightRef.current.target.position.set(charPos.x, 0.5, charPos.z);
        dirLightRef.current.target.updateMatrixWorld();
      }
    }

    if (breezePointsRef.current) {
      breezePointsRef.current.position.y = Math.sin(t * 0.4) * 0.14;
      breezePointsRef.current.rotation.y = t * 0.014;
    }
  });

  return (
    <>
      <color attach="background" args={[moodConfig.bg]} />
      <fog attach="fog" args={[moodConfig.fogColor, 18, 56]} />

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
        shadow-camera-far={26}
        shadow-camera-left={-9.5}
        shadow-camera-right={9.5}
        shadow-camera-top={9.5}
        shadow-camera-bottom={-9.5}
        shadow-bias={-0.0005}
      />

      <points ref={breezePointsRef} geometry={breezeGeo}>
        <pointsMaterial
          color={moodConfig.sparkleColor}
          size={0.055}
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
