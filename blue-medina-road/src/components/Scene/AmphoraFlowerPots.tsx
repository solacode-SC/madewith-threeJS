import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createCeramicPotTextures } from '../../utils/textures';
import { getRoadCenterX, getRoadElevationY, getRoadHalfWidth } from '../../utils/roadPath';
import type { TimeOfDay } from '../../hooks/useSceneState';

interface AmphoraFlowerPotsProps {
  timeOfDay: TimeOfDay;
  onHover: (label: string | null) => void;
}

interface PotPlacement {
  id: string;
  z: number;
  side: 'left' | 'right';
  scale: number;
  variant: 'tall-amphora' | 'round-urn';
  accentColor: 'yellow-white' | 'blue-white' | 'pure-white';
  levitating?: boolean;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 19.19 + 47.3) * 43758.5453;
  return x - Math.floor(x);
};

function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  let totalVerts = 0;
  let totalIndices = 0;
  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let idxOffset = 0;

  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    const posAttr = g.attributes.position;
    const normAttr = g.attributes.normal;
    const uvAttr = g.attributes.uv;
    const count = posAttr.count;

    positions.set(posAttr.array as Float32Array, vertOffset * 3);
    if (normAttr) {
      normals.set(normAttr.array as Float32Array, vertOffset * 3);
    }
    if (uvAttr) {
      uvs.set(uvAttr.array as Float32Array, vertOffset * 2);
    }

    if (g.index) {
      const idxArr = g.index.array;
      for (let j = 0; j < idxArr.length; j++) {
        indices[idxOffset + j] = idxArr[j] + vertOffset;
      }
      idxOffset += idxArr.length;
    } else {
      for (let j = 0; j < count; j++) {
        indices[idxOffset + j] = vertOffset + j;
      }
      idxOffset += count;
    }

    vertOffset += count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingSphere();
  return merged;
}

const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _euler = new THREE.Euler();

function pushTransformedGeo(
  bucket: THREE.BufferGeometry[],
  baseGeo: THREE.BufferGeometry,
  parentMat: THREE.Matrix4,
  px = 0,
  py = 0,
  pz = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1
) {
  _pos.set(px, py, pz);
  _euler.set(rx, ry, rz, 'XYZ');
  _quat.setFromEuler(_euler);
  _scale.set(sx, sy, sz);
  _mat.compose(_pos, _quat, _scale);
  _mat.premultiply(parentMat);
  const clone = baseGeo.clone();
  clone.applyMatrix4(_mat);
  bucket.push(clone);
}

const PLACEMENTS: PotPlacement[] = [
  // Zone 1: Foreground & Mid-Ground Amphora Vases on the Cobalt Steps
  {
    id: 'fg-left',
    z: 1.95,
    side: 'left',
    scale: 1.12,
    variant: 'tall-amphora',
    accentColor: 'yellow-white',
  },
  {
    id: 'mg-right',
    z: -1.15,
    side: 'right',
    scale: 1.0,
    variant: 'round-urn',
    accentColor: 'blue-white',
  },
  {
    id: 'ug-left',
    z: -4.65,
    side: 'left',
    scale: 0.92,
    variant: 'round-urn',
    accentColor: 'pure-white',
  },
  {
    id: 'top-right-1',
    z: -8.4,
    side: 'right',
    scale: 0.88,
    variant: 'tall-amphora',
    accentColor: 'yellow-white',
  },
  // Zone 2: Whispering Lantern Archway Pots
  {
    id: 'arch-left-1',
    z: -16.5,
    side: 'left',
    scale: 0.98,
    variant: 'tall-amphora',
    accentColor: 'blue-white',
  },
  {
    id: 'arch-right-1',
    z: -21.5,
    side: 'right',
    scale: 0.95,
    variant: 'round-urn',
    accentColor: 'yellow-white',
  },
  {
    id: 'arch-left-2',
    z: -28.0,
    side: 'left',
    scale: 1.02,
    variant: 'tall-amphora',
    accentColor: 'pure-white',
  },
  {
    id: 'arch-right-2',
    z: -33.0,
    side: 'right',
    scale: 0.94,
    variant: 'round-urn',
    accentColor: 'blue-white',
  },
  // Zone 3: Sky Fountain Courtyard Urns
  {
    id: 'plaza-left-1',
    z: -41.0,
    side: 'left',
    scale: 1.08,
    variant: 'tall-amphora',
    accentColor: 'yellow-white',
  },
  {
    id: 'plaza-right-1',
    z: -41.0,
    side: 'right',
    scale: 1.08,
    variant: 'tall-amphora',
    accentColor: 'blue-white',
  },
  {
    id: 'plaza-left-2',
    z: -51.0,
    side: 'left',
    scale: 1.05,
    variant: 'round-urn',
    accentColor: 'pure-white',
  },
  {
    id: 'plaza-right-2',
    z: -51.0,
    side: 'right',
    scale: 1.05,
    variant: 'round-urn',
    accentColor: 'yellow-white',
  },
  // Zone 4: Bridge of Levitating Amphoras (Floating enchanted pots!)
  {
    id: 'float-1',
    z: -58.5,
    side: 'left',
    scale: 0.98,
    variant: 'tall-amphora',
    accentColor: 'blue-white',
    levitating: true,
  },
  {
    id: 'float-2',
    z: -62.0,
    side: 'right',
    scale: 0.98,
    variant: 'round-urn',
    accentColor: 'yellow-white',
    levitating: true,
  },
  {
    id: 'float-3',
    z: -66.5,
    side: 'left',
    scale: 1.02,
    variant: 'round-urn',
    accentColor: 'pure-white',
    levitating: true,
  },
  {
    id: 'float-4',
    z: -70.5,
    side: 'right',
    scale: 1.02,
    variant: 'tall-amphora',
    accentColor: 'blue-white',
    levitating: true,
  },
  // Zone 5: Celestial Belvedere Summit Grand Urns
  {
    id: 'summit-left',
    z: -77.5,
    side: 'left',
    scale: 1.15,
    variant: 'tall-amphora',
    accentColor: 'yellow-white',
    levitating: true,
  },
  {
    id: 'summit-right',
    z: -77.5,
    side: 'right',
    scale: 1.15,
    variant: 'tall-amphora',
    accentColor: 'blue-white',
    levitating: true,
  },
];

export default function AmphoraFlowerPots({ timeOfDay, onHover }: AmphoraFlowerPotsProps) {
  const ceramicTex = useMemo(() => createCeramicPotTextures(), []);
  const floatingGroupRef = useRef<THREE.Group>(null);
  const foliageSwayRef = useRef<THREE.Group>(null);

  const isStarlight = timeOfDay === 'starlight';

  // Shared Memoized Materials
  const materials = useMemo(
    () => ({
      ceramic: new THREE.MeshStandardMaterial({
        map: ceramicTex.map,
        bumpMap: ceramicTex.bumpMap,
        bumpScale: 0.018,
        roughness: 0.76,
      }),
      soil: new THREE.MeshStandardMaterial({
        color: '#2b3d28',
        roughness: 0.95,
      }),
      leafDark: new THREE.MeshStandardMaterial({
        color: '#295828',
        roughness: 0.72,
      }),
      leafLight: new THREE.MeshStandardMaterial({
        color: '#3d7436',
        roughness: 0.72,
      }),
      ringFloat: new THREE.MeshBasicMaterial({
        color: '#79d8ff',
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
    }),
    [ceramicTex]
  );

  // Pre-build & merge all grounded amphoras + pre-merge floating amphora templates
  const {
    groundedCeramicGeo,
    groundedSoilGeo,
    groundedLeavesDarkGeo,
    groundedLeavesLightGeo,
    groundedBlossomsWhiteGeo,
    groundedBlossomsYellowGeo,
    groundedBlossomsBlueGeo,
    tallAmphoraGeo,
    roundUrnGeo,
    singleLeavesGeo,
    singleBlossomsWhiteGeo,
    singleBlossomsAccentGeo,
    ringGeo,
  } = useMemo(() => {
    const tallPts: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.22, 0.0),
      new THREE.Vector2(0.27, 0.14),
      new THREE.Vector2(0.35, 0.36),
      new THREE.Vector2(0.39, 0.58),
      new THREE.Vector2(0.36, 0.76),
      new THREE.Vector2(0.25, 0.88),
      new THREE.Vector2(0.29, 0.95),
      new THREE.Vector2(0.24, 0.96),
    ];
    const tallGeo = new THREE.LatheGeometry(tallPts, 24);
    tallGeo.computeVertexNormals();

    const roundPts: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.21, 0.0),
      new THREE.Vector2(0.31, 0.16),
      new THREE.Vector2(0.41, 0.38),
      new THREE.Vector2(0.42, 0.54),
      new THREE.Vector2(0.34, 0.70),
      new THREE.Vector2(0.23, 0.78),
      new THREE.Vector2(0.27, 0.84),
      new THREE.Vector2(0.22, 0.85),
    ];
    const roundGeo = new THREE.LatheGeometry(roundPts, 24);
    roundGeo.computeVertexNormals();

    const soilCircle = new THREE.CircleGeometry(0.21, 14);
    soilCircle.rotateX(-Math.PI / 2);

    const leafCone = new THREE.ConeGeometry(0.068, 1.0, 6);
    leafCone.translate(0, 0.5, 0);
    leafCone.scale(0.35, 1, 1);

    const blossomDodeca = new THREE.DodecahedronGeometry(1, 0);

    const leavesData = Array.from({ length: 14 }).map((_, i) => ({
      angle: (i / 14) * Math.PI * 2 + pseudoRandom(i * 3) * 0.25,
      tilt: 0.22 + pseudoRandom(i * 3 + 1) * 0.36,
      height: 0.55 + pseudoRandom(i * 3 + 2) * 0.55,
      isDark: i % 2 === 0,
    }));

    const blossomsData = Array.from({ length: 34 }).map((_, i) => {
      const theta = pseudoRandom(i * 5 + 1) * Math.PI * 2;
      const radius = 0.05 + pseudoRandom(i * 5 + 2) * 0.36;
      const y = 1.0 + pseudoRandom(i * 5 + 3) * 0.95;
      const size = 0.038 + pseudoRandom(i * 5 + 4) * 0.036;
      return {
        x: Math.cos(theta) * radius,
        y,
        z: Math.sin(theta) * radius,
        size,
        isAccent: i % 4 === 0,
      };
    });

    const ceramicBucket: THREE.BufferGeometry[] = [];
    const soilBucket: THREE.BufferGeometry[] = [];
    const leafDarkBucket: THREE.BufferGeometry[] = [];
    const leafLightBucket: THREE.BufferGeometry[] = [];
    const blossomWhiteBucket: THREE.BufferGeometry[] = [];
    const blossomYellowBucket: THREE.BufferGeometry[] = [];
    const blossomBlueBucket: THREE.BufferGeometry[] = [];

    const parentMat = new THREE.Matrix4();
    const pPos = new THREE.Vector3();
    const pQuat = new THREE.Quaternion();
    const pScale = new THREE.Vector3();

    const grounded = PLACEMENTS.filter((p) => !p.levitating);
    for (let idx = 0; idx < grounded.length; idx++) {
      const p = grounded[idx];
      const cx = getRoadCenterX(p.z);
      const cy = getRoadElevationY(p.z);
      const halfW = getRoadHalfWidth(p.z);
      const offsetFromWall = Math.min(1.18, halfW - 0.52);
      const x = cx + (p.side === 'left' ? -offsetFromWall : offsetFromWall);

      pPos.set(x, cy, p.z);
      pQuat.identity();
      pScale.setScalar(p.scale);
      parentMat.compose(pPos, pQuat, pScale);

      pushTransformedGeo(
        ceramicBucket,
        p.variant === 'tall-amphora' ? tallGeo : roundGeo,
        parentMat
      );
      pushTransformedGeo(
        soilBucket,
        soilCircle,
        parentMat,
        0,
        p.variant === 'tall-amphora' ? 0.9 : 0.8,
        0
      );

      for (let lIdx = 0; lIdx < leavesData.length; lIdx++) {
        const lf = leavesData[lIdx];
        pushTransformedGeo(
          lf.isDark ? leafDarkBucket : leafLightBucket,
          leafCone,
          parentMat,
          0,
          0.83,
          0,
          0,
          lf.angle,
          lf.tilt,
          1,
          lf.height,
          1
        );
      }

      for (let bIdx = 0; bIdx < blossomsData.length; bIdx++) {
        const bl = blossomsData[bIdx];
        const targetBucket = !bl.isAccent
          ? blossomWhiteBucket
          : p.accentColor === 'yellow-white'
            ? blossomYellowBucket
            : p.accentColor === 'blue-white'
              ? blossomBlueBucket
              : blossomWhiteBucket;

        pushTransformedGeo(
          targetBucket,
          blossomDodeca,
          parentMat,
          bl.x,
          bl.y,
          bl.z,
          0,
          0,
          0,
          bl.size * 1.15,
          bl.size * 0.9,
          bl.size * 1.15
        );
      }
    }

    // Also build single-pot merged templates for the 6 levitating pots
    const identityMat = new THREE.Matrix4().identity();
    const singleLeafBucket: THREE.BufferGeometry[] = [];
    const singleWhiteBucket: THREE.BufferGeometry[] = [];
    const singleAccentBucket: THREE.BufferGeometry[] = [];

    for (let lIdx = 0; lIdx < leavesData.length; lIdx++) {
      const lf = leavesData[lIdx];
      pushTransformedGeo(
        singleLeafBucket,
        leafCone,
        identityMat,
        0,
        0.83,
        0,
        0,
        lf.angle,
        lf.tilt,
        1,
        lf.height,
        1
      );
    }
    for (let bIdx = 0; bIdx < blossomsData.length; bIdx++) {
      const bl = blossomsData[bIdx];
      pushTransformedGeo(
        bl.isAccent ? singleAccentBucket : singleWhiteBucket,
        blossomDodeca,
        identityMat,
        bl.x,
        bl.y,
        bl.z,
        0,
        0,
        0,
        bl.size * 1.15,
        bl.size * 0.9,
        bl.size * 1.15
      );
    }

    const rGeo = new THREE.RingGeometry(0.24, 0.32, 24);
    rGeo.rotateX(-Math.PI / 2);

    return {
      groundedCeramicGeo: mergeBufferGeometries(ceramicBucket),
      groundedSoilGeo: mergeBufferGeometries(soilBucket),
      groundedLeavesDarkGeo: mergeBufferGeometries(leafDarkBucket),
      groundedLeavesLightGeo: mergeBufferGeometries(leafLightBucket),
      groundedBlossomsWhiteGeo: mergeBufferGeometries(blossomWhiteBucket),
      groundedBlossomsYellowGeo: mergeBufferGeometries(blossomYellowBucket),
      groundedBlossomsBlueGeo: mergeBufferGeometries(blossomBlueBucket),
      tallAmphoraGeo: tallGeo,
      roundUrnGeo: roundGeo,
      singleLeavesGeo: mergeBufferGeometries(singleLeafBucket),
      singleBlossomsWhiteGeo: mergeBufferGeometries(singleWhiteBucket),
      singleBlossomsAccentGeo: mergeBufferGeometries(singleAccentBucket),
      ringGeo: rGeo,
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (floatingGroupRef.current) {
      const children = floatingGroupRef.current.children;
      for (let idx = 0; idx < children.length; idx++) {
        const child = children[idx];
        child.position.y = Math.sin(t * 2.1 + idx * 1.3) * 0.14;
        child.rotation.y = Math.sin(t * 0.6 + idx) * 0.08;
      }
    }
    if (foliageSwayRef.current) {
      foliageSwayRef.current.rotation.z = Math.sin(t * 1.6) * 0.014;
    }
  });

  const floatingPots = useMemo(() => PLACEMENTS.filter((p) => p.levitating), []);

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. BATCHED GROUNDED AMPHORA POTS & BOUQUETS (7 Draw Calls)*/}
      {/* ========================================================= */}
      <mesh
        geometry={groundedCeramicGeo}
        material={materials.ceramic}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('Hand-Thrown Whitewashed Medina Amphora & Wildflower Bouquet');
        }}
        onPointerOut={() => onHover(null)}
      />
      <mesh geometry={groundedSoilGeo} material={materials.soil} />

      <group ref={foliageSwayRef}>
        <mesh
          geometry={groundedLeavesDarkGeo}
          material={materials.leafDark}
          castShadow
        />
        <mesh
          geometry={groundedLeavesLightGeo}
          material={materials.leafLight}
          castShadow
        />
        <mesh geometry={groundedBlossomsWhiteGeo} castShadow>
          <meshStandardMaterial
            color="#f5f9ff"
            emissive={isStarlight ? '#d8ecff' : '#000000'}
            emissiveIntensity={isStarlight ? 0.35 : 0}
            roughness={0.55}
          />
        </mesh>
        <mesh geometry={groundedBlossomsYellowGeo} castShadow>
          <meshStandardMaterial
            color="#f5d020"
            emissive={isStarlight ? '#f5d020' : '#000000'}
            emissiveIntensity={isStarlight ? 0.4 : 0}
            roughness={0.55}
          />
        </mesh>
        <mesh geometry={groundedBlossomsBlueGeo} castShadow>
          <meshStandardMaterial
            color="#82baf8"
            emissive={isStarlight ? '#82baf8' : '#000000'}
            emissiveIntensity={isStarlight ? 0.4 : 0}
            roughness={0.55}
          />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 2. LEVITATING AMPHORA POTS IN ZONES 4 & 5                 */}
      {/* ========================================================= */}
      <group ref={floatingGroupRef}>
        {floatingPots.map((p) => {
          const cx = getRoadCenterX(p.z);
          const cy = getRoadElevationY(p.z);
          const halfW = getRoadHalfWidth(p.z);
          const offsetFromWall = Math.min(1.18, halfW - 0.52);
          const x = cx + (p.side === 'left' ? -offsetFromWall : offsetFromWall);
          const y = cy + 0.55;

          const accentHex =
            p.accentColor === 'yellow-white'
              ? '#f5d020'
              : p.accentColor === 'blue-white'
                ? '#82baf8'
                : '#e8f2ff';

          return (
            <group key={p.id}>
              <group
                position={[x, y, p.z]}
                scale={p.scale}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHover('Enchanted Levitating Ceramic Amphora • Starlight Wildflowers');
                }}
                onPointerOut={() => onHover(null)}
              >
                <mesh
                  position={[0, -0.18, 0]}
                  geometry={ringGeo}
                  material={materials.ringFloat}
                />
                <mesh
                  geometry={p.variant === 'tall-amphora' ? tallAmphoraGeo : roundUrnGeo}
                  material={materials.ceramic}
                  castShadow
                  receiveShadow
                />
                <mesh
                  geometry={singleLeavesGeo}
                  material={materials.leafLight}
                  castShadow
                />
                <mesh geometry={singleBlossomsWhiteGeo} castShadow>
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={isStarlight ? 0.38 : 0.18}
                    roughness={0.55}
                  />
                </mesh>
                <mesh geometry={singleBlossomsAccentGeo} castShadow>
                  <meshStandardMaterial
                    color={accentHex}
                    emissive={accentHex}
                    emissiveIntensity={isStarlight ? 0.38 : 0.18}
                    roughness={0.55}
                  />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}
