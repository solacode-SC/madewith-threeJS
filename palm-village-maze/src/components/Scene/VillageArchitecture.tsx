import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CELL_SIZE,
  WALL_HEIGHT,
  INITIAL_GOLDEN_DATES,
  LANDMARK_ZONES,
  MAZE_DATA,
  WALL_THICKNESS,
  MAZE_ROWS,
  MAZE_COLS,
  findMazePath,
  worldToCell,
  type LandmarkZone,
  type MazeCell,
  type WallDirection,
} from '../../utils/mazeLayout';
import {
  createMudBrickTextures,
  createCobblestoneFloorTextures,
  createWoodenDoorTextures,
  createPalmShadowGoboTexture,
  createClayPotTextures,
} from '../../utils/textures';
import type { SunMood } from '../../hooks/useMazeState';

interface VillageArchitectureProps {
  sunMood: SunMood;
  showGuidePath: boolean;
  targetZoneId: string;
  collectedRelics: number[];
  walkMarker: [number, number, number] | null;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  onFloorClick: (point: THREE.Vector3) => void;
  onHover: (label: string | null) => void;
}

const LIGHT_POOL_SIZE = 10;

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  let totalVerts = 0;
  let totalIndices = 0;
  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let idxOffset = 0;

  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    const posAttr = g.attributes.position;
    const normAttr = g.attributes.normal;
    const uvAttr = g.attributes.uv;
    const count = posAttr.count;

    positions.set(posAttr.array as Float32Array, vertOffset * 3);
    if (normAttr) {
      normals.set(normAttr.array as Float32Array, vertOffset * 3);
    }
    if (uvAttr) {
      uvs.set(uvAttr.array as Float32Array, vertOffset * 2);
    }

    if (g.index) {
      const idxArr = g.index.array;
      for (let j = 0; j < idxArr.length; j++) {
        indices[idxOffset + j] = idxArr[j] + vertOffset;
      }
      idxOffset += idxArr.length;
    } else {
      for (let j = 0; j < count; j++) {
        indices[idxOffset + j] = vertOffset + j;
      }
      idxOffset += count;
    }

    vertOffset += count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingSphere();
  return merged;
}

const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _euler = new THREE.Euler();

function pushTransformedGeo(
  bucket: THREE.BufferGeometry[],
  baseGeo: THREE.BufferGeometry,
  parentMat: THREE.Matrix4,
  px = 0,
  py = 0,
  pz = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1
) {
  _pos.set(px, py, pz);
  _euler.set(rx, ry, rz, 'XYZ');
  _quat.setFromEuler(_euler);
  _scale.set(sx, sy, sz);
  _mat.compose(_pos, _quat, _scale);
  _mat.premultiply(parentMat);
  const clone = baseGeo.clone();
  clone.applyMatrix4(_mat);
  bucket.push(clone);
}

export default function VillageArchitecture({
  sunMood,
  showGuidePath,
  targetZoneId,
  collectedRelics,
  walkMarker,
  characterPosRef,
  onFloorClick,
  onHover,
}: VillageArchitectureProps) {
  const relicsGroupRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);
  const lightPoolRefs = useRef<Array<THREE.PointLight | null>>([]);
  const lastHoveredCellZoneRef = useRef<string | null>(null);

  // Shared Procedural Textures (cached globally in textures.ts)
  const mudBrickMain = useMemo(() => createMudBrickTextures('warm-ochre'), []);
  const mudBrickSunlit = useMemo(() => createMudBrickTextures('sunlit-sand'), []);
  const mudBrickExposed = useMemo(() => createMudBrickTextures('shaded-earth'), []);
  const cobblestoneFloor = useMemo(() => createCobblestoneFloorTextures(), []);
  const woodenDoor = useMemo(() => createWoodenDoorTextures(), []);
  const palmGobo = useMemo(() => createPalmShadowGoboTexture(), []);
  const clayPot = useMemo(() => createClayPotTextures(false), []);
  const clayPotPainted = useMemo(() => createClayPotTextures(true), []);

  // Collectible Golden Date Cluster Geometry
  const relicDateGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.14, 16, 14);
    geo.scale(0.88, 1.35, 0.88);
    return geo;
  }, []);

  // Pre-build & merge ALL static village architecture into shared BufferGeometries by material
  const mergedArch = useMemo(() => {
    const w = CELL_SIZE;
    const h = WALL_HEIGHT;
    const halfW = w / 2;
    const faceZ = WALL_THICKNESS / 2;
    const archHalfW = 1.32;
    const springY = 1.95;
    const apexY = 3.05;

    const floorTileBase = new THREE.PlaneGeometry(CELL_SIZE + 0.04, CELL_SIZE + 0.04);
    const solidWallBase = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS);

    // Pointed Village Stone/Adobe Archway
    const archShape = new THREE.Shape();
    archShape.moveTo(-halfW, 0);
    archShape.lineTo(-archHalfW, 0);
    archShape.lineTo(-archHalfW, springY);
    archShape.quadraticCurveTo(-archHalfW * 0.85, apexY * 0.94, 0, apexY);
    archShape.quadraticCurveTo(archHalfW * 0.85, apexY * 0.94, archHalfW, springY);
    archShape.lineTo(archHalfW, 0);
    archShape.lineTo(halfW, 0);
    archShape.lineTo(halfW, h);
    archShape.lineTo(-halfW, h);
    archShape.closePath();

    const pointedArchBase = new THREE.ExtrudeGeometry(archShape, {
      depth: WALL_THICKNESS,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    });
    pointedArchBase.translate(0, 0, -WALL_THICKNESS / 2);

    const posAttr = pointedArchBase.attributes.position;
    const uvAttr = pointedArchBase.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      uvAttr.setXY(i, (posAttr.getX(i) + halfW) / w, posAttr.getY(i) / h);
    }
    uvAttr.needsUpdate = true;
    pointedArchBase.computeVertexNormals();

    // Palm-Gate Open Passage Side Wall Pillars & Overhead Trellis
    const gateSideWallW = (w - archHalfW * 2) / 2;
    const gateSideWallBase = new THREE.BoxGeometry(gateSideWallW, WALL_HEIGHT, WALL_THICKNESS);
    const gateTimberPostBase = new THREE.CylinderGeometry(0.12, 0.14, WALL_HEIGHT + 0.12, 10);
    const gateTrellisBeamBase = new THREE.BoxGeometry(archHalfW * 2 + 0.52, 0.15, WALL_THICKNESS + 0.24);
    const gateCrossRafterBase = new THREE.CylinderGeometry(0.048, 0.048, WALL_THICKNESS + 0.58, 8);
    gateCrossRafterBase.rotateX(Math.PI / 2);

    // Protruding Roof Timber Logs (Rondels) visible along wall tops
    const roofTimberLogBase = new THREE.CylinderGeometry(0.062, 0.068, WALL_THICKNESS + 0.46, 8);
    roofTimberLogBase.rotateX(Math.PI / 2);

    // Shallow Surface-Only Exposed Brick Patch (strictly on one side of wall so it NEVER pokes through!)
    const exposedBrickPatchBase = new THREE.BoxGeometry(1.0, 1.0, 0.026);
    const parapetCapBase = new THREE.BoxGeometry(1.5, 0.26, WALL_THICKNESS * 0.92);

    // Reusable Unit Box & Cylinder Primitives for Precision Doors, Windows, Shutters, Hardware & Crates
    const unitBoxBase = new THREE.BoxGeometry(1, 1, 1);
    const ironRingBase = new THREE.TorusGeometry(0.065, 0.014, 8, 16);

    // Vines, Red Berries, Purple Bougainvillea Blossoms & Cobblestone Edge Grass
    const vineStemBase = new THREE.CylinderGeometry(0.022, 0.032, 1.0, 6);
    const vineFoliageClusterBase = new THREE.DodecahedronGeometry(0.22, 1);
    const berrySphereBase = new THREE.SphereGeometry(0.048, 8, 8);
    const flowerClusterBase = new THREE.DodecahedronGeometry(0.24, 1);
    const grassTuftBase = new THREE.ConeGeometry(0.10, 0.24, 5);

    // Pottery Primitives (Base, Belly, Neck, Rim, Handles)
    const clayVaseBase = new THREE.SphereGeometry(0.18, 14, 12);
    const clayNeckBase = new THREE.CylinderGeometry(0.085, 0.105, 0.14, 12);
    const clayRimBase = new THREE.TorusGeometry(0.09, 0.022, 8, 14);
    clayRimBase.rotateX(Math.PI / 2);
    const clayHandleBase = new THREE.TorusGeometry(0.065, 0.016, 6, 12, Math.PI);

    // Corner Pier, Roof Overhang, Floor Gobo, Well & Lantern Primitives
    const pierBase = new THREE.BoxGeometry(0.62, WALL_HEIGHT + 0.12, 0.62);
    const overhangBase = new THREE.BoxGeometry(CELL_SIZE + 0.16, 0.12, WALL_THICKNESS + 0.12);
    const goboFloorBase = new THREE.PlaneGeometry(2.6, 2.6);
    const lanternCageBase = new THREE.CylinderGeometry(0.11, 0.085, 0.26, 6);
    const lanternCapBase = new THREE.ConeGeometry(0.14, 0.11, 6);
    const lanternGlassBase = new THREE.CylinderGeometry(0.085, 0.068, 0.21, 6);

    const floorBucket: THREE.BufferGeometry[] = [];
    const mudBrickBucket: THREE.BufferGeometry[] = [];
    const sunlitMudBrickBucket: THREE.BufferGeometry[] = [];
    const exposedBrickBucket: THREE.BufferGeometry[] = [];
    const woodBucket: THREE.BufferGeometry[] = [];
    const woodFrameBucket: THREE.BufferGeometry[] = [];
    const ironBucket: THREE.BufferGeometry[] = [];
    const lanternGlassBucket: THREE.BufferGeometry[] = [];
    const turquoiseTileBucket: THREE.BufferGeometry[] = [];
    const windowPaneBucket: THREE.BufferGeometry[] = [];
    const vineBucket: THREE.BufferGeometry[] = [];
    const berryBucket: THREE.BufferGeometry[] = [];
    const flowerPurpleBucket: THREE.BufferGeometry[] = [];
    const flowerLavenderBucket: THREE.BufferGeometry[] = [];
    const grassBucket: THREE.BufferGeometry[] = [];
    const potBucket: THREE.BufferGeometry[] = [];
    const potPaintedBucket: THREE.BufferGeometry[] = [];
    const pierBucket: THREE.BufferGeometry[] = [];
    const overhangBucket: THREE.BufferGeometry[] = [];
    const goboFloorBucket: THREE.BufferGeometry[] = [];

    const cellMat = new THREE.Matrix4();
    const subMat = new THREE.Matrix4();
    const seenPiers = new Set<string>();

    const getWallTransform = (dir: WallDirection): { pos: [number, number, number]; rotY: number } => {
      const half = CELL_SIZE / 2;
      switch (dir) {
        case 'N':
          return { pos: [0, 0, -half], rotY: 0 };
        case 'S':
          return { pos: [0, 0, half], rotY: Math.PI };
        case 'W':
          return { pos: [-half, 0, 0], rotY: Math.PI / 2 };
        case 'E':
          return { pos: [half, 0, 0], rotY: -Math.PI / 2 };
      }
    };

    // Canonical structural owner so each physical wall between two cells is only built ONCE!
    const isStructuralWallOwner = (cell: MazeCell, dir: WallDirection): boolean => {
      if (dir === 'N' || dir === 'W') return true;
      if (dir === 'S' && cell.row === MAZE_ROWS - 1) return true;
      if (dir === 'E' && cell.col === MAZE_COLS - 1) return true;
      return false;
    };

    // Helper: Build a complete grounded wooden village door with stone threshold, timber jambs,
    // overhanging lintel, stone relief header, recessed plank door, cross-battens, and wrought-iron hardware
    const addGroundedVillageDoor = (
      parentMatrix: THREE.Matrix4,
      dx: number,
      doorW = 0.92,
      doorH = 1.96
    ) => {
      const cy = doorH / 2 + 0.06;
      // 1. Stone threshold step on ground (y = 0..0.10)
      pushTransformedGeo(
        sunlitMudBrickBucket,
        unitBoxBase,
        parentMatrix,
        dx,
        0.05,
        faceZ + 0.06,
        0,
        0,
        0,
        doorW + 0.30,
        0.10,
        0.14
      );
      // 2. Dark recessed doorway surround backplate
      pushTransformedGeo(
        windowPaneBucket,
        unitBoxBase,
        parentMatrix,
        dx,
        cy,
        faceZ + 0.01,
        0,
        0,
        0,
        doorW + 0.08,
        doorH + 0.04,
        0.02
      );
      // 3. Left & Right heavy timber door jamb posts
      const jambX = doorW / 2 + 0.055;
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        dx - jambX,
        cy + 0.01,
        faceZ + 0.048,
        0,
        0,
        0,
        0.11,
        doorH + 0.06,
        0.10
      );
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        dx + jambX,
        cy + 0.01,
        faceZ + 0.048,
        0,
        0,
        0,
        0.11,
        doorH + 0.06,
        0.10
      );
      // 4. Overhanging carved timber lintel beam + stone relief arch header
      const lintelY = doorH + 0.12;
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        dx,
        lintelY,
        faceZ + 0.065,
        0,
        0,
        0,
        doorW + 0.38,
        0.13,
        0.14
      );
      pushTransformedGeo(
        sunlitMudBrickBucket,
        unitBoxBase,
        parentMatrix,
        dx,
        lintelY + 0.12,
        faceZ + 0.035,
        0,
        0,
        0,
        doorW + 0.22,
        0.11,
        0.08
      );
      // 5. Recessed wooden plank door leaf (split into left & right leaves with center seam)
      const leafW = (doorW - 0.02) / 2;
      pushTransformedGeo(
        woodBucket,
        unitBoxBase,
        parentMatrix,
        dx - leafW / 2 - 0.006,
        cy,
        faceZ + 0.032,
        0,
        0,
        0,
        leafW,
        doorH,
        0.045
      );
      pushTransformedGeo(
        woodBucket,
        unitBoxBase,
        parentMatrix,
        dx + leafW / 2 + 0.006,
        cy,
        faceZ + 0.032,
        0,
        0,
        0,
        leafW,
        doorH,
        0.045
      );
      // 6. Horizontal wooden cross-battens across the door
      for (const by of [0.38, cy, doorH - 0.24]) {
        pushTransformedGeo(
          woodFrameBucket,
          unitBoxBase,
          parentMatrix,
          dx,
          by,
          faceZ + 0.056,
          0,
          0,
          0,
          doorW - 0.04,
          0.065,
          0.022
        );
      }
      // 7. Wrought-iron hinge straps & ring knocker handle
      for (const hy of [0.48, doorH - 0.34]) {
        pushTransformedGeo(
          ironBucket,
          unitBoxBase,
          parentMatrix,
          dx - doorW * 0.32,
          hy,
          faceZ + 0.066,
          0,
          0,
          0,
          doorW * 0.28,
          0.035,
          0.016
        );
        pushTransformedGeo(
          ironBucket,
          unitBoxBase,
          parentMatrix,
          dx + doorW * 0.32,
          hy,
          faceZ + 0.066,
          0,
          0,
          0,
          doorW * 0.28,
          0.035,
          0.016
        );
      }
      pushTransformedGeo(
        ironBucket,
        ironRingBase,
        parentMatrix,
        dx + 0.14,
        cy - 0.02,
        faceZ + 0.072,
        0,
        0,
        0,
        0.85,
        0.85,
        0.85
      );
      pushTransformedGeo(
        ironBucket,
         ironRingBase,
        parentMatrix,
        dx - 0.14,
        cy - 0.02,
        faceZ + 0.072,
        0,
        0,
        0,
        0.85,
        0.85,
        0.85
      );
    };

    // Helper: Build a complete traditional casement window with stone sill, overhanging timber lintel,
    // 4-sided timber frame, dark recessed pane, muntin lattice bars, and optional open side shutters
    const addCasementWindow = (
      parentMatrix: THREE.Matrix4,
      wx: number,
      wy: number,
      winW = 0.88,
      winH = 1.02,
      withShutters = true
    ) => {
      const halfWinW = winW / 2;
      const halfWinH = winH / 2;

      // 1. Protruding stone window sill at bottom
      pushTransformedGeo(
        sunlitMudBrickBucket,
        unitBoxBase,
        parentMatrix,
        wx,
        wy - halfWinH - 0.055,
        faceZ + 0.065,
        0,
        0,
        0,
        winW + 0.22,
        0.085,
        0.14
      );
      // 2. Overhanging timber lintel at top
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        wx,
        wy + halfWinH + 0.065,
        faceZ + 0.065,
        0,
        0,
        0,
        winW + 0.26,
        0.105,
        0.14
      );
      // 3. Dark recessed window glass pane
      pushTransformedGeo(
        windowPaneBucket,
        unitBoxBase,
        parentMatrix,
        wx,
        wy,
        faceZ + 0.016,
        0,
        0,
        0,
        winW - 0.06,
        winH - 0.06,
        0.028
      );
      // 4. Full 4-sided outer timber window frame (Top, Bottom, Left, Right)
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        wx,
        wy + halfWinH - 0.02,
        faceZ + 0.042,
        0,
        0,
        0,
        winW + 0.04,
        0.07,
        0.08
      );
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        wx,
        wy - halfWinH + 0.02,
        faceZ + 0.042,
        0,
        0,
        0,
        winW + 0.04,
        0.07,
        0.08
      );
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        wx - halfWinW + 0.02,
        wy,
        faceZ + 0.042,
        0,
        0,
        0,
        0.075,
        winH,
        0.08
      );
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        wx + halfWinW - 0.02,
        wy,
        faceZ + 0.042,
        0,
        0,
        0,
        0.075,
        winH,
        0.08
      );
      // 5. Center vertical mullion & horizontal muntin crossbars (`+` grid)
      pushTransformedGeo(
        woodFrameBucket,
        unitBoxBase,
        parentMatrix,
        wx,
        wy,
        faceZ + 0.04,
        0,
        0,
        0,
        0.042,
        winH - 0.08,
        0.06
      );
      for (const my of [-winH * 0.18, winH * 0.18]) {
        pushTransformedGeo(
          woodFrameBucket,
          unitBoxBase,
          parentMatrix,
          wx,
          wy + my,
          faceZ + 0.038,
          0,
          0,
          0,
          winW - 0.08,
          0.036,
          0.055
        );
      }
      // 6. Optional Open Wooden Side Shutters Flanking the Window
      if (withShutters) {
        const shutterW = 0.18;
        const shutterX = halfWinW + shutterW / 2 + 0.025;
        pushTransformedGeo(
          woodBucket,
          unitBoxBase,
          parentMatrix,
          wx - shutterX,
          wy,
          faceZ + 0.042,
          0,
          0.18,
          0,
          shutterW,
          winH - 0.02,
          0.038
        );
        pushTransformedGeo(
          woodBucket,
          unitBoxBase,
          parentMatrix,
          wx + shutterX,
          wy,
          faceZ + 0.042,
          0,
          -0.18,
          0,
          shutterW,
          winH - 0.02,
          0.038
        );
      }
    };

    // Helper: Build a detailed 3D Amphora / Water Jar with foot, body, neck, lip rim & side handles
    const addSculptedAmphora = (
      targetPotBucket: THREE.BufferGeometry[],
      parentMatrix: THREE.Matrix4,
      ax: number,
      ay: number,
      az: number,
      scaleX = 1.0,
      scaleY = 1.0
    ) => {
      // Foot ring
      pushTransformedGeo(
        targetPotBucket,
        clayNeckBase,
        parentMatrix,
        ax,
        ay + 0.04 * scaleY,
        az,
        0,
        0,
        0,
        0.95 * scaleX,
        0.5 * scaleY,
        0.95 * scaleX
      );
      // Rounded vessel belly
      pushTransformedGeo(
        targetPotBucket,
        clayVaseBase,
        parentMatrix,
        ax,
        ay + 0.22 * scaleY,
        az,
        0,
        0,
        0,
        scaleX,
        1.25 * scaleY,
        scaleX
      );
      // Neck
      pushTransformedGeo(
        targetPotBucket,
        clayNeckBase,
        parentMatrix,
        ax,
        ay + 0.42 * scaleY,
        az,
        0,
        0,
        0,
        0.95 * scaleX,
        1.1 * scaleY,
        0.95 * scaleX
      );
      // Flared Lip Rim
      pushTransformedGeo(
        targetPotBucket,
        clayRimBase,
        parentMatrix,
        ax,
        ay + 0.49 * scaleY,
        az,
        0,
        0,
        0,
        scaleX,
        scaleY,
        scaleX
      );
      // Twin Curved Handles
      pushTransformedGeo(
        targetPotBucket,
        clayHandleBase,
        parentMatrix,
        ax - 0.11 * scaleX,
        ay + 0.35 * scaleY,
        az,
        0,
        0,
        Math.PI / 2,
        scaleY,
        scaleX,
        scaleX
      );
      pushTransformedGeo(
        targetPotBucket,
        clayHandleBase,
        parentMatrix,
        ax + 0.11 * scaleX,
        ay + 0.35 * scaleY,
        az,
        0,
        0,
        -Math.PI / 2,
        scaleY,
        scaleX,
        scaleX
      );
    };

    // Helper: Populate a lush purple bougainvillea bush with woody stems, foliage & blossoms
    const addPurpleFlowerBush = (
      parentMatrix: THREE.Matrix4,
      cx: number,
      cy: number,
      cz: number,
      scaleMul: number,
      seed: number
    ) => {
      // Green foliage base
      for (let i = 0; i < 8; i++) {
        const ox = (pseudoRandom(seed + i * 3) - 0.5) * 0.72 * scaleMul;
        const oy = (pseudoRandom(seed + i * 5) - 0.3) * 0.62 * scaleMul;
        const oz = (pseudoRandom(seed + i * 7) - 0.3) * 0.48 * scaleMul;
        const s = (0.82 + pseudoRandom(seed + i * 11) * 0.52) * scaleMul;
        pushTransformedGeo(
          vineBucket,
          vineFoliageClusterBase,
          parentMatrix,
          cx + ox,
          cy + oy,
          cz + oz,
          pseudoRandom(seed + i) * 2,
          pseudoRandom(seed + i * 2) * 2,
          0,
          s * 1.15,
          s * 0.9,
          s * 0.85
        );
      }
      // Rich purple & lavender flower clusters
      for (let i = 0; i < 15; i++) {
        const ox = (pseudoRandom(seed + 100 + i * 3) - 0.5) * 0.88 * scaleMul;
        const oy = (pseudoRandom(seed + 100 + i * 5) - 0.25) * 0.78 * scaleMul;
        const oz = (pseudoRandom(seed + 100 + i * 7) - 0.25) * 0.52 * scaleMul;
        const s = (0.62 + pseudoRandom(seed + 100 + i * 13) * 0.52) * scaleMul;
        const targetBucket = i % 2 === 0 ? flowerPurpleBucket : flowerLavenderBucket;
        pushTransformedGeo(
          targetBucket,
          flowerClusterBase,
          parentMatrix,
          cx + ox,
          cy + oy,
          cz + oz,
          pseudoRandom(seed + i * 9) * 3,
          pseudoRandom(seed + i * 15) * 3,
          0,
          s,
          s * 0.88,
          s * 0.88
        );
      }
    };

    for (const cell of MAZE_DATA.cells) {
      const cellSeed = cell.row * 31 + cell.col * 17;
      cellMat.makeTranslation(cell.x, 0, cell.z);

      // Cobblestone floor tile
      pushTransformedGeo(floorBucket, floorTileBase, cellMat, 0, 0, 0, -Math.PI / 2, 0, 0);

      // Dappled palm shadow / sunlight projection on sunlit cells
      if ((cell.row + cell.col) % 2 === 0) {
        pushTransformedGeo(
          goboFloorBucket,
          goboFloorBase,
          cellMat,
          0,
          0.014,
          0,
          -Math.PI / 2,
          0,
          (cellSeed % 6) * 0.52
        );
      }

      // Corner mud-brick piers (with capital trim cap at top)
      const pierCoords = [
        [-CELL_SIZE / 2, -CELL_SIZE / 2],
        [CELL_SIZE / 2, -CELL_SIZE / 2],
        [-CELL_SIZE / 2, CELL_SIZE / 2],
        [CELL_SIZE / 2, CELL_SIZE / 2],
      ];
      for (const [px, pz] of pierCoords) {
        const wx = cell.x + px;
        const wz = cell.z + pz;
        const pk = `${wx.toFixed(2)},${wz.toFixed(2)}`;
        if (!seenPiers.has(pk)) {
          seenPiers.add(pk);
          pushTransformedGeo(pierBucket, pierBase, cellMat, px, WALL_HEIGHT / 2, pz);
          pushTransformedGeo(
            sunlitMudBrickBucket,
            unitBoxBase,
            cellMat,
            px,
            WALL_HEIGHT + 0.10,
            pz,
            0,
            0,
            0,
            0.70,
            0.10,
            0.70
          );
        }
      }

      // 3D Wrought-Iron & Glowing Amber Hanging Village Lanterns at Lantern Cells
      if (cell.hasLantern) {
        const lx = -CELL_SIZE / 2 + 0.34;
        const lz = -CELL_SIZE / 2 + 0.34;
        const ly = 2.65;
        // Iron wall bracket arm
        pushTransformedGeo(ironBucket, unitBoxBase, cellMat, lx + 0.14, ly + 0.22, lz + 0.14, 0, Math.PI / 4, 0, 0.36, 0.04, 0.04);
        // Lantern cap, glass core & base
        pushTransformedGeo(ironBucket, lanternCapBase, cellMat, lx + 0.24, ly + 0.14, lz + 0.24);
        pushTransformedGeo(lanternGlassBucket, lanternGlassBase, cellMat, lx + 0.24, ly - 0.02, lz + 0.24);
        pushTransformedGeo(ironBucket, lanternCageBase, cellMat, lx + 0.24, ly - 0.02, lz + 0.24, 0, 0, 0, 1.02, 0.15, 1.02);
      }

      // Landmark Centerpiece 1: The Old Well at [3, 3]
      if (cell.zoneId === 'old-well') {
        const wellWall = new THREE.CylinderGeometry(0.62, 0.68, 0.72, 16);
        const wellCoping = new THREE.TorusGeometry(0.62, 0.085, 10, 20);
        wellCoping.rotateX(Math.PI / 2);
        const wellWater = new THREE.CircleGeometry(0.54, 16);
        wellWater.rotateX(-Math.PI / 2);

        pushTransformedGeo(sunlitMudBrickBucket, wellWall, cellMat, 0, 0.36, 0);
        pushTransformedGeo(sunlitMudBrickBucket, wellCoping, cellMat, 0, 0.72, 0);
        pushTransformedGeo(turquoiseTileBucket, wellWater, cellMat, 0, 0.56, 0);
        wellWall.dispose();
        wellCoping.dispose();
        wellWater.dispose();

        // Twin carved cedar posts, windlass roller, iron crank, pitched canopy roof & hanging bucket
        pushTransformedGeo(woodFrameBucket, gateTimberPostBase, cellMat, -0.54, 1.18, 0, 0, 0, 0, 0.58, 0.68, 0.58);
        pushTransformedGeo(woodFrameBucket, gateTimberPostBase, cellMat, 0.54, 1.18, 0, 0, 0, 0, 0.58, 0.68, 0.58);
        pushTransformedGeo(woodFrameBucket, unitBoxBase, cellMat, 0, 2.28, 0, 0, 0, 0, 1.42, 0.14, 0.24);
        // Pitched gable roof slopes
        pushTransformedGeo(woodBucket, unitBoxBase, cellMat, 0, 2.52, -0.28, 0.42, 0, 0, 1.56, 0.06, 0.72);
        pushTransformedGeo(woodBucket, unitBoxBase, cellMat, 0, 2.52, 0.28, -0.42, 0, 0, 1.56, 0.06, 0.72);
        // Windlass roller & hanging bucket
        pushTransformedGeo(woodBucket, roofTimberLogBase, cellMat, 0, 1.62, 0, 0, Math.PI / 2, 0, 0.85, 0.85, 1.12);
        pushTransformedGeo(ironBucket, unitBoxBase, cellMat, 0, 1.32, 0, 0, 0, 0, 0.025, 0.55, 0.025);
        pushTransformedGeo(woodFrameBucket, clayNeckBase, cellMat, 0, 1.02, 0, 0, 0, 0, 1.45, 1.55, 1.45);
        // Well-side water amphora
        addSculptedAmphora(potPaintedBucket, cellMat, 0.78, 0, 0.42, 0.95, 1.05);
      } else if (cell.zoneId === 'sunset-terrace') {
        // Landmark Centerpiece 2: Stepped Sandstone & Glazed Turquoise Tile Pavilion Pedestal at [1, 5]
        const step1 = new THREE.CylinderGeometry(0.82, 0.88, 0.16, 8);
        const step2 = new THREE.CylinderGeometry(0.62, 0.68, 0.18, 8);
        const tileInlay = new THREE.CylinderGeometry(0.52, 0.52, 0.06, 8);
        pushTransformedGeo(sunlitMudBrickBucket, step1, cellMat, 0, 0.08, 0);
        pushTransformedGeo(sunlitMudBrickBucket, step2, cellMat, 0, 0.25, 0);
        pushTransformedGeo(turquoiseTileBucket, tileInlay, cellMat, 0, 0.36, 0);
        step1.dispose();
        step2.dispose();
        tileInlay.dispose();
      }

      for (const dir of ['N', 'S', 'E', 'W'] as WallDirection[]) {
        const feat = cell.walls[dir];
        if (feat === 'open') continue;

        const { pos, rotY } = getWallTransform(dir);
        const wallSeed = cellSeed * 7 + (dir === 'N' ? 1 : dir === 'S' ? 2 : dir === 'E' ? 3 : 4);
        const isOwner = isStructuralWallOwner(cell, dir);

        _pos.set(cell.x + pos[0], pos[1], cell.z + pos[2]);
        _euler.set(0, rotY, 0, 'XYZ');
        _quat.setFromEuler(_euler);
        _scale.set(1, 1, 1);
        subMat.compose(_pos, _quat, _scale);

        // ===================================================================
        // 1. STRUCTURAL WALL BODY & ROOFLINE (Built ONCE per unique boundary!)
        // ===================================================================
        if (isOwner) {
          pushTransformedGeo(overhangBucket, overhangBase, subMat, 0, WALL_HEIGHT, 0);

          // Protruding wooden roof timber beams (rondels) near top of wall
          for (const tx of [-1.45, -0.48, 0.48, 1.45]) {
            pushTransformedGeo(
              woodFrameBucket,
              roofTimberLogBase,
              subMat,
              tx,
              WALL_HEIGHT - 0.24,
              0
            );
          }

          // Stepped mud-brick parapet cap along roofline
          if (wallSeed % 2 === 0) {
            pushTransformedGeo(
              sunlitMudBrickBucket,
              parapetCapBase,
              subMat,
              (pseudoRandom(wallSeed) - 0.5) * 1.2,
              WALL_HEIGHT + 0.14,
              0
            );
          }

          if (feat === 'arch') {
            pushTransformedGeo(sunlitMudBrickBucket, pointedArchBase, subMat);
          } else if (feat === 'palm-gate') {
            // Open passage with side mud-brick piers, timber posts, overhead pergola beam & rafters
            const sideCenterX = archHalfW + gateSideWallW / 2;
            pushTransformedGeo(mudBrickBucket, gateSideWallBase, subMat, -sideCenterX, WALL_HEIGHT / 2, 0);
            pushTransformedGeo(mudBrickBucket, gateSideWallBase, subMat, sideCenterX, WALL_HEIGHT / 2, 0);
            pushTransformedGeo(woodFrameBucket, gateTimberPostBase, subMat, -archHalfW + 0.06, WALL_HEIGHT / 2, 0);
            pushTransformedGeo(woodFrameBucket, gateTimberPostBase, subMat, archHalfW - 0.06, WALL_HEIGHT / 2, 0);
            pushTransformedGeo(woodFrameBucket, gateTrellisBeamBase, subMat, 0, WALL_HEIGHT - 0.22, 0);
            for (const rx of [-0.92, -0.32, 0.32, 0.92]) {
              pushTransformedGeo(woodFrameBucket, gateCrossRafterBase, subMat, rx, WALL_HEIGHT - 0.12, 0);
            }
            addPurpleFlowerBush(subMat, -0.82, WALL_HEIGHT - 0.12, 0, 0.88, wallSeed + 41);
          } else {
            // Closed wall structural core (solid, window, vine-wall, niche)
            pushTransformedGeo(mudBrickBucket, solidWallBase, subMat, 0, WALL_HEIGHT / 2, 0);
          }
        }

        // Open passages ('arch' / 'palm-gate') have no closed-wall facade elements
        if (feat === 'arch' || feat === 'palm-gate') continue;

        // ===================================================================
        // 2. CORRIDOR-FACING FACADE ELEMENTS (Strictly on +faceZ side!)
        // ===================================================================
        if (feat === 'window') {
          // A. Left Side (x = -0.92): Grounded Traditional Wooden Village Door + Upper Transom
          addGroundedVillageDoor(subMat, -0.92, 0.88, 1.94);
          addCasementWindow(subMat, -0.92, 2.56, 0.68, 0.38, false);

          // B. Right Side (x = +0.76): Shuttered Casement Window + Exposed Brick Patch Below Sill
          addCasementWindow(subMat, 0.76, 1.86, 1.04, 1.02, true);
          pushTransformedGeo(
            exposedBrickBucket,
            exposedBrickPatchBase,
            subMat,
            0.76,
            0.62,
            faceZ + 0.014,
            0,
            0,
            0,
            1.15,
            0.74,
            1
          );

          // Corner grass tufts strictly away from the door threshold
          for (const gx of [-1.72, 0.22, 1.38]) {
            const gs = 0.72 + pseudoRandom(wallSeed + gx * 10) * 0.35;
            pushTransformedGeo(
              grassBucket,
              grassTuftBase,
              subMat,
              gx,
              0.10 * gs,
              faceZ + 0.08,
              0,
              pseudoRandom(wallSeed + gx) * Math.PI,
              0,
              gs,
              gs,
              gs
            );
          }
        } else if (feat === 'solid') {
          if (wallSeed % 3 === 0) {
            // Centered Grounded Wooden Doorway + Flanking Symmetric Upper Casement Windows
            addGroundedVillageDoor(subMat, 0, 0.94, 1.98);
            addCasementWindow(subMat, -1.26, 2.02, 0.62, 0.76, false);
            addCasementWindow(subMat, 1.26, 2.02, 0.62, 0.76, false);

            // Corner grass tufts on left and right sides of the door
            for (const gx of [-1.52, -1.05, 1.05, 1.52]) {
              const gs = 0.68 + pseudoRandom(wallSeed + gx * 7) * 0.4;
              pushTransformedGeo(grassBucket, grassTuftBase, subMat, gx, 0.10 * gs, faceZ + 0.08, 0, gx, 0, gs, gs, gs);
            }
          } else {
            // Centered Shuttered Casement Window + Flanking Shallow Exposed Mud-Brick Patches
            addCasementWindow(subMat, 0, 1.98, 0.86, 0.94, true);
            pushTransformedGeo(
              exposedBrickBucket,
              exposedBrickPatchBase,
              subMat,
              -1.18,
              1.18,
              faceZ + 0.014,
              0,
              0,
              0,
              0.92,
              1.15,
              1
            );
            pushTransformedGeo(
              exposedBrickBucket,
              exposedBrickPatchBase,
              subMat,
              1.18,
              1.42,
              faceZ + 0.014,
              0,
              0,
              0,
              0.88,
              0.96,
              1
            );

            for (let g = 0; g < 4; g++) {
              const gx = -1.55 + g * 1.02 + (pseudoRandom(wallSeed + g * 13) - 0.5) * 0.25;
              const gs = 0.68 + pseudoRandom(wallSeed + g * 19) * 0.45;
              pushTransformedGeo(grassBucket, grassTuftBase, subMat, gx, 0.10 * gs, faceZ + 0.08, 0, g, 0, gs, gs, gs);
            }
          }

          // Cascading purple bougainvillea blossoms along the upper wall crest in key flower zones
          if (
            (cell.row === 3 && cell.col === 1) ||
            (cell.row === 1 && cell.col === 2) ||
            (cell.row === 2 && cell.col === 2) ||
            wallSeed % 6 === 0
          ) {
            addPurpleFlowerBush(subMat, 0.45, WALL_HEIGHT - 0.32, faceZ + 0.22, 1.08, wallSeed);
          }
        } else if (feat === 'vine-wall') {
          // Right side: Clean Casement Window + Exposed Brick Patch Below
          addCasementWindow(subMat, 1.08, 1.92, 0.82, 0.92, true);
          pushTransformedGeo(
            exposedBrickBucket,
            exposedBrickPatchBase,
            subMat,
            1.08,
            0.72,
            faceZ + 0.014,
            0,
            0,
            0,
            0.95,
            0.76,
            1
          );

          // Left & Center (x = -1.55 .. +0.20): Lush Climbing Green Vine Trellis with Red Pomegranate Berries
          for (const sx of [-1.25, -0.68, -0.15]) {
            pushTransformedGeo(
              woodFrameBucket,
              vineStemBase,
              subMat,
              sx,
              1.35,
              faceZ + 0.03,
              0,
              0,
              (pseudoRandom(wallSeed + sx * 10) - 0.5) * 0.22,
              1,
              2.4,
              1
            );
          }

          for (let i = 0; i < 22; i++) {
            const vx = -1.48 + pseudoRandom(wallSeed + i * 3) * 1.72;
            const vy = 0.68 + pseudoRandom(wallSeed + i * 5) * (WALL_HEIGHT - 0.68);
            const vz = faceZ + 0.09 + pseudoRandom(wallSeed + i * 7) * 0.14;
            const vs = 0.72 + pseudoRandom(wallSeed + i * 11) * 0.62;

            pushTransformedGeo(
              vineBucket,
              vineFoliageClusterBase,
              subMat,
              vx,
              vy,
              vz,
              pseudoRandom(wallSeed + i) * 3,
              pseudoRandom(wallSeed + i * 2) * 3,
              0,
              vs * 1.1,
              vs * 0.95,
              vs * 0.72
            );

            // Bright glossy red berries on the vine foliage
            for (let b = 0; b < 2; b++) {
              const bx = vx + (pseudoRandom(wallSeed + i * 17 + b) - 0.5) * 0.24;
              const by = vy + (pseudoRandom(wallSeed + i * 23 + b) - 0.5) * 0.24;
              const bz = vz + 0.11 + pseudoRandom(wallSeed + i * 29 + b) * 0.06;
              const bs = 0.85 + pseudoRandom(wallSeed + i * 31 + b) * 0.42;
              pushTransformedGeo(berryBucket, berrySphereBase, subMat, bx, by, bz, 0, 0, 0, bs, bs, bs);
            }
          }
        } else if (feat === 'niche') {
          // Centered Recessed Architectural Display Niche (x = 0, y = 1.05..2.02)
          pushTransformedGeo(windowPaneBucket, unitBoxBase, subMat, 0, 1.52, faceZ + 0.015, 0, 0, 0, 0.78, 0.88, 0.025);
          // Stone sill, side pilasters & header hood
          pushTransformedGeo(sunlitMudBrickBucket, unitBoxBase, subMat, 0, 1.04, faceZ + 0.08, 0, 0, 0, 1.02, 0.10, 0.18);
          pushTransformedGeo(sunlitMudBrickBucket, unitBoxBase, subMat, -0.43, 1.52, faceZ + 0.05, 0, 0, 0, 0.10, 0.88, 0.10);
          pushTransformedGeo(sunlitMudBrickBucket, unitBoxBase, subMat, 0.43, 1.52, faceZ + 0.05, 0, 0, 0, 0.10, 0.88, 0.10);
          pushTransformedGeo(sunlitMudBrickBucket, unitBoxBase, subMat, 0, 2.00, faceZ + 0.065, 0, 0, 0, 1.06, 0.11, 0.14);
          // Sculpted Painted Amphora resting squarely on the niche sill
          addSculptedAmphora(potPaintedBucket, subMat, 0, 1.09, faceZ + 0.08, 0.88, 1.05);

          // Flanking Symmetric Upper Windows on Left & Right of the Niche
          addCasementWindow(subMat, -1.22, 1.96, 0.66, 0.78, false);
          addCasementWindow(subMat, 1.22, 1.96, 0.66, 0.78, false);
        }
      }
    }

    // Populate all 3D Village Decorations from MAZE_DATA.decorations
    for (let idx = 0; idx < MAZE_DATA.decorations.length; idx++) {
      const deco = MAZE_DATA.decorations[idx];
      _pos.set(deco.position[0], deco.position[1], deco.position[2]);
      _euler.set(0, deco.rotationY, 0, 'XYZ');
      _quat.setFromEuler(_euler);
      _scale.set(1, 1, 1);
      subMat.compose(_pos, _quat, _scale);

      if (deco.variant === 'clay-pot-pair') {
        // Tall ribbed amphora + painted water jar + small terracotta bowl
        addSculptedAmphora(potBucket, subMat, -0.15, 0, 0, 1.12, 1.38);
        addSculptedAmphora(potPaintedBucket, subMat, 0.18, 0, 0.12, 0.96, 1.02);
      } else if (deco.variant === 'flower-bush') {
        // Stone corner planter box + lush cascading purple bougainvillea
        pushTransformedGeo(sunlitMudBrickBucket, unitBoxBase, subMat, 0, 0.18, 0, 0, 0, 0, 0.76, 0.36, 0.68);
        addPurpleFlowerBush(subMat, 0, 0.58, 0, 1.05, idx * 53 + 19);
      } else if (deco.variant === 'wooden-crate') {
        // Slatted wooden merchant crate with corner posts + amphora atop
        pushTransformedGeo(woodBucket, unitBoxBase, subMat, 0, 0.24, 0, 0, 0, 0, 0.54, 0.48, 0.54);
        pushTransformedGeo(woodFrameBucket, unitBoxBase, subMat, 0, 0.47, 0, 0, 0, 0, 0.58, 0.04, 0.58);
        pushTransformedGeo(woodFrameBucket, unitBoxBase, subMat, 0, 0.03, 0, 0, 0, 0, 0.58, 0.04, 0.58);
        addSculptedAmphora(potBucket, subMat, 0.02, 0.48, 0, 0.78, 0.92);
      }
    }

    // Dispose temporary primitive templates
    [
      floorTileBase,
      solidWallBase,
      pointedArchBase,
      gateSideWallBase,
      gateTimberPostBase,
      gateTrellisBeamBase,
      gateCrossRafterBase,
      roofTimberLogBase,
      exposedBrickPatchBase,
      parapetCapBase,
      unitBoxBase,
      ironRingBase,
      vineStemBase,
      vineFoliageClusterBase,
      berrySphereBase,
      flowerClusterBase,
      grassTuftBase,
      clayVaseBase,
      clayNeckBase,
      clayRimBase,
      clayHandleBase,
      pierBase,
      overhangBase,
      goboFloorBase,
      lanternCageBase,
      lanternCapBase,
      lanternGlassBase,
    ].forEach((g) => g.dispose());

    return {
      floorGeo: mergeBufferGeometries(floorBucket),
      mudBrickGeo: mergeBufferGeometries(mudBrickBucket),
      sunlitMudBrickGeo: mergeBufferGeometries(sunlitMudBrickBucket),
      exposedBrickGeo: mergeBufferGeometries(exposedBrickBucket),
      woodGeo: mergeBufferGeometries(woodBucket),
      woodFrameGeo: mergeBufferGeometries(woodFrameBucket),
      ironGeo: mergeBufferGeometries(ironBucket),
      lanternGlassGeo: mergeBufferGeometries(lanternGlassBucket),
      turquoiseTileGeo: mergeBufferGeometries(turquoiseTileBucket),
      windowPaneGeo: mergeBufferGeometries(windowPaneBucket),
      vineGeo: mergeBufferGeometries(vineBucket),
      berryGeo: mergeBufferGeometries(berryBucket),
      flowerPurpleGeo: mergeBufferGeometries(flowerPurpleBucket),
      flowerLavenderGeo: mergeBufferGeometries(flowerLavenderBucket),
      grassGeo: mergeBufferGeometries(grassBucket),
      potGeo: mergeBufferGeometries(potBucket),
      potPaintedGeo: mergeBufferGeometries(potPaintedBucket),
      pierGeo: mergeBufferGeometries(pierBucket),
      overhangGeo: mergeBufferGeometries(overhangBucket),
      goboFloorGeo: mergeBufferGeometries(goboFloorBucket),
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.065);
    const t = clock.getElapsedTime();

    if (relicsGroupRef.current) {
      relicsGroupRef.current.children.forEach((child, i) => {
        child.rotation.y += 1.5 * dt;
        child.position.y = 0.82 + Math.sin(t * 3 + i) * 0.12;
      });
    }

    if (markerRef.current && walkMarker) {
      markerRef.current.scale.setScalar(1 + Math.sin(t * 8) * 0.1);
      const mat = (markerRef.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 8) * 0.3;
    }

    const cp = characterPosRef.current;

    // Sort pool lights based on distance to character
    if (lightPoolRefs.current.length > 0) {
      const activeLanterns: { pos: THREE.Vector3; distSq: number }[] = [];
      for (const cell of MAZE_DATA.cells) {
        if (cell.hasLantern) {
          const lPos = new THREE.Vector3(
            cell.x - CELL_SIZE / 2 + 0.58,
            2.62,
            cell.z - CELL_SIZE / 2 + 0.58
          );
          activeLanterns.push({ pos: lPos, distSq: lPos.distanceToSquared(cp) });
        }
      }
      activeLanterns.sort((a, b) => a.distSq - b.distSq);

      const targetIntensity =
        sunMood === 'lantern-dusk' ? 1.85 : sunMood === 'amber-afternoon' ? 1.15 : 0.75;

      for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
        const light = lightPoolRefs.current[i];
        if (light) {
          if (i < activeLanterns.length) {
            light.position.copy(activeLanterns[i].pos);
            light.intensity = THREE.MathUtils.lerp(light.intensity, targetIntensity, dt * 5);
          } else {
            light.intensity = THREE.MathUtils.lerp(light.intensity, 0, dt * 5);
          }
        }
      }
    }
  });

  const handlePointerMove = (e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
    e.stopPropagation();
    const pt = e.point;
    const { row, col } = worldToCell(pt.x, pt.z);
    if (row >= 0 && row < MAZE_ROWS && col >= 0 && col < MAZE_COLS) {
      const cell = MAZE_DATA.cells[row * MAZE_COLS + col];
      if (cell && cell.zoneId !== lastHoveredCellZoneRef.current) {
        lastHoveredCellZoneRef.current = cell.zoneId || null;
        if (cell.zoneId) {
          const zone = LANDMARK_ZONES.find((z) => z.id === cell.zoneId);
          onHover(zone ? `${zone.title} — ${zone.subtitle}` : null);
        } else {
          onHover(null);
        }
      }
    } else if (lastHoveredCellZoneRef.current !== null) {
      lastHoveredCellZoneRef.current = null;
      onHover(null);
    }
  };

  const handlePointerOut = () => {
    lastHoveredCellZoneRef.current = null;
    onHover(null);
  };

  const activeDates = INITIAL_GOLDEN_DATES.filter(
    (d) => !collectedRelics.includes(d.id)
  );

  const targetZone =
    LANDMARK_ZONES.find((z) => z.id === targetZoneId) ||
    LANDMARK_ZONES[LANDMARK_ZONES.length - 1];

  return (
    <group>
      {/* Dynamic Point Light Pool (Zero Shadow Maps on Pool Lights for 60fps Performance) */}
      {Array.from({ length: LIGHT_POOL_SIZE }).map((_, i) => (
        <pointLight
          key={`pool-light-${i}`}
          ref={(el) => {
            lightPoolRefs.current[i] = el;
          }}
          distance={8.5}
          decay={2}
          color="#ffdca8"
          intensity={0}
        />
      ))}

      {/* Cobblestone Pathway Floor */}
      <mesh
        geometry={mergedArch.floorGeo}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          map={cobblestoneFloor.map}
          bumpMap={cobblestoneFloor.bumpMap}
          bumpScale={0.035}
          roughness={0.84}
        />
      </mesh>

      {/* Dappled Palm Frond Sunlight Pools on Cobblestones */}
      <mesh geometry={mergedArch.goboFloorGeo}>
        <meshBasicMaterial
          map={palmGobo}
          transparent
          opacity={sunMood === 'lantern-dusk' ? 0.12 : 0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Main Weathered Mud-Brick Walls */}
      <mesh geometry={mergedArch.mudBrickGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={mudBrickMain.map}
          bumpMap={mudBrickMain.bumpMap}
          bumpScale={0.04}
          roughness={0.86}
        />
      </mesh>

      {/* Sunlit Adobe Archways, Window Sills, Door Thresholds & Well Stonework */}
      <mesh geometry={mergedArch.sunlitMudBrickGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={mudBrickSunlit.map}
          bumpMap={mudBrickSunlit.bumpMap}
          bumpScale={0.035}
          roughness={0.82}
        />
      </mesh>

      {/* Exposed Mud-Brick Patches Showing Through Plaster */}
      <mesh geometry={mergedArch.exposedBrickGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={mudBrickExposed.map}
          bumpMap={mudBrickExposed.bumpMap}
          bumpScale={0.06}
          roughness={0.9}
        />
      </mesh>

      {/* Corner Mud-Brick Piers */}
      <mesh geometry={mergedArch.pierGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={mudBrickMain.map}
          bumpMap={mudBrickMain.bumpMap}
          bumpScale={0.04}
          roughness={0.86}
        />
      </mesh>

      {/* Upper Parapet Overhang Trim */}
      <mesh geometry={mergedArch.overhangGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={mudBrickSunlit.map}
          bumpMap={mudBrickSunlit.bumpMap}
          bumpScale={0.03}
          roughness={0.84}
        />
      </mesh>

      {/* Weathered Plank Doors & Louvered Window Shutters */}
      <mesh geometry={mergedArch.woodGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={woodenDoor.map}
          bumpMap={woodenDoor.bumpMap}
          bumpScale={0.04}
          roughness={0.78}
        />
      </mesh>

      {/* Carved Cedar Timber Lintels, Door Jambs, Window Frames, Muntin Grids & Roof Rondels */}
      <mesh geometry={mergedArch.woodFrameGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#5C3B24"
          map={woodenDoor.map}
          bumpMap={woodenDoor.bumpMap}
          bumpScale={0.03}
          roughness={0.72}
        />
      </mesh>

      {/* Wrought-Iron Door Hinges, Ring Knockers & Lantern Brackets */}
      <mesh geometry={mergedArch.ironGeo} castShadow>
        <meshStandardMaterial
          color="#262220"
          metalness={0.68}
          roughness={0.38}
        />
      </mesh>

      {/* Glowing Amber Lantern Glass Cores */}
      <mesh geometry={mergedArch.lanternGlassGeo}>
        <meshStandardMaterial
          color="#FFE3A8"
          emissive="#FF9E2C"
          emissiveIntensity={sunMood === 'lantern-dusk' ? 2.4 : 1.1}
          roughness={0.2}
        />
      </mesh>

      {/* Turquoise-Glazed Ceramic Tile Inlays & Well Water */}
      <mesh geometry={mergedArch.turquoiseTileGeo} receiveShadow>
        <meshStandardMaterial
          color="#2A8A8E"
          roughness={0.25}
          metalness={0.15}
        />
      </mesh>

      {/* Deep Shaded Window Panes & Doorway Recesses */}
      <mesh geometry={mergedArch.windowPaneGeo}>
        <meshStandardMaterial
          color={sunMood === 'lantern-dusk' ? '#5c3d1e' : '#1b1410'}
          emissive={sunMood === 'lantern-dusk' ? '#ff9d3b' : '#291c12'}
          emissiveIntensity={sunMood === 'lantern-dusk' ? 0.55 : 0.15}
          roughness={0.32}
        />
      </mesh>

      {/* Lush Climbing Vine & Bush Foliage */}
      <mesh geometry={mergedArch.vineGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#2E6F23" roughness={0.74} />
      </mesh>

      {/* Cobblestone Edge Grass Tufts */}
      <mesh geometry={mergedArch.grassGeo} receiveShadow>
        <meshStandardMaterial color="#46892E" roughness={0.78} />
      </mesh>

      {/* Glossy Red Pomegranate / Berry Clusters on Vines */}
      <mesh geometry={mergedArch.berryGeo} castShadow>
        <meshStandardMaterial
          color="#D92424"
          emissive="#5a0808"
          emissiveIntensity={0.22}
          roughness={0.3}
        />
      </mesh>

      {/* Voluminous Purple Bougainvillea / Jacaranda Blossoms (Rich Royal Violet) */}
      <mesh geometry={mergedArch.flowerPurpleGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#7D5CE0"
          emissive="#321b7a"
          emissiveIntensity={0.2}
          roughness={0.62}
        />
      </mesh>

      {/* Soft Lavender-Lilac Highlights on Bougainvillea Bushes */}
      <mesh geometry={mergedArch.flowerLavenderGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#A68CF5"
          emissive="#472d96"
          emissiveIntensity={0.2}
          roughness={0.6}
        />
      </mesh>

      {/* Ribbed Terracotta Amphorae & Jars */}
      <mesh geometry={mergedArch.potGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={clayPot.map}
          bumpMap={clayPot.bumpMap}
          bumpScale={0.03}
          roughness={0.68}
        />
      </mesh>

      {/* Painted Village Pottery */}
      <mesh geometry={mergedArch.potPaintedGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={clayPotPainted.map}
          bumpMap={clayPotPainted.bumpMap}
          bumpScale={0.03}
          roughness={0.66}
        />
      </mesh>

      {/* Collectible Golden Dates */}
      <group ref={relicsGroupRef}>
        {activeDates.map((date) => (
          <mesh
            key={`date-${date.id}`}
            geometry={relicDateGeo}
            position={[date.position[0], 0.82, date.position[2]]}
            castShadow
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(`🌴 ${date.name} — Walk over to collect!`);
            }}
            onPointerOut={() => onHover(null)}
          >
            <meshStandardMaterial
              color="#ffd700"
              emissive="#c8860b"
              emissiveIntensity={0.5}
              metalness={0.85}
              roughness={0.15}
            />
          </mesh>
        ))}
      </group>

      {/* Click-to-Walk Floor Destination Marker */}
      {walkMarker && (
        <group ref={markerRef} position={walkMarker}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.2, 0.26, 32]} />
            <meshBasicMaterial color="#ffe599" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Dynamic Golden Breadcrumb Guide Path Nodes */}
      {showGuidePath && (
        <GoldenBreadcrumbGuide
          characterPosRef={characterPosRef}
          targetZone={targetZone}
        />
      )}
    </group>
  );
}

const MAX_BREADCRUMB_DOTS = 28;

function GoldenBreadcrumbGuide({
  characterPosRef,
  targetZone,
}: {
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  targetZone: LandmarkZone;
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const lastCellKeyRef = useRef<string>('');
  const dotCircleGeo = useMemo(() => new THREE.CircleGeometry(0.075, 12), []);

  useFrame((state) => {
    const grp = groupRef.current;
    if (!grp) return;

    const pos = characterPosRef.current;
    const cellKey = `${Math.round(pos.x * 0.5)},${Math.round(pos.z * 0.5)},${targetZone.id}`;
    if (cellKey !== lastCellKeyRef.current) {
      lastCellKeyRef.current = cellKey;
      const waypoints = findMazePath(
        { x: pos.x, z: pos.z },
        { x: targetZone.x, z: targetZone.z }
      );
      const pts: THREE.Vector3[] = [new THREE.Vector3(pos.x, 0.04, pos.z), ...waypoints];
      let dotIdx = 0;
      for (let i = 0; i < pts.length - 1 && dotIdx < MAX_BREADCRUMB_DOTS; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const dist = a.distanceTo(b);
        const steps = Math.max(2, Math.floor(dist / 0.85));
        for (let s = 1; s <= steps && dotIdx < MAX_BREADCRUMB_DOTS; s++) {
          const child = grp.children[dotIdx];
          if (child) {
            child.position.set(
              THREE.MathUtils.lerp(a.x, b.x, s / steps),
              0.045,
              THREE.MathUtils.lerp(a.z, b.z, s / steps)
            );
            child.visible = true;
          }
          dotIdx++;
        }
      }
      for (let k = dotIdx; k < MAX_BREADCRUMB_DOTS; k++) {
        if (grp.children[k]) {
          grp.children[k].visible = false;
        }
      }
    }

    const t = state.clock.getElapsedTime();
    for (let idx = 0; idx < grp.children.length; idx++) {
      const c = grp.children[idx];
      if (c.visible) {
        c.position.y = 0.045 + Math.sin(t * 3.5 - idx * 0.45) * 0.022;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: MAX_BREADCRUMB_DOTS }).map((_, idx) => (
        <mesh
          key={idx}
          geometry={dotCircleGeo}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <meshBasicMaterial
            color={idx % 2 === 0 ? '#ffe596' : '#ffae42'}
            transparent
            opacity={Math.max(0.2, 0.72 - idx * 0.02)}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

