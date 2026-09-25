import { forwardRef, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CELL_SIZE,
  CEILING_HEIGHT,
  INITIAL_SUN_RELICS,
  LANDMARK_ZONES,
  MAZE_DATA,
  WALL_THICKNESS,
  findMazePath,
  worldToCell,
  type LandmarkZone,
  type MazeCell,
  type WallDirection,
} from '../../utils/mazeLayout';
import {
  createAdobePlasterTextures,
  createMashrabiyaLightGoboTexture,
  createPersianKilimRugTexture,
  createSandyFloorTextures,
  createTerracottaPotTextures,
  createTimberCeilingTextures,
} from '../../utils/textures';
import type { SunMood } from '../../hooks/useMazeState';

interface AdobeMazeArchitectureProps {
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

export default function AdobeMazeArchitecture({
  sunMood,
  showGuidePath,
  targetZoneId,
  collectedRelics,
  walkMarker,
  characterPosRef,
  onFloorClick,
  onHover,
}: AdobeMazeArchitectureProps) {
  const relicsGroupRef = useRef<THREE.Group>(null);
  const guideGroupRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);
  const lightPoolRefs = useRef<Array<THREE.PointLight | null>>([]);
  const lastHoveredCellZoneRef = useRef<string | null>(null);

  // Shared Procedural Textures (Cached globally in textures.ts)
  const plasterMain = useMemo(() => createAdobePlasterTextures('warm-ochre'), []);
  const plasterSunlit = useMemo(() => createAdobePlasterTextures('sunlit-sand'), []);
  const plasterShaded = useMemo(() => createAdobePlasterTextures('shaded-earth'), []);
  const floorTex = useMemo(() => createSandyFloorTextures(), []);
  const timberTex = useMemo(() => createTimberCeilingTextures(), []);
  const lightGoboTex = useMemo(() => createMashrabiyaLightGoboTexture(), []);
  const potClayTex = useMemo(() => createTerracottaPotTextures(false), []);

  const rugTextures = useMemo(
    () => ({
      'kilim-rust': createPersianKilimRugTexture('kilim-rust'),
      'persian-indigo': createPersianKilimRugTexture('persian-indigo'),
      'ochre-tribal': createPersianKilimRugTexture('ochre-tribal'),
      'royal-medallion': createPersianKilimRugTexture('royal-medallion'),
    }),
    []
  );

  // Shared 8-pointed Star Relic Geometry
  const relicStarGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 8;
    const outerR = 0.19;
    const innerR = 0.085;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i * Math.PI) / points;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    });
    geo.center();
    return geo;
  }, []);

  // Pre-build & merge ALL static maze architecture into shared BufferGeometries by material!
  // Replaces ~4,300 separate <mesh> draw calls with ~25 merged meshes while keeping 100% identical visuals.
  const mergedArch = useMemo(() => {
    // 1. Pointed Persian/Islamic Arch Spandrel Template
    const w = CELL_SIZE;
    const h = CEILING_HEIGHT;
    const halfW = w / 2;
    const archHalfW = 1.32;
    const springY = 1.88;
    const apexY = 3.18;

    const archShape = new THREE.Shape();
    archShape.moveTo(-halfW, 0);
    archShape.lineTo(-archHalfW, 0);
    archShape.lineTo(-archHalfW, springY);
    archShape.quadraticCurveTo(-archHalfW * 0.88, apexY * 0.92, 0, apexY);
    archShape.quadraticCurveTo(archHalfW * 0.88, apexY * 0.92, archHalfW, springY);
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

    // Primitive Templates
    const floorTileBase = new THREE.PlaneGeometry(CELL_SIZE + 0.04, CELL_SIZE + 0.04);
    const ceilingPlankBase = new THREE.PlaneGeometry(CELL_SIZE + 0.2, CELL_SIZE + 0.2);
    const rafterBase = new THREE.CylinderGeometry(0.095, 0.102, CELL_SIZE + 0.1, 10);
    const ledgerBase = new THREE.BoxGeometry(0.18, 0.16, CELL_SIZE);
    const pierBase = new THREE.BoxGeometry(0.62, CEILING_HEIGHT, 0.62);

    const rugBodyBase = new THREE.BoxGeometry(1.95, 0.016, 2.85);
    const fringeBase = new THREE.BoxGeometry(0.045, 0.008, 0.14);

    const lanternCordBase = new THREE.CylinderGeometry(0.008, 0.008, 0.9, 6);
    const lanternCapBase = new THREE.ConeGeometry(0.11, 0.12, 6);
    const lanternGlowBase = new THREE.CylinderGeometry(0.095, 0.085, 0.24, 6);
    const lanternCageBase = new THREE.CylinderGeometry(0.102, 0.092, 0.25, 6, 1, true);

    const sanctuaryPedestalBase = new THREE.CylinderGeometry(0.52, 0.64, 0.44, 8);
    const sanctuaryBrassBase = new THREE.CylinderGeometry(0.42, 0.34, 0.12, 16);

    const archTrimBase = new THREE.BoxGeometry(0.14, 2.9, WALL_THICKNESS + 0.05);
    const mashPillarBase = new THREE.BoxGeometry(1.5, CEILING_HEIGHT, WALL_THICKNESS);
    const mashSillBase = new THREE.BoxGeometry(1.66, 0.62, WALL_THICKNESS + 0.14);
    const mashHeaderBase = new THREE.BoxGeometry(1.66, 0.86, WALL_THICKNESS);
    const corbelOuterBase = new THREE.BoxGeometry(0.32, 0.36, WALL_THICKNESS * 0.9);
    const corbelInnerBase = new THREE.BoxGeometry(0.26, 0.22, WALL_THICKNESS * 0.9);
    const plaqueBase = new THREE.BoxGeometry(1.28, 0.28, 0.06);
    const windowGlowBase = new THREE.PlaneGeometry(1.64, 2.48);

    const latFrameBase = new THREE.BoxGeometry(0.07, 2.38, 0.06);
    const latCrossbarBase = new THREE.BoxGeometry(1.56, 0.065, 0.065);
    const latVertBase = new THREE.BoxGeometry(0.024, 2.32, 0.03);
    const latDiagBase = new THREE.BoxGeometry(0.38, 0.022, 0.032);
    const latHubBase = new THREE.CylinderGeometry(0.055, 0.055, 0.035, 8);

    const sillPotJarBase = new THREE.SphereGeometry(0.21, 14, 12);
    const sillPotNeckBase = new THREE.CylinderGeometry(0.11, 0.13, 0.09, 12);
    const sillPotPitcherBase = new THREE.SphereGeometry(0.17, 12, 10);

    const goboFloorBase = new THREE.PlaneGeometry(2.15, 2.35);
    const goboSillBase = new THREE.PlaneGeometry(1.55, 0.48);
    const goboWallBase = new THREE.PlaneGeometry(0.92, 1.65);
    const sunbeamRayBase = new THREE.PlaneGeometry(1.48, 2.35);

    const portalHeaderBase = new THREE.BoxGeometry(1.66, 1.0, WALL_THICKNESS);
    const portalSillBase = new THREE.BoxGeometry(1.66, 0.28, WALL_THICKNESS + 0.08);
    const portalLightwellBase = new THREE.PlaneGeometry(1.62, 2.75);
    const portalSpillBase = new THREE.PlaneGeometry(1.65, 2.1);

    const solidWallBase = new THREE.BoxGeometry(CELL_SIZE, CEILING_HEIGHT, WALL_THICKNESS);
    const nicheTopBase = new THREE.BoxGeometry(0.92, 0.14, 0.08);
    const nicheBotBase = new THREE.BoxGeometry(0.96, 0.12, 0.16);
    const nicheVaseBase = new THREE.SphereGeometry(0.13, 12, 10);

    // Buckets by Material
    const floorBucket: THREE.BufferGeometry[] = [];
    const ceilingPlankBucket: THREE.BufferGeometry[] = [];
    const rafterEvenBucket: THREE.BufferGeometry[] = [];
    const rafterOddBucket: THREE.BufferGeometry[] = [];
    const ledgerBucket: THREE.BufferGeometry[] = [];
    const pierBucket: THREE.BufferGeometry[] = [];

    const rugBuckets: Record<
      'kilim-rust' | 'persian-indigo' | 'ochre-tribal' | 'royal-medallion',
      THREE.BufferGeometry[]
    > = {
      'kilim-rust': [],
      'persian-indigo': [],
      'ochre-tribal': [],
      'royal-medallion': [],
    };
    const fringeEvenBucket: THREE.BufferGeometry[] = [];
    const fringeOddBucket: THREE.BufferGeometry[] = [];

    const lanternCordBucket: THREE.BufferGeometry[] = [];
    const lanternCapBucket: THREE.BufferGeometry[] = [];
    const lanternGlowBucket: THREE.BufferGeometry[] = [];
    const lanternCageBucket: THREE.BufferGeometry[] = [];

    const sanctuaryPedestalBucket: THREE.BufferGeometry[] = [];
    const sanctuaryBrassBucket: THREE.BufferGeometry[] = [];

    const plasterMainBucket: THREE.BufferGeometry[] = [];
    const plasterSunlitBucket: THREE.BufferGeometry[] = [];
    const archHoverBucket: THREE.BufferGeometry[] = [];

    const windowGlowBucket: THREE.BufferGeometry[] = [];
    const portalLightwellBucket: THREE.BufferGeometry[] = [];

    const latWoodDarkBucket: THREE.BufferGeometry[] = [];
    const latWoodMidBucket: THREE.BufferGeometry[] = [];
    const latWoodLightBucket: THREE.BufferGeometry[] = [];

    const potClayBucket: THREE.BufferGeometry[] = [];
    const potCompanionBucket: THREE.BufferGeometry[] = [];

    const goboFloorBucket: THREE.BufferGeometry[] = [];
    const goboSillBucket: THREE.BufferGeometry[] = [];
    const goboWallBucket: THREE.BufferGeometry[] = [];
    const sunbeamRayBucket: THREE.BufferGeometry[] = [];
    const portalSpillBucket: THREE.BufferGeometry[] = [];

    const cellMat = new THREE.Matrix4();
    const subMat = new THREE.Matrix4();
    const subMat2 = new THREE.Matrix4();
    const seenPiers = new Set<string>();

    const getWallTransform = (
      dir: WallDirection
    ): { pos: [number, number, number]; rotY: number } => {
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

    const shouldRenderWall = (cell: MazeCell, dir: WallDirection): boolean => {
      const feat = cell.walls[dir];
      if (feat === 'open') return false;
      if (feat === 'arch') {
        return dir === 'N' || dir === 'W';
      }
      return true;
    };

    for (const cell of MAZE_DATA.cells) {
      cellMat.makeTranslation(cell.x, 0, cell.z);

      // 1. Floor
      pushTransformedGeo(floorBucket, floorTileBase, cellMat, 0, 0, 0, -Math.PI / 2, 0, 0);

      // 2. Ceiling Planks, Rafters & Ledgers
      pushTransformedGeo(
        ceilingPlankBucket,
        ceilingPlankBase,
        cellMat,
        0,
        CEILING_HEIGHT + 0.04,
        0,
        Math.PI / 2,
        0,
        0
      );

      const rafterZs = [-1.92, -1.28, -0.64, 0, 0.64, 1.28, 1.92];
      for (let bIdx = 0; bIdx < rafterZs.length; bIdx++) {
        const bz = rafterZs[bIdx];
        const targetB = bIdx % 2 === 0 ? rafterEvenBucket : rafterOddBucket;
        pushTransformedGeo(
          targetB,
          rafterBase,
          cellMat,
          0,
          CEILING_HEIGHT - 0.11 + (bIdx % 2) * 0.012,
          bz,
          0,
          0,
          Math.PI / 2
        );
      }

      const ledgerXs = [-CELL_SIZE / 2 + 0.22, CELL_SIZE / 2 - 0.22];
      for (let lIdx = 0; lIdx < ledgerXs.length; lIdx++) {
        pushTransformedGeo(
          ledgerBucket,
          ledgerBase,
          cellMat,
          ledgerXs[lIdx],
          CEILING_HEIGHT - 0.22,
          0
        );
      }

      // 3. Corner Adobe Pilasters (Deduplicated across shared cell corners)
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
          pushTransformedGeo(pierBucket, pierBase, cellMat, px, CEILING_HEIGHT / 2, pz);
        }
      }

      // 4. Woven Persian / Anatolian Kilim Carpets & Fringes
      if (cell.hasRug) {
        _pos.set(cell.x, 0.012, cell.z);
        _euler.set(0, cell.rugRotation || 0, 0, 'XYZ');
        _quat.setFromEuler(_euler);
        _scale.set(1, 1, 1);
        subMat.compose(_pos, _quat, _scale);

        pushTransformedGeo(rugBuckets[cell.hasRug], rugBodyBase, subMat);

        for (const endZ of [-1.48, 1.48]) {
          for (let fIdx = 0; fIdx < 22; fIdx++) {
            const fx = -0.92 + (fIdx / 21) * 1.84;
            const rotY = (((fIdx * 7) % 5) - 2) * 0.06;
            pushTransformedGeo(
              fIdx % 2 === 0 ? fringeEvenBucket : fringeOddBucket,
              fringeBase,
              subMat,
              fx,
              -0.002,
              endZ,
              0,
              rotY,
              0
            );
          }
        }
      }

      // 5. Hanging Pierced-Brass Sanctuary Lantern
      if (cell.hasLantern) {
        const ly = CEILING_HEIGHT - 0.15;
        pushTransformedGeo(lanternCordBucket, lanternCordBase, cellMat, 0, ly - 0.45, 0);
        pushTransformedGeo(lanternCapBucket, lanternCapBase, cellMat, 0, ly - 0.98 + 0.14, 0);
        pushTransformedGeo(lanternGlowBucket, lanternGlowBase, cellMat, 0, ly - 0.98, 0);
        pushTransformedGeo(lanternCageBucket, lanternCageBase, cellMat, 0, ly - 0.98, 0);
      }

      // 6. Sanctuary of Golden Dust Centerpiece
      if (cell.zoneId === 'golden-sanctuary') {
        pushTransformedGeo(
          sanctuaryPedestalBucket,
          sanctuaryPedestalBase,
          cellMat,
          0,
          0.24,
          0
        );
        pushTransformedGeo(sanctuaryBrassBucket, sanctuaryBrassBase, cellMat, 0, 0.5, 0);
      }

      // 7. Four Cell Walls
      for (const dir of ['N', 'S', 'E', 'W'] as WallDirection[]) {
        if (!shouldRenderWall(cell, dir)) continue;
        const feat = cell.walls[dir];
        const { pos, rotY } = getWallTransform(dir);

        _pos.set(cell.x + pos[0], pos[1], cell.z + pos[2]);
        _euler.set(0, rotY, 0, 'XYZ');
        _quat.setFromEuler(_euler);
        _scale.set(1, 1, 1);
        subMat.compose(_pos, _quat, _scale);

        if (feat === 'arch') {
          pushTransformedGeo(plasterMainBucket, pointedArchBase, subMat);
          pushTransformedGeo(archHoverBucket, pointedArchBase, subMat);
          pushTransformedGeo(plasterSunlitBucket, archTrimBase, subMat, -1.36, 1.45, 0);
          pushTransformedGeo(plasterSunlitBucket, archTrimBase, subMat, 1.36, 1.45, 0);
        } else if (feat === 'mashrabiya') {
          pushTransformedGeo(
            plasterMainBucket,
            mashPillarBase,
            subMat,
            -1.55,
            CEILING_HEIGHT / 2,
            0
          );
          pushTransformedGeo(
            plasterMainBucket,
            mashPillarBase,
            subMat,
            1.55,
            CEILING_HEIGHT / 2,
            0
          );
          pushTransformedGeo(plasterSunlitBucket, mashSillBase, subMat, 0, 0.31, 0.06);
          pushTransformedGeo(plasterMainBucket, mashHeaderBase, subMat, 0, 3.42, 0);

          for (const side of [-1, 1]) {
            pushTransformedGeo(
              plasterSunlitBucket,
              corbelOuterBase,
              subMat,
              side * 0.68,
              2.82,
              0.04
            );
            pushTransformedGeo(
              plasterSunlitBucket,
              corbelInnerBase,
              subMat,
              side * 0.46,
              2.92,
              0.04
            );
          }

          pushTransformedGeo(
            plasterSunlitBucket,
            plaqueBase,
            subMat,
            0,
            3.32,
            WALL_THICKNESS / 2 + 0.03
          );
          pushTransformedGeo(
            windowGlowBucket,
            windowGlowBase,
            subMat,
            0,
            1.82,
            -WALL_THICKNESS / 2 - 0.04
          );

          // 4-Panel Carved Cedar Mashrabiya Lattice Screen
          _pos.set(0, 1.8, -0.08);
          _quat.identity();
          _scale.set(1, 1, 1);
          subMat2.compose(_pos, _quat, _scale);
          subMat2.premultiply(subMat);

          pushTransformedGeo(latWoodDarkBucket, latFrameBase, subMat2, -0.76, 0, 0);
          pushTransformedGeo(latWoodDarkBucket, latFrameBase, subMat2, 0.76, 0, 0);
          for (const cy of [-1.15, -0.55, 0.05, 0.65, 1.16]) {
            pushTransformedGeo(latWoodDarkBucket, latCrossbarBase, subMat2, 0, cy, 0);
          }
          for (const lx of [-0.52, -0.26, 0, 0.26, 0.52]) {
            pushTransformedGeo(latWoodMidBucket, latVertBase, subMat2, lx, 0, 0);
          }
          for (const py of [-0.85, -0.25, 0.35, 0.88]) {
            for (const dx of [-0.48, -0.16, 0.16, 0.48]) {
              pushTransformedGeo(
                latWoodLightBucket,
                latDiagBase,
                subMat2,
                dx,
                py,
                0,
                0,
                0,
                Math.PI / 4
              );
              pushTransformedGeo(
                latWoodLightBucket,
                latDiagBase,
                subMat2,
                dx,
                py,
                0,
                0,
                0,
                -Math.PI / 4
              );
              pushTransformedGeo(
                latWoodDarkBucket,
                latHubBase,
                subMat2,
                dx,
                py,
                0,
                Math.PI / 2,
                0,
                0
              );
            }
          }

          // Window Sill Terracotta Pots
          pushTransformedGeo(potClayBucket, sillPotJarBase, subMat, -0.24, 0.82, 0.06);
          pushTransformedGeo(potClayBucket, sillPotNeckBase, subMat, -0.24, 1.01, 0.06);
          pushTransformedGeo(
            potCompanionBucket,
            sillPotPitcherBase,
            subMat,
            0.08,
            0.84,
            0.01,
            0,
            0,
            0,
            0.82,
            1.15,
            0.82
          );

          // Dappled Mashrabiya Sunlight Projections
          pushTransformedGeo(
            goboFloorBucket,
            goboFloorBase,
            subMat,
            0.18,
            0.022,
            1.52,
            -Math.PI / 2,
            0,
            -0.08
          );
          pushTransformedGeo(
            goboSillBucket,
            goboSillBase,
            subMat,
            0,
            0.632,
            0.08,
            -Math.PI / 2,
            0,
            0
          );
          pushTransformedGeo(
            goboWallBucket,
            goboWallBase,
            subMat,
            0.88,
            1.48,
            WALL_THICKNESS / 2 + 0.015,
            0,
            0,
            -0.38
          );
          pushTransformedGeo(
            sunbeamRayBucket,
            sunbeamRayBase,
            subMat,
            0.08,
            1.25,
            0.78,
            0.52,
            0,
            0
          );
        } else if (feat === 'sun-portal') {
          pushTransformedGeo(
            plasterMainBucket,
            mashPillarBase,
            subMat,
            -1.55,
            CEILING_HEIGHT / 2,
            0
          );
          pushTransformedGeo(
            plasterMainBucket,
            mashPillarBase,
            subMat,
            1.55,
            CEILING_HEIGHT / 2,
            0
          );
          pushTransformedGeo(plasterSunlitBucket, portalHeaderBase, subMat, 0, 3.35, 0);
          pushTransformedGeo(plasterSunlitBucket, portalSillBase, subMat, 0, 0.14, 0);
          pushTransformedGeo(
            portalLightwellBucket,
            portalLightwellBase,
            subMat,
            0,
            1.62,
            -WALL_THICKNESS / 2 - 0.02
          );
          pushTransformedGeo(
            portalSpillBucket,
            portalSpillBase,
            subMat,
            0,
            0.019,
            1.25,
            -Math.PI / 2,
            0,
            0
          );
        } else if (feat === 'niche' || feat === 'solid') {
          pushTransformedGeo(
            plasterMainBucket,
            solidWallBase,
            subMat,
            0,
            CEILING_HEIGHT / 2,
            0
          );
          if (feat === 'niche') {
            const nz = WALL_THICKNESS / 2 + 0.02;
            pushTransformedGeo(plasterSunlitBucket, nicheTopBase, subMat, 0, 1.97, nz);
            pushTransformedGeo(plasterSunlitBucket, nicheBotBase, subMat, 0, 1.13, nz + 0.04);
            pushTransformedGeo(potClayBucket, nicheVaseBase, subMat, 0, 1.35, nz + 0.05);
          }
        }
      }
    }

    // Dispose base templates
    [
      pointedArchBase,
      floorTileBase,
      ceilingPlankBase,
      rafterBase,
      ledgerBase,
      pierBase,
      rugBodyBase,
      fringeBase,
      lanternCordBase,
      lanternCapBase,
      lanternGlowBase,
      lanternCageBase,
      sanctuaryPedestalBase,
      sanctuaryBrassBase,
      archTrimBase,
      mashPillarBase,
      mashSillBase,
      mashHeaderBase,
      corbelOuterBase,
      corbelInnerBase,
      plaqueBase,
      windowGlowBase,
      latFrameBase,
      latCrossbarBase,
      latVertBase,
      latDiagBase,
      latHubBase,
      sillPotJarBase,
      sillPotNeckBase,
      sillPotPitcherBase,
      goboFloorBase,
      goboSillBase,
      goboWallBase,
      sunbeamRayBase,
      portalHeaderBase,
      portalSillBase,
      portalLightwellBase,
      portalSpillBase,
      solidWallBase,
      nicheTopBase,
      nicheBotBase,
      nicheVaseBase,
    ].forEach((g) => g.dispose());

    return {
      floorGeo: mergeBufferGeometries(floorBucket),
      ceilingPlankGeo: mergeBufferGeometries(ceilingPlankBucket),
      rafterEvenGeo: mergeBufferGeometries(rafterEvenBucket),
      rafterOddGeo: mergeBufferGeometries(rafterOddBucket),
      ledgerGeo: mergeBufferGeometries(ledgerBucket),
      pierGeo: mergeBufferGeometries(pierBucket),
      rugGeos: {
        'kilim-rust': mergeBufferGeometries(rugBuckets['kilim-rust']),
        'persian-indigo': mergeBufferGeometries(rugBuckets['persian-indigo']),
        'ochre-tribal': mergeBufferGeometries(rugBuckets['ochre-tribal']),
        'royal-medallion': mergeBufferGeometries(rugBuckets['royal-medallion']),
      },
      fringeEvenGeo: mergeBufferGeometries(fringeEvenBucket),
      fringeOddGeo: mergeBufferGeometries(fringeOddBucket),
      lanternCordGeo: mergeBufferGeometries(lanternCordBucket),
      lanternCapGeo: mergeBufferGeometries(lanternCapBucket),
      lanternGlowGeo: mergeBufferGeometries(lanternGlowBucket),
      lanternCageGeo: mergeBufferGeometries(lanternCageBucket),
      sanctuaryPedestalGeo: mergeBufferGeometries(sanctuaryPedestalBucket),
      sanctuaryBrassGeo: mergeBufferGeometries(sanctuaryBrassBucket),
      plasterMainGeo: mergeBufferGeometries(plasterMainBucket),
      plasterSunlitGeo: mergeBufferGeometries(plasterSunlitBucket),
      archHoverGeo: mergeBufferGeometries(archHoverBucket),
      windowGlowGeo: mergeBufferGeometries(windowGlowBucket),
      portalLightwellGeo: mergeBufferGeometries(portalLightwellBucket),
      latWoodDarkGeo: mergeBufferGeometries(latWoodDarkBucket),
      latWoodMidGeo: mergeBufferGeometries(latWoodMidBucket),
      latWoodLightGeo: mergeBufferGeometries(latWoodLightBucket),
      potClayGeo: mergeBufferGeometries(potClayBucket),
      potCompanionGeo: mergeBufferGeometries(potCompanionBucket),
      goboFloorGeo: mergeBufferGeometries(goboFloorBucket),
      goboSillGeo: mergeBufferGeometries(goboSillBucket),
      goboWallGeo: mergeBufferGeometries(goboWallBucket),
      sunbeamRayGeo: mergeBufferGeometries(sunbeamRayBucket),
      portalSpillGeo: mergeBufferGeometries(portalSpillBucket),
    };
  }, []);

  // Lighting mood multipliers
  const windowGlowColor =
    sunMood === 'morning-gold'
      ? '#fff9ea'
      : sunMood === 'amber-afternoon'
        ? '#ffe5b8'
        : '#ffd194';

  const goboOpacity =
    sunMood === 'morning-gold' ? 0.85 : sunMood === 'amber-afternoon' ? 0.92 : 0.52;

  const lanternIntensity =
    sunMood === 'lantern-dusk' ? 2.4 : sunMood === 'amber-afternoon' ? 1.35 : 0.85;

  // Pre-allocated candidate array in a ref for zero-allocation light pool sorting
  const lightCandidatesRef = useRef(
    MAZE_DATA.lightSources.map((src) => ({
      x: src.x,
      y: src.y,
      z: src.z,
      kind: src.kind,
      distSq: 0,
    }))
  );

  // Animate floating Sun Relics, Walk Marker, and update nearest PointLight Pool
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const charPos = characterPosRef.current;

    if (relicsGroupRef.current) {
      relicsGroupRef.current.children.forEach((child, idx) => {
        child.position.y = 0.72 + Math.sin(t * 2.4 + idx * 1.1) * 0.09;
        child.rotation.y = t * 1.2 + idx * 0.5;
      });
    }

    if (markerRef.current && walkMarker) {
      markerRef.current.rotation.z = t * 1.6;
      const s = 0.9 + Math.sin(t * 4.2) * 0.12;
      markerRef.current.scale.setScalar(s);
    }

    // Update Dynamic Local Light Pool (assign closest active lights to the player/camera)
    const refX = (charPos.x + state.camera.position.x) * 0.5;
    const refZ = (charPos.z + state.camera.position.z) * 0.5;
    const candidates = lightCandidatesRef.current;

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const dx = c.x - refX;
      const dz = c.z - refZ;
      c.distSq = dx * dx + dz * dz;
    }
    candidates.sort((a, b) => a.distSq - b.distSq);

    const mashIntensity = sunMood === 'lantern-dusk' ? 1.1 : 2.35;
    const portalIntensity = sunMood === 'lantern-dusk' ? 0.9 : 2.1;

    for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
      const light = lightPoolRefs.current[i];
      const src = candidates[i];
      if (!light || !src) continue;

      light.position.set(src.x, src.y, src.z);
      if (src.kind === 'lantern') {
        light.color.set('#ffc878');
        light.intensity = lanternIntensity;
        light.distance = 6.5;
        light.decay = 2;
      } else if (src.kind === 'sanctuary') {
        light.color.set('#ffe299');
        light.intensity = 2.2;
        light.distance = 8;
        light.decay = 2;
      } else if (src.kind === 'mashrabiya') {
        light.color.set(windowGlowColor);
        light.intensity = mashIntensity;
        light.distance = 6.2;
        light.decay = 1.8;
      } else {
        light.color.set('#fff7e2');
        light.intensity = portalIntensity;
        light.distance = 5.8;
        light.decay = 1.9;
      }
    }
  });

  const targetZone =
    LANDMARK_ZONES.find((z) => z.id === targetZoneId) ||
    LANDMARK_ZONES[LANDMARK_ZONES.length - 1];

  return (
    <group>
      {/* ================================================================= */}
      {/* POOLED LOCAL CORRIDOR POINT LIGHTS (Zero Shader Recompilations!)  */}
      {/* ================================================================= */}
      {Array.from({ length: LIGHT_POOL_SIZE }).map((_, idx) => (
        <pointLight
          key={`pooled-light-${idx}`}
          ref={(el) => {
            lightPoolRefs.current[idx] = el;
          }}
          color="#fff7e2"
          intensity={1.2}
          distance={6.2}
          decay={1.9}
        />
      ))}

      {/* ================================================================= */}
      {/* 1. MERGED FLOOR, TIMBER CEILING, RAFTERS, LEDGERS & PIERS         */}
      {/* ================================================================= */}
      <mesh
        geometry={mergedArch.floorGeo}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          const { row, col } = worldToCell(e.point.x, e.point.z);
          const cell = MAZE_DATA.grid[row]?.[col];
          const zId = cell?.zoneId || null;
          if (zId !== lastHoveredCellZoneRef.current) {
            lastHoveredCellZoneRef.current = zId;
            if (zId) {
              const zoneObj = LANDMARK_ZONES.find((z) => z.id === zId);
              if (zoneObj) {
                onHover(`${zoneObj.title} — Click floor to walk here`);
              }
            } else {
              onHover(null);
            }
          }
        }}
        onPointerOut={() => {
          lastHoveredCellZoneRef.current = null;
          onHover(null);
        }}
      >
        <meshStandardMaterial
          map={floorTex.map}
          bumpMap={floorTex.bumpMap}
          bumpScale={0.018}
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      <mesh geometry={mergedArch.ceilingPlankGeo} receiveShadow>
        <meshStandardMaterial
          map={timberTex.map}
          bumpMap={timberTex.bumpMap}
          bumpScale={0.03}
          color="#3d2719"
          roughness={0.86}
        />
      </mesh>

      <mesh geometry={mergedArch.rafterEvenGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={timberTex.map}
          bumpMap={timberTex.bumpMap}
          bumpScale={0.025}
          color="#4c3220"
          roughness={0.82}
        />
      </mesh>

      <mesh geometry={mergedArch.rafterOddGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={timberTex.map}
          bumpMap={timberTex.bumpMap}
          bumpScale={0.025}
          color="#3f2819"
          roughness={0.82}
        />
      </mesh>

      <mesh geometry={mergedArch.ledgerGeo} castShadow receiveShadow>
        <meshStandardMaterial map={timberTex.map} color="#3a2416" roughness={0.85} />
      </mesh>

      <mesh geometry={mergedArch.pierGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={plasterShaded.map}
          bumpMap={plasterShaded.bumpMap}
          bumpScale={0.025}
          roughness={0.86}
        />
      </mesh>

      {/* ================================================================= */}
      {/* 2. MERGED WOVEN PERSIAN / ANATOLIAN KILIM CARPETS & FRINGES       */}
      {/* ================================================================= */}
      {(
        ['kilim-rust', 'persian-indigo', 'ochre-tribal', 'royal-medallion'] as const
      ).map((variant) => (
        <mesh
          key={`rugs-${variant}`}
          geometry={mergedArch.rugGeos[variant]}
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onFloorClick(e.point);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover('Hand-Woven Persian Kilim Runner — Click to walk across');
          }}
          onPointerOut={() => onHover(null)}
        >
          <meshStandardMaterial
            map={rugTextures[variant].map}
            bumpMap={rugTextures[variant].bumpMap}
            bumpScale={0.022}
            roughness={0.92}
          />
        </mesh>
      ))}

      <mesh geometry={mergedArch.fringeEvenGeo} receiveShadow>
        <meshStandardMaterial color="#d8cbb8" roughness={0.95} />
      </mesh>
      <mesh geometry={mergedArch.fringeOddGeo} receiveShadow>
        <meshStandardMaterial color="#9c9284" roughness={0.95} />
      </mesh>

      {/* ================================================================= */}
      {/* 3. MERGED HANGING LANTERNS & SANCTUARY CENTERPIECE                */}
      {/* ================================================================= */}
      <mesh geometry={mergedArch.lanternCordGeo}>
        <meshStandardMaterial color="#2b1e16" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh geometry={mergedArch.lanternCapGeo}>
        <meshStandardMaterial color="#705232" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh geometry={mergedArch.lanternGlowGeo}>
        <meshStandardMaterial
          color="#ffdfa0"
          emissive="#ffae42"
          emissiveIntensity={1.6}
          roughness={0.3}
        />
      </mesh>
      <mesh geometry={mergedArch.lanternCageGeo}>
        <meshStandardMaterial color="#5e4327" roughness={0.45} metalness={0.7} wireframe />
      </mesh>

      <mesh geometry={mergedArch.sanctuaryPedestalGeo} castShadow receiveShadow>
        <meshStandardMaterial map={plasterSunlit.map} color="#d8b892" roughness={0.75} />
      </mesh>
      <mesh geometry={mergedArch.sanctuaryBrassGeo} castShadow>
        <meshStandardMaterial color="#b58342" roughness={0.35} metalness={0.75} />
      </mesh>

      {/* ================================================================= */}
      {/* 4. MERGED ADOBE WALLS, ARCHES, MASHRABIYA SCREENS & GOBO LIGHTS   */}
      {/* ================================================================= */}
      <mesh geometry={mergedArch.plasterMainGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={plasterMain.map}
          bumpMap={plasterMain.bumpMap}
          bumpScale={0.024}
          roughness={0.86}
        />
      </mesh>

      <mesh geometry={mergedArch.plasterSunlitGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={plasterSunlit.map}
          bumpMap={plasterSunlit.bumpMap}
          bumpScale={0.02}
          roughness={0.82}
        />
      </mesh>

      {/* Archway Hover Proxy */}
      <mesh
        geometry={mergedArch.archHoverGeo}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('Pointed Adobe Archway — Traditional Hand-Plastered Passage');
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      <mesh
        geometry={mergedArch.windowGlowGeo}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(
            'Mashrabiya Lattice Window — Carved Geometric Wood Screen & Dappled Sunlight'
          );
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshBasicMaterial color={windowGlowColor} />
      </mesh>

      <mesh
        geometry={mergedArch.portalLightwellGeo}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('Sunlit Courtyard Alcove — Warm Indirect Daylight Shaft');
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshBasicMaterial color="#fffdf5" />
      </mesh>

      <mesh geometry={mergedArch.latWoodDarkGeo} castShadow>
        <meshStandardMaterial color="#6e472b" roughness={0.75} />
      </mesh>
      <mesh geometry={mergedArch.latWoodMidGeo}>
        <meshStandardMaterial color="#7a4e2e" roughness={0.75} />
      </mesh>
      <mesh geometry={mergedArch.latWoodLightGeo}>
        <meshStandardMaterial color="#875835" roughness={0.72} />
      </mesh>

      <mesh geometry={mergedArch.potClayGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={potClayTex.map}
          bumpMap={potClayTex.bumpMap}
          bumpScale={0.025}
          roughness={0.68}
        />
      </mesh>
      <mesh geometry={mergedArch.potCompanionGeo} castShadow>
        <meshStandardMaterial map={potClayTex.map} color="#b5744a" roughness={0.68} />
      </mesh>

      <mesh geometry={mergedArch.goboFloorGeo}>
        <meshBasicMaterial
          map={lightGoboTex}
          transparent
          opacity={goboOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={mergedArch.goboSillGeo}>
        <meshBasicMaterial
          map={lightGoboTex}
          transparent
          opacity={goboOpacity * 0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={mergedArch.goboWallGeo}>
        <meshBasicMaterial
          map={lightGoboTex}
          transparent
          opacity={goboOpacity * 0.88}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={mergedArch.sunbeamRayGeo}>
        <meshBasicMaterial
          color={windowGlowColor}
          transparent
          opacity={0.085}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={mergedArch.portalSpillGeo}>
        <meshBasicMaterial
          color={windowGlowColor}
          transparent
          opacity={goboOpacity * 0.42}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ================================================================= */}
      {/* 5. COLLECTIBLE GOLDEN MASHRABIYA SUN RELICS (✧)                   */}
      {/* ================================================================= */}
      <group ref={relicsGroupRef}>
        {INITIAL_SUN_RELICS.map((relic) => {
          const isCollected = collectedRelics.includes(relic.id);
          return (
            <group
              key={relic.id}
              visible={!isCollected}
              position={[relic.position[0], relic.position[1], relic.position[2]]}
              onPointerOver={(e) => {
                if (isCollected) return;
                e.stopPropagation();
                onHover(`✧ ${relic.name} — Walk close with Mina to collect!`);
              }}
              onPointerOut={() => onHover(null)}
            >
              <mesh geometry={relicStarGeo} castShadow>
                <meshStandardMaterial
                  color="#ffd97d"
                  emissive="#ffaa2b"
                  emissiveIntensity={1.35}
                  roughness={0.25}
                  metalness={0.75}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ================================================================= */}
      {/* 6. GOLDEN SUN-THREAD BREADCRUMB GUIDE PATH TO TARGET CHAMBER      */}
      {/* ================================================================= */}
      {showGuidePath && (
        <GoldenBreadcrumbGuide
          ref={guideGroupRef}
          characterPosRef={characterPosRef}
          targetZone={targetZone}
        />
      )}

      {/* ================================================================= */}
      {/* 7. CLICK-TO-WALK DESTINATION FLOOR MARKER                         */}
      {/* ================================================================= */}
      {walkMarker && (
        <group
          ref={markerRef}
          position={[walkMarker[0], 0.028, walkMarker[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh>
            <ringGeometry args={[0.24, 0.32, 32]} />
            <meshBasicMaterial color="#ffcf6e" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.16, 24]} />
            <meshBasicMaterial color="#fff3cc" transparent opacity={0.45} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * Dynamic Golden Sun-Thread Breadcrumb Trail using imperative pooled meshes
 * so zero React state updates or geometry allocations occur while walking!
 */
const MAX_BREADCRUMB_DOTS = 28;

const GoldenBreadcrumbGuide = forwardRef<
  THREE.Group,
  {
    characterPosRef: React.MutableRefObject<THREE.Vector3>;
    targetZone: LandmarkZone;
  }
>(function GoldenBreadcrumbGuide({ characterPosRef, targetZone }, ref) {
  const internalGroupRef = useRef<THREE.Group | null>(null);
  const lastCellKeyRef = useRef<string>('');
  const dotCircleGeo = useMemo(() => new THREE.CircleGeometry(0.065, 12), []);

  useFrame((state) => {
    const grp = internalGroupRef.current;
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
    <group
      ref={(node) => {
        internalGroupRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
    >
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
          />
        </mesh>
      ))}
    </group>
  );
});
