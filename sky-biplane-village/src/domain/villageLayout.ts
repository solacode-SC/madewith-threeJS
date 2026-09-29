import * as THREE from 'three';

export type RoofVariant = 'teal-slate' | 'cedar-umber' | 'blue-slate' | 'moss-timber';

export interface HomesteadPlot {
  id: string;
  name: string;
  jpName: string;
  centerX: number;
  centerZ: number;
  plotWidth: number;
  plotDepth: number;
  gateSide: 'north' | 'south' | 'east' | 'west';
  cottageOffsetX: number;
  cottageOffsetZ: number;
  cottageWidth: number;
  cottageDepth: number;
  cottageHeight: number;
  cottageYaw: number;
  roofVariant: RoofVariant;
  hasChimney: boolean;
  hasShed: boolean;
  shedOffsetX: number;
  shedOffsetZ: number;
  shedYaw: number;
  shedRoofVariant: RoofVariant;
  hasUtilityPole: boolean;
}

export interface RiverBridgeConfig {
  id: string;
  name: string;
  jpName: string;
  z: number;
  span: number;
  width: number;
  archHeight: number;
  style: 'timber-arch' | 'vermilion-watermill' | 'timber-truss' | 'stone-arch';
}

export interface VillageLandmark {
  id: string;
  name: string;
  jpName: string;
  subtitle: string;
  x: number;
  z: number;
  flyAltitude: number;
  badgeColor: string;
}

export interface SkyRingItem {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

/**
 * Analytical meandering river centerline X coordinate for any Z position across the 3x valley.
 */
export function getRiverCenterX(z: number): number {
  return 36.0 + Math.sin(z * 0.022) * 12.0 + Math.cos(z * 0.011 - 0.6) * 6.5;
}

/**
 * Analytical half-width of the river water surface at any Z position.
 */
export function getRiverHalfWidth(z: number): number {
  return 5.2 + Math.sin(z * 0.035 + 1.1) * 0.65;
}

/**
 * Base terrain height (without riverbed carving) across the 3x expanded valley.
 */
export function getBaseValleyHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);

  // Gentle pastoral undulation across the 3x village basin (r < 135)
  const gentleWave =
    Math.sin(x * 0.024 + 0.4) * Math.cos(z * 0.021 - 0.3) * 0.72 +
    Math.sin((x + z) * 0.014) * 0.48;

  // Rolling outer hillside elevation (r > 130 out to 310)
  const hillMask = THREE.MathUtils.smoothstep(r, 128.0, 295.0);
  const ridgeWave =
    (Math.sin(x * 0.018 - 0.8) * Math.cos(z * 0.016 + 0.5) * 0.5 + 0.5) * 22.0 +
    (Math.cos(x * 0.031 + z * 0.027) * 0.5 + 0.5) * 9.5;

  return Math.max(0.15, gentleWave * (1.0 - hillMask * 0.3) + hillMask * ridgeWave);
}

/**
 * Continuous, analytical terrain height function for the 3x Meadow Valley, Village & Riverbed.
 */
export function getTerrainHeight(x: number, z: number): number {
  const baseH = getBaseValleyHeight(x, z);
  const riverCX = getRiverCenterX(z);
  const riverHalfW = getRiverHalfWidth(z);
  const bankOuterW = riverHalfW + 2.8;
  const distToRiver = Math.abs(x - riverCX);

  let riverCarve = 0;
  if (distToRiver < bankOuterW) {
    const u = distToRiver / bankOuterW;
    const smoothProfile = Math.cos(u * Math.PI * 0.5);
    riverCarve = -smoothProfile * smoothProfile * 1.95;
  }

  return baseH + riverCarve;
}

/**
 * Water surface elevation at Z along the river so the water sits cleanly inside its carved banks.
 */
export function getRiverWaterY(z: number): number {
  const cx = getRiverCenterX(z);
  const halfW = getRiverHalfWidth(z);
  const bankL = getBaseValleyHeight(cx - halfW, z);
  const bankR = getBaseValleyHeight(cx + halfW, z);
  return Math.min(bankL, bankR) - 0.42;
}

/**
 * 4 Iconic Arched Bridges crossing the animated river across the 3x Village.
 */
export const RIVER_BRIDGES: RiverBridgeConfig[] = [
  {
    id: 'bridge-north-truss',
    name: 'Northern Orchard Timber Truss Bridge',
    jpName: '北果樹園のトラス木橋',
    z: -56.0,
    span: 15.6,
    width: 4.2,
    archHeight: 1.75,
    style: 'timber-truss',
  },
  {
    id: 'bridge-central-arch',
    name: 'Grand Village Stone & Timber Arch Bridge',
    jpName: '中央大通りの太鼓橋',
    z: -11.0,
    span: 16.2,
    width: 4.6,
    archHeight: 1.95,
    style: 'timber-arch',
  },
  {
    id: 'bridge-watermill-crossing',
    name: 'Watermill Vermilion Footbridge',
    jpName: '水車小屋の朱塗り橋',
    z: 12.0,
    span: 15.2,
    width: 3.8,
    archHeight: 1.65,
    style: 'vermilion-watermill',
  },
  {
    id: 'bridge-south-stone',
    name: 'Southern Valley Stone Arch Bridge',
    jpName: '南渓谷の石造り眼鏡橋',
    z: 58.0,
    span: 16.0,
    width: 4.4,
    archHeight: 1.85,
    style: 'stone-arch',
  },
];

/**
 * Returns the surface elevation (terrain OR bridge deck if on a bridge) at world (x, z).
 * Used so walking villagers and characters smoothly climb up and over the river bridges!
 */
export function getSurfaceOrBridgeHeight(x: number, z: number): number {
  const terrainY = getTerrainHeight(x, z);

  for (let i = 0; i < RIVER_BRIDGES.length; i++) {
    const b = RIVER_BRIDGES[i];
    const dz = Math.abs(z - b.z);
    if (dz <= b.width * 0.65) {
      const cx = getRiverCenterX(b.z);
      const halfSpan = b.span * 0.5;
      const dx = Math.abs(x - cx);
      if (dx <= halfSpan + 1.2) {
        const u = THREE.MathUtils.clamp((x - cx) / halfSpan, -1, 1);
        const archLift = Math.cos(u * Math.PI * 0.5) * b.archHeight;
        const abutmentY = Math.max(
          getTerrainHeight(cx - halfSpan, b.z),
          getTerrainHeight(cx + halfSpan, b.z)
        );
        return Math.max(terrainY, abutmentY + 0.22 + archLift);
      }
    }
  }

  return terrainY;
}

/**
 * Computes the analytical surface normal of the terrain at (x, z) for ground-shadow & fence alignment.
 */
export function getTerrainNormal(x: number, z: number, target = new THREE.Vector3()): THREE.Vector3 {
  const eps = 0.4;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  target.set(hL - hR, 2.0 * eps, hD - hU).normalize();
  return target;
}

/**
 * 32 Fenced Pastoral Homestead Plots across the 3x Expanded Village & River Valley:
 * - Central Crossroads District (Plots 1..10)
 * - Eastern Riverbank Terrace District across the 4 Bridges (Plots 11..18)
 * - Northern Misty Orchard & Ridge District (Plots 19..24)
 * - Southern Riverside & Meadow Market District (Plots 25..28)
 * - Western Windmill & Pastoral Farmlands District (Plots 29..32)
 */
export const VILLAGE_HOMESTEADS: HomesteadPlot[] = [
  // ================= CENTRAL CROSSROADS DISTRICT (1..10) =================
  {
    id: 'homestead-south-green',
    name: 'Green Gable Porch Cottage',
    jpName: '緑屋根の玄関コテージ',
    centerX: 4.5,
    centerZ: 24.0,
    plotWidth: 16.5,
    plotDepth: 15.0,
    gateSide: 'west',
    cottageOffsetX: -1.2,
    cottageOffsetZ: 1.4,
    cottageWidth: 5.4,
    cottageDepth: 4.6,
    cottageHeight: 2.85,
    cottageYaw: -Math.PI * 0.5,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.0,
    shedOffsetZ: -2.2,
    shedYaw: 0,
    shedRoofVariant: 'blue-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-center-chimney',
    name: 'Twin-Shed Brick Chimney Farm',
    jpName: '赤煉瓦煙突と納屋の農家',
    centerX: 11.5,
    centerZ: 5.5,
    plotWidth: 19.0,
    plotDepth: 16.5,
    gateSide: 'west',
    cottageOffsetX: -1.8,
    cottageOffsetZ: 1.8,
    cottageWidth: 5.6,
    cottageDepth: 4.8,
    cottageHeight: 2.95,
    cottageYaw: -Math.PI * 0.5,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.2,
    shedOffsetZ: -1.6,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'blue-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-west-meadow',
    name: 'Emerald Pasture Homestead',
    jpName: '翠牧場の木造家屋',
    centerX: -12.5,
    centerZ: -3.5,
    plotWidth: 18.0,
    plotDepth: 16.0,
    gateSide: 'east',
    cottageOffsetX: -1.5,
    cottageOffsetZ: -1.2,
    cottageWidth: 5.3,
    cottageDepth: 4.5,
    cottageHeight: 2.8,
    cottageYaw: Math.PI * 0.5,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -5.2,
    shedOffsetZ: 3.2,
    shedYaw: 0,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-northeast-sun',
    name: 'Sunbeam Orchard Cottage',
    jpName: '朝陽と木漏れ日の家',
    centerX: 12.5,
    centerZ: -18.5,
    plotWidth: 18.0,
    plotDepth: 15.5,
    gateSide: 'west',
    cottageOffsetX: 1.2,
    cottageOffsetZ: 0.4,
    cottageWidth: 5.5,
    cottageDepth: 4.6,
    cottageHeight: 2.9,
    cottageYaw: -Math.PI * 0.5,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.2,
    shedOffsetZ: -2.8,
    shedYaw: 0,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-northwest-pole',
    name: 'Telegraph Lane Barn & Cottage',
    jpName: '電信柱の小道と青屋根の家',
    centerX: -13.0,
    centerZ: -22.5,
    plotWidth: 17.5,
    plotDepth: 15.5,
    gateSide: 'east',
    cottageOffsetX: 0.8,
    cottageOffsetZ: -1.0,
    cottageWidth: 5.4,
    cottageDepth: 4.7,
    cottageHeight: 2.85,
    cottageYaw: 0,
    roofVariant: 'blue-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.8,
    shedOffsetZ: 2.6,
    shedYaw: Math.PI * 0.5,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-southwest-pasture',
    name: 'Clover Meadow Grazing Yard',
    jpName: 'クローバー草地の牧柵',
    centerX: -12.0,
    centerZ: 15.5,
    plotWidth: 17.5,
    plotDepth: 16.0,
    gateSide: 'east',
    cottageOffsetX: -3.2,
    cottageOffsetZ: 2.8,
    cottageWidth: 4.8,
    cottageDepth: 4.2,
    cottageHeight: 2.65,
    cottageYaw: Math.PI * 0.5,
    roofVariant: 'moss-timber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.4,
    shedOffsetZ: -3.0,
    shedYaw: 0,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: false,
  },
  {
    id: 'homestead-farwest-orchard',
    name: 'Western Apple-Tree Farmstead',
    jpName: '西の果樹園コテージ',
    centerX: -32.5,
    centerZ: -4.0,
    plotWidth: 16.5,
    plotDepth: 15.0,
    gateSide: 'south',
    cottageOffsetX: 0.0,
    cottageOffsetZ: -1.8,
    cottageWidth: 5.2,
    cottageDepth: 4.4,
    cottageHeight: 2.8,
    cottageYaw: 0,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.0,
    shedOffsetZ: 2.2,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-north-overlook',
    name: 'Misty Ridge Timber Lodge',
    jpName: '朝霧の北嶺ロッジ',
    centerX: 4.0,
    centerZ: -38.0,
    plotWidth: 18.0,
    plotDepth: 15.0,
    gateSide: 'west',
    cottageOffsetX: -1.4,
    cottageOffsetZ: -1.5,
    cottageWidth: 5.6,
    cottageDepth: 4.6,
    cottageHeight: 2.95,
    cottageYaw: -Math.PI * 0.5,
    roofVariant: 'blue-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.5,
    shedOffsetZ: 1.2,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'moss-timber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-southeast-brook',
    name: 'West-Bank Miller’s Cottage',
    jpName: '川畔の水車番コテージ',
    centerX: 22.5,
    centerZ: 24.5,
    plotWidth: 16.0,
    plotDepth: 14.5,
    gateSide: 'north',
    cottageOffsetX: -1.0,
    cottageOffsetZ: 1.5,
    cottageWidth: 5.2,
    cottageDepth: 4.5,
    cottageHeight: 2.85,
    cottageYaw: Math.PI,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: false,
    shedOffsetX: 0,
    shedOffsetZ: 0,
    shedYaw: 0,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-farsouth-gate',
    name: 'Southern Country Gatehouse',
    jpName: '南街道の牧場番屋',
    centerX: -11.5,
    centerZ: 36.5,
    plotWidth: 16.5,
    plotDepth: 14.5,
    gateSide: 'east',
    cottageOffsetX: -1.2,
    cottageOffsetZ: 0.0,
    cottageWidth: 5.0,
    cottageDepth: 4.4,
    cottageHeight: 2.75,
    cottageYaw: Math.PI * 0.5,
    roofVariant: 'blue-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.2,
    shedOffsetZ: -3.2,
    shedYaw: 0,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },

  // ================= EASTERN RIVERBANK TERRACE DISTRICT (11..18) =================
  {
    id: 'homestead-east-bridge-inn',
    name: 'East Bridge Lantern Bakery & Inn',
    jpName: '東橋畔のベーカリー宿',
    centerX: 64.0,
    centerZ: -22.0,
    plotWidth: 18.5,
    plotDepth: 16.0,
    gateSide: 'south',
    cottageOffsetX: -1.0,
    cottageOffsetZ: -1.4,
    cottageWidth: 5.8,
    cottageDepth: 4.8,
    cottageHeight: 3.05,
    cottageYaw: 0,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.5,
    shedOffsetZ: 1.8,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-east-river-terrace',
    name: 'Riverview Willow Villa',
    jpName: '柳並木の川見邸',
    centerX: 66.0,
    centerZ: 2.0,
    plotWidth: 18.0,
    plotDepth: 16.0,
    gateSide: 'north',
    cottageOffsetX: 0.8,
    cottageOffsetZ: 1.2,
    cottageWidth: 5.5,
    cottageDepth: 4.6,
    cottageHeight: 2.9,
    cottageYaw: Math.PI,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.2,
    shedOffsetZ: 2.0,
    shedYaw: Math.PI * 0.5,
    shedRoofVariant: 'blue-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-east-watermill-garden',
    name: 'Eastbank Flower & Herb Homestead',
    jpName: '東岸ハーブ園のコテージ',
    centerX: 70.0,
    centerZ: 24.0,
    plotWidth: 17.5,
    plotDepth: 15.5,
    gateSide: 'north',
    cottageOffsetX: -1.2,
    cottageOffsetZ: 1.5,
    cottageWidth: 5.3,
    cottageDepth: 4.5,
    cottageHeight: 2.85,
    cottageYaw: Math.PI,
    roofVariant: 'blue-slate',
    hasChimney: true,
    hasShed: false,
    shedOffsetX: 0,
    shedOffsetZ: 0,
    shedYaw: 0,
    shedRoofVariant: 'moss-timber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-east-meadow-ranch',
    name: 'Sunrise Hill Dairy Farmstead',
    jpName: '東丘の朝陽酪農牧場',
    centerX: 88.0,
    centerZ: -8.0,
    plotWidth: 19.5,
    plotDepth: 17.0,
    gateSide: 'west',
    cottageOffsetX: 1.5,
    cottageOffsetZ: -1.0,
    cottageWidth: 5.8,
    cottageDepth: 4.9,
    cottageHeight: 3.0,
    cottageYaw: -Math.PI * 0.5,
    roofVariant: 'moss-timber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.6,
    shedOffsetZ: 3.4,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-east-north-grove',
    name: 'Northeast Truss-Bridge Apiary',
    jpName: '北東橋の養蜂コテージ',
    centerX: 62.0,
    centerZ: -44.0,
    plotWidth: 17.5,
    plotDepth: 15.5,
    gateSide: 'south',
    cottageOffsetX: 0.5,
    cottageOffsetZ: -1.5,
    cottageWidth: 5.2,
    cottageDepth: 4.4,
    cottageHeight: 2.8,
    cottageYaw: 0,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.2,
    shedOffsetZ: 1.8,
    shedYaw: Math.PI * 0.5,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-east-far-orchard',
    name: 'Eastern Persimmon Terrace',
    jpName: '東段々畑の柿農家',
    centerX: 86.0,
    centerZ: -38.0,
    plotWidth: 18.0,
    plotDepth: 16.0,
    gateSide: 'south',
    cottageOffsetX: -1.2,
    cottageOffsetZ: -1.2,
    cottageWidth: 5.4,
    cottageDepth: 4.6,
    cottageHeight: 2.9,
    cottageYaw: 0,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.2,
    shedOffsetZ: 2.2,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'blue-slate',
    hasUtilityPole: false,
  },
  {
    id: 'homestead-east-south-bridge',
    name: 'South Stone-Bridge Weaver’s House',
    jpName: '南石橋の機織り工房',
    centerX: 76.0,
    centerZ: 46.0,
    plotWidth: 18.0,
    plotDepth: 15.5,
    gateSide: 'south',
    cottageOffsetX: 0.0,
    cottageOffsetZ: -1.4,
    cottageWidth: 5.4,
    cottageDepth: 4.5,
    cottageHeight: 2.85,
    cottageYaw: 0,
    roofVariant: 'blue-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.4,
    shedOffsetZ: 2.0,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-east-south-pasture',
    name: 'Southeast Lavender Homestead',
    jpName: '南東ラベンダー丘の家',
    centerX: 82.0,
    centerZ: 70.0,
    plotWidth: 18.5,
    plotDepth: 16.0,
    gateSide: 'north',
    cottageOffsetX: 1.0,
    cottageOffsetZ: 1.4,
    cottageWidth: 5.5,
    cottageDepth: 4.6,
    cottageHeight: 2.9,
    cottageYaw: Math.PI,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.4,
    shedOffsetZ: 2.2,
    shedYaw: Math.PI * 0.5,
    shedRoofVariant: 'moss-timber',
    hasUtilityPole: false,
  },

  // ================= NORTHERN MISTY ORCHARD & RIDGE DISTRICT (19..24) =================
  {
    id: 'homestead-north-west-cross',
    name: 'North Pine-Breeze Farmhouse',
    jpName: '北松風の大きな農家',
    centerX: -14.0,
    centerZ: -46.0,
    plotWidth: 18.0,
    plotDepth: 15.5,
    gateSide: 'east',
    cottageOffsetX: -1.4,
    cottageOffsetZ: 0.5,
    cottageWidth: 5.6,
    cottageDepth: 4.7,
    cottageHeight: 2.95,
    cottageYaw: Math.PI * 0.5,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.6,
    shedOffsetZ: -3.2,
    shedYaw: 0,
    shedRoofVariant: 'blue-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-north-bridge-west',
    name: 'North River-Approach Homestead',
    jpName: '北橋たもとの木造邸',
    centerX: 6.0,
    centerZ: -68.0,
    plotWidth: 17.5,
    plotDepth: 15.0,
    gateSide: 'south',
    cottageOffsetX: -1.0,
    cottageOffsetZ: 1.2,
    cottageWidth: 5.3,
    cottageDepth: 4.5,
    cottageHeight: 2.85,
    cottageYaw: Math.PI,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.2,
    shedOffsetZ: 1.8,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-north-highland-dairy',
    name: 'Highland Bell-Cow Pasture',
    jpName: '北高原の鈴牛牧場',
    centerX: -16.0,
    centerZ: -72.0,
    plotWidth: 19.0,
    plotDepth: 16.5,
    gateSide: 'east',
    cottageOffsetX: -1.6,
    cottageOffsetZ: -1.0,
    cottageWidth: 5.6,
    cottageDepth: 4.8,
    cottageHeight: 2.9,
    cottageYaw: Math.PI * 0.5,
    roofVariant: 'moss-timber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.8,
    shedOffsetZ: 3.2,
    shedYaw: 0,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-north-woodcutter',
    name: 'Northern Woodcutter’s Timber Chalet',
    jpName: '北森の木こり山荘',
    centerX: -38.0,
    centerZ: -66.0,
    plotWidth: 17.5,
    plotDepth: 15.5,
    gateSide: 'south',
    cottageOffsetX: 0.6,
    cottageOffsetZ: -1.4,
    cottageWidth: 5.4,
    cottageDepth: 4.6,
    cottageHeight: 2.9,
    cottageYaw: 0,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.2,
    shedOffsetZ: 2.0,
    shedYaw: Math.PI * 0.5,
    shedRoofVariant: 'moss-timber',
    hasUtilityPole: false,
  },
  {
    id: 'homestead-farnorth-watch',
    name: 'Cloud-Peak Lookout Homestead',
    jpName: '雲見ヶ丘の北端番屋',
    centerX: -14.0,
    centerZ: -96.0,
    plotWidth: 18.0,
    plotDepth: 16.0,
    gateSide: 'east',
    cottageOffsetX: -1.2,
    cottageOffsetZ: 0.8,
    cottageWidth: 5.5,
    cottageDepth: 4.6,
    cottageHeight: 2.95,
    cottageYaw: Math.PI * 0.5,
    roofVariant: 'blue-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.5,
    shedOffsetZ: -3.0,
    shedYaw: 0,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-northeast-cherry',
    name: 'North-Bank Blossom Cottage',
    jpName: '北川岸の花咲く家',
    centerX: 60.0,
    centerZ: -74.0,
    plotWidth: 17.5,
    plotDepth: 15.5,
    gateSide: 'south',
    cottageOffsetX: -0.8,
    cottageOffsetZ: -1.2,
    cottageWidth: 5.3,
    cottageDepth: 4.5,
    cottageHeight: 2.85,
    cottageYaw: 0,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: false,
    shedOffsetX: 0,
    shedOffsetZ: 0,
    shedYaw: 0,
    shedRoofVariant: 'blue-slate',
    hasUtilityPole: false,
  },

  // ================= SOUTHERN RIVERSIDE & MARKET DISTRICT (25..28) =================
  {
    id: 'homestead-south-market-east',
    name: 'South Crossroads Cider Press',
    jpName: '南十字路の林檎酒工房',
    centerX: 8.5,
    centerZ: 46.0,
    plotWidth: 18.0,
    plotDepth: 15.5,
    gateSide: 'west',
    cottageOffsetX: 1.4,
    cottageOffsetZ: -1.0,
    cottageWidth: 5.6,
    cottageDepth: 4.7,
    cottageHeight: 2.95,
    cottageYaw: -Math.PI * 0.5,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.4,
    shedOffsetZ: 2.8,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-south-bridge-west',
    name: 'South Bridge Ferryman’s Cottage',
    jpName: '南石橋の渡し守の家',
    centerX: 28.0,
    centerZ: 46.0,
    plotWidth: 16.5,
    plotDepth: 14.5,
    gateSide: 'south',
    cottageOffsetX: -0.8,
    cottageOffsetZ: -1.2,
    cottageWidth: 5.2,
    cottageDepth: 4.4,
    cottageHeight: 2.8,
    cottageYaw: 0,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: false,
    shedOffsetX: 0,
    shedOffsetZ: 0,
    shedYaw: 0,
    shedRoofVariant: 'blue-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-south-valley-granary',
    name: 'South Valley Golden Granary',
    jpName: '南谷の黄金穀倉ファーム',
    centerX: -12.0,
    centerZ: 68.0,
    plotWidth: 19.0,
    plotDepth: 16.5,
    gateSide: 'east',
    cottageOffsetX: -1.5,
    cottageOffsetZ: 1.0,
    cottageWidth: 5.7,
    cottageDepth: 4.8,
    cottageHeight: 3.0,
    cottageYaw: Math.PI * 0.5,
    roofVariant: 'moss-timber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.8,
    shedOffsetZ: -3.2,
    shedYaw: 0,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-farsouth-meadow',
    name: 'Southernmost Sunlit Shepherd Farm',
    jpName: '最南端の陽だまり羊牧場',
    centerX: 12.0,
    centerZ: 74.0,
    plotWidth: 18.5,
    plotDepth: 16.0,
    gateSide: 'west',
    cottageOffsetX: 1.2,
    cottageOffsetZ: 0.6,
    cottageWidth: 5.4,
    cottageDepth: 4.6,
    cottageHeight: 2.85,
    cottageYaw: -Math.PI * 0.5,
    roofVariant: 'blue-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.2,
    shedOffsetZ: -2.8,
    shedYaw: 0,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },

  // ================= WESTERN WINDMILL & FARMLANDS DISTRICT (29..32) =================
  {
    id: 'homestead-west-lane-pottery',
    name: 'West Lane Country Pottery Kiln',
    jpName: '西街道の陶芸窯コテージ',
    centerX: -54.0,
    centerZ: -8.0,
    plotWidth: 18.0,
    plotDepth: 15.5,
    gateSide: 'south',
    cottageOffsetX: -1.0,
    cottageOffsetZ: -1.4,
    cottageWidth: 5.5,
    cottageDepth: 4.6,
    cottageHeight: 2.9,
    cottageYaw: 0,
    roofVariant: 'cedar-umber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.4,
    shedOffsetZ: 1.8,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'blue-slate',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-west-airstrip-ranch',
    name: 'Aviator’s Clover Field Homestead',
    jpName: '飛行場隣のクローバー邸',
    centerX: -58.0,
    centerZ: 22.0,
    plotWidth: 18.5,
    plotDepth: 16.0,
    gateSide: 'south',
    cottageOffsetX: 0.8,
    cottageOffsetZ: -1.2,
    cottageWidth: 5.4,
    cottageDepth: 4.6,
    cottageHeight: 2.85,
    cottageYaw: 0,
    roofVariant: 'teal-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.4,
    shedOffsetZ: 2.2,
    shedYaw: Math.PI * 0.5,
    shedRoofVariant: 'moss-timber',
    hasUtilityPole: true,
  },
  {
    id: 'homestead-farwest-windmill-farm',
    name: 'West Ridge Wheat & Wind Farm',
    jpName: '西丘の麦畑農家',
    centerX: -76.0,
    centerZ: -14.0,
    plotWidth: 18.5,
    plotDepth: 16.0,
    gateSide: 'south',
    cottageOffsetX: -0.8,
    cottageOffsetZ: -1.4,
    cottageWidth: 5.6,
    cottageDepth: 4.7,
    cottageHeight: 2.95,
    cottageYaw: 0,
    roofVariant: 'blue-slate',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: 4.5,
    shedOffsetZ: 2.0,
    shedYaw: -Math.PI * 0.5,
    shedRoofVariant: 'cedar-umber',
    hasUtilityPole: false,
  },
  {
    id: 'homestead-southwest-hill-cottage',
    name: 'Southwest Breeze Timber Homestead',
    jpName: '南西風の木組みコテージ',
    centerX: -36.0,
    centerZ: 58.0,
    plotWidth: 17.5,
    plotDepth: 15.5,
    gateSide: 'east',
    cottageOffsetX: -1.2,
    cottageOffsetZ: 0.6,
    cottageWidth: 5.3,
    cottageDepth: 4.5,
    cottageHeight: 2.85,
    cottageYaw: Math.PI * 0.5,
    roofVariant: 'moss-timber',
    hasChimney: true,
    hasShed: true,
    shedOffsetX: -4.2,
    shedOffsetZ: -2.8,
    shedYaw: 0,
    shedRoofVariant: 'teal-slate',
    hasUtilityPole: true,
  },
];

/**
 * 12 Named Discoverable Landmarks across the 3x Expanded Village, River Bridges & Rolling Hills.
 */
export const VILLAGE_LANDMARKS: VillageLandmark[] = [
  {
    id: 'green-gable-crossroads',
    name: 'Green Gable Crossroads',
    jpName: '緑屋根の十字路',
    subtitle: 'Foreground teal-roofed cottage, glowing lanterns & central village lane',
    x: 4.5,
    z: 24.0,
    flyAltitude: 20.5,
    badgeColor: '#4E8C73',
  },
  {
    id: 'grand-central-arch-bridge',
    name: 'Grand River Arch Bridge',
    jpName: '中央大通りの太鼓橋',
    subtitle: 'Arched timber & stone bridge over the sparkling animated river with warm lanterns',
    x: 38.0,
    z: -11.0,
    flyAltitude: 19.5,
    badgeColor: '#3A8EA8',
  },
  {
    id: 'brookside-watermill',
    name: 'Riverside Watermill & Red Bridge',
    jpName: 'せせらぎの水車小屋と朱橋',
    subtitle: 'Turning wooden waterwheel, splashing river foam & vermilion footbridge',
    x: 36.0,
    z: 10.0,
    flyAltitude: 19.0,
    badgeColor: '#D65A42',
  },
  {
    id: 'east-riverbank-terrace',
    name: 'Eastern Riverbank Village District',
    jpName: '東岸テラスの街並み',
    subtitle: 'Expanded east-bank bakery inn, willow villas & sunrise dairy pastures',
    x: 68.0,
    z: -4.0,
    flyAltitude: 21.5,
    badgeColor: '#569874',
  },
  {
    id: 'brick-chimney-farm',
    name: 'Brick Chimney & Twin Sheds',
    jpName: '赤煉瓦煙突の農家',
    subtitle: 'Central cedar-shingle farmhouse with warm chimney smoke, well & garden',
    x: 11.5,
    z: 5.5,
    flyAltitude: 20.0,
    badgeColor: '#B8634A',
  },
  {
    id: 'emerald-pasture-lane',
    name: 'Emerald Fence Pastures',
    jpName: '翠の牧柵と草地',
    subtitle: 'Post-and-rail fenced meadows with hand-inked grass tufts & grazing sheep',
    x: -12.5,
    z: -3.5,
    flyAltitude: 19.5,
    badgeColor: '#5DA044',
  },
  {
    id: 'north-truss-bridge-orchard',
    name: 'North Truss Bridge & Orchards',
    jpName: '北果樹園とトラス木橋',
    subtitle: 'Northern timber truss river crossing, blossom trees & apiary cottages',
    x: 28.0,
    z: -56.0,
    flyAltitude: 21.0,
    badgeColor: '#E2A03F',
  },
  {
    id: 'north-highland-ridge',
    name: 'Northern Misty Highland Village',
    jpName: '北高原の朝霧集落',
    subtitle: 'Expanded northern woodcutter chalets, dairy pastures & cloud-peak lookout',
    x: -14.0,
    z: -72.0,
    flyAltitude: 23.0,
    badgeColor: '#5B7A8C',
  },
  {
    id: 'south-stone-bridge-market',
    name: 'South Stone Bridge & Cider District',
    jpName: '南石橋とシードル街区',
    subtitle: 'Stone arch river bridge, ferryman’s dock, rowboats & southern granary farms',
    x: 52.0,
    z: 58.0,
    flyAltitude: 20.5,
    badgeColor: '#6A849C',
  },
  {
    id: 'hilltop-windmill-ridge',
    name: 'Twin Gouache Hilltop Windmills',
    jpName: '緑丘の双子風車展望台',
    subtitle: 'Rolling brushstrokes hillside with turning windmill sails & western farms',
    x: -48.0,
    z: -28.0,
    flyAltitude: 27.0,
    badgeColor: '#7FA842',
  },
  {
    id: 'biplane-windsock-field',
    name: 'Meadow Airstrip & Windsock',
    jpName: '草原の飛行場と吹流し',
    subtitle: 'Country grass runway with orange-white windsock, hangar & mechanic crew',
    x: -36.0,
    z: 32.0,
    flyAltitude: 18.5,
    badgeColor: '#E06D3B',
  },
  {
    id: 'east-hilltop-windmill',
    name: 'Eastern Sunrise Windmill Overlook',
    jpName: '東の朝陽風車とラベンダー畑',
    subtitle: 'Panoramic eastern ridge windmill overlooking the entire 3x river valley',
    x: 105.0,
    z: 32.0,
    flyAltitude: 28.0,
    badgeColor: '#8B6FC2',
  },
];

/**
 * 24 Collectible Golden Wind-Spirit Sky Rings across the 3x Expanded Village & River Bridges.
 */
export const SKY_RINGS: SkyRingItem[] = [
  { id: 1, name: 'South Lane Wind Ring', x: -1.5, y: 18.5, z: 28.0, yaw: 0.1 },
  { id: 2, name: 'Green Gable Sky Ring', x: 2.0, y: 19.5, z: 12.0, yaw: 0.15 },
  { id: 3, name: 'Central Crossroads Ring', x: -1.0, y: 20.0, z: -4.0, yaw: -0.1 },
  { id: 4, name: 'Grand Arch Bridge Low-Pass Ring', x: 38.0, y: 16.5, z: -11.0, yaw: Math.PI * 0.5 },
  { id: 5, name: 'Watermill Red Bridge Ring', x: 44.5, y: 16.5, z: 12.0, yaw: 0.1 },
  { id: 6, name: 'North Truss Bridge Ring', x: 27.5, y: 17.5, z: -56.0, yaw: Math.PI * 0.45 },
  { id: 7, name: 'South Stone Bridge Ring', x: 53.5, y: 17.5, z: 58.0, yaw: Math.PI * 0.48 },
  { id: 8, name: 'East Riverbank Terrace Ring', x: 68.0, y: 21.0, z: -8.0, yaw: -0.2 },
  { id: 9, name: 'East Dairy Ranch Ring', x: 88.0, y: 22.5, z: 10.0, yaw: 0.35 },
  { id: 10, name: 'East Sunrise Windmill Ring', x: 102.0, y: 26.5, z: 30.0, yaw: -0.4 },
  { id: 11, name: 'Southeast Lavender Ring', x: 80.0, y: 22.0, z: 65.0, yaw: 0.6 },
  { id: 12, name: 'North Misty Ridge Ring', x: 1.5, y: 21.5, z: -38.0, yaw: -0.3 },
  { id: 13, name: 'North Highland Village Ring', x: -8.0, y: 23.0, z: -72.0, yaw: 0.05 },
  { id: 14, name: 'Cloud-Peak Lookout Ring', x: -12.0, y: 25.5, z: -102.0, yaw: 0.25 },
  { id: 15, name: 'Northeast Blossom Ring', x: 62.0, y: 22.5, z: -68.0, yaw: -0.5 },
  { id: 16, name: 'Telegraph Barn Ring', x: -15.0, y: 20.5, z: -20.0, yaw: -0.6 },
  { id: 17, name: 'West Hill Windmill Ring', x: -46.0, y: 25.5, z: -24.0, yaw: -0.2 },
  { id: 18, name: 'Far-West Wheat Farm Ring', x: -74.0, y: 23.5, z: -12.0, yaw: 0.15 },
  { id: 19, name: 'Western Orchard Ring', x: -32.0, y: 20.5, z: -2.0, yaw: 0.25 },
  { id: 20, name: 'Meadow Airstrip Ring', x: -34.0, y: 18.5, z: 28.0, yaw: 0.65 },
  { id: 21, name: 'Southwest Breeze Ring', x: -38.0, y: 21.0, z: 56.0, yaw: 0.4 },
  { id: 22, name: 'Clover Pasture Ring', x: -12.0, y: 19.0, z: 16.0, yaw: 0.8 },
  { id: 23, name: 'South Granary Valley Ring', x: -2.0, y: 21.0, z: 66.0, yaw: -0.1 },
  { id: 24, name: 'River Canyon Meander Ring', x: 49.0, y: 17.5, z: 34.0, yaw: 0.2 },
];

/**
 * 9 Interconnected Winding Country Dirt Road Splines spanning the 3x Expanded Village & 4 River Bridges.
 */
export const COUNTRY_ROAD_PATHS: { width: number; points: [number, number][] }[] = [
  // 1. Main North-South Village Spine Lane (runs all the way from z = 185 South to z = -185 North)
  {
    width: 3.6,
    points: [
      [-18, 185],
      [-8, 138],
      [-2.5, 98],
      [-1.5, 68],
      [-1.5, 42],
      [-1.5, 24],
      [-1.2, 6],
      [-1.5, -11],
      [-2.0, -28],
      [-3.5, -56],
      [-4.0, -82],
      [-6.0, -115],
      [-18.0, -152],
      [-36.0, -185],
    ],
  },
  // 2. Central East-West Grand Avenue (crosses the Grand Arch Bridge at z = -11 into the Eastern District)
  {
    width: 3.3,
    points: [
      [-155, -26],
      [-110, -22],
      [-76, -24],
      [-52, -18],
      [-32, -14],
      [-18, -11],
      [-1.5, -11],
      [18, -11],
      [38, -11],
      [58, -11],
      [75, -15],
      [98, -22],
      [135, -34],
      [172, -48],
    ],
  },
  // 3. Southern Watermill & Red-Bridge Cross Lane (crosses the Watermill Bridge at z = 12)
  {
    width: 3.0,
    points: [
      [-120, 42],
      [-82, 34],
      [-56, 32],
      [-32, 26],
      [-16, 18],
      [-1.5, 15],
      [16, 14],
      [32, 12],
      [45, 12],
      [60, 12],
      [78, 18],
      [102, 28],
      [138, 42],
    ],
  },
  // 4. Northern Orchard & Truss-Bridge Cross Road (crosses the North Truss Bridge at z = -56)
  {
    width: 3.0,
    points: [
      [-115, -62],
      [-75, -58],
      [-38, -56],
      [-16, -56],
      [-3.5, -56],
      [12, -56],
      [27.5, -56],
      [44, -56],
      [64, -56],
      [88, -52],
      [122, -64],
      [158, -82],
    ],
  },
  // 5. Southern Valley & Stone-Bridge Cross Road (crosses the South Stone Bridge at z = 58)
  {
    width: 3.1,
    points: [
      [-98, 72],
      [-62, 66],
      [-26, 62],
      [-1.5, 58],
      [22, 58],
      [38, 58],
      [54, 58],
      [72, 58],
      [94, 62],
      [126, 74],
      [162, 92],
    ],
  },
  // 6. Eastern Riverbank North-South Boulevard (connects all 4 bridges on the East side of the river!)
  {
    width: 3.2,
    points: [
      [52, -135],
      [54, -92],
      [54, -56],
      [56, -32],
      [58, -11],
      [59, 12],
      [62, 35],
      [68, 58],
      [72, 88],
      [82, 128],
      [96, 168],
    ],
  },
  // 7. Western Farmland & Windmill Ridge Loop Road
  {
    width: 2.8,
    points: [
      [-38, -56],
      [-48, -32],
      [-46, -14],
      [-45, 10],
      [-44, 32],
      [-45, 58],
      [-48, 88],
      [-62, 122],
    ],
  },
  // 8. Scenic Upper-Right Hillside Winding Path
  {
    width: 2.7,
    points: [
      [-2.0, -28],
      [14, -32],
      [28, -38],
      [44, -56],
    ],
  },
  // 9. Outer Eastern Highland Terrace Trail
  {
    width: 2.8,
    points: [
      [88, -52],
      [100, -22],
      [102, 6],
      [102, 28],
      [98, 58],
      [94, 88],
    ],
  },
];
