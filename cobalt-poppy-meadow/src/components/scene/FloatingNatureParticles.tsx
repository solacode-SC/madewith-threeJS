import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MOOD_THEMES, type SkyMood } from '../../domain/meadowConfig';
import { getMeadowHeight } from '../../domain/meadowLayout';

interface FloatingNatureParticlesProps {
  skyMood: SkyMood;
}

export default function FloatingNatureParticles({ skyMood }: FloatingNatureParticlesProps) {
  const pollenPointsRef = useRef<THREE.Points>(null);
  const butterfliesRef = useRef<THREE.Group>(null);

  // 1. Drifting Pollen / Petal Dust Particles (1,200 floating motes)
  const POLLEN_COUNT = 1200;
  const { pollenGeo, initialPollenPos } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(POLLEN_COUNT * 3);
    const initial = new Float32Array(POLLEN_COUNT * 3);

    for (let i = 0; i < POLLEN_COUNT; i++) {
      const x = (Math.random() - 0.5) * 45;
      const z = 14 - Math.random() * 55;
      const groundY = getMeadowHeight(x, z);
      const y = groundY + 0.3 + Math.random() * 4.2;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initial[i * 3] = x;
      initial[i * 3 + 1] = y;
      initial[i * 3 + 2] = z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { pollenGeo: geo, initialPollenPos: initial };
  }, []);

  const pollenMat = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#FFF8DB',
      size: 0.07,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // 2. Fluttering Meadow Butterflies (12 animated butterflies)
  const BUTTERFLY_COUNT = 14;
  const butterflyData = useMemo(() => {
    return Array.from({ length: BUTTERFLY_COUNT }, (_, i) => ({
      seed: i * 3.7 + 10,
      radius: 3.5 + Math.random() * 6.0,
      center: [(Math.random() - 0.5) * 24, 10 - Math.random() * 32] as [number, number],
      speed: 0.45 + Math.random() * 0.45,
      wingSpeed: 14 + Math.random() * 6,
      heightOffset: 1.1 + Math.random() * 1.8,
      color: i % 2 === 0 ? '#3B82F6' : '#FFFFFF',
    }));
  }, []);

  const wingGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.14, 0.16);
    geo.translate(0.07, 0, 0); // pivot on body
    return geo;
  }, []);

  const butterflyRefs = useRef<{ leftWing: THREE.Mesh; rightWing: THREE.Mesh; group: THREE.Group }[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // A. Animate Pollen Motes drifting smoothly with wind
    if (pollenPointsRef.current) {
      const posAttr = pollenPointsRef.current.geometry.attributes.position;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < POLLEN_COUNT; i++) {
        const i3 = i * 3;
        const initX = initialPollenPos[i3];
        const initY = initialPollenPos[i3 + 1];
        const initZ = initialPollenPos[i3 + 2];

        // Gentle drift along wind direction + vertical bob
        const driftX = (t * 0.65 + initX) % 45 - 22.5;
        const bobY = Math.sin(t * 1.2 + initX * 0.5) * 0.35;
        const driftZ = Math.cos(t * 0.45 + initZ * 0.3) * 0.5;

        arr[i3] = driftX;
        arr[i3 + 1] = initY + bobY;
        arr[i3 + 2] = initZ + driftZ;
      }
      posAttr.needsUpdate = true;
    }

    // B. Animate Butterflies fluttering in graceful organic curves
    butterflyData.forEach((b, idx) => {
      const item = butterflyRefs.current[idx];
      if (!item) return;

      const angle = t * b.speed + b.seed;
      const x = b.center[0] + Math.sin(angle) * b.radius + Math.sin(angle * 2.3) * 1.2;
      const z = b.center[1] + Math.cos(angle) * (b.radius * 0.7);
      const groundY = getMeadowHeight(x, z);
      const y = groundY + b.heightOffset + Math.sin(t * 3.2 + b.seed) * 0.45;

      item.group.position.set(x, y, z);

      // Face flight direction
      const nextAngle = angle + 0.05;
      const nextX = b.center[0] + Math.sin(nextAngle) * b.radius + Math.sin(nextAngle * 2.3) * 1.2;
      const nextZ = b.center[1] + Math.cos(nextAngle) * (b.radius * 0.7);
      item.group.lookAt(nextX, y, nextZ);

      // Flap wings rapidly
      const flap = Math.sin(t * b.wingSpeed) * 0.95;
      item.leftWing.rotation.y = flap;
      item.rightWing.rotation.y = -flap;
    });
  });

  return (
    <group name="FloatingNatureParticles">
      {/* 1. Pollen Dust */}
      <points ref={pollenPointsRef} geometry={pollenGeo} material={pollenMat} />

      {/* 2. Fluttering Azure & Pearl Butterflies */}
      <group ref={butterfliesRef}>
        {butterflyData.map((b, i) => (
          <group
            key={`butterfly-${i}`}
            ref={(el) => {
              if (el && !butterflyRefs.current[i]) {
                const left = el.children[0] as THREE.Mesh;
                const right = el.children[1] as THREE.Mesh;
                butterflyRefs.current[i] = { group: el, leftWing: left, rightWing: right };
              }
            }}
          >
            {/* Left Wing */}
            <mesh geometry={wingGeo}>
              <meshBasicMaterial color={b.color} side={THREE.DoubleSide} />
            </mesh>
            {/* Right Wing */}
            <mesh geometry={wingGeo} scale={[-1, 1, 1]}>
              <meshBasicMaterial color={b.color} side={THREE.DoubleSide} />
            </mesh>
            {/* Tiny Body */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.12, 4]} />
              <meshBasicMaterial color="#1E293B" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
