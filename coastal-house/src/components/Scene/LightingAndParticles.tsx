import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TimeOfDay } from '../../hooks/useSceneState';

interface LightingAndParticlesProps {
  timeOfDay: TimeOfDay;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 91.1) * 43758.5453;
  return x - Math.floor(x);
};

export default function LightingAndParticles({ timeOfDay }: LightingAndParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const gullsRef = useRef<THREE.Group>(null);
  const isGolden = timeOfDay === 'golden';

  const particleCount = 75;
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 11;
      pos[i * 3 + 1] = 0.25 + pseudoRandom(i * 3 + 2) * 4.8;
      pos[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 8;
      spd[i] = 0.25 + pseudoRandom(i * 5) * 0.5;
    }
    return { positions: pos, speeds: spd };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let y = attr.getY(i) + speeds[i] * delta * 0.18;
        const x = attr.getX(i) + Math.sin(t * 0.8 + i) * delta * 0.08;
        if (y > 5.2) y = 0.25;
        attr.setXY(i, x, y);
      }
      attr.needsUpdate = true;
    }

    // Gentle circling coastal seagulls in the upper sky
    if (gullsRef.current) {
      gullsRef.current.children.forEach((gull, idx) => {
        const angle = t * 0.22 + idx * 2.1;
        const radius = 11 + idx * 2.5;
        gull.position.x = Math.cos(angle) * radius;
        gull.position.z = -12 + Math.sin(angle) * (radius * 0.45);
        gull.position.y = 6.2 + idx * 0.7 + Math.sin(t * 1.5 + idx) * 0.2;
        gull.rotation.y = -angle + Math.PI;
      });
    }
  });

  return (
    <>
      {/* Main Mediterranean Sun Directional Light */}
      <directionalLight
        position={isGolden ? [6.5, 4.2, 5.5] : [4.2, 8.5, 6.2]}
        color={isGolden ? '#ffb36b' : '#fff9eb'}
        intensity={isGolden ? 2.1 : 2.35}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-7.5}
        shadow-camera-right={7.5}
        shadow-camera-top={7.5}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-bias={-0.0006}
      />

      {/* Soft Sky / Limestone Bounce Hemisphere Light */}
      <hemisphereLight
        args={[
          isGolden ? '#ff9e6d' : '#7ec8eb',
          isGolden ? '#594238' : '#f2eadc',
          isGolden ? 0.55 : 0.75,
        ]}
      />

      {/* Subtle Fill Light from Ocean Side so Back of House is Well-Lit */}
      <directionalLight
        position={[-4, 3.5, -6]}
        color={isGolden ? '#6b88b8' : '#7fd4eb'}
        intensity={0.55}
      />

      {/* Ambient Base */}
      <ambientLight color={isGolden ? '#ffd1b3' : '#d8f0f8'} intensity={isGolden ? 0.25 : 0.38} />

      {/* Floating Sunlit Sea-Breeze Motes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={isGolden ? '#ffd280' : '#fffdf5'}
          size={0.045}
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>

      {/* Distant Coastal Seagulls */}
      <group ref={gullsRef}>
        {[0, 1, 2].map((i) => (
          <group key={i}>
            <mesh position={[-0.12, 0, 0]} rotation={[0, 0, 0.25]}>
              <boxGeometry args={[0.26, 0.015, 0.06]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.12, 0, 0]} rotation={[0, 0, -0.25]}>
              <boxGeometry args={[0.26, 0.015, 0.06]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}
