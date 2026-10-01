import * as THREE from 'three';

/**
 * Procedural heightmap for painterly rolling hills matching the reference painting.
 * Features:
 * - A gentle foreground valley where dense wildflowers bloom
 * - Distinct left and right terraced hills crowned by sentinel trees
 * - Undulating tiered midground ridges with rolling saddles
 * - Receding backdrop mountain ranges
 */
export function getMeadowHeight(x: number, z: number): number {
  // 1. Base foreground slope rising as Z recedes (Z goes from +15 down to -200)
  const depthFactor = Math.max(0, -z);
  let h = 0.4 + depthFactor * 0.12;

  // 2. Left sentinel ridge (prominent hill on the left side)
  const leftHillDist = Math.hypot(x - -14.0, z - -18.0);
  if (leftHillDist < 26.0) {
    const leftHillCurve = Math.cos((leftHillDist / 26.0) * (Math.PI * 0.5));
    h += Math.pow(leftHillCurve, 2) * 5.8;
  }

  // 3. Right sentinel ridge (prominent hill on the right side)
  const rightHillDist = Math.hypot(x - 16.0, z - -22.0);
  if (rightHillDist < 28.0) {
    const rightHillCurve = Math.cos((rightHillDist / 28.0) * (Math.PI * 0.5));
    h += Math.pow(rightHillCurve, 2) * 6.2;
  }

  // 4. Undulating tiered midground rolling hills (Z between -25 and -80)
  if (z < -15) {
    const midZ = z + 15;
    const wave1 = Math.sin(x * 0.085 + 0.4) * Math.cos(midZ * 0.065);
    const wave2 = Math.sin(x * 0.14 - 1.2) * 1.8;
    const wave3 = Math.cos(x * 0.05 + midZ * 0.04) * 3.5;
    h += (wave1 * 3.2 + wave2 + wave3) * Math.min(1.0, -midZ / 25.0);
  }

  // 5. Far background mountain range (Z < -75)
  if (z < -70) {
    const distZ = -z - 70;
    const mountainWave1 = Math.sin(x * 0.035 + 1.1) * 16.0;
    const mountainWave2 = Math.cos(x * 0.07 - 0.8) * 9.0;
    const mountainHeight = (mountainWave1 + mountainWave2 + distZ * 0.45);
    h += Math.max(0, mountainHeight * 0.7);
  }

  // 6. Gentle path channel indent (carves a slight natural walkable depression)
  const distToPath = getDistanceToPath(x, z);
  if (distToPath < 2.2) {
    const pathDip = Math.cos((distToPath / 2.2) * (Math.PI * 0.5));
    h -= pathDip * 0.16;
  }

  return Math.max(0.1, h);
}

/**
 * 3D Winding earthen path coordinates snaking through the flower field up into the hills.
 */
export const PATH_WAYPOINTS: [number, number][] = [
  [1.6, 14.0],
  [1.2, 10.0],
  [0.8, 6.0],
  [0.4, 2.0],
  [0.9, -3.0],
  [1.5, -8.0],
  [1.1, -14.0],
  [0.3, -20.0],
  [-0.6, -27.0],
  [-1.2, -35.0],
  [0.4, -45.0],
  [1.8, -58.0],
  [1.2, -72.0],
  [0.0, -90.0],
];

/**
 * Calculates shortest 2D distance to the winding path curve.
 */
export function getDistanceToPath(x: number, z: number): number {
  let minDistSq = Infinity;
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const [x1, z1] = PATH_WAYPOINTS[i];
    const [x2, z2] = PATH_WAYPOINTS[i + 1];

    const dx = x2 - x1;
    const dz = z2 - z1;
    const l2 = dx * dx + dz * dz;

    let t = ((x - x1) * dx + (z - z1) * dz) / l2;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projZ = z1 + t * dz;

    const distSq = (x - projX) * (x - projX) + (z - projZ) * (z - projZ);
    if (distSq < minDistSq) {
      minDistSq = distSq;
    }
  }
  return Math.sqrt(minDistSq);
}

/**
 * Iconic Sentinel Trees matching the reference painting:
 * - Sentinel Left: on the left hill slope with branching silhouette
 * - Sentinel Right: on the right hill slope with tall rounded ultramarine foliage
 * - Distant copses along the rolling ridges
 */
export interface TreeLocation {
  x: number;
  z: number;
  scale: number;
  trunkHeight: number;
  canopyRadius: number;
  colorType: 'navy-cobalt' | 'ultramarine' | 'deep-indigo' | 'sage-olive';
  isSentinel?: boolean;
}

export const NATURE_TREES: TreeLocation[] = [
  // 1. Prominent Left Sentinel Tree
  {
    x: -13.8,
    z: -17.5,
    scale: 1.45,
    trunkHeight: 4.8,
    canopyRadius: 4.2,
    colorType: 'deep-indigo',
    isSentinel: true,
  },
  // 2. Prominent Right Sentinel Tree
  {
    x: 15.6,
    z: -21.2,
    scale: 1.5,
    trunkHeight: 5.6,
    canopyRadius: 4.0,
    colorType: 'navy-cobalt',
    isSentinel: true,
  },
  // Midground & Ridge Tree Copses (matching distant trees in painting)
  { x: -7.5, z: -32.0, scale: 0.85, trunkHeight: 2.8, canopyRadius: 2.4, colorType: 'ultramarine' },
  { x: -24.0, z: -38.0, scale: 0.95, trunkHeight: 3.2, canopyRadius: 2.6, colorType: 'deep-indigo' },
  { x: -3.5, z: -42.0, scale: 0.75, trunkHeight: 2.5, canopyRadius: 2.1, colorType: 'navy-cobalt' },
  { x: 8.5, z: -36.0, scale: 0.9, trunkHeight: 3.0, canopyRadius: 2.5, colorType: 'ultramarine' },
  { x: 23.5, z: -42.0, scale: 1.1, trunkHeight: 3.6, canopyRadius: 2.8, colorType: 'deep-indigo' },
  { x: -14.0, z: -52.0, scale: 0.8, trunkHeight: 2.6, canopyRadius: 2.2, colorType: 'sage-olive' },
  { x: 4.5, z: -56.0, scale: 0.75, trunkHeight: 2.4, canopyRadius: 2.0, colorType: 'deep-indigo' },
  { x: 17.0, z: -58.0, scale: 0.85, trunkHeight: 2.8, canopyRadius: 2.3, colorType: 'navy-cobalt' },
  { x: -28.0, z: -68.0, scale: 1.0, trunkHeight: 3.4, canopyRadius: 2.7, colorType: 'deep-indigo' },
  { x: -2.0, z: -74.0, scale: 0.7, trunkHeight: 2.2, canopyRadius: 1.9, colorType: 'ultramarine' },
  { x: 12.0, z: -76.0, scale: 0.8, trunkHeight: 2.5, canopyRadius: 2.1, colorType: 'sage-olive' },
  { x: 30.0, z: -70.0, scale: 0.95, trunkHeight: 3.1, canopyRadius: 2.5, colorType: 'navy-cobalt' },
];

/**
 * Deterministic pseudo-random number generator for consistent procedural vegetation placement.
 */
export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
