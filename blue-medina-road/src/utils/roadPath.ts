import * as THREE from 'three';

export interface LandmarkZone {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  description: string;
  zCenter: number;
  zRange: [number, number];
  cameraOffset: [number, number, number];
  lookOffset: [number, number, number];
}

export interface SkyStarItem {
  id: number;
  position: [number, number, number];
  zoneId: string;
}

export const ROAD_START_Z = 3.6;
export const ROAD_END_Z = -86.0;

/**
 * Smooth centerline X coordinate along the winding Blue Medina road as a function of Z.
 * - z in [3.6, -11]: Straight foreground canyon matching Reference Image 1
 * - z in [-11, -28]: Curves left around the iconic white chimney tower into Lantern Alley
 * - z in [-28, -50]: Curves right into the Courtyard of the Sky Fountain
 * - z in [-50, -70]: Curves left across the Bridge of Floating Vases
 * - z in [-70, -86]: Straightens into the grand Celestial Belvedere Summit
 */
export function getRoadCenterX(z: number): number {
  const clampedZ = THREE.MathUtils.clamp(z, ROAD_END_Z, ROAD_START_Z);

  if (clampedZ >= -9.0) {
    // Straight section for the iconic painting vista
    return 0;
  }

  // Smooth S-curve waves as the road winds up the mountain medina
  const t = (-clampedZ - 9.0) / 77.0; // 0 at z=-9, 1 at z=-86
  const wave1 = -Math.sin(t * Math.PI * 2.5) * 3.8;
  const envelope = Math.sin(Math.min(1, t * 4.0) * (Math.PI / 2));
  return wave1 * envelope;
}

/**
 * Derivative dx/dz for orienting walls, steps, and arches perpendicular to the road curve.
 */
export function getRoadSlopeX(z: number): number {
  const eps = 0.25;
  return (getRoadCenterX(z + eps) - getRoadCenterX(z - eps)) / (2 * eps);
}

/**
 * Smooth road yaw angle (in radians around Y) facing up the road (toward negative Z).
 */
export function getRoadYaw(z: number): number {
  const dx = getRoadCenterX(z - 0.5) - getRoadCenterX(z + 0.5);
  const dz = -1.0;
  return Math.atan2(dx, dz);
}

/**
 * Elevation Y of the painted cobalt steps & landings as a function of Z.
 * Rises from y = 0.0 at z = 3.6 up to y = 16.4 at z = -86.
 */
export function getRoadElevationY(z: number): number {
  const clampedZ = THREE.MathUtils.clamp(z, ROAD_END_Z, ROAD_START_Z);
  if (clampedZ >= 2.8) return 0;

  // Distance traveled up the road from z = 2.8
  const d = 2.8 - clampedZ; // 0 to 88.8

  // Base steady climb + subtle terraced flattenings at plazas
  const linearClimb = d * 0.185;
  const terraceMod =
    Math.sin(d * 0.28) * 0.18 +
    Math.sin(d * 0.14) * 0.12;

  return Math.max(0, linearClimb + terraceMod);
}

/**
 * Half-width of the walkable/flyable corridor at a given Z.
 * Widens at the Sky Fountain Plaza (z ~ -45) and Celestial Summit (z ~ -82).
 */
export function getRoadHalfWidth(z: number): number {
  // Narrow intimate Chefchaouen alley in Zone 1 (matching Image 1)
  let width = 1.95;

  // Widen around the Sky Fountain Courtyard (z = -46)
  const distPlaza = Math.abs(z - -46.0);
  if (distPlaza < 9.0) {
    const factor = Math.cos((distPlaza / 9.0) * (Math.PI / 2));
    width += factor * factor * 2.15;
  }

  // Widen at the Celestial Summit Belvedere (z = -82)
  const distSummit = Math.abs(z - -81.5);
  if (distSummit < 8.5) {
    const factor = Math.cos((distSummit / 8.5) * (Math.PI / 2));
    width += factor * factor * 2.4;
  }

  return width;
}

/**
 * The 5 Discoverable Landmarks along the Long Blue Medina Road.
 */
export const LANDMARK_ZONES: LandmarkZone[] = [
  {
    id: 'painters-steps',
    index: 0,
    title: "The Painter's Steps",
    subtitle: 'Azure Origin • Chefchaouen Alley',
    description:
      'Hand-painted cobalt steps splashed with whitewash, guarded by giant white amphora vases bursting with wildflowers.',
    zCenter: -2.0,
    zRange: [4.0, -14.0],
    cameraOffset: [0.0, 1.95, 7.6],
    lookOffset: [0.0, 2.2, -6.0],
  },
  {
    id: 'whispering-arch',
    index: 1,
    title: 'Whispering Lantern Arch',
    subtitle: 'Andalusian Keyhole Passage',
    description:
      'A curving cobalt passageway spanned by horseshoe arches, wrought-iron star lanterns, and cascading sky-vines.',
    zCenter: -25.0,
    zRange: [-14.0, -35.5],
    cameraOffset: [1.8, 2.6, 6.8],
    lookOffset: [0.0, 1.4, -4.0],
  },
  {
    id: 'sky-fountain',
    index: 2,
    title: 'Courtyard of the Sky Fountain',
    subtitle: 'Levitating Zellij Plaza',
    description:
      'An open sunlit medina square where enchanted turquoise water spirals above an octagonal mosaic basin.',
    zCenter: -46.0,
    zRange: [-35.5, -56.0],
    cameraOffset: [3.2, 3.1, 7.2],
    lookOffset: [0.0, 1.2, -2.0],
  },
  {
    id: 'floating-vases',
    index: 3,
    title: 'Bridge of Levitating Amphoras',
    subtitle: 'High-Altitude Cloud Span',
    description:
      'An elevated sapphire stairway flanked by enchanted white ceramic urns floating gently on cushions of starlight.',
    zCenter: -65.0,
    zRange: [-56.0, -74.0],
    cameraOffset: [-2.4, 2.8, 6.8],
    lookOffset: [0.0, 1.3, -3.5],
  },
  {
    id: 'celestial-summit',
    index: 4,
    title: 'Celestial Belvedere',
    subtitle: 'Summit of the Azure Road',
    description:
      'A domed Moroccan sky-sanctuary crowning the clouds, where the Painted Road meets the endless horizon.',
    zCenter: -81.5,
    zRange: [-74.0, -88.0],
    cameraOffset: [0.0, 3.2, 8.2],
    lookOffset: [0.0, 1.8, -2.0],
  },
];

/**
 * Collectible 4-pointed Sky Stars (✧) suspended along the flight path.
 */
export const INITIAL_SKY_STARS: SkyStarItem[] = Array.from({ length: 15 }).map((_, i) => {
  const z = 0.5 - i * 5.7;
  const cx = getRoadCenterX(z);
  const cy = getRoadElevationY(z);
  const waveX = Math.sin(i * 1.4) * 0.85;
  const hoverY = 1.15 + (i % 3) * 0.55;
  const zone =
    LANDMARK_ZONES.find((lz) => z <= lz.zRange[0] && z >= lz.zRange[1]) ||
    LANDMARK_ZONES[LANDMARK_ZONES.length - 1];

  return {
    id: i + 1,
    position: [cx + waveX, cy + hoverY, z],
    zoneId: zone.id,
  };
});
