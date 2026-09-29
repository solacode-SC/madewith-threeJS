import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  HALF_CITY_D,
  HALF_CITY_W,
  cellToWorld,
  resolveCityCollision,
  steerAroundObstacles,
} from '../../domain/cityLayout';

interface VillageNpcsProps {
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  waveTimerRef: React.MutableRefObject<number>;
  onRoadClick: (point: THREE.Vector3) => void;
  onHover: (label: string | null) => void;
}

type AgeGroup = 'adult' | 'child';
type HairStyle =
  | 'twin-tails'
  | 'odango-buns'
  | 'bob-clip'
  | 'braided-bun'
  | 'spiky-boy'
  | 'topknot'
  | 'straw-hat';
type LowerStyle = 'hakama-skirt' | 'shorts-socks';
type PropType = 'none' | 'staff' | 'basket' | 'fan';

interface NpcConfig {
  id: string;
  name: string;
  jpName: string;
  role: string;
  ageGroup: AgeGroup;
  scale: number;
  speed: number;
  hairStyle: HairStyle;
  lowerStyle: LowerStyle;
  prop: PropType;
  hasBeard?: boolean;
  hairColor: string;
  eyeColor: string;
  coatColor: string;
  innerColor: string;
  lowerColor: string;
  sashColor: string;
  accentColor: string;
  waypoints: Array<[number, number]>;
  phase: number;
}

const pSquare = cellToWorld(6, 5);
const pArch = cellToWorld(5, 4);
const pCenterFront = cellToWorld(5, 5);
const pStoneLane = cellToWorld(5, 6);
const pEastRoad = cellToWorld(5, 8);
const pPineTerrace = cellToWorld(3, 3);
const pUpperCross = cellToWorld(3, 5);
const pMapleGrove = cellToWorld(3, 7);
const pSouthGate = cellToWorld(9, 5);
const pLanternAlley = cellToWorld(8, 8);
const pNorthBelvedere = cellToWorld(1, 5);
const pWestCourt = cellToWorld(6, 2);

const VILLAGE_NPCS: NpcConfig[] = [
  // =========================================================================
  // 1. CITY STREETS & COURTYARDS — ADULTS & CHILDREN
  // =========================================================================
  {
    id: 'npc-aoi',
    name: 'Aoi',
    jpName: '葵',
    role: 'Watercolor Painter (Adult)',
    ageGroup: 'adult',
    scale: 0.98,
    speed: 1.25,
    hairStyle: 'braided-bun',
    lowerStyle: 'hakama-skirt',
    prop: 'fan',
    hairColor: '#2B1D28',
    eyeColor: '#6C4696',
    coatColor: '#8E6BB8',
    innerColor: '#FFF9F2',
    lowerColor: '#4A3B69',
    sashColor: '#F5B041',
    accentColor: '#F48B95',
    waypoints: [
      [pSquare.x - 1.4, pSquare.z + 0.8],
      [pSquare.x + 2.2, pSquare.z + 1.4],
      [pCenterFront.x + 1.5, pCenterFront.z + 0.5],
      [pArch.x + 1.2, pArch.z + 0.6],
    ],
    phase: 0.2,
  },
  {
    id: 'npc-mei',
    name: 'Mei',
    jpName: '芽衣',
    role: 'Twin-Tail Maple Girl (Child)',
    ageGroup: 'child',
    scale: 0.68,
    speed: 1.85,
    hairStyle: 'twin-tails',
    lowerStyle: 'hakama-skirt',
    prop: 'basket',
    hairColor: '#4A281D',
    eyeColor: '#D95326',
    coatColor: '#F26430',
    innerColor: '#FFFDF7',
    lowerColor: '#C83E2B',
    sashColor: '#FFD166',
    accentColor: '#FF5C77',
    waypoints: [
      [pSquare.x + 0.6, pSquare.z + 2.2],
      [pSquare.x - 1.8, pSquare.z - 0.8],
      [pCenterFront.x - 0.8, pCenterFront.z + 1.2],
      [pSquare.x + 2.4, pSquare.z + 0.4],
    ],
    phase: 1.4,
  },
  {
    id: 'npc-kenta',
    name: 'Kenta',
    jpName: '健太',
    role: 'Spirited Village Boy (Child)',
    ageGroup: 'child',
    scale: 0.71,
    speed: 2.05,
    hairStyle: 'spiky-boy',
    lowerStyle: 'shorts-socks',
    prop: 'none',
    hairColor: '#241B18',
    eyeColor: '#2E77B8',
    coatColor: '#2E77B8',
    innerColor: '#FFF8EE',
    lowerColor: '#2C3E50',
    sashColor: '#F79D42',
    accentColor: '#E64833',
    waypoints: [
      [pSquare.x - 0.6, pSquare.z + 4.5],
      [pSquare.x - 0.4, pSquare.z - 1.5],
      [pStoneLane.x, pStoneLane.z + 0.8],
      [pSquare.x + 1.2, pSquare.z + 3.2],
    ],
    phase: 2.6,
  },
  {
    id: 'npc-haruki',
    name: 'Master Haruki',
    jpName: '春樹',
    role: 'Tea Pavilion Host (Adult)',
    ageGroup: 'adult',
    scale: 1.04,
    speed: 1.18,
    hairStyle: 'topknot',
    lowerStyle: 'hakama-skirt',
    prop: 'fan',
    hairColor: '#1E242B',
    eyeColor: '#2E5B70',
    coatColor: '#2C4D6B',
    innerColor: '#F7F3EB',
    lowerColor: '#3B4854',
    sashColor: '#D49B4B',
    accentColor: '#588BAE',
    waypoints: [
      [pArch.x - 0.8, pArch.z],
      [pCenterFront.x, pCenterFront.z - 0.4],
      [pStoneLane.x + 1.2, pStoneLane.z - 0.4],
      [pCenterFront.x - 1.5, pCenterFront.z + 0.6],
    ],
    phase: 0.9,
  },
  {
    id: 'npc-koharu',
    name: 'Koharu',
    jpName: '小春',
    role: 'Curious Apprentice Girl (Child)',
    ageGroup: 'child',
    scale: 0.66,
    speed: 1.78,
    hairStyle: 'bob-clip',
    lowerStyle: 'hakama-skirt',
    prop: 'none',
    hairColor: '#3B2620',
    eyeColor: '#388E7A',
    coatColor: '#4BA3C7',
    innerColor: '#FFFFFF',
    lowerColor: '#365D75',
    sashColor: '#F7B750',
    accentColor: '#F48B95',
    waypoints: [
      [pWestCourt.x + 1.0, pWestCourt.z],
      [pArch.x - 1.2, pArch.z + 1.0],
      [pSquare.x - 2.0, pSquare.z],
      [pWestCourt.x + 3.5, pWestCourt.z + 0.5],
    ],
    phase: 3.5,
  },
  {
    id: 'npc-ren',
    name: 'Ren',
    jpName: '蓮',
    role: 'Master Timber Craftsman (Adult)',
    ageGroup: 'adult',
    scale: 1.06,
    speed: 1.32,
    hairStyle: 'spiky-boy',
    lowerStyle: 'shorts-socks',
    prop: 'none',
    hairColor: '#2C1D16',
    eyeColor: '#8C4A27',
    coatColor: '#B86538',
    innerColor: '#F9EFE2',
    lowerColor: '#3D3028',
    sashColor: '#E69A38',
    accentColor: '#D94A2B',
    waypoints: [
      [pStoneLane.x + 0.5, pStoneLane.z],
      [pEastRoad.x - 1.0, pEastRoad.z],
      [pEastRoad.x - 1.0, pEastRoad.z + 6.5],
      [pStoneLane.x + 0.5, pStoneLane.z + 6.5],
    ],
    phase: 4.1,
  },
  {
    id: 'npc-gennai',
    name: 'Elder Gennai',
    jpName: '源内',
    role: 'Shanshui Calligrapher (Adult Elder)',
    ageGroup: 'adult',
    scale: 0.96,
    speed: 0.95,
    hairStyle: 'topknot',
    lowerStyle: 'hakama-skirt',
    prop: 'staff',
    hasBeard: true,
    hairColor: '#E6E4DF',
    eyeColor: '#4A5D52',
    coatColor: '#56755A',
    innerColor: '#FAF5EB',
    lowerColor: '#3D4F40',
    sashColor: '#C99642',
    accentColor: '#8CA88E',
    waypoints: [
      [pPineTerrace.x, pPineTerrace.z],
      [pUpperCross.x, pUpperCross.z],
      [pMapleGrove.x - 1.5, pMapleGrove.z],
      [pUpperCross.x, pUpperCross.z + 0.4],
    ],
    phase: 1.9,
  },
  {
    id: 'npc-satsuki',
    name: 'Satsuki',
    jpName: '皐月',
    role: 'Maple Blossom Girl (Child)',
    ageGroup: 'child',
    scale: 0.69,
    speed: 1.82,
    hairStyle: 'twin-tails',
    lowerStyle: 'hakama-skirt',
    prop: 'fan',
    hairColor: '#5C3024',
    eyeColor: '#C94A6A',
    coatColor: '#F47B92',
    innerColor: '#FFF9F5',
    lowerColor: '#8E3B52',
    sashColor: '#FFE066',
    accentColor: '#FF5C77',
    waypoints: [
      [pMapleGrove.x, pMapleGrove.z + 0.4],
      [pUpperCross.x + 1.2, pUpperCross.z - 0.4],
      [pMapleGrove.x + 4.5, pMapleGrove.z + 0.4],
    ],
    phase: 2.2,
  },
  {
    id: 'npc-sho',
    name: 'Sho',
    jpName: '翔',
    role: 'Acorn & Pine Boy (Child)',
    ageGroup: 'child',
    scale: 0.7,
    speed: 1.92,
    hairStyle: 'spiky-boy',
    lowerStyle: 'shorts-socks',
    prop: 'none',
    hairColor: '#33221A',
    eyeColor: '#448852',
    coatColor: '#4E9A5B',
    innerColor: '#FFF9EC',
    lowerColor: '#364A3A',
    sashColor: '#F5A63B',
    accentColor: '#E86434',
    waypoints: [
      [pMapleGrove.x + 1.5, pMapleGrove.z - 0.4],
      [pPineTerrace.x + 2.0, pPineTerrace.z + 0.5],
      [pUpperCross.x - 1.0, pUpperCross.z + 0.4],
    ],
    phase: 5.0,
  },
  {
    id: 'npc-hinata',
    name: 'Hinata',
    jpName: '日向',
    role: 'Silk Lantern Weaver (Adult)',
    ageGroup: 'adult',
    scale: 0.99,
    speed: 1.24,
    hairStyle: 'braided-bun',
    lowerStyle: 'hakama-skirt',
    prop: 'basket',
    hairColor: '#2A1B1E',
    eyeColor: '#B84238',
    coatColor: '#D94E44',
    innerColor: '#FFF8F0',
    lowerColor: '#4D2B32',
    sashColor: '#F5B848',
    accentColor: '#FF9E66',
    waypoints: [
      [pLanternAlley.x, pLanternAlley.z],
      [pSouthGate.x + 2.5, pSouthGate.z - 1.2],
      [pSquare.x + 1.5, pSquare.z + 6.2],
    ],
    phase: 0.7,
  },

  // =========================================================================
  // 2. OUT-OF-CITY LUSH GREEN MEADOW LAND — ADULTS & CHILDREN
  // =========================================================================
  {
    id: 'npc-yuzuki',
    name: 'Yuzuki',
    jpName: '柚月',
    role: 'Meadow Herbalist (Adult)',
    ageGroup: 'adult',
    scale: 0.99,
    speed: 1.26,
    hairStyle: 'braided-bun',
    lowerStyle: 'hakama-skirt',
    prop: 'basket',
    hairColor: '#261C18',
    eyeColor: '#3A8258',
    coatColor: '#3E9668',
    innerColor: '#FFFBF2',
    lowerColor: '#2E5442',
    sashColor: '#F4A83E',
    accentColor: '#F68E9B',
    waypoints: [
      [pSouthGate.x - 1.2, pSouthGate.z + 2.0],
      [-1.8, HALF_CITY_D + 9.5],
      [2.6, HALF_CITY_D + 12.5],
      [1.2, HALF_CITY_D + 5.2],
    ],
    phase: 1.1,
  },
  {
    id: 'npc-taro',
    name: 'Taro',
    jpName: '太郎',
    role: 'Meadow Deer Friend (Child)',
    ageGroup: 'child',
    scale: 0.68,
    speed: 1.95,
    hairStyle: 'straw-hat',
    lowerStyle: 'shorts-socks',
    prop: 'none',
    hairColor: '#36231B',
    eyeColor: '#B85A28',
    coatColor: '#E87A30',
    innerColor: '#FFFDF5',
    lowerColor: '#38523A',
    sashColor: '#FFD152',
    accentColor: '#E0422D',
    waypoints: [
      [-4.5, HALF_CITY_D + 7.2],
      [-8.5, HALF_CITY_D + 11.8],
      [-3.2, HALF_CITY_D + 13.5],
      [-1.5, HALF_CITY_D + 7.8],
    ],
    phase: 2.9,
  },
  {
    id: 'npc-hana',
    name: 'Hana',
    jpName: '花',
    role: 'Blossom & Crane Girl (Child)',
    ageGroup: 'child',
    scale: 0.65,
    speed: 1.75,
    hairStyle: 'odango-buns',
    lowerStyle: 'hakama-skirt',
    prop: 'basket',
    hairColor: '#3E2226',
    eyeColor: '#C44D70',
    coatColor: '#F6869C',
    innerColor: '#FFFFFF',
    lowerColor: '#B84262',
    sashColor: '#FFE070',
    accentColor: '#FFF099',
    waypoints: [
      [5.5, HALF_CITY_D + 8.5],
      [9.2, HALF_CITY_D + 12.2],
      [6.8, HALF_CITY_D + 15.2],
      [3.8, HALF_CITY_D + 10.5],
    ],
    phase: 4.4,
  },
  {
    id: 'npc-sora',
    name: 'Sora',
    jpName: '空',
    role: 'Green Pasture Shepherd (Adult)',
    ageGroup: 'adult',
    scale: 1.05,
    speed: 1.15,
    hairStyle: 'straw-hat',
    lowerStyle: 'shorts-socks',
    prop: 'staff',
    hairColor: '#2E221A',
    eyeColor: '#3E6E8E',
    coatColor: '#C9843B',
    innerColor: '#FAF3E6',
    lowerColor: '#3E4A3D',
    sashColor: '#588E62',
    accentColor: '#E05A32',
    waypoints: [
      [-13.5, HALF_CITY_D + 7.5],
      [-17.8, HALF_CITY_D + 12.0],
      [-12.0, HALF_CITY_D + 14.5],
      [-10.5, HALF_CITY_D + 8.5],
    ],
    phase: 3.2,
  },
  {
    id: 'npc-yuuta',
    name: 'Yuuta',
    jpName: '佑太',
    role: 'Pasture Breeze Boy (Child)',
    ageGroup: 'child',
    scale: 0.7,
    speed: 1.9,
    hairStyle: 'spiky-boy',
    lowerStyle: 'shorts-socks',
    prop: 'none',
    hairColor: '#2B1F1A',
    eyeColor: '#2C789E',
    coatColor: '#F59E36',
    innerColor: '#FFFDF7',
    lowerColor: '#2E4358',
    sashColor: '#E04F33',
    accentColor: '#3BA3C7',
    waypoints: [
      [HALF_CITY_W + 4.5, 2.5],
      [HALF_CITY_W + 10.8, 7.2],
      [HALF_CITY_W + 8.5, -3.5],
      [HALF_CITY_W + 3.8, -1.2],
    ],
    phase: 1.7,
  },
  {
    id: 'npc-kenshin',
    name: 'Kenshin',
    jpName: '謙信',
    role: 'Mountain Vista Traveler (Adult)',
    ageGroup: 'adult',
    scale: 1.04,
    speed: 1.28,
    hairStyle: 'straw-hat',
    lowerStyle: 'hakama-skirt',
    prop: 'staff',
    hairColor: '#1E2428',
    eyeColor: '#2E7082',
    coatColor: '#2E7E8E',
    innerColor: '#F7F4EC',
    lowerColor: '#2A3E48',
    sashColor: '#E6A23C',
    accentColor: '#D94E34',
    waypoints: [
      [pNorthBelvedere.x - 1.8, pNorthBelvedere.z],
      [pNorthBelvedere.x + 2.2, pNorthBelvedere.z - 4.5],
      [pNorthBelvedere.x - 2.5, pNorthBelvedere.z - 8.5],
      [pNorthBelvedere.x + 1.5, pNorthBelvedere.z - 1.2],
    ],
    phase: 5.4,
  },
];

interface NpcRuntimeState {
  x: number;
  z: number;
  yaw: number;
  waypointIdx: number;
  stridePhase: number;
  waveTimer: number;
  turnSign: number;
}

export default function VillageNpcs({
  characterPosRef,
  waveTimerRef,
  onRoadClick,
  onHover,
}: VillageNpcsProps) {
  const rootRefs = useRef<Array<THREE.Group | null>>([]);
  const bodyRefs = useRef<Array<THREE.Group | null>>([]);
  const headRefs = useRef<Array<THREE.Group | null>>([]);
  const leftArmRefs = useRef<Array<THREE.Group | null>>([]);
  const rightArmRefs = useRef<Array<THREE.Group | null>>([]);
  const leftLegRefs = useRef<Array<THREE.Group | null>>([]);
  const rightLegRefs = useRef<Array<THREE.Group | null>>([]);
  const leftEyeRefs = useRef<Array<THREE.Group | null>>([]);
  const rightEyeRefs = useRef<Array<THREE.Group | null>>([]);

  const runtimeRef = useRef<NpcRuntimeState[]>(
    VILLAGE_NPCS.map((npc) => ({
      x: npc.waypoints[0][0],
      z: npc.waypoints[0][1],
      yaw: 0,
      waypointIdx: 1 % npc.waypoints.length,
      stridePhase: npc.phase,
      waveTimer: 0,
      turnSign: 1,
    }))
  );

  const sharedMats = useMemo(() => {
    return {
      skin: new THREE.MeshStandardMaterial({
        color: '#FFF2E6',
        roughness: 0.44,
        emissive: '#FFE5D0',
        emissiveIntensity: 0.24,
      }),
      sclera: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      pupil: new THREE.MeshBasicMaterial({ color: '#1A0D0B' }),
      lash: new THREE.MeshBasicMaterial({ color: '#221410' }),
      blush: new THREE.MeshBasicMaterial({
        color: '#FF8A80',
        transparent: true,
        opacity: 0.76,
      }),
      smileMouth: new THREE.MeshBasicMaterial({ color: '#E05660' }),
      sockCream: new THREE.MeshStandardMaterial({
        color: '#FFFBF5',
        roughness: 0.5,
      }),
      bootsSepia: new THREE.MeshStandardMaterial({
        color: '#38271E',
        roughness: 0.48,
      }),
      strawGold: new THREE.MeshStandardMaterial({
        color: '#E8C574',
        roughness: 0.65,
        emissive: '#B88E3B',
        emissiveIntensity: 0.12,
      }),
      woodProp: new THREE.MeshStandardMaterial({
        color: '#8C5B3C',
        roughness: 0.58,
      }),
      inkOutline: new THREE.MeshBasicMaterial({
        color: '#241814',
        side: THREE.BackSide,
      }),
      groundShadow: new THREE.MeshBasicMaterial({
        color: '#2E241E',
        transparent: true,
        opacity: 0.26,
      }),
    };
  }, []);

  const npcCustomMats = useMemo(() => {
    return VILLAGE_NPCS.map((npc) => ({
      hair: new THREE.MeshStandardMaterial({
        color: npc.hairColor,
        roughness: 0.46,
        side: THREE.DoubleSide,
      }),
      eye: new THREE.MeshBasicMaterial({ color: npc.eyeColor }),
      coat: new THREE.MeshStandardMaterial({
        color: npc.coatColor,
        roughness: 0.5,
        emissive: npc.coatColor,
        emissiveIntensity: 0.12,
      }),
      inner: new THREE.MeshStandardMaterial({
        color: npc.innerColor,
        roughness: 0.52,
      }),
      lower: new THREE.MeshStandardMaterial({
        color: npc.lowerColor,
        roughness: 0.54,
      }),
      sash: new THREE.MeshStandardMaterial({
        color: npc.sashColor,
        roughness: 0.42,
        emissive: npc.sashColor,
        emissiveIntensity: 0.12,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: npc.accentColor,
        roughness: 0.45,
      }),
    }));
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.06);
    const elapsed = state.clock.getElapsedTime();
    const playerPos = characterPosRef.current;

    for (let i = 0; i < VILLAGE_NPCS.length; i++) {
      const cfg = VILLAGE_NPCS[i];
      const rt = runtimeRef.current[i];
      const root = rootRefs.current[i];
      const body = bodyRefs.current[i];
      const head = headRefs.current[i];
      const leftArm = leftArmRefs.current[i];
      const rightArm = rightArmRefs.current[i];
      const leftLeg = leftLegRefs.current[i];
      const rightLeg = rightLegRefs.current[i];
      const leftEye = leftEyeRefs.current[i];
      const rightEye = rightEyeRefs.current[i];

      if (!root) continue;

      if (rt.waveTimer > 0) {
        rt.waveTimer = Math.max(0, rt.waveTimer - dt);
      }

      // Check proximity to player Kaede for friendly greeting!
      const toPlayerX = playerPos.x - rt.x;
      const toPlayerZ = playerPos.z - rt.z;
      const distToPlayerSq = toPlayerX * toPlayerX + toPlayerZ * toPlayerZ;
      const isGreetingPlayer = distToPlayerSq < 12.5 || rt.waveTimer > 0;

      let currentSpeed = 0;

      if (isGreetingPlayer) {
        // Turn smoothly toward Kaede and wave!
        const targetYaw = Math.atan2(toPlayerX, toPlayerZ);
        let diff = targetYaw - rt.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rt.yaw += diff * Math.min(1, dt * 8.0);
        rt.stridePhase += dt * 2.2;
      } else {
        // Patrol smoothly along waypoints with obstacle avoidance
        const wp = cfg.waypoints[rt.waypointIdx];
        const dx = wp[0] - rt.x;
        const dz = wp[1] - rt.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.55) {
          rt.waypointIdx = (rt.waypointIdx + 1) % cfg.waypoints.length;
        } else {
          const steered = steerAroundObstacles(
            rt.x,
            rt.z,
            dx / dist,
            dz / dist,
            0.34,
            rt.turnSign
          );
          rt.turnSign = steered.turnSign;

          currentSpeed = cfg.speed;
          const nextX = rt.x + steered.dirX * currentSpeed * dt;
          const nextZ = rt.z + steered.dirZ * currentSpeed * dt;
          const resolved = resolveCityCollision(nextX, nextZ, 0.32);
          rt.x = resolved.x;
          rt.z = resolved.z;

          const moveYaw = Math.atan2(steered.dirX, steered.dirZ);
          let diff = moveYaw - rt.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          rt.yaw += diff * Math.min(1, dt * 10.0);
          rt.stridePhase += dt * (5.5 + currentSpeed * 2.0);
        }
      }

      const isChild = cfg.ageGroup === 'child';
      const stride = currentSpeed > 0.05 ? Math.sin(rt.stridePhase) : 0;
      const bounce =
        currentSpeed > 0.05
          ? Math.abs(Math.cos(rt.stridePhase)) * (isChild ? 0.065 : 0.038)
          : Math.sin(elapsed * 2.4 + cfg.phase) * 0.012;

      root.position.set(rt.x, 0, rt.z);
      root.rotation.y = rt.yaw;

      if (body) {
        body.position.y = bounce;
        body.rotation.x = currentSpeed > 0.05 ? (isChild ? 0.06 : 0.04) : 0;
        body.rotation.z = isChild && currentSpeed > 0.05 ? Math.sin(rt.stridePhase * 0.5) * 0.035 : 0;
      }

      if (head) {
        head.rotation.y = isGreetingPlayer
          ? Math.sin(elapsed * 2.5 + cfg.phase) * 0.08
          : Math.sin(elapsed * 1.4 + cfg.phase) * 0.12;
        head.rotation.z = isChild ? Math.sin(elapsed * 2.8 + cfg.phase) * 0.04 : 0;
      }

      // Expressive Anime Eye Blink
      const blinkCycle = (elapsed + cfg.phase * 1.3) % 3.8;
      const blinkY = blinkCycle > 3.64 ? 0.1 : 1.0;
      if (leftEye && rightEye) {
        leftEye.scale.y = blinkY;
        rightEye.scale.y = blinkY;
      }

      if (leftLeg && rightLeg) {
        const legSwing = stride * (isChild ? 0.62 : 0.48);
        leftLeg.rotation.x = legSwing;
        rightLeg.rotation.x = -legSwing;
      }

      if (leftArm && rightArm) {
        const armSwing = stride * (isChild ? 0.55 : 0.38);
        leftArm.rotation.x = -armSwing;
        leftArm.rotation.z = -0.26;

        if (isGreetingPlayer) {
          rightArm.rotation.x = -0.22;
          rightArm.rotation.z = 2.15 + Math.sin(elapsed * 10.5 + cfg.phase) * 0.28;
        } else {
          rightArm.rotation.x = cfg.prop === 'staff' ? 0.35 : armSwing;
          rightArm.rotation.z = 0.26;
        }
      }
    }
  });

  return (
    <group>
      {VILLAGE_NPCS.map((npc, idx) => {
        const m = npcCustomMats[idx];
        const isChild = npc.ageGroup === 'child';
        // Children have slightly larger chibi head ratio for unmistakable cute anime child proportions
        const headScale = isChild ? 1.15 : 1.0;

        return (
          <group
            key={npc.id}
            ref={(el) => {
              rootRefs.current[idx] = el;
            }}
            position={[npc.waypoints[0][0], 0, npc.waypoints[0][1]]}
            scale={[npc.scale, npc.scale, npc.scale]}
            onClick={(e) => {
              e.stopPropagation();
              runtimeRef.current[idx].waveTimer = 3.2;
              waveTimerRef.current = 2.6;
              onRoadClick(new THREE.Vector3(runtimeRef.current[idx].x, 0, runtimeRef.current[idx].z));
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              const badge = isChild ? '👧🧒 Child NPC' : '🧑✨ Adult NPC';
              onHover(
                `${badge} • ${npc.name} (${npc.jpName}) — ${npc.role} (Click to walk & greet)`
              );
            }}
            onPointerOut={() => onHover(null)}
          >
            {/* Ground Shadow Disc */}
            <mesh
              position={[0, 0.018, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              material={sharedMats.groundShadow}
            >
              <circleGeometry args={[0.29, 20]} />
            </mesh>

            <group
              ref={(el) => {
                bodyRefs.current[idx] = el;
              }}
            >
              {/* ============================================================= */}
              {/* 1. ARTICULATED LEGS, SOCKS & ANIME BOOTS                      */}
              {/* ============================================================= */}
              <group position={[0, 0.24, 0]}>
                <group
                  ref={(el) => {
                    leftLegRefs.current[idx] = el;
                  }}
                  position={[0.068, 0, 0]}
                >
                  <mesh position={[0, -0.04, 0]} material={sharedMats.sockCream} castShadow>
                    <cylinderGeometry args={[0.038, 0.034, 0.11, 12]} />
                  </mesh>
                  <mesh position={[0, -0.13, 0.012]} material={sharedMats.bootsSepia} castShadow>
                    <capsuleGeometry args={[0.042, 0.08, 6, 10]} />
                  </mesh>
                </group>

                <group
                  ref={(el) => {
                    rightLegRefs.current[idx] = el;
                  }}
                  position={[-0.068, 0, 0]}
                >
                  <mesh position={[0, -0.04, 0]} material={sharedMats.sockCream} castShadow>
                    <cylinderGeometry args={[0.038, 0.034, 0.11, 12]} />
                  </mesh>
                  <mesh position={[0, -0.13, 0.012]} material={sharedMats.bootsSepia} castShadow>
                    <capsuleGeometry args={[0.042, 0.08, 6, 10]} />
                  </mesh>
                </group>
              </group>

              {/* ============================================================= */}
              {/* 2. LOWER HAKAMA SKIRT OR SHORTS / TROUSERS                    */}
              {/* ============================================================= */}
              {npc.lowerStyle === 'hakama-skirt' ? (
                <group position={[0, 0.34, 0]}>
                  <mesh material={m.lower} castShadow>
                    <cylinderGeometry args={[0.125, 0.235, 0.26, 18]} />
                  </mesh>
                  <mesh material={sharedMats.inkOutline} scale={[1.04, 1.02, 1.04]}>
                    <cylinderGeometry args={[0.125, 0.235, 0.26, 14]} />
                  </mesh>
                  <mesh position={[0, -0.115, 0]} material={m.sash}>
                    <cylinderGeometry args={[0.228, 0.238, 0.02, 18]} />
                  </mesh>
                </group>
              ) : (
                <group position={[0, 0.35, 0]}>
                  <mesh material={m.lower} castShadow>
                    <cylinderGeometry args={[0.125, 0.165, 0.22, 16]} />
                  </mesh>
                  <mesh position={[0.065, -0.08, 0]} material={m.lower} castShadow>
                    <cylinderGeometry args={[0.058, 0.054, 0.12, 12]} />
                  </mesh>
                  <mesh position={[-0.065, -0.08, 0]} material={m.lower} castShadow>
                    <cylinderGeometry args={[0.058, 0.054, 0.12, 12]} />
                  </mesh>
                </group>
              )}

              {/* ============================================================= */}
              {/* 3. TORSO KIMONO / TUNIC, OBI SASH & HAORI JACKET              */}
              {/* ============================================================= */}
              <group position={[0, 0.54, 0]}>
                <mesh material={m.inner} castShadow>
                  <cylinderGeometry args={[0.112, 0.142, 0.24, 16]} />
                </mesh>
                {/* Obi Sash */}
                <mesh position={[0, -0.062, 0]} material={m.sash} castShadow>
                  <cylinderGeometry args={[0.142, 0.15, 0.078, 16]} />
                </mesh>
                {/* Back Obi Bow */}
                <mesh
                  position={[0, -0.055, -0.155]}
                  scale={[1.25, 0.75, 0.5]}
                  material={m.sash}
                  castShadow
                >
                  <sphereGeometry args={[0.065, 10, 10]} />
                </mesh>
                {/* Outer Haori Coat + Cel Outline */}
                <mesh position={[0, 0, -0.008]} material={m.coat} castShadow>
                  <cylinderGeometry
                    args={[0.125, 0.195, 0.25, 18, 1, false, Math.PI * 0.2, Math.PI * 1.6]}
                  />
                </mesh>
                <mesh
                  position={[0, 0, -0.008]}
                  material={sharedMats.inkOutline}
                  scale={[1.04, 1.02, 1.04]}
                >
                  <cylinderGeometry
                    args={[0.125, 0.195, 0.25, 14, 1, false, Math.PI * 0.2, Math.PI * 1.6]}
                  />
                </mesh>
                {/* Neck */}
                <mesh position={[0, 0.14, 0.01]} material={sharedMats.skin}>
                  <cylinderGeometry args={[0.048, 0.054, 0.058, 12]} />
                </mesh>
              </group>

              {/* ============================================================= */}
              {/* 4. SLEEVES, HANDS & HANDHELD PROPS                            */}
              {/* ============================================================= */}
              {/* Left Arm (-X) */}
              <group
                ref={(el) => {
                  leftArmRefs.current[idx] = el;
                }}
                position={[-0.125, 0.61, 0.01]}
              >
                <mesh
                  position={[-0.035, -0.09, 0]}
                  rotation={[0, 0, -0.2]}
                  material={m.coat}
                  castShadow
                >
                  <coneGeometry args={[0.072, 0.21, 12]} />
                </mesh>
                <mesh position={[-0.055, -0.19, 0.01]} material={sharedMats.skin}>
                  <sphereGeometry args={[0.034, 10, 10]} />
                </mesh>
                {npc.prop === 'basket' && (
                  <group position={[-0.08, -0.24, 0.03]}>
                    <mesh material={sharedMats.strawGold} castShadow>
                      <cylinderGeometry args={[0.065, 0.048, 0.09, 12]} />
                    </mesh>
                    <mesh position={[0, 0.05, 0]} material={m.accent}>
                      <sphereGeometry args={[0.048, 8, 8]} />
                    </mesh>
                  </group>
                )}
              </group>

              {/* Right Arm (+X) — Waves when greeting Kaede! */}
              <group
                ref={(el) => {
                  rightArmRefs.current[idx] = el;
                }}
                position={[0.125, 0.61, 0.01]}
              >
                <mesh
                  position={[0.035, -0.09, 0]}
                  rotation={[0, 0, 0.2]}
                  material={m.coat}
                  castShadow
                >
                  <coneGeometry args={[0.072, 0.21, 12]} />
                </mesh>
                <mesh position={[0.055, -0.19, 0.01]} material={sharedMats.skin}>
                  <sphereGeometry args={[0.034, 10, 10]} />
                </mesh>
                {npc.prop === 'staff' && (
                  <mesh
                    position={[0.07, -0.05, 0.06]}
                    rotation={[-0.2, 0, 0]}
                    material={sharedMats.woodProp}
                    castShadow
                  >
                    <cylinderGeometry args={[0.014, 0.012, 0.78, 8]} />
                  </mesh>
                )}
                {npc.prop === 'fan' && (
                  <mesh
                    position={[0.07, -0.19, 0.05]}
                    rotation={[0.4, 0.3, 0.5]}
                    scale={[1.0, 0.7, 0.15]}
                    material={m.accent}
                  >
                    <sphereGeometry args={[0.055, 10, 8]} />
                  </mesh>
                )}
              </group>

              {/* ============================================================= */}
              {/* 5. EXPRESSIVE ANIME HEAD, EYES, BLUSH, SMILE & HAIRSTYLE      */}
              {/* ============================================================= */}
              <group
                ref={(el) => {
                  headRefs.current[idx] = el;
                }}
                position={[0, 0.83, 0.015]}
                scale={[headScale, headScale, headScale]}
              >
                {/* Sculpted Anime Head Sphere + Cel Outline */}
                <mesh scale={[1.0, 0.96, 0.94]} material={sharedMats.skin} castShadow>
                  <sphereGeometry args={[0.155, 20, 18]} />
                </mesh>
                <mesh scale={[1.04, 1.0, 0.98]} material={sharedMats.inkOutline}>
                  <sphereGeometry args={[0.155, 16, 14]} />
                </mesh>

                {/* Rosy Anime Cheek Blush */}
                <mesh
                  position={[0.078, -0.025, 0.128]}
                  scale={[1.3, 0.72, 0.3]}
                  material={sharedMats.blush}
                >
                  <sphereGeometry args={[0.022, 8, 8]} />
                </mesh>
                <mesh
                  position={[-0.078, -0.025, 0.128]}
                  scale={[1.3, 0.72, 0.3]}
                  material={sharedMats.blush}
                >
                  <sphereGeometry args={[0.022, 8, 8]} />
                </mesh>

                {/* Cheerful Anime Smile */}
                <mesh
                  position={[0, -0.052, 0.144]}
                  rotation={[0.15, 0, 0]}
                  scale={[1.2, 0.75, 0.35]}
                  material={sharedMats.smileMouth}
                >
                  <sphereGeometry args={[0.022, 10, 8]} />
                </mesh>

                {/* Optional Elder Goatee Beard */}
                {npc.hasBeard && (
                  <mesh
                    position={[0, -0.12, 0.135]}
                    rotation={[0.2, 0, Math.PI]}
                    material={m.hair}
                  >
                    <coneGeometry args={[0.036, 0.11, 8]} />
                  </mesh>
                )}

                {/* Left & Right Anime Eyes with Catchlights */}
                {[-1, 1].map((side) => (
                  <group
                    key={`eye-${side}`}
                    ref={(el) => {
                      if (side === 1) leftEyeRefs.current[idx] = el;
                      else rightEyeRefs.current[idx] = el;
                    }}
                    position={[side * 0.056, 0.008, 0.136]}
                    rotation={[0, side * 0.18, 0]}
                  >
                    {/* White Sclera */}
                    <mesh scale={[0.95, 1.1, 0.35]} material={sharedMats.sclera}>
                      <sphereGeometry args={[0.032, 12, 10]} />
                    </mesh>
                    {/* Colored Iris */}
                    <mesh position={[0, -0.002, 0.006]} scale={[0.85, 1.0, 0.35]} material={m.eye}>
                      <sphereGeometry args={[0.025, 12, 10]} />
                    </mesh>
                    {/* Dark Pupil */}
                    <mesh
                      position={[0, -0.002, 0.011]}
                      scale={[0.75, 0.88, 0.35]}
                      material={sharedMats.pupil}
                    >
                      <sphereGeometry args={[0.014, 10, 8]} />
                    </mesh>
                    {/* Glossy White Catchlight */}
                    <mesh position={[side * 0.008, 0.01, 0.016]} material={sharedMats.sclera}>
                      <sphereGeometry args={[0.0075, 6, 6]} />
                    </mesh>
                    {/* Upper Eyelash Bar */}
                    <mesh
                      position={[0, 0.028, 0.008]}
                      rotation={[0, 0, side * -0.08]}
                      material={sharedMats.lash}
                    >
                      <boxGeometry args={[0.056, 0.009, 0.012]} />
                    </mesh>
                    {/* Eyebrow */}
                    <mesh
                      position={[0, 0.048, 0.006]}
                      rotation={[0, 0, side * -0.06]}
                      material={sharedMats.lash}
                    >
                      <boxGeometry args={[0.046, 0.006, 0.008]} />
                    </mesh>
                  </group>
                ))}

                {/* ========================================================= */}
                {/* ANIME HAIR DOME, FRONT BANGS & DISTINCT HAIRSTYLE         */}
                {/* ========================================================= */}
                <mesh
                  position={[0, 0.022, -0.012]}
                  scale={[1.06, 1.04, 1.06]}
                  material={m.hair}
                  castShadow
                >
                  <sphereGeometry args={[0.156, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.68]} />
                </mesh>

                {/* Sculpted Front Anime Bangs */}
                {[-0.075, -0.036, 0, 0.036, 0.075].map((bx, bIdx) => (
                  <mesh
                    key={`bang-${bIdx}`}
                    position={[bx, 0.068, 0.128 - Math.abs(bx) * 0.25]}
                    rotation={[0.25, 0, -bx * 1.6]}
                    material={m.hair}
                  >
                    <coneGeometry args={[0.028, 0.095, 8]} />
                  </mesh>
                ))}

                {/* Side Hair Locks */}
                <mesh
                  position={[0.142, -0.03, 0.045]}
                  rotation={[0.1, 0, 0.12]}
                  material={m.hair}
                >
                  <capsuleGeometry args={[0.026, 0.1, 6, 8]} />
                </mesh>
                <mesh
                  position={[-0.142, -0.03, 0.045]}
                  rotation={[0.1, 0, -0.12]}
                  material={m.hair}
                >
                  <capsuleGeometry args={[0.026, 0.1, 6, 8]} />
                </mesh>

                {/* Hairstyle Variations */}
                {npc.hairStyle === 'twin-tails' && (
                  <>
                    {[-1, 1].map((side) => (
                      <group key={`tail-${side}`} position={[side * 0.155, 0.03, -0.03]}>
                        <mesh material={m.accent}>
                          <sphereGeometry args={[0.032, 8, 8]} />
                        </mesh>
                        <mesh
                          position={[side * 0.045, -0.09, -0.02]}
                          rotation={[0.18, 0, side * -0.38]}
                          material={m.hair}
                          castShadow
                        >
                          <coneGeometry args={[0.052, 0.22, 10]} />
                        </mesh>
                      </group>
                    ))}
                  </>
                )}

                {npc.hairStyle === 'odango-buns' && (
                  <>
                    {[-1, 1].map((side) => (
                      <group key={`odango-${side}`} position={[side * 0.125, 0.135, -0.02]}>
                        <mesh material={m.hair} castShadow>
                          <sphereGeometry args={[0.054, 12, 10]} />
                        </mesh>
                        <mesh position={[side * -0.02, -0.02, 0.04]} material={m.accent}>
                          <sphereGeometry args={[0.024, 8, 8]} />
                        </mesh>
                      </group>
                    ))}
                  </>
                )}

                {npc.hairStyle === 'braided-bun' && (
                  <group position={[0, 0.04, -0.165]}>
                    <mesh material={m.hair} castShadow>
                      <sphereGeometry args={[0.068, 12, 10]} />
                    </mesh>
                    <mesh
                      position={[0.055, 0.03, 0.02]}
                      rotation={[0, 0, -0.55]}
                      material={m.accent}
                    >
                      <cylinderGeometry args={[0.008, 0.008, 0.16, 6]} />
                    </mesh>
                  </group>
                )}

                {npc.hairStyle === 'bob-clip' && (
                  <mesh position={[0.115, 0.065, 0.095]} material={m.accent}>
                    <sphereGeometry args={[0.028, 8, 8]} />
                  </mesh>
                )}

                {npc.hairStyle === 'topknot' && (
                  <group position={[0, 0.175, -0.03]}>
                    <mesh material={m.sash}>
                      <cylinderGeometry args={[0.028, 0.032, 0.03, 10]} />
                    </mesh>
                    <mesh position={[0, 0.045, -0.01]} rotation={[-0.35, 0, 0]} material={m.hair}>
                      <capsuleGeometry args={[0.032, 0.06, 6, 8]} />
                    </mesh>
                  </group>
                )}

                {npc.hairStyle === 'spiky-boy' && (
                  <group position={[0, 0.145, 0]}>
                    {[-0.06, 0, 0.06].map((sx, sIdx) => (
                      <mesh
                        key={`spike-${sIdx}`}
                        position={[sx, 0.02, -0.02]}
                        rotation={[-0.35, 0, -sx * 3.5]}
                        material={m.hair}
                      >
                        <coneGeometry args={[0.036, 0.09, 8]} />
                      </mesh>
                    ))}
                  </group>
                )}

                {npc.hairStyle === 'straw-hat' && (
                  <group position={[0, 0.135, -0.01]} rotation={[-0.12, 0, 0]}>
                    <mesh material={sharedMats.strawGold} castShadow>
                      <cylinderGeometry args={[0.25, 0.27, 0.022, 20]} />
                    </mesh>
                    <mesh position={[0, 0.055, 0]} material={sharedMats.strawGold} castShadow>
                      <sphereGeometry args={[0.135, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    </mesh>
                    <mesh position={[0, 0.022, 0]} material={m.accent}>
                      <cylinderGeometry args={[0.138, 0.138, 0.024, 16]} />
                    </mesh>
                  </group>
                )}
              </group>
            </group>
          </group>
        );
      })}
    </group>
  );
}
