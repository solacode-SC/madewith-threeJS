import * as THREE from 'three';
import { pseudoRandom } from '../core/geometryBatcher';

export const CITY_ROWS = 11;
export const CITY_COLS = 11;
export const CELL_SIZE = 7.4;
export const HALF_CITY_W = (CITY_COLS * CELL_SIZE) / 2;
export const HALF_CITY_D = (CITY_ROWS * CELL_SIZE) / 2;
export const MAX_WORLD_BOUND = 88.0;

export type Direction = 'N' | 'S' | 'E' | 'W';

export interface CityDistrict {
  id: string;
  index: number;
  title: string;
  jpTitle: string;
  subtitle: string;
  icon: string;
  row: number;
  col: number;
  worldX: number;
  worldZ: number;
}

export interface CityCell {
  row: number;
  col: number;
  isRoad: boolean;
  roadStyle: 'sandy-brush' | 'stone-terrace' | 'courtyard-plaza';
  elevation: number;
  openDirs: Record<Direction, boolean>;
}

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ObstacleCircle {
  x: number;
  z: number;
  radius: number;
}

export interface TreePlacement {
  x: number;
  y: number;
  z: number;
  height: number;
  baseR: number;
  treeType: 'maple' | 'ancient-pine';
  seed: number;
  hasRoadsideCluster: boolean;
}

export interface MapleCharmRelic {
  id: number;
  name: string;
  row: number;
  col: number;
  x: number;
  z: number;
}

export function cellToWorld(row: number, col: number): { x: number; z: number } {
  const x = (col - (CITY_COLS - 1) / 2) * CELL_SIZE;
  const z = (row - (CITY_ROWS - 1) / 2) * CELL_SIZE;
  return { x, z };
}

export function worldToCell(x: number, z: number): { row: number; col: number } {
  const col = Math.round(x / CELL_SIZE + (CITY_COLS - 1) / 2);
  const row = Math.round(z / CELL_SIZE + (CITY_ROWS - 1) / 2);
  return {
    row: THREE.MathUtils.clamp(row, 0, CITY_ROWS - 1),
    col: THREE.MathUtils.clamp(col, 0, CITY_COLS - 1),
  };
}

/**
 * 12 Curated Districts across the 11x11 Watercolor Shanshui City.
 */
const RAW_DISTRICTS: Array<{
  id: string;
  title: string;
  jpTitle: string;
  subtitle: string;
  icon: string;
  row: number;
  col: number;
}> = [
  {
    id: 'persimmon-maple-square',
    title: 'Persimmon Maple Square',
    jpTitle: '紅楓の広場',
    subtitle: 'Hero autumn maple tree, river boulders, pink cosmos & ivy-draped gable cottage',
    icon: '🍁',
    row: 6,
    col: 5,
  },
  {
    id: 'stepped-arch-breezeway',
    title: 'Stepped Arch Breezeway',
    jpTitle: '石段の白壁門',
    subtitle: 'Seven white stone steps leading through the arched portal beside cedar timber eaves',
    icon: '⛩️',
    row: 5,
    col: 4,
  },
  {
    id: 'pine-cliff-overlook',
    title: 'Ancient Pine Terrace',
    jpTitle: '古松の段丘',
    subtitle: 'Elevated stone retaining terrace with ochre timber lodge & twisting sage mountain pine',
    icon: '🌲',
    row: 3,
    col: 3,
  },
  {
    id: 'half-timber-masonry-lane',
    title: 'Stone & Timber Lane',
    jpTitle: '石積みの木組み通り',
    subtitle: 'Polygonal fieldstone cottages, exposed cedar beams & terracotta flower pots',
    icon: '🏡',
    row: 5,
    col: 6,
  },
  {
    id: 'celadon-peak-belvedere',
    title: 'Celadon Peak Belvedere',
    jpTitle: '青磁山の望楼',
    subtitle: 'Northern mountain vista overlooking drifting brush clouds & celadon shanshui ridges',
    icon: '⛰️',
    row: 1,
    col: 5,
  },
  {
    id: 'vermilion-canopy-grove',
    title: 'Vermilion Maple Grove',
    jpTitle: '朱紅葉の並木道',
    subtitle: 'Winding sandy road beneath overarching persimmon & amber watercolor maple canopies',
    icon: '🍂',
    row: 3,
    col: 7,
  },
  {
    id: 'east-tea-pavilion',
    title: 'Cloud-Brush Tea Pavilion',
    jpTitle: '雲筆の茶亭',
    subtitle: 'Open-air curved-roof timber tea house framed by river boulders & lantern posts',
    icon: '🍵',
    row: 5,
    col: 9,
  },
  {
    id: 'west-artisan-courtyard',
    title: 'Rice-Paper Artisan Court',
    jpTitle: '和紙職人の里庭',
    subtitle: 'Sunlit whitewashed courtyard with drying racks, ceramic urns & cosmos blossoms',
    icon: '🎨',
    row: 6,
    col: 1,
  },
  {
    id: 'south-wooden-fence-bend',
    title: 'Southern Meadow Gate',
    jpTitle: '南野の緑牧場門',
    subtitle: 'Gateway to the lush green pastures with grazing deer, fluffy sheep & cranes',
    icon: '🦌',
    row: 9,
    col: 5,
  },
  {
    id: 'southeast-lantern-alley',
    title: 'Persimmon Lantern Alley',
    jpTitle: '柿灯の路地',
    subtitle: 'Curved slate-tiled eaves, warm cedar shutters & glowing paper lanterns',
    icon: '🏮',
    row: 8,
    col: 8,
  },
  {
    id: 'southwest-boulder-garden',
    title: 'Shanshui Rock Garden',
    jpTitle: '山水石庭',
    subtitle: 'Sculpted river boulders, moss-rimmed stepping stones & weeping sage pines',
    icon: '🪨',
    row: 8,
    col: 2,
  },
  {
    id: 'northwest-mist-terrace',
    title: 'Upper Mountain Hamlet',
    jpTitle: '翠嶺の上里',
    subtitle: 'High mountain hamlet with carved timber balconies & sweeping slate roofs',
    icon: '🏯',
    row: 2,
    col: 2,
  },
];

export const CITY_DISTRICTS: CityDistrict[] = RAW_DISTRICTS.map((d, index) => {
  const w = cellToWorld(d.row, d.col);
  return {
    ...d,
    index,
    worldX: w.x,
    worldZ: w.z,
  };
});

export const INITIAL_MAPLE_CHARMS: MapleCharmRelic[] = CITY_DISTRICTS.map((d, idx) => ({
  id: idx + 1,
  name: `${d.title} Maple Leaf`,
  row: d.row,
  col: d.col,
  x: d.worldX + ((idx % 3) - 1) * 0.65,
  z: d.worldZ + (((idx + 1) % 3) - 1) * 0.65,
}));

/**
 * 11x11 Road Grid Bitmap (1 = Walkable Road / Courtyard Plaza, 0 = Building Block / Hillside House Cluster).
 * Designed so roads form rich scenic loops across the entire city AND connect outward to the Green Meadow Land!
 */
const ROAD_BITMAP: number[][] = [
  //0  1  2  3  4  5  6  7  8  9 10
  [0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0], // row 0 (North Mountain & Meadow Edge)
  [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1], // row 1 (Celadon Peak Belvedere at [1,5])
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1], // row 2 (Upper Hamlet [2,2])
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 3 (Grand Upper Cross-Road: [3,3] Pine Terrace, [3,7] Maple Grove)
  [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0], // row 4 (Row 4: [4,4],[4,5],[4,6] = Iconic Hero Houses Backdrop!)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 5 (Hero Midground Promenade: [5,4] Arch Steps, [5,5] Center House Front, [5,6] Stone Cottage)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 6 (Hero Persimmon Maple Square [6,5] & West/East Meadow Gates)
  [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1], // row 7 (Curving Foreground Road [7,5])
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1], // row 8 (SW Rock Garden [8,2], SE Lantern Alley [8,8])
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1], // row 9 (Southern Meadow Gate [9,5])
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row 10 (South Valley Promenade opening to Green Pastures)
];

function buildCityCells(): CityCell[] {
  const cells: CityCell[] = [];
  for (let r = 0; r < CITY_ROWS; r++) {
    for (let c = 0; c < CITY_COLS; c++) {
      const isRoad = ROAD_BITMAP[r][c] === 1;
      const openDirs: Record<Direction, boolean> = {
        N: isRoad && (r === 0 || ROAD_BITMAP[r - 1][c] === 1),
        S: isRoad && (r === CITY_ROWS - 1 || ROAD_BITMAP[r + 1][c] === 1),
        W: isRoad && (c === 0 || ROAD_BITMAP[r][c - 1] === 1),
        E: isRoad && (c === CITY_COLS - 1 || ROAD_BITMAP[r][c + 1] === 1),
      };
      const isDistrict = CITY_DISTRICTS.some((d) => d.row === r && d.col === c);
      const roadStyle: CityCell['roadStyle'] = isDistrict
        ? 'courtyard-plaza'
        : r <= 3
          ? 'stone-terrace'
          : 'sandy-brush';

      cells.push({
        row: r,
        col: c,
        isRoad,
        roadStyle,
        elevation: 0,
        openDirs,
      });
    }
  }
  return cells;
}

export const CITY_CELLS: CityCell[] = buildCityCells();

export function getCityCell(row: number, col: number): CityCell | undefined {
  if (row < 0 || row >= CITY_ROWS || col < 0 || col >= CITY_COLS) return undefined;
  return CITY_CELLS[row * CITY_COLS + col];
}

export function isRoadCell(row: number, col: number): boolean {
  if (row < 0 || row >= CITY_ROWS || col < 0 || col >= CITY_COLS) return true;
  return ROAD_BITMAP[row][col] === 1;
}

export function isPassageOpen(row: number, col: number, dir: Direction): boolean {
  const cell = getCityCell(row, col);
  return cell ? cell.openDirs[dir] : true;
}

/**
 * Build obstacle colliders for non-road building plots (leaving generous road width for smooth exploration).
 */
export const BUILDING_COLLIDERS: ColliderBox[] = [];
for (let r = 0; r < CITY_ROWS; r++) {
  for (let c = 0; c < CITY_COLS; c++) {
    if (!isRoadCell(r, c)) {
      // Keep the northern mountain vista corridor [r<=3, c=4..5] open
      if (r <= 3 && (c === 4 || c === 5)) continue;
      const { x, z } = cellToWorld(r, c);
      const half = CELL_SIZE * 0.37;
      BUILDING_COLLIDERS.push({
        minX: x - half,
        maxX: x + half,
        minZ: z - half,
        maxZ: z + half,
      });
    }
  }
}

export const HERO_SQUARE_POS = cellToWorld(6, 5);
export const HERO_MAPLE_POS = {
  x: HERO_SQUARE_POS.x + 1.35,
  z: HERO_SQUARE_POS.z - 0.55,
};

/**
 * Deterministic tree placements & circular obstacle colliders so the character detects
 * every tree trunk, boulder cluster, and fence and flexibly changes direction around them!
 */
export const CITY_TREE_PLACEMENTS: TreePlacement[] = [];
export const OBSTACLE_CIRCLES: ObstacleCircle[] = [];

// 1. Hero Maple Tree & boulder bed circular collider
OBSTACLE_CIRCLES.push({
  x: HERO_MAPLE_POS.x + 0.1,
  z: HERO_MAPLE_POS.z + 0.1,
  radius: 0.92,
});

// 2. Left roadside wooden fence collider
OBSTACLE_CIRCLES.push({
  x: HERO_SQUARE_POS.x - 2.15,
  z: HERO_SQUARE_POS.z + 1.75,
  radius: 0.55,
});

// 3. City-wide spline maple & pine trees (placed neatly on road curbs & courtyards)
for (let r = 0; r < CITY_ROWS; r++) {
  for (let c = 0; c < CITY_COLS; c++) {
    const seed = r * 43 + c * 29;
    const { x, z } = cellToWorld(r, c);

    // Keep the central sightline behind the hero square open so the Celadon Mountain Peak shines clearly!
    if (r <= 6 && (c === 4 || c === 5 || c === 6)) continue;

    if (isRoadCell(r, c)) {
      if (pseudoRandom(seed + 1) > 0.42) {
        const sideX = (pseudoRandom(seed + 2) > 0.5 ? 1 : -1) * (CELL_SIZE * 0.38);
        const sideZ = (pseudoRandom(seed + 3) - 0.5) * (CELL_SIZE * 0.38);
        const tHeight = 4.2 + pseudoRandom(seed + 4) * 2.1;
        const isPine = r <= 2 || pseudoRandom(seed + 5) > 0.68;
        const tx = x + sideX;
        const tz = z + sideZ;

        CITY_TREE_PLACEMENTS.push({
          x: tx,
          y: 0,
          z: tz,
          height: tHeight,
          baseR: 0.24,
          treeType: isPine ? 'ancient-pine' : 'maple',
          seed,
          hasRoadsideCluster: true,
        });

        OBSTACLE_CIRCLES.push({
          x: tx,
          z: tz,
          radius: 0.62,
        });
      }
    } else {
      if (pseudoRandom(seed + 9) > 0.42) {
        const tx = x + (pseudoRandom(seed + 10) > 0.5 ? 2.3 : -2.3);
        const tz = z + (pseudoRandom(seed + 11) > 0.5 ? 2.1 : -2.1);
        const ty = r <= 2 ? (3 - r) * 0.65 : 0;

        CITY_TREE_PLACEMENTS.push({
          x: tx,
          y: ty,
          z: tz,
          height: 4.8 + pseudoRandom(seed + 12) * 1.8,
          baseR: 0.26,
          treeType: pseudoRandom(seed + 13) > 0.6 ? 'ancient-pine' : 'maple',
          seed: seed + 50,
          hasRoadsideCluster: false,
        });

        OBSTACLE_CIRCLES.push({
          x: tx,
          z: tz,
          radius: 0.52,
        });
      }
    }
  }
}

// 4. Scenic Meadow Trees dotted across the Out-of-City Green Land (leaving wide open pastures & trails!)
for (let i = 0; i < 28; i++) {
  const angle = (i / 28) * Math.PI * 2 + pseudoRandom(i * 19 + 1) * 0.14;
  // Keep North mountain vista and main N/S/E/W meadow trails clear
  if (Math.abs(Math.sin(angle)) < 0.16 || Math.abs(Math.cos(angle)) < 0.16) continue;
  const dist = 46.5 + pseudoRandom(i * 19 + 2) * 26.0;
  const tx = Math.sin(angle) * dist;
  const tz = Math.cos(angle) * dist;
  const tHeight = 4.6 + pseudoRandom(i * 19 + 3) * 2.4;
  const isPine = i % 3 === 0;

  CITY_TREE_PLACEMENTS.push({
    x: tx,
    y: 0,
    z: tz,
    height: tHeight,
    baseR: 0.26,
    treeType: isPine ? 'ancient-pine' : 'maple',
    seed: 900 + i * 17,
    hasRoadsideCluster: true,
  });

  OBSTACLE_CIRCLES.push({
    x: tx,
    z: tz,
    radius: 0.65,
  });
}

/**
 * Checks whether a given world position (x, z) overlaps any building AABB or tree/boulder obstacle circle.
 */
export function isPositionBlocked(x: number, z: number, radius = 0.42): boolean {
  if (Math.abs(x) > MAX_WORLD_BOUND || Math.abs(z) > MAX_WORLD_BOUND) {
    return true;
  }

  for (let i = 0; i < BUILDING_COLLIDERS.length; i++) {
    const box = BUILDING_COLLIDERS[i];
    const closestX = THREE.MathUtils.clamp(x, box.minX, box.maxX);
    const closestZ = THREE.MathUtils.clamp(z, box.minZ, box.maxZ);
    const dx = x - closestX;
    const dz = z - closestZ;
    if (dx * dx + dz * dz < radius * radius) {
      return true;
    }
  }

  for (let i = 0; i < OBSTACLE_CIRCLES.length; i++) {
    const c = OBSTACLE_CIRCLES[i];
    const dx = x - c.x;
    const dz = z - c.z;
    const minDist = radius + c.radius;
    if (dx * dx + dz * dz < minDist * minDist) {
      return true;
    }
  }

  return false;
}

/**
 * Flexible Look-Ahead Obstacle Avoidance & Direction Steering!
 * When the character faces a tree, boulder, fence, or house wall, this function probes ahead
 * and smoothly deflects/rotates the movement vector around the obstacle so she NEVER stops or gets stuck!
 */
export function steerAroundObstacles(
  posX: number,
  posZ: number,
  dirX: number,
  dirZ: number,
  radius = 0.42,
  preferredTurnSign = 1
): { dirX: number; dirZ: number; deflected: boolean; turnSign: number } {
  const len = Math.hypot(dirX, dirZ);
  if (len < 0.001) {
    return { dirX: 0, dirZ: 0, deflected: false, turnSign: preferredTurnSign };
  }
  const nx = dirX / len;
  const nz = dirZ / len;

  // Probe straight ahead at near and mid distances
  const blockedNear = isPositionBlocked(posX + nx * 0.52, posZ + nz * 0.52, radius);
  const blockedMid = isPositionBlocked(posX + nx * 0.98, posZ + nz * 0.98, radius * 0.95);

  if (!blockedNear && !blockedMid) {
    return { dirX: nx, dirZ: nz, deflected: false, turnSign: preferredTurnSign };
  }

  // Determine natural tangent side based on nearest obstacle center if not yet committed
  let bestSign = preferredTurnSign;
  let nearestDistSq = Infinity;
  for (let i = 0; i < OBSTACLE_CIRCLES.length; i++) {
    const c = OBSTACLE_CIRCLES[i];
    const toObsX = c.x - posX;
    const toObsZ = c.z - posZ;
    const dSq = toObsX * toObsX + toObsZ * toObsZ;
    if (dSq < 6.5 && dSq < nearestDistSq) {
      nearestDistSq = dSq;
      // Cross product tells us whether obstacle center is to the left or right of travel vector
      const cross = nx * toObsZ - nz * toObsX;
      bestSign = cross >= 0 ? -1 : 1;
    }
  }

  const baseAngle = Math.atan2(nx, nz);
  // Candidate deflection angles in radians (from gentle 22 deg curve up to 165 deg turnaround)
  const testAngles = [0.38, 0.72, 1.08, 1.45, 1.85, 2.35, 2.85];

  for (let i = 0; i < testAngles.length; i++) {
    const deltaAngle = testAngles[i];
    for (const sign of [bestSign, -bestSign]) {
      const candidateAngle = baseAngle + deltaAngle * sign;
      const cx = Math.sin(candidateAngle);
      const cz = Math.cos(candidateAngle);

      if (
        !isPositionBlocked(posX + cx * 0.58, posZ + cz * 0.58, radius) &&
        !isPositionBlocked(posX + cx * 1.05, posZ + cz * 1.05, radius * 0.9)
      ) {
        return {
          dirX: cx,
          dirZ: cz,
          deflected: true,
          turnSign: sign,
        };
      }
    }
  }

  // Fallback reverse-diagonal turn if boxed in
  const fallbackAngle = baseAngle + Math.PI * 0.75 * bestSign;
  return {
    dirX: Math.sin(fallbackAngle),
    dirZ: Math.cos(fallbackAngle),
    deflected: true,
    turnSign: bestSign,
  };
}

/**
 * Smooth circle-vs-AABB and circle-vs-Tree collision solver with automatic tangential deflection
 * so Kaede glides effortlessly around trees, boulders, and houses and out into the green land.
 */
export function resolveCityCollision(
  nextX: number,
  nextZ: number,
  radius = 0.36
): { x: number; z: number; hitObstacle: boolean; normalX: number; normalZ: number } {
  let x = THREE.MathUtils.clamp(nextX, -MAX_WORLD_BOUND, MAX_WORLD_BOUND);
  let z = THREE.MathUtils.clamp(nextZ, -MAX_WORLD_BOUND, MAX_WORLD_BOUND);
  let hitObstacle = false;
  let normalX = 0;
  let normalZ = 0;

  // 1. Resolve Building AABB Colliders
  for (let i = 0; i < BUILDING_COLLIDERS.length; i++) {
    const box = BUILDING_COLLIDERS[i];
    const closestX = THREE.MathUtils.clamp(x, box.minX, box.maxX);
    const closestZ = THREE.MathUtils.clamp(z, box.minZ, box.maxZ);
    const dx = x - closestX;
    const dz = z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      hitObstacle = true;
      const dist = Math.sqrt(distSq);
      if (dist > 0.0001) {
        const push = radius - dist;
        normalX = dx / dist;
        normalZ = dz / dist;
        x += normalX * push;
        z += normalZ * push;
      } else {
        const cx = (box.minX + box.maxX) * 0.5;
        const cz = (box.minZ + box.maxZ) * 0.5;
        if (Math.abs(x - cx) > Math.abs(z - cz)) {
          normalX = x > cx ? 1 : -1;
          normalZ = 0;
          x = x > cx ? box.maxX + radius : box.minX - radius;
        } else {
          normalX = 0;
          normalZ = z > cz ? 1 : -1;
          z = z > cz ? box.maxZ + radius : box.minZ - radius;
        }
      }
    }
  }

  // 2. Resolve Circular Tree Trunk & Boulder Colliders
  for (let i = 0; i < OBSTACLE_CIRCLES.length; i++) {
    const c = OBSTACLE_CIRCLES[i];
    const dx = x - c.x;
    const dz = z - c.z;
    const minDist = radius + c.radius;
    const distSq = dx * dx + dz * dz;

    if (distSq < minDist * minDist) {
      hitObstacle = true;
      const dist = Math.sqrt(distSq);
      if (dist > 0.0001) {
        const push = minDist - dist;
        normalX = dx / dist;
        normalZ = dz / dist;
        x += normalX * push;
        z += normalZ * push;
      } else {
        normalX = 1;
        normalZ = 0;
        x = c.x + minDist;
      }
    }
  }

  return { x, z, hitObstacle, normalX, normalZ };
}

/**
 * Snap any clicked point inside the city to the nearest walkable road cell.
 */
export function findNearestRoadCell(row: number, col: number): { row: number; col: number } {
  if (isRoadCell(row, col)) return { row, col };
  let bestRow = 6;
  let bestCol = 5;
  let bestDist = Infinity;
  for (let r = 0; r < CITY_ROWS; r++) {
    for (let c = 0; c < CITY_COLS; c++) {
      if (isRoadCell(r, c)) {
        const d = (r - row) * (r - row) + (c - col) * (c - col);
        if (d < bestDist) {
          bestDist = d;
          bestRow = r;
          bestCol = c;
        }
      }
    }
  }
  return { row: bestRow, col: bestCol };
}

/**
 * Fast BFS Road Pathfinder across the 11x11 city road network AND out into the Green Meadow Land!
 */
export function findCityPath(
  startPos: THREE.Vector3,
  targetPos: THREE.Vector3
): THREE.Vector3[] {
  const isStartOutside =
    Math.abs(startPos.x) > HALF_CITY_W + 1.0 || Math.abs(startPos.z) > HALF_CITY_D + 1.0;
  const isTargetOutside =
    Math.abs(targetPos.x) > HALF_CITY_W + 1.0 || Math.abs(targetPos.z) > HALF_CITY_D + 1.0;

  // If both start and target are outside in the open green meadow, walk directly with obstacle steering
  if (isStartOutside && isTargetOutside) {
    const resolved = resolveCityCollision(targetPos.x, targetPos.z);
    return [new THREE.Vector3(resolved.x, 0, resolved.z)];
  }

  const rawStart = worldToCell(startPos.x, startPos.z);
  const rawEnd = worldToCell(targetPos.x, targetPos.z);
  const start = findNearestRoadCell(rawStart.row, rawStart.col);
  const end = findNearestRoadCell(rawEnd.row, rawEnd.col);

  if (start.row === end.row && start.col === end.col && !isTargetOutside) {
    const resolved = resolveCityCollision(targetPos.x, targetPos.z);
    return [new THREE.Vector3(resolved.x, 0, resolved.z)];
  }

  const key = (r: number, c: number) => `${r},${c}`;
  const queue: Array<{ row: number; col: number }> = [start];
  const cameFrom = new Map<string, { row: number; col: number } | null>();
  cameFrom.set(key(start.row, start.col), null);

  const dirs: Array<{ dr: number; dc: number }> = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.row === end.row && curr.col === end.col) break;

    for (const { dr, dc } of dirs) {
      const nr = curr.row + dr;
      const nc = curr.col + dc;
      if (nr < 0 || nr >= CITY_ROWS || nc < 0 || nc >= CITY_COLS) continue;
      if (!isRoadCell(nr, nc)) continue;
      const nk = key(nr, nc);
      if (!cameFrom.has(nk)) {
        cameFrom.set(nk, curr);
        queue.push({ row: nr, col: nc });
      }
    }
  }

  const endKey = key(end.row, end.col);
  const waypoints: THREE.Vector3[] = [];

  if (cameFrom.has(endKey)) {
    const cellChain: Array<{ row: number; col: number }> = [];
    let step: { row: number; col: number } | null = end;
    while (step) {
      cellChain.push(step);
      step = cameFrom.get(key(step.row, step.col)) || null;
    }
    cellChain.reverse();

    for (let i = 1; i < cellChain.length; i++) {
      const w = cellToWorld(cellChain[i].row, cellChain[i].col);
      waypoints.push(new THREE.Vector3(w.x, 0, w.z));
    }
  }

  if (isTargetOutside) {
    const resolved = resolveCityCollision(targetPos.x, targetPos.z);
    waypoints.push(new THREE.Vector3(resolved.x, 0, resolved.z));
  } else if (waypoints.length === 0) {
    const w = cellToWorld(end.row, end.col);
    waypoints.push(new THREE.Vector3(w.x, 0, w.z));
  }

  return waypoints;
}

/**
 * Spring-arm camera collision helper so street-level cameras never clip inside buildings.
 */
export function clampCameraToRoad(
  anchor: THREE.Vector3,
  desired: THREE.Vector3,
  margin: number,
  out: THREE.Vector3
): void {
  out.copy(desired);
  const steps = 10;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const sx = THREE.MathUtils.lerp(anchor.x, desired.x, t);
    const sz = THREE.MathUtils.lerp(anchor.z, desired.z, t);
    for (let i = 0; i < BUILDING_COLLIDERS.length; i++) {
      const b = BUILDING_COLLIDERS[i];
      if (
        sx > b.minX - margin &&
        sx < b.maxX + margin &&
        sz > b.minZ - margin &&
        sz < b.maxZ + margin &&
        desired.y < 4.2
      ) {
        const safeT = Math.max(0.18, (s - 1) / steps);
        out.x = THREE.MathUtils.lerp(anchor.x, desired.x, safeT);
        out.z = THREE.MathUtils.lerp(anchor.z, desired.z, safeT);
        return;
      }
    }
  }
}
