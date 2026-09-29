import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SKY_MOOD_THEMES, type SkyMood } from '../../domain/skyConfig';
import {
  SKY_RINGS,
  getRiverCenterX,
  getRiverWaterY,
  getSurfaceOrBridgeHeight,
  getTerrainHeight,
} from '../../domain/villageLayout';

interface PastoralVillageLifeProps {
  skyMood: SkyMood;
  collectedRings: number[];
  planePosRef: React.MutableRefObject<THREE.Vector3>;
  onGroundClick: (point: THREE.Vector3) => void;
  onHover: (label: string | null) => void;
}

interface SheepActor {
  id: string;
  cx: number;
  cz: number;
  radius: number;
  speed: number;
  phase: number;
}

interface VillagerActor {
  id: string;
  name: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  speed: number;
  phase: number;
  coatColor: string;
  pantsColor: string;
  hasHat: boolean;
}

interface RiverBoatActor {
  id: string;
  name: string;
  minZ: number;
  maxZ: number;
  speed: number;
  phase: number;
  coatColor: string;
}

const SHEEP_HERD: SheepActor[] = [
  // Central West & Southwest Pastures
  { id: 'sheep-1', cx: -14.5, cz: -5.5, radius: 2.2, speed: 0.42, phase: 0.2 },
  { id: 'sheep-2', cx: -10.5, cz: -6.2, radius: 1.8, speed: 0.35, phase: 1.7 },
  { id: 'sheep-3', cx: -15.2, cz: -1.5, radius: 1.6, speed: 0.38, phase: 3.1 },
  { id: 'sheep-4', cx: -10.0, cz: 13.5, radius: 2.4, speed: 0.44, phase: 0.8 },
  { id: 'sheep-5', cx: -14.2, cz: 14.0, radius: 1.9, speed: 0.36, phase: 2.4 },
  { id: 'sheep-6', cx: -9.5, cz: 17.8, radius: 2.0, speed: 0.40, phase: 4.2 },
  { id: 'sheep-7', cx: 14.5, cz: 9.2, radius: 2.0, speed: 0.38, phase: 1.1 },
  { id: 'sheep-8', cx: 8.5, cz: 9.8, radius: 1.7, speed: 0.34, phase: 2.9 },
  { id: 'sheep-9', cx: 10.5, cz: -18.5, radius: 2.1, speed: 0.42, phase: 0.5 },
  { id: 'sheep-10', cx: 16.5, cz: -19.2, radius: 1.8, speed: 0.37, phase: 3.7 },
  // Eastern Riverbank Pastures
  { id: 'sheep-11', cx: 68.0, cz: 5.0, radius: 2.4, speed: 0.40, phase: 0.4 },
  { id: 'sheep-12', cx: 64.0, cz: -1.0, radius: 2.0, speed: 0.36, phase: 2.1 },
  { id: 'sheep-13', cx: 86.0, cz: -10.0, radius: 2.8, speed: 0.44, phase: 1.3 },
  { id: 'sheep-14', cx: 91.0, cz: -6.0, radius: 2.2, speed: 0.38, phase: 3.8 },
  { id: 'sheep-15', cx: 80.0, cz: 68.0, radius: 2.5, speed: 0.41, phase: 0.9 },
  { id: 'sheep-16', cx: 85.0, cz: 72.0, radius: 2.1, speed: 0.35, phase: 2.7 },
  // Northern Highland Pastures
  { id: 'sheep-17', cx: -18.0, cz: -70.0, radius: 2.6, speed: 0.39, phase: 1.5 },
  { id: 'sheep-18', cx: -13.0, cz: -74.0, radius: 2.2, speed: 0.43, phase: 4.0 },
  { id: 'sheep-19', cx: 4.0, cz: -66.0, radius: 2.0, speed: 0.37, phase: 0.6 },
  { id: 'sheep-20', cx: 62.0, cz: -42.0, radius: 2.3, speed: 0.40, phase: 2.3 },
  // Southern & Western Pastures
  { id: 'sheep-21', cx: -10.0, cz: 66.0, radius: 2.5, speed: 0.42, phase: 1.8 },
  { id: 'sheep-22', cx: 14.0, cz: 72.0, radius: 2.3, speed: 0.38, phase: 3.3 },
  { id: 'sheep-23', cx: -56.0, cz: 20.0, radius: 2.6, speed: 0.41, phase: 0.7 },
  { id: 'sheep-24', cx: -60.0, cz: 25.0, radius: 2.1, speed: 0.36, phase: 2.9 },
  { id: 'sheep-25', cx: -74.0, cz: -12.0, radius: 2.4, speed: 0.40, phase: 1.2 },
  { id: 'sheep-26', cx: -34.0, cz: 56.0, radius: 2.2, speed: 0.37, phase: 3.5 },
];

const VILLAGERS: VillagerActor[] = [
  // 1..4: Bridge Crossers walking right up and over the 4 Arched River Bridges!
  {
    id: 'villager-bridge-central',
    name: 'Aoi Crossing the Grand Arch Bridge',
    startX: 22.0,
    startZ: -11.0,
    endX: 54.0,
    endZ: -11.0,
    speed: 0.24,
    phase: 0.0,
    coatColor: '#D95B43',
    pantsColor: '#35485E',
    hasHat: true,
  },
  {
    id: 'villager-bridge-watermill',
    name: 'Old Miller Kenji on the Red Bridge',
    startX: 30.0,
    startZ: 12.0,
    endX: 58.0,
    endZ: 12.0,
    speed: 0.22,
    phase: 1.6,
    coatColor: '#3E788C',
    pantsColor: '#3D352E',
    hasHat: true,
  },
  {
    id: 'villager-bridge-north',
    name: 'Orchard Keeper Mei on North Truss Bridge',
    startX: 14.0,
    startZ: -56.0,
    endX: 42.0,
    endZ: -56.0,
    speed: 0.25,
    phase: 0.8,
    coatColor: '#E09A38',
    pantsColor: '#4A3B32',
    hasHat: true,
  },
  {
    id: 'villager-bridge-south',
    name: 'Weaver Haru on South Stone Bridge',
    startX: 38.0,
    startZ: 58.0,
    endX: 68.0,
    endZ: 58.0,
    speed: 0.23,
    phase: 2.4,
    coatColor: '#6B5B95',
    pantsColor: '#2F3640',
    hasHat: false,
  },
  // 5..18: Village Lane Strollers across all 3x Districts
  {
    id: 'villager-5',
    name: 'Mina the Shepherdess',
    startX: -1.5,
    startZ: 28.0,
    endX: -1.5,
    endZ: -8.0,
    speed: 0.20,
    phase: 0.3,
    coatColor: '#D96B43',
    pantsColor: '#3A4E38',
    hasHat: true,
  },
  {
    id: 'villager-6',
    name: 'Hana with Flower Basket',
    startX: -24.0,
    startZ: -11.0,
    endX: 16.0,
    endZ: -11.0,
    speed: 0.21,
    phase: 2.1,
    coatColor: '#E2A83E',
    pantsColor: '#523B35',
    hasHat: true,
  },
  {
    id: 'villager-7',
    name: 'Aviator Mechanic Taro',
    startX: -34.0,
    startZ: 30.0,
    endX: -12.0,
    endZ: 18.0,
    speed: 0.24,
    phase: 1.1,
    coatColor: '#4E8252',
    pantsColor: '#2E3A2F',
    hasHat: false,
  },
  {
    id: 'villager-8',
    name: 'Baker Yumi of East River Terrace',
    startX: 58.0,
    startZ: -28.0,
    endX: 59.0,
    endZ: 14.0,
    speed: 0.19,
    phase: 0.5,
    coatColor: '#C85A78',
    pantsColor: '#3B3238',
    hasHat: true,
  },
  {
    id: 'villager-9',
    name: 'Dairy Farmer Kenta',
    startX: 60.0,
    startZ: -11.0,
    endX: 92.0,
    endZ: -18.0,
    speed: 0.22,
    phase: 1.9,
    coatColor: '#487AA2',
    pantsColor: '#3A352F',
    hasHat: true,
  },
  {
    id: 'villager-10',
    name: 'Eastbank Herbalist Rin',
    startX: 60.0,
    startZ: 14.0,
    endX: 68.0,
    endZ: 54.0,
    speed: 0.20,
    phase: 2.8,
    coatColor: '#589A74',
    pantsColor: '#344238',
    hasHat: true,
  },
  {
    id: 'villager-11',
    name: 'North Highland Postman Ren',
    startX: -2.0,
    startZ: -26.0,
    endX: -4.0,
    endZ: -74.0,
    speed: 0.21,
    phase: 0.9,
    coatColor: '#3B5C85',
    pantsColor: '#283442',
    hasHat: false,
  },
  {
    id: 'villager-12',
    name: 'Woodcutter Daiki',
    startX: -42.0,
    startZ: -56.0,
    endX: -6.0,
    endZ: -56.0,
    speed: 0.22,
    phase: 1.4,
    coatColor: '#9E5438',
    pantsColor: '#382E28',
    hasHat: true,
  },
  {
    id: 'villager-13',
    name: 'South Cider Maker Sota',
    startX: -1.5,
    startZ: 34.0,
    endX: -1.5,
    endZ: 72.0,
    speed: 0.20,
    phase: 2.2,
    coatColor: '#C87838',
    pantsColor: '#3C342E',
    hasHat: true,
  },
  {
    id: 'villager-14',
    name: 'Potter Natsuki on West Lane',
    startX: -62.0,
    startZ: -20.0,
    endX: -26.0,
    endZ: -12.0,
    speed: 0.21,
    phase: 0.4,
    coatColor: '#7A8E48',
    pantsColor: '#383C2E',
    hasHat: true,
  },
  {
    id: 'villager-15',
    name: 'Windmill Apprentice Sora Jr.',
    startX: -46.0,
    startZ: -26.0,
    endX: -45.0,
    endZ: 14.0,
    speed: 0.23,
    phase: 1.7,
    coatColor: '#D4883A',
    pantsColor: '#343E48',
    hasHat: false,
  },
  {
    id: 'villager-16',
    name: 'Lavender Grower Emi',
    startX: 72.0,
    startZ: 58.0,
    endX: 98.0,
    endZ: 64.0,
    speed: 0.24,
    phase: 3.1,
    coatColor: '#8C6BAE',
    pantsColor: '#383042',
    hasHat: true,
  },
];

const RIVER_BOATS: RiverBoatActor[] = [
  {
    id: 'boat-central',
    name: 'River Ferryman’s Wooden Skiff',
    minZ: -44.0,
    maxZ: 4.0,
    speed: 0.16,
    phase: 0.2,
    coatColor: '#3E6B88',
  },
  {
    id: 'boat-south',
    name: 'Meadow Angler’s Rowboat',
    minZ: 18.0,
    maxZ: 50.0,
    speed: 0.18,
    phase: 1.8,
    coatColor: '#C86446',
  },
  {
    id: 'boat-north',
    name: 'Orchard Blossom Cargo Punt',
    minZ: -105.0,
    maxZ: -64.0,
    speed: 0.15,
    phase: 1.1,
    coatColor: '#5B8C5A',
  },
];

const BIRD_FLOCK_OFFSETS: [number, number, number][] = [
  [0, 0, 0],
  [-1.5, 0.2, -1.3],
  [1.5, 0.15, -1.3],
  [-2.9, 0.35, -2.6],
  [2.9, 0.3, -2.6],
  [-4.2, 0.5, -3.9],
  [4.2, 0.45, -3.9],
];

export default function PastoralVillageLife({
  skyMood,
  collectedRings,
  planePosRef,
  onGroundClick,
  onHover,
}: PastoralVillageLifeProps) {
  const sheepGroupRef = useRef<THREE.Group>(null);
  const villagersGroupRef = useRef<THREE.Group>(null);
  const boatsGroupRef = useRef<THREE.Group>(null);
  const birdsFlock1Ref = useRef<THREE.Group>(null);
  const birdsFlock2Ref = useRef<THREE.Group>(null);
  const skyRingsGroupRef = useRef<THREE.Group>(null);
  const firefliesGroupRef = useRef<THREE.Group>(null);

  const moodTheme = SKY_MOOD_THEMES[skyMood];

  const materials = useMemo(() => {
    return {
      sheepWool: new THREE.MeshStandardMaterial({
        color: '#F7F4E8',
        roughness: 0.88,
      }),
      sheepFace: new THREE.MeshStandardMaterial({
        color: '#38302A',
        roughness: 0.78,
      }),
      strawHat: new THREE.MeshStandardMaterial({
        color: '#EBD296',
        roughness: 0.8,
      }),
      hairDark: new THREE.MeshStandardMaterial({
        color: '#2C2420',
        roughness: 0.75,
      }),
      skinTone: new THREE.MeshStandardMaterial({
        color: '#FFE4CA',
        roughness: 0.68,
      }),
      apronCream: new THREE.MeshStandardMaterial({
        color: '#F5F2E8',
        roughness: 0.76,
      }),
      boatWood: new THREE.MeshStandardMaterial({
        color: '#8C684C',
        roughness: 0.8,
      }),
      boatWake: new THREE.MeshBasicMaterial({
        color: '#F2FCFA',
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      handLantern: new THREE.MeshStandardMaterial({
        color: '#FFF6D0',
        emissive: '#FFA834',
        emissiveIntensity: 1.8,
      }),
      fireflyGlow: new THREE.MeshBasicMaterial({
        color: '#FFE878',
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      inkOutline: new THREE.MeshBasicMaterial({
        color: '#1E241C',
        side: THREE.BackSide,
      }),
      birdWhite: new THREE.MeshBasicMaterial({
        color: '#FCFBF4',
        side: THREE.DoubleSide,
      }),
      windRibbonRing: new THREE.MeshBasicMaterial({
        color: '#FFF9DF',
        transparent: true,
        opacity: 0.58,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    };
  }, []);

  const fireflySeeds = useMemo(() => {
    const arr: { x: number; z: number; phase: number; speed: number }[] = [];
    for (let i = 0; i < 52; i++) {
      const z = -110 + (i / 52) * 220;
      const onRiver = i % 2 === 0;
      const x = onRiver
        ? getRiverCenterX(z) + Math.sin(i * 4.1) * 6.5
        : Math.cos(i * 2.7) * 55;
      arr.push({
        x,
        z,
        phase: i * 1.37,
        speed: 0.8 + (i % 5) * 0.25,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const planePos = planePosRef.current;

    // 1. Animate 26 Grazing & Trotting Meadow Sheep with Articulated Legs & Grazing Head
    if (sheepGroupRef.current) {
      const children = sheepGroupRef.current.children;
      for (let i = 0; i < SHEEP_HERD.length; i++) {
        const s = SHEEP_HERD[i];
        const grp = children[i];
        if (!grp) continue;

        // Alternate between walking and pausing to graze clover
        const cycle = Math.sin(t * 0.65 + s.phase);
        const isWalking = cycle > -0.25;
        const walkT = isWalking ? t * s.speed + s.phase : s.phase;

        const sx = s.cx + Math.cos(walkT) * s.radius;
        const sz = s.cz + Math.sin(walkT) * s.radius;
        const sy = getTerrainHeight(sx, sz);
        const hop = isWalking ? Math.abs(Math.sin(t * 5.2 + s.phase)) * 0.05 : 0;

        grp.position.set(sx, sy + hop, sz);
        if (isWalking) {
          grp.rotation.y = -walkT + Math.PI;
        }

        // Head group (child 2) dips down when grazing, bobs gently when walking
        const headGrp = grp.children[2];
        if (headGrp) {
          headGrp.rotation.x = isWalking
            ? Math.sin(t * 5.2 + s.phase) * 0.08
            : 0.48 + Math.sin(t * 8.0 + s.phase) * 0.08;
        }

        // 4 Articulated Legs (children 3, 4, 5, 6)
        const stride = isWalking ? Math.sin(t * 7.5 + s.phase) * 0.45 : 0;
        if (grp.children[3]) grp.children[3].rotation.x = stride;
        if (grp.children[4]) grp.children[4].rotation.x = -stride;
        if (grp.children[5]) grp.children[5].rotation.x = -stride;
        if (grp.children[6]) grp.children[6].rotation.x = stride;
      }
    }

    // 2. Animate 16 Articulated Villagers Walking Roads, Crossing Arched Bridges & Waving!
    if (villagersGroupRef.current) {
      const children = villagersGroupRef.current.children;
      for (let i = 0; i < VILLAGERS.length; i++) {
        const v = VILLAGERS[i];
        const grp = children[i];
        if (!grp) continue;

        // Triangle wave [0..1] for constant, smooth walking velocity along path
        const rawPhase = (t * v.speed + v.phase) % 2.0;
        const u = rawPhase <= 1.0 ? rawPhase : 2.0 - rawPhase;
        const dirSign = rawPhase <= 1.0 ? 1 : -1;

        const vx = THREE.MathUtils.lerp(v.startX, v.endX, u);
        const vz = THREE.MathUtils.lerp(v.startZ, v.endZ, u);
        // Uses getSurfaceOrBridgeHeight so bridge crossers walk smoothly up & over the 4 river bridges!
        const vy = getSurfaceOrBridgeHeight(vx, vz);

        const walkYaw = Math.atan2(
          (v.endX - v.startX) * dirSign,
          (v.endZ - v.startZ) * dirSign
        );

        const strideCycle = t * 7.8 + v.phase * 5.0;
        const verticalBounce = Math.abs(Math.cos(strideCycle)) * 0.055;
        grp.position.set(vx, vy + verticalBounce, vz);

        const distToPlane = Math.hypot(planePos.x - vx, planePos.z - vz);
        const isWavingAtPlane = distToPlane < 32.0;

        if (isWavingAtPlane) {
          const toPlaneYaw = Math.atan2(planePos.x - vx, planePos.z - vz);
          grp.rotation.y = THREE.MathUtils.lerp(grp.rotation.y, toPlaneYaw, 0.15);
        } else {
          grp.rotation.y = walkYaw;
        }

        // Articulated Limbs:
        // child 1 = headGrp, child 2 = leftArmPivot, child 3 = rightArmPivot, child 4 = leftLegPivot, child 5 = rightLegPivot
        const headGrp = grp.children[1];
        const leftArm = grp.children[2];
        const rightArm = grp.children[3];
        const leftLeg = grp.children[4];
        const rightLeg = grp.children[5];

        const legSwing = Math.sin(strideCycle) * 0.65;
        if (leftLeg) leftLeg.rotation.x = legSwing;
        if (rightLeg) rightLeg.rotation.x = -legSwing;

        if (leftArm) {
          leftArm.rotation.x = -legSwing * 0.85;
          leftArm.rotation.z = 0.08;
        }
        if (rightArm) {
          if (isWavingAtPlane) {
            // Raise right arm overhead & wave enthusiastically at the biplane!
            rightArm.rotation.x = -2.65;
            rightArm.rotation.z = -0.25 + Math.sin(t * 12.5 + i) * 0.38;
          } else {
            rightArm.rotation.x = legSwing * 0.85;
            rightArm.rotation.z = -0.08;
          }
        }
        if (headGrp) {
          headGrp.rotation.x = isWavingAtPlane ? -0.38 : Math.sin(strideCycle * 2.0) * 0.04;
        }
      }
    }

    // 3. Animate 3 Wooden River Rowboats & Rowing Boatmen along the Winding River
    if (boatsGroupRef.current) {
      const children = boatsGroupRef.current.children;
      for (let i = 0; i < RIVER_BOATS.length; i++) {
        const b = RIVER_BOATS[i];
        const grp = children[i];
        if (!grp) continue;

        const u = (Math.sin(t * b.speed + b.phase) + 1) * 0.5;
        const dirSign = Math.cos(t * b.speed + b.phase) >= 0 ? 1 : -1;
        const bz = THREE.MathUtils.lerp(b.minZ, b.maxZ, u);
        const bx = getRiverCenterX(bz);
        const by = getRiverWaterY(bz) + 0.08 + Math.sin(t * 2.8 + i) * 0.03;

        const nextZ = bz + dirSign * 1.5;
        const nextX = getRiverCenterX(nextZ);
        const boatYaw = Math.atan2(nextX - bx, nextZ - bz);

        grp.position.set(bx, by, bz);
        grp.rotation.set(Math.sin(t * 2.4 + i) * 0.03, boatYaw, Math.cos(t * 2.1 + i) * 0.04);

        // Animate Left & Right Rowing Oars (children 3 and 4)
        const oarCycle = t * 3.8 + b.phase;
        if (grp.children[3]) {
          grp.children[3].rotation.y = Math.sin(oarCycle) * 0.48;
          grp.children[3].rotation.z = 0.25 + Math.cos(oarCycle) * 0.18;
        }
        if (grp.children[4]) {
          grp.children[4].rotation.y = -Math.sin(oarCycle) * 0.48;
          grp.children[4].rotation.z = -0.25 - Math.cos(oarCycle) * 0.18;
        }
      }
    }

    // 4. Animate Flapping Bird Flocks across the Valley
    const animateBirdFlock = (
      flockGrp: THREE.Group | null,
      centerX: number,
      centerZ: number,
      rx: number,
      rz: number,
      alt: number,
      speed: number,
      phaseOff: number
    ) => {
      if (!flockGrp) return;
      const angle = t * speed + phaseOff;
      const fx = centerX + Math.cos(angle) * rx;
      const fz = centerZ + Math.sin(angle) * rz;
      flockGrp.position.set(fx, alt + Math.sin(t * 0.9 + phaseOff) * 1.5, fz);
      flockGrp.rotation.y = -angle;

      for (let i = 0; i < flockGrp.children.length; i++) {
        const bird = flockGrp.children[i];
        const flap = Math.sin(t * 8.2 + i * 0.9) * 0.48;
        if (bird.children[0]) bird.children[0].rotation.z = flap;
        if (bird.children[1]) bird.children[1].rotation.z = -flap;
      }
    };

    animateBirdFlock(birdsFlock1Ref.current, 12, 0, 42, 36, 16.5, 0.24, 0.0);
    animateBirdFlock(birdsFlock2Ref.current, 45, -18, 48, 42, 19.0, 0.20, 2.5);

    // 5. Animate Collectible Golden Wind-Spirit Sky Rings
    if (skyRingsGroupRef.current) {
      const children = skyRingsGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const ringGrp = children[i];
        if (!SKY_RINGS[i]) continue;
        ringGrp.rotation.z = t * 1.1 + i * 0.5;
        ringGrp.position.y = SKY_RINGS[i].y + Math.sin(t * 2.2 + i) * 0.28;
      }
    }

    // 6. Animate River & Pasture Fireflies (Evening & Night Modes)
    if (firefliesGroupRef.current) {
      const active = moodTheme.fireflyIntensity > 0.05;
      firefliesGroupRef.current.visible = active;
      if (active) {
        const children = firefliesGroupRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const f = fireflySeeds[i];
          const mesh = children[i];
          if (!f || !mesh) continue;
          const fx = f.x + Math.sin(t * f.speed + f.phase) * 1.4;
          const fz = f.z + Math.cos(t * f.speed * 0.8 + f.phase) * 1.4;
          const fy = getTerrainHeight(fx, fz) + 1.2 + Math.sin(t * 1.8 + f.phase) * 0.65;
          mesh.position.set(fx, fy, fz);
          const pulse = 0.4 + 0.7 * (Math.sin(t * 4.2 + f.phase) * 0.5 + 0.5);
          mesh.scale.setScalar(pulse * moodTheme.fireflyIntensity);
        }
      }
    }
  });

  const showNightLanterns = skyMood === 'starry-night' || skyMood === 'evening-sunset';

  return (
    <group>
      {/* ================================================================= */}
      {/* 1. 26 ARTICULATED GRAZING & TROTTING MEADOW SHEEP                 */}
      {/* ================================================================= */}
      <group ref={sheepGroupRef}>
        {SHEEP_HERD.map((s) => (
          <group
            key={s.id}
            onClick={(e) => {
              e.stopPropagation();
              onGroundClick(e.point);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover('Grazing Meadow Sheep • Click to fly over');
            }}
            onPointerOut={() => onHover(null)}
          >
            {/* Child 0: Wool Body */}
            <mesh position={[0, 0.36, 0]} material={materials.sheepWool} castShadow>
              <boxGeometry args={[0.50, 0.38, 0.70]} />
            </mesh>
            {/* Child 1: Wool Ink Outline */}
            <mesh position={[0, 0.36, 0]} material={materials.inkOutline}>
              <boxGeometry args={[0.56, 0.44, 0.76]} />
            </mesh>
            {/* Child 2: Articulated Grazing Head Group */}
            <group position={[0, 0.46, 0.34]}>
              <mesh position={[0, 0, 0.08]} material={materials.sheepFace} castShadow>
                <boxGeometry args={[0.26, 0.24, 0.28]} />
              </mesh>
              <mesh position={[0, 0.12, 0.04]} material={materials.sheepWool}>
                <boxGeometry args={[0.22, 0.10, 0.20]} />
              </mesh>
            </group>
            {/* Children 3..6: 4 Articulated Legs */}
            {[
              [-0.15, 0.18, 0.22],
              [0.15, 0.18, 0.22],
              [-0.15, 0.18, -0.22],
              [0.15, 0.18, -0.22],
            ].map(([lx, ly, lz], lIdx) => (
              <group key={`leg-${lIdx}`} position={[lx, ly, lz]}>
                <mesh position={[0, -0.08, 0]} material={materials.sheepFace}>
                  <boxGeometry args={[0.08, 0.22, 0.08]} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 2. 16 ARTICULATED WALKING & BRIDGE-CROSSING VILLAGERS             */}
      {/* ================================================================= */}
      <group ref={villagersGroupRef}>
        {VILLAGERS.map((v) => (
          <group
            key={v.id}
            onClick={(e) => {
              e.stopPropagation();
              onGroundClick(e.point);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(`${v.name} • Waving at Sora’s Biplane!`);
            }}
            onPointerOut={() => onHover(null)}
          >
            {/* Child 0: Torso Coat + Apron + Outline */}
            <group position={[0, 0.60, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.38, 0.50, 0.26]} />
                <meshStandardMaterial color={v.coatColor} roughness={0.76} />
              </mesh>
              <mesh material={materials.inkOutline}>
                <boxGeometry args={[0.44, 0.56, 0.32]} />
              </mesh>
              <mesh position={[0, -0.04, 0.14]} material={materials.apronCream}>
                <boxGeometry args={[0.28, 0.38, 0.03]} />
              </mesh>
            </group>

            {/* Child 1: Articulated Head + Hair + Straw Hat */}
            <group position={[0, 1.02, 0]}>
              <mesh material={materials.skinTone} castShadow>
                <sphereGeometry args={[0.17, 12, 10]} />
              </mesh>
              <mesh position={[0, 0.04, -0.03]} material={materials.hairDark}>
                <sphereGeometry args={[0.165, 10, 8]} />
              </mesh>
              {v.hasHat && (
                <group position={[0, 0.13, 0]}>
                  <mesh material={materials.strawHat} castShadow>
                    <cylinderGeometry args={[0.36, 0.38, 0.05, 14]} />
                  </mesh>
                  <mesh position={[0, 0.07, 0]} material={materials.strawHat}>
                    <cylinderGeometry args={[0.16, 0.19, 0.12, 12]} />
                  </mesh>
                </group>
              )}
            </group>

            {/* Child 2: Articulated Left Arm Pivot (with Evening/Night Hand Lantern!) */}
            <group position={[-0.25, 0.80, 0]}>
              <mesh position={[0, -0.18, 0]} castShadow>
                <boxGeometry args={[0.11, 0.38, 0.11]} />
                <meshStandardMaterial color={v.coatColor} roughness={0.78} />
              </mesh>
              <mesh position={[0, -0.38, 0]} material={materials.skinTone}>
                <sphereGeometry args={[0.06, 8, 8]} />
              </mesh>
              {showNightLanterns && (
                <mesh position={[0, -0.48, 0.08]} material={materials.handLantern}>
                  <boxGeometry args={[0.12, 0.16, 0.12]} />
                </mesh>
              )}
            </group>

            {/* Child 3: Articulated Right Arm Pivot (Swings when walking, waves high at biplane!) */}
            <group position={[0.25, 0.80, 0]}>
              <mesh position={[0, -0.18, 0]} castShadow>
                <boxGeometry args={[0.11, 0.38, 0.11]} />
                <meshStandardMaterial color={v.coatColor} roughness={0.78} />
              </mesh>
              <mesh position={[0, -0.38, 0]} material={materials.skinTone}>
                <sphereGeometry args={[0.06, 8, 8]} />
              </mesh>
            </group>

            {/* Child 4: Articulated Left Leg Pivot */}
            <group position={[-0.10, 0.36, 0]}>
              <mesh position={[0, -0.18, 0]} castShadow>
                <boxGeometry args={[0.13, 0.38, 0.13]} />
                <meshStandardMaterial color={v.pantsColor} roughness={0.82} />
              </mesh>
            </group>

            {/* Child 5: Articulated Right Leg Pivot */}
            <group position={[0.10, 0.36, 0]}>
              <mesh position={[0, -0.18, 0]} castShadow>
                <boxGeometry args={[0.13, 0.38, 0.13]} />
                <meshStandardMaterial color={v.pantsColor} roughness={0.82} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 3. ANIMATED WOODEN RIVER ROWBOATS & ROWING BOATMEN                */}
      {/* ================================================================= */}
      <group ref={boatsGroupRef}>
        {RIVER_BOATS.map((b) => (
          <group
            key={b.id}
            onClick={(e) => {
              e.stopPropagation();
              onGroundClick(e.point);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(`${b.name} • Cruising the Meadow River`);
            }}
            onPointerOut={() => onHover(null)}
          >
            {/* Child 0: Wooden Skiff Hull */}
            <mesh position={[0, 0.16, 0]} material={materials.boatWood} castShadow>
              <boxGeometry args={[1.15, 0.32, 2.75]} />
            </mesh>
            {/* Child 1: Hull Outline */}
            <mesh position={[0, 0.16, 0]} material={materials.inkOutline}>
              <boxGeometry args={[1.23, 0.38, 2.83]} />
            </mesh>
            {/* Child 2: Boatman + Bow Lantern + Water Wake */}
            <group>
              <mesh position={[0, 0.56, -0.2]} castShadow>
                <boxGeometry args={[0.36, 0.48, 0.26]} />
                <meshStandardMaterial color={b.coatColor} roughness={0.78} />
              </mesh>
              <mesh position={[0, 0.94, -0.2]} material={materials.skinTone}>
                <sphereGeometry args={[0.16, 10, 10]} />
              </mesh>
              <mesh position={[0, 1.06, -0.2]} material={materials.strawHat}>
                <cylinderGeometry args={[0.36, 0.38, 0.06, 12]} />
              </mesh>
              <mesh position={[0, 0.42, 1.25]} material={materials.handLantern}>
                <boxGeometry args={[0.18, 0.24, 0.18]} />
              </mesh>
              <mesh position={[0, 0.03, -0.2]} rotation={[-Math.PI * 0.5, 0, 0]} material={materials.boatWake}>
                <ringGeometry args={[0.95, 1.45, 18]} />
              </mesh>
            </group>
            {/* Child 3: Left Rowing Oar */}
            <group position={[-0.55, 0.32, -0.1]}>
              <mesh position={[-0.55, -0.08, 0]} material={materials.strawHat}>
                <boxGeometry args={[1.25, 0.05, 0.12]} />
              </mesh>
            </group>
            {/* Child 4: Right Rowing Oar */}
            <group position={[0.55, 0.32, -0.1]}>
              <mesh position={[0.55, -0.08, 0]} material={materials.strawHat}>
                <boxGeometry args={[1.25, 0.05, 0.12]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 4. SOARING FLOCKS OF WHITE MEADOW BIRDS WITH FLAPPING WINGS       */}
      {/* ================================================================= */}
      <group ref={birdsFlock1Ref}>
        {BIRD_FLOCK_OFFSETS.map(([bx, by, bz], idx) => (
          <group key={`bird1-${idx}`} position={[bx, by, bz]}>
            <group position={[-0.04, 0, 0]}>
              <mesh position={[-0.22, 0, 0]} material={materials.birdWhite}>
                <boxGeometry args={[0.46, 0.03, 0.16]} />
              </mesh>
            </group>
            <group position={[0.04, 0, 0]}>
              <mesh position={[0.22, 0, 0]} material={materials.birdWhite}>
                <boxGeometry args={[0.46, 0.03, 0.16]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      <group ref={birdsFlock2Ref}>
        {BIRD_FLOCK_OFFSETS.map(([bx, by, bz], idx) => (
          <group key={`bird2-${idx}`} position={[bx, by, bz]}>
            <group position={[-0.04, 0, 0]}>
              <mesh position={[-0.22, 0, 0]} material={materials.birdWhite}>
                <boxGeometry args={[0.46, 0.03, 0.16]} />
              </mesh>
            </group>
            <group position={[0.04, 0, 0]}>
              <mesh position={[0.22, 0, 0]} material={materials.birdWhite}>
                <boxGeometry args={[0.46, 0.03, 0.16]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 5. 24 GOLDEN WIND-SPIRIT SKY RINGS ACROSS THE 3X VALLEY           */}
      {/* ================================================================= */}
      <group ref={skyRingsGroupRef}>
        {SKY_RINGS.map((ring) => {
          const isCollected = collectedRings.includes(ring.id);
          return (
            <group
              key={ring.id}
              position={[ring.x, ring.y, ring.z]}
              rotation={[0, ring.yaw, 0]}
              visible={!isCollected}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHover(`${ring.name} • Fly through to collect!`);
              }}
              onPointerOut={() => onHover(null)}
            >
              <mesh material={materials.windRibbonRing}>
                <torusGeometry args={[1.65, 0.045, 10, 28]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ================================================================= */}
      {/* 6. EVENING & STARRY NIGHT DANCING RIVER FIREFLIES                 */}
      {/* ================================================================= */}
      <group ref={firefliesGroupRef}>
        {fireflySeeds.map((_, idx) => (
          <mesh key={`firefly-${idx}`} material={materials.fireflyGlow}>
            <sphereGeometry args={[0.14, 6, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
