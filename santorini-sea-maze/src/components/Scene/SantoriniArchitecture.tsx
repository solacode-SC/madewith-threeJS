import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CELL_SIZE,
  WALL_HEIGHT,
  INITIAL_SEA_PEARLS,
  LANDMARK_ZONES,
  MAZE_DATA,
  WALL_THICKNESS,
  MAZE_ROWS,
  MAZE_COLS,
  findMazePath,
  worldToCell,
  type WallDirection,
  type WallFeatureType,
} from '../../utils/mazeLayout';
import {
  createWhitewashedStuccoTextures,
  createCoastalRoadTextures,
  createAegeanBlueWoodTextures,
  createWhiteAmphoraTextures,
  createPalmShadowGoboTexture,
} from '../../utils/textures';
import type { SunMood } from '../../hooks/useMazeState';

interface SantoriniArchitectureProps {
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

function shouldIncludeWall(
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

function getWallMatrix(cellX: number, cellZ: number, dir: WallDirection): THREE.Matrix4 {
  const half = CELL_SIZE / 2;
  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const euler = new THREE.Euler();

  switch (dir) {
    case 'N':
      pos.set(cellX, 0, cellZ - half);
      euler.set(0, 0, 0);
      break;
    case 'S':
      pos.set(cellX, 0, cellZ + half);
      euler.set(0, Math.PI, 0);
      break;
    case 'W':
      pos.set(cellX - half, 0, cellZ);
      euler.set(0, Math.PI / 2, 0);
      break;
    case 'E':
      pos.set(cellX + half, 0, cellZ);
      euler.set(0, -Math.PI / 2, 0);
      break;
  }
  quat.setFromEuler(euler);
  m.compose(pos, quat, scale);
  return m;
}

export default function SantoriniArchitecture({
  sunMood,
  showGuidePath,
  targetZoneId,
  collectedRelics,
  walkMarker,
  characterPosRef,
  onFloorClick,
  onHover,
}: SantoriniArchitectureProps) {
  const relicsGroupRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);
  const windmillSailsRef = useRef<THREE.Group>(null);
  const lighthouseBeamRef = useRef<THREE.Group>(null);
  const lightPoolRefs = useRef<Array<THREE.PointLight | null>>([]);
  const lastHoveredCellZoneRef = useRef<string | null>(null);

  // Shared Procedural Santorini Textures
  const stuccoWhite = useMemo(() => createWhitewashedStuccoTextures('sunlit-white'), []);
  const stuccoShade = useMemo(() => createWhitewashedStuccoTextures('periwinkle-shade'), []);
  const stuccoStep = useMemo(() => createWhitewashedStuccoTextures('terrace-step'), []);
  const roadTurquoise = useMemo(() => createCoastalRoadTextures('turquoise-steps'), []);
  const roadCobble = useMemo(() => createCoastalRoadTextures('white-cobble'), []);
  const aegeanBlueWood = useMemo(() => createAegeanBlueWoodTextures(), []);
  const whiteAmphora = useMemo(() => createWhiteAmphoraTextures(false), []);
  const bandedAmphora = useMemo(() => createWhiteAmphoraTextures(true), []);
  const palmGobo = useMemo(() => createPalmShadowGoboTexture(), []);

  // Collectible Sea Pearl Shell Geometry
  const pearlSphereGeo = useMemo(() => new THREE.SphereGeometry(0.14, 18, 16), []);

  // Pre-build & merge static Santorini architecture into shared BufferGeometries by material
  const mergedArch = useMemo(() => {
    const w = CELL_SIZE;
    const h = WALL_HEIGHT;
    const halfW = w / 2;
    const faceZ = WALL_THICKNESS / 2;
    const archHalfW = 1.38;
    const springY = 2.02;
    const apexY = 3.12;

    const floorTileBase = new THREE.PlaneGeometry(CELL_SIZE + 0.04, CELL_SIZE + 0.04);
    const solidWallBase = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS);
    const lowSeaWallBase = new THREE.BoxGeometry(CELL_SIZE, 0.92, WALL_THICKNESS);

    // Smooth Rounded Cycladic Archway
    const archShape = new THREE.Shape();
    archShape.moveTo(-halfW, 0);
    archShape.lineTo(-archHalfW, 0);
    archShape.lineTo(-archHalfW, springY);
    archShape.quadraticCurveTo(-archHalfW * 0.9, apexY, 0, apexY);
    archShape.quadraticCurveTo(archHalfW * 0.9, apexY, archHalfW, springY);
    archShape.lineTo(archHalfW, 0);
    archShape.lineTo(halfW, 0);
    archShape.lineTo(halfW, h);
    archShape.lineTo(-halfW, h);
    archShape.closePath();

    const cycladicArchBase = new THREE.ExtrudeGeometry(archShape, {
      depth: WALL_THICKNESS,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
    cycladicArchBase.translate(0, 0, -WALL_THICKNESS / 2);

    const posAttr = cycladicArchBase.attributes.position;
    const uvAttr = cycladicArchBase.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      uvAttr.setXY(i, (posAttr.getX(i) + halfW) / w, posAttr.getY(i) / h);
    }
    uvAttr.needsUpdate = true;
    cycladicArchBase.computeVertexNormals();

    // Primitives
    const unitBoxBase = new THREE.BoxGeometry(1, 1, 1);
    const unitCylinderBase = new THREE.CylinderGeometry(0.5, 0.5, 1, 18);
    const domeHemisphereBase = new THREE.SphereGeometry(
      1.0,
      24,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.52
    );
    const pierBase = new THREE.CylinderGeometry(0.36, 0.38, WALL_HEIGHT + 0.16, 16);
    const pierCapDomeBase = new THREE.SphereGeometry(
      0.36,
      14,
      10,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.5
    );
    const poolPlaneBase = new THREE.PlaneGeometry(2.6, 3.8);
    const goboPlaneBase = new THREE.PlaneGeometry(2.8, 2.8);

    // Amphora & Botanical Primitives
    const amphoraBellyBase = new THREE.SphereGeometry(0.24, 16, 14);
    const amphoraNeckBase = new THREE.CylinderGeometry(0.11, 0.14, 0.16, 14);
    const amphoraRimBase = new THREE.TorusGeometry(0.115, 0.024, 8, 16);
    amphoraRimBase.rotateX(Math.PI / 2);
    const cactusColumnBase = new THREE.CylinderGeometry(0.052, 0.058, 0.55, 10);
    const cactusPaddleBase = new THREE.SphereGeometry(0.12, 10, 10);
    const tropicalLeafBase = new THREE.ConeGeometry(0.16, 0.44, 5);
    const bougainvilleaClusterBase = new THREE.DodecahedronGeometry(0.25, 1);
    const lanternBellBase = new THREE.CylinderGeometry(0.08, 0.11, 0.22, 8);

    // Material Geometry Buckets
    const roadTurquoiseGeos: THREE.BufferGeometry[] = [];
    const roadCobbleGeos: THREE.BufferGeometry[] = [];
    const stuccoWhiteGeos: THREE.BufferGeometry[] = [];
    const stuccoShadeGeos: THREE.BufferGeometry[] = [];
    const stuccoStepGeos: THREE.BufferGeometry[] = [];
    const aegeanBlueWoodGeos: THREE.BufferGeometry[] = [];
    const blueDomeCupolaGeos: THREE.BufferGeometry[] = [];
    const aquaPoolWaterGeos: THREE.BufferGeometry[] = [];
    const whiteAmphoraGeos: THREE.BufferGeometry[] = [];
    const bandedAmphoraGeos: THREE.BufferGeometry[] = [];
    const cactusGreenGeos: THREE.BufferGeometry[] = [];
    const tropicalLeafGeos: THREE.BufferGeometry[] = [];
    const bougainvilleaPinkGeos: THREE.BufferGeometry[] = [];
    const bronzeBellGeos: THREE.BufferGeometry[] = [];
    const lanternGlowGeos: THREE.BufferGeometry[] = [];
    const goboShadowGeos: THREE.BufferGeometry[] = [];

    const identityMat = new THREE.Matrix4();

    // 1. Iterate through all 81 cells in the 9×9 Santorini Maze Grid
    for (const cell of MAZE_DATA.cells) {
      const { x, z, row, col, walls, roadStyle, roadRotation } = cell;

      // Floor Tile (Turquoise-Stepped Road or Whitewashed Cobblestone)
      const targetFloorBucket =
        roadStyle === 'turquoise-steps' || roadStyle === 'aqua-canal'
          ? roadTurquoiseGeos
          : roadCobbleGeos;

      pushTransformedGeo(
        targetFloorBucket,
        floorTileBase,
        identityMat,
        x,
        0,
        z,
        -Math.PI / 2,
        0,
        roadRotation
      );

      // Raised Whitewashed Stepped Terrace Curbs & Glowing Turquoise Pool along the road
      if (roadStyle === 'turquoise-steps' || roadStyle === 'aqua-canal') {
        const isNS = Math.abs(roadRotation) < 0.2;
        if (isNS) {
          // Left & Right Whitewashed Step Ledges framing the turquoise road (matches Image 2!)
          pushTransformedGeo(
            stuccoStepGeos,
            unitBoxBase,
            identityMat,
            x - 1.55,
            0.05,
            z,
            0,
            0,
            0,
            1.1,
            0.1,
            CELL_SIZE - 0.2
          );
          pushTransformedGeo(
            stuccoStepGeos,
            unitBoxBase,
            identityMat,
            x + 1.55,
            0.05,
            z,
            0,
            0,
            0,
            1.1,
            0.1,
            CELL_SIZE - 0.2
          );
          // Horizontal Whitewashed Step Risers across the turquoise road
          for (let s = -1; s <= 1; s++) {
            pushTransformedGeo(
              stuccoStepGeos,
              unitBoxBase,
              identityMat,
              x,
              0.018,
              z + s * 1.45,
              0,
              0,
              0,
              2.15,
              0.036,
              0.22
            );
          }
        } else {
          pushTransformedGeo(
            stuccoStepGeos,
            unitBoxBase,
            identityMat,
            x,
            0.05,
            z - 1.55,
            0,
            0,
            0,
            CELL_SIZE - 0.2,
            0.1,
            1.1
          );
          pushTransformedGeo(
            stuccoStepGeos,
            unitBoxBase,
            identityMat,
            x,
            0.05,
            z + 1.55,
            0,
            0,
            0,
            CELL_SIZE - 0.2,
            0.1,
            1.1
          );
        }
      }

      // Glowing Aquamarine Reflection Pool Inset (Matches foreground pool in Image 2!)
      if (cell.hasTurquoisePool) {
        pushTransformedGeo(
          aquaPoolWaterGeos,
          poolPlaneBase,
          identityMat,
          x,
          0.014,
          z,
          -Math.PI / 2,
          0,
          roadRotation
        );
      }

      // Rounded Whitewashed Cycladic Corner Piers with Soft Dome Caps
      const half = CELL_SIZE / 2;
      const corners = [
        [x - half, z - half],
        [x + half, z - half],
        [x - half, z + half],
        [x + half, z + half],
      ];
      for (const [cx, cz] of corners) {
        pushTransformedGeo(
          stuccoWhiteGeos,
          pierBase,
          identityMat,
          cx,
          (WALL_HEIGHT + 0.16) / 2,
          cz
        );
        pushTransformedGeo(
          stuccoWhiteGeos,
          pierCapDomeBase,
          identityMat,
          cx,
          WALL_HEIGHT + 0.15,
          cz
        );
      }

      // Signature Reference Photo Left-Foreground Low Curved Whitewashed Bench Wall at [6, 3]
      if (row === 6 && col === 3) {
        pushTransformedGeo(
          stuccoWhiteGeos,
          unitBoxBase,
          identityMat,
          x - 1.55,
          0.42,
          z + 1.15,
          0,
          0.18,
          0,
          0.75,
          0.84,
          1.45
        );
        pushTransformedGeo(
          stuccoWhiteGeos,
          domeHemisphereBase,
          identityMat,
          x - 1.55,
          0.82,
          z + 1.15,
          0,
          0.18,
          0,
          0.38,
          0.25,
          0.72
        );
      }

      // Upper-Story Whitewashed Cycladic Domes & Arched Chimney Cupolas Crowning Roofs
      if (cell.hasRoofDome && cell.zoneId !== 'blue-dome-cathedral') {
        const domeX = x + ((row % 2 === 0 ? 1 : -1) * 1.45);
        const domeZ = z - 1.45;
        // Whitewashed drum
        pushTransformedGeo(
          stuccoWhiteGeos,
          unitCylinderBase,
          identityMat,
          domeX,
          WALL_HEIGHT + 0.45,
          domeZ,
          0,
          0,
          0,
          1.45,
          0.9,
          1.45
        );
        // Classic Blue or White Cycladic Cupola Dome
        pushTransformedGeo(
          (row + col) % 2 === 0 ? blueDomeCupolaGeos : stuccoWhiteGeos,
          domeHemisphereBase,
          identityMat,
          domeX,
          WALL_HEIGHT + 0.88,
          domeZ,
          0,
          0,
          0,
          0.74,
          0.62,
          0.74
        );
      }

      // Hanging Coastal Lanterns
      if (cell.hasLantern) {
        pushTransformedGeo(
          bronzeBellGeos,
          lanternBellBase,
          identityMat,
          x + 1.35,
          WALL_HEIGHT - 0.55,
          z - 1.35
        );
        pushTransformedGeo(
          lanternGlowGeos,
          amphoraBellyBase,
          identityMat,
          x + 1.35,
          WALL_HEIGHT - 0.68,
          z - 1.35,
          0,
          0,
          0,
          0.34,
          0.42,
          0.34
        );
      }

      // =================================================================
      // WALLS, ARCHWAYS, BLUE DOORS, EXTERNAL STAIRS & SEA BALCONIES
      // =================================================================
      (['N', 'S', 'E', 'W'] as WallDirection[]).forEach((dir) => {
        if (!shouldIncludeWall(row, col, walls, dir)) return;
        const feat = walls[dir];
        const wMat = getWallMatrix(x, z, dir);
        const wallBucket = dir === 'N' || dir === 'W' ? stuccoWhiteGeos : stuccoShadeGeos;

        if (feat === 'cycladic-arch') {
          pushTransformedGeo(wallBucket, cycladicArchBase, wMat, 0, 0, 0);
          // Cute Cycladic arched chimney cupola on top of the arch (visible in Image 2!)
          pushTransformedGeo(
            stuccoWhiteGeos,
            unitBoxBase,
            wMat,
            -1.45,
            h + 0.38,
            0,
            0,
            0,
            0,
            0.42,
            0.76,
            0.38
          );
          pushTransformedGeo(
            blueDomeCupolaGeos,
            domeHemisphereBase,
            wMat,
            -1.45,
            h + 0.76,
            0,
            0,
            0,
            0,
            0.22,
            0.22,
            0.20
          );
        } else if (feat === 'bell-gate') {
          // Twin side piers + overhead Cycladic Bell-Gable Arch
          const sideW = (w - archHalfW * 2) / 2;
          pushTransformedGeo(
            wallBucket,
            unitBoxBase,
            wMat,
            -halfW + sideW / 2,
            h / 2,
            0,
            0,
            0,
            0,
            sideW,
            h,
            WALL_THICKNESS
          );
          pushTransformedGeo(
            wallBucket,
            unitBoxBase,
            wMat,
            halfW - sideW / 2,
            h / 2,
            0,
            0,
            0,
            0,
            sideW,
            h,
            WALL_THICKNESS
          );
          // Overhead whitewashed beam & bell arch
          pushTransformedGeo(
            stuccoWhiteGeos,
            unitBoxBase,
            wMat,
            0,
            h - 0.28,
            0,
            0,
            0,
            0,
            archHalfW * 2 + 0.4,
            0.52,
            WALL_THICKNESS + 0.08
          );
          pushTransformedGeo(
            bronzeBellGeos,
            lanternBellBase,
            wMat,
            0,
            h - 0.68,
            0,
            0,
            0,
            0,
            0.9,
            1.0,
            0.9
          );
        } else if (feat === 'sea-balcony') {
          // Low Cycladic Whitewashed Sea-Wall Parapet so the Aegean Sea is visible on the side!
          pushTransformedGeo(stuccoWhiteGeos, lowSeaWallBase, wMat, 0, 0.46, 0);
          // Rounded whitewashed coping rail
          pushTransformedGeo(
            stuccoStepGeos,
            unitBoxBase,
            wMat,
            0,
            0.94,
            0,
            0,
            0,
            0,
            CELL_SIZE,
            0.12,
            WALL_THICKNESS + 0.10
          );
          // Blue-capped corner bollards along the sea wall
          pushTransformedGeo(
            blueDomeCupolaGeos,
            domeHemisphereBase,
            wMat,
            -1.35,
            1.0,
            0,
            0,
            0,
            0,
            0.22,
            0.18,
            0.22
          );
          pushTransformedGeo(
            blueDomeCupolaGeos,
            domeHemisphereBase,
            wMat,
            1.35,
            1.0,
            0,
            0,
            0,
            0,
            0.22,
            0.18,
            0.22
          );
        } else {
          // Solid Whitewashed Wall Base
          pushTransformedGeo(wallBucket, solidWallBase, wMat, 0, h / 2, 0);

          // Stepped Whitewashed Rooftop Parapet Blocks & Chimneys (Matches Image 2 skyline!)
          const seed = row * 31 + col * 17 + (dir === 'E' ? 3 : 7);
          pushTransformedGeo(
            stuccoWhiteGeos,
            unitBoxBase,
            wMat,
            -0.85,
            h + 0.28,
            0,
            0,
            0,
            0,
            1.65,
            0.56,
            WALL_THICKNESS * 0.92
          );
          if (pseudoRandom(seed) > 0.4) {
            // Iconic little Santorini whitewashed chimney cupola with blue accents
            pushTransformedGeo(
              stuccoWhiteGeos,
              unitBoxBase,
              wMat,
              1.15,
              h + 0.45,
              0,
              0,
              0,
              0,
              0.38,
              0.9,
              0.38
            );
            pushTransformedGeo(
              blueDomeCupolaGeos,
              domeHemisphereBase,
              wMat,
              1.15,
              h + 0.9,
              0,
              0,
              0,
              0,
              0.2,
              0.22,
              0.2
            );
          }

          if (feat === 'blue-door-stairs') {
            // =============================================================
            // EXACT MATCH TO RIGHT-SIDE FACADE OF REFERENCE PHOTO (Image 2):
            // 1. Tall Recessed Arched Aegean-Blue Doorway on the right
            // 2. External Whitewashed Stepped Staircase climbing on the left
            // 3. Upper-level Arched Blue Doorway at top of stairs!
            // =============================================================
            // Lower Arched Blue Door Panel
            pushTransformedGeo(
              aegeanBlueWoodGeos,
              unitBoxBase,
              wMat,
              0.58,
              1.08,
              faceZ + 0.03,
              0,
              0,
              0,
              0.92,
              2.16,
              0.06
            );
            // Whitewashed Recessed Arch Hood Around Door
            pushTransformedGeo(
              stuccoWhiteGeos,
              unitBoxBase,
              wMat,
              0.58,
              2.22,
              faceZ + 0.06,
              0,
              0,
              0,
              1.08,
              0.18,
              0.14
            );
            // Upper-Story Tall Narrow Blue Window (Like Top-Right of Image 2!)
            pushTransformedGeo(
              aegeanBlueWoodGeos,
              unitBoxBase,
              wMat,
              0.62,
              3.05,
              faceZ + 0.03,
              0,
              0,
              0,
              0.42,
              0.92,
              0.06
            );

            // External Whitewashed Stepped Staircase Against Left Side of Wall (Shallow relief so it stays within wall margin)
            for (let stepIdx = 0; stepIdx < 6; stepIdx++) {
              const stepX = -1.35 + stepIdx * 0.22;
              const stepH = 0.28 + stepIdx * 0.24;
              pushTransformedGeo(
                stuccoStepGeos,
                unitBoxBase,
                wMat,
                stepX,
                stepH / 2,
                faceZ + 0.14,
                0,
                0,
                0,
                0.24,
                stepH,
                0.28
              );
            }
            // Upper-Level Arched Blue Door at the Top of the Stairs
            pushTransformedGeo(
              aegeanBlueWoodGeos,
              unitBoxBase,
              wMat,
              -0.35,
              2.35,
              faceZ + 0.03,
              0,
              0,
              0,
              0.68,
              1.35,
              0.06
            );
          } else if (feat === 'blue-window') {
            // Twin Aegean-Blue Arched Windows with Whitewashed Sills & Shutters
            for (const wx of [-0.68, 0.68]) {
              pushTransformedGeo(
                aegeanBlueWoodGeos,
                unitBoxBase,
                wMat,
                wx,
                1.85,
                faceZ + 0.03,
                0,
                0,
                0,
                0.56,
                1.08,
                0.06
              );
              pushTransformedGeo(
                stuccoStepGeos,
                unitBoxBase,
                wMat,
                wx,
                1.26,
                faceZ + 0.07,
                0,
                0,
                0,
                0.72,
                0.10,
                0.14
              );
            }
            // Dappled sunlight gobo on floor
            pushTransformedGeo(
              goboShadowGeos,
              goboPlaneBase,
              wMat,
              0,
              0.016,
              1.35,
              -Math.PI / 2,
              0,
              0
            );
          } else if (feat === 'cactus-niche') {
            // Stepped Whitewashed Planter Ledge with Columnar Cacti & Arched Alcove (Matches Left Midground of Image 2!)
            pushTransformedGeo(
              stuccoStepGeos,
              unitBoxBase,
              wMat,
              0,
              0.48,
              faceZ + 0.14,
              0,
              0,
              0,
              1.65,
              0.96,
              0.28
            );
            // Whitewashed Pot on Ledge
            pushTransformedGeo(
              whiteAmphoraGeos,
              amphoraBellyBase,
              wMat,
              -0.35,
              1.12,
              faceZ + 0.14,
              0,
              0,
              0,
              0.75,
              0.85,
              0.75
            );
            // Tall Columnar Cactus Stems in Pot
            pushTransformedGeo(
              cactusGreenGeos,
              cactusColumnBase,
              wMat,
              -0.35,
              1.48,
              faceZ + 0.14,
              0,
              0,
              0,
              0.85,
              1.1,
              0.85
            );
            pushTransformedGeo(
              cactusGreenGeos,
              cactusColumnBase,
              wMat,
              -0.22,
              1.38,
              faceZ + 0.14,
              0,
              0,
              -0.18,
              0.7,
              0.85,
              0.7
            );
            // Blue Arched Window Above Niche
            pushTransformedGeo(
              aegeanBlueWoodGeos,
              unitBoxBase,
              wMat,
              0.42,
              2.15,
              faceZ + 0.03,
              0,
              0,
              0,
              0.52,
              0.96,
              0.06
            );
          }
        }
      });

      // =================================================================
      // CUSTOM 3D ARCHITECTURAL MONUMENTS FOR THE 16 LANDMARK PLACES
      // =================================================================
      if (cell.zoneId === 'blue-dome-cathedral') {
        // Place 4: Iconic Blue Dome Cathedral at [2, 3] — Crowns the Reference Vista!
        // Elevated Whitewashed Drum & Sanctuary Base above roof height so it towers in the background just like Image 2!
        const catY = WALL_HEIGHT + 0.2;
        pushTransformedGeo(
          stuccoWhiteGeos,
          unitBoxBase,
          identityMat,
          x,
          catY + 0.9,
          z - 0.4,
          0,
          0,
          0,
          3.4,
          1.8,
          2.8
        );
        // Cylindrical Cathedral Drum with 3 Azure-Blue Arched Windows facing South (+Z) toward the Reference Vista!
        pushTransformedGeo(
          stuccoWhiteGeos,
          unitCylinderBase,
          identityMat,
          x,
          catY + 2.15,
          z - 0.35,
          0,
          0,
          0,
          2.7,
          1.55,
          2.7
        );
        for (const wx of [-0.68, 0, 0.68]) {
          pushTransformedGeo(
            aegeanBlueWoodGeos,
            unitBoxBase,
            identityMat,
            x + wx,
            catY + 2.15,
            z + 0.98,
            0,
            0,
            0,
            0.34,
            0.78,
            0.08
          );
        }
        // Grand Whitewashed & Cerulean Dome Cupola + Cross Finial
        pushTransformedGeo(
          stuccoWhiteGeos,
          domeHemisphereBase,
          identityMat,
          x,
          catY + 2.88,
          z - 0.35,
          0,
          0,
          0,
          1.38,
          1.15,
          1.38
        );
        // Side Blue Cupola Dome
        pushTransformedGeo(
          blueDomeCupolaGeos,
          domeHemisphereBase,
          identityMat,
          x + 1.55,
          catY + 1.78,
          z - 0.25,
          0,
          0,
          0,
          0.78,
          0.68,
          0.78
        );
      } else if (cell.zoneId === 'sapphire-fountain') {
        // Place 13: Sapphire Fountain Rotunda [1, 5]
        pushTransformedGeo(
          stuccoStepGeos,
          unitCylinderBase,
          identityMat,
          x,
          0.24,
          z,
          0,
          0,
          0,
          1.45,
          0.48,
          1.45
        );
        pushTransformedGeo(
          aquaPoolWaterGeos,
          unitCylinderBase,
          identityMat,
          x,
          0.49,
          z,
          0,
          0,
          0,
          1.25,
          0.04,
          1.25
        );
        pushTransformedGeo(
          stuccoWhiteGeos,
          unitCylinderBase,
          identityMat,
          x,
          0.78,
          z,
          0,
          0,
          0,
          0.42,
          0.95,
          0.42
        );
        pushTransformedGeo(
          blueDomeCupolaGeos,
          domeHemisphereBase,
          identityMat,
          x,
          1.26,
          z,
          0,
          0,
          0,
          0.46,
          0.35,
          0.46
        );
      } else if (cell.zoneId === 'windmill-point') {
        // Place 7: Cycladic Windmill Point [1, 0]
        pushTransformedGeo(
          stuccoWhiteGeos,
          unitCylinderBase,
          identityMat,
          x,
          1.15,
          z,
          0,
          0,
          0,
          1.18,
          2.3,
          1.18
        );
        pushTransformedGeo(
          blueDomeCupolaGeos,
          domeHemisphereBase,
          identityMat,
          x,
          2.28,
          z,
          0,
          0,
          0,
          0.64,
          0.58,
          0.64
        );
      } else if (cell.zoneId === 'lighthouse-pier') {
        // Place 9: Harbor Lighthouse Pier [7, 0]
        pushTransformedGeo(
          stuccoWhiteGeos,
          unitCylinderBase,
          identityMat,
          x,
          1.35,
          z,
          0,
          0,
          0,
          0.95,
          2.7,
          0.95
        );
        pushTransformedGeo(
          blueDomeCupolaGeos,
          unitCylinderBase,
          identityMat,
          x,
          2.85,
          z,
          0,
          0,
          0,
          0.72,
          0.45,
          0.72
        );
        pushTransformedGeo(
          lanternGlowGeos,
          amphoraBellyBase,
          identityMat,
          x,
          3.22,
          z,
          0,
          0,
          0,
          0.95,
          0.95,
          0.95
        );
        pushTransformedGeo(
          blueDomeCupolaGeos,
          domeHemisphereBase,
          identityMat,
          x,
          3.42,
          z,
          0,
          0,
          0,
          0.38,
          0.35,
          0.38
        );
      } else if (cell.zoneId === 'bougainvillea-arch') {
        // Place 6: Bougainvillea Archway [3, 2] — Overhead Floral Pergola
        for (let bx = -1.2; bx <= 1.2; bx += 0.6) {
          for (let bz = -1.2; bz <= 1.2; bz += 0.8) {
            pushTransformedGeo(
              bougainvilleaPinkGeos,
              bougainvilleaClusterBase,
              identityMat,
              x + bx,
              WALL_HEIGHT - 0.25 + (Math.abs(bx) < 0.5 ? 0.15 : 0),
              z + bz,
              bx,
              bz,
              0,
              1.35,
              0.85,
              1.35
            );
          }
        }
      } else if (cell.zoneId === 'aqua-canal-bridge') {
        // Place 12: Aqua Canal Footbridge [5, 5] — Arched White Curb Rails Framing the Water Road
        for (const sideX of [-1.25, 1.25]) {
          pushTransformedGeo(
            stuccoWhiteGeos,
            unitBoxBase,
            identityMat,
            x + sideX,
            0.36,
            z,
            0,
            0,
            0,
            0.22,
            0.72,
            2.4
          );
          pushTransformedGeo(
            blueDomeCupolaGeos,
            domeHemisphereBase,
            identityMat,
            x + sideX,
            0.72,
            z - 1.1,
            0,
            0,
            0,
            0.16,
            0.16,
            0.16
          );
          pushTransformedGeo(
            blueDomeCupolaGeos,
            domeHemisphereBase,
            identityMat,
            x + sideX,
            0.72,
            z + 1.1,
            0,
            0,
            0,
            0.16,
            0.16,
            0.16
          );
        }
      }
    }

    // =====================================================================
    // 2. MERGE ALL AMPHORA PLANTERS, CACTI & BOTANICAL CORNER DECORATIONS
    // =====================================================================
    for (const deco of MAZE_DATA.decorations) {
      const [dx, dy, dz] = deco.position;
      const dMat = new THREE.Matrix4();
      dMat.compose(
        new THREE.Vector3(dx, dy, dz),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, deco.rotationY, 0)),
        new THREE.Vector3(1, 1, 1)
      );

      if (deco.variant === 'amphora-cactus-leaf') {
        // Exact Match to Foreground-Right Ribbed Whitewashed Amphora Urn with Tropical Leaves & Tall Cacti in Image 2!
        pushTransformedGeo(
          whiteAmphoraGeos,
          amphoraBellyBase,
          dMat,
          0,
          0.34,
          0,
          0,
          0,
          0,
          1.35,
          1.45,
          1.35
        );
        pushTransformedGeo(
          whiteAmphoraGeos,
          amphoraNeckBase,
          dMat,
          0,
          0.66,
          0,
          0,
          0,
          0,
          1.25,
          1.0,
          1.25
        );
        pushTransformedGeo(
          whiteAmphoraGeos,
          amphoraRimBase,
          dMat,
          0,
          0.74,
          0,
          0,
          0,
          0,
          1.28,
          1.28,
          1.28
        );

        // Broad-Leaf Coastal Philodendron Leaves Arching Out (Matches lower-right pot in Image 2!)
        for (let l = 0; l < 5; l++) {
          const ang = (l * Math.PI * 2) / 5 + 0.3;
          pushTransformedGeo(
            tropicalLeafGeos,
            tropicalLeafBase,
            dMat,
            Math.cos(ang) * 0.18,
            0.82,
            Math.sin(ang) * 0.18,
            Math.sin(ang) * 0.65,
            ang,
            -Math.cos(ang) * 0.65,
            1.15,
            1.1,
            0.35
          );
        }
        // Tall Twin Columnar Cactus Stems Rising Behind the Leaves (Matches lower-right pot in Image 2!)
        pushTransformedGeo(
          cactusGreenGeos,
          cactusColumnBase,
          dMat,
          0.06,
          1.12,
          -0.05,
          0,
          0,
          -0.05,
          1.05,
          1.35,
          1.05
        );
        pushTransformedGeo(
          cactusGreenGeos,
          cactusColumnBase,
          dMat,
          -0.08,
          1.04,
          -0.06,
          0,
          0,
          0.06,
          0.92,
          1.15,
          0.92
        );
      } else if (deco.variant === 'prickly-pear-pot') {
        // Whitewashed Cylinder Planter + Prickly Pear Paddles
        pushTransformedGeo(
          whiteAmphoraGeos,
          amphoraBellyBase,
          dMat,
          0,
          0.28,
          0,
          0,
          0,
          0,
          1.15,
          1.2,
          1.15
        );
        pushTransformedGeo(
          cactusGreenGeos,
          cactusPaddleBase,
          dMat,
          0,
          0.62,
          0,
          0,
          0,
          0,
          1.2,
          1.5,
          0.45
        );
        pushTransformedGeo(
          cactusGreenGeos,
          cactusPaddleBase,
          dMat,
          0.12,
          0.84,
          0.02,
          0,
          0.2,
          -0.38,
          0.95,
          1.25,
          0.4
        );
        pushTransformedGeo(
          cactusGreenGeos,
          cactusPaddleBase,
          dMat,
          -0.11,
          0.80,
          -0.02,
          0,
          -0.2,
          0.35,
          0.9,
          1.15,
          0.4
        );
      } else if (deco.variant === 'white-amphora-pair') {
        // Pair of Classic Cycladic White & Blue-Banded Amphorae
        pushTransformedGeo(
          bandedAmphoraGeos,
          amphoraBellyBase,
          dMat,
          -0.12,
          0.32,
          0,
          0,
          0,
          0,
          1.15,
          1.38,
          1.15
        );
        pushTransformedGeo(
          bandedAmphoraGeos,
          amphoraNeckBase,
          dMat,
          -0.12,
          0.62,
          0,
          0,
          0,
          0,
          1.0,
          1.1,
          1.0
        );
        pushTransformedGeo(
          whiteAmphoraGeos,
          amphoraBellyBase,
          dMat,
          0.18,
          0.22,
          0.14,
          0,
          0,
          0,
          0.88,
          1.0,
          0.88
        );
      } else if (deco.variant === 'bougainvillea-pot') {
        pushTransformedGeo(
          whiteAmphoraGeos,
          amphoraBellyBase,
          dMat,
          0,
          0.28,
          0,
          0,
          0,
          0,
          1.18,
          1.22,
          1.18
        );
        pushTransformedGeo(
          tropicalLeafGeos,
          bougainvilleaClusterBase,
          dMat,
          0,
          0.65,
          0,
          0,
          0,
          0,
          1.1,
          0.95,
          1.1
        );
        pushTransformedGeo(
          bougainvilleaPinkGeos,
          bougainvilleaClusterBase,
          dMat,
          0.06,
          0.82,
          0.05,
          0.4,
          0.2,
          0,
          0.95,
          0.85,
          0.95
        );
      } else {
        // Coastal Whitewashed Stone Bench with Blue Cushion
        pushTransformedGeo(
          stuccoStepGeos,
          unitBoxBase,
          dMat,
          0,
          0.24,
          0,
          0,
          0,
          0,
          0.68,
          0.48,
          0.42
        );
        pushTransformedGeo(
          blueDomeCupolaGeos,
          unitBoxBase,
          dMat,
          0,
          0.50,
          0,
          0,
          0,
          0,
          0.64,
          0.08,
          0.38
        );
      }
    }

    return {
      roadTurquoiseGeo: mergeBufferGeometries(roadTurquoiseGeos),
      roadCobbleGeo: mergeBufferGeometries(roadCobbleGeos),
      stuccoWhiteGeo: mergeBufferGeometries(stuccoWhiteGeos),
      stuccoShadeGeo: mergeBufferGeometries(stuccoShadeGeos),
      stuccoStepGeo: mergeBufferGeometries(stuccoStepGeos),
      aegeanBlueWoodGeo: mergeBufferGeometries(aegeanBlueWoodGeos),
      blueDomeCupolaGeo: mergeBufferGeometries(blueDomeCupolaGeos),
      aquaPoolWaterGeo: mergeBufferGeometries(aquaPoolWaterGeos),
      whiteAmphoraGeo: mergeBufferGeometries(whiteAmphoraGeos),
      bandedAmphoraGeo: mergeBufferGeometries(bandedAmphoraGeos),
      cactusGreenGeo: mergeBufferGeometries(cactusGreenGeos),
      tropicalLeafGeo: mergeBufferGeometries(tropicalLeafGeos),
      bougainvilleaPinkGeo: mergeBufferGeometries(bougainvilleaPinkGeos),
      bronzeBellGeo: mergeBufferGeometries(bronzeBellGeos),
      lanternGlowGeo: mergeBufferGeometries(lanternGlowGeos),
      goboShadowGeo: mergeBufferGeometries(goboShadowGeos),
    };
  }, []);

  const targetZone = useMemo(
    () => LANDMARK_ZONES.find((z) => z.id === targetZoneId) || LANDMARK_ZONES[3],
    [targetZoneId]
  );

  const windmillCell = useMemo(() => LANDMARK_ZONES.find((z) => z.id === 'windmill-point')!, []);
  const lighthouseCell = useMemo(() => LANDMARK_ZONES.find((z) => z.id === 'lighthouse-pier')!, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const charPos = characterPosRef.current;

    // Spin Cycladic Windmill Sails at Place 7
    if (windmillSailsRef.current) {
      windmillSailsRef.current.rotation.z = t * 0.75;
    }

    // Rotate Harbor Lighthouse Beacon at Place 9
    if (lighthouseBeamRef.current) {
      lighthouseBeamRef.current.rotation.y = t * 1.1;
    }

    // Bob & Spin Collectible Sea Pearls
    if (relicsGroupRef.current) {
      const children = relicsGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        if (c.visible) {
          c.position.y = 0.68 + Math.sin(t * 2.6 + i) * 0.08;
          c.rotation.y = t * 1.4 + i;
        }
      }
    }

    // Pulse Click-to-Walk Target Marker
    if (markerRef.current && walkMarker) {
      const s = 1 + Math.sin(t * 5.0) * 0.14;
      markerRef.current.scale.set(s, 1, s);
      markerRef.current.rotation.z = t * 1.5;
    }

    // Dynamic Nearest Point Light Pool
    const sources = MAZE_DATA.lightSources;
    let bestLights: Array<{ idx: number; distSq: number }> = [];
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      const dx = s.x - charPos.x;
      const dz = s.z - charPos.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < 196) {
        bestLights.push({ idx: i, distSq: dSq });
      }
    }
    bestLights.sort((a, b) => a.distSq - b.distSq);
    bestLights = bestLights.slice(0, LIGHT_POOL_SIZE);

    for (let p = 0; p < LIGHT_POOL_SIZE; p++) {
      const light = lightPoolRefs.current[p];
      if (!light) continue;
      const match = bestLights[p];
      if (!match) {
        light.intensity = 0;
      } else {
        const src = sources[match.idx];
        light.position.set(src.x, src.y, src.z);
        if (src.kind === 'aqua-pool') {
          light.color.set('#5BE4F8');
          light.intensity = sunMood === 'starlight-blue' ? 1.25 : 0.65;
          light.distance = 5.5;
        } else if (src.kind === 'cathedral') {
          light.color.set('#80C8FF');
          light.intensity = 1.1;
          light.distance = 8.0;
        } else {
          light.color.set(sunMood === 'starlight-blue' ? '#FFE0A6' : '#FFF8E8');
          light.intensity = sunMood === 'starlight-blue' ? 1.35 : 0.55;
          light.distance = 5.5;
        }
      }
    }
  });

  const gridWidth = MAZE_COLS * CELL_SIZE;
  const gridHeight = MAZE_ROWS * CELL_SIZE;

  return (
    <group>
      {/* Single Invisible Interactive Floor Hit Plane for Click-to-Walk across the 9x9 City */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          const { row, col } = worldToCell(e.point.x, e.point.z);
          const zone = LANDMARK_ZONES.find((z) => z.row === row && z.col === col);
          const key = zone ? zone.id : null;
          if (key !== lastHoveredCellZoneRef.current) {
            lastHoveredCellZoneRef.current = key;
            onHover(
              zone
                ? `${zone.icon} ${zone.title} — Click road to walk here`
                : 'Click road to walk here'
            );
          }
        }}
        onPointerOut={() => {
          lastHoveredCellZoneRef.current = null;
          onHover(null);
        }}
      >
        <planeGeometry args={[gridWidth, gridHeight]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* ================================================================= */}
      {/* MERGED STATIC SANTORINI ARCHITECTURE BATCHES                      */}
      {/* ================================================================= */}
      {/* 1. Signature Turquoise-Stepped Road Surface */}
      <mesh geometry={mergedArch.roadTurquoiseGeo} receiveShadow>
        <meshStandardMaterial
          map={roadTurquoise.map}
          bumpMap={roadTurquoise.bumpMap}
          bumpScale={0.04}
          roughness={0.42}
          emissive="#45BCD4"
          emissiveIntensity={sunMood === 'starlight-blue' ? 0.24 : 0.10}
        />
      </mesh>

      {/* 2. Whitewashed Cycladic Cobblestone Road Surface */}
      <mesh geometry={mergedArch.roadCobbleGeo} receiveShadow>
        <meshStandardMaterial
          map={roadCobble.map}
          bumpMap={roadCobble.bumpMap}
          bumpScale={0.05}
          roughness={0.58}
        />
      </mesh>

      {/* 3. Sunlit Pure Whitewashed Stucco Walls & Cathedral Domes */}
      <mesh geometry={mergedArch.stuccoWhiteGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={stuccoWhite.map}
          bumpMap={stuccoWhite.bumpMap}
          bumpScale={0.055}
          roughness={0.68}
          emissive="#E8F2FF"
          emissiveIntensity={0.14}
        />
      </mesh>

      {/* 4. Cool Periwinkle-Shaded Whitewashed Stucco Walls */}
      <mesh geometry={mergedArch.stuccoShadeGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={stuccoShade.map}
          bumpMap={stuccoShade.bumpMap}
          bumpScale={0.055}
          roughness={0.72}
          emissive="#C8DCFA"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* 5. Crisp Whitewashed Stepped Terrace Curbs & External Stairs */}
      <mesh geometry={mergedArch.stuccoStepGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={stuccoStep.map}
          bumpMap={stuccoStep.bumpMap}
          bumpScale={0.04}
          roughness={0.55}
          emissive="#E0EEFF"
          emissiveIntensity={0.14}
        />
      </mesh>

      {/* 6. Aegean Cerulean-Blue Arched Doors & Shuttered Windows */}
      <mesh geometry={mergedArch.aegeanBlueWoodGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={aegeanBlueWood.map}
          bumpMap={aegeanBlueWood.bumpMap}
          bumpScale={0.035}
          roughness={0.38}
          emissive="#2578C4"
          emissiveIntensity={0.18}
        />
      </mesh>

      {/* 7. Iconic Santorini Azure-Blue Cupola Domes & Trim */}
      <mesh geometry={mergedArch.blueDomeCupolaGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#2B88E4"
          roughness={0.28}
          metalness={0.08}
          emissive="#1B66B8"
          emissiveIntensity={0.22}
        />
      </mesh>

      {/* 8. Glowing Aquamarine-Turquoise Road Reflection Pools */}
      <mesh geometry={mergedArch.aquaPoolWaterGeo} receiveShadow>
        <meshStandardMaterial
          color="#72EAF8"
          roughness={0.12}
          metalness={0.18}
          emissive="#42C8E2"
          emissiveIntensity={0.32}
        />
      </mesh>

      {/* 9. Ribbed Whitewashed Ceramic Amphora Urns */}
      <mesh geometry={mergedArch.whiteAmphoraGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={whiteAmphora.map}
          bumpMap={whiteAmphora.bumpMap}
          bumpScale={0.045}
          roughness={0.52}
          emissive="#D8E6FA"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* 10. Blue-Banded Cycladic Amphora Urns */}
      <mesh geometry={mergedArch.bandedAmphoraGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={bandedAmphora.map}
          bumpMap={bandedAmphora.bumpMap}
          bumpScale={0.045}
          roughness={0.5}
        />
      </mesh>

      {/* 11. Desert Columnar & Prickly-Pear Cacti */}
      <mesh geometry={mergedArch.cactusGreenGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#3E7C4A"
          roughness={0.58}
          emissive="#245230"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* 12. Broad-Leaf Coastal Philodendron Foliage */}
      <mesh geometry={mergedArch.tropicalLeafGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#5AA044"
          roughness={0.46}
          emissive="#3A7428"
          emissiveIntensity={0.14}
        />
      </mesh>

      {/* 13. Cascading Magenta-Pink Bougainvillea Blossoms */}
      <mesh geometry={mergedArch.bougainvilleaPinkGeo} castShadow>
        <meshStandardMaterial
          color="#EC4B98"
          roughness={0.48}
          emissive="#C82874"
          emissiveIntensity={0.22}
        />
      </mesh>

      {/* 14. Bronze Bells & Lantern Frames */}
      <mesh geometry={mergedArch.bronzeBellGeo} castShadow>
        <meshStandardMaterial color="#8C6E46" roughness={0.36} metalness={0.62} />
      </mesh>

      {/* 15. Glowing Coastal Lantern Bulbs */}
      <mesh geometry={mergedArch.lanternGlowGeo}>
        <meshBasicMaterial color="#FFF3C8" />
      </mesh>

      {/* 16. Dappled Sunlight Window Projections */}
      <mesh geometry={mergedArch.goboShadowGeo}>
        <meshBasicMaterial
          map={palmGobo}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* ================================================================= */}
      {/* ANIMATED CYCLADIC WINDMILL SAILS AT PLACE 7 ([1, 0])              */}
      {/* ================================================================= */}
      <group position={[windmillCell.x - 0.58, 2.15, windmillCell.z]} rotation={[0, -Math.PI / 2, 0]}>
        <group ref={windmillSailsRef}>
          {Array.from({ length: 8 }).map((_, idx) => {
            const ang = (idx * Math.PI * 2) / 8;
            return (
              <group key={`sail-${idx}`} rotation={[0, 0, ang]}>
                <mesh position={[0, 0.72, 0.04]}>
                  <cylinderGeometry args={[0.018, 0.022, 1.4, 6]} />
                  <meshStandardMaterial color="#6E4E32" roughness={0.7} />
                </mesh>
                <mesh position={[0.14, 0.85, 0.05]}>
                  <planeGeometry args={[0.26, 0.95]} />
                  <meshStandardMaterial
                    color="#FAFCFF"
                    side={THREE.DoubleSide}
                    roughness={0.5}
                    emissive="#DCEBFA"
                    emissiveIntensity={0.15}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* ================================================================= */}
      {/* ANIMATED HARBOR LIGHTHOUSE BEACON AT PLACE 9 ([7, 0])             */}
      {/* ================================================================= */}
      <group ref={lighthouseBeamRef} position={[lighthouseCell.x, 3.22, lighthouseCell.z]}>
        <mesh position={[0, 0, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.42, 1.7, 14, 1, true]} />
          <meshBasicMaterial
            color="#98F5FF"
            transparent
            opacity={0.24}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 16 COLLECTIBLE AEGEAN SEA PEARLS                                  */}
      {/* ================================================================= */}
      <group ref={relicsGroupRef}>
        {INITIAL_SEA_PEARLS.map((relic) => {
          const isCollected = collectedRelics.includes(relic.id);
          return (
            <group
              key={relic.id}
              position={relic.position}
              visible={!isCollected}
            >
              <mesh geometry={pearlSphereGeo} castShadow>
                <meshStandardMaterial
                  color="#F5FCFF"
                  roughness={0.12}
                  metalness={0.25}
                  emissive="#72ECFA"
                  emissiveIntensity={0.65}
                />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.22, 0.018, 8, 24]} />
                <meshBasicMaterial color="#6CE8FA" transparent opacity={0.68} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ================================================================= */}
      {/* GLOWING TURQUOISE NAVIGATION GUIDE PATH DOTS                      */}
      {/* ================================================================= */}
      {showGuidePath && (
        <TurquoiseBreadcrumbGuide
          characterPosRef={characterPosRef}
          targetZone={targetZone}
        />
      )}

      {/* ================================================================= */}
      {/* CLICK-TO-WALK PULSING TARGET RING                                 */}
      {/* ================================================================= */}
      {walkMarker && (
        <group ref={markerRef} position={walkMarker} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.24, 0.34, 28]} />
            <meshBasicMaterial
              color="#36D6F2"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* ================================================================= */}
      {/* POOLED DYNAMIC POINT LIGHTS                                       */}
      {/* ================================================================= */}
      {Array.from({ length: LIGHT_POOL_SIZE }).map((_, idx) => (
        <pointLight
          key={`pool-light-${idx}`}
          ref={(el) => {
            lightPoolRefs.current[idx] = el;
          }}
          intensity={0}
          distance={5.5}
          decay={2}
        />
      ))}
    </group>
  );
}

const MAX_BREADCRUMB_DOTS = 36;

function TurquoiseBreadcrumbGuide({
  characterPosRef,
  targetZone,
}: {
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  targetZone: (typeof LANDMARK_ZONES)[number];
}) {
  const groupRef = useRef<THREE.Group | null>(null);
  const lastCellKeyRef = useRef<string>('');
  const dotCircleGeo = useMemo(() => new THREE.CircleGeometry(0.085, 14), []);

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
      const pts: THREE.Vector3[] = [new THREE.Vector3(pos.x, 0.045, pos.z), ...waypoints];
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
              0.048,
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
        c.position.y = 0.048 + Math.sin(t * 3.8 - idx * 0.45) * 0.022;
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
            color={idx % 2 === 0 ? '#52E8FA' : '#86D654'}
            transparent
            opacity={Math.max(0.25, 0.78 - idx * 0.015)}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
