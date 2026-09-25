import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  createCobaltStepTextures,
  createMedinaWallTextures,
  createZellijTileTexture,
} from '../../utils/textures';
import {
  INITIAL_SKY_STARS,
  getRoadCenterX,
  getRoadElevationY,
  getRoadHalfWidth,
  getRoadYaw,
} from '../../utils/roadPath';
import type { TimeOfDay } from '../../hooks/useSceneState';

interface BlueMedinaRoadProps {
  timeOfDay: TimeOfDay;
  collectedStars: number[];
  flyMarker: [number, number, number] | null;
  onRoadClick: (point: THREE.Vector3) => void;
  onSelectZone: (zoneId: string) => void;
  onHover: (label: string | null) => void;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 17.31 + 53.7) * 43758.5453;
  return x - Math.floor(x);
};

export default function BlueMedinaRoad({
  timeOfDay,
  collectedStars,
  flyMarker,
  onRoadClick,
  onSelectZone,
  onHover,
}: BlueMedinaRoadProps) {
  const stepTex = useMemo(() => createCobaltStepTextures(), []);
  const wallBlueLowerTex = useMemo(() => createMedinaWallTextures('blue-lower'), []);
  const wallWhiteTex = useMemo(() => createMedinaWallTextures('white-plaster'), []);
  const wallDeepBlueTex = useMemo(() => createMedinaWallTextures('deep-cobalt'), []);
  const zellijTex = useMemo(() => createZellijTileTexture(), []);

  const fountainOrbRef = useRef<THREE.Group>(null);
  const summitCrystalRef = useRef<THREE.Group>(null);
  const skyStarsGroupRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);

  // 4-pointed star geometry for collectible Sky Stars (✧)
  const starGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = 0.22;
    const inner = 0.055;
    shape.moveTo(0, outer);
    shape.quadraticCurveTo(inner, inner, outer, 0);
    shape.quadraticCurveTo(inner, -inner, 0, -outer);
    shape.quadraticCurveTo(-inner, -inner, -outer, 0);
    shape.quadraticCurveTo(-inner, inner, 0, outer);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
    geo.center();
    return geo;
  }, []);

  // Precompute 136 Cobalt Steps from z = 3.5 to z = -85.5
  const stepsData = useMemo(() => {
    const list: {
      z: number;
      x: number;
      y: number;
      width: number;
      yaw: number;
      hasWhiteDrip: boolean;
      dripOffset: number;
      shadeColor: string;
    }[] = [];

    const count = 136;
    const zStart = 3.4;
    const zEnd = -85.0;
    const dz = (zStart - zEnd) / count; // ~0.65m per step

    for (let i = 0; i <= count; i++) {
      const z = zStart - i * dz;
      const x = getRoadCenterX(z);
      const y = getRoadElevationY(z);
      const width = getRoadHalfWidth(z) * 2.04;
      const yaw = getRoadYaw(z) - Math.PI; // 0 when straight along -Z
      const hasWhiteDrip = i < 22 || i % 5 === 0;
      const dripOffset = (pseudoRandom(i * 7 + 1) - 0.5) * 0.45;
      const shades = ['#2776e6', '#1e64d0', '#3585f2', '#1958be'];
      const shadeColor = shades[i % shades.length];

      list.push({ z, x, y, width, yaw, hasWhiteDrip, dripOffset, shadeColor });
    }
    return list;
  }, []);

  // Precompute Modular Flanking Medina Buildings along Left & Right sides of the Road
  const buildingSegments = useMemo(() => {
    const segments: {
      id: string;
      z: number;
      side: 'left' | 'right';
      x: number;
      y: number;
      yaw: number;
      height: number;
      length: number;
      depth: number;
      variant: 'blue-lower' | 'white-plaster' | 'deep-cobalt';
      hasBalcony: boolean;
      hasDoor: boolean;
      hasLantern: boolean;
      hasRoofTiles: boolean;
    }[] = [];

    // Generate buildings from z = 2.5 down to z = -54 (before the open Cloud Bridge & Summit)
    for (let i = 0; i < 16; i++) {
      const z = 2.2 - i * 3.6;
      const isCourtyard = Math.abs(z - -46.0) < 6.5;
      const cx = getRoadCenterX(z);
      const cy = getRoadElevationY(z);
      const halfW = getRoadHalfWidth(z);
      const yaw = getRoadYaw(z) - Math.PI;

      (['left', 'right'] as const).forEach((side, sIdx) => {
        const seed = i * 13 + sIdx * 7;
        const depth = 2.4;
        const length = 3.75;
        const height = isCourtyard
          ? 5.2 + pseudoRandom(seed) * 1.4
          : 7.4 + pseudoRandom(seed + 1) * 2.4;

        const offset = halfW + depth * 0.46;
        const x = cx + (side === 'left' ? -offset : offset);

        const variant: 'blue-lower' | 'white-plaster' | 'deep-cobalt' =
          i < 4
            ? 'blue-lower'
            : (i + sIdx) % 3 === 0
              ? 'white-plaster'
              : (i + sIdx) % 2 === 0
                ? 'blue-lower'
                : 'deep-cobalt';

        segments.push({
          id: `bldg-${i}-${side}`,
          z,
          side,
          x,
          y: cy,
          yaw,
          height,
          length,
          depth,
          variant,
          hasBalcony: i < 4 || (i + sIdx) % 2 === 0,
          hasDoor: i > 1 && (i + sIdx) % 3 === 0,
          hasLantern: (i + sIdx) % 2 === 0,
          hasRoofTiles: i % 2 === 0,
        });
      });
    }

    return segments;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (fountainOrbRef.current) {
      fountainOrbRef.current.position.y = 1.35 + Math.sin(t * 2.4) * 0.14;
      fountainOrbRef.current.rotation.y = t * 1.1;
    }

    if (summitCrystalRef.current) {
      summitCrystalRef.current.position.y = 2.1 + Math.sin(t * 2.0) * 0.18;
      summitCrystalRef.current.rotation.y = t * 0.85;
      summitCrystalRef.current.rotation.z = Math.sin(t * 1.4) * 0.15;
    }

    if (skyStarsGroupRef.current) {
      skyStarsGroupRef.current.children.forEach((starMesh, idx) => {
        starMesh.rotation.y = t * 1.8 + idx * 0.7;
        starMesh.position.y =
          INITIAL_SKY_STARS[idx].position[1] + Math.sin(t * 2.6 + idx) * 0.12;
      });
    }

    if (markerRef.current && flyMarker) {
      const s = 1.0 + Math.sin(t * 5.5) * 0.14;
      markerRef.current.scale.set(s, 1, s);
      markerRef.current.rotation.y = t * 1.8;
    }
  });

  const isNightOrSunset = timeOfDay !== 'noon';
  const lanternGlowColor = timeOfDay === 'starlight' ? '#ffcf70' : '#ffdf9e';
  const lanternEmissiveIntensity =
    timeOfDay === 'starlight' ? 2.4 : timeOfDay === 'sunset' ? 1.4 : 0.35;

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. CONTINUOUS PAINTED COBALT STAIRWAY & WHITE DRIPS       */}
      {/* ========================================================= */}
      <group>
        {stepsData.map((step, idx) => (
          <group
            key={`step-${idx}`}
            position={[step.x, step.y, step.z]}
            rotation={[0, step.yaw, 0]}
          >
            {/* Main Cobalt Painted Stone Step Block */}
            <RoundedBox
              args={[step.width, 0.28, 0.72]}
              radius={0.03}
              smoothness={2}
              position={[0, -0.14, 0]}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                onRoadClick(e.point);
              }}
            >
              <meshStandardMaterial
                color={step.shadeColor}
                map={stepTex.map}
                bumpMap={stepTex.bumpMap}
                bumpScale={0.022}
                roughness={0.76}
              />
            </RoundedBox>

            {/* Impasto Whitewash Paint Splash & Riser Drip (exact center detail from Image 1!) */}
            {step.hasWhiteDrip && (
              <group position={[step.dripOffset, 0.004, 0.22]}>
                {/* Top tread white paint splash */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[0.46, 0.26]} />
                  <meshStandardMaterial
                    color="#f4f8ff"
                    roughness={0.7}
                    transparent
                    opacity={0.9}
                  />
                </mesh>
                {/* Vertical riser paint drip */}
                <mesh position={[0, -0.11, 0.142]} receiveShadow>
                  <boxGeometry args={[0.08, 0.21, 0.012]} />
                  <meshStandardMaterial color="#f6f9ff" roughness={0.68} />
                </mesh>
                <mesh position={[0.12, -0.08, 0.142]} receiveShadow>
                  <boxGeometry args={[0.045, 0.15, 0.012]} />
                  <meshStandardMaterial color="#f6f9ff" roughness={0.68} />
                </mesh>
              </group>
            )}

            {/* Low Cobalt Curb Wall Along the Cloud Bridge Section (z in [-55, -75]) */}
            {step.z < -54.0 && step.z > -75.0 && idx % 2 === 0 && (
              <>
                <RoundedBox
                  args={[0.28, 0.95, 1.38]}
                  radius={0.03}
                  position={[-step.width * 0.5 + 0.14, 0.35, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    map={wallDeepBlueTex.map}
                    bumpMap={wallDeepBlueTex.bumpMap}
                    bumpScale={0.015}
                    roughness={0.8}
                  />
                </RoundedBox>
                <RoundedBox
                  args={[0.28, 0.95, 1.38]}
                  radius={0.03}
                  position={[step.width * 0.5 - 0.14, 0.35, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    map={wallDeepBlueTex.map}
                    bumpMap={wallDeepBlueTex.bumpMap}
                    bumpScale={0.015}
                    roughness={0.8}
                  />
                </RoundedBox>
              </>
            )}
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 2. ICONIC VISTA TOWER AT BEND (Exact Match to Image 1!)   */}
      {/* ========================================================= */}
      {(() => {
        const towerZ = -13.4;
        const towerY = getRoadElevationY(towerZ);
        return (
          <group
            position={[1.35, towerY, towerZ]}
            rotation={[0, 0.12, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover("The Painter's Tower — Iconic White Medina House & Chimney");
            }}
            onPointerOut={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone('painters-steps');
            }}
          >
            {/* Main Whitewashed & Blue Base Tower Body */}
            <RoundedBox
              args={[3.2, 8.6, 3.2]}
              radius={0.05}
              position={[0, 4.1, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                map={wallWhiteTex.map}
                bumpMap={wallWhiteTex.bumpMap}
                bumpScale={0.02}
                roughness={0.85}
              />
            </RoundedBox>

            {/* Cobalt Blue Lower Dado Wash */}
            <RoundedBox
              args={[3.24, 2.2, 3.24]}
              radius={0.04}
              position={[0, 1.0, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                map={wallDeepBlueTex.map}
                bumpMap={wallDeepBlueTex.bumpMap}
                bumpScale={0.02}
                roughness={0.82}
              />
            </RoundedBox>

            {/* Tall Dark-Navy Doorway with Sculpted Blue Lintel Hood (facing down the stairs!) */}
            <group position={[-0.35, 1.25, 1.61]}>
              <mesh castShadow>
                <boxGeometry args={[0.72, 2.15, 0.08]} />
                <meshStandardMaterial color="#12284c" roughness={0.65} />
              </mesh>
              {/* Blue Painted Overhang Hood above Door */}
              <mesh position={[0, 1.18, 0.12]} castShadow>
                <boxGeometry args={[0.96, 0.16, 0.28]} />
                <meshStandardMaterial color="#3c88ee" roughness={0.75} />
              </mesh>
            </group>

            {/* Upper Recessed Dark-Blue Windows & Juliet Balcony (as in Image 1) */}
            <group position={[-0.35, 3.85, 1.61]}>
              <mesh>
                <boxGeometry args={[0.58, 1.05, 0.08]} />
                <meshStandardMaterial color="#162d54" roughness={0.6} />
              </mesh>
            </group>
            <group position={[-0.35, 5.75, 1.61]}>
              <mesh>
                <boxGeometry args={[0.56, 1.05, 0.08]} />
                <meshStandardMaterial color="#162d54" roughness={0.6} />
              </mesh>
              {/* Wrought-Iron Juliet Balcony Railing */}
              <mesh position={[0, -0.32, 0.12]}>
                <boxGeometry args={[0.88, 0.42, 0.18]} />
                <meshStandardMaterial color="#2a3546" wireframe />
              </mesh>
            </group>

            {/* Iconic Tall White Square Medina Chimney with Peaked Cap (Top Center of Image 1!) */}
            <group position={[-0.65, 8.8, 1.15]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.48, 1.65, 0.48]} />
                <meshStandardMaterial color="#f9fbff" roughness={0.85} />
              </mesh>
              {/* Stepped Collar & Pyramidal Chimney Cap */}
              <mesh position={[0, 0.86, 0]} castShadow>
                <boxGeometry args={[0.58, 0.1, 0.58]} />
                <meshStandardMaterial color="#dce8fa" roughness={0.8} />
              </mesh>
              <mesh position={[0, 1.08, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[0.38, 0.36, 4]} />
                <meshStandardMaterial color="#eef5ff" roughness={0.8} />
              </mesh>
            </group>

            {/* Adjacent Secondary White Stepped Building Wing with Terracotta Roof */}
            <group position={[-1.95, 3.6, -1.2]}>
              <RoundedBox
                args={[2.4, 7.2, 2.6]}
                radius={0.04}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  map={wallWhiteTex.map}
                  bumpMap={wallWhiteTex.bumpMap}
                  bumpScale={0.018}
                  roughness={0.86}
                />
              </RoundedBox>
              {/* Terracotta Tile Roof Crown */}
              <mesh position={[0, 3.72, 0]} rotation={[0.15, 0, 0]} castShadow>
                <boxGeometry args={[2.52, 0.22, 2.75]} />
                <meshStandardMaterial color="#c8643b" roughness={0.78} />
              </mesh>
            </group>
          </group>
        );
      })()}

      {/* ========================================================= */}
      {/* 3. FLANKING MEDINA BUILDINGS, WINDOWS, BALCONIES & VINES  */}
      {/* ========================================================= */}
      <group>
        {buildingSegments.map((b) => {
          const wallTex =
            b.variant === 'white-plaster'
              ? wallWhiteTex
              : b.variant === 'deep-cobalt'
                ? wallDeepBlueTex
                : wallBlueLowerTex;

          const inwardSign = b.side === 'left' ? 1 : -1;
          const faceX = inwardSign * (b.depth * 0.5 + 0.02);

          return (
            <group
              key={b.id}
              position={[b.x, b.y, b.z]}
              rotation={[0, b.yaw, 0]}
            >
              {/* Main Plaster Facade Mass */}
              <RoundedBox
                args={[b.depth, b.height, b.length]}
                radius={0.04}
                position={[0, b.height * 0.5 - 0.2, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  map={wallTex.map}
                  bumpMap={wallTex.bumpMap}
                  bumpScale={0.022}
                  roughness={0.84}
                />
              </RoundedBox>

              {/* Terracotta Eave Trim Along Top Edge (like upper left of Image 1) */}
              {b.hasRoofTiles && (
                <mesh
                  position={[faceX * 0.85, b.height - 0.15, 0]}
                  rotation={[0, 0, inwardSign * -0.28]}
                  castShadow
                >
                  <boxGeometry args={[0.45, 0.16, b.length + 0.06]} />
                  <meshStandardMaterial color="#c45e36" roughness={0.78} />
                </mesh>
              )}

              {/* Recessed Dark-Blue Windows with Wrought-Iron Grille Bars */}
              {[-0.95, 0.95].map((wz, wIdx) => (
                <group
                  key={`win-${wIdx}`}
                  position={[faceX, 2.15 + (wIdx % 2) * 0.35, wz]}
                >
                  {/* Outer Blue Frame */}
                  <mesh castShadow>
                    <boxGeometry args={[0.08, 1.32, 0.78]} />
                    <meshStandardMaterial color="#1850b0" roughness={0.72} />
                  </mesh>
                  {/* Deep Navy-Charcoal Window Pane */}
                  <mesh position={[inwardSign * 0.02, 0, 0]}>
                    <boxGeometry args={[0.06, 1.14, 0.62]} />
                    <meshStandardMaterial
                      color={isNightOrSunset ? '#ffd88a' : '#122648'}
                      emissive={isNightOrSunset ? '#ffae42' : '#000000'}
                      emissiveIntensity={
                        timeOfDay === 'starlight'
                          ? 0.85
                          : timeOfDay === 'sunset'
                            ? 0.35
                            : 0
                      }
                      roughness={0.5}
                    />
                  </mesh>
                  {/* Wrought-Iron Vertical & Horizontal Grille Bars */}
                  {[-0.16, 0, 0.16].map((barZ, bIdx) => (
                    <mesh key={bIdx} position={[inwardSign * 0.055, 0, barZ]}>
                      <cylinderGeometry args={[0.01, 0.01, 1.14, 6]} />
                      <meshStandardMaterial color="#1a2230" roughness={0.6} />
                    </mesh>
                  ))}
                </group>
              ))}

              {/* Upper-Story Wrought-Iron Balcony & Cedar Planter Box with Trailing Vines (Image 1!) */}
              {b.hasBalcony && (
                <group position={[faceX + inwardSign * 0.24, 4.35, 0.15]}>
                  {/* Wrought-Iron Balcony Cage Frame */}
                  <mesh position={[0, 0.32, 0]}>
                    <boxGeometry args={[0.48, 0.92, 1.42]} />
                    <meshStandardMaterial color="#232832" wireframe />
                  </mesh>
                  {/* Warm Terracotta-Cedar Wooden Planter Box */}
                  <RoundedBox
                    args={[0.44, 0.44, 1.36]}
                    radius={0.02}
                    position={[0, 0.02, 0]}
                    castShadow
                  >
                    <meshStandardMaterial color="#c8733b" roughness={0.78} />
                  </RoundedBox>
                  {/* Dark Wooden Support Brackets Under Planter */}
                  {[-0.48, 0.48].map((kz, kIdx) => (
                    <mesh
                      key={kIdx}
                      position={[-inwardSign * 0.08, -0.28, kz]}
                      rotation={[0, 0, inwardSign * 0.45]}
                    >
                      <boxGeometry args={[0.08, 0.36, 0.08]} />
                      <meshStandardMaterial color="#3b2618" roughness={0.8} />
                    </mesh>
                  ))}
                  {/* Cascading Green Vines & Blossoms Trailing Over the Balcony Box */}
                  {Array.from({ length: 12 }).map((_, vIdx) => {
                    const vz = -0.58 + vIdx * 0.105;
                    const dropY = 0.25 - (vIdx % 3) * 0.22;
                    return (
                      <group
                        key={vIdx}
                        position={[inwardSign * 0.18, dropY, vz]}
                      >
                        <mesh castShadow>
                          <dodecahedronGeometry args={[0.14, 0]} />
                          <meshStandardMaterial
                            color={vIdx % 2 === 0 ? '#3b6e32' : '#528a42'}
                            roughness={0.75}
                          />
                        </mesh>
                        {vIdx % 3 === 0 && (
                          <mesh position={[inwardSign * 0.08, -0.22, 0]} castShadow>
                            <dodecahedronGeometry args={[0.1, 0]} />
                            <meshStandardMaterial color="#649c4e" roughness={0.75} />
                          </mesh>
                        )}
                      </group>
                    );
                  })}
                </group>
              )}

              {/* Vintage Wrought-Iron Wall Lantern (glows warmly in Sunset & Starlight modes!) */}
              {b.hasLantern && (
                <group position={[faceX + inwardSign * 0.22, 3.05, -0.85]}>
                  {/* Scrollwork Iron Wall Bracket */}
                  <mesh position={[-inwardSign * 0.11, 0.12, 0]}>
                    <boxGeometry args={[0.24, 0.03, 0.03]} />
                    <meshStandardMaterial color="#1f242d" roughness={0.6} />
                  </mesh>
                  {/* Hexagonal Lantern Cap & Glass Cage */}
                  <mesh position={[0, 0.06, 0]} castShadow>
                    <coneGeometry args={[0.12, 0.1, 6]} />
                    <meshStandardMaterial color="#1f242d" roughness={0.6} />
                  </mesh>
                  <mesh position={[0, -0.04, 0]}>
                    <cylinderGeometry args={[0.085, 0.065, 0.16, 6]} />
                    <meshStandardMaterial
                      color={lanternGlowColor}
                      emissive="#ffae38"
                      emissiveIntensity={lanternEmissiveIntensity}
                      roughness={0.3}
                    />
                  </mesh>
                </group>
              )}

              {/* Arched Cobalt-Blue Wooden Medina Door */}
              {b.hasDoor && (
                <group position={[faceX, 0.95, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.09, 1.85, 0.92]} />
                    <meshStandardMaterial color="#1656c2" roughness={0.7} />
                  </mesh>
                  <mesh
                    position={[0, 0.92, 0]}
                    rotation={[0, 0, Math.PI / 2]}
                    castShadow
                  >
                    <cylinderGeometry args={[0.46, 0.46, 0.09, 16]} />
                    <meshStandardMaterial color="#1656c2" roughness={0.7} />
                  </mesh>
                </group>
              )}
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 4. ZONE 2: WHISPERING KEYHOLE ARCHES & HANGING LANTERNS   */}
      {/* ========================================================= */}
      <group>
        {[-17.5, -25.0, -32.5].map((archZ, aIdx) => {
          const cx = getRoadCenterX(archZ);
          const cy = getRoadElevationY(archZ);
          const halfW = getRoadHalfWidth(archZ);
          const yaw = getRoadYaw(archZ) - Math.PI;
          const span = halfW * 2.05;

          return (
            <group
              key={`arch-${aIdx}`}
              position={[cx, cy, archZ]}
              rotation={[0, yaw, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHover('Whispering Moroccan Keyhole Arch & Starlight Lantern');
              }}
              onPointerOut={() => onHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectZone('whispering-arch');
              }}
            >
              {/* Left & Right Cobalt Arch Pillars */}
              <RoundedBox
                args={[0.62, 4.6, 0.72]}
                radius={0.04}
                position={[-span * 0.5 + 0.2, 2.2, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  map={wallDeepBlueTex.map}
                  bumpMap={wallDeepBlueTex.bumpMap}
                  bumpScale={0.02}
                  roughness={0.8}
                />
              </RoundedBox>
              <RoundedBox
                args={[0.62, 4.6, 0.72]}
                radius={0.04}
                position={[span * 0.5 - 0.2, 2.2, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  map={wallDeepBlueTex.map}
                  bumpMap={wallDeepBlueTex.bumpMap}
                  bumpScale={0.02}
                  roughness={0.8}
                />
              </RoundedBox>

              {/* Upper Arch Spandrel Beam with Moroccan Zellij Mosaic Band */}
              <RoundedBox
                args={[span + 0.4, 1.35, 0.76]}
                radius={0.04}
                position={[0, 4.85, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  map={wallWhiteTex.map}
                  bumpMap={wallWhiteTex.bumpMap}
                  bumpScale={0.02}
                  roughness={0.82}
                />
              </RoundedBox>
              <mesh position={[0, 4.95, 0.39]}>
                <planeGeometry args={[span - 0.3, 0.52]} />
                <meshStandardMaterial map={zellijTex} roughness={0.65} />
              </mesh>
              <mesh position={[0, 4.95, -0.39]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[span - 0.3, 0.52]} />
                <meshStandardMaterial map={zellijTex} roughness={0.65} />
              </mesh>

              {/* Sculpted Horseshoe Arch Ring */}
              <mesh position={[0, 3.65, 0]}>
                <torusGeometry args={[span * 0.38, 0.24, 12, 28, Math.PI * 1.15]} />
                <meshStandardMaterial color="#1d64d6" roughness={0.75} />
              </mesh>

              {/* Suspended Glowing Moroccan Star Lantern Hanging From Arch Crown */}
              <group position={[0, 3.55, 0]}>
                <mesh position={[0, 0.35, 0]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
                  <meshStandardMaterial color="#1f242d" />
                </mesh>
                <mesh castShadow>
                  <octahedronGeometry args={[0.22, 0]} />
                  <meshStandardMaterial
                    color={lanternGlowColor}
                    emissive="#ffae38"
                    emissiveIntensity={lanternEmissiveIntensity}
                    roughness={0.25}
                  />
                </mesh>
                {isNightOrSunset && (
                  <pointLight
                    position={[0, -0.1, 0]}
                    color="#ffb84d"
                    intensity={1.6}
                    distance={7.5}
                  />
                )}
              </group>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 5. ZONE 3: COURTYARD OF THE LEVITATING SKY FOUNTAIN       */}
      {/* ========================================================= */}
      {(() => {
        const fz = -46.0;
        const fx = getRoadCenterX(fz);
        const fy = getRoadElevationY(fz);
        return (
          <group
            position={[fx, fy, fz]}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover('Courtyard of the Sky Fountain — Click to Inspect Landmark');
            }}
            onPointerOut={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone('sky-fountain');
            }}
          >
            {/* Octagonal Moroccan Zellij Mosaic Fountain Basin */}
            <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.35, 1.48, 0.56, 8]} />
              <meshStandardMaterial map={zellijTex} roughness={0.6} />
            </mesh>
            {/* Inner Glowing Turquoise Water Pool */}
            <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.18, 24]} />
              <meshStandardMaterial
                color="#26c6ec"
                emissive="#1496c4"
                emissiveIntensity={0.45}
                roughness={0.18}
                metalness={0.15}
              />
            </mesh>
            {/* Sculpted White Marble Pedestal */}
            <mesh position={[0, 0.75, 0]} castShadow>
              <cylinderGeometry args={[0.26, 0.38, 0.72, 16]} />
              <meshStandardMaterial color="#f5f9ff" roughness={0.5} />
            </mesh>

            {/* Levitating Enchanted Water Orb & Spiraling Rings */}
            <group ref={fountainOrbRef} position={[0, 1.35, 0]}>
              <mesh>
                <icosahedronGeometry args={[0.28, 2]} />
                <meshStandardMaterial
                  color="#6ce4ff"
                  emissive="#28b8f5"
                  emissiveIntensity={0.85}
                  roughness={0.15}
                />
              </mesh>
              <mesh rotation={[Math.PI / 3, 0.4, 0]}>
                <torusGeometry args={[0.48, 0.022, 10, 32]} />
                <meshBasicMaterial color="#b8f2ff" transparent opacity={0.8} />
              </mesh>
              <mesh rotation={[-Math.PI / 3, -0.4, 0]}>
                <torusGeometry args={[0.62, 0.016, 10, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
              </mesh>
            </group>

            <pointLight
              position={[0, 1.5, 0]}
              color="#4cd4ff"
              intensity={1.5}
              distance={8.0}
            />
          </group>
        );
      })()}

      {/* ========================================================= */}
      {/* 6. ZONE 5: CELESTIAL BELVEDERE SUMMIT PAVILION (z=-81.5)  */}
      {/* ========================================================= */}
      {(() => {
        const sz = -81.5;
        const sx = getRoadCenterX(sz);
        const sy = getRoadElevationY(sz);
        return (
          <group
            position={[sx, sy, sz]}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover('Celestial Belvedere — Summit Sanctuary at the End of the Blue Road');
            }}
            onPointerOut={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone('celestial-summit');
            }}
          >
            {/* Circular Mosaic Summit Plaza Terrace */}
            <mesh position={[0, -0.1, 0]} receiveShadow>
              <cylinderGeometry args={[4.4, 4.8, 0.36, 32]} />
              <meshStandardMaterial map={zellijTex} roughness={0.68} />
            </mesh>
            <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[3.85, 4.35, 32]} />
              <meshStandardMaterial color="#1a5fc8" roughness={0.7} />
            </mesh>

            {/* 4 Sculpted Whitewashed Pavilion Pillars */}
            {[
              [-1.85, -1.85],
              [1.85, -1.85],
              [-1.85, 1.85],
              [1.85, 1.85],
            ].map(([px, pz], pIdx) => (
              <group key={pIdx} position={[px, 0, pz]}>
                <RoundedBox
                  args={[0.48, 3.8, 0.48]}
                  radius={0.04}
                  position={[0, 1.9, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    map={wallBlueLowerTex.map}
                    bumpMap={wallBlueLowerTex.bumpMap}
                    bumpScale={0.02}
                    roughness={0.8}
                  />
                </RoundedBox>
              </group>
            ))}

            {/* Pavilion Crown Cornice & Moroccan White-and-Azure Dome (Qubba) */}
            <RoundedBox
              args={[4.4, 0.45, 4.4]}
              radius={0.05}
              position={[0, 3.95, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                map={wallWhiteTex.map}
                bumpMap={wallWhiteTex.bumpMap}
                bumpScale={0.018}
                roughness={0.82}
              />
            </RoundedBox>
            <mesh position={[0, 4.15, 0]} castShadow>
              <sphereGeometry
                args={[2.05, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]}
              />
              <meshStandardMaterial color="#f6f9ff" roughness={0.75} />
            </mesh>
            {/* Golden Jamour Spire Finial on Top of Dome */}
            <mesh position={[0, 6.35, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.05, 0.75, 10]} />
              <meshStandardMaterial color="#f2b63d" metalness={0.7} roughness={0.25} />
            </mesh>
            {[0.16, 0.11, 0.07].map((r, fIdx) => (
              <mesh key={fIdx} position={[0, 6.12 + fIdx * 0.24, 0]}>
                <sphereGeometry args={[r, 14, 14]} />
                <meshStandardMaterial color="#f2b63d" metalness={0.7} roughness={0.25} />
              </mesh>
            ))}

            {/* Levitating Celestial Star Crystal in Center of Pavilion */}
            <group ref={summitCrystalRef} position={[0, 2.1, 0]}>
              <mesh>
                <octahedronGeometry args={[0.42, 0]} />
                <meshStandardMaterial
                  color="#fff3b8"
                  emissive="#ffbe3b"
                  emissiveIntensity={1.2}
                  roughness={0.15}
                />
              </mesh>
              <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                <torusGeometry args={[0.72, 0.022, 10, 32]} />
                <meshBasicMaterial color="#8ae4ff" transparent opacity={0.85} />
              </mesh>
            </group>

            <pointLight
              position={[0, 2.4, 0]}
              color="#ffd670"
              intensity={2.0}
              distance={10.0}
            />
          </group>
        );
      })()}

      {/* ========================================================= */}
      {/* 7. COLLECTIBLE LUMINA SKY STARS (✧) ALONG THE FLIGHT PATH */}
      {/* ========================================================= */}
      <group ref={skyStarsGroupRef}>
        {INITIAL_SKY_STARS.map((star) => {
          const isCollected = collectedStars.includes(star.id);
          return (
            <group
              key={star.id}
              position={star.position}
              visible={!isCollected}
            >
              <mesh geometry={starGeo}>
                <meshStandardMaterial
                  color="#fff5c0"
                  emissive="#ffbf38"
                  emissiveIntensity={1.1}
                  roughness={0.2}
                />
              </mesh>
              {/* Soft outer starlight ring */}
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <ringGeometry args={[0.26, 0.3, 4]} />
                <meshBasicMaterial
                  color="#9ae8ff"
                  transparent
                  opacity={0.65}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 8. CLICK-TO-FLY DESTINATION RING MARKER ON STEPS          */}
      {/* ========================================================= */}
      {flyMarker && (
        <group ref={markerRef} position={flyMarker}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.32, 28]} />
            <meshBasicMaterial
              color="#9be8ff"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.25, 0]} geometry={starGeo} scale={0.55}>
            <meshBasicMaterial color="#fff7cc" />
          </mesh>
        </group>
      )}
    </group>
  );
}
