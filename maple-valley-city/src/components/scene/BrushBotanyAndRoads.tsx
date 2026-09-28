import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CELL_SIZE,
  CITY_CELLS,
  CITY_DISTRICTS,
  CITY_TREE_PLACEMENTS,
  HALF_CITY_D,
  HALF_CITY_W,
  HERO_MAPLE_POS,
  INITIAL_MAPLE_CHARMS,
  cellToWorld,
} from '../../domain/cityLayout';
import {
  createBrushCloudFoliageGeometry,
  createSculptedBoulderGeometry,
  createSplineTrunkGeometry,
  mergeBufferGeometries,
  pseudoRandom,
  pushTransformedGeo,
} from '../../core/geometryBatcher';
import {
  createBarkBrushTextures,
  createBrushRoadTextures,
  createFieldstoneMasonryTextures,
  createMeadowGrassTextures,
  createPainterlyFoliageTextures,
} from '../../core/brushTextures';

interface BrushBotanyAndRoadsProps {
  collectedCharms: number[];
  walkMarker: [number, number, number] | null;
  onRoadClick: (point: THREE.Vector3) => void;
  onHover: (label: string | null) => void;
}

export default function BrushBotanyAndRoads({
  collectedCharms,
  walkMarker,
  onRoadClick,
  onHover,
}: BrushBotanyAndRoadsProps) {
  const charmsGroupRef = useRef<THREE.Group>(null);
  const markerRingRef = useRef<THREE.Mesh>(null);

  const roadTex = useMemo(() => createBrushRoadTextures(), []);
  const stoneTex = useMemo(() => createFieldstoneMasonryTextures(), []);
  const barkTex = useMemo(() => createBarkBrushTextures(), []);
  const mapleTex = useMemo(() => createPainterlyFoliageTextures('maple-persimmon'), []);
  const pineTex = useMemo(() => createPainterlyFoliageTextures('pine-sage'), []);
  const meadowTex = useMemo(() => createMeadowGrassTextures(), []);

  const materials = useMemo(() => {
    roadTex.map.repeat.set(1, 1);
    roadTex.bumpMap.repeat.set(1, 1);

    meadowTex.map.repeat.set(18, 18);
    meadowTex.bumpMap.repeat.set(18, 18);

    return {
      meadowGround: new THREE.MeshStandardMaterial({
        map: meadowTex.map,
        bumpMap: meadowTex.bumpMap,
        bumpScale: 0.035,
        color: '#6BB352',
        roughness: 0.88,
      }),
      meadowHill: new THREE.MeshStandardMaterial({
        map: meadowTex.map,
        bumpMap: meadowTex.bumpMap,
        bumpScale: 0.03,
        color: '#5FA448',
        roughness: 0.86,
      }),
      cityBaseGround: new THREE.MeshStandardMaterial({
        color: '#EFE2CA',
        roughness: 0.94,
      }),
      sandyRoad: new THREE.MeshStandardMaterial({
        map: roadTex.map,
        bumpMap: roadTex.bumpMap,
        bumpScale: 0.022,
        roughness: 0.9,
      }),
      stoneRoad: new THREE.MeshStandardMaterial({
        map: stoneTex.map,
        bumpMap: stoneTex.bumpMap,
        bumpScale: 0.032,
        color: '#F2ECE1',
        roughness: 0.86,
      }),
      bark: new THREE.MeshStandardMaterial({
        map: barkTex.map,
        bumpMap: barkTex.bumpMap,
        bumpScale: 0.045,
        color: '#634E42',
        roughness: 0.88,
      }),
      maplePersimmon: new THREE.MeshStandardMaterial({
        map: mapleTex.map,
        bumpMap: mapleTex.bumpMap,
        bumpScale: 0.03,
        color: '#F46E34',
        roughness: 0.78,
      }),
      mapleAmber: new THREE.MeshStandardMaterial({
        map: mapleTex.map,
        bumpMap: mapleTex.bumpMap,
        bumpScale: 0.028,
        color: '#FBA252',
        roughness: 0.76,
      }),
      pineSage: new THREE.MeshStandardMaterial({
        map: pineTex.map,
        bumpMap: pineTex.bumpMap,
        bumpScale: 0.032,
        color: '#7D906B',
        roughness: 0.84,
      }),
      boulder: new THREE.MeshStandardMaterial({
        map: stoneTex.map,
        bumpMap: stoneTex.bumpMap,
        bumpScale: 0.035,
        color: '#E6E2DA',
        roughness: 0.84,
      }),
      earthenBank: new THREE.MeshStandardMaterial({
        color: '#E4C19C',
        roughness: 0.92,
      }),
      fenceWood: new THREE.MeshStandardMaterial({
        color: '#9E6B43',
        roughness: 0.82,
      }),
      grassTuft: new THREE.MeshStandardMaterial({
        color: '#4E8F38',
        roughness: 0.8,
      }),
      grassLushBlade: new THREE.MeshStandardMaterial({
        color: '#68B849',
        roughness: 0.74,
      }),
      pinkFlower: new THREE.MeshStandardMaterial({
        color: '#F6919B',
        roughness: 0.62,
      }),
      orangeFlower: new THREE.MeshStandardMaterial({
        color: '#F26430',
        roughness: 0.62,
      }),
      meadowPondWater: new THREE.MeshStandardMaterial({
        color: '#4FB8C4',
        emissive: '#226E7A',
        emissiveIntensity: 0.25,
        roughness: 0.18,
        metalness: 0.15,
      }),
    };
  }, [roadTex, stoneTex, barkTex, mapleTex, pineTex, meadowTex]);

  const batchedGeos = useMemo(() => {
    const sandyRoadBucket: THREE.BufferGeometry[] = [];
    const stoneRoadBucket: THREE.BufferGeometry[] = [];
    const barkBucket: THREE.BufferGeometry[] = [];
    const maplePersimmonBucket: THREE.BufferGeometry[] = [];
    const mapleAmberBucket: THREE.BufferGeometry[] = [];
    const pineSageBucket: THREE.BufferGeometry[] = [];
    const boulderBucket: THREE.BufferGeometry[] = [];
    const bankBucket: THREE.BufferGeometry[] = [];
    const fenceBucket: THREE.BufferGeometry[] = [];
    const grassBucket: THREE.BufferGeometry[] = [];
    const lushBladeBucket: THREE.BufferGeometry[] = [];
    const pinkFlowerBucket: THREE.BufferGeometry[] = [];
    const orangeFlowerBucket: THREE.BufferGeometry[] = [];
    const meadowHillBucket: THREE.BufferGeometry[] = [];

    const identity = new THREE.Matrix4();
    const roadTileGeo = new THREE.BoxGeometry(CELL_SIZE + 0.15, 0.08, CELL_SIZE + 0.15);
    const trailTileGeo = new THREE.BoxGeometry(4.6, 0.06, 6.5);
    const postGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.95, 12);
    const railGeo = new THREE.CylinderGeometry(0.032, 0.032, 1.15, 10);
    railGeo.rotateZ(Math.PI * 0.5);
    const boulderUnit = createSculptedBoulderGeometry(0.45, 0.30, 0.40, 15);
    const bankUnit = createSculptedBoulderGeometry(1.45, 0.24, 1.15, 42);
    const hillMoundUnit = createSculptedBoulderGeometry(7.5, 0.85, 6.2, 88);
    const grassBladeUnit = createBrushCloudFoliageGeometry(0.24, 0.16, 0.22, 64, 1);
    const tallGrassClumpUnit = new THREE.ConeGeometry(0.14, 0.42, 6);
    tallGrassClumpUnit.translate(0, 0.21, 0);
    const blossomPuffUnit = createBrushCloudFoliageGeometry(0.16, 0.10, 0.16, 91, 1);
    const canopyUnit = createBrushCloudFoliageGeometry(0.85, 0.36, 0.80, 33, 2);

    // =========================================================================
    // 1. ROAD NETWORK TILES ACROSS THE 11x11 CITY + COUNTRY MEADOW TRAILS
    // =========================================================================
    for (const cell of CITY_CELLS) {
      if (!cell.isRoad) continue;
      const { x, z } = cellToWorld(cell.row, cell.col);
      if (cell.roadStyle === 'stone-terrace') {
        pushTransformedGeo(stoneRoadBucket, roadTileGeo, identity, x, 0.01, z);
      } else {
        pushTransformedGeo(sandyRoadBucket, roadTileGeo, identity, x, 0.01, z);
      }
    }

    // Scenic sandy trails extending from the South, East, and West gates into the Green Meadow Land
    for (let s = 1; s <= 6; s++) {
      // South Meadow Trail
      pushTransformedGeo(
        sandyRoadBucket,
        trailTileGeo,
        identity,
        Math.sin(s * 0.45) * 1.4,
        -0.01,
        HALF_CITY_D + s * 5.8,
        0,
        Math.cos(s * 0.45) * 0.12,
        0
      );
      // East Meadow Trail
      pushTransformedGeo(
        sandyRoadBucket,
        trailTileGeo,
        identity,
        HALF_CITY_W + s * 5.8,
        -0.01,
        Math.sin(s * 0.4) * 1.4,
        0,
        Math.PI * 0.5 + Math.cos(s * 0.4) * 0.12,
        0
      );
      // West Meadow Trail
      pushTransformedGeo(
        sandyRoadBucket,
        trailTileGeo,
        identity,
        -HALF_CITY_W - s * 5.8,
        -0.01,
        Math.cos(s * 0.4) * 1.4,
        0,
        Math.PI * 0.5 - Math.sin(s * 0.4) * 0.12,
        0
      );
    }

    // =========================================================================
    // 2. HELPER: ORGANIC SPLINE-TRUNK AUTUMN MAPLE OR MOUNTAIN PINE TREE
    // =========================================================================
    const addPainterlyTree = (
      tx: number,
      ty: number,
      tz: number,
      height: number,
      baseR: number,
      treeType: 'maple' | 'ancient-pine',
      seed: number
    ) => {
      const yaw = pseudoRandom(seed * 7 + 1) * Math.PI * 2;
      const swayX = (pseudoRandom(seed * 7 + 2) - 0.5) * 0.85;
      const swayZ = (pseudoRandom(seed * 7 + 3) - 0.5) * 0.75;

      // Sinuous 5-point CatmullRom spline trunk
      const trunkPts = [
        new THREE.Vector3(tx, ty, tz),
        new THREE.Vector3(tx + swayX * 0.35, ty + height * 0.26, tz + swayZ * 0.3),
        new THREE.Vector3(tx - swayX * 0.3, ty + height * 0.54, tz + swayZ * 0.45),
        new THREE.Vector3(tx + swayX * 0.5, ty + height * 0.78, tz - swayZ * 0.2),
        new THREE.Vector3(tx + swayX * 0.25, ty + height, tz),
      ];
      const trunkGeo = createSplineTrunkGeometry(trunkPts, baseR, baseR * 0.22, 20, 10);
      barkBucket.push(trunkGeo);

      // 4 Curved secondary branches radiating into airy horizontal brush pads
      for (let b = 0; b < 4; b++) {
        const bAngle = yaw + (b * Math.PI * 2) / 4 + (pseudoRandom(seed + b) - 0.5) * 0.35;
        const bStartH = ty + height * (0.48 + b * 0.11);
        const bReach = height * (0.28 + pseudoRandom(seed * 3 + b) * 0.14);
        const branchPts = [
          new THREE.Vector3(tx + swayX * 0.2, bStartH, tz + swayZ * 0.2),
          new THREE.Vector3(
            tx + Math.cos(bAngle) * bReach * 0.55,
            bStartH + height * 0.14,
            tz + Math.sin(bAngle) * bReach * 0.55
          ),
          new THREE.Vector3(
            tx + Math.cos(bAngle) * bReach,
            bStartH + height * 0.26,
            tz + Math.sin(bAngle) * bReach
          ),
        ];
        const branchGeo = createSplineTrunkGeometry(
          branchPts,
          baseR * 0.42,
          baseR * 0.1,
          12,
          8
        );
        barkBucket.push(branchGeo);

        const cx = tx + Math.cos(bAngle) * bReach;
        const cy = bStartH + height * 0.28;
        const cz = tz + Math.sin(bAngle) * bReach;
        const cScale = height * 0.22;

        if (treeType === 'ancient-pine') {
          pushTransformedGeo(
            pineSageBucket,
            canopyUnit,
            identity,
            cx,
            cy,
            cz,
            0,
            bAngle,
            0,
            cScale * 1.25,
            cScale * 0.62,
            cScale * 1.15
          );
        } else {
          pushTransformedGeo(
            b % 2 === 0 ? maplePersimmonBucket : mapleAmberBucket,
            canopyUnit,
            identity,
            cx,
            cy,
            cz,
            0,
            bAngle,
            0,
            cScale * 1.15,
            cScale * 0.68,
            cScale * 1.1
          );
        }
      }

      // Upper crown brush stroke pads
      const crownScale = height * 0.26;
      if (treeType === 'ancient-pine') {
        pushTransformedGeo(
          pineSageBucket,
          canopyUnit,
          identity,
          tx + swayX * 0.25,
          ty + height + 0.18,
          tz,
          0,
          yaw,
          0,
          crownScale * 1.35,
          crownScale * 0.65,
          crownScale * 1.25
        );
      } else {
        pushTransformedGeo(
          maplePersimmonBucket,
          canopyUnit,
          identity,
          tx + swayX * 0.25,
          ty + height + 0.15,
          tz,
          0,
          yaw,
          0,
          crownScale * 1.2,
          crownScale * 0.72,
          crownScale * 1.15
        );
        pushTransformedGeo(
          mapleAmberBucket,
          canopyUnit,
          identity,
          tx + swayX * 0.25 + 0.45,
          ty + height + 0.45,
          tz + 0.2,
          0,
          yaw + 0.5,
          0,
          crownScale * 0.95,
          crownScale * 0.65,
          crownScale * 0.9
        );
      }
    };

    // =========================================================================
    // 3. SCULPT THE ICONIC HERO FOREGROUND PERSIMMON MAPLE TREE
    // =========================================================================
    const hx = HERO_MAPLE_POS.x + 0.22;
    const hz = HERO_MAPLE_POS.z;

    const heroTrunkPts = [
      new THREE.Vector3(hx, 0, hz),
      new THREE.Vector3(hx - 0.12, 1.45, hz + 0.06),
      new THREE.Vector3(hx + 0.08, 2.85, hz - 0.05),
      new THREE.Vector3(hx - 0.28, 4.15, hz),
      new THREE.Vector3(hx + 0.15, 5.55, hz - 0.1),
      new THREE.Vector3(hx + 0.35, 6.95, hz - 0.15),
    ];
    barkBucket.push(createSplineTrunkGeometry(heroTrunkPts, 0.32, 0.08, 28, 12));

    const heroBranches: Array<{
      pts: THREE.Vector3[];
      r0: number;
      r1: number;
      pads: Array<{
        x: number;
        y: number;
        z: number;
        sx: number;
        sy: number;
        sz: number;
        tone: 'persimmon' | 'amber' | 'sage';
      }>;
    }> = [
      {
        pts: [
          new THREE.Vector3(hx - 0.05, 3.05, hz),
          new THREE.Vector3(hx - 0.82, 3.52, hz + 0.15),
          new THREE.Vector3(hx - 1.48, 3.78, hz + 0.25),
        ],
        r0: 0.13,
        r1: 0.032,
        pads: [
          { x: hx - 1.15, y: 3.68, z: hz + 0.2, sx: 0.68, sy: 0.38, sz: 0.62, tone: 'persimmon' },
          { x: hx - 1.55, y: 3.85, z: hz + 0.28, sx: 0.56, sy: 0.34, sz: 0.5, tone: 'amber' },
        ],
      },
      {
        pts: [
          new THREE.Vector3(hx - 0.22, 4.05, hz),
          new THREE.Vector3(hx - 0.95, 4.85, hz - 0.18),
          new THREE.Vector3(hx - 1.65, 5.55, hz - 0.32),
          new THREE.Vector3(hx - 2.15, 6.25, hz - 0.42),
        ],
        r0: 0.15,
        r1: 0.032,
        pads: [
          { x: hx - 1.45, y: 5.25, z: hz - 0.15, sx: 0.82, sy: 0.44, sz: 0.72, tone: 'persimmon' },
          { x: hx - 1.95, y: 5.68, z: hz - 0.25, sx: 0.68, sy: 0.38, sz: 0.62, tone: 'amber' },
          { x: hx - 1.45, y: 5.55, z: hz - 2.95, sx: 1.18, sy: 0.68, sz: 0.95, tone: 'sage' },
          { x: hx - 0.75, y: 5.95, z: hz - 3.15, sx: 1.05, sy: 0.62, sz: 0.85, tone: 'sage' },
        ],
      },
      {
        pts: [
          new THREE.Vector3(hx - 0.08, 4.45, hz),
          new THREE.Vector3(hx + 0.85, 5.05, hz + 0.1),
          new THREE.Vector3(hx + 1.75, 5.35, hz + 0.18),
        ],
        r0: 0.14,
        r1: 0.032,
        pads: [
          { x: hx + 1.05, y: 5.12, z: hz + 0.12, sx: 0.88, sy: 0.44, sz: 0.78, tone: 'persimmon' },
          { x: hx + 1.72, y: 5.38, z: hz + 0.2, sx: 0.75, sy: 0.38, sz: 0.68, tone: 'amber' },
        ],
      },
      {
        pts: [
          new THREE.Vector3(hx + 0.08, 5.35, hz - 0.08),
          new THREE.Vector3(hx - 0.52, 6.25, hz - 0.12),
          new THREE.Vector3(hx - 1.05, 6.95, hz - 0.18),
        ],
        r0: 0.12,
        r1: 0.028,
        pads: [
          { x: hx - 0.48, y: 6.32, z: hz - 0.1, sx: 0.92, sy: 0.48, sz: 0.82, tone: 'amber' },
          { x: hx - 1.02, y: 7.02, z: hz - 0.15, sx: 0.78, sy: 0.42, sz: 0.72, tone: 'persimmon' },
          { x: hx - 0.12, y: 6.75, z: hz + 0.1, sx: 0.85, sy: 0.45, sz: 0.75, tone: 'persimmon' },
        ],
      },
      {
        pts: [
          new THREE.Vector3(hx + 0.2, 5.95, hz - 0.12),
          new THREE.Vector3(hx + 0.92, 6.65, hz - 0.05),
          new THREE.Vector3(hx + 1.58, 7.15, hz),
        ],
        r0: 0.12,
        r1: 0.028,
        pads: [
          { x: hx + 0.32, y: 7.05, z: hz - 0.12, sx: 1.02, sy: 0.52, sz: 0.88, tone: 'persimmon' },
          { x: hx + 0.95, y: 6.78, z: hz - 0.05, sx: 0.92, sy: 0.46, sz: 0.82, tone: 'amber' },
          { x: hx + 1.55, y: 7.18, z: hz, sx: 0.76, sy: 0.42, sz: 0.68, tone: 'persimmon' },
        ],
      },
    ];

    for (const br of heroBranches) {
      barkBucket.push(createSplineTrunkGeometry(br.pts, br.r0, br.r1, 16, 8));
      for (const pad of br.pads) {
        const targetBucket =
          pad.tone === 'sage'
            ? pineSageBucket
            : pad.tone === 'persimmon'
              ? maplePersimmonBucket
              : mapleAmberBucket;
        pushTransformedGeo(
          targetBucket,
          canopyUnit,
          identity,
          pad.x,
          pad.y,
          pad.z,
          0,
          pad.x * 0.4,
          0,
          pad.sx,
          pad.sy,
          pad.sz
        );
      }
    }

    // Smooth River Boulder Cluster & Pink Cosmos + Orange Marigolds at base of Hero Maple Tree
    for (let r = 0; r < 14; r++) {
      const a = (r / 14) * Math.PI * 2;
      const dist = 0.38 + pseudoRandom(r * 13 + 1) * 0.55;
      const bx = hx - 0.18 + Math.cos(a) * dist;
      const bz = hz + 0.22 + Math.sin(a) * dist;
      const s = 0.62 + pseudoRandom(r * 13 + 2) * 0.65;
      pushTransformedGeo(
        boulderBucket,
        boulderUnit,
        identity,
        bx,
        0.11 * s,
        bz,
        0,
        a,
        0,
        s * 1.15,
        s * 0.82,
        s
      );
    }

    for (let m = 0; m < 10; m++) {
      const mx = hx - 0.35 + (pseudoRandom(m * 11 + 1) - 0.5) * 0.65;
      const mz = hz + 0.22 + (pseudoRandom(m * 11 + 2) - 0.5) * 0.55;
      pushTransformedGeo(orangeFlowerBucket, blossomPuffUnit, identity, mx, 0.28, mz, 0, m, 0, 1.05, 0.95, 1.05);
      pushTransformedGeo(grassBucket, grassBladeUnit, identity, mx, 0.18, mz, 0.08, m, 0, 0.9, 0.95, 0.9);
    }

    for (let f = 0; f < 14; f++) {
      const fx = hx - 0.85 + (pseudoRandom(f * 7 + 1) - 0.5) * 0.95;
      const fz = hz + 0.95 + (pseudoRandom(f * 7 + 2) - 0.5) * 0.75;
      const fs = 0.82 + pseudoRandom(f * 7 + 3) * 0.45;
      pushTransformedGeo(
        pinkFlowerBucket,
        blossomPuffUnit,
        identity,
        fx,
        0.15,
        fz,
        0,
        f * 0.6,
        0,
        fs,
        fs,
        fs
      );
    }

    // =========================================================================
    // 4. LEFT ROADSIDE EARTHEN BANK & RUSTIC TWO-POST WOODEN FENCE
    // =========================================================================
    const heroSquare = cellToWorld(6, 5);
    const fenceX = heroSquare.x - 2.15;
    const fenceZ = heroSquare.z + 1.75;

    pushTransformedGeo(bankBucket, bankUnit, identity, fenceX - 0.65, 0.04, fenceZ - 0.4, 0, 0.18, 0, 1.25, 0.75, 1.65);
    pushTransformedGeo(bankBucket, bankUnit, identity, fenceX - 1.15, 0.10, fenceZ - 2.1, 0, -0.15, 0, 1.35, 0.85, 1.75);

    for (let g = 0; g < 16; g++) {
      const gx = fenceX - 1.25 + pseudoRandom(g * 5 + 1) * 1.35;
      const gz = fenceZ - 2.8 + pseudoRandom(g * 5 + 2) * 3.8;
      pushTransformedGeo(grassBucket, grassBladeUnit, identity, gx, 0.16, gz, 0.06, g, 0.06, 1.1, 0.95, 1.1);
      if (g % 3 === 0) {
        pushTransformedGeo(boulderBucket, boulderUnit, identity, gx + 0.15, 0.1, gz, 0, g, 0, 0.55, 0.45, 0.55);
      }
    }

    pushTransformedGeo(fenceBucket, postGeo, identity, fenceX, 0.42, fenceZ + 0.42);
    pushTransformedGeo(fenceBucket, postGeo, identity, fenceX + 0.16, 0.42, fenceZ - 0.42);
    pushTransformedGeo(fenceBucket, railGeo, identity, fenceX + 0.08, 0.64, fenceZ, 0, Math.PI * 0.5 - 0.18, 0);
    pushTransformedGeo(fenceBucket, railGeo, identity, fenceX + 0.08, 0.36, fenceZ, 0, Math.PI * 0.5 - 0.18, 0);

    // =========================================================================
    // 5. UPPER-LEFT ANCIENT SAGE MOUNTAIN PINE TREE (Perched high behind Upper Lodge!)
    // =========================================================================
    const leftPlot = cellToWorld(4, 4);
    addPainterlyTree(
      leftPlot.x + 0.35,
      5.1,
      leftPlot.z - 4.2,
      7.2,
      0.36,
      'ancient-pine',
      202
    );

    // =========================================================================
    // 6. POPULATE ALL SHARED CITY & GREEN MEADOW TREES (Matched 1-to-1 with Colliders!)
    // =========================================================================
    for (const tree of CITY_TREE_PLACEMENTS) {
      addPainterlyTree(
        tree.x,
        tree.y,
        tree.z,
        tree.height,
        tree.baseR,
        tree.treeType,
        tree.seed
      );

      if (tree.hasRoadsideCluster) {
        for (let b = 0; b < 4; b++) {
          const ba = (b / 4) * Math.PI * 2;
          pushTransformedGeo(
            boulderBucket,
            boulderUnit,
            identity,
            tree.x + Math.cos(ba) * 0.4,
            0.1,
            tree.z + Math.sin(ba) * 0.4,
            0,
            ba,
            0,
            0.72,
            0.68,
            0.72
          );
        }
        pushTransformedGeo(
          tree.seed % 2 === 0 ? pinkFlowerBucket : orangeFlowerBucket,
          blossomPuffUnit,
          identity,
          tree.x + 0.44,
          0.16,
          tree.z + 0.3,
          0,
          tree.seed,
          0,
          1.1,
          1.0,
          1.1
        );
      }
    }

    // =========================================================================
    // 7. OUT-OF-CITY LUSH GREEN LAND WITH GRASS, ROLLING MEADOW HILLS & FLOWERS
    // =========================================================================
    // Gentle rolling green hills around the outer pasture ring
    for (let h = 0; h < 22; h++) {
      const angle = (h / 22) * Math.PI * 2 + 0.15;
      // Keep main N/S/E/W trail corridors level for walking
      if (Math.abs(Math.sin(angle)) < 0.15 || Math.abs(Math.cos(angle)) < 0.15) continue;
      const dist = 54 + pseudoRandom(h * 17 + 1) * 26;
      const hxPos = Math.sin(angle) * dist;
      const hzPos = Math.cos(angle) * dist;
      const sx = 0.85 + pseudoRandom(h * 17 + 2) * 0.7;
      const sy = 0.55 + pseudoRandom(h * 17 + 3) * 0.55;
      const sz = 0.85 + pseudoRandom(h * 17 + 4) * 0.7;
      pushTransformedGeo(
        meadowHillBucket,
        hillMoundUnit,
        identity,
        hxPos,
        -0.12,
        hzPos,
        0,
        angle,
        0,
        sx,
        sy,
        sz
      );
    }

    // Dense 3D multi-blade lush green grass clumps & wildflower patches across the out-of-city green land
    for (let g = 0; g < 380; g++) {
      const angle = (g / 380) * Math.PI * 2 + pseudoRandom(g * 9 + 1) * 0.3;
      const dist = 41.5 + pseudoRandom(g * 9 + 2) * 44.0;
      const gx = Math.sin(angle) * dist;
      const gz = Math.cos(angle) * dist;
      const gs = 0.85 + pseudoRandom(g * 9 + 3) * 0.75;

      // Soft grass cushion
      pushTransformedGeo(
        grassBucket,
        grassBladeUnit,
        identity,
        gx,
        0.1,
        gz,
        0,
        g * 0.7,
        0,
        gs * 1.25,
        gs * 1.1,
        gs * 1.25
      );

      // 3 upright 3D grass blades per tuft
      for (let b = -1; b <= 1; b++) {
        pushTransformedGeo(
          lushBladeBucket,
          tallGrassClumpUnit,
          identity,
          gx + b * 0.12,
          0.02,
          gz + (b === 0 ? 0.08 : -0.06),
          b * 0.14,
          g + b,
          b * 0.18,
          gs,
          gs * (0.9 + (b === 0 ? 0.25 : 0)),
          gs
        );
      }

      if (g % 4 === 0) {
        pushTransformedGeo(
          g % 8 === 0 ? pinkFlowerBucket : orangeFlowerBucket,
          blossomPuffUnit,
          identity,
          gx + 0.18,
          0.18,
          gz - 0.14,
          0,
          g,
          0,
          gs * 0.95,
          gs * 0.95,
          gs * 0.95
        );
      }
    }

    // Rustic wooden pasture fences bordering the Southern Meadow Gateway
    for (const side of [-1, 1]) {
      for (let f = 0; f < 4; f++) {
        const fx = side * (4.2 + f * 2.4);
        const fz = HALF_CITY_D + 1.8;
        pushTransformedGeo(fenceBucket, postGeo, identity, fx - 0.52, 0.42, fz);
        pushTransformedGeo(fenceBucket, postGeo, identity, fx + 0.52, 0.42, fz);
        pushTransformedGeo(fenceBucket, railGeo, identity, fx, 0.64, fz);
        pushTransformedGeo(fenceBucket, railGeo, identity, fx, 0.36, fz);
      }
    }

    roadTileGeo.dispose();
    trailTileGeo.dispose();
    postGeo.dispose();
    railGeo.dispose();
    boulderUnit.dispose();
    bankUnit.dispose();
    hillMoundUnit.dispose();
    grassBladeUnit.dispose();
    tallGrassClumpUnit.dispose();
    blossomPuffUnit.dispose();
    canopyUnit.dispose();

    return {
      sandyRoadGeo: mergeBufferGeometries(sandyRoadBucket),
      stoneRoadGeo: mergeBufferGeometries(stoneRoadBucket),
      barkGeo: mergeBufferGeometries(barkBucket),
      maplePersimmonGeo: mergeBufferGeometries(maplePersimmonBucket),
      mapleAmberGeo: mergeBufferGeometries(mapleAmberBucket),
      pineSageGeo: mergeBufferGeometries(pineSageBucket),
      boulderGeo: mergeBufferGeometries(boulderBucket),
      bankGeo: mergeBufferGeometries(bankBucket),
      fenceGeo: mergeBufferGeometries(fenceBucket),
      grassGeo: mergeBufferGeometries(grassBucket),
      lushBladeGeo: mergeBufferGeometries(lushBladeBucket),
      pinkFlowerGeo: mergeBufferGeometries(pinkFlowerBucket),
      orangeFlowerGeo: mergeBufferGeometries(orangeFlowerBucket),
      meadowHillGeo: mergeBufferGeometries(meadowHillBucket),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (charmsGroupRef.current) {
      charmsGroupRef.current.children.forEach((child, i) => {
        child.rotation.y = t * 1.2 + i;
        child.position.y = 0.72 + Math.sin(t * 2.2 + i) * 0.1;
      });
    }
    if (markerRingRef.current) {
      const s = 1 + Math.sin(t * 4.5) * 0.15;
      markerRingRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      {/* Out-of-City Lush Green Meadow Land (240x240) — Clickable to Stroll into the Pastures! */}
      <mesh
        position={[0, -0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.meadowGround}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onRoadClick(e.point);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('🌿 Lush Green Meadow Pasture — Click anywhere to walk out and visit the animals');
        }}
        onPointerOut={() => onHover(null)}
      >
        <planeGeometry args={[240, 240]} />
      </mesh>

      {/* Rolling Green Meadow Hills Outside the City */}
      <mesh
        geometry={batchedGeos.meadowHillGeo}
        material={materials.meadowHill}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onRoadClick(e.point);
        }}
      />

      {/* Shimmering Turquoise-Celadon Meadow Oasis Pond in the Southern Pasture */}
      <mesh
        position={[14.5, -0.02, HALF_CITY_D + 13.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.meadowPondWater}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onRoadClick(e.point);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('🦢 Shanshui Meadow Spring Pond — Cranes & Sika Deer Sanctuary');
        }}
        onPointerOut={() => onHover(null)}
      >
        <circleGeometry args={[6.8, 36]} />
      </mesh>

      {/* Inner 11x11 Village Warm Earthen Base Apron */}
      <mesh
        position={[0, -0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.cityBaseGround}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onRoadClick(e.point);
        }}
      >
        <planeGeometry args={[HALF_CITY_W * 2 + 1.2, HALF_CITY_D * 2 + 1.2]} />
      </mesh>

      <mesh
        geometry={batchedGeos.sandyRoadGeo}
        material={materials.sandyRoad}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onRoadClick(e.point);
        }}
      />

      <mesh
        geometry={batchedGeos.stoneRoadGeo}
        material={materials.stoneRoad}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onRoadClick(e.point);
        }}
      />

      {/* Organic Spline Tree Trunks & Watercolor Brush Foliage Canopies */}
      <mesh
        geometry={batchedGeos.barkGeo}
        material={materials.bark}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.maplePersimmonGeo}
        material={materials.maplePersimmon}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('🍁 Persimmon Watercolor Maple Canopy');
        }}
        onPointerOut={() => onHover(null)}
      />
      <mesh
        geometry={batchedGeos.mapleAmberGeo}
        material={materials.mapleAmber}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.pineSageGeo}
        material={materials.pineSage}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('🌲 Ancient Mountain Sage Pine');
        }}
        onPointerOut={() => onHover(null)}
      />

      {/* Sculpted River Boulders, Earthen Banks, Rustic Fences, 3D Lush Grass & Roadside Flowers */}
      <mesh
        geometry={batchedGeos.boulderGeo}
        material={materials.boulder}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.bankGeo}
        material={materials.earthenBank}
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.fenceGeo}
        material={materials.fenceWood}
        castShadow
      />
      <mesh
        geometry={batchedGeos.grassGeo}
        material={materials.grassTuft}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.lushBladeGeo}
        material={materials.grassLushBlade}
        castShadow
      />
      <mesh
        geometry={batchedGeos.pinkFlowerGeo}
        material={materials.pinkFlower}
        castShadow
      />
      <mesh
        geometry={batchedGeos.orangeFlowerGeo}
        material={materials.orangeFlower}
        castShadow
      />

      {/* Collectible Smooth Paper-Lantern Orbs at the Districts */}
      <group ref={charmsGroupRef}>
        {INITIAL_MAPLE_CHARMS.map((charm) => {
          if (charm.id === 1 || collectedCharms.includes(charm.id)) return null;
          const district = CITY_DISTRICTS[charm.id - 1];
          return (
            <group
              key={charm.id}
              position={[charm.x, 0.72, charm.z]}
              onClick={(e) => {
                e.stopPropagation();
                onRoadClick(new THREE.Vector3(charm.x, 0, charm.z));
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHover(`${district?.icon ?? '🏮'} ${district?.title ?? charm.name} — Click to stroll here`);
              }}
              onPointerOut={() => onHover(null)}
            >
              <mesh castShadow>
                <sphereGeometry args={[0.18, 20, 16]} />
                <meshStandardMaterial
                  color="#F57A3E"
                  emissive="#F78E44"
                  emissiveIntensity={0.55}
                  roughness={0.32}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Subtle Watercolor Brush Ring at Clicked Destination */}
      {walkMarker && (
        <mesh
          ref={markerRingRef}
          position={[walkMarker[0], 0.06, walkMarker[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.32, 0.48, 28]} />
          <meshBasicMaterial
            color="#F06430"
            transparent
            opacity={0.82}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
