import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export default function Particles({ count = 60 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 1.0 + pseudoRandom(i * 4 + 1) * 8.0;
      const angle = pseudoRandom(i * 4 + 2) * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 0.2 + pseudoRandom(i * 4 + 3) * 4.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      ph[i] = pseudoRandom(i * 4 + 4) * Math.PI * 2;
    }

    return { positions: pos, phases: ph };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const phase = phases[i];
      const y = posAttr.getY(i);
      posAttr.setY(i, y + Math.sin(time * 0.6 + phase) * 0.0015);
    }
    posAttr.needsUpdate = true;
    pointsRef.current.rotation.y = time * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#e8f8f5"
        size={0.04}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
