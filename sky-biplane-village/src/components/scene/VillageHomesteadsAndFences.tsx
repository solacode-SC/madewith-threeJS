import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SKY_MOOD_THEMES, type SkyMood } from '../../domain/skyConfig';
import {
  RIVER_BRIDGES,
  VILLAGE_HOMESTEADS,
  getRiverCenterX,
  getRiverHalfWidth,
  getRiverWaterY,
  getTerrainHeight,
  type HomesteadPlot,
  type RiverBridgeConfig,
  type RoofVariant,
} from '../../domain/villageLayout';
import {
  createBillowingTreeCanopyGeometry,
  createGableWallInfillGeometry,
  createInkOutlineGeometry,
  createPitchedCottageRoofGeometry,
  mergeBufferGeometries,
  pushBoxWithInkOutline,
  pushTransformedGeo,
} from '../../core/inkOutlineBatcher';
import { createHandPaintedRoadShaderMaterial } from '../../core/handDrawnShaders';
import {
  createBrickChimneyTextures,
  createHandDrawnRoofTextures,
  createTreeBarkBrushTextures,
  createWeatheredTimberWallTextures,
} from '../../core/handDrawnTextures';

interface VillageHomesteadsAndFencesProps {
  skyMood: SkyMood;
  onGroundClick: (point: THREE.Vector3) => void;
  onHover: (label: string | null) => void;
}

export default function VillageHomesteadsAndFences({
  skyMood,
  onGroundClick,
  onHover,
}: VillageHomesteadsAndFencesProps) {
  const waterwheelRef = useRef<THREE.Group>(null);
  const windmillSailsRef = useRef<THREE.Group>(null);
  const windmillEastSailsRef = useRef<THREE.Group>(null);
  const windsockRef = useRef<THREE.Group>(null);
  const chimneySmokeGroupRef = useRef<THREE.Group>(null);

  const wallTex = useMemo(() => createWeatheredTimberWallTextures(), []);
  const roofTealTex = useMemo(() => createHandDrawnRoofTextures('teal-slate'), []);
  const roofCedarTex = useMemo(() => createHandDrawnRoofTextures('cedar-umber'), []);
  const roofBlueTex = useMemo(() => createHandDrawnRoofTextures('blue-slate'), []);
  const roofMossTex = useMemo(() => createHandDrawnRoofTextures('moss-timber'), []);
  const brickTex = useMemo(() => createBrickChimneyTextures(), []);
  const barkTex = useMemo(() => createTreeBarkBrushTextures(), []);
  const walkwayShaderMat = useMemo(() => createHandPaintedRoadShaderMaterial(), []);

  const materials = useMemo(() => {
    return {
      timberWall: new THREE.MeshStandardMaterial({
        map: wallTex.map,
        bumpMap: wallTex.bumpMap,
        bumpScale: 0.038,
        roughness: 0.84,
      }),
      roofTeal: new THREE.MeshStandardMaterial({
        map: roofTealTex.map,
        bumpMap: roofTealTex.bumpMap,
        bumpScale: 0.045,
        roughness: 0.76,
      }),
      roofCedar: new THREE.MeshStandardMaterial({
        map: roofCedarTex.map,
        bumpMap: roofCedarTex.bumpMap,
        bumpScale: 0.045,
        roughness: 0.78,
      }),
      roofBlue: new THREE.MeshStandardMaterial({
        map: roofBlueTex.map,
        bumpMap: roofBlueTex.bumpMap,
        bumpScale: 0.045,
        roughness: 0.76,
      }),
      roofMoss: new THREE.MeshStandardMaterial({
        map: roofMossTex.map,
        bumpMap: roofMossTex.bumpMap,
        bumpScale: 0.045,
        roughness: 0.80,
      }),
      creamTrim: new THREE.MeshStandardMaterial({
        color: '#EFECE2',
        roughness: 0.78,
      }),
      brickChimney: new THREE.MeshStandardMaterial({
        map: brickTex.map,
        bumpMap: brickTex.bumpMap,
        bumpScale: 0.04,
        roughness: 0.82,
      }),
      stoneMasonry: new THREE.MeshStandardMaterial({
        map: brickTex.map,
        bumpMap: brickTex.bumpMap,
        bumpScale: 0.045,
        color: '#9BA29A',
        roughness: 0.86,
      }),
      vermilionWood: new THREE.MeshStandardMaterial({
        map: barkTex.map,
        color: '#C84B38',
        roughness: 0.72,
      }),
      hayGold: new THREE.MeshStandardMaterial({
        color: '#E5C158',
        roughness: 0.88,
      }),
      gardenGreen: new THREE.MeshStandardMaterial({
        color: '#4E9438',
        roughness: 0.84,
      }),
      fenceWood: new THREE.MeshStandardMaterial({
        map: barkTex.map,
        bumpMap: barkTex.bumpMap,
        bumpScale: 0.03,
        color: '#8E7862',
        roughness: 0.86,
      }),
      porchDeck: new THREE.MeshStandardMaterial({
        color: '#9E8268',
        roughness: 0.82,
      }),
      windowGlass: new THREE.MeshStandardMaterial({
        color: '#DCE8E4',
        emissive: '#FFCA78',
        emissiveIntensity: 0.25,
        roughness: 0.28,
      }),
      lanternBulb: new THREE.MeshStandardMaterial({
        color: '#FFF6D6',
        emissive: '#FFA834',
        emissiveIntensity: 0.4,
        roughness: 0.2,
      }),
      lanternHalo: new THREE.MeshBasicMaterial({
        color: '#FFB84D',
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      inkOutline: new THREE.MeshBasicMaterial({
        color: '#1E261E',
        side: THREE.BackSide,
      }),
      smokeWisp: new THREE.MeshBasicMaterial({
        color: '#F7F9F4',
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
      windsockOrange: new THREE.MeshStandardMaterial({
        color: '#E86838',
        roughness: 0.65,
      }),
    };
  }, [
    wallTex,
    roofTealTex,
    roofCedarTex,
    roofBlueTex,
    roofMossTex,
    brickTex,
    barkTex,
  ]);

  useEffect(() => {
    const theme = SKY_MOOD_THEMES[skyMood];
    materials.windowGlass.emissiveIntensity = theme.windowEmissiveIntensity;
    materials.lanternBulb.emissiveIntensity = theme.lanternEmissiveIntensity;
    materials.lanternHalo.opacity =
      skyMood === 'starry-night' ? 0.44 : skyMood === 'evening-sunset' ? 0.24 : 0.0;
    walkwayShaderMat.uniforms.uBrightness.value =
      skyMood === 'starry-night' ? 0.48 : skyMood === 'evening-sunset' ? 0.86 : 1.0;
  }, [skyMood, materials, walkwayShaderMat]);

  const { batchedGeos, chimneyWorldPositions } = useMemo(() => {
    const wallBucket: THREE.BufferGeometry[] = [];
    const roofBuckets: Record<RoofVariant, THREE.BufferGeometry[]> = {
      'teal-slate': [],
      'cedar-umber': [],
      'blue-slate': [],
      'moss-timber': [],
    };
    const creamTrimBucket: THREE.BufferGeometry[] = [];
    const brickBucket: THREE.BufferGeometry[] = [];
    const stoneBucket: THREE.BufferGeometry[] = [];
    const vermilionBucket: THREE.BufferGeometry[] = [];
    const hayBucket: THREE.BufferGeometry[] = [];
    const gardenGreenBucket: THREE.BufferGeometry[] = [];
    const fenceBucket: THREE.BufferGeometry[] = [];
    const porchBucket: THREE.BufferGeometry[] = [];
    const windowBucket: THREE.BufferGeometry[] = [];
    const lanternBulbBucket: THREE.BufferGeometry[] = [];
    const lanternHaloBucket: THREE.BufferGeometry[] = [];
    const walkwayBucket: THREE.BufferGeometry[] = [];
    const inkOutlineBucket: THREE.BufferGeometry[] = [];

    const chimneys: [number, number, number][] = [];

    const identity = new THREE.Matrix4();
    const boxUnit = new THREE.BoxGeometry(1, 1, 1);
    const walkwayPlaneUnit = new THREE.PlaneGeometry(1, 1, 4, 4);
    walkwayPlaneUnit.rotateX(-Math.PI * 0.5);
    const poleUnit = new THREE.CylinderGeometry(0.09, 0.12, 1, 8);
    const wellCylinderUnit = new THREE.CylinderGeometry(0.68, 0.72, 0.78, 10);
    const haystackUnit = createBillowingTreeCanopyGeometry(0.85, 0.72, 0.85, 31, 1);
    const haloSphereUnit = new THREE.SphereGeometry(0.85, 10, 8);

    const _houseMat = new THREE.Matrix4();
    const _pos = new THREE.Vector3();
    const _quat = new THREE.Quaternion();
    const _scale = new THREE.Vector3(1, 1, 1);
    const _euler = new THREE.Euler();

    const addLanternPost = (lx: number, ly: number, lz: number, postHeight = 2.45) => {
      pushBoxWithInkOutline(
        fenceBucket,
        inkOutlineBucket,
        boxUnit,
        identity,
        lx,
        ly + postHeight * 0.5,
        lz,
        0,
        0,
        0,
        0.11,
        postHeight,
        0.11,
        0.022
      );
      // Lantern cap
      pushBoxWithInkOutline(
        fenceBucket,
        inkOutlineBucket,
        boxUnit,
        identity,
        lx,
        ly + postHeight + 0.22,
        lz,
        0,
        0,
        0,
        0.34,
        0.08,
        0.34,
        0.02
      );
      // Glowing glass core
      pushTransformedGeo(
        lanternBulbBucket,
        boxUnit,
        identity,
        lx,
        ly + postHeight + 0.08,
        lz,
        0,
        0,
        0,
        0.22,
        0.24,
        0.22
      );
      // Soft volumetric light halo for Evening & Night modes
      pushTransformedGeo(
        lanternHaloBucket,
        haloSphereUnit,
        identity,
        lx,
        ly + postHeight + 0.08,
        lz,
        0,
        0,
        0,
        1.15,
        1.15,
        1.15
      );
    };

    const addRusticBuilding = (
      wx: number,
      wz: number,
      w: number,
      d: number,
      h: number,
      yaw: number,
      roofVariant: RoofVariant,
      isMainCottage: boolean,
      hasChimney: boolean
    ) => {
      const groundY = getTerrainHeight(wx, wz);
      _pos.set(wx, groundY, wz);
      _euler.set(0, yaw, 0, 'XYZ');
      _quat.setFromEuler(_euler);
      _scale.set(1, 1, 1);
      _houseMat.compose(_pos, _quat, _scale);

      // 1. Stone & Timber Foundation Plinth
      pushBoxWithInkOutline(
        stoneBucket,
        inkOutlineBucket,
        boxUnit,
        _houseMat,
        0,
        0.18,
        0,
        0,
        0,
        0,
        w + 0.18,
        0.44,
        d + 0.18,
        0.035
      );

      // 2. Main Weathered Timber Walls + Hand-Inked Outline
      pushBoxWithInkOutline(
        wallBucket,
        inkOutlineBucket,
        boxUnit,
        _houseMat,
        0,
        0.38 + h * 0.5,
        0,
        0,
        0,
        0,
        w,
        h,
        d,
        0.042
      );

      // 3. Gable Tympanum Wall Infill under the pitched roof
      const ridgeH = isMainCottage ? 1.55 : 1.05;
      const gableInfill = createGableWallInfillGeometry(w - 0.06, d - 0.06, ridgeH);
      pushTransformedGeo(
        wallBucket,
        gableInfill,
        _houseMat,
        0,
        0.38 + h,
        0,
        0,
        0,
        0,
        1,
        1,
        1
      );
      gableInfill.dispose();

      // 4. Pitched Shingle Roof + Hand-Inked Outline
      const roofW = w + 0.72;
      const roofD = d + 0.76;
      const roofGeo = createPitchedCottageRoofGeometry(roofW, roofD, ridgeH, 0.16);
      const roofOutlineGeo = createInkOutlineGeometry(roofGeo, 0.044);

      pushTransformedGeo(
        roofBuckets[roofVariant],
        roofGeo,
        _houseMat,
        0,
        0.36 + h,
        0,
        0,
        0,
        0,
        1,
        1,
        1
      );
      pushTransformedGeo(
        inkOutlineBucket,
        roofOutlineGeo,
        _houseMat,
        0,
        0.36 + h,
        0,
        0,
        0,
        0,
        1,
        1,
        1
      );
      roofGeo.dispose();
      roofOutlineGeo.dispose();

      // 5. White/Cream Painted Gable Bargeboard Trim & Ridge Cap
      const slopeLen = Math.hypot(roofD * 0.5, ridgeH) + 0.08;
      const slopeAngle = Math.atan2(ridgeH, roofD * 0.5);
      for (const gx of [-roofW * 0.5 + 0.05, roofW * 0.5 - 0.05]) {
        pushBoxWithInkOutline(
          creamTrimBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          gx,
          0.38 + h + ridgeH * 0.48,
          -roofD * 0.25,
          -slopeAngle,
          0,
          0,
          0.13,
          0.15,
          slopeLen,
          0.025
        );
        pushBoxWithInkOutline(
          creamTrimBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          gx,
          0.38 + h + ridgeH * 0.48,
          roofD * 0.25,
          slopeAngle,
          0,
          0,
          0.13,
          0.15,
          slopeLen,
          0.025
        );
      }
      pushBoxWithInkOutline(
        creamTrimBucket,
        inkOutlineBucket,
        boxUnit,
        _houseMat,
        0,
        0.42 + h + ridgeH,
        0,
        0,
        0,
        0,
        roofW + 0.06,
        0.14,
        0.20,
        0.028
      );

      // 6. Red-Brick Chimney
      if (hasChimney) {
        const chimLocalX = w * 0.22;
        const chimLocalZ = -d * 0.18;
        const chimTopY = 0.38 + h + ridgeH + 0.65;
        pushBoxWithInkOutline(
          brickBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          chimLocalX,
          0.38 + h + ridgeH * 0.55,
          chimLocalZ,
          0,
          0,
          0,
          0.56,
          1.65,
          0.56,
          0.035
        );
        pushBoxWithInkOutline(
          creamTrimBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          chimLocalX,
          chimTopY,
          chimLocalZ,
          0,
          0,
          0,
          0.66,
          0.12,
          0.66,
          0.028
        );

        const worldChim = new THREE.Vector3(chimLocalX, chimTopY + 0.18, chimLocalZ).applyMatrix4(
          _houseMat
        );
        chimneys.push([worldChim.x, worldChim.y, worldChim.z]);
      }

      // 7. Front Entrance Porch, Shutters, Flower Boxes, Door, Porch Lantern & Paned Windows
      if (isMainCottage) {
        const frontZ = d * 0.5;
        pushBoxWithInkOutline(
          porchBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          0,
          0.32,
          frontZ + 0.68,
          0,
          0,
          0,
          2.25,
          0.24,
          1.38,
          0.032
        );
        pushBoxWithInkOutline(
          porchBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          0,
          0.16,
          frontZ + 1.48,
          0,
          0,
          0,
          1.45,
          0.18,
          0.42,
          0.028
        );

        pushBoxWithInkOutline(
          roofBuckets[roofVariant],
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          0,
          0.38 + h * 0.76,
          frontZ + 0.68,
          0.26,
          0,
          0,
          2.42,
          0.12,
          1.52,
          0.03
        );
        for (const px of [-0.98, 0.98]) {
          pushBoxWithInkOutline(
            fenceBucket,
            inkOutlineBucket,
            boxUnit,
            _houseMat,
            px,
            0.38 + h * 0.36,
            frontZ + 1.22,
            0,
            0,
            0,
            0.12,
            h * 0.72,
            0.12,
            0.025
          );
        }

        // Warm Porch Entrance Lantern beside Front Door
        pushTransformedGeo(
          lanternBulbBucket,
          boxUnit,
          _houseMat,
          0.64,
          0.38 + 1.45,
          frontZ + 0.12,
          0,
          0,
          0,
          0.16,
          0.22,
          0.16
        );

        // Front Wooden Plank Door
        pushBoxWithInkOutline(
          porchBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          0,
          0.38 + 0.92,
          frontZ + 0.03,
          0,
          0,
          0,
          0.88,
          1.78,
          0.08,
          0.028
        );

        // Front Windows + Wooden Shutters + Window Flower Boxes
        for (const wxOff of [-w * 0.31, w * 0.31]) {
          pushBoxWithInkOutline(
            creamTrimBucket,
            inkOutlineBucket,
            boxUnit,
            _houseMat,
            wxOff,
            0.38 + h * 0.54,
            frontZ + 0.02,
            0,
            0,
            0,
            0.84,
            0.88,
            0.08,
            0.026
          );
          pushTransformedGeo(
            windowBucket,
            boxUnit,
            _houseMat,
            wxOff,
            0.38 + h * 0.54,
            frontZ + 0.04,
            0,
            0,
            0,
            0.68,
            0.72,
            0.06
          );
          // Left & Right Louvered Window Shutters
          for (const shSign of [-1, 1]) {
            pushBoxWithInkOutline(
              roofBuckets[roofVariant],
              inkOutlineBucket,
              boxUnit,
              _houseMat,
              wxOff + shSign * 0.52,
              0.38 + h * 0.54,
              frontZ + 0.04,
              0,
              0,
              0,
              0.18,
              0.84,
              0.05,
              0.018
            );
          }
          // Window Flower Box & Red/Orange Blooms
          pushBoxWithInkOutline(
            porchBucket,
            inkOutlineBucket,
            boxUnit,
            _houseMat,
            wxOff,
            0.38 + h * 0.54 - 0.50,
            frontZ + 0.14,
            0,
            0,
            0,
            0.86,
            0.16,
            0.22,
            0.02
          );
          pushTransformedGeo(
            vermilionBucket,
            boxUnit,
            _houseMat,
            wxOff,
            0.38 + h * 0.54 - 0.38,
            frontZ + 0.14,
            0,
            0,
            0,
            0.74,
            0.12,
            0.16
          );
        }

        // Side Windows + Attic Gable Windows + Stacked Firewood Pile
        for (const sideSign of [-1, 1]) {
          const sxPos = sideSign * (w * 0.5 + 0.02);
          for (const szOff of [-d * 0.22, d * 0.22]) {
            pushBoxWithInkOutline(
              creamTrimBucket,
              inkOutlineBucket,
              boxUnit,
              _houseMat,
              sxPos,
              0.38 + h * 0.54,
              szOff,
              0,
              0,
              0,
              0.08,
              0.84,
              0.78,
              0.026
            );
            pushTransformedGeo(
              windowBucket,
              boxUnit,
              _houseMat,
              sxPos + sideSign * 0.02,
              0.38 + h * 0.54,
              szOff,
              0,
              0,
              0,
              0.06,
              0.68,
              0.62
            );
          }
          pushBoxWithInkOutline(
            creamTrimBucket,
            inkOutlineBucket,
            boxUnit,
            _houseMat,
            sxPos,
            0.38 + h + ridgeH * 0.42,
            0,
            0,
            0,
            0,
            0.08,
            0.52,
            0.52,
            0.024
          );
          pushTransformedGeo(
            windowBucket,
            boxUnit,
            _houseMat,
            sxPos + sideSign * 0.02,
            0.38 + h + ridgeH * 0.42,
            0,
            0,
            0,
            0,
            0.06,
            0.38,
            0.38
          );
        }

        // Stacked Firewood Pile under the Back-Side Eaves
        pushBoxWithInkOutline(
          fenceBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          w * 0.5 + 0.32,
          0.42,
          0,
          0,
          0,
          0,
          0.48,
          0.62,
          1.45,
          0.024
        );
      } else {
        pushBoxWithInkOutline(
          porchBucket,
          inkOutlineBucket,
          boxUnit,
          _houseMat,
          0,
          0.38 + h * 0.45,
          d * 0.5 + 0.03,
          0,
          0,
          0,
          1.25,
          h * 0.82,
          0.08,
          0.028
        );
      }
    };

    const addHomesteadFenceAndGate = (plot: HomesteadPlot, plotIdx: number) => {
      const halfW = plot.plotWidth * 0.5;
      const halfD = plot.plotDepth * 0.5;
      const cx = plot.centerX;
      const cz = plot.centerZ;
      const postSpacing = 2.6;

      const addFenceSegment = (
        x1: number,
        z1: number,
        x2: number,
        z2: number,
        hasGateGap: boolean
      ) => {
        const totalLen = Math.hypot(x2 - x1, z2 - z1);
        const steps = Math.max(2, Math.round(totalLen / postSpacing));
        const dx = (x2 - x1) / steps;
        const dz = (z2 - z1) / steps;
        const segLen = Math.hypot(dx, dz);
        const segYaw = Math.atan2(dx, dz);

        for (let s = 0; s <= steps; s++) {
          const px = x1 + dx * s;
          const pz = z1 + dz * s;
          const py = getTerrainHeight(px, pz);

          const midStep = Math.floor(steps * 0.5);
          const isGateBay = hasGateGap && s === midStep;

          pushBoxWithInkOutline(
            fenceBucket,
            inkOutlineBucket,
            boxUnit,
            identity,
            px,
            py + 0.52,
            pz,
            0,
            segYaw,
            0,
            0.14,
            1.08,
            0.14,
            0.026
          );

          if (s < steps && !isGateBay) {
            const mx = px + dx * 0.5;
            const mz = pz + dz * 0.5;
            const my1 = getTerrainHeight(px, pz);
            const my2 = getTerrainHeight(px + dx, pz + dz);
            const my = (my1 + my2) * 0.5;
            const pitchSlope = -Math.atan2(my2 - my1, segLen);

            pushBoxWithInkOutline(
              fenceBucket,
              inkOutlineBucket,
              boxUnit,
              identity,
              mx,
              my + 0.78,
              mz,
              pitchSlope,
              segYaw,
              0,
              0.08,
              0.09,
              segLen + 0.04,
              0.024
            );
            pushBoxWithInkOutline(
              fenceBucket,
              inkOutlineBucket,
              boxUnit,
              identity,
              mx,
              my + 0.38,
              mz,
              pitchSlope,
              segYaw,
              0,
              0.08,
              0.09,
              segLen + 0.04,
              0.024
            );
          }
        }
      };

      addFenceSegment(cx - halfW, cz - halfD, cx + halfW, cz - halfD, plot.gateSide === 'north');
      addFenceSegment(cx - halfW, cz + halfD, cx + halfW, cz + halfD, plot.gateSide === 'south');
      addFenceSegment(cx - halfW, cz - halfD, cx - halfW, cz + halfD, plot.gateSide === 'west');
      addFenceSegment(cx + halfW, cz - halfD, cx + halfW, cz + halfD, plot.gateSide === 'east');

      // Sandy Courtyard Walkway from Gate to Cottage Porch
      const houseX = cx + plot.cottageOffsetX;
      const houseZ = cz + plot.cottageOffsetZ;
      let gateX = cx;
      let gateZ = cz;
      if (plot.gateSide === 'west') gateX = cx - halfW - 1.5;
      if (plot.gateSide === 'east') gateX = cx + halfW + 1.5;
      if (plot.gateSide === 'north') gateZ = cz - halfD - 1.5;
      if (plot.gateSide === 'south') gateZ = cz + halfD + 1.5;

      const pathLen = Math.hypot(houseX - gateX, houseZ - gateZ);
      const pathYaw = Math.atan2(houseX - gateX, houseZ - gateZ);
      const midX = (houseX + gateX) * 0.5;
      const midZ = (houseZ + gateZ) * 0.5;
      const midY = getTerrainHeight(midX, midZ) + 0.06;
      pushTransformedGeo(
        walkwayBucket,
        walkwayPlaneUnit,
        identity,
        midX,
        midY,
        midZ,
        0,
        pathYaw,
        0,
        2.35,
        1,
        pathLen
      );

      // Gate Street Lantern Post at every Homestead Entrance
      const lanternX = gateX + (plot.gateSide === 'north' || plot.gateSide === 'south' ? 1.6 : 0);
      const lanternZ = gateZ + (plot.gateSide === 'east' || plot.gateSide === 'west' ? 1.6 : 0);
      addLanternPost(lanternX, getTerrainHeight(lanternX, lanternZ), lanternZ, 2.35);

      // Detailed Yard Props inside each Homestead Plot:
      // A) Stone Water Well with Roof (every 3rd plot)
      if (plotIdx % 3 === 0) {
        const wellX = cx + (plot.cottageOffsetX > 0 ? -4.2 : 4.2);
        const wellZ = cz + (plot.cottageOffsetZ > 0 ? -3.6 : 3.6);
        const wellY = getTerrainHeight(wellX, wellZ);
        pushTransformedGeo(
          stoneBucket,
          wellCylinderUnit,
          identity,
          wellX,
          wellY + 0.38,
          wellZ,
          0,
          0,
          0,
          1,
          1,
          1
        );
        for (const wxSign of [-0.55, 0.55]) {
          pushBoxWithInkOutline(
            fenceBucket,
            inkOutlineBucket,
            boxUnit,
            identity,
            wellX + wxSign,
            wellY + 1.15,
            wellZ,
            0,
            0,
            0,
            0.10,
            1.1,
            0.10,
            0.02
          );
        }
        pushBoxWithInkOutline(
          roofBuckets[plot.roofVariant],
          inkOutlineBucket,
          boxUnit,
          identity,
          wellX,
          wellY + 1.75,
          wellZ,
          0.35,
          0,
          0,
          1.55,
          0.14,
          1.45,
          0.024
        );
      }

      // B) Raised Vegetable & Flower Garden Patch (every even plot)
      if (plotIdx % 2 === 0) {
        const garX = cx + (plot.cottageOffsetX > 0 ? -4.4 : 4.4);
        const garZ = cz + (plot.cottageOffsetZ > 0 ? 3.2 : -3.2);
        const garY = getTerrainHeight(garX, garZ);
        pushBoxWithInkOutline(
          fenceBucket,
          inkOutlineBucket,
          boxUnit,
          identity,
          garX,
          garY + 0.12,
          garZ,
          0,
          0,
          0,
          3.4,
          0.22,
          2.4,
          0.022
        );
        for (const rowZ of [-0.65, 0, 0.65]) {
          pushBoxWithInkOutline(
            gardenGreenBucket,
            inkOutlineBucket,
            boxUnit,
            identity,
            garX,
            garY + 0.28,
            garZ + rowZ,
            0,
            0,
            0,
            2.9,
            0.22,
            0.38,
            0.02
          );
        }
      } else {
        // C) Golden Pastoral Haystacks in odd plots
        const hayX = cx + (plot.cottageOffsetX > 0 ? -4.5 : 4.5);
        const hayZ = cz + (plot.cottageOffsetZ > 0 ? 3.0 : -3.0);
        const hayY = getTerrainHeight(hayX, hayZ);
        pushTransformedGeo(
          hayBucket,
          haystackUnit,
          identity,
          hayX,
          hayY + 0.52,
          hayZ,
          0,
          plotIdx,
          0,
          1.2,
          1.35,
          1.2
        );
        pushTransformedGeo(
          hayBucket,
          haystackUnit,
          identity,
          hayX + 1.35,
          hayY + 0.38,
          hayZ + 0.6,
          0,
          plotIdx + 1,
          0,
          0.85,
          0.95,
          0.85
        );
      }

      if (plot.hasUtilityPole) {
        const poleX = plot.gateSide === 'east' ? cx + halfW + 0.8 : cx - halfW - 0.8;
        const poleZ = cz - halfD + 1.2;
        const poleY = getTerrainHeight(poleX, poleZ);
        pushTransformedGeo(
          fenceBucket,
          poleUnit,
          identity,
          poleX,
          poleY + 3.4,
          poleZ,
          0,
          0,
          0,
          1,
          6.8,
          1
        );
        pushBoxWithInkOutline(
          fenceBucket,
          inkOutlineBucket,
          boxUnit,
          identity,
          poleX,
          poleY + 6.3,
          poleZ,
          0,
          0,
          0,
          1.45,
          0.12,
          0.12,
          0.025
        );
      }
    };

    // Build all 32 Detailed Homestead Plots
    VILLAGE_HOMESTEADS.forEach((plot, idx) => {
      addRusticBuilding(
        plot.centerX + plot.cottageOffsetX,
        plot.centerZ + plot.cottageOffsetZ,
        plot.cottageWidth,
        plot.cottageDepth,
        plot.cottageHeight,
        plot.cottageYaw,
        plot.roofVariant,
        true,
        plot.hasChimney
      );

      if (plot.hasShed) {
        addRusticBuilding(
          plot.centerX + plot.shedOffsetX,
          plot.centerZ + plot.shedOffsetZ,
          3.6,
          3.1,
          2.15,
          plot.shedYaw,
          plot.shedRoofVariant,
          false,
          false
        );
      }

      addHomesteadFenceAndGate(plot, idx);
    });

    // =========================================================================
    // BUILD 4 ICONIC ARCHED RIVER BRIDGES WITH STONE PIERS & GLOWING LANTERNS
    // =========================================================================
    const addArchedRiverBridge = (b: RiverBridgeConfig) => {
      const cx = getRiverCenterX(b.z);
      const halfSpan = b.span * 0.5;
      const halfW = b.width * 0.5;
      const abutmentY = Math.max(
        getTerrainHeight(cx - halfSpan, b.z),
        getTerrainHeight(cx + halfSpan, b.z)
      );
      const waterY = getRiverWaterY(b.z);

      const railBucket =
        b.style === 'vermilion-watermill'
          ? vermilionBucket
          : b.style === 'stone-arch'
            ? stoneBucket
            : fenceBucket;

      // 1. West & East Stone Bridge Abutment Ramp Piers
      for (const sideSign of [-1, 1]) {
        const ax = cx + sideSign * (halfSpan + 0.5);
        pushBoxWithInkOutline(
          stoneBucket,
          inkOutlineBucket,
          boxUnit,
          identity,
          ax,
          abutmentY - 0.35,
          b.z,
          0,
          0,
          0,
          2.2,
          1.35,
          b.width + 0.55,
          0.035
        );
      }

      // 2. Twin Mid-River Stone Arch Support Pillars standing in the water
      for (const pierFrac of [-0.38, 0.38]) {
        const px = cx + pierFrac * halfSpan;
        const deckY = abutmentY + 0.22 + Math.cos(pierFrac * Math.PI * 0.5) * b.archHeight;
        const pierH = Math.max(1.2, deckY - (waterY - 0.6));
        const pierCenterY = deckY - pierH * 0.5;
        pushBoxWithInkOutline(
          stoneBucket,
          inkOutlineBucket,
          boxUnit,
          identity,
          px,
          pierCenterY,
          b.z,
          0,
          0,
          0,
          0.88,
          pierH,
          b.width + 0.35,
          0.032
        );
      }

      // 3. Smooth Arched Bridge Deck Segments + Handrails + Lantern Posts
      const archSegs = 12;

      for (let i = 0; i < archSegs; i++) {
        const u0 = -1 + (i / archSegs) * 2;
        const u1 = -1 + ((i + 1) / archSegs) * 2;
        const uMid = (u0 + u1) * 0.5;

        const x0 = cx + u0 * halfSpan;
        const x1 = cx + u1 * halfSpan;
        const xMid = (x0 + x1) * 0.5;

        const y0 = abutmentY + 0.22 + Math.cos(u0 * Math.PI * 0.5) * b.archHeight;
        const y1 = abutmentY + 0.22 + Math.cos(u1 * Math.PI * 0.5) * b.archHeight;
        const yMid = (y0 + y1) * 0.5;

        const slopeZ = Math.atan2(y1 - y0, x1 - x0);
        const actualSegLen = Math.hypot(x1 - x0, y1 - y0) + 0.08;

        // Main Arched Timber Plank Deck
        pushBoxWithInkOutline(
          porchBucket,
          inkOutlineBucket,
          boxUnit,
          identity,
          xMid,
          yMid,
          b.z,
          0,
          0,
          slopeZ,
          actualSegLen,
          0.26,
          b.width,
          0.032
        );

        // Side Parapet / Handrails along both sides of the bridge
        for (const zSign of [-1, 1]) {
          const rz = b.z + zSign * (halfW - 0.14);

          if (b.style === 'stone-arch') {
            pushBoxWithInkOutline(
              stoneBucket,
              inkOutlineBucket,
              boxUnit,
              identity,
              xMid,
              yMid + 0.48,
              rz,
              0,
              0,
              slopeZ,
              actualSegLen,
              0.72,
              0.28,
              0.028
            );
            pushBoxWithInkOutline(
              creamTrimBucket,
              inkOutlineBucket,
              boxUnit,
              identity,
              xMid,
              yMid + 0.88,
              rz,
              0,
              0,
              slopeZ,
              actualSegLen + 0.04,
              0.12,
              0.34,
              0.022
            );
          } else {
            // Top & Mid Handrails
            pushBoxWithInkOutline(
              railBucket,
              inkOutlineBucket,
              boxUnit,
              identity,
              xMid,
              yMid + 0.92,
              rz,
              0,
              0,
              slopeZ,
              actualSegLen,
              0.12,
              0.14,
              0.025
            );
            pushBoxWithInkOutline(
              railBucket,
              inkOutlineBucket,
              boxUnit,
              identity,
              xMid,
              yMid + 0.50,
              rz,
              0,
              0,
              slopeZ,
              actualSegLen,
              0.09,
              0.10,
              0.022
            );

            // Overhead Truss Cross-Arch on Northern Timber Truss Bridge
            if (b.style === 'timber-truss' && Math.abs(uMid) < 0.72) {
              pushBoxWithInkOutline(
                fenceBucket,
                inkOutlineBucket,
                boxUnit,
                identity,
                xMid,
                yMid + 2.85,
                rz,
                0,
                0,
                slopeZ,
                actualSegLen,
                0.16,
                0.16,
                0.025
              );
            }
          }
        }
      }

      // Vertical Bridge Posts & Glowing Bridge Lanterns along the span
      const postCount = 6;
      for (let p = 0; p <= postCount; p++) {
        const u = -1 + (p / postCount) * 2;
        const px = cx + u * halfSpan;
        const py = abutmentY + 0.22 + Math.cos(u * Math.PI * 0.5) * b.archHeight;

        for (const zSign of [-1, 1]) {
          const pz = b.z + zSign * (halfW - 0.14);
          const postH = b.style === 'timber-truss' && Math.abs(u) < 0.72 ? 2.9 : 1.15;

          pushBoxWithInkOutline(
            railBucket,
            inkOutlineBucket,
            boxUnit,
            identity,
            px,
            py + postH * 0.5,
            pz,
            0,
            0,
            0,
            0.18,
            postH,
            0.18,
            0.025
          );

          // Glowing Bridge Lanterns on Entrance, Quarter, and Crown Posts
          if (p === 0 || p === 2 || p === 4 || p === 6) {
            const lanternY = py + 1.48;
            pushBoxWithInkOutline(
              railBucket,
              inkOutlineBucket,
              boxUnit,
              identity,
              px,
              py + 1.22,
              pz,
              0,
              0,
              0,
              0.12,
              0.42,
              0.12,
              0.02
            );
            pushTransformedGeo(
              lanternBulbBucket,
              boxUnit,
              identity,
              px,
              lanternY,
              pz,
              0,
              0,
              0,
              0.24,
              0.28,
              0.24
            );
            pushTransformedGeo(
              lanternHaloBucket,
              haloSphereUnit,
              identity,
              px,
              lanternY,
              pz,
              0,
              0,
              0,
              1.35,
              1.35,
              1.35
            );
          }
        }

        // Overhead Cross-Portal Beams on the Timber Truss Bridge
        if (b.style === 'timber-truss' && Math.abs(u) < 0.72) {
          pushBoxWithInkOutline(
            fenceBucket,
            inkOutlineBucket,
            boxUnit,
            identity,
            px,
            py + 2.88,
            b.z,
            0,
            0,
            0,
            0.18,
            0.18,
            b.width,
            0.025
          );
        }
      }
    };

    for (const bridge of RIVER_BRIDGES) {
      addArchedRiverBridge(bridge);
    }

    // Special Landmark Buildings:
    // 1. Brookside Timber Watermill on the West Bank of the River at z = 8.0
    const millX = getRiverCenterX(8.0) - getRiverHalfWidth(8.0) - 3.2;
    addRusticBuilding(millX, 8.0, 5.4, 4.6, 3.0, Math.PI * 0.5, 'cedar-umber', true, true);

    // 2. Western Gouache Hilltop Windmill Tower at (-48, -28)
    addRusticBuilding(-48.0, -28.0, 4.6, 4.6, 5.0, 0.3, 'teal-slate', false, false);

    // 3. Eastern Sunrise Hilltop Windmill Tower at (105, 32)
    addRusticBuilding(105.0, 32.0, 4.6, 4.6, 5.0, -0.35, 'cedar-umber', false, false);

    // 4. Meadow Airstrip Aviator Hangar at (-36, 32)
    addRusticBuilding(-36.0, 32.0, 6.6, 5.4, 3.2, 0.4, 'blue-slate', false, false);

    // 5. Riverside Boathouse & Wooden Fishing Dock at z = 34.0
    const dockX = getRiverCenterX(34.0) - getRiverHalfWidth(34.0) - 1.8;
    addRusticBuilding(dockX - 2.4, 34.0, 4.2, 3.6, 2.4, Math.PI * 0.5, 'moss-timber', false, false);
    const dockWaterY = getRiverWaterY(34.0);
    pushBoxWithInkOutline(
      porchBucket,
      inkOutlineBucket,
      boxUnit,
      identity,
      dockX + 1.8,
      dockWaterY + 0.32,
      34.0,
      0,
      0,
      0,
      4.2,
      0.18,
      2.2,
      0.028
    );

    boxUnit.dispose();
    walkwayPlaneUnit.dispose();
    poleUnit.dispose();
    wellCylinderUnit.dispose();
    haystackUnit.dispose();
    haloSphereUnit.dispose();

    return {
      batchedGeos: {
        wall: mergeBufferGeometries(wallBucket),
        roofTeal: mergeBufferGeometries(roofBuckets['teal-slate']),
        roofCedar: mergeBufferGeometries(roofBuckets['cedar-umber']),
        roofBlue: mergeBufferGeometries(roofBuckets['blue-slate']),
        roofMoss: mergeBufferGeometries(roofBuckets['moss-timber']),
        creamTrim: mergeBufferGeometries(creamTrimBucket),
        brick: mergeBufferGeometries(brickBucket),
        stone: mergeBufferGeometries(stoneBucket),
        vermilion: mergeBufferGeometries(vermilionBucket),
        hay: mergeBufferGeometries(hayBucket),
        gardenGreen: mergeBufferGeometries(gardenGreenBucket),
        fence: mergeBufferGeometries(fenceBucket),
        porch: mergeBufferGeometries(porchBucket),
        window: mergeBufferGeometries(windowBucket),
        lanternBulb: mergeBufferGeometries(lanternBulbBucket),
        lanternHalo: mergeBufferGeometries(lanternHaloBucket),
        walkway: mergeBufferGeometries(walkwayBucket),
        inkOutline: mergeBufferGeometries(inkOutlineBucket),
      },
      chimneyWorldPositions: chimneys,
    };
  }, []);

  const smokePuffGeo = useMemo(
    () => createBillowingTreeCanopyGeometry(0.24, 0.20, 0.24, 42, 2),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (waterwheelRef.current) {
      waterwheelRef.current.rotation.x += delta * 1.15;
    }
    if (windmillSailsRef.current) {
      windmillSailsRef.current.rotation.z -= delta * 1.05;
    }
    if (windmillEastSailsRef.current) {
      windmillEastSailsRef.current.rotation.z -= delta * 0.95;
    }
    if (windsockRef.current) {
      windsockRef.current.rotation.y = Math.sin(t * 2.6) * 0.22;
      windsockRef.current.rotation.z = Math.cos(t * 3.4) * 0.12;
    }
    if (chimneySmokeGroupRef.current) {
      const children = chimneySmokeGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const puffGroup = children[i];
        const phase = (t * 0.45 + i * 0.37) % 1.0;
        puffGroup.position.y = phase * 3.2;
        puffGroup.position.x = Math.sin(t * 1.2 + i) * phase * 0.55;
        const s = 0.65 + phase * 1.35;
        puffGroup.scale.set(s, s, s);
      }
    }
  });

  const waterwheelPos = useMemo(() => {
    const wx = getRiverCenterX(8.0) - getRiverHalfWidth(8.0) + 0.15;
    const wy = getRiverWaterY(8.0) + 1.25;
    return [wx, wy, 8.0] as [number, number, number];
  }, []);

  const windmillGroundY = useMemo(() => getTerrainHeight(-48.0, -28.0), []);
  const windmillEastGroundY = useMemo(() => getTerrainHeight(105.0, 32.0), []);
  const airstripGroundY = useMemo(() => getTerrainHeight(-31.5, 29.5), []);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onGroundClick(e.point);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover('Village Homestead & River Bridges • Click to bank & fly over');
      }}
      onPointerOut={() => onHover(null)}
    >
      <mesh geometry={batchedGeos.wall} material={materials.timberWall} castShadow receiveShadow />
      <mesh geometry={batchedGeos.roofTeal} material={materials.roofTeal} castShadow receiveShadow />
      <mesh geometry={batchedGeos.roofCedar} material={materials.roofCedar} castShadow receiveShadow />
      <mesh geometry={batchedGeos.roofBlue} material={materials.roofBlue} castShadow receiveShadow />
      <mesh geometry={batchedGeos.roofMoss} material={materials.roofMoss} castShadow receiveShadow />
      <mesh geometry={batchedGeos.creamTrim} material={materials.creamTrim} castShadow />
      <mesh geometry={batchedGeos.brick} material={materials.brickChimney} castShadow />
      <mesh geometry={batchedGeos.stone} material={materials.stoneMasonry} castShadow receiveShadow />
      <mesh geometry={batchedGeos.vermilion} material={materials.vermilionWood} castShadow />
      <mesh geometry={batchedGeos.hay} material={materials.hayGold} castShadow />
      <mesh geometry={batchedGeos.gardenGreen} material={materials.gardenGreen} castShadow />
      <mesh geometry={batchedGeos.fence} material={materials.fenceWood} castShadow receiveShadow />
      <mesh geometry={batchedGeos.porch} material={materials.porchDeck} castShadow receiveShadow />
      <mesh geometry={batchedGeos.window} material={materials.windowGlass} />
      <mesh geometry={batchedGeos.lanternBulb} material={materials.lanternBulb} />
      <mesh geometry={batchedGeos.lanternHalo} material={materials.lanternHalo} />
      <mesh geometry={batchedGeos.walkway} material={walkwayShaderMat} />

      <mesh geometry={batchedGeos.inkOutline} material={materials.inkOutline} />

      {/* Rising Chimney Smoke Puffs */}
      <group ref={chimneySmokeGroupRef}>
        {chimneyWorldPositions.flatMap(([cx, cy, cz], idx) =>
          [0, 1, 2].map((puffIdx) => (
            <group key={`smoke-${idx}-${puffIdx}`} position={[cx, cy, cz]}>
              <mesh
                position={[0, puffIdx * 0.9, 0]}
                geometry={smokePuffGeo}
                material={materials.smokeWisp}
              />
            </group>
          ))
        )}
      </group>

      {/* Turning River Waterwheel at the Brookside Watermill */}
      <group position={waterwheelPos}>
        <group ref={waterwheelRef}>
          <mesh rotation={[0, 0, Math.PI * 0.5]} material={materials.porchDeck} castShadow>
            <cylinderGeometry args={[1.65, 1.65, 0.52, 18]} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <mesh
              key={`spoke-${k}`}
              rotation={[(k * Math.PI) / 6, 0, 0]}
              material={materials.creamTrim}
            >
              <boxGeometry args={[0.58, 3.5, 0.16]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Western Hilltop Windmill Sails */}
      <group position={[-48.0, windmillGroundY + 4.6, -25.4]} rotation={[0, 0.3, 0]}>
        <group ref={windmillSailsRef}>
          {[0, 1, 2, 3].map((s) => (
            <group key={`sail-w-${s}`} rotation={[0, 0, (s * Math.PI) / 2]}>
              <mesh position={[0, 2.3, 0.1]} material={materials.porchDeck} castShadow>
                <boxGeometry args={[0.14, 4.4, 0.12]} />
              </mesh>
              <mesh position={[0.38, 2.5, 0.14]} material={materials.creamTrim} castShadow>
                <boxGeometry args={[0.72, 3.4, 0.04]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* Eastern Sunrise Hilltop Windmill Sails */}
      <group position={[105.0, windmillEastGroundY + 4.6, 34.6]} rotation={[0, -0.35, 0]}>
        <group ref={windmillEastSailsRef}>
          {[0, 1, 2, 3].map((s) => (
            <group key={`sail-e-${s}`} rotation={[0, 0, (s * Math.PI) / 2]}>
              <mesh position={[0, 2.3, 0.1]} material={materials.porchDeck} castShadow>
                <boxGeometry args={[0.14, 4.4, 0.12]} />
              </mesh>
              <mesh position={[0.38, 2.5, 0.14]} material={materials.creamTrim} castShadow>
                <boxGeometry args={[0.72, 3.4, 0.04]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* Meadow Airstrip Windsock */}
      <group position={[-31.5, airstripGroundY, 29.5]}>
        <mesh position={[0, 2.2, 0]} material={materials.creamTrim} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 4.4, 8]} />
        </mesh>
        <group ref={windsockRef} position={[0, 4.2, 0]}>
          <mesh
            position={[0.65, 0, 0]}
            rotation={[0, 0, -Math.PI * 0.5]}
            material={materials.windsockOrange}
          >
            <cylinderGeometry args={[0.14, 0.32, 1.3, 10]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
