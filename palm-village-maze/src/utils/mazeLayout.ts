import * as THREE from 'three';

export const MAZE_ROWS = 7;
export const MAZE_COLS = 7;
export const CELL_SIZE = 4.6;
export const WALL_THICKNESS = 0.54;
export const WALL_HEIGHT = 3.4;

export type WallDirection = 'N' | 'S' | 'E' | 'W';
export type WallFeatureType = 'open' | 'arch' | 'palm-gate' | 'window' | 'vine-wall' | 'niche' | 'solid';

export interface MazeCell {
  row: number;
  col: number;
  x: number;
  z: number;
  walls: Record<WallDirection, WallFeatureType>;
  hasCobblestone?: boolean;
  cobblestoneRotation?: number;
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

export interface GoldenDate {
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

export interface DecorationSpec {
  id: string;
  position: [number, number, number];
  rotationY: number;
  variant: 'clay-pot-pair' | 'flower-bush' | 'berry-vine' | 'wooden-crate';
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
 * Hand-crafted 7×7 Ancient Iraqi Palm Village maze layout.
 * Start at [5,1] (Village Gate) facing North, destination at [1,5] (Sunset Terrace).
 * Features winding alleyways, open courtyards, palm groves, flower corridors, and dead-end gardens.
 */
const PASSAGE_MAP: string[][] = [
  // col 0       col 1         col 2         col 3         col 4         col 5         col 6
  ['S,E',       'W,E,S',      'W,S',        'S,E',        'W,E,S',      'W,S',        'S'        ], // row 0
  ['N,S',       'N,E',        'W,N,S,E',    'W,N,E',      'W,N,S',      'N,S,E',      'W,N,S'    ], // row 1
  ['N,E,S',     'W,S,E',      'W,N,S',      'S,E',        'W,N,E,S',    'W,N,S',      'N,S'      ], // row 2
  ['N,S',       'N,S',        'N,E,S',      'W,N,S,E',    'W,N,S',      'N,E,S',      'W,N'      ], // row 3
  ['N,E,S',     'W,N,S',      'N,S,E',      'W,N,S',      'N,E,S',      'W,N,S',      'S'        ], // row 4
  ['N,S',       'N,S,E',      'W,N,E',      'W,N,S',      'N,S,E',      'W,N,E',      'W,N,S'    ], // row 5
  ['N,E',       'W,N',        'S_CLOSED,E',  'W,N,E',      'W,N,E',      'W,E',        'W,N'      ], // row 6
];

// Clean up [6,2] so connections are strictly symmetric
PASSAGE_MAP[6][2] = 'E';
PASSAGE_MAP[6][1] = 'W,N';

function hasDir(row: number, col: number, dir: WallDirection): boolean {
  if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return false;
  const tokens = PASSAGE_MAP[row][col].split(',');
  return tokens.includes(dir);
}

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
    id: 'village-gate',
    index: 0,
    title: 'The Village Gate',
    subtitle: 'Ancient stone entrance to the palm village',
    row: 5,
    col: 1,
    ...cellToWorld(5, 1),
    defaultYaw: Math.PI,
  },
  {
    id: 'palm-grove',
    index: 1,
    title: 'The Palm Grove',
    subtitle: 'Towering date palms shade the winding alley',
    row: 3,
    col: 1,
    ...cellToWorld(3, 1),
    defaultYaw: Math.PI,
  },
  {
    id: 'flower-alley',
    index: 2,
    title: 'Flower Alley',
    subtitle: 'Purple bougainvillea cascading over ancient walls',
    row: 1,
    col: 2,
    ...cellToWorld(1, 2),
    defaultYaw: Math.PI / 2,
  },
  {
    id: 'old-well',
    index: 3,
    title: 'The Old Well',
    subtitle: 'Central village well beneath cedar shade',
    row: 3,
    col: 3,
    ...cellToWorld(3, 3),
    defaultYaw: Math.PI,
  },
  {
    id: 'berry-garden',
    index: 4,
    title: 'Berry Garden',
    subtitle: 'Red pomegranate vines climbing sun-warmed walls',
    row: 4,
    col: 4,
    ...cellToWorld(4, 4),
    defaultYaw: Math.PI,
  },
  {
    id: 'sunset-terrace',
    index: 5,
    title: 'Sunset Terrace',
    subtitle: 'Golden overlook at the heart of the ancient village',
    row: 1,
    col: 5,
    ...cellToWorld(1, 5),
    defaultYaw: Math.PI,
  },
];

export const INITIAL_GOLDEN_DATES: GoldenDate[] = [
  {
    id: 1,
    name: 'Palm Shadow Date',
    row: 4,
    col: 1,
    position: [cellToWorld(4, 1).x, 0.72, cellToWorld(4, 1).z],
  },
  {
    id: 2,
    name: 'Courtyard Date',
    row: 2,
    col: 0,
    position: [cellToWorld(2, 0).x, 0.72, cellToWorld(2, 0).z],
  },
  {
    id: 3,
    name: 'Flower Alley Date',
    row: 1,
    col: 2,
    position: [cellToWorld(1, 2).x, 0.72, cellToWorld(1, 2).z],
  },
  {
    id: 4,
    name: 'Well Blessing Date',
    row: 3,
    col: 3,
    position: [cellToWorld(3, 3).x, 0.76, cellToWorld(3, 3).z + 1.15],
  },
  {
    id: 5,
    name: 'Garden Gate Date',
    row: 5,
    col: 4,
    position: [cellToWorld(5, 4).x, 0.72, cellToWorld(5, 4).z],
  },
  {
    id: 6,
    name: 'Hidden Alcove Date',
    row: 2,
    col: 4,
    position: [cellToWorld(2, 4).x, 0.72, cellToWorld(2, 4).z],
  },
  {
    id: 7,
    name: 'Terrace View Date',
    row: 5,
    col: 6,
    position: [cellToWorld(5, 6).x, 0.72, cellToWorld(5, 6).z],
  },
  {
    id: 8,
    name: 'Crown of the Village',
    row: 1,
    col: 5,
    position: [cellToWorld(1, 5).x, 0.78, cellToWorld(1, 5).z],
  },
];

export interface MazeLightSource {
  id: string;
  kind: 'lantern' | 'terrace' | 'window' | 'palm-shadow';
  x: number;
  y: number;
  z: number;
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

function shouldIncludeWallFeature(_r: number, _c: number, walls: Record<WallDirection, WallFeatureType>, dir: WallDirection): boolean {
  const feat = walls[dir];
  if (feat === 'open') return false;
  if (feat === 'arch' || feat === 'palm-gate') {
    return dir === 'N' || dir === 'W';
  }
  return true;
}

export interface PalmTreeSpec {
  id: string;
  x: number;
  z: number;
  height: number;
  trunkCurveX: number;
  trunkCurveZ: number;
  frondCount: number;
  seed: number;
  hasPlanter: boolean;
}

const pseudoRandomLayout = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function getOpenPassageFeature(r: number, c: number, dir: WallDirection): WallFeatureType {
  const { dr, dc } = OPPOSITE[dir];
  const nr = r + dr;
  const nc = c + dc;
  // Canonicalize the shared edge between (r, c) and (nr, nc) so both sides are 100% identical
  const minR = Math.min(r, nr);
  const maxR = Math.max(r, nr);
  const minC = Math.min(c, nc);
  const maxC = Math.max(c, nc);
  const isNorthSouthPassage = r !== nr;

  // Signature pointed archways along the starting Village Gate alley & key transitions
  if (isNorthSouthPassage && minC === 1 && (maxR === 5 || maxR === 4 || maxR === 3)) {
    return 'arch';
  }
  if ((minR + minC) % 2 === 0 && (isNorthSouthPassage ? minC % 2 === 1 : minR % 2 === 0)) {
    return 'arch';
  }
  if ((minR * 3 + maxC * 7 + (isNorthSouthPassage ? 1 : 2)) % 4 === 0) {
    return 'palm-gate';
  }
  return 'open';
}

function buildMazeData(): {
  cells: MazeCell[];
  grid: MazeCell[][];
  colliders: BoxCollider2D[];
  colliderGrid: BoxCollider2D[][][];
  decorations: DecorationSpec[];
  lightSources: MazeLightSource[];
  palms: PalmTreeSpec[];
} {
  const grid: MazeCell[][] = [];
  const cells: MazeCell[] = [];
  const colliders: BoxCollider2D[] = [];
  const decorations: DecorationSpec[] = [];
  const lightSources: MazeLightSource[] = [];
  const palms: PalmTreeSpec[] = [];

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
          walls[dir] = getOpenPassageFeature(r, c, dir);
        } else {
          // Closed wall facade features facing into cell (r, c)
          if (r === 5 && c === 1 && dir === 'W') {
            walls[dir] = 'window';
          } else if (r === 4 && c === 1 && dir === 'E') {
            walls[dir] = 'vine-wall';
          } else if (r === 3 && c === 1 && dir === 'W') {
            walls[dir] = 'window';
          } else if ((r * 7 + c * 3 + (dir === 'N' ? 0 : dir === 'E' ? 1 : 2)) % 4 === 0 && (dir === 'W' || dir === 'N' || dir === 'E')) {
            walls[dir] = 'window';
          } else if ((r * 5 + c * 11) % 5 === 0 && (dir === 'E' || dir === 'S')) {
            walls[dir] = 'vine-wall';
          } else if ((r + c) % 3 === 0) {
            walls[dir] = 'niche';
          } else {
            walls[dir] = 'solid';
          }
        }
      });

      const zone = LANDMARK_ZONES.find((lz) => lz.row === r && lz.col === c);

      const openNS = walls.N !== 'solid' && walls.N !== 'window' && walls.N !== 'vine-wall' && walls.N !== 'niche';
      const cobblestoneRotation =
        r === 5 && c === 1
          ? 0.04
          : openNS
            ? ((r * 7 + c) % 3 - 1) * 0.03
            : Math.PI / 2 + ((r + c) % 3 - 1) * 0.03;

      const hasLantern =
        (r === 5 && c === 1) ||
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
        hasCobblestone: true,
        cobblestoneRotation,
        hasLantern,
        zoneId: zone?.id,
      };

      if (hasLantern) {
        lightSources.push({
          id: `lantern-${r}-${c}`,
          kind: 'lantern',
          x,
          y: WALL_HEIGHT - 1.0,
          z,
        });
      }

      if (zone?.id === 'sunset-terrace') {
        lightSources.push({
          id: `terrace-${r}-${c}`,
          kind: 'terrace',
          x,
          y: 1.22,
          z,
        });
      }

      (['N', 'S', 'E', 'W'] as WallDirection[]).forEach((dir) => {
        if (!shouldIncludeWallFeature(r, c, walls, dir)) return;
        const feat = walls[dir];
        if (feat === 'window') {
          const [lx, ly, lz] = localToWallWorld(x, z, dir, 0, 1.65, 0.85);
          lightSources.push({
            id: `window-${r}-${c}-${dir}`,
            kind: 'window',
            x: lx,
            y: ly,
            z: lz,
          });
        } else if (feat === 'vine-wall') {
          const [lx, ly, lz] = localToWallWorld(x, z, dir, 0, 1.5, 0.7);
          lightSources.push({
            id: `vine-${r}-${c}-${dir}`,
            kind: 'palm-shadow',
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

  // Build 2D box colliders for all closed walls & archway pillars
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

    // Corner piers at all 4 corners
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

    // Centerpiece collider for the Old Well at [3, 3] so Hana walks around the stone well curb
    if (cell.zoneId === 'old-well') {
      pushUniqueCollider({
        minX: x - 0.68,
        maxX: x + 0.68,
        minZ: z - 0.68,
        maxZ: z + 0.68,
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
    } else if (walls.N === 'arch' || walls.N === 'palm-gate') {
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
    } else if (walls.W === 'arch' || walls.W === 'palm-gate') {
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

    // Populate village decorations tucked safely into closed corners (away from doors & archways)
    if (row === 5 && col === 1) {
      decorations.push({
        id: `deco-gate-${row}-${col}`,
        position: [x + 1.48, 0, z + 1.45],
        rotationY: -0.45,
        variant: 'clay-pot-pair',
      });
    } else if (row === 4 && col === 1) {
      decorations.push({
        id: `deco-mid-${row}-${col}`,
        position: [x + 1.45, 0, z - 1.35],
        rotationY: -0.5,
        variant: 'flower-bush',
      });
    } else if (row === 3 && col === 1) {
      decorations.push({
        id: `deco-far-${row}-${col}`,
        position: [x + 1.42, 0, z - 1.42],
        rotationY: 0.15,
        variant: 'wooden-crate',
      });
    } else if ((row + col) % 2 === 0 && cell.zoneId !== 'old-well') {
      const signX = col % 2 === 0 ? -1 : 1;
      const signZ = row % 2 === 0 ? -1 : 1;
      const cornerX = x + signX * 1.52;
      const cornerZ = z + signZ * 1.52;
      const variants: DecorationSpec['variant'][] = [
        'clay-pot-pair',
        'flower-bush',
        'wooden-crate',
      ];
      decorations.push({
        id: `deco-${row}-${col}`,
        position: [cornerX, 0, cornerZ],
        rotationY: ((row * 3 + col) % 6) * 0.8,
        variant: variants[(row + col) % variants.length],
      });
    }

    // Place towering Date Palm Trees in safe corner planters (opposite from decoration corners)
    const shouldHavePalm =
      (row === 4 && col === 1) ||
      (row === 3 && col === 1) ||
      (row === 2 && col === 1) ||
      (row === 3 && col === 2) ||
      (row === 0 && col % 2 === 0) ||
      (row === 1 && col === 0) ||
      (row === 2 && col === 3) ||
      (row === 4 && col === 5) ||
      (row === 6 && col === 2) ||
      (row === 5 && col === 6) ||
      (row === 0 && col === 5) ||
      (row === 2 && col === 6) ||
      (row === 4 && col === 0) ||
      (row === 6 && col === 5) ||
      (row === 1 && col === 5) ||
      ((row + col) % 4 === 0 && row !== 3);

    if (shouldHavePalm) {
      const seed = row * 100 + col;
      // Pick a corner away from the decoration corner and nestled safely beside the corner pier
      const signX = col % 2 === 0 ? 1 : -1;
      const signZ = row % 2 === 0 ? -1 : 1;
      const px = x + signX * (halfCell - 0.62);
      const pz = z + signZ * (halfCell - 0.62);

      // Gentle upper-trunk lean toward the open center of the cell (above wall height)
      const curveX = -signX * (0.28 + pseudoRandomLayout(seed + 7) * 0.35);
      const curveZ = -signZ * (0.24 + pseudoRandomLayout(seed + 13) * 0.32);

      palms.push({
        id: `palm-${row}-${col}`,
        x: px,
        z: pz,
        height: 6.4 + pseudoRandomLayout(seed + 5) * 3.2,
        trunkCurveX: curveX,
        trunkCurveZ: curveZ,
        frondCount: 13 + Math.floor(pseudoRandomLayout(seed + 11) * 4),
        seed,
        hasPlanter: true,
      });
    }
  }

  // Add scenic exterior palm trees just outside the perimeter walls to frame the skyline
  const perimeterPalms: Array<[number, number, number, number]> = [
    [-1, 1, 0, -1.2],
    [-1, 4, 0, -1.2],
    [2, -1, -1.2, 0],
    [5, -1, -1.2, 0],
    [2, 7, 1.2, 0],
    [5, 7, 1.2, 0],
    [7, 1, 0, 1.2],
    [7, 5, 0, 1.2],
  ];
  perimeterPalms.forEach(([pr, pc, ox, oz], idx) => {
    const clampedR = THREE.MathUtils.clamp(pr, 0, MAZE_ROWS - 1);
    const clampedC = THREE.MathUtils.clamp(pc, 0, MAZE_COLS - 1);
    const base = cellToWorld(clampedR, clampedC);
    const seed = 900 + idx * 37;
    palms.push({
      id: `palm-ext-${idx}`,
      x: base.x + ox * (halfCell + 0.75),
      z: base.z + oz * (halfCell + 0.75),
      height: 7.4 + pseudoRandomLayout(seed) * 2.8,
      trunkCurveX: -ox * 0.55,
      trunkCurveZ: -oz * 0.55,
      frondCount: 14,
      seed,
      hasPlanter: false,
    });
  });

  // Add colliders for decorations
  for (const deco of decorations) {
    const r = 0.36;
    pushUniqueCollider({
      minX: deco.position[0] - r,
      maxX: deco.position[0] + r,
      minZ: deco.position[2] - r,
      maxZ: deco.position[2] + r,
    });
  }

  // Add colliders for interior palm tree trunks & stone planters
  for (const palm of palms) {
    if (palm.hasPlanter) {
      const r = 0.38;
      pushUniqueCollider({
        minX: palm.x - r,
        maxX: palm.x + r,
        minZ: palm.z - r,
        maxZ: palm.z + r,
      });
    }
  }

  // Build spatial grid for O(1) collision lookups
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

  return { cells, grid, colliders, colliderGrid, decorations, lightSources, palms };
}

export const MAZE_DATA = buildMazeData();

/**
 * Iterative Circle-vs-AABB collision resolver using spatial cell bucketing.
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
 * Spring-Arm Camera Wall-Collision Solver.
 */
export function clampCameraToCorridor(
  target: THREE.Vector3,
  desiredCam: THREE.Vector3,
  camRadius = 0.28,
  outVec?: THREE.Vector3
): THREE.Vector3 {
  const result = outVec ? outVec.copy(desiredCam) : desiredCam.clone();
  result.y = THREE.MathUtils.clamp(result.y, 0.48, WALL_HEIGHT - 0.58);

  const dx = result.x - target.x;
  const dz = result.z - target.z;
  const totalDistSq = dx * dx + dz * dz;
  if (totalDistSq < 0.0025) return result;

  const { row, col } = worldToCell(target.x, target.z);
  const localBucket = MAZE_DATA.colliderGrid[row][col];

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
 * BFS shortest-path solver through the 7×7 village maze.
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
