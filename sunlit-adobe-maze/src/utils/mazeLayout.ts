import * as THREE from 'three';

export const MAZE_ROWS = 7;
export const MAZE_COLS = 7;
export const CELL_SIZE = 4.6;
export const WALL_THICKNESS = 0.54;
export const CEILING_HEIGHT = 3.85;

export type WallDirection = 'N' | 'S' | 'E' | 'W';
export type WallFeatureType = 'open' | 'arch' | 'mashrabiya' | 'sun-portal' | 'niche' | 'solid';

export interface MazeCell {
  row: number;
  col: number;
  x: number;
  z: number;
  walls: Record<WallDirection, WallFeatureType>;
  hasRug?: 'kilim-rust' | 'persian-indigo' | 'ochre-tribal' | 'royal-medallion';
  rugRotation?: number;
  hasLantern?: boolean;
  zoneId?: string;
}

export interface LandmarkZone {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  row: number;
  col: number;
  x: number;
  z: number;
  defaultYaw: number;
}

export interface SunRelic {
  id: number;
  name: string;
  row: number;
  col: number;
  position: [number, number, number];
}

export interface BoxCollider2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface PotteryClusterSpec {
  id: string;
  position: [number, number, number];
  rotationY: number;
  variant: 'twin-arch-jars' | 'sill-pots' | 'painted-bowl-trio' | 'tall-granary-jar';
}

export function cellToWorld(row: number, col: number): { x: number; z: number } {
  const halfW = ((MAZE_COLS - 1) * CELL_SIZE) / 2;
  const halfH = ((MAZE_ROWS - 1) * CELL_SIZE) / 2;
  return {
    x: col * CELL_SIZE - halfW,
    z: row * CELL_SIZE - halfH,
  };
}

export function worldToCell(x: number, z: number): { row: number; col: number } {
  const halfW = ((MAZE_COLS - 1) * CELL_SIZE) / 2;
  const halfH = ((MAZE_ROWS - 1) * CELL_SIZE) / 2;
  const col = Math.round((x + halfW) / CELL_SIZE);
  const row = Math.round((z + halfH) / CELL_SIZE);
  return {
    row: THREE.MathUtils.clamp(row, 0, MAZE_ROWS - 1),
    col: THREE.MathUtils.clamp(col, 0, MAZE_COLS - 1),
  };
}

/**
 * Hand-crafted 7x7 Sunlit Adobe Labyrinth layout:
 * - Starts at [row=5, col=1] looking North (-Z) through the exact iconic Gallery from Reference Image 1
 *   (Mashrabiya lattice window on the West/Left wall, woven Persian rugs on the floor, pointed adobe archway ahead,
 *   bright sunlit portal openings on the East/Right wall, ribbed clay jars by the arch piers, timber beam ceiling above).
 * - Multiple loops, dead-end window galleries, lantern junctions, and a grand Sanctuary at [row=1, col=5].
 */
const PASSAGE_MAP: string[][] = [
  // col 0       col 1         col 2         col 3         col 4         col 5         col 6
  ['S,E',       'W,E,S',      'W,S',        'S,E',        'W,E,S',      'W,S',        'S'        ], // row 0
  ['N,S',       'N,E',        'W,N,S,E',    'W,N,E',      'W,N,S',      'N,S,E',      'W,N,S'    ], // row 1 (Sanctuary at 1,5)
  ['N,E,S',     'W,S,E',      'W,N,S',      'S,E',        'W,N,E,S',    'W,N,S',      'N,S'      ], // row 2
  ['N,S',       'N,S',        'N,E,S',      'W,N,S,E',    'W,N,S',      'N,E,S',      'W,N'      ], // row 3 (Center Hub at 3,3)
  ['N,E,S',     'W,N,S',      'N,S,E',      'W,N,S',      'N,E,S',      'W,N,S',      'S'        ], // row 4 (Gallery at 4,1)
  ['N,S',       'N,S,E',      'W,N,E',      'W,N,S',      'N,S,E',      'W,N,E',      'W,N,S'    ], // row 5 (Start at 5,1)
  ['N,E',       'W,N',        'S_CLOSED,E', 'W,N,E',      'W,N,E',      'W,E',        'W,N'      ], // row 6
];

// Clean up [6,2] so connections are strictly symmetric:
PASSAGE_MAP[6][2] = 'E';
PASSAGE_MAP[6][1] = 'W,N';

function hasDir(row: number, col: number, dir: WallDirection): boolean {
  if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return false;
  const tokens = PASSAGE_MAP[row][col].split(',');
  return tokens.includes(dir);
}

// Ensure strict symmetry of passages between neighboring cells
const OPPOSITE: Record<WallDirection, { dr: number; dc: number; opp: WallDirection }> = {
  N: { dr: -1, dc: 0, opp: 'S' },
  S: { dr: 1, dc: 0, opp: 'N' },
  E: { dr: 0, dc: 1, opp: 'W' },
  W: { dr: 0, dc: -1, opp: 'E' },
};

export function isPassageOpen(row: number, col: number, dir: WallDirection): boolean {
  const { dr, dc, opp } = OPPOSITE[dir];
  const nr = row + dr;
  const nc = col + dc;
  if (nr < 0 || nr >= MAZE_ROWS || nc < 0 || nc >= MAZE_COLS) return false;
  return hasDir(row, col, dir) || hasDir(nr, nc, opp);
}

export const LANDMARK_ZONES: LandmarkZone[] = [
  {
    id: 'mashrabiya-gallery',
    index: 0,
    title: 'Gallery of Lattice Light',
    subtitle: 'Sunlit Mashrabiya Window & Kilim Runner (Entrance)',
    row: 5,
    col: 1,
    ...cellToWorld(5, 1),
    defaultYaw: Math.PI, // Facing North (-Z) down the iconic Reference Image 1 corridor
  },
  {
    id: 'whispering-jars',
    index: 1,
    title: 'Hall of Whispering Jars',
    subtitle: 'Ribbed Terracotta Amphorae & Pointed Adobe Arches',
    row: 3,
    col: 1,
    ...cellToWorld(3, 1),
    defaultYaw: Math.PI,
  },
  {
    id: 'weavers-arcade',
    index: 2,
    title: "The Weaver's Carpet Arcade",
    subtitle: 'Anatolian Kilim Runners & Sunlit Alcove Portals',
    row: 1,
    col: 2,
    ...cellToWorld(1, 2),
    defaultYaw: Math.PI / 2,
  },
  {
    id: 'lantern-junction',
    index: 3,
    title: 'Lantern Arch Junction',
    subtitle: 'Central Crossword Under Ancient Cedar Rafters',
    row: 3,
    col: 3,
    ...cellToWorld(3, 3),
    defaultYaw: Math.PI,
  },
  {
    id: 'sundial-cloister',
    index: 4,
    title: 'Cloister of Dappled Gold',
    subtitle: 'Twin Geometric Lattice Screens & Painted Earthenware',
    row: 4,
    col: 4,
    ...cellToWorld(4, 4),
    defaultYaw: Math.PI,
  },
  {
    id: 'golden-sanctuary',
    index: 5,
    title: 'Sanctuary of Golden Dust',
    subtitle: 'Heart of the Adobe Labyrinth & Heirloom Brazier',
    row: 1,
    col: 5,
    ...cellToWorld(1, 5),
    defaultYaw: Math.PI,
  },
];

export const INITIAL_SUN_RELICS: SunRelic[] = [
  {
    id: 1,
    name: 'Amber Lattice Motes I',
    row: 4,
    col: 1,
    position: [cellToWorld(4, 1).x, 0.72, cellToWorld(4, 1).z],
  },
  {
    id: 2,
    name: 'Potter’s Sun Seal',
    row: 2,
    col: 0,
    position: [cellToWorld(2, 0).x, 0.72, cellToWorld(2, 0).z],
  },
  {
    id: 3,
    name: 'Weaver’s Golden Spindle',
    row: 1,
    col: 2,
    position: [cellToWorld(1, 2).x, 0.72, cellToWorld(1, 2).z],
  },
  {
    id: 4,
    name: 'Crossroad Brass Star',
    row: 3,
    col: 3,
    position: [cellToWorld(3, 3).x, 0.72, cellToWorld(3, 3).z],
  },
  {
    id: 5,
    name: 'Mashrabiya Sun Crest',
    row: 5,
    col: 4,
    position: [cellToWorld(5, 4).x, 0.72, cellToWorld(5, 4).z],
  },
  {
    id: 6,
    name: 'Cedar Beam Relic',
    row: 2,
    col: 4,
    position: [cellToWorld(2, 4).x, 0.72, cellToWorld(2, 4).z],
  },
  {
    id: 7,
    name: 'Alcove Dawn Emblem',
    row: 5,
    col: 6,
    position: [cellToWorld(5, 6).x, 0.72, cellToWorld(5, 6).z],
  },
  {
    id: 8,
    name: 'Crown of the Sanctuary',
    row: 1,
    col: 5,
    position: [cellToWorld(1, 5).x, 0.78, cellToWorld(1, 5).z],
  },
];

export interface MazeLightSource {
  id: string;
  kind: 'lantern' | 'sanctuary' | 'mashrabiya' | 'sun-portal';
  x: number;
  y: number;
  z: number;
}

function shouldIncludeWallFeature(r: number, c: number, walls: Record<WallDirection, WallFeatureType>, dir: WallDirection): boolean {
  const feat = walls[dir];
  if (feat === 'open') return false;
  if (feat === 'arch') {
    return dir === 'N' || dir === 'W';
  }
  void r;
  void c;
  return true;
}

function localToWallWorld(
  cellX: number,
  cellZ: number,
  dir: WallDirection,
  lx: number,
  ly: number,
  lz: number
): [number, number, number] {
  const half = CELL_SIZE / 2;
  switch (dir) {
    case 'N':
      return [cellX + lx, ly, cellZ - half + lz];
    case 'S':
      return [cellX - lx, ly, cellZ + half - lz];
    case 'W':
      return [cellX - half + lz, ly, cellZ - lx];
    case 'E':
      return [cellX + half - lz, ly, cellZ + lx];
  }
}

function buildMazeData(): {
  cells: MazeCell[];
  grid: MazeCell[][];
  colliders: BoxCollider2D[];
  colliderGrid: BoxCollider2D[][][];
  potteryClusters: PotteryClusterSpec[];
  lightSources: MazeLightSource[];
} {
  const grid: MazeCell[][] = [];
  const cells: MazeCell[] = [];
  const colliders: BoxCollider2D[] = [];
  const potteryClusters: PotteryClusterSpec[] = [];
  const lightSources: MazeLightSource[] = [];

  const rugVariants: Array<'kilim-rust' | 'persian-indigo' | 'ochre-tribal' | 'royal-medallion'> = [
    'kilim-rust',
    'persian-indigo',
    'ochre-tribal',
    'royal-medallion',
  ];

  for (let r = 0; r < MAZE_ROWS; r++) {
    const rowCells: MazeCell[] = [];
    for (let c = 0; c < MAZE_COLS; c++) {
      const { x, z } = cellToWorld(r, c);
      const walls: Record<WallDirection, WallFeatureType> = {
        N: 'solid',
        S: 'solid',
        E: 'solid',
        W: 'solid',
      };

      (['N', 'S', 'E', 'W'] as WallDirection[]).forEach((dir) => {
        if (isPassageOpen(r, c, dir)) {
          // Determine whether this open passage has a grand pointed adobe arch
          // Put arches on key transitions to replicate Image 1's iconic archway framing!
          const isIconicArch =
            (r === 5 && c === 1 && dir === 'N') ||
            (r === 4 && c === 1 && dir === 'S') ||
            (r === 4 && c === 1 && dir === 'N') ||
            (r === 3 && c === 1 && dir === 'S') ||
            ((r + c) % 2 === 0 && (dir === 'N' || dir === 'E'));
          walls[dir] = isIconicArch ? 'arch' : 'open';
        } else {
          // Closed wall! Choose between Mashrabiya lattice window, sunlit portal alcove, niche, or solid plaster
          if (r === 5 && c === 1 && dir === 'W') {
            // Iconic Reference Image 1 foreground left Mashrabiya lattice window!
            walls[dir] = 'mashrabiya';
          } else if (r === 4 && c === 1 && dir === 'E') {
            // Iconic Reference Image 1 midground right bright sunlit portal opening!
            walls[dir] = 'sun-portal';
          } else if (r === 3 && c === 1 && dir === 'W') {
            // Iconic Reference Image 1 background lattice window!
            walls[dir] = 'mashrabiya';
          } else if ((r * 7 + c * 3) % 4 === 0 && (dir === 'W' || dir === 'N' || dir === 'E')) {
            walls[dir] = 'mashrabiya';
          } else if ((r * 5 + c * 11) % 5 === 0 && (dir === 'E' || dir === 'S')) {
            walls[dir] = 'sun-portal';
          } else if ((r + c) % 3 === 0) {
            walls[dir] = 'niche';
          } else {
            walls[dir] = 'solid';
          }
        }
      });

      const zone = LANDMARK_ZONES.find((lz) => lz.row === r && lz.col === c);
      const hasRug =
        (r === 5 && c === 1) ||
        (r === 3 && c === 1) ||
        (r + c) % 2 === 0 ||
        Boolean(zone)
          ? rugVariants[(r * 3 + c) % rugVariants.length]
          : undefined;

      const openNS = walls.N !== 'solid' && walls.N !== 'mashrabiya' && walls.N !== 'sun-portal' && walls.N !== 'niche';
      const rugRotation =
        r === 5 && c === 1
          ? 0.04
          : openNS
            ? ((r * 7 + c) % 3 - 1) * 0.03
            : Math.PI / 2 + ((r + c) % 3 - 1) * 0.03;

      const hasLantern =
        (r === 3 && c === 1) ||
        (r === 3 && c === 3) ||
        (r === 1 && c === 5) ||
        (r + c) % 3 === 1;

      const cell: MazeCell = {
        row: r,
        col: c,
        x,
        z,
        walls,
        hasRug,
        rugRotation,
        hasLantern,
        zoneId: zone?.id,
      };

      if (hasLantern) {
        lightSources.push({
          id: `lantern-${r}-${c}`,
          kind: 'lantern',
          x,
          y: CEILING_HEIGHT - 1.18,
          z,
        });
      }

      if (zone?.id === 'golden-sanctuary') {
        lightSources.push({
          id: `sanctuary-${r}-${c}`,
          kind: 'sanctuary',
          x,
          y: 1.22,
          z,
        });
      }

      (['N', 'S', 'E', 'W'] as WallDirection[]).forEach((dir) => {
        if (!shouldIncludeWallFeature(r, c, walls, dir)) return;
        const feat = walls[dir];
        if (feat === 'mashrabiya') {
          const [lx, ly, lz] = localToWallWorld(x, z, dir, 0, 1.65, 0.85);
          lightSources.push({
            id: `mashrabiya-${r}-${c}-${dir}`,
            kind: 'mashrabiya',
            x: lx,
            y: ly,
            z: lz,
          });
        } else if (feat === 'sun-portal') {
          const [lx, ly, lz] = localToWallWorld(x, z, dir, 0, 1.5, 0.7);
          lightSources.push({
            id: `portal-${r}-${c}-${dir}`,
            kind: 'sun-portal',
            x: lx,
            y: ly,
            z: lz,
          });
        }
      });

      rowCells.push(cell);
      cells.push(cell);
    }
    grid.push(rowCells);
  }

  // Build 2D Box Colliders for all closed walls & archway pillars so movement slides smoothly
  const halfCell = CELL_SIZE / 2;
  const halfThick = WALL_THICKNESS / 2;
  const seenColliders = new Set<string>();
  const pushUniqueCollider = (box: BoxCollider2D) => {
    const k = `${box.minX.toFixed(2)},${box.maxX.toFixed(2)},${box.minZ.toFixed(2)},${box.maxZ.toFixed(2)}`;
    if (!seenColliders.has(k)) {
      seenColliders.add(k);
      colliders.push(box);
    }
  };

  for (const cell of cells) {
    const { x, z, walls, row, col } = cell;

    // Corner masonry piers at all 4 corners of every cell (prevents diagonal corner snagging)
    const pierSize = 0.44;
    const corners = [
      [x - halfCell, z - halfCell],
      [x + halfCell, z - halfCell],
      [x - halfCell, z + halfCell],
      [x + halfCell, z + halfCell],
    ];
    for (const [cx, cz] of corners) {
      pushUniqueCollider({
        minX: cx - pierSize,
        maxX: cx + pierSize,
        minZ: cz - pierSize,
        maxZ: cz + pierSize,
      });
    }

    // North wall
    if (!isPassageOpen(row, col, 'N')) {
      pushUniqueCollider({
        minX: x - halfCell,
        maxX: x + halfCell,
        minZ: z - halfCell - halfThick,
        maxZ: z - halfCell + halfThick,
      });
    } else if (walls.N === 'arch') {
      // Archway side pilasters (leaves 2.65m wide clear center walkway)
      const archHalfClear = 1.32;
      pushUniqueCollider({
        minX: x - halfCell,
        maxX: x - archHalfClear,
        minZ: z - halfCell - halfThick,
        maxZ: z - halfCell + halfThick,
      });
      pushUniqueCollider({
        minX: x + archHalfClear,
        maxX: x + halfCell,
        minZ: z - halfCell - halfThick,
        maxZ: z - halfCell + halfThick,
      });
    }

    // South wall
    if (!isPassageOpen(row, col, 'S')) {
      pushUniqueCollider({
        minX: x - halfCell,
        maxX: x + halfCell,
        minZ: z + halfCell - halfThick,
        maxZ: z + halfCell + halfThick,
      });
    }

    // West wall
    if (!isPassageOpen(row, col, 'W')) {
      pushUniqueCollider({
        minX: x - halfCell - halfThick,
        maxX: x - halfCell + halfThick,
        minZ: z - halfCell,
        maxZ: z + halfCell,
      });
    } else if (walls.W === 'arch') {
      const archHalfClear = 1.32;
      pushUniqueCollider({
        minX: x - halfCell - halfThick,
        maxX: x - halfCell + halfThick,
        minZ: z - halfCell,
        maxZ: z - archHalfClear,
      });
      pushUniqueCollider({
        minX: x - halfCell - halfThick,
        maxX: x - halfCell + halfThick,
        minZ: z + archHalfClear,
        maxZ: z + halfCell,
      });
    }

    // East wall
    if (!isPassageOpen(row, col, 'E')) {
      pushUniqueCollider({
        minX: x + halfCell - halfThick,
        maxX: x + halfCell + halfThick,
        minZ: z - halfCell,
        maxZ: z + halfCell,
      });
    }

    // Populate signature terracotta pottery clusters matching Reference Image 1!
    if (row === 5 && col === 1) {
      // Iconic twin ribbed jars next to the left archway pier in Image 1!
      potteryClusters.push({
        id: `pots-iconic-arch-${row}-${col}`,
        position: [x - 1.38, 0, z - halfCell + 0.52],
        rotationY: 0.35,
        variant: 'twin-arch-jars',
      });
    } else if (row === 4 && col === 1) {
      // Iconic patterned round pot on the right sunlit opening in Image 1!
      potteryClusters.push({
        id: `pots-iconic-mid-${row}-${col}`,
        position: [x + 1.42, 0, z - 0.65],
        rotationY: -0.5,
        variant: 'painted-bowl-trio',
      });
    } else if (row === 3 && col === 1) {
      // Iconic large ribbed amphora at the end wall in Image 1!
      potteryClusters.push({
        id: `pots-iconic-far-${row}-${col}`,
        position: [x + 1.25, 0, z - 1.35],
        rotationY: 0.15,
        variant: 'tall-granary-jar',
      });
    } else if ((row + col) % 2 === 0) {
      // Place corner pottery clusters safely tucked near cell corners
      const cornerX = x + (col % 2 === 0 ? -1.48 : 1.48);
      const cornerZ = z + (row % 2 === 0 ? -1.48 : 1.48);
      const variants: PotteryClusterSpec['variant'][] = [
        'twin-arch-jars',
        'painted-bowl-trio',
        'tall-granary-jar',
      ];
      potteryClusters.push({
        id: `pots-${row}-${col}`,
        position: [cornerX, 0, cornerZ],
        rotationY: ((row * 3 + col) % 6) * 0.8,
        variant: variants[(row + col) % variants.length],
      });
    }
  }

  // Add soft circular/box colliders for floor pottery clusters so character glides around pots naturally
  for (const pot of potteryClusters) {
    const r = 0.38;
    pushUniqueCollider({
      minX: pot.position[0] - r,
      maxX: pot.position[0] + r,
      minZ: pot.position[2] - r,
      maxZ: pot.position[2] + r,
    });
  }

  // Build spatial grid of colliders per cell (expanded by 3.6m margin) for O(1) collision & camera queries
  const colliderGrid: BoxCollider2D[][][] = [];
  const margin = 3.6;
  for (let r = 0; r < MAZE_ROWS; r++) {
    const rowBuckets: BoxCollider2D[][] = [];
    for (let c = 0; c < MAZE_COLS; c++) {
      const { x, z } = cellToWorld(r, c);
      const cellMinX = x - halfCell - margin;
      const cellMaxX = x + halfCell + margin;
      const cellMinZ = z - halfCell - margin;
      const cellMaxZ = z + halfCell + margin;
      const bucket = colliders.filter(
        (b) =>
          b.maxX >= cellMinX &&
          b.minX <= cellMaxX &&
          b.maxZ >= cellMinZ &&
          b.minZ <= cellMaxZ
      );
      rowBuckets.push(bucket);
    }
    colliderGrid.push(rowBuckets);
  }

  return { cells, grid, colliders, colliderGrid, potteryClusters, lightSources };
}

export const MAZE_DATA = buildMazeData();

/**
 * Iterative Circle-vs-AABB collision resolver using spatial cell bucketing.
 * Guarantees silky-smooth wall sliding with zero corner snagging and O(1) lookup!
 */
export function resolveMazeCollision(
  targetX: number,
  targetZ: number,
  radius = 0.34
): { x: number; z: number; hitWall: boolean } {
  let x = targetX;
  let z = targetZ;
  let hitWall = false;

  const { row, col } = worldToCell(x, z);
  const localBucket = MAZE_DATA.colliderGrid[row][col];

  // 3 iterations handle corner wedges and archway pilasters seamlessly
  for (let iter = 0; iter < 3; iter++) {
    for (let i = 0; i < localBucket.length; i++) {
      const box = localBucket[i];
      if (
        x + radius < box.minX ||
        x - radius > box.maxX ||
        z + radius < box.minZ ||
        z - radius > box.maxZ
      ) {
        continue;
      }

      const closestX = THREE.MathUtils.clamp(x, box.minX, box.maxX);
      const closestZ = THREE.MathUtils.clamp(z, box.minZ, box.maxZ);
      const dx = x - closestX;
      const dz = z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        hitWall = true;
        if (distSq > 0.000001) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          x += (dx / dist) * overlap;
          z += (dz / dist) * overlap;
        } else {
          // Center is inside box; push out along shallowest axis
          const penLeft = x - box.minX;
          const penRight = box.maxX - x;
          const penTop = z - box.minZ;
          const penBottom = box.maxZ - z;
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);
          if (minPen === penLeft) x = box.minX - radius;
          else if (minPen === penRight) x = box.maxX + radius;
          else if (minPen === penTop) z = box.minZ - radius;
          else z = box.maxZ + radius;
        }
      }
    }
  }

  return { x, z, hitWall };
}

/**
 * Spring-Arm Camera Wall-Collision Solver:
 * Sweeps from the character's head/torso target toward the desired camera position
 * and stops smoothly in front of any maze wall or timber ceiling beam.
 */
export function clampCameraToCorridor(
  target: THREE.Vector3,
  desiredCam: THREE.Vector3,
  camRadius = 0.28,
  outVec?: THREE.Vector3
): THREE.Vector3 {
  const result = outVec ? outVec.copy(desiredCam) : desiredCam.clone();
  // Always keep camera strictly below the timber rafters & above the floor rugs
  result.y = THREE.MathUtils.clamp(result.y, 0.48, CEILING_HEIGHT - 0.58);

  const dx = result.x - target.x;
  const dz = result.z - target.z;
  const totalDistSq = dx * dx + dz * dz;
  if (totalDistSq < 0.0025) return result;

  const { row, col } = worldToCell(target.x, target.z);
  const localBucket = MAZE_DATA.colliderGrid[row][col];

  // March along the segment from target to desiredCam using the local spatial bucket
  const steps = 12;
  let safeX = target.x;
  let safeZ = target.z;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const sampleX = target.x + dx * t;
    const sampleZ = target.z + dz * t;

    let blocked = false;
    for (let j = 0; j < localBucket.length; j++) {
      const box = localBucket[j];
      if (
        sampleX + camRadius > box.minX &&
        sampleX - camRadius < box.maxX &&
        sampleZ + camRadius > box.minZ &&
        sampleZ - camRadius < box.maxZ
      ) {
        blocked = true;
        break;
      }
    }

    if (blocked) {
      const resolved = resolveMazeCollision(sampleX, sampleZ, camRadius + 0.04);
      safeX = resolved.x;
      safeZ = resolved.z;
      break;
    } else {
      safeX = sampleX;
      safeZ = sampleZ;
    }
  }

  result.x = safeX;
  result.z = safeZ;
  return result;
}

/**
 * Shortest-path BFS solver through the 7x7 Adobe Maze.
 * Returns world-space waypoints from any world position to a destination world position.
 */
export function findMazePath(
  startWorld: { x: number; z: number },
  goalWorld: { x: number; z: number }
): THREE.Vector3[] {
  const startCell = worldToCell(startWorld.x, startWorld.z);
  const goalCell = worldToCell(goalWorld.x, goalWorld.z);

  if (startCell.row === goalCell.row && startCell.col === goalCell.col) {
    return [new THREE.Vector3(goalWorld.x, 0, goalWorld.z)];
  }

  const key = (r: number, c: number) => `${r},${c}`;
  const queue: Array<{ row: number; col: number }> = [startCell];
  const parent = new Map<string, { row: number; col: number } | null>();
  parent.set(key(startCell.row, startCell.col), null);

  const dirs: WallDirection[] = ['N', 'S', 'E', 'W'];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.row === goalCell.row && curr.col === goalCell.col) {
      break;
    }

    for (const dir of dirs) {
      if (!isPassageOpen(curr.row, curr.col, dir)) continue;
      const { dr, dc } = OPPOSITE[dir];
      const nr = curr.row + dr;
      const nc = curr.col + dc;
      const nKey = key(nr, nc);
      if (!parent.has(nKey)) {
        parent.set(nKey, curr);
        queue.push({ row: nr, col: nc });
      }
    }
  }

  const goalKey = key(goalCell.row, goalCell.col);
  if (!parent.has(goalKey)) {
    return [new THREE.Vector3(goalWorld.x, 0, goalWorld.z)];
  }

  const cellChain: Array<{ row: number; col: number }> = [];
  let step: { row: number; col: number } | null = goalCell;
  while (step) {
    cellChain.unshift(step);
    step = parent.get(key(step.row, step.col)) || null;
  }

  const waypoints: THREE.Vector3[] = cellChain.slice(1).map((c, idx, arr) => {
    if (idx === arr.length - 1) {
      return new THREE.Vector3(goalWorld.x, 0, goalWorld.z);
    }
    const w = cellToWorld(c.row, c.col);
    return new THREE.Vector3(w.x, 0, w.z);
  });

  return waypoints.length > 0
    ? waypoints
    : [new THREE.Vector3(goalWorld.x, 0, goalWorld.z)];
}
