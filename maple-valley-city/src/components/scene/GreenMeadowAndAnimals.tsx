import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HALF_CITY_D, HALF_CITY_W } from '../../domain/cityLayout';

interface GreenMeadowAndAnimalsProps {
  onRoadClick: (point: THREE.Vector3) => void;
  onHover: (label: string | null) => void;
}

interface DeerConfig {
  id: string;
  name: string;
  centerX: number;
  centerZ: number;
  patrolRadius: number;
  speed: number;
  phase: number;
  scale: number;
  isStag: boolean;
  mode: 'stroll' | 'graze';
}

interface SheepConfig {
  id: string;
  name: string;
  centerX: number;
  centerZ: number;
  patrolRadius: number;
  speed: number;
  phase: number;
  scale: number;
  mode: 'stroll' | 'graze';
}

interface CraneConfig {
  id: string;
  x: number;
  z: number;
  yaw: number;
  phase: number;
}

interface BunnyConfig {
  id: string;
  centerX: number;
  centerZ: number;
  radius: number;
  speed: number;
  phase: number;
}

const DEER_HERD: DeerConfig[] = [
  // Welcoming Sika Deer near the Southern Meadow Gate & Foreground Road Bend
  {
    id: 'deer-welcome-1',
    name: 'Spotted Sika Stag',
    centerX: -3.2,
    centerZ: HALF_CITY_D + 5.2,
    patrolRadius: 2.8,
    speed: 0.42,
    phase: 0.2,
    scale: 1.05,
    isStag: true,
    mode: 'stroll',
  },
  {
    id: 'deer-welcome-2',
    name: 'Graceful Sika Doe',
    centerX: 3.6,
    centerZ: HALF_CITY_D + 6.4,
    patrolRadius: 0,
    speed: 0,
    phase: 1.5,
    scale: 0.94,
    isStag: false,
    mode: 'graze',
  },
  // Southern Green Pasture Herd
  {
    id: 'deer-south-1',
    name: 'Meadow Sika Stag',
    centerX: -11.5,
    centerZ: HALF_CITY_D + 14.0,
    patrolRadius: 4.5,
    speed: 0.38,
    phase: 2.1,
    scale: 1.08,
    isStag: true,
    mode: 'stroll',
  },
  {
    id: 'deer-south-2',
    name: 'Grazing Sika Doe',
    centerX: -7.2,
    centerZ: HALF_CITY_D + 12.5,
    patrolRadius: 0,
    speed: 0,
    phase: 0.8,
    scale: 0.92,
    isStag: false,
    mode: 'graze',
  },
  {
    id: 'deer-south-3',
    name: 'Young Sika Fawn',
    centerX: -5.5,
    centerZ: HALF_CITY_D + 14.2,
    patrolRadius: 2.2,
    speed: 0.55,
    phase: 3.4,
    scale: 0.72,
    isStag: false,
    mode: 'stroll',
  },
  {
    id: 'deer-pond-1',
    name: 'Oasis Sika Stag',
    centerX: 6.5,
    centerZ: HALF_CITY_D + 15.5,
    patrolRadius: 0,
    speed: 0,
    phase: 4.1,
    scale: 1.04,
    isStag: true,
    mode: 'graze',
  },
  // Eastern Green Pasture Herd
  {
    id: 'deer-east-1',
    name: 'Eastern Pasture Stag',
    centerX: HALF_CITY_W + 11.5,
    centerZ: 8.5,
    patrolRadius: 4.2,
    speed: 0.4,
    phase: 1.1,
    scale: 1.05,
    isStag: true,
    mode: 'stroll',
  },
  {
    id: 'deer-east-2',
    name: 'Eastern Pasture Doe',
    centerX: HALF_CITY_W + 9.2,
    centerZ: -6.5,
    patrolRadius: 0,
    speed: 0,
    phase: 2.7,
    scale: 0.95,
    isStag: false,
    mode: 'graze',
  },
  // Western Green Pasture Herd
  {
    id: 'deer-west-1',
    name: 'Western Meadow Stag',
    centerX: -HALF_CITY_W - 10.8,
    centerZ: 7.2,
    patrolRadius: 4.0,
    speed: 0.36,
    phase: 0.5,
    scale: 1.06,
    isStag: true,
    mode: 'stroll',
  },
  {
    id: 'deer-west-2',
    name: 'Western Meadow Doe',
    centerX: -HALF_CITY_W - 8.5,
    centerZ: -5.4,
    patrolRadius: 0,
    speed: 0,
    phase: 3.9,
    scale: 0.92,
    isStag: false,
    mode: 'graze',
  },
];

const SHEEP_FLOCK: SheepConfig[] = [
  // Southern Meadow Flock
  {
    id: 'sheep-1',
    name: 'Fluffy Meadow Ewe',
    centerX: -16.5,
    centerZ: HALF_CITY_D + 8.5,
    patrolRadius: 2.6,
    speed: 0.28,
    phase: 0.4,
    scale: 1.0,
    mode: 'stroll',
  },
  {
    id: 'sheep-2',
    name: 'Grazing Wool Sheep',
    centerX: -19.2,
    centerZ: HALF_CITY_D + 10.2,
    patrolRadius: 0,
    speed: 0,
    phase: 1.9,
    scale: 0.96,
    mode: 'graze',
  },
  {
    id: 'sheep-3',
    name: 'Little Meadow Lamb',
    centerX: -14.8,
    centerZ: HALF_CITY_D + 11.4,
    patrolRadius: 1.8,
    speed: 0.42,
    phase: 2.8,
    scale: 0.72,
    mode: 'stroll',
  },
  {
    id: 'sheep-4',
    name: 'Sunlit Pasture Sheep',
    centerX: 22.5,
    centerZ: HALF_CITY_D + 9.5,
    patrolRadius: 3.0,
    speed: 0.3,
    phase: 3.5,
    scale: 1.02,
    mode: 'stroll',
  },
  {
    id: 'sheep-5',
    name: 'Grazing Meadow Sheep',
    centerX: 25.0,
    centerZ: HALF_CITY_D + 11.8,
    patrolRadius: 0,
    speed: 0,
    phase: 0.9,
    scale: 0.95,
    mode: 'graze',
  },
  {
    id: 'sheep-6',
    name: 'Playful White Lamb',
    centerX: 21.2,
    centerZ: HALF_CITY_D + 13.0,
    patrolRadius: 2.0,
    speed: 0.44,
    phase: 4.6,
    scale: 0.74,
    mode: 'stroll',
  },
  // Eastern & Western Pasture Sheep
  {
    id: 'sheep-7',
    name: 'Eastern Clover Sheep',
    centerX: HALF_CITY_W + 12.5,
    centerZ: 18.5,
    patrolRadius: 2.8,
    speed: 0.26,
    phase: 1.3,
    scale: 1.0,
    mode: 'stroll',
  },
  {
    id: 'sheep-8',
    name: 'Eastern Grazing Ewe',
    centerX: HALF_CITY_W + 14.8,
    centerZ: 15.8,
    patrolRadius: 0,
    speed: 0,
    phase: 2.4,
    scale: 0.94,
    mode: 'graze',
  },
  {
    id: 'sheep-9',
    name: 'Western Hillside Sheep',
    centerX: -HALF_CITY_W - 12.2,
    centerZ: 16.5,
    patrolRadius: 2.8,
    speed: 0.28,
    phase: 3.1,
    scale: 1.02,
    mode: 'stroll',
  },
  {
    id: 'sheep-10',
    name: 'Western Meadow Lamb',
    centerX: -HALF_CITY_W - 14.5,
    centerZ: 19.0,
    patrolRadius: 0,
    speed: 0,
    phase: 5.0,
    scale: 0.76,
    mode: 'graze',
  },
];

const CRANE_FLOCK: CraneConfig[] = [
  { id: 'crane-1', x: 11.2, z: HALF_CITY_D + 10.5, yaw: 0.65, phase: 0.2 },
  { id: 'crane-2', x: 13.4, z: HALF_CITY_D + 9.2, yaw: -0.35, phase: 1.8 },
  { id: 'crane-3', x: 18.2, z: HALF_CITY_D + 15.8, yaw: -1.2, phase: 3.1 },
  { id: 'crane-4', x: 16.0, z: HALF_CITY_D + 17.5, yaw: 2.4, phase: 4.5 },
  { id: 'crane-5', x: HALF_CITY_W + 8.5, z: -14.5, yaw: -0.8, phase: 2.2 },
  { id: 'crane-6', x: -HALF_CITY_W - 8.5, z: -13.5, yaw: 0.9, phase: 0.9 },
];

const BUNNY_GROUP: BunnyConfig[] = [
  { id: 'bunny-1', centerX: -2.4, centerZ: HALF_CITY_D + 8.8, radius: 1.6, speed: 0.85, phase: 0.0 },
  { id: 'bunny-2', centerX: 4.8, centerZ: HALF_CITY_D + 9.4, radius: 1.5, speed: 0.92, phase: 1.7 },
  { id: 'bunny-3', centerX: -10.5, centerZ: HALF_CITY_D + 6.5, radius: 1.8, speed: 0.78, phase: 3.2 },
  { id: 'bunny-4', centerX: 9.2, centerZ: HALF_CITY_D + 7.2, radius: 1.4, speed: 0.88, phase: 4.4 },
  { id: 'bunny-5', centerX: HALF_CITY_W + 6.8, centerZ: 3.8, radius: 1.6, speed: 0.82, phase: 2.1 },
  { id: 'bunny-6', centerX: -HALF_CITY_W - 6.8, centerZ: 3.5, radius: 1.6, speed: 0.86, phase: 5.1 },
];

export default function GreenMeadowAndAnimals({
  onRoadClick,
  onHover,
}: GreenMeadowAndAnimalsProps) {
  const deerRefs = useRef<Array<THREE.Group | null>>([]);
  const deerNeckRefs = useRef<Array<THREE.Group | null>>([]);
  const deerLegsRefs = useRef<Array<THREE.Group | null>>([]);

  const sheepRefs = useRef<Array<THREE.Group | null>>([]);
  const sheepHeadRefs = useRef<Array<THREE.Group | null>>([]);
  const sheepLegsRefs = useRef<Array<THREE.Group | null>>([]);

  const craneNeckRefs = useRef<Array<THREE.Group | null>>([]);
  const bunnyRefs = useRef<Array<THREE.Group | null>>([]);

  const mats = useMemo(() => {
    return {
      deerCoat: new THREE.MeshStandardMaterial({
        color: '#C8763E',
        roughness: 0.52,
        emissive: '#8A481E',
        emissiveIntensity: 0.12,
      }),
      deerBelly: new THREE.MeshStandardMaterial({
        color: '#FFF5E6',
        roughness: 0.55,
      }),
      deerSpot: new THREE.MeshBasicMaterial({
        color: '#FFF9F0',
      }),
      deerAntler: new THREE.MeshStandardMaterial({
        color: '#F5EBD6',
        roughness: 0.48,
      }),
      sheepWool: new THREE.MeshStandardMaterial({
        color: '#FFFDF7',
        roughness: 0.68,
        emissive: '#E8E0CE',
        emissiveIntensity: 0.15,
      }),
      sheepFace: new THREE.MeshStandardMaterial({
        color: '#3D312A',
        roughness: 0.58,
      }),
      craneWhite: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.42,
        emissive: '#E8F0F5',
        emissiveIntensity: 0.18,
      }),
      craneBlack: new THREE.MeshStandardMaterial({
        color: '#23272B',
        roughness: 0.48,
      }),
      craneCrimson: new THREE.MeshBasicMaterial({
        color: '#E02B2B',
      }),
      craneBeak: new THREE.MeshStandardMaterial({
        color: '#E6A832',
        roughness: 0.38,
      }),
      hoofDark: new THREE.MeshStandardMaterial({
        color: '#2A201B',
        roughness: 0.6,
      }),
      eyeGloss: new THREE.MeshBasicMaterial({
        color: '#17110E',
      }),
      catchlight: new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
      }),
      pinkNose: new THREE.MeshBasicMaterial({
        color: '#F48B95',
      }),
      celOutline: new THREE.MeshBasicMaterial({
        color: '#2B201A',
        side: THREE.BackSide,
      }),
      groundShadow: new THREE.MeshBasicMaterial({
        color: '#2E4A21',
        transparent: true,
        opacity: 0.28,
      }),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Animate Sika Deer Herd (Strolling & Grazing)
    for (let i = 0; i < DEER_HERD.length; i++) {
      const cfg = DEER_HERD[i];
      const root = deerRefs.current[i];
      const neck = deerNeckRefs.current[i];
      const legs = deerLegsRefs.current[i];
      if (!root) continue;

      if (cfg.mode === 'stroll' && cfg.patrolRadius > 0) {
        const angle = t * cfg.speed + cfg.phase;
        const px = cfg.centerX + Math.sin(angle) * cfg.patrolRadius;
        const pz = cfg.centerZ + Math.cos(angle) * (cfg.patrolRadius * 0.72);
        const dx = Math.cos(angle) * cfg.patrolRadius * cfg.speed;
        const dz = -Math.sin(angle) * (cfg.patrolRadius * 0.72) * cfg.speed;

        root.position.set(px, Math.abs(Math.sin(t * 5.2 + cfg.phase)) * 0.025, pz);
        root.rotation.y = Math.atan2(dx, dz);

        if (neck) {
          neck.rotation.x = 0.22 + Math.sin(t * 3.2 + cfg.phase) * 0.06;
          neck.rotation.y = Math.sin(t * 1.4 + cfg.phase) * 0.12;
        }
        if (legs) {
          const swing = Math.sin(t * 5.2 + cfg.phase) * 0.42;
          legs.children[0].rotation.x = swing;
          legs.children[1].rotation.x = -swing;
          legs.children[2].rotation.x = -swing;
          legs.children[3].rotation.x = swing;
        }
      } else {
        // Gentle grazing animation: dips head to nibble lush green grass, then looks around
        const grazeWave = Math.sin(t * 1.1 + cfg.phase);
        const dip = grazeWave > 0.15 ? 0.82 + Math.sin(t * 6.5) * 0.04 : 0.2;
        if (neck) {
          neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, dip, 0.08);
          neck.rotation.y = grazeWave <= 0.15 ? Math.sin(t * 1.6 + cfg.phase) * 0.28 : 0;
        }
      }
    }

    // 2. Animate Fluffy White Meadow Sheep
    for (let i = 0; i < SHEEP_FLOCK.length; i++) {
      const cfg = SHEEP_FLOCK[i];
      const root = sheepRefs.current[i];
      const head = sheepHeadRefs.current[i];
      const legs = sheepLegsRefs.current[i];
      if (!root) continue;

      if (cfg.mode === 'stroll' && cfg.patrolRadius > 0) {
        const angle = t * cfg.speed + cfg.phase;
        const px = cfg.centerX + Math.cos(angle) * cfg.patrolRadius;
        const pz = cfg.centerZ + Math.sin(angle) * (cfg.patrolRadius * 0.75);
        const dx = -Math.sin(angle) * cfg.patrolRadius * cfg.speed;
        const dz = Math.cos(angle) * (cfg.patrolRadius * 0.75) * cfg.speed;

        root.position.set(px, Math.abs(Math.sin(t * 4.8 + cfg.phase)) * 0.02, pz);
        root.rotation.y = Math.atan2(dx, dz);

        if (head) {
          head.rotation.x = 0.1 + Math.sin(t * 3.5 + cfg.phase) * 0.05;
        }
        if (legs) {
          const swing = Math.sin(t * 4.8 + cfg.phase) * 0.36;
          legs.children[0].rotation.x = swing;
          legs.children[1].rotation.x = -swing;
          legs.children[2].rotation.x = -swing;
          legs.children[3].rotation.x = swing;
        }
      } else if (head) {
        const graze = Math.sin(t * 1.3 + cfg.phase) > 0 ? 0.52 + Math.sin(t * 7.0) * 0.03 : 0.08;
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, graze, 0.08);
        head.rotation.y = Math.sin(t * 1.5 + cfg.phase) * 0.18;
      }
    }

    // 3. Animate Red-Crowned Shanshui Cranes
    for (let i = 0; i < CRANE_FLOCK.length; i++) {
      const cfg = CRANE_FLOCK[i];
      const neck = craneNeckRefs.current[i];
      if (!neck) continue;
      const bow = Math.sin(t * 1.2 + cfg.phase) > 0.45 ? 0.58 : 0.12 + Math.sin(t * 2.0 + cfg.phase) * 0.06;
      neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, bow, 0.07);
      neck.rotation.y = Math.cos(t * 1.4 + cfg.phase) * 0.22;
    }

    // 4. Animate Hopping Meadow Bunnies
    for (let i = 0; i < BUNNY_GROUP.length; i++) {
      const cfg = BUNNY_GROUP[i];
      const root = bunnyRefs.current[i];
      if (!root) continue;
      const angle = t * cfg.speed + cfg.phase;
      const hopPhase = (t * 3.8 + cfg.phase) % (Math.PI * 2);
      const hopY = Math.max(0, Math.sin(hopPhase)) * 0.18;
      const px = cfg.centerX + Math.sin(angle) * cfg.radius;
      const pz = cfg.centerZ + Math.cos(angle) * cfg.radius;
      const dx = Math.cos(angle) * cfg.radius;
      const dz = -Math.sin(angle) * cfg.radius;

      root.position.set(px, hopY, pz);
      root.rotation.y = Math.atan2(dx, dz);
      root.rotation.x = -Math.cos(hopPhase) * 0.15 * (hopY > 0.01 ? 1 : 0);
    }
  });

  return (
    <group>
      {/* =================================================================== */}
      {/* 1. GRACEFUL SPOTTED SIKA DEER HERD (High-Detail Sculpted 3D Render) */}
      {/* =================================================================== */}
      {DEER_HERD.map((deer, idx) => (
        <group
          key={deer.id}
          ref={(el) => {
            deerRefs.current[idx] = el;
          }}
          position={[deer.centerX, 0, deer.centerZ]}
          rotation={[0, deer.phase, 0]}
          scale={[deer.scale, deer.scale, deer.scale]}
          onClick={(e) => {
            e.stopPropagation();
            onRoadClick(e.point);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(`🦌 ${deer.name} — Grazing in the Lush Green Meadow (Click to walk here)`);
          }}
          onPointerOut={() => onHover(null)}
        >
          {/* Soft Meadow Shadow Disc */}
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.groundShadow}>
            <circleGeometry args={[0.52, 20]} />
          </mesh>

          {/* 4 Articulated Slender Deer Legs & Hooves */}
          <group
            ref={(el) => {
              deerLegsRefs.current[idx] = el;
            }}
          >
            {[
              [-0.12, 0.42, 0.24],
              [0.12, 0.42, 0.24],
              [-0.13, 0.42, -0.26],
              [0.13, 0.42, -0.26],
            ].map(([lx, ly, lz], lIdx) => (
              <group key={`leg-${lIdx}`} position={[lx, ly, lz]}>
                <mesh position={[0, -0.18, 0]} material={mats.deerCoat} castShadow>
                  <capsuleGeometry args={[0.036, 0.28, 6, 10]} />
                </mesh>
                <mesh position={[0, -0.37, 0.01]} material={mats.hoofDark}>
                  <cylinderGeometry args={[0.034, 0.042, 0.06, 10]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Sculpted Chestnut Torso + Cream Underbelly + Sumi-e Cel Outline */}
          <mesh
            position={[0, 0.5, 0]}
            rotation={[Math.PI * 0.5, 0, 0]}
            scale={[0.92, 1.0, 1.08]}
            material={mats.deerCoat}
            castShadow
            receiveShadow
          >
            <capsuleGeometry args={[0.21, 0.44, 12, 18]} />
          </mesh>
          <mesh
            position={[0, 0.5, 0]}
            rotation={[Math.PI * 0.5, 0, 0]}
            scale={[0.96, 1.03, 1.12]}
            material={mats.celOutline}
          >
            <capsuleGeometry args={[0.21, 0.44, 10, 14]} />
          </mesh>
          <mesh
            position={[0, 0.42, 0.02]}
            rotation={[Math.PI * 0.5, 0, 0]}
            scale={[0.78, 0.92, 0.72]}
            material={mats.deerBelly}
          >
            <capsuleGeometry args={[0.18, 0.4, 10, 14]} />
          </mesh>

          {/* Iconic White Dappled Sika Deer Spots along the Back */}
          {[
            [-0.14, 0.62, 0.12],
            [0.14, 0.62, 0.12],
            [-0.16, 0.58, -0.04],
            [0.16, 0.58, -0.04],
            [-0.13, 0.61, -0.18],
            [0.13, 0.61, -0.18],
          ].map(([sx, sy, sz], sIdx) => (
            <mesh key={`spot-${sIdx}`} position={[sx, sy, sz]} material={mats.deerSpot}>
              <sphereGeometry args={[0.028, 8, 8]} />
            </mesh>
          ))}

          {/* Fluffy White Deer Tail */}
          <mesh
            position={[0, 0.58, -0.44]}
            rotation={[-0.45, 0, 0]}
            material={mats.deerBelly}
            castShadow
          >
            <coneGeometry args={[0.055, 0.16, 10]} />
          </mesh>

          {/* Articulated Slender Neck, Head, Glossy Eyes, Ears & Stag Antlers */}
          <group
            ref={(el) => {
              deerNeckRefs.current[idx] = el;
            }}
            position={[0, 0.62, 0.28]}
            rotation={[0.22, 0, 0]}
          >
            {/* Neck & White Chest Bib */}
            <mesh position={[0, 0.18, 0.06]} rotation={[0.28, 0, 0]} material={mats.deerCoat} castShadow>
              <capsuleGeometry args={[0.095, 0.28, 10, 14]} />
            </mesh>
            <mesh position={[0, 0.16, 0.11]} rotation={[0.28, 0, 0]} material={mats.deerBelly}>
              <capsuleGeometry args={[0.068, 0.24, 8, 12]} />
            </mesh>

            {/* Sculpted Deer Head & Snout */}
            <group position={[0, 0.38, 0.14]} rotation={[-0.18, 0, 0]}>
              <mesh scale={[0.92, 0.95, 1.15]} material={mats.deerCoat} castShadow>
                <sphereGeometry args={[0.125, 18, 16]} />
              </mesh>
              <mesh
                position={[0, -0.025, 0.12]}
                rotation={[Math.PI * 0.5, 0, 0]}
                material={mats.deerCoat}
                castShadow
              >
                <capsuleGeometry args={[0.062, 0.11, 8, 12]} />
              </mesh>
              {/* Wet Black Nose */}
              <mesh position={[0, -0.015, 0.2]} material={mats.hoofDark}>
                <sphereGeometry args={[0.028, 10, 10]} />
              </mesh>

              {/* Expressive Glossy Eyes + Catchlights */}
              <mesh position={[0.088, 0.02, 0.055]} material={mats.eyeGloss}>
                <sphereGeometry args={[0.022, 10, 10]} />
              </mesh>
              <mesh position={[0.098, 0.028, 0.065]} material={mats.catchlight}>
                <sphereGeometry args={[0.008, 6, 6]} />
              </mesh>
              <mesh position={[-0.088, 0.02, 0.055]} material={mats.eyeGloss}>
                <sphereGeometry args={[0.022, 10, 10]} />
              </mesh>
              <mesh position={[-0.098, 0.028, 0.065]} material={mats.catchlight}>
                <sphereGeometry args={[0.008, 6, 6]} />
              </mesh>

              {/* Perky Leaf-Shaped Ears */}
              <mesh
                position={[0.11, 0.1, -0.03]}
                rotation={[-0.2, 0, -0.65]}
                scale={[0.55, 1.2, 0.35]}
                material={mats.deerCoat}
                castShadow
              >
                <sphereGeometry args={[0.065, 10, 10]} />
              </mesh>
              <mesh
                position={[-0.11, 0.1, -0.03]}
                rotation={[-0.2, 0, 0.65]}
                scale={[0.55, 1.2, 0.35]}
                material={mats.deerCoat}
                castShadow
              >
                <sphereGeometry args={[0.065, 10, 10]} />
              </mesh>

              {/* Majestic Branching Ivory Antlers on Stags */}
              {deer.isStag && (
                <group position={[0, 0.11, -0.02]}>
                  {[-1, 1].map((side) => (
                    <group key={`antler-${side}`} position={[side * 0.06, 0, 0]}>
                      <mesh
                        position={[side * 0.04, 0.14, -0.02]}
                        rotation={[-0.15, 0, side * -0.32]}
                        material={mats.deerAntler}
                        castShadow
                      >
                        <cylinderGeometry args={[0.01, 0.022, 0.32, 8]} />
                      </mesh>
                      <mesh
                        position={[side * 0.08, 0.16, 0.04]}
                        rotation={[0.45, 0, side * -0.55]}
                        material={mats.deerAntler}
                      >
                        <coneGeometry args={[0.014, 0.14, 8]} />
                      </mesh>
                      <mesh
                        position={[side * 0.09, 0.25, -0.03]}
                        rotation={[-0.25, 0, side * -0.68]}
                        material={mats.deerAntler}
                      >
                        <coneGeometry args={[0.012, 0.13, 8]} />
                      </mesh>
                    </group>
                  ))}
                </group>
              )}
            </group>
          </group>
        </group>
      ))}

      {/* =================================================================== */}
      {/* 2. FLUFFY WHITE MEADOW SHEEP & LAMBS (Multi-Puffed Wool Coats)      */}
      {/* =================================================================== */}
      {SHEEP_FLOCK.map((sheep, idx) => (
        <group
          key={sheep.id}
          ref={(el) => {
            sheepRefs.current[idx] = el;
          }}
          position={[sheep.centerX, 0, sheep.centerZ]}
          rotation={[0, sheep.phase, 0]}
          scale={[sheep.scale, sheep.scale, sheep.scale]}
          onClick={(e) => {
            e.stopPropagation();
            onRoadClick(e.point);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(`🐑 ${sheep.name} — Grazing in the Green Pastures (Click to stroll here)`);
          }}
          onPointerOut={() => onHover(null)}
        >
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.groundShadow}>
            <circleGeometry args={[0.44, 18]} />
          </mesh>

          {/* 4 Sheep Legs */}
          <group
            ref={(el) => {
              sheepLegsRefs.current[idx] = el;
            }}
          >
            {[
              [-0.11, 0.24, 0.16],
              [0.11, 0.24, 0.16],
              [-0.11, 0.24, -0.16],
              [0.11, 0.24, -0.16],
            ].map(([lx, ly, lz], lIdx) => (
              <group key={`sleg-${lIdx}`} position={[lx, ly, lz]}>
                <mesh position={[0, -0.11, 0]} material={mats.sheepFace} castShadow>
                  <capsuleGeometry args={[0.034, 0.14, 6, 10]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Multi-Lobed Fluffy White Wool Fleece */}
          <group position={[0, 0.38, 0]}>
            <mesh scale={[1.12, 0.96, 1.32]} material={mats.sheepWool} castShadow receiveShadow>
              <sphereGeometry args={[0.25, 18, 16]} />
            </mesh>
            <mesh scale={[1.16, 1.0, 1.36]} material={mats.celOutline}>
              <sphereGeometry args={[0.25, 14, 12]} />
            </mesh>
            {[
              [0.12, 0.08, 0.1, 0.15],
              [-0.12, 0.08, 0.1, 0.15],
              [0.13, 0.06, -0.1, 0.15],
              [-0.13, 0.06, -0.1, 0.15],
              [0, 0.13, 0, 0.16],
              [0, 0.04, -0.24, 0.13],
            ].map(([wx, wy, wz, wr], wIdx) => (
              <mesh key={`wool-${wIdx}`} position={[wx, wy, wz]} material={mats.sheepWool} castShadow>
                <sphereGeometry args={[wr, 14, 12]} />
              </mesh>
            ))}
          </group>

          {/* Sculpted Sheep Head, Wool Crown, Floppy Ears & Pink Nose */}
          <group
            ref={(el) => {
              sheepHeadRefs.current[idx] = el;
            }}
            position={[0, 0.44, 0.28]}
          >
            <mesh
              position={[0, 0, 0.06]}
              rotation={[0.25, 0, 0]}
              scale={[0.88, 0.92, 1.18]}
              material={mats.sheepFace}
              castShadow
            >
              <sphereGeometry args={[0.115, 16, 14]} />
            </mesh>
            {/* Fluffy Wool Tuft on Forehead */}
            <mesh position={[0, 0.095, 0.03]} material={mats.sheepWool} castShadow>
              <sphereGeometry args={[0.092, 12, 12]} />
            </mesh>
            {/* Glossy Eyes & Catchlights */}
            <mesh position={[0.078, 0.015, 0.11]} material={mats.eyeGloss}>
              <sphereGeometry args={[0.018, 8, 8]} />
            </mesh>
            <mesh position={[0.085, 0.022, 0.12]} material={mats.catchlight}>
              <sphereGeometry args={[0.007, 6, 6]} />
            </mesh>
            <mesh position={[-0.078, 0.015, 0.11]} material={mats.eyeGloss}>
              <sphereGeometry args={[0.018, 8, 8]} />
            </mesh>
            <mesh position={[-0.085, 0.022, 0.12]} material={mats.catchlight}>
              <sphereGeometry args={[0.007, 6, 6]} />
            </mesh>
            {/* Cute Pink Nose */}
            <mesh position={[0, -0.02, 0.19]} material={mats.pinkNose}>
              <sphereGeometry args={[0.02, 8, 8]} />
            </mesh>
            {/* Floppy Side Ears */}
            <mesh
              position={[0.11, 0.03, 0.02]}
              rotation={[0, 0, -0.45]}
              scale={[1.1, 0.42, 0.55]}
              material={mats.sheepFace}
            >
              <sphereGeometry args={[0.055, 10, 10]} />
            </mesh>
            <mesh
              position={[-0.11, 0.03, 0.02]}
              rotation={[0, 0, 0.45]}
              scale={[1.1, 0.42, 0.55]}
              material={mats.sheepFace}
            >
              <sphereGeometry args={[0.055, 10, 10]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* =================================================================== */}
      {/* 3. NOBLE RED-CROWNED SHANSHUI CRANES (By the Meadow Pond & Banks)   */}
      {/* =================================================================== */}
      {CRANE_FLOCK.map((crane, idx) => (
        <group
          key={crane.id}
          position={[crane.x, 0, crane.z]}
          rotation={[0, crane.yaw, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onRoadClick(e.point);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover('🦢 Red-Crowned Shanshui Crane — Meadow Sanctuary (Click to walk here)');
          }}
          onPointerOut={() => onHover(null)}
        >
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.groundShadow}>
            <circleGeometry args={[0.32, 16]} />
          </mesh>

          {/* Slender Stilt Legs */}
          <mesh position={[-0.045, 0.24, 0]} material={mats.hoofDark} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.48, 8]} />
          </mesh>
          <mesh position={[0.045, 0.24, 0]} material={mats.hoofDark} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.48, 8]} />
          </mesh>

          {/* Snow-White Plumage Body & Black Tail Feathers */}
          <mesh
            position={[0, 0.48, 0]}
            rotation={[0.2, 0, 0]}
            scale={[0.82, 0.88, 1.38]}
            material={mats.craneWhite}
            castShadow
          >
            <sphereGeometry args={[0.17, 16, 14]} />
          </mesh>
          <mesh
            position={[0, 0.44, -0.22]}
            rotation={[-0.45, 0, 0]}
            scale={[0.85, 0.55, 1.1]}
            material={mats.craneBlack}
            castShadow
          >
            <coneGeometry args={[0.12, 0.24, 12]} />
          </mesh>

          {/* Graceful S-Curved Crane Neck, Crimson Crown & Golden Beak */}
          <group
            ref={(el) => {
              craneNeckRefs.current[idx] = el;
            }}
            position={[0, 0.56, 0.16]}
          >
            <mesh position={[0, 0.18, 0.04]} rotation={[0.18, 0, 0]} material={mats.craneWhite} castShadow>
              <capsuleGeometry args={[0.036, 0.32, 8, 12]} />
            </mesh>
            <mesh position={[0, 0.12, 0.02]} rotation={[0.18, 0, 0]} material={mats.craneBlack}>
              <capsuleGeometry args={[0.038, 0.14, 8, 10]} />
            </mesh>
            <group position={[0, 0.38, 0.08]}>
              <mesh material={mats.craneWhite} castShadow>
                <sphereGeometry args={[0.056, 12, 12]} />
              </mesh>
              {/* Iconic Red Crown Cap */}
              <mesh position={[0, 0.045, 0.01]} material={mats.craneCrimson}>
                <sphereGeometry args={[0.034, 10, 10]} />
              </mesh>
              {/* Tapered Golden Beak */}
              <mesh
                position={[0, -0.005, 0.11]}
                rotation={[Math.PI * 0.5, 0, 0]}
                material={mats.craneBeak}
              >
                <coneGeometry args={[0.018, 0.15, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      ))}

      {/* =================================================================== */}
      {/* 4. HOPPING SNOW-WHITE MEADOW BUNNIES                                */}
      {/* =================================================================== */}
      {BUNNY_GROUP.map((bunny, idx) => (
        <group
          key={bunny.id}
          ref={(el) => {
            bunnyRefs.current[idx] = el;
          }}
          position={[bunny.centerX, 0, bunny.centerZ]}
          onClick={(e) => {
            e.stopPropagation();
            onRoadClick(e.point);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover('🐇 Snow-White Meadow Bunny — Hopping through the Green Grass');
          }}
          onPointerOut={() => onHover(null)}
        >
          <mesh
            position={[0, 0.14, 0]}
            scale={[0.9, 0.88, 1.2]}
            material={mats.craneWhite}
            castShadow
          >
            <sphereGeometry args={[0.12, 14, 12]} />
          </mesh>
          <mesh position={[0, 0.22, 0.1]} material={mats.craneWhite} castShadow>
            <sphereGeometry args={[0.085, 12, 12]} />
          </mesh>
          {/* Long Bunny Ears */}
          <mesh
            position={[0.032, 0.33, 0.08]}
            rotation={[-0.2, 0, -0.15]}
            scale={[0.45, 1.2, 0.35]}
            material={mats.craneWhite}
          >
            <capsuleGeometry args={[0.025, 0.09, 6, 8]} />
          </mesh>
          <mesh
            position={[-0.032, 0.33, 0.08]}
            rotation={[-0.2, 0, 0.15]}
            scale={[0.45, 1.2, 0.35]}
            material={mats.craneWhite}
          >
            <capsuleGeometry args={[0.025, 0.09, 6, 8]} />
          </mesh>
          {/* Fluffy Cotton Tail & Pink Nose */}
          <mesh position={[0, 0.15, -0.14]} material={mats.craneWhite}>
            <sphereGeometry args={[0.042, 8, 8]} />
          </mesh>
          <mesh position={[0, 0.22, 0.18]} material={mats.pinkNose}>
            <sphereGeometry args={[0.015, 6, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
