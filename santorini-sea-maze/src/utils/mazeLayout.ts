import * as THREE from 'three';

export const MAZE_ROWS = 9;
export const MAZE_COLS = 9;
export const CELL_SIZE = 4.8;
export const WALL_THICKNESS = 0.52;
export const WALL_HEIGHT = 3.6;

export type WallDirection = 'N' | 'S' | 'E' | 'W';
export type WallFeatureType =
  | 'open'
  | 'cycladic-arch'
  | 'bell-gate'
  | 'blue-door-stairs'
  | 'blue-window'
  | 'cactus-niche'
  | 'sea-balcony'
  | 'solid';

export type RoadStyle =
  | 'turquoise-steps'
  | 'aqua-canal'
  | 'white-cobble'
  | 'sea-promenade';

export interface MazeCell {
  row: number;
  col: number;
  x: number;
  z: number;
  walls: Record<WallDirection, WallFeatureType>;
  roadStyle: RoadStyle;
  roadRotation: number;
  hasTurquoisePool?: boolean;
  hasRoofDome?: boolean;
  hasLantern?: boolean;
  isCoastalEdge?: boolean;
  zoneId?: string;
}

export interface LandmarkZone {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  icon: string;
  district: 'Caldera Spine' | 'Aegean Coast' | 'East Terraces';
  row: number;
  col: number;
  x: number;
  z: number;
  defaultYaw: number;
}

export interface SeaPearlRelic {
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
  variant:
    | 'amphora-cactus-leaf'
    | 'prickly-pear-pot'
    | 'white-amphora-pair'
    | 'bougainvillea-pot'
    | 'coastal-bench';
}

export interface DragonPalmSpec {
  id: string;
  x: number;
  z: number;
  height: number;
  trunkCurveX: number;
  trunkCurveZ: number;
  frondCount: number;
  seed: number;
  hasWhiteUrn: boolean;
  urnScale: number;
}

export interface MazeLightSource {
  id: string;
  kind: 'lantern' | 'aqua-pool' | 'blue-window' | 'cathedral';
  x: number;
  y: number;
  z: number;
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

const OPPOSITE: Record<WallDirection, { dr: number; dc: number; opp: WallDirection }> = {
  N: { dr: -1, dc: 0, opp: 'S' },
  S: { dr: 1, dc: 0, opp: 'N' },
  E: { dr: 0, dc: 1, opp: 'W' },
  W: { dr: 0, dc: -1, opp: 'E' },
};

/**
 * Build a 100% symmetric 9×9 coastal maze passage graph.
 * Column 3 (rows 6 -> 5 -> 4 -> 3 -> 2) forms the signature Turquoise Stepped Promenade
 * matching the reference photo looking straight toward the Blue Dome Cathedral at [2, 3].
 */
function createSymmetricPassageSet(): Set<string> {
  const openSet = new Set<string>();
  const connect = (r1: number, c1: number, r2: number, c2: number) => {
    if (
      r1 < 0 ||
      r1 >= MAZE_ROWS ||
      c1 < 0 ||
      c1 >= MAZE_COLS ||
      r2 < 0 ||
      r2 >= MAZE_ROWS ||
      c2 < 0 ||
      c2 >= MAZE_COLS
    ) {
      return;
    }
    if (r2 === r1 - 1 && c2 === c1) {
      openSet.add(`${r1},${c1},N`);
      openSet.add(`${r2},${c2},S`);
    } else if (r2 === r1 + 1 && c2 === c1) {
      openSet.add(`${r1},${c1},S`);
      openSet.add(`${r2},${c2},N`);
    } else if (c2 === c1 + 1 && r2 === r1) {
      openSet.add(`${r1},${c1},E`);
      openSet.add(`${r2},${c2},W`);
    } else if (c2 === c1 - 1 && r2 === r1) {
      openSet.add(`${r1},${c1},W`);
      openSet.add(`${r2},${c2},E`);
    }
  };

  // 1. Signature Reference Spine: Column 3 from [8,3] all the way north to [0,3] (Caldera Crown)
  for (let r = 8; r > 0; r--) {
    connect(r, 3, r - 1, 3);
  }

  // 2. Western Aegean Coastal Promenade along Column 0 (Sea in Side!)
  for (let r = 0; r < 8; r++) {
    connect(r, 0, r + 1, 0);
  }

  // 3. Southern Harbor Waterfront Road along Row 8
  for (let c = 0; c < 8; c++) {
    connect(8, c, 8, c + 1);
  }

  // 4. Winding Cycladic Maze Roads on the Western Slope (Cols 0..3)
  connect(0, 0, 0, 1);
  connect(0, 1, 0, 2);
  connect(0, 2, 0, 3);

  connect(1, 0, 1, 1);
  connect(1, 1, 2, 1);
  connect(2, 1, 2, 2);
  connect(2, 2, 1, 2);
  connect(2, 2, 3, 2); // Bougainvillea Archway [3,2]
  connect(3, 2, 3, 3); // Connects into Reference Spine at [3,3]
  connect(3, 2, 3, 1);
  connect(3, 1, 4, 1);
  connect(4, 1, 4, 0); // Connects to Aegean Sea Overlook [4,0]
  connect(4, 1, 4, 2);
  connect(4, 2, 5, 2);
  connect(5, 2, 5, 3); // Connects into Dragon Palm Courtyard [5,3]
  connect(5, 2, 5, 1);
  connect(5, 1, 6, 1);
  connect(6, 1, 6, 0);
  connect(6, 1, 6, 2);
  connect(6, 2, 7, 2);
  connect(7, 2, 7, 1);
  connect(7, 1, 7, 0); // Connects to Harbor Lighthouse Pier [7,0]
  connect(7, 2, 8, 2); // Connects to Seaside Taverna Patio [8,2]

  // 5. Winding Cycladic Maze Roads on the Eastern Terraces (Cols 3..8)
  connect(0, 3, 0, 4);
  connect(0, 4, 0, 5);
  connect(0, 5, 1, 5); // Sapphire Fountain Rotunda [1,5]
  connect(1, 5, 1, 4);
  connect(1, 4, 2, 4);
  connect(2, 4, 2, 3); // Connects to Blue Dome Cathedral [2,3]
  connect(1, 5, 1, 6);
  connect(1, 6, 0, 6);
  connect(0, 6, 0, 7);
  connect(0, 7, 0, 8);
  connect(0, 8, 1, 8);
  connect(1, 8, 2, 8);
  connect(2, 8, 2, 7); // Whispering Bell Arcade [2,7]
  connect(2, 7, 1, 7);
  connect(2, 7, 2, 6);
  connect(2, 6, 2, 5);
  connect(2, 5, 3, 5);
  connect(3, 5, 3, 4);
  connect(3, 4, 4, 4);
  connect(4, 4, 4, 3); // Connects to Cactus & Stucco Terrace [4,3]
  connect(3, 5, 3, 6);
  connect(3, 6, 3, 7);
  connect(3, 7, 3, 8);
  connect(3, 8, 4, 8);
  connect(4, 8, 4, 7); // Old Amphora & Olive Court [4,7]
  connect(4, 7, 4, 6);
  connect(4, 6, 5, 6);
  connect(5, 6, 5, 5); // Aqua Canal Footbridge [5,5]
  connect(5, 5, 4, 5);
  connect(5, 5, 5, 4);
  connect(5, 4, 6, 4);
  connect(6, 4, 6, 3); // Connects to Starting Turquoise Step Promenade [6,3]
  connect(6, 4, 7, 4); // Sunken Infinity Pool Plaza [7,4]
  connect(7, 4, 7, 3);
  connect(7, 4, 7, 5);
  connect(7, 5, 6, 5);
  connect(6, 5, 6, 6);
  connect(6, 6, 6, 7);
  connect(6, 7, 5, 7);
  connect(5, 7, 5, 8);
  connect(5, 8, 6, 8);
  connect(6, 8, 7, 8);
  connect(7, 8, 7, 7); // Starlight Sea Amphitheater [7,7]
  connect(7, 7, 7, 6);
  connect(7, 7, 8, 7);
  connect(8, 8, 7, 8);

  return openSet;
}

const OPEN_PASSAGES = createSymmetricPassageSet();

export function isPassageOpen(row: number, col: number, dir: WallDirection): boolean {
  if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return false;
  return OPEN_PASSAGES.has(`${row},${col},${dir}`);
}

/**
 * 16 Distinct, Handcrafted Landmark Places across the Santorini Sea Maze City.
 */
export const LANDMARK_ZONES: LandmarkZone[] = [
  {
    id: 'turquoise-steps',
    index: 0,
    title: 'Turquoise Step Promenade',
    subtitle: 'Sunlit whitewashed stairs & aqua road from the reference vista',
    icon: '🩵',
    district: 'Caldera Spine',
    row: 6,
    col: 3,
    ...cellToWorld(6, 3),
    defaultYaw: Math.PI,
  },
  {
    id: 'palm-courtyard',
    index: 1,
    title: 'Dragon Palm Courtyard',
    subtitle: 'Giant whitewashed ceramic amphorae & spiky Dracaena palms',
    icon: '🌴',
    district: 'Caldera Spine',
    row: 5,
    col: 3,
    ...cellToWorld(5, 3),
    defaultYaw: Math.PI,
  },
  {
    id: 'cactus-terrace',
    index: 2,
    title: 'Cactus & Stucco Terrace',
    subtitle: 'Stepped whitewashed alcoves with prickly-pear & desert cacti',
    icon: '🌵',
    district: 'Caldera Spine',
    row: 4,
    col: 3,
    ...cellToWorld(4, 3),
    defaultYaw: Math.PI,
  },
  {
    id: 'blue-dome-cathedral',
    index: 3,
    title: 'Blue Dome Cathedral',
    subtitle: 'Iconic whitewashed Cycladic cupola with azure arched windows',
    icon: '⛪',
    district: 'Caldera Spine',
    row: 2,
    col: 3,
    ...cellToWorld(2, 3),
    defaultYaw: Math.PI,
  },
  {
    id: 'caldera-crown',
    index: 4,
    title: 'Sunset Caldera Crown',
    subtitle: 'Highest northern sanctuary terrace overlooking the maze city',
    icon: '👑',
    district: 'Caldera Spine',
    row: 0,
    col: 3,
    ...cellToWorld(0, 3),
    defaultYaw: 0,
  },
  {
    id: 'bougainvillea-arch',
    index: 5,
    title: 'Bougainvillea Archway',
    subtitle: 'Whitewashed vaulted alley draped in magenta coastal blossoms',
    icon: '🌸',
    district: 'Caldera Spine',
    row: 3,
    col: 2,
    ...cellToWorld(3, 2),
    defaultYaw: Math.PI / 2,
  },
  {
    id: 'windmill-point',
    index: 6,
    title: 'Cycladic Windmill Point',
    subtitle: 'Cylindrical whitewashed windmill spinning in the Aegean breeze',
    icon: '🌬️',
    district: 'Aegean Coast',
    row: 1,
    col: 0,
    ...cellToWorld(1, 0),
    defaultYaw: -Math.PI / 2,
  },
  {
    id: 'aegean-overlook',
    index: 7,
    title: 'Aegean Sea Overlook',
    subtitle: 'Cliffside sea-wall balcony above sparkling waves & sailboats',
    icon: '🌊',
    district: 'Aegean Coast',
    row: 4,
    col: 0,
    ...cellToWorld(4, 0),
    defaultYaw: -Math.PI / 2,
  },
  {
    id: 'lighthouse-pier',
    index: 8,
    title: 'Harbor Lighthouse Pier',
    subtitle: 'Coastal stone quay & blue-domed beacon beside the open sea',
    icon: '🗼',
    district: 'Aegean Coast',
    row: 7,
    col: 0,
    ...cellToWorld(7, 0),
    defaultYaw: -Math.PI / 2,
  },
  {
    id: 'seaside-taverna',
    index: 9,
    title: 'Seaside Taverna Patio',
    subtitle: 'Waterfront open-air terrace with blue parasols & sea views',
    icon: '⛱️',
    district: 'Aegean Coast',
    row: 8,
    col: 2,
    ...cellToWorld(8, 2),
    defaultYaw: 0,
  },
  {
    id: 'sunken-pool-plaza',
    index: 10,
    title: 'Sunken Infinity Pool Plaza',
    subtitle: 'Glowing aquamarine reflection basin inset into white stone',
    icon: '💎',
    district: 'East Terraces',
    row: 7,
    col: 4,
    ...cellToWorld(7, 4),
    defaultYaw: Math.PI,
  },
  {
    id: 'aqua-canal-bridge',
    index: 11,
    title: 'Aqua Canal Footbridge',
    subtitle: 'Arched whitewashed bridge over a crystal turquoise water road',
    icon: '🌉',
    district: 'East Terraces',
    row: 5,
    col: 5,
    ...cellToWorld(5, 5),
    defaultYaw: Math.PI,
  },
  {
    id: 'sapphire-fountain',
    index: 12,
    title: 'Sapphire Fountain Rotunda',
    subtitle: 'Circular whitewashed colonnade with a tiered turquoise fountain',
    icon: '⛲',
    district: 'East Terraces',
    row: 1,
    col: 5,
    ...cellToWorld(1, 5),
    defaultYaw: Math.PI,
  },
  {
    id: 'bell-arcade',
    index: 13,
    title: 'Whispering Bell Arcade',
    subtitle: 'Triple whitewashed Cycladic bell-gables with bronze chimes',
    icon: '🔔',
    district: 'East Terraces',
    row: 2,
    col: 7,
    ...cellToWorld(2, 7),
    defaultYaw: Math.PI,
  },
  {
    id: 'olive-amphora-court',
    index: 14,
    title: 'Old Amphora & Olive Court',
    subtitle: 'Sun-dappled artisan square with carved stone basins & urns',
    icon: '🏺',
    district: 'East Terraces',
    row: 4,
    col: 7,
    ...cellToWorld(4, 7),
    defaultYaw: -Math.PI / 2,
  },
  {
    id: 'starlight-amphitheater',
    index: 15,
    title: 'Starlight Sea Amphitheater',
    subtitle: 'Semi-circular whitewashed stone tiers facing the southern sea',
    icon: '🎭',
    district: 'East Terraces',
    row: 7,
    col: 7,
    ...cellToWorld(7, 7),
    defaultYaw: 0,
  },
];

/**
 * 16 Collectible Aegean Sea Pearls — one hidden in each of the 16 Landmark Places!
 */
export const INITIAL_SEA_PEARLS: SeaPearlRelic[] = LANDMARK_ZONES.map((zone, idx) => {
  // Offset slightly for places that have a central fountain/well structure so Midori can walk right through it
  const hasCenterStructure =
    zone.id === 'sapphire-fountain' ||
    zone.id === 'windmill-point' ||
    zone.id === 'lighthouse-pier';
  const offsetZ = hasCenterStructure ? 1.18 : 0;
  return {
    id: idx + 1,
    name: `${zone.title} Pearl`,
    row: zone.row,
    col: zone.col,
    position: [zone.x, 0.72, zone.z + offsetZ],
  };
});

const pseudoRandomLayout = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function getOpenPassageFeature(r: number, c: number, dir: WallDirection): WallFeatureType {
  const { dr, dc } = OPPOSITE[dir];
  const nr = r + dr;
  const nc = c + dc;
  const minR = Math.min(r, nr);
  const maxR = Math.max(r, nr);
  const minC = Math.min(c, nc);
  const maxC = Math.max(c, nc);
  const isNorthSouth = r !== nr;

  // Keep the main Reference Vista corridor (col 3, rows 2..6) open between 6->5->4->3 so the Blue Dome at [2,3] is 100% framed just like the photo!
  if (isNorthSouth && minC === 3 && maxR >= 4 && maxR <= 6) {
    return 'open';
  }
  // Frame the entrance to the Blue Dome Cathedral at [2,3] with a signature Cycladic archway
  if (isNorthSouth && minC === 3 && maxR === 3) {
    return 'cycladic-arch';
  }
  if ((minR + minC) % 3 === 0 && (isNorthSouth ? minC % 2 === 0 : minR % 2 === 1)) {
    return 'cycladic-arch';
  }
  if ((minR * 5 + maxC * 3 + (isNorthSouth ? 1 : 2)) % 5 === 0) {
    return 'bell-gate';
  }
  return 'open';
}

function shouldIncludeWallFeature(
  _r: number,
  _c: number,
  walls: Record<WallDirection, WallFeatureType>,
  dir: WallDirection
): boolean {
  const feat = walls[dir];
  if (feat === 'open') return false;
  if (feat === 'cycladic-arch' || feat === 'bell-gate') {
    return dir === 'N' || dir === 'W';
  }
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
  decorations: DecorationSpec[];
  lightSources: MazeLightSource[];
  palms: DragonPalmSpec[];
} {
  const grid: MazeCell[][] = [];
  const cells: MazeCell[] = [];
  const colliders: BoxCollider2D[] = [];
  const decorations: DecorationSpec[] = [];
  const lightSources: MazeLightSource[] = [];
  const palms: DragonPalmSpec[] = [];

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
          // Coastal Sea Balcony on the Western (col 0, W) and Southern (row 8, S) outer boundaries!
          if ((c === 0 && dir === 'W') || (r === MAZE_ROWS - 1 && dir === 'S')) {
            walls[dir] = 'sea-balcony';
          }
          // Reference Photo Right-Side Facade: [6,3] East wall & [5,3] East wall have Blue Arched Door + External Whitewashed Stairs!
          else if ((r === 6 && c === 3 && dir === 'E') || (r === 5 && c === 3 && dir === 'E')) {
            walls[dir] = 'blue-door-stairs';
          }
          // Reference Photo Left-Side Facade: [4,3] West wall has stepped cactus niche & blue window!
          else if (r === 4 && c === 3 && dir === 'W') {
            walls[dir] = 'cactus-niche';
          } else if (
            (r * 7 + c * 3 + (dir === 'E' ? 0 : dir === 'W' ? 1 : 2)) % 4 === 0 &&
            (dir === 'E' || dir === 'W' || dir === 'N')
          ) {
            walls[dir] = 'blue-door-stairs';
          } else if ((r * 5 + c * 9) % 4 === 1) {
            walls[dir] = 'blue-window';
          } else if ((r + c) % 3 === 0) {
            walls[dir] = 'cactus-niche';
          } else {
            walls[dir] = 'solid';
          }
        }
      });

      const zone = LANDMARK_ZONES.find((lz) => lz.row === r && lz.col === c);

      // Cool Roads assignment:
      // Column 3 spine & major arteries get the signature Turquoise-Stepped Road from the reference photo!
      const isSpineNS = c === 3 || c === 5 || (c === 1 && r >= 1 && r <= 7);
      const isCoastalPromenade = c === 0 || r === MAZE_ROWS - 1;
      const openNS = isPassageOpen(r, c, 'N') || isPassageOpen(r, c, 'S');
      const openEW = isPassageOpen(r, c, 'E') || isPassageOpen(r, c, 'W');

      let roadStyle: RoadStyle = 'white-cobble';
      if (c === 3 || (r + c) % 2 === 0) {
        roadStyle = 'turquoise-steps';
      } else if (isCoastalPromenade) {
        roadStyle = 'sea-promenade';
      } else if (c === 5 && r >= 4 && r <= 7) {
        roadStyle = 'aqua-canal';
      }

      const roadRotation =
        c === 3
          ? 0
          : openNS && !openEW
            ? 0
            : openEW && !openNS
              ? Math.PI / 2
              : isSpineNS
                ? 0
                : Math.PI / 2;

      const hasTurquoisePool =
        (r === 6 && c === 3) ||
        (r === 5 && c === 3) ||
        zone?.id === 'sunken-pool-plaza' ||
        zone?.id === 'aqua-canal-bridge' ||
        (c === 3 && r >= 3 && r <= 6);

      const hasRoofDome =
        zone?.id === 'blue-dome-cathedral' ||
        zone?.id === 'sapphire-fountain' ||
        zone?.id === 'caldera-crown' ||
        (r === 1 && c === 3) ||
        (r === 2 && c === 4) ||
        (r + c * 3) % 7 === 0;

      const hasLantern =
        zone !== undefined || (r + c) % 3 === 0;

      const cell: MazeCell = {
        row: r,
        col: c,
        x,
        z,
        walls,
        roadStyle,
        roadRotation,
        hasTurquoisePool,
        hasRoofDome,
        hasLantern,
        isCoastalEdge: c === 0 || r === MAZE_ROWS - 1,
        zoneId: zone?.id,
      };

      if (hasLantern) {
        lightSources.push({
          id: `lantern-${r}-${c}`,
          kind: 'lantern',
          x,
          y: WALL_HEIGHT - 0.85,
          z,
        });
      }

      if (hasTurquoisePool) {
        lightSources.push({
          id: `pool-${r}-${c}`,
          kind: 'aqua-pool',
          x,
          y: 0.45,
          z,
        });
      }

      if (zone?.id === 'blue-dome-cathedral') {
        lightSources.push({
          id: `cathedral-${r}-${c}`,
          kind: 'cathedral',
          x,
          y: 2.4,
          z,
        });
      }

      (['N', 'S', 'E', 'W'] as WallDirection[]).forEach((dir) => {
        if (!shouldIncludeWallFeature(r, c, walls, dir)) return;
        const feat = walls[dir];
        if (feat === 'blue-window' || feat === 'blue-door-stairs') {
          const [lx, ly, lz] = localToWallWorld(x, z, dir, 0, 1.65, 0.85);
          lightSources.push({
            id: `win-${r}-${c}-${dir}`,
            kind: 'blue-window',
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

  // =====================================================================
  // BUILD 2D BOX COLLIDERS FOR ALL WALLS, ARCHES, LANDMARKS & PLANTERS
  // =====================================================================
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

    // Rounded Cycladic corner piers at all 4 cell corners
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

    // Centerpiece colliders for landmarks that have a central sculptural monument
    if (
      cell.zoneId === 'sapphire-fountain' ||
      cell.zoneId === 'windmill-point' ||
      cell.zoneId === 'lighthouse-pier'
    ) {
      pushUniqueCollider({
        minX: x - 0.66,
        maxX: x + 0.66,
        minZ: z - 0.66,
        maxZ: z + 0.66,
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
    } else if (walls.N === 'cycladic-arch' || walls.N === 'bell-gate') {
      const archHalfClear = 1.38;
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
    } else if (walls.W === 'cycladic-arch' || walls.W === 'bell-gate') {
      const archHalfClear = 1.38;
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

    // =================================================================
    // REFERENCE-ACCURATE BOTANICAL URN & DECORATION PLACEMENT
    // =================================================================
    // 1. Exact Reference Foreground-Right Ribbed White Amphora with Tropical Leaves & Cacti at [6, 3]
    if (row === 6 && col === 3) {
      decorations.push({
        id: 'deco-ref-right-urn',
        position: [x + 1.54, 0, z + 1.32],
        rotationY: -0.38,
        variant: 'amphora-cactus-leaf',
      });
      // Exact Reference Foreground-Left Large Whitewashed Urn with Spiky Dracaena Dragon Palm!
      palms.push({
        id: 'palm-ref-left-hero',
        x: x - 1.52,
        z: z - 0.55,
        height: 3.45,
        trunkCurveX: 0.18,
        trunkCurveZ: 0.08,
        frondCount: 28,
        seed: 603,
        hasWhiteUrn: true,
        urnScale: 1.22,
      });
    }
    // 2. Exact Reference Midground-Right Second Dragon Palm & Midground-Left Cactus Ledge at [4, 3] & [5, 3]
    else if (row === 5 && col === 3) {
      decorations.push({
        id: 'deco-ref-mid-shrub',
        position: [x + 1.56, 0, z - 1.15],
        rotationY: -0.5,
        variant: 'white-amphora-pair',
      });
    } else if (row === 4 && col === 3) {
      decorations.push({
        id: 'deco-ref-left-cactus',
        position: [x - 1.56, 0, z - 0.85],
        rotationY: 0.35,
        variant: 'prickly-pear-pot',
      });
      palms.push({
        id: 'palm-ref-right-mid',
        x: x + 1.56,
        z: z - 1.38,
        height: 4.35,
        trunkCurveX: -0.22,
        trunkCurveZ: 0.12,
        frondCount: 26,
        seed: 403,
        hasWhiteUrn: true,
        urnScale: 1.05,
      });
    } else {
      // Populate other cells in safe closed corners (strictly away from open passages & center monuments)
      const hasCenterMonument =
        cell.zoneId === 'sapphire-fountain' ||
        cell.zoneId === 'windmill-point' ||
        cell.zoneId === 'lighthouse-pier';

      if ((row + col) % 2 === 0 && !hasCenterMonument) {
        const signX = col % 2 === 0 ? -1 : 1;
        const signZ = row % 2 === 0 ? -1 : 1;
        const cornerX = x + signX * 1.58;
        const cornerZ = z + signZ * 1.58;
        const variants: DecorationSpec['variant'][] = [
          'amphora-cactus-leaf',
          'prickly-pear-pot',
          'white-amphora-pair',
          'bougainvillea-pot',
          'coastal-bench',
        ];
        decorations.push({
          id: `deco-${row}-${col}`,
          position: [cornerX, 0, cornerZ],
          rotationY: ((row * 3 + col) % 6) * 0.75,
          variant: variants[(row + col) % variants.length],
        });
      }

      // Place Dracaena Dragon Palms in opposite safe corners across the city
      const shouldHavePalm =
        (row === 3 && col === 3) ||
        (row === 2 && col === 3) ||
        (row === 1 && col === 0) ||
        (row === 4 && col === 0) ||
        (row === 7 && col === 0) ||
        (row === 8 && col === 2) ||
        (row === 7 && col === 4) ||
        (row === 5 && col === 5) ||
        (row === 2 && col === 7) ||
        (row === 7 && col === 7) ||
        ((row * 3 + col) % 4 === 0 && !hasCenterMonument);

      if (shouldHavePalm) {
        const seed = row * 100 + col;
        const signX = col % 2 === 0 ? 1 : -1;
        const signZ = row % 2 === 0 ? -1 : 1;
        const px = x + signX * (halfCell - 0.76);
        const pz = z + signZ * (halfCell - 0.76);

        palms.push({
          id: `palm-${row}-${col}`,
          x: px,
          z: pz,
          height: 3.6 + pseudoRandomLayout(seed + 5) * 2.1,
          trunkCurveX: -signX * (0.16 + pseudoRandomLayout(seed + 7) * 0.22),
          trunkCurveZ: -signZ * (0.14 + pseudoRandomLayout(seed + 13) * 0.20),
          frondCount: 24 + Math.floor(pseudoRandomLayout(seed + 11) * 6),
          seed,
          hasWhiteUrn: true,
          urnScale: 1.0,
        });
      }
    }
  }

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

  // Add colliders for interior Dragon Palm whitewashed amphora urns
  for (const palm of palms) {
    if (palm.hasWhiteUrn) {
      const r = 0.42 * palm.urnScale;
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
  const margin = 3.8;
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
  outVec?: THREE.Vector3,
  allowHighVista = false
): THREE.Vector3 {
  const result = outVec ? outVec.copy(desiredCam) : desiredCam.clone();
  const maxCamY = allowHighVista ? WALL_HEIGHT + 4.5 : WALL_HEIGHT - 0.45;
  result.y = THREE.MathUtils.clamp(result.y, 0.48, maxCamY);

  // If camera is above the roofline in sea-breeze panoramic mode, don't clip against low corridor walls
  if (allowHighVista && result.y > WALL_HEIGHT + 0.2) {
    return result;
  }

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
 * BFS shortest-path solver through the 9×9 Santorini coastal maze city.
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
