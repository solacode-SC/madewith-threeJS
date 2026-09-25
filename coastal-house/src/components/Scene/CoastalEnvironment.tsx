import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { createPromenadeTextures } from '../../utils/textures';
import type { TimeOfDay } from '../../hooks/useSceneState';

interface CoastalEnvironmentProps {
  timeOfDay: TimeOfDay;
  walkMarker: [number, number, number] | null;
  onGroundClick: (point: THREE.Vector3) => void;
}

const oceanVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWave;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    
    float w1 = sin(worldPosition.x * 0.65 + uTime * 1.3) * 0.045;
    float w2 = cos(worldPosition.z * 0.85 + uTime * 1.1) * 0.04;
    float w3 = sin((worldPosition.x + worldPosition.z) * 1.4 - uTime * 1.8) * 0.02;
    
    worldPosition.y += w1 + w2 + w3;
    vWave = w1 + w2 + w3;
    vWorldPos = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const oceanFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uGolden;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWave;

  void main() {
    // Distance from promenade seawall
    float distZ = clamp((-vWorldPos.z - 3.5) / 45.0, 0.0, 1.0);

    vec3 shallowSunny = vec3(0.08, 0.62, 0.76);
    vec3 midSunny     = vec3(0.04, 0.46, 0.64);
    vec3 deepSunny    = vec3(0.03, 0.33, 0.50);

    vec3 shallowGolden = vec3(0.14, 0.52, 0.62);
    vec3 midGolden     = vec3(0.09, 0.34, 0.48);
    vec3 deepGolden    = vec3(0.18, 0.24, 0.38);

    vec3 shallow = mix(shallowSunny, shallowGolden, uGolden);
    vec3 mid     = mix(midSunny, midGolden, uGolden);
    vec3 deep    = mix(deepSunny, deepGolden, uGolden);

    vec3 waterCol = mix(shallow, mid, smoothstep(0.0, 0.35, distZ));
    waterCol = mix(waterCol, deep, smoothstep(0.35, 1.0, distZ));

    // Wave crest highlights (horizontal ripple bands like the photo's ocean)
    float band1 = sin(vWorldPos.z * 3.8 + sin(vWorldPos.x * 0.8) + uTime * 1.6);
    float crest = smoothstep(0.65, 0.98, band1) * (1.0 - distZ * 0.65);
    vec3 glintCol = mix(vec3(0.62, 0.89, 0.96), vec3(0.98, 0.76, 0.48), uGolden);
    waterCol = mix(waterCol, glintCol, crest * 0.35);

    // Subtle white coastal foam near the promenade seawall
    float edgeDist = length(max(abs(vWorldPos.xz) - vec2(7.3, 3.85), 0.0));
    float foam = smoothstep(0.55, 0.0, edgeDist) * (0.55 + 0.45 * sin(uTime * 2.5 + vWorldPos.x * 2.0));
    waterCol = mix(waterCol, vec3(0.95, 0.98, 1.0), foam * 0.65);

    gl_FragColor = vec4(waterCol, 1.0);
  }
`;

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform float uGolden;
  varying vec3 vWorldPos;

  void main() {
    vec3 dir = normalize(vWorldPos);
    float h = clamp(dir.y, 0.0, 1.0);

    // Sunny Mediterranean azure gradient matching Picture 1
    vec3 horizonSunny = vec3(0.58, 0.81, 0.92);
    vec3 midSunny     = vec3(0.36, 0.67, 0.86);
    vec3 zenithSunny  = vec3(0.24, 0.56, 0.79);

    // Golden Hour warm coastal sunset gradient
    vec3 horizonGolden = vec3(0.96, 0.72, 0.52);
    vec3 midGolden     = vec3(0.45, 0.62, 0.78);
    vec3 zenithGolden  = vec3(0.19, 0.36, 0.58);

    vec3 horizon = mix(horizonSunny, horizonGolden, uGolden);
    vec3 mid     = mix(midSunny, midGolden, uGolden);
    vec3 zenith  = mix(zenithSunny, zenithGolden, uGolden);

    vec3 col = mix(horizon, mid, smoothstep(0.0, 0.28, h));
    col = mix(col, zenith, smoothstep(0.28, 0.85, h));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function CoastalEnvironment({
  timeOfDay,
  walkMarker,
  onGroundClick,
}: CoastalEnvironmentProps) {
  const markerRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const oceanMatRef = useRef<THREE.ShaderMaterial>(null);
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const promenade = useMemo(() => createPromenadeTextures(), []);

  const oceanUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGolden: { value: 0 },
    }),
    []
  );

  const skyUniforms = useMemo(
    () => ({
      uGolden: { value: 0 },
    }),
    []
  );

  // Horizon Cumulus Cloud Clusters (matching the fluffy low horizon clouds in Picture 1)
  const cloudPuffs = useMemo(() => {
    const clusters = [
      // Left horizon cloud bank
      { cx: -11.5, cy: 1.4, cz: -26, scale: 1.3 },
      { cx: -7.8, cy: 1.1, cz: -27, scale: 1.05 },
      { cx: -4.8, cy: 0.85, cz: -28, scale: 0.85 },
      // Right horizon cloud bank
      { cx: 5.2, cy: 0.9, cz: -28, scale: 0.9 },
      { cx: 8.4, cy: 1.25, cz: -27, scale: 1.15 },
      { cx: 12.2, cy: 1.6, cz: -26, scale: 1.35 },
      // Side distant clouds for 360° orbit
      { cx: -24, cy: 2.0, cz: -8, scale: 1.4 },
      { cx: 24, cy: 1.8, cz: -6, scale: 1.3 },
    ];

    const puffs: { pos: [number, number, number]; r: number }[] = [];
    clusters.forEach((c) => {
      puffs.push({ pos: [c.cx, c.cy, c.cz], r: 1.65 * c.scale });
      puffs.push({ pos: [c.cx - 1.3 * c.scale, c.cy - 0.25, c.cz + 0.3], r: 1.25 * c.scale });
      puffs.push({ pos: [c.cx + 1.35 * c.scale, c.cy - 0.2, c.cz + 0.2], r: 1.3 * c.scale });
      puffs.push({ pos: [c.cx + 0.4 * c.scale, c.cy + 0.55 * c.scale, c.cz - 0.2], r: 1.15 * c.scale });
    });
    return puffs;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const targetGolden = timeOfDay === 'golden' ? 1.0 : 0.0;

    if (oceanMatRef.current) {
      oceanMatRef.current.uniforms.uTime.value = t;
      oceanMatRef.current.uniforms.uGolden.value = THREE.MathUtils.lerp(
        oceanMatRef.current.uniforms.uGolden.value,
        targetGolden,
        Math.min(1, delta * 3)
      );
      if (skyMatRef.current) {
        skyMatRef.current.uniforms.uGolden.value = oceanMatRef.current.uniforms.uGolden.value;
      }
    }

    if (markerRef.current && walkMarker) {
      const pulse = 1 + Math.sin(t * 6) * 0.15;
      markerRef.current.scale.set(pulse, pulse, 1);
    }
    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(t * 0.08) * 0.6;
    }
  });

  const isGolden = timeOfDay === 'golden';

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. SKY DOME & HORIZON CUMULUS CLOUDS                      */}
      {/* ========================================================= */}
      <mesh>
        <sphereGeometry args={[85, 32, 32]} />
        <shaderMaterial
          ref={skyMatRef}
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Low Horizon Fluffy Cream-White Cumulus Clouds (matching Picture 1) */}
      <group ref={cloudsRef}>
        {cloudPuffs.map((puff, idx) => (
          <mesh key={idx} position={puff.pos}>
            <sphereGeometry args={[puff.r, 16, 16]} />
            <meshStandardMaterial
              color={isGolden ? '#ffd8b8' : '#fcf8f0'}
              emissive={isGolden ? '#e88b58' : '#ffffff'}
              emissiveIntensity={isGolden ? 0.28 : 0.18}
              roughness={0.95}
            />
          </mesh>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 2. WHITEWASHED LIMESTONE PROMENADE, CURB & SEAWALL        */}
      {/* ========================================================= */}
      <group>
        {/* Main Elevated Sidewalk Platform Under the House */}
        <RoundedBox
          args={[14.6, 0.48, 5.9]}
          radius={0.06}
          smoothness={3}
          position={[0, -0.24, -0.85]}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onGroundClick(e.point);
          }}
        >
          <meshStandardMaterial
            map={promenade.map}
            bumpMap={promenade.bumpMap}
            bumpScale={0.015}
            roughness={0.88}
          />
        </RoundedBox>

        {/* Foreground Lower Street / Sandy Limestone Pavement (in front of the curb) */}
        <RoundedBox
          args={[14.6, 0.42, 2.7]}
          radius={0.05}
          smoothness={3}
          position={[0, -0.26, 3.35]}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onGroundClick(e.point);
          }}
        >
          <meshStandardMaterial
            color="#f6f2e9"
            map={promenade.map}
            bumpMap={promenade.bumpMap}
            bumpScale={0.02}
            roughness={0.92}
          />
        </RoundedBox>

        {/* Individual Cut Limestone Curb Blocks Along z = 2.02 (exact foreground curb in Picture 1) */}
        {Array.from({ length: 24 }).map((_, idx) => {
          const cx = -6.9 + idx * 0.6;
          return (
            <RoundedBox
              key={idx}
              args={[0.58, 0.09, 0.18]}
              radius={0.018}
              position={[cx, 0.015, 2.02]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#ebe6dc' : '#e2ddd2'}
                roughness={0.88}
              />
            </RoundedBox>
          );
        })}

        {/* Rear Seawall Coping Stones Along Ocean Edge (z = -3.72) */}
        {Array.from({ length: 18 }).map((_, idx) => {
          const sx = -6.8 + idx * 0.8;
          return (
            <RoundedBox
              key={`seawall-${idx}`}
              args={[0.77, 0.14, 0.28]}
              radius={0.02}
              position={[sx, 0.05, -3.72]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#e5dfd3" roughness={0.9} />
            </RoundedBox>
          );
        })}

        {/* Little Tufts of Coastal Grass Sprouting Along Sidewalk Cracks (homage to Picture 2's grass tufts) */}
        {[
          [-3.2, 2.15],
          [-2.6, 2.85],
          [2.4, 2.18],
          [3.5, 2.65],
          [-3.8, -1.8],
          [3.9, -1.5],
        ].map(([gx, gz], idx) => (
          <group key={`grass-${idx}`} position={[gx, 0, gz]}>
            <mesh position={[-0.03, 0.06, 0]} rotation={[0, 0, 0.35]}>
              <coneGeometry args={[0.02, 0.14, 5]} />
              <meshStandardMaterial color="#8cb362" roughness={0.8} />
            </mesh>
            <mesh position={[0.02, 0.07, 0.01]} rotation={[0, 0, -0.25]}>
              <coneGeometry args={[0.022, 0.16, 5]} />
              <meshStandardMaterial color="#9ec472" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Click-to-Walk Destination Ring Marker */}
      {walkMarker && (
        <mesh
          ref={markerRef}
          position={walkMarker}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.14, 0.21, 28]} />
          <meshBasicMaterial color="#0d89b3" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* ========================================================= */}
      {/* 3. MEDITERRANEAN TURQUOISE OCEAN                          */}
      {/* ========================================================= */}
      <mesh position={[0, -0.32, -18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[140, 95, 96, 96]} />
        <shaderMaterial
          ref={oceanMatRef}
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
          uniforms={oceanUniforms}
        />
      </mesh>
    </group>
  );
}
