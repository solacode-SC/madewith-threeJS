import { useMemo } from 'react';
import * as THREE from 'three';
import {
  CITY_COLS,
  CITY_ROWS,
  cellToWorld,
  isRoadCell,
} from '../../domain/cityLayout';
import {
  createBrushCloudFoliageGeometry,
  createCurvedGableWallInfillGeometry,
  createSweepingGableRoofGeometry,
  mergeBufferGeometries,
  pseudoRandom,
  pushTransformedGeo,
} from '../../core/geometryBatcher';
import {
  createCedarTimberTextures,
  createCurvedSlateTileTextures,
  createFieldstoneMasonryTextures,
  createPainterlyFoliageTextures,
  createWatercolorPlasterTextures,
} from '../../core/brushTextures';

interface VillageBuildingsProps {
  onHover: (label: string | null) => void;
}

export default function VillageBuildings({ onHover }: VillageBuildingsProps) {
  const plasterTex = useMemo(() => createWatercolorPlasterTextures(), []);
  const roofTex = useMemo(() => createCurvedSlateTileTextures(), []);
  const cedarTex = useMemo(() => createCedarTimberTextures(), []);
  const stoneTex = useMemo(() => createFieldstoneMasonryTextures(), []);
  const pineTex = useMemo(() => createPainterlyFoliageTextures('pine-sage'), []);

  const materials = useMemo(() => {
    return {
      plaster: new THREE.MeshStandardMaterial({
        map: plasterTex.map,
        bumpMap: plasterTex.bumpMap,
        bumpScale: 0.032,
        roughness: 0.84,
      }),
      roofSlate: new THREE.MeshStandardMaterial({
        map: roofTex.map,
        bumpMap: roofTex.bumpMap,
        bumpScale: 0.058,
        roughness: 0.72,
      }),
      cedarTimber: new THREE.MeshStandardMaterial({
        map: cedarTex.map,
        bumpMap: cedarTex.bumpMap,
        bumpScale: 0.042,
        roughness: 0.76,
      }),
      stoneMasonry: new THREE.MeshStandardMaterial({
        map: stoneTex.map,
        bumpMap: stoneTex.bumpMap,
        bumpScale: 0.052,
        roughness: 0.84,
      }),
      darkInkTrim: new THREE.MeshStandardMaterial({
        color: '#342821',
        roughness: 0.78,
      }),
      woodDoor: new THREE.MeshStandardMaterial({
        color: '#B87846',
        roughness: 0.68,
      }),
      terracotta: new THREE.MeshStandardMaterial({
        color: '#CF6836',
        roughness: 0.66,
      }),
      ivyGreen: new THREE.MeshStandardMaterial({
        map: pineTex.map,
        bumpMap: pineTex.bumpMap,
        bumpScale: 0.04,
        color: '#5E8447',
        roughness: 0.82,
      }),
      shojiGlow: new THREE.MeshStandardMaterial({
        color: '#FFF8E5',
        emissive: '#FFC96B',
        emissiveIntensity: 0.62,
        roughness: 0.36,
      }),
      lanternSilk: new THREE.MeshStandardMaterial({
        color: '#F24D29',
        emissive: '#FF6B35',
        emissiveIntensity: 0.85,
        roughness: 0.32,
      }),
      goldOrnament: new THREE.MeshStandardMaterial({
        color: '#EBB448',
        emissive: '#B87D1E',
        emissiveIntensity: 0.22,
        metalness: 0.42,
        roughness: 0.34,
      }),
    };
  }, [plasterTex, roofTex, cedarTex, stoneTex, pineTex]);

  const batchedGeos = useMemo(() => {
    const plasterBucket: THREE.BufferGeometry[] = [];
    const roofBucket: THREE.BufferGeometry[] = [];
    const cedarBucket: THREE.BufferGeometry[] = [];
    const stoneBucket: THREE.BufferGeometry[] = [];
    const inkTrimBucket: THREE.BufferGeometry[] = [];
    const doorBucket: THREE.BufferGeometry[] = [];
    const terracottaBucket: THREE.BufferGeometry[] = [];
    const ivyBucket: THREE.BufferGeometry[] = [];
    const shojiGlowBucket: THREE.BufferGeometry[] = [];
    const lanternSilkBucket: THREE.BufferGeometry[] = [];
    const goldOrnamentBucket: THREE.BufferGeometry[] = [];

    const identity = new THREE.Matrix4();
    const boxUnit = new THREE.BoxGeometry(1, 1, 1);
    const potUnit = new THREE.CylinderGeometry(0.18, 0.13, 0.32, 14);
    const pillarUnit = new THREE.CylinderGeometry(0.068, 0.076, 1, 12);
    const lanternGlobeUnit = new THREE.SphereGeometry(0.15, 14, 12);
    lanternGlobeUnit.scale(1.0, 1.25, 1.0);
    const ivyPuffUnit = createBrushCloudFoliageGeometry(0.32, 0.24, 0.26, 77, 1);

    // Reusable curved roof primitives
    const mainRoofGeo = createSweepingGableRoofGeometry(5.25, 4.85, 1.58, 0.22, 0.28);
    const mainGableInfillGeo = createCurvedGableWallInfillGeometry(4.4, 4.1, 1.32, 0.22);
    const lodgeRoofGeo = createSweepingGableRoofGeometry(4.7, 4.1, 1.38, 0.18, 0.24);
    const miniCanopyRoofGeo = createSweepingGableRoofGeometry(1.52, 1.22, 0.48, 0.08, 0.12, 12, 12);

    const _localMat = new THREE.Matrix4();
    const _localPos = new THREE.Vector3();
    const _localQuat = new THREE.Quaternion();
    const _localScale = new THREE.Vector3(1, 1, 1);
    const _localEuler = new THREE.Euler();

    /**
     * Adds a multi-pane Kumiko/Shoji lattice window with glowing rice-paper interior,
     * wooden sill, optional cedar louvered shutters & terracotta flower planter box.
     */
    const addShojiWindow = (
      houseMat: THREE.Matrix4,
      wx: number,
      wy: number,
      wz: number,
      rotY: number,
      winW = 0.82,
      winH = 0.92,
      withShutters = true,
      withFlowerBox = false
    ) => {
      _localPos.set(wx, wy, wz);
      _localEuler.set(0, rotY, 0, 'XYZ');
      _localQuat.setFromEuler(_localEuler);
      _localScale.set(1, 1, 1);
      _localMat.compose(_localPos, _localQuat, _localScale);
      _localMat.premultiply(houseMat);

      // Outer dark-timber window casing
      pushTransformedGeo(inkTrimBucket, boxUnit, _localMat, 0, 0, 0.02, 0, 0, 0, winW + 0.1, winH + 0.1, 0.07);
      // Warm glowing rice-paper shoji pane
      pushTransformedGeo(shojiGlowBucket, boxUnit, _localMat, 0, 0, 0.04, 0, 0, 0, winW - 0.02, winH - 0.02, 0.05);

      // Vertical & horizontal Kumiko lattice mullions
      pushTransformedGeo(inkTrimBucket, boxUnit, _localMat, -winW * 0.18, 0, 0.068, 0, 0, 0, 0.028, winH, 0.024);
      pushTransformedGeo(inkTrimBucket, boxUnit, _localMat, winW * 0.18, 0, 0.068, 0, 0, 0, 0.028, winH, 0.024);
      pushTransformedGeo(inkTrimBucket, boxUnit, _localMat, 0, winH * 0.18, 0.068, 0, 0, 0, winW, 0.028, 0.024);
      pushTransformedGeo(inkTrimBucket, boxUnit, _localMat, 0, -winH * 0.18, 0.068, 0, 0, 0, winW, 0.028, 0.024);

      // Projecting wooden window sill & top lintel cap
      pushTransformedGeo(cedarBucket, boxUnit, _localMat, 0, -winH * 0.5 - 0.05, 0.08, 0, 0, 0, winW + 0.22, 0.065, 0.16);
      pushTransformedGeo(inkTrimBucket, boxUnit, _localMat, 0, winH * 0.5 + 0.05, 0.07, 0, 0, 0, winW + 0.2, 0.06, 0.14);

      if (withShutters) {
        const shutterW = winW * 0.36;
        pushTransformedGeo(
          cedarBucket,
          boxUnit,
          _localMat,
          -winW * 0.5 - shutterW * 0.5 - 0.04,
          0,
          0.045,
          0,
          0.18,
          0,
          shutterW,
          winH + 0.02,
          0.04
        );
        pushTransformedGeo(
          cedarBucket,
          boxUnit,
          _localMat,
          winW * 0.5 + shutterW * 0.5 + 0.04,
          0,
          0.045,
          0,
          -0.18,
          0,
          shutterW,
          winH + 0.02,
          0.04
        );
      }

      if (withFlowerBox) {
        pushTransformedGeo(
          terracottaBucket,
          boxUnit,
          _localMat,
          0,
          -winH * 0.5 - 0.16,
          0.14,
          0,
          0,
          0,
          winW + 0.08,
          0.18,
          0.2
        );
        pushTransformedGeo(
          ivyBucket,
          ivyPuffUnit,
          _localMat,
          -0.16,
          -winH * 0.5 - 0.02,
          0.16,
          0,
          0,
          0,
          0.65,
          0.55,
          0.55
        );
        pushTransformedGeo(
          ivyBucket,
          ivyPuffUnit,
          _localMat,
          0.16,
          -winH * 0.5 - 0.02,
          0.16,
          0,
          0.5,
          0,
          0.65,
          0.55,
          0.55
        );
      }
    };

    /**
     * Adds a glowing hanging vermilion-silk paper lantern (Chochin) on a timber bracket.
     */
    const addHangingLantern = (houseMat: THREE.Matrix4, lx: number, ly: number, lz: number) => {
      // Timber wall bracket & hanging cord
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, lx, ly + 0.24, lz - 0.1, 0, 0, 0, 0.05, 0.05, 0.28);
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, lx, ly + 0.16, lz, 0, 0, 0, 0.025, 0.14, 0.025);
      // Glowing silk lantern globe
      pushTransformedGeo(lanternSilkBucket, lanternGlobeUnit, houseMat, lx, ly, lz);
      // Top & bottom dark wood caps
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, lx, ly + 0.18, lz, 0, 0, 0, 0.16, 0.035, 0.16);
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, lx, ly - 0.18, lz, 0, 0, 0, 0.14, 0.035, 0.14);
      // Golden tassel
      pushTransformedGeo(goldOrnamentBucket, boxUnit, houseMat, lx, ly - 0.25, lz, 0, 0, 0, 0.035, 0.11, 0.035);
    };

    /**
     * Adds exposed roof eave rafter tails (taruki), gable timber king-post trusses,
     * and sculpted golden upturned ridge finials (shachihoko / oni-gawara) to a house roof!
     */
    const addRoofCarpentryDetails = (
      houseMat: THREE.Matrix4,
      w: number,
      h: number,
      d: number,
      ridgeH: number
    ) => {
      // 1. Main roof ridge beam + golden upturned end finials
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, 0, h + ridgeH, 0, 0, 0, 0, w + 0.68, 0.14, 0.17);
      for (const sx of [-1, 1]) {
        pushTransformedGeo(
          goldOrnamentBucket,
          boxUnit,
          houseMat,
          sx * (w * 0.5 + 0.34),
          h + ridgeH + 0.14,
          0,
          0,
          0,
          sx * -0.28,
          0.14,
          0.26,
          0.18
        );
        // Gable decorative king-post & collar beam timber framework on left/right gable faces
        const gx = sx * (w * 0.5 - 0.08);
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, gx, h + ridgeH * 0.48, 0, 0, 0, 0, 0.08, ridgeH * 0.85, 0.11);
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, gx, h + ridgeH * 0.28, 0, 0, 0, 0, 0.07, 0.09, d * 0.52);
      }

      // 2. Exposed timber rafter tails projecting under front and back eaves
      const rafterCount = 7;
      for (let i = 0; i < rafterCount; i++) {
        const rx = ((i / (rafterCount - 1)) - 0.5) * (w - 0.4);
        for (const sz of [-1, 1]) {
          pushTransformedGeo(
            inkTrimBucket,
            boxUnit,
            houseMat,
            rx,
            h - 0.02,
            sz * (d * 0.5 + 0.18),
            sz * 0.28,
            0,
            0,
            0.065,
            0.065,
            0.42
          );
        }
      }
    };

    /**
     * Adds a detailed wooden porch doorway with curved mini-gable canopy, carved cedar columns,
     * multi-paneled wooden door, brass handles, transom window, stone steps & flower pots.
     */
    const addDetailedEntryway = (
      houseMat: THREE.Matrix4,
      doorX: number,
      frontZ: number,
      withLantern = true
    ) => {
      // Sweeping tiled mini-gable porch canopy
      pushTransformedGeo(
        roofBucket,
        miniCanopyRoofGeo,
        houseMat,
        doorX,
        2.06,
        frontZ + 0.38,
        0,
        Math.PI * 0.5,
        0,
        1.04,
        1.02,
        1.05
      );
      // Twin carved cedar porch columns + stone base plinths
      for (const side of [-0.54, 0.54]) {
        pushTransformedGeo(
          cedarBucket,
          pillarUnit,
          houseMat,
          doorX + side,
          1.02,
          frontZ + 0.62,
          0,
          0,
          0,
          1,
          1.88,
          1
        );
        pushTransformedGeo(
          stoneBucket,
          boxUnit,
          houseMat,
          doorX + side,
          0.08,
          frontZ + 0.62,
          0,
          0,
          0,
          0.24,
          0.16,
          0.24
        );
      }
      // Porch overhead tie-beam
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, doorX, 1.92, frontZ + 0.62, 0, 0, 0, 1.24, 0.09, 0.1);

      // Door outer frame + glowing shoji transom light (ranma) above door
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, doorX, 1.02, frontZ + 0.03, 0, 0, 0, 1.12, 2.02, 0.1);
      pushTransformedGeo(doorBucket, boxUnit, houseMat, doorX, 0.9, frontZ + 0.06, 0, 0, 0, 0.96, 1.72, 0.11);
      pushTransformedGeo(shojiGlowBucket, boxUnit, houseMat, doorX, 1.86, frontZ + 0.06, 0, 0, 0, 0.92, 0.22, 0.09);

      // Door center seam, horizontal cross-rails & twin golden ring handles
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, doorX, 0.9, frontZ + 0.12, 0, 0, 0, 0.03, 1.72, 0.03);
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, doorX, 0.55, frontZ + 0.12, 0, 0, 0, 0.96, 0.04, 0.03);
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, doorX, 1.28, frontZ + 0.12, 0, 0, 0, 0.96, 0.04, 0.03);
      pushTransformedGeo(goldOrnamentBucket, boxUnit, houseMat, doorX - 0.09, 0.92, frontZ + 0.14, 0, 0, 0, 0.045, 0.09, 0.04);
      pushTransformedGeo(goldOrnamentBucket, boxUnit, houseMat, doorX + 0.09, 0.92, frontZ + 0.14, 0, 0, 0, 0.045, 0.09, 0.04);

      // 2 Stepped Stone Threshold Slabs
      pushTransformedGeo(stoneBucket, boxUnit, houseMat, doorX, 0.08, frontZ + 0.36, 0, 0, 0, 1.38, 0.14, 0.62);
      pushTransformedGeo(stoneBucket, boxUnit, houseMat, doorX, 0.03, frontZ + 0.72, 0, 0, 0, 1.18, 0.08, 0.36);

      if (withLantern) {
        addHangingLantern(houseMat, doorX + 0.68, 1.72, frontZ + 0.55);
      }
    };

    /**
     * Adds a second-story wooden balcony (engawa) with carved handrail and balusters.
     */
    const addWoodenBalcony = (
      houseMat: THREE.Matrix4,
      bx: number,
      by: number,
      bz: number,
      bw: number,
      bd = 0.58
    ) => {
      // Balcony floor deck & support brackets
      pushTransformedGeo(cedarBucket, boxUnit, houseMat, bx, by, bz + bd * 0.5, 0, 0, 0, bw, 0.1, bd);
      for (const sx of [-0.38, 0, 0.38]) {
        pushTransformedGeo(
          inkTrimBucket,
          boxUnit,
          houseMat,
          bx + sx * bw,
          by - 0.12,
          bz + bd * 0.42,
          0.35,
          0,
          0,
          0.08,
          0.16,
          bd * 0.85
        );
      }
      // Top handrail & bottom rail
      const railZ = bz + bd - 0.04;
      pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, bx, by + 0.48, railZ, 0, 0, 0, bw + 0.06, 0.055, 0.06);
      pushTransformedGeo(cedarBucket, boxUnit, houseMat, bx, by + 0.16, railZ, 0, 0, 0, bw, 0.04, 0.045);
      // Vertical balusters
      const postCount = 7;
      for (let i = 0; i < postCount; i++) {
        const px = bx + ((i / (postCount - 1)) - 0.5) * (bw - 0.08);
        pushTransformedGeo(cedarBucket, boxUnit, houseMat, px, by + 0.26, railZ, 0, 0, 0, 0.045, 0.44, 0.045);
      }
    };

    /**
     * Helper to add a complete curved-roof house with rich architectural details!
     */
    const addHouseEnsemble = (
      cx: number,
      cy: number,
      cz: number,
      yaw: number,
      style: 'center-hero' | 'left-cedar' | 'upper-lodge' | 'right-masonry' | 'city-variant',
      seed: number
    ) => {
      const houseMat = new THREE.Matrix4();
      houseMat.makeRotationY(yaw);
      houseMat.setPosition(cx, cy, cz);

      if (style === 'center-hero') {
        // ===================================================================
        // 1. CENTER WHITEWASHED HERO HOUSE (Upgraded with rich details!)
        // ===================================================================
        const w = 4.9;
        const h = 3.05;
        const d = 4.2;
        const frontZ = d * 0.5;

        // Bevelled stone foundation plinth
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, 0.16, 0, 0, 0, 0, w + 0.22, 0.32, d + 0.22);
        // Cream watercolor plaster main body
        pushTransformedGeo(plasterBucket, boxUnit, houseMat, 0, h * 0.5, 0, 0, 0, 0, w, h, d);
        // Gable wall infill tucked cleanly inside the curved roof
        pushTransformedGeo(
          plasterBucket,
          mainGableInfillGeo,
          houseMat,
          0,
          h - 0.06,
          0,
          0,
          0,
          0,
          (w - 0.25) / 4.4,
          0.84,
          (d - 0.3) / 4.1
        );
        // Sweeping dark-slate curved tiled roof
        pushTransformedGeo(
          roofBucket,
          mainRoofGeo,
          houseMat,
          0,
          h + 0.02,
          0,
          0,
          0,
          0,
          1.08,
          1.06,
          1.05
        );

        // Exposed eave rafters, gable trusses & golden ridge finials
        addRoofCarpentryDetails(houseMat, w, h, d, 1.62);

        // Sumi-e ink corner pillars & horizontal timber tie-beams
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) {
            pushTransformedGeo(
              inkTrimBucket,
              boxUnit,
              houseMat,
              sx * (w * 0.5),
              h * 0.5,
              sz * (d * 0.5),
              0,
              0,
              0,
              0.11,
              h,
              0.11
            );
          }
        }
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, 0, h - 0.06, 0, 0, 0, 0, w + 0.08, 0.1, d + 0.08);
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, 0, 0.34, 0, 0, 0, 0, w + 0.12, 0.08, d + 0.12);

        // Left Detailed Porch Entryway with Ivy & Flower Pots
        const leftDoorX = -1.18;
        addDetailedEntryway(houseMat, leftDoorX, frontZ, true);

        // Lush green ivy cascading over the left mini-gable canopy
        pushTransformedGeo(ivyBucket, ivyPuffUnit, houseMat, leftDoorX - 0.16, 2.22, frontZ + 0.54, 0, 0, 0, 1.35, 1.15, 1.1);
        pushTransformedGeo(ivyBucket, ivyPuffUnit, houseMat, leftDoorX + 0.18, 2.08, frontZ + 0.58, 0, 0.4, 0, 1.15, 1.2, 1.0);
        pushTransformedGeo(ivyBucket, ivyPuffUnit, houseMat, leftDoorX - 0.42, 1.98, frontZ + 0.46, 0, -0.3, 0, 0.92, 0.9, 0.9);

        // Terracotta flower pots at base of entryway
        pushTransformedGeo(terracottaBucket, potUnit, houseMat, leftDoorX - 0.72, 0.18, frontZ + 0.52);
        pushTransformedGeo(ivyBucket, ivyPuffUnit, houseMat, leftDoorX - 0.72, 0.42, frontZ + 0.52, 0, 0, 0, 0.75, 0.75, 0.75);

        // Right Projecting Tiled Mini-Gable Canopy + Detailed Glowing Shoji Window & Flower Box
        const rightWinX = 1.05;
        pushTransformedGeo(
          roofBucket,
          miniCanopyRoofGeo,
          houseMat,
          rightWinX,
          2.14,
          frontZ + 0.32,
          0,
          Math.PI * 0.5,
          0,
          0.98,
          0.95,
          0.98
        );
        addShojiWindow(houseMat, rightWinX, 1.28, frontZ, 0, 0.96, 1.05, true, true);

        // Side & Rear Facade Windows
        addShojiWindow(houseMat, w * 0.5, 1.45, 0, Math.PI * 0.5, 0.88, 0.95, true, true);
        addShojiWindow(houseMat, -w * 0.5, 1.45, 0, -Math.PI * 0.5, 0.88, 0.95, true, false);
        addShojiWindow(houseMat, 0, 1.45, -frontZ, Math.PI, 1.05, 0.95, true, true);
        return;
      }

      if (style === 'left-cedar') {
        // ===================================================================
        // 2. LEFT TWO-STORY CEDAR-TIMBER & RIVER-STONE HOUSE + STEPPED ARCHWAY
        // ===================================================================
        const w = 3.7;
        const lowerH = 1.35;
        const upperH = 1.95;
        const totalH = lowerH + upperH;
        const d = 3.9;
        const frontZ = d * 0.5;

        // Lower river-stone masonry base + bevelled plinth
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, 0.14, 0, 0, 0, 0, w + 0.2, 0.28, d + 0.2);
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, lowerH * 0.5, 0, 0, 0, 0, w, lowerH, d);
        // Upper warm ochre-cedar timber plank story
        pushTransformedGeo(
          cedarBucket,
          boxUnit,
          houseMat,
          0,
          lowerH + upperH * 0.5,
          0,
          0,
          0,
          0,
          w + 0.12,
          upperH,
          d + 0.12
        );
        // Horizontal cream plaster & dark timber band between stories
        pushTransformedGeo(plasterBucket, boxUnit, houseMat, 0, lowerH + 0.05, 0, 0, 0, 0, w + 0.18, 0.24, d + 0.18);
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, 0, lowerH + 0.18, 0, 0, 0, 0, w + 0.22, 0.08, d + 0.22);

        // Sweeping dark-slate tiled roof on top + carpentry details
        pushTransformedGeo(
          roofBucket,
          lodgeRoofGeo,
          houseMat,
          0,
          totalH + 0.02,
          0,
          0,
          0,
          0,
          0.94,
          0.98,
          1.04
        );
        addRoofCarpentryDetails(houseMat, w + 0.1, totalH, d + 0.1, 1.36);

        // Upper-story wooden balcony & glowing Shoji windows
        addWoodenBalcony(houseMat, 0, lowerH + 0.18, frontZ + 0.06, 2.35, 0.52);
        addShojiWindow(houseMat, -0.58, lowerH + 1.05, frontZ + 0.06, 0, 0.72, 0.88, false, false);
        addShojiWindow(houseMat, 0.58, lowerH + 1.05, frontZ + 0.06, 0, 0.72, 0.88, false, false);
        addShojiWindow(houseMat, -w * 0.5 - 0.06, lowerH + 1.02, 0, -Math.PI * 0.5, 0.84, 0.88, true, true);
        addHangingLantern(houseMat, -1.35, lowerH + 1.45, frontZ + 0.45);

        // Attached Whitewashed Arched Breezeway & 7 Stone Steps on its right side (+X)
        const archX = w * 0.5 + 1.02;
        pushTransformedGeo(plasterBucket, boxUnit, houseMat, archX, 1.72, -0.15, 0, 0, 0, 1.82, 2.75, 1.35);
        pushTransformedGeo(
          roofBucket,
          miniCanopyRoofGeo,
          houseMat,
          archX,
          3.12,
          -0.15,
          0,
          Math.PI * 0.5,
          0,
          1.25,
          1.05,
          1.45
        );
        // Recessed dark wooden door & glowing transom at top of steps
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, archX, 1.65, 0.48, 0, 0, 0, 0.96, 2.04, 0.14);
        pushTransformedGeo(doorBucket, boxUnit, houseMat, archX, 1.56, 0.52, 0, 0, 0, 0.8, 1.72, 0.12);
        pushTransformedGeo(shojiGlowBucket, boxUnit, houseMat, archX, 2.52, 0.52, 0, 0, 0, 0.78, 0.2, 0.12);
        addHangingLantern(houseMat, archX + 0.62, 2.35, 0.65);

        // 7 Ascending White-Grey Stone Steps + Low Stone Balustrades leading up to the arched doorway
        for (let s = 0; s < 7; s++) {
          pushTransformedGeo(
            stoneBucket,
            boxUnit,
            houseMat,
            archX,
            0.08 + s * 0.11,
            1.85 - s * 0.2,
            0,
            0,
            0,
            1.52,
            0.14,
            0.26
          );
        }
        return;
      }

      if (style === 'upper-lodge') {
        // ===================================================================
        // 3. UPPER-LEFT HILLSIDE TERRACED OCHRE LODGE ON HIGH STONE CLIFF WALL
        // ===================================================================
        const terraceH = 3.55;
        const w = 4.6;
        const h = 1.95;
        const d = 3.8;
        const frontZ = d * 0.5;

        // High whitewashed & river-stone retaining cliff terrace
        pushTransformedGeo(plasterBucket, boxUnit, houseMat, 0, terraceH * 0.5, 0.55, 0, 0, 0, w + 1.1, terraceH, d + 1.5);
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, terraceH - 0.38, 0.62, 0, 0, 0, w + 1.0, 0.76, d + 1.58);

        // Warm peach-ochre cedar timber upper lodge
        pushTransformedGeo(
          cedarBucket,
          boxUnit,
          houseMat,
          0,
          terraceH + h * 0.5,
          0,
          0,
          0,
          0,
          w,
          h,
          d
        );
        // Detailed Shoji windows & cliffside wooden balcony on upper lodge
        addWoodenBalcony(houseMat, 0, terraceH + 0.08, frontZ, 3.2, 0.56);
        addShojiWindow(houseMat, -0.85, terraceH + h * 0.54, frontZ, 0, 0.78, 0.86, true, false);
        addShojiWindow(houseMat, 0.85, terraceH + h * 0.54, frontZ, 0, 0.78, 0.86, true, false);
        addHangingLantern(houseMat, 0, terraceH + h * 0.82, frontZ + 0.45);

        // Sweeping curved slate-tiled gable roof + golden ridge finials
        pushTransformedGeo(
          roofBucket,
          lodgeRoofGeo,
          houseMat,
          0,
          terraceH + h + 0.02,
          0,
          0,
          0,
          0,
          1.06,
          0.96,
          1.04
        );
        addRoofCarpentryDetails(houseMat, w, terraceH + h, d, 1.34);
        return;
      }

      if (style === 'right-masonry') {
        // ===================================================================
        // 4. RIGHT HALF-TIMBERED & POLYGONAL STONE MASONRY COTTAGE
        // ===================================================================
        const w = 4.8;
        const lowerH = 2.15;
        const upperH = 0.82;
        const totalH = lowerH + upperH;
        const d = 4.1;
        const frontZ = d * 0.5;

        // Bevelled stone foundation plinth & lower polygonal river-stone masonry wall
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, 0.15, 0, 0, 0, 0, w + 0.22, 0.3, d + 0.22);
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, lowerH * 0.5, 0, 0, 0, 0, w, lowerH, d);
        // Upper cream plaster band with exposed dark-timber framing
        pushTransformedGeo(
          plasterBucket,
          boxUnit,
          houseMat,
          0,
          lowerH + upperH * 0.5,
          0,
          0,
          0,
          0,
          w + 0.06,
          upperH,
          d + 0.06
        );
        // Horizontal & vertical half-timber beams
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, 0, lowerH, 0, 0, 0, 0, w + 0.16, 0.12, d + 0.16);
        for (let b = -2; b <= 2; b++) {
          pushTransformedGeo(
            inkTrimBucket,
            boxUnit,
            houseMat,
            b * 0.95,
            lowerH + upperH * 0.5,
            frontZ + 0.04,
            0,
            0,
            0,
            0.09,
            upperH,
            0.08
          );
        }

        // Sweeping curved slate roof + carpentry & golden finials
        pushTransformedGeo(
          roofBucket,
          mainRoofGeo,
          houseMat,
          0,
          totalH + 0.02,
          0,
          0,
          0,
          0,
          1.06,
          1.08,
          1.04
        );
        addRoofCarpentryDetails(houseMat, w, totalH, d, 1.65);

        // Detailed entryway + front & side glowing lattice windows
        const doorX = 0.32;
        addDetailedEntryway(houseMat, doorX, frontZ, true);
        addShojiWindow(houseMat, -1.25, 1.25, frontZ, 0, 0.88, 0.95, true, true);
        addShojiWindow(houseMat, w * 0.5, 1.32, 0, Math.PI * 0.5, 0.88, 0.95, true, true);
        addShojiWindow(houseMat, -w * 0.5, 1.32, 0, -Math.PI * 0.5, 0.88, 0.95, true, false);

        pushTransformedGeo(terracottaBucket, potUnit, houseMat, doorX - 0.82, 0.16, frontZ + 0.45);
        pushTransformedGeo(terracottaBucket, potUnit, houseMat, doorX + 0.82, 0.16, frontZ + 0.45);
        pushTransformedGeo(ivyBucket, ivyPuffUnit, houseMat, doorX + 0.82, 0.38, frontZ + 0.45, 0, 0, 0, 0.72, 0.72, 0.72);
        return;
      }

      // =====================================================================
      // 5. UPGRADED CITY-WIDE SHANSHUI VILLAGE HOUSES & PAVILIONS (11x11 City)
      // Every house has stone foundations, corner posts, detailed shoji windows,
      // shutters, balconies, roof rafter tails, golden finials & paper lanterns!
      // =====================================================================
      const variant = Math.floor(pseudoRandom(seed * 13 + 1) * 4);
      const w = 4.3 + pseudoRandom(seed * 13 + 2) * 0.75;
      const d = 3.85 + pseudoRandom(seed * 13 + 3) * 0.65;
      const h = 2.85 + pseudoRandom(seed * 13 + 4) * 0.95;
      const fz = d * 0.5;

      // Sculpted stone foundation plinth & 4 corner timber pillars on every house
      pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, 0.15, 0, 0, 0, 0, w + 0.24, 0.3, d + 0.24);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          pushTransformedGeo(
            inkTrimBucket,
            boxUnit,
            houseMat,
            sx * (w * 0.5),
            h * 0.5,
            sz * (d * 0.5),
            0,
            0,
            0,
            0.1,
            h,
            0.1
          );
        }
      }

      if (variant === 0) {
        // Variant 0: Whitewashed Artisan House with Curved Slate Roof, Shutters & Flower Boxes
        pushTransformedGeo(plasterBucket, boxUnit, houseMat, 0, h * 0.5, 0, 0, 0, 0, w, h, d);
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, 0, h * 0.52, 0, 0, 0, 0, w + 0.06, 0.08, d + 0.06);
        pushTransformedGeo(
          plasterBucket,
          mainGableInfillGeo,
          houseMat,
          0,
          h - 0.06,
          0,
          0,
          0,
          0,
          (w - 0.25) / 4.4,
          0.82,
          (d - 0.25) / 4.1
        );
        pushTransformedGeo(
          roofBucket,
          mainRoofGeo,
          houseMat,
          0,
          h + 0.02,
          0,
          0,
          0,
          0,
          w / 4.7,
          1.0,
          d / 4.3
        );
        addRoofCarpentryDetails(houseMat, w, h, d, 1.56);
      } else if (variant === 1) {
        // Variant 1: Two-Story Stone Base + Cedar Timber Upper Lodge with Wooden Balcony
        const baseH = h * 0.46;
        const topH = h * 0.54;
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, baseH * 0.5, 0, 0, 0, 0, w, baseH, d);
        pushTransformedGeo(
          cedarBucket,
          boxUnit,
          houseMat,
          0,
          baseH + topH * 0.5,
          0,
          0,
          0,
          0,
          w + 0.1,
          topH,
          d + 0.1
        );
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, 0, baseH, 0, 0, 0, 0, w + 0.16, 0.1, d + 0.16);
        pushTransformedGeo(
          roofBucket,
          lodgeRoofGeo,
          houseMat,
          0,
          h + 0.02,
          0,
          0,
          0,
          0,
          w / 4.2,
          1.0,
          d / 3.7
        );
        addRoofCarpentryDetails(houseMat, w, h, d, 1.38);
        addWoodenBalcony(houseMat, 1.05, baseH + 0.05, fz + 0.05, 1.65, 0.48);
        addShojiWindow(houseMat, 1.05, baseH + topH * 0.52, fz + 0.05, 0, 0.74, 0.78, false, false);
      } else if (variant === 2) {
        // Variant 2: Half-Timbered & Fieldstone Cottage with Timber Framing Studs
        const lowerH = h * 0.62;
        const upperH = h * 0.38;
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, lowerH * 0.5, 0, 0, 0, 0, w, lowerH, d);
        pushTransformedGeo(
          plasterBucket,
          boxUnit,
          houseMat,
          0,
          lowerH + upperH * 0.5,
          0,
          0,
          0,
          0,
          w + 0.04,
          upperH,
          d + 0.04
        );
        pushTransformedGeo(inkTrimBucket, boxUnit, houseMat, 0, lowerH, 0, 0, 0, 0, w + 0.14, 0.1, d + 0.14);
        for (let s = -2; s <= 2; s++) {
          pushTransformedGeo(
            inkTrimBucket,
            boxUnit,
            houseMat,
            s * (w * 0.2),
            lowerH + upperH * 0.5,
            fz + 0.03,
            0,
            0,
            0,
            0.07,
            upperH,
            0.07
          );
        }
        pushTransformedGeo(
          roofBucket,
          mainRoofGeo,
          houseMat,
          0,
          h + 0.02,
          0,
          0,
          0,
          0,
          w / 4.7,
          1.02,
          d / 4.3
        );
        addRoofCarpentryDetails(houseMat, w, h, d, 1.58);
      } else {
        // Variant 3: Stepped Courtyard Tea Pavilion House with Wrap-Around Veranda
        const terraceH = 0.65;
        pushTransformedGeo(stoneBucket, boxUnit, houseMat, 0, terraceH * 0.5, 0, 0, 0, 0, w + 0.65, terraceH, d + 0.65);
        pushTransformedGeo(
          plasterBucket,
          boxUnit,
          houseMat,
          0,
          terraceH + h * 0.45,
          0,
          0,
          0,
          0,
          w,
          h * 0.9,
          d
        );
        pushTransformedGeo(
          roofBucket,
          lodgeRoofGeo,
          houseMat,
          0,
          terraceH + h * 0.9,
          0,
          0,
          0,
          0,
          w / 4.2,
          1.05,
          d / 3.7
        );
        addRoofCarpentryDetails(houseMat, w, terraceH + h * 0.9, d, 1.42);
      }

      // Detailed Front Porch Entryway (offset slightly left so right side has a big shoji window!)
      const doorX = -0.65;
      addDetailedEntryway(houseMat, doorX, fz, true);

      // Detailed Glowing Shoji Windows on Front, Left, Right, and Back Facades
      addShojiWindow(houseMat, 1.05, 1.24, fz, 0, 0.84, 0.9, true, true);
      addShojiWindow(houseMat, w * 0.5, 1.32, 0, Math.PI * 0.5, 0.82, 0.88, true, seed % 2 === 0);
      addShojiWindow(houseMat, -w * 0.5, 1.32, 0, -Math.PI * 0.5, 0.82, 0.88, true, seed % 2 === 1);
      addShojiWindow(houseMat, 0, 1.32, -fz, Math.PI, 0.92, 0.88, true, false);

      // Terracotta planter pots & greenery beside doorway
      pushTransformedGeo(terracottaBucket, potUnit, houseMat, doorX - 0.72, 0.16, fz + 0.44);
      pushTransformedGeo(ivyBucket, ivyPuffUnit, houseMat, doorX - 0.72, 0.38, fz + 0.44, 0, 0, 0, 0.72, 0.72, 0.72);
    };

    // Place the 4 Iconic Hero Reference Painting Houses around [row 4, col 4..6]
    const centerPlot = cellToWorld(4, 5);
    addHouseEnsemble(centerPlot.x - 0.15, 0, centerPlot.z + 1.35, 0, 'center-hero', 1);

    const leftPlot = cellToWorld(4, 4);
    addHouseEnsemble(leftPlot.x + 0.35, 0, leftPlot.z + 1.55, 0.05, 'left-cedar', 2);
    // Upper-left hillside ochre lodge perched high behind the left house & archway
    addHouseEnsemble(leftPlot.x + 1.35, 0, leftPlot.z - 3.15, 0.03, 'upper-lodge', 3);

    const rightPlot = cellToWorld(4, 6);
    addHouseEnsemble(rightPlot.x - 0.35, 0, rightPlot.z + 1.45, -0.04, 'right-masonry', 4);

    // Populate all other non-road building plots across the 11x11 city
    for (let r = 0; r < CITY_ROWS; r++) {
      for (let c = 0; c < CITY_COLS; c++) {
        if (isRoadCell(r, c)) continue;
        // Skip the hero backdrop plots and keep the central mountain vista corridor [r<=3, c=4..5] open!
        if (r === 4 && (c === 4 || c === 5 || c === 6)) continue;
        if (r <= 3 && (c === 4 || c === 5)) continue;

        const { x, z } = cellToWorld(r, c);
        const seed = r * 37 + c * 19;
        // Orient house toward nearest road neighbor
        let yaw = 0;
        if (isRoadCell(r + 1, c)) yaw = 0;
        else if (isRoadCell(r - 1, c)) yaw = Math.PI;
        else if (isRoadCell(r, c + 1)) yaw = Math.PI * 0.5;
        else if (isRoadCell(r, c - 1)) yaw = -Math.PI * 0.5;

        // Slight organic offset and rotation so the village feels hand-painted, never robotic
        const ox = (pseudoRandom(seed + 1) - 0.5) * 0.35;
        const oz = (pseudoRandom(seed + 2) - 0.5) * 0.35;
        const oyaw = yaw + (pseudoRandom(seed + 3) - 0.5) * 0.1;
        const hillElevation = r <= 2 ? (3 - r) * 0.65 : 0;

        if (hillElevation > 0) {
          pushTransformedGeo(
            stoneBucket,
            boxUnit,
            identity,
            x + ox,
            hillElevation * 0.5,
            z + oz,
            0,
            oyaw,
            0,
            5.4,
            hillElevation,
            5.0
          );
        }

        addHouseEnsemble(x + ox, hillElevation, z + oz, oyaw, 'city-variant', seed);
      }
    }

    boxUnit.dispose();
    potUnit.dispose();
    pillarUnit.dispose();
    lanternGlobeUnit.dispose();
    ivyPuffUnit.dispose();
    mainRoofGeo.dispose();
    mainGableInfillGeo.dispose();
    lodgeRoofGeo.dispose();
    miniCanopyRoofGeo.dispose();

    return {
      plasterGeo: mergeBufferGeometries(plasterBucket),
      roofGeo: mergeBufferGeometries(roofBucket),
      cedarGeo: mergeBufferGeometries(cedarBucket),
      stoneGeo: mergeBufferGeometries(stoneBucket),
      inkTrimGeo: mergeBufferGeometries(inkTrimBucket),
      doorGeo: mergeBufferGeometries(doorBucket),
      terracottaGeo: mergeBufferGeometries(terracottaBucket),
      ivyGeo: mergeBufferGeometries(ivyBucket),
      shojiGlowGeo: mergeBufferGeometries(shojiGlowBucket),
      lanternSilkGeo: mergeBufferGeometries(lanternSilkBucket),
      goldOrnamentGeo: mergeBufferGeometries(goldOrnamentBucket),
    };
  }, []);

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover('🏡 Detailed Shanshui House — Kumiko Lattice Windows, Curved Slate Roofs & Silk Lanterns');
      }}
      onPointerOut={() => onHover(null)}
    >
      <mesh
        geometry={batchedGeos.plasterGeo}
        material={materials.plaster}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.roofGeo}
        material={materials.roofSlate}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.cedarGeo}
        material={materials.cedarTimber}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.stoneGeo}
        material={materials.stoneMasonry}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedGeos.inkTrimGeo}
        material={materials.darkInkTrim}
        castShadow
      />
      <mesh
        geometry={batchedGeos.doorGeo}
        material={materials.woodDoor}
        castShadow
      />
      <mesh
        geometry={batchedGeos.terracottaGeo}
        material={materials.terracotta}
        castShadow
      />
      <mesh
        geometry={batchedGeos.ivyGeo}
        material={materials.ivyGreen}
        castShadow
      />
      <mesh
        geometry={batchedGeos.shojiGlowGeo}
        material={materials.shojiGlow}
      />
      <mesh
        geometry={batchedGeos.lanternSilkGeo}
        material={materials.lanternSilk}
      />
      <mesh
        geometry={batchedGeos.goldOrnamentGeo}
        material={materials.goldOrnament}
        castShadow
      />
    </group>
  );
}
