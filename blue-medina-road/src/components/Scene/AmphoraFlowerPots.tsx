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

export default function AmphoraFlowerPots({ timeOfDay, onHover }: AmphoraFlowerPotsProps) {
  const ceramicTex = useMemo(() => createCeramicPotTextures(), []);
  const floatingGroupRef = useRef<THREE.Group>(null);
  const foliageSwayRef = useRef<THREE.Group>(null);

  // Sculpted LatheGeometry for the tall foreground amphora (left pot in Image 1)
  const tallAmphoraGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.22, 0.0),
      new THREE.Vector2(0.27, 0.14),
      new THREE.Vector2(0.35, 0.36),
      new THREE.Vector2(0.39, 0.58), // Full rounded shoulder
      new THREE.Vector2(0.36, 0.76),
      new THREE.Vector2(0.25, 0.88), // Narrowed neck
      new THREE.Vector2(0.29, 0.95), // Flared ceramic lip
      new THREE.Vector2(0.24, 0.96),
    ];
    const geo = new THREE.LatheGeometry(pts, 28);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Sculpted LatheGeometry for the rounded belly urn (right pot in Image 1)
  const roundUrnGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [
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
    const geo = new THREE.LatheGeometry(pts, 28);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Placements along the entire 90m road (starting with Image 1's exact foreground & mid-ground pots!)
  const placements = useMemo<PotPlacement[]>(
    () => [
      // Zone 1: Exact Reference Image 1 Amphora Vases on the Cobalt Steps
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
    ],
    []
  );

  // Precompute bouquet leaves & blossom clusters per pot
  const bouquetTemplate = useMemo(() => {
    const leaves = Array.from({ length: 14 }).map((_, i) => {
      const angle = (i / 14) * Math.PI * 2 + pseudoRandom(i * 3) * 0.25;
      const tilt = 0.22 + pseudoRandom(i * 3 + 1) * 0.36;
      const height = 0.55 + pseudoRandom(i * 3 + 2) * 0.55;
      return { angle, tilt, height, shade: i % 2 === 0 ? '#295828' : '#3d7436' };
    });

    const blossoms = Array.from({ length: 34 }).map((_, i) => {
      const theta = pseudoRandom(i * 5 + 1) * Math.PI * 2;
      const radius = 0.05 + pseudoRandom(i * 5 + 2) * 0.36;
      const y = 0.95 + pseudoRandom(i * 5 + 3) * 0.95;
      const size = 0.038 + pseudoRandom(i * 5 + 4) * 0.036;
      const isAccent = i % 4 === 0;
      return {
        pos: [Math.cos(theta) * radius, y, Math.sin(theta) * radius] as [number, number, number],
        size,
        isAccent,
      };
    });

    return { leaves, blossoms };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (floatingGroupRef.current) {
      floatingGroupRef.current.children.forEach((child, idx) => {
        child.position.y = Math.sin(t * 2.1 + idx * 1.3) * 0.14;
        child.rotation.y = Math.sin(t * 0.6 + idx) * 0.08;
      });
    }
    if (foliageSwayRef.current) {
      foliageSwayRef.current.rotation.z = Math.sin(t * 1.6) * 0.018;
    }
  });

  const isStarlight = timeOfDay === 'starlight';

  const renderSinglePot = (p: PotPlacement, idx: number) => {
    const cx = getRoadCenterX(p.z);
    const cy = getRoadElevationY(p.z);
    const halfW = getRoadHalfWidth(p.z);
    const offsetFromWall = Math.min(1.18, halfW - 0.52);
    const x = cx + (p.side === 'left' ? -offsetFromWall : offsetFromWall);
    const y = cy + (p.levitating ? 0.55 : 0.0);

    const accentHex =
      p.accentColor === 'yellow-white'
        ? '#f5d020'
        : p.accentColor === 'blue-white'
          ? '#82baf8'
          : '#e8f2ff';

    return (
      <group
        key={p.id}
        position={[x, y, p.z]}
        scale={p.scale}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(
            p.levitating
              ? 'Enchanted Levitating Ceramic Amphora • Starlight Wildflowers'
              : 'Hand-Thrown Whitewashed Medina Amphora & Wildflower Bouquet'
          );
        }}
        onPointerOut={() => onHover(null)}
      >
        {/* Glowing Levitation Ring underneath floating pots in Zones 4 & 5 */}
        {p.levitating && (
          <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.24, 0.32, 24]} />
            <meshBasicMaterial
              color="#79d8ff"
              transparent
              opacity={0.75}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Sculpted White Ceramic Amphora Body */}
        <mesh
          geometry={p.variant === 'tall-amphora' ? tallAmphoraGeo : roundUrnGeo}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={ceramicTex.map}
            bumpMap={ceramicTex.bumpMap}
            bumpScale={0.018}
            roughness={0.78}
          />
        </mesh>

        {/* Dark Potting Soil Disk Inside Rim */}
        <mesh position={[0, p.variant === 'tall-amphora' ? 0.9 : 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.21, 16]} />
          <meshStandardMaterial color="#2b3d28" roughness={0.95} />
        </mesh>

        {/* Sword-Leaf Greenery Stems Fanning Upward */}
        <group position={[0, 0.05, 0]}>
          {bouquetTemplate.leaves.map((lf, lIdx) => (
            <group key={lIdx} position={[0, 0.78, 0]} rotation={[0, lf.angle, lf.tilt]}>
              <mesh position={[0, lf.height * 0.5, 0]} scale={[0.35, 1, 1]} castShadow>
                <coneGeometry args={[0.068, lf.height, 6]} />
                <meshStandardMaterial color={lf.shade} roughness={0.72} />
              </mesh>
            </group>
          ))}

          {/* Painterly Impasto Wildflower Blossom Clusters (White + Yellow/Blue Accents) */}
          {bouquetTemplate.blossoms.map((bl, bIdx) => {
            const col = bl.isAccent ? accentHex : bIdx % 3 === 0 ? '#ffffff' : '#edf5ff';
            return (
              <mesh
                key={`${idx}-bl-${bIdx}`}
                position={bl.pos}
                scale={[1.15, 0.9, 1.15]}
                castShadow
              >
                <dodecahedronGeometry args={[bl.size, 0]} />
                <meshStandardMaterial
                  color={col}
                  emissive={isStarlight || p.levitating ? col : '#000000'}
                  emissiveIntensity={isStarlight ? 0.38 : p.levitating ? 0.18 : 0}
                  roughness={0.55}
                />
              </mesh>
            );
          })}
        </group>
      </group>
    );
  };

  const groundedPots = placements.filter((p) => !p.levitating);
  const floatingPots = placements.filter((p) => p.levitating);

  return (
    <group ref={foliageSwayRef}>
      <group>{groundedPots.map((p, idx) => renderSinglePot(p, idx))}</group>
      <group ref={floatingGroupRef}>
        {floatingPots.map((p, idx) => renderSinglePot(p, idx + 100))}
      </group>
    </group>
  );
}
