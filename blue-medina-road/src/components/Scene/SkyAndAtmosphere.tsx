import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRoadCenterX, getRoadElevationY } from '../../utils/roadPath';
import type { TimeOfDay } from '../../hooks/useSceneState';

interface SkyAndAtmosphereProps {
  timeOfDay: TimeOfDay;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
}

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform float uSunset;
  uniform float uStarlight;
  uniform float uTime;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec3 dir = normalize(vWorldPos);
    float h = clamp(dir.y, 0.0, 1.0);

    // 1. Chefchaouen Noon (vibrant cobalt-azure matching Reference Image 1)
    vec3 horizonNoon = vec3(0.52, 0.78, 0.97);
    vec3 midNoon     = vec3(0.20, 0.54, 0.91);
    vec3 zenithNoon  = vec3(0.08, 0.38, 0.82);

    // 2. Golden Medina Sunset
    vec3 horizonSunset = vec3(0.98, 0.66, 0.44);
    vec3 midSunset     = vec3(0.42, 0.52, 0.80);
    vec3 zenithSunset  = vec3(0.14, 0.25, 0.56);

    // 3. Enchanted Starlit Fantasy Night
    vec3 horizonNight = vec3(0.12, 0.26, 0.54);
    vec3 midNight     = vec3(0.06, 0.14, 0.36);
    vec3 zenithNight  = vec3(0.02, 0.06, 0.20);

    vec3 horizon = mix(horizonNoon, horizonSunset, uSunset);
    horizon = mix(horizon, horizonNight, uStarlight);

    vec3 mid = mix(midNoon, midSunset, uSunset);
    mid = mix(mid, midNight, uStarlight);

    vec3 zenith = mix(zenithNoon, zenithSunset, uSunset);
    zenith = mix(zenith, zenithNight, uStarlight);

    vec3 col = mix(horizon, mid, smoothstep(0.0, 0.32, h));
    col = mix(col, zenith, smoothstep(0.32, 0.88, h));

    // Twinkling stars in Starlight & Sunset upper sky
    float starVis = clamp(uStarlight + uSunset * 0.25, 0.0, 1.0) * smoothstep(0.18, 0.55, h);
    if (starVis > 0.01) {
      vec2 starUv = floor(dir.xz / (dir.y + 0.15) * 95.0);
      float n = hash(starUv);
      if (n > 0.986) {
        float twinkle = 0.55 + 0.45 * sin(uTime * 3.5 + n * 100.0);
        col += vec3(1.0, 0.96, 0.84) * twinkle * starVis;
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 14.9898 + 67.1) * 43758.5453;
  return x - Math.floor(x);
};

export default function SkyAndAtmosphere({
  timeOfDay,
  characterPosRef,
}: SkyAndAtmosphereProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const petalsRef = useRef<THREE.Points>(null);
  const cloudsRef = useRef<THREE.Group>(null);

  const skyUniforms = useMemo(
    () => ({
      uSunset: { value: 0 },
      uStarlight: { value: 0 },
      uTime: { value: 0 },
    }),
    []
  );

  // 220 Floating Sky Petals & Luminous Mana Motes along the entire 90m road
  const petalCount = 220;
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(petalCount * 3);
    const spd = new Float32Array(petalCount);
    for (let i = 0; i < petalCount; i++) {
      const z = 4.0 - pseudoRandom(i * 3 + 1) * 90.0;
      const cx = getRoadCenterX(z);
      const cy = getRoadElevationY(z);
      pos[i * 3] = cx + (pseudoRandom(i * 3 + 2) - 0.5) * 6.5;
      pos[i * 3 + 1] = cy + 0.35 + pseudoRandom(i * 3 + 3) * 5.2;
      pos[i * 3 + 2] = z;
      spd[i] = 0.25 + pseudoRandom(i * 5) * 0.55;
    }
    return { positions: pos, speeds: spd };
  }, []);

  // Fluffy Sea of Clouds Flanking the High-Altitude Road & Celestial Summit
  const cloudClusters = useMemo(() => {
    const banks = [
      { x: -11, y: 5.5, z: -38, s: 1.5 },
      { x: 12, y: 6.2, z: -44, s: 1.6 },
      { x: -9.5, y: 8.8, z: -58, s: 1.45 },
      { x: 9.2, y: 9.6, z: -64, s: 1.55 },
      { x: -8.8, y: 11.5, z: -72, s: 1.5 },
      { x: 8.5, y: 12.2, z: -76, s: 1.45 },
      { x: -12, y: 13.5, z: -88, s: 1.8 },
      { x: 0, y: 12.8, z: -96, s: 2.1 },
      { x: 12, y: 13.8, z: -90, s: 1.75 },
    ];

    const puffs: { pos: [number, number, number]; r: number }[] = [];
    banks.forEach((b) => {
      puffs.push({ pos: [b.x, b.y, b.z], r: 1.8 * b.s });
      puffs.push({ pos: [b.x - 1.5 * b.s, b.y - 0.3, b.z + 0.5], r: 1.35 * b.s });
      puffs.push({ pos: [b.x + 1.5 * b.s, b.y - 0.25, b.z - 0.4], r: 1.4 * b.s });
      puffs.push({ pos: [b.x + 0.4 * b.s, b.y + 0.65 * b.s, b.z], r: 1.25 * b.s });
    });
    return puffs;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    // Update Sky Shader Uniforms
    if (skyMatRef.current) {
      const targetSunset = timeOfDay === 'sunset' ? 1.0 : 0.0;
      const targetStar = timeOfDay === 'starlight' ? 1.0 : 0.0;
      skyMatRef.current.uniforms.uSunset.value = THREE.MathUtils.lerp(
        skyMatRef.current.uniforms.uSunset.value,
        targetSunset,
        dt * 3.0
      );
      skyMatRef.current.uniforms.uStarlight.value = THREE.MathUtils.lerp(
        skyMatRef.current.uniforms.uStarlight.value,
        targetStar,
        dt * 3.0
      );
      skyMatRef.current.uniforms.uTime.value = t;
    }

    // Move Shadow-Casting Directional Light with the Character along the 90m road
    if (dirLightRef.current) {
      const charPos = characterPosRef.current;
      // Diagonal sunlight angle matching Reference Image 1's crisp diagonal step shadows!
      dirLightRef.current.position.set(
        charPos.x - 5.2,
        charPos.y + 11.5,
        charPos.z + 4.8
      );
      dirLightRef.current.target.position.copy(charPos);
      dirLightRef.current.target.updateMatrixWorld();
    }

    // Animate drifting luminous petals & stardust
    if (petalsRef.current) {
      const attr = petalsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < petalCount; i++) {
        const z = attr.getZ(i);
        const baseRoadY = getRoadElevationY(z);
        let y = attr.getY(i) + speeds[i] * dt * 0.28;
        const x = attr.getX(i) + Math.sin(t * 1.1 + i) * dt * 0.12;
        if (y > baseRoadY + 5.8) {
          y = baseRoadY + 0.3;
        }
        attr.setXY(i, x, y);
      }
      attr.needsUpdate = true;
    }

    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(t * 0.12) * 0.85;
    }
  });

  const isSunset = timeOfDay === 'sunset';
  const isStarlight = timeOfDay === 'starlight';

  return (
    <>
      {/* Main Diagonal Mediterranean Sun / Moonlight (tracks character along the road) */}
      <directionalLight
        ref={dirLightRef}
        position={[-5.2, 12.5, 6.2]}
        color={isStarlight ? '#8ab8ff' : isSunset ? '#ffb066' : '#fffbf0'}
        intensity={isStarlight ? 1.15 : isSunset ? 2.15 : 2.55}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={1}
        shadow-camera-far={34}
        shadow-bias={-0.0005}
      />

      {/* Cobalt Bounce Hemisphere Light (fills shadows with rich Chefchaouen azure!) */}
      <hemisphereLight
        args={[
          isStarlight ? '#3d68b8' : isSunset ? '#ff9868' : '#6cb6f5',
          isStarlight ? '#102248' : isSunset ? '#2c4880' : '#2468d4',
          isStarlight ? 0.65 : isSunset ? 0.72 : 0.92,
        ]}
      />

      {/* Secondary Front-Right Fill Light for Soft Painterly Illumination */}
      <directionalLight
        position={[8, 9, 10]}
        color={isStarlight ? '#5080d8' : isSunset ? '#ffd09e' : '#a8d4ff'}
        intensity={0.58}
      />

      <ambientLight
        color={isStarlight ? '#4468b0' : isSunset ? '#ffc8a0' : '#cce6ff'}
        intensity={isStarlight ? 0.32 : 0.42}
      />

      {/* Custom Sky Dome Encompassing the Entire 90m Long Road */}
      <mesh position={[0, 0, -40]}>
        <sphereGeometry args={[135, 32, 32]} />
        <shaderMaterial
          ref={skyMatRef}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Fluffy Cloud Banks Flanking the High-Altitude Bridge & Summit */}
      <group ref={cloudsRef}>
        {cloudClusters.map((c, idx) => (
          <mesh key={idx} position={c.pos}>
            <sphereGeometry args={[c.r, 16, 16]} />
            <meshStandardMaterial
              color={isStarlight ? '#345594' : isSunset ? '#ffd4b2' : '#ffffff'}
              emissive={isStarlight ? '#1d366b' : isSunset ? '#e07a48' : '#d8ecff'}
              emissiveIntensity={0.25}
              roughness={0.92}
            />
          </mesh>
        ))}
      </group>

      {/* Floating Stardust & Flower Petals Along the Corridor */}
      <points ref={petalsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={isStarlight ? '#ffe898' : isSunset ? '#ffd699' : '#ffffff'}
          size={0.065}
          transparent
          opacity={0.78}
          sizeAttenuation
        />
      </points>
    </>
  );
}
