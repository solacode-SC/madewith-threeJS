import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SKY_MOOD_THEMES, type SkyMood } from '../../domain/skyConfig';
import {
  COUNTRY_ROAD_PATHS,
  RIVER_BRIDGES,
  VILLAGE_HOMESTEADS,
  getRiverCenterX,
  getRiverHalfWidth,
  getRiverWaterY,
  getTerrainHeight,
} from '../../domain/villageLayout';
import {
  createBillowingTreeCanopyGeometry,
  createInkOutlineGeometry,
  createSplineTrunkGeometry,
  mergeBufferGeometries,
  pseudoRandom,
  pushTransformedGeo,
} from '../../core/inkOutlineBatcher';
import {
  createAnimeRiverWaterShaderMaterial,
  createCelFoliageShaderMaterial,
  createHandPaintedRoadShaderMaterial,
  createPainterlyMeadowTerrainShaderMaterial,
} from '../../core/handDrawnShaders';
import { createTreeBarkBrushTextures } from '../../core/handDrawnTextures';

interface MeadowTerrainAndBotanyProps {
  skyMood: SkyMood;
  flightMarker: [number, number, number] | null;
  onGroundClick: (point: THREE.Vector3) => void;
  onHover: (label: string | null) => void;
}

function isSafeForTree(tx: number, tz: number): boolean {
  // Keep clear of the winding river channel + banks
  const riverCX = getRiverCenterX(tz);
  const riverHalfW = getRiverHalfWidth(tz);
  if (Math.abs(tx - riverCX) < riverHalfW + 4.8) return false;

  // Keep clear of all 4 river bridge approaches
  for (const b of RIVER_BRIDGES) {
    const bcx = getRiverCenterX(b.z);
    if (Math.abs(tz - b.z) < 5.5 && Math.abs(tx - bcx) < b.span * 0.5 + 6.5) {
      return false;
    }
  }

  // Keep clear of all 32 homestead cottages & sheds
  for (const plot of VILLAGE_HOMESTEADS) {
    const hx = plot.centerX + plot.cottageOffsetX;
    const hz = plot.centerZ + plot.cottageOffsetZ;
    if (Math.hypot(tx - hx, tz - hz) < 6.0) return false;

    if (plot.hasShed) {
      const sx = plot.centerX + plot.shedOffsetX;
      const sz = plot.centerZ + plot.shedOffsetZ;
      if (Math.hypot(tx - sx, tz - sz) < 4.5) return false;
    }
  }

  // Keep clear of special landmarks (Watermill, Twin Windmills, Airstrip)
  if (Math.hypot(tx - 35.5, tz - 8.0) < 7.5) return false;
  if (Math.hypot(tx - -48.0, tz - -28.0) < 7.5) return false;
  if (Math.hypot(tx - 105.0, tz - 32.0) < 7.5) return false;
  if (Math.hypot(tx - -34.0, tz - 31.0) < 9.5) return false;

  // Keep clear of main road corridors
  if (Math.abs(tx - -1.5) < 4.0 && Math.abs(tz) < 165) return false;
  if (Math.abs(tx - 58.0) < 4.0 && Math.abs(tz) < 135) return false;
  if (Math.abs(tz - -11.0) < 3.8 && Math.abs(tx) < 140) return false;
  if (Math.abs(tz - 12.0) < 3.8 && tx > -95 && tx < 115) return false;
  if (Math.abs(tz - -56.0) < 3.8 && tx > -95 && tx < 125) return false;
  if (Math.abs(tz - 58.0) < 3.8 && tx > -85 && tx < 125) return false;

  return true;
}

export default function MeadowTerrainAndBotany({
  skyMood,
  flightMarker,
  onGroundClick,
  onHover,
}: MeadowTerrainAndBotanyProps) {
  const markerRingRef = useRef<THREE.Mesh>(null);

  const terrainShaderMat = useMemo(() => createPainterlyMeadowTerrainShaderMaterial(), []);
  const riverShaderMat = useMemo(() => createAnimeRiverWaterShaderMaterial(), []);
  const roadShaderMat = useMemo(() => createHandPaintedRoadShaderMaterial(), []);
  const foliageShaderMat = useMemo(
    () => createCelFoliageShaderMaterial('#B4E26E', '#69A846', '#3B722E', '#1E3F1A'),
    []
  );
  const foliageWarmShaderMat = useMemo(
    () => createCelFoliageShaderMaterial('#C8E874', '#7AB84C', '#467E32', '#23461D'),
    []
  );

  const barkTex = useMemo(() => createTreeBarkBrushTextures(), []);

  const materials = useMemo(() => {
    return {
      bark: new THREE.MeshStandardMaterial({
        map: barkTex.map,
        bumpMap: barkTex.bumpMap,
        bumpScale: 0.04,
        color: '#6B5340',
        roughness: 0.88,
      }),
      riverStone: new THREE.MeshStandardMaterial({
        color: '#7C827A',
        roughness: 0.84,
      }),
      treeInkOutline: new THREE.MeshBasicMaterial({
        color: '#1A2618',
        side: THREE.BackSide,
      }),
      grassInkBlade: new THREE.MeshStandardMaterial({
        color: '#2B5624',
        roughness: 0.82,
      }),
      wildflowerYellow: new THREE.MeshStandardMaterial({
        color: '#FBE472',
        emissive: '#E5B82B',
        emissiveIntensity: 0.22,
        roughness: 0.65,
      }),
      wildflowerPink: new THREE.MeshStandardMaterial({
        color: '#F9A8C4',
        emissive: '#D86B92',
        emissiveIntensity: 0.18,
        roughness: 0.65,
      }),
    };
  }, [barkTex]);

  // Synchronize Terrain, River, Foliage & Road Shaders with Morning / Noon / Evening / Night Moods!
  useEffect(() => {
    const theme = SKY_MOOD_THEMES[skyMood];

    terrainShaderMat.uniforms.uSunlitLime.value.set(theme.terrainSunlit);
    terrainShaderMat.uniforms.uWarmMeadow.value.set(theme.terrainWarm);
    terrainShaderMat.uniforms.uLushEmerald.value.set(theme.terrainLush);
    terrainShaderMat.uniforms.uDeepOlive.value.set(theme.terrainDeep);
    terrainShaderMat.uniforms.uForestShadow.value.set(theme.terrainShadow);
    terrainShaderMat.uniforms.uSunbeamTint.value.set(theme.sunbeamColor);
    terrainShaderMat.uniforms.uSunbeamStrength.value = theme.sunbeamOpacity;
    terrainShaderMat.uniforms.uSunDir.value.set(...theme.sunDirection).normalize();
    terrainShaderMat.uniforms.uLanternGlowStrength.value =
      skyMood === 'starry-night' ? 1.0 : skyMood === 'evening-sunset' ? 0.55 : 0.0;

    riverShaderMat.uniforms.uDeepColor.value.set(theme.riverDeep);
    riverShaderMat.uniforms.uShallowColor.value.set(theme.riverShallow);
    riverShaderMat.uniforms.uFoamColor.value.set(theme.riverFoam);
    riverShaderMat.uniforms.uShimmerColor.value.set(theme.riverShimmer);
    riverShaderMat.uniforms.uLanternGlow.value =
      skyMood === 'starry-night' ? 1.0 : skyMood === 'evening-sunset' ? 0.55 : 0.0;

    foliageShaderMat.uniforms.uTopColor.value.set(theme.foliageTop);
    foliageShaderMat.uniforms.uMidColor.value.set(theme.foliageMid);
    foliageShaderMat.uniforms.uShadowColor.value.set(theme.foliageShadow);
    foliageShaderMat.uniforms.uRimSunColor.value.set(theme.foliageRim);
    foliageShaderMat.uniforms.uSunDir.value.set(...theme.sunDirection).normalize();

    foliageWarmShaderMat.uniforms.uTopColor.value.set(theme.foliageTop).offsetHSL(0.02, 0.05, 0.03);
    foliageWarmShaderMat.uniforms.uMidColor.value.set(theme.foliageMid).offsetHSL(0.02, 0.04, 0.02);
    foliageWarmShaderMat.uniforms.uShadowColor.value.set(theme.foliageShadow);
    foliageWarmShaderMat.uniforms.uRimSunColor.value.set(theme.foliageRim);
    foliageWarmShaderMat.uniforms.uSunDir.value.set(...theme.sunDirection).normalize();

    roadShaderMat.uniforms.uBrightness.value =
      skyMood === 'starry-night' ? 0.46 : skyMood === 'evening-sunset' ? 0.86 : 1.0;
  }, [
    skyMood,
    terrainShaderMat,
    riverShaderMat,
    foliageShaderMat,
    foliageWarmShaderMat,
    roadShaderMat,
  ]);

  // 1. 3x Expanded High-Resolution Meadow Terrain (640m x 640m, 224x224 segments)
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(640, 640, 224, 224);
    geo.rotateX(-Math.PI * 0.5);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getTerrainHeight(x, z));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 2. Winding Country Roads + High-Subdivision Animated River Mesh
  const { roadMeshGeo, brookWaterGeo } = useMemo(() => {
    const roadBucket: THREE.BufferGeometry[] = [];

    for (const road of COUNTRY_ROAD_PATHS) {
      const pts3D = road.points.map(([px, pz]) => new THREE.Vector3(px, 0, pz));
      const curve = new THREE.CatmullRomCurve3(pts3D);
      const segments = 160;
      const halfW = road.width * 0.5;

      const positions = new Float32Array((segments + 1) * 2 * 3);
      const normals = new Float32Array((segments + 1) * 2 * 3);
      const uvs = new Float32Array((segments + 1) * 2 * 2);
      const indices: number[] = [];

      const P = new THREE.Vector3();
      const T = new THREE.Vector3();

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        curve.getPointAt(u, P);
        curve.getTangentAt(u, T).normalize();

        const perpX = -T.z;
        const perpZ = T.x;

        const lx = P.x - perpX * halfW;
        const lz = P.z - perpZ * halfW;
        const ly = getTerrainHeight(lx, lz) + 0.065;

        const rx = P.x + perpX * halfW;
        const rz = P.z + perpZ * halfW;
        const ry = getTerrainHeight(rx, rz) + 0.065;

        const vOff = i * 2;
        positions[vOff * 3] = lx;
        positions[vOff * 3 + 1] = ly;
        positions[vOff * 3 + 2] = lz;
        normals[vOff * 3 + 1] = 1;
        uvs[vOff * 2] = 0;
        uvs[vOff * 2 + 1] = u * 28;

        positions[(vOff + 1) * 3] = rx;
        positions[(vOff + 1) * 3 + 1] = ry;
        positions[(vOff + 1) * 3 + 2] = rz;
        normals[(vOff + 1) * 3 + 1] = 1;
        uvs[(vOff + 1) * 2] = 1;
        uvs[(vOff + 1) * 2 + 1] = u * 28;

        if (i < segments) {
          // Skip road triangles right over the river channel where the arched bridges carry traffic!
          const rcx = getRiverCenterX(P.z);
          const rhw = getRiverHalfWidth(P.z) + 0.4;
          const overRiver = Math.abs(P.x - rcx) < rhw;
          if (!overRiver) {
            const a = vOff;
            const b = vOff + 1;
            const c = vOff + 2;
            const d = vOff + 3;
            indices.push(a, c, b);
            indices.push(b, c, d);
          }
        }
      }

      const rGeo = new THREE.BufferGeometry();
      rGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      rGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      rGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      rGeo.setIndex(indices);
      rGeo.computeVertexNormals();
      roadBucket.push(rGeo);
    }

    // Build Multi-Column Winding River Surface Mesh (240 lengthwise x 10 crosswise segments)
    const lenSegs = 240;
    const crossSegs = 10;
    const vertCount = (lenSegs + 1) * (crossSegs + 1);
    const sPos = new Float32Array(vertCount * 3);
    const sNorm = new Float32Array(vertCount * 3);
    const sUv = new Float32Array(vertCount * 2);
    const sIdx: number[] = [];

    for (let i = 0; i <= lenSegs; i++) {
      const v = i / lenSegs;
      const z = -265 + v * 530;
      const cx = getRiverCenterX(z);
      const halfW = getRiverHalfWidth(z) + 0.65;
      const waterY = getRiverWaterY(z);

      for (let j = 0; j <= crossSegs; j++) {
        const u = j / crossSegs; // 0 (west bank) .. 1 (east bank)
        const x = cx + (u - 0.5) * 2.0 * halfW;
        const idx = i * (crossSegs + 1) + j;

        sPos[idx * 3] = x;
        sPos[idx * 3 + 1] = waterY;
        sPos[idx * 3 + 2] = z;

        sNorm[idx * 3] = 0;
        sNorm[idx * 3 + 1] = 1;
        sNorm[idx * 3 + 2] = 0;

        sUv[idx * 2] = u;
        sUv[idx * 2 + 1] = v;
      }
    }

    const stride = crossSegs + 1;
    for (let i = 0; i < lenSegs; i++) {
      for (let j = 0; j < crossSegs; j++) {
        const a = i * stride + j;
        const b = a + 1;
        const c = (i + 1) * stride + j;
        const d = c + 1;
        sIdx.push(a, c, b);
        sIdx.push(b, c, d);
      }
    }

    const streamGeo = new THREE.BufferGeometry();
    streamGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    streamGeo.setAttribute('normal', new THREE.BufferAttribute(sNorm, 3));
    streamGeo.setAttribute('uv', new THREE.BufferAttribute(sUv, 2));
    streamGeo.setIndex(sIdx);

    return {
      roadMeshGeo: mergeBufferGeometries(roadBucket),
      brookWaterGeo: streamGeo,
    };
  }, []);

  // 3. 3x Expanded Smooth Billowing Ghibli Trees, Riverbank Boulders, Reeds & Wildflowers
  const batchedBotany = useMemo(() => {
    const trunkBucket: THREE.BufferGeometry[] = [];
    const canopyLushBucket: THREE.BufferGeometry[] = [];
    const canopyWarmBucket: THREE.BufferGeometry[] = [];
    const treeOutlineBucket: THREE.BufferGeometry[] = [];
    const riverRockBucket: THREE.BufferGeometry[] = [];
    const grassBladeBucket: THREE.BufferGeometry[] = [];
    const flowerYellowBucket: THREE.BufferGeometry[] = [];
    const flowerPinkBucket: THREE.BufferGeometry[] = [];

    const identity = new THREE.Matrix4();
    const boxUnit = new THREE.BoxGeometry(1, 1, 1);
    const flowerDot = new THREE.OctahedronGeometry(0.12, 0);
    const rockUnit = createBillowingTreeCanopyGeometry(0.55, 0.34, 0.48, 77, 1);
    const rockOutlineUnit = createInkOutlineGeometry(rockUnit, 0.032);

    const crownMain = createBillowingTreeCanopyGeometry(1.48, 1.20, 1.45, 13, 2);
    const crownMainOutline = createInkOutlineGeometry(crownMain, 0.052);

    const crownLobe = createBillowingTreeCanopyGeometry(1.10, 0.94, 1.08, 29, 2);
    const crownLobeOutline = createInkOutlineGeometry(crownLobe, 0.048);

    const bushPuff = createBillowingTreeCanopyGeometry(0.70, 0.54, 0.68, 51, 2);
    const bushPuffOutline = createInkOutlineGeometry(bushPuff, 0.038);

    const trunkBase = createSplineTrunkGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.06, 0.9, 0.04),
        new THREE.Vector3(-0.05, 1.85, 0.02),
        new THREE.Vector3(0.02, 2.65, -0.04),
      ],
      0.32,
      0.16,
      10,
      8
    );

    const addHandDrawnTree = (tx: number, tz: number, scale: number, seed: number) => {
      const ty = getTerrainHeight(tx, tz);
      const yaw = pseudoRandom(seed) * Math.PI * 2;
      const isWarm = pseudoRandom(seed + 3) > 0.52;
      const targetCanopy = isWarm ? canopyWarmBucket : canopyLushBucket;

      pushTransformedGeo(
        trunkBucket,
        trunkBase,
        identity,
        tx,
        ty - 0.1,
        tz,
        0,
        yaw,
        0,
        scale,
        scale,
        scale
      );

      const cy = ty + 2.55 * scale;
      pushTransformedGeo(
        targetCanopy,
        crownMain,
        identity,
        tx,
        cy,
        tz,
        0,
        yaw,
        0,
        scale,
        scale,
        scale
      );
      pushTransformedGeo(
        treeOutlineBucket,
        crownMainOutline,
        identity,
        tx,
        cy,
        tz,
        0,
        yaw,
        0,
        scale,
        scale,
        scale
      );

      const lobeOffsets = [
        [-0.82, -0.22, 0.45, 0.88],
        [0.85, -0.18, -0.38, 0.92],
        [0.12, 0.48, 0.68, 0.82],
      ];
      for (let l = 0; l < lobeOffsets.length; l++) {
        const [ox, oy, oz, sMul] = lobeOffsets[l];
        const lx = tx + ox * scale;
        const ly = cy + oy * scale;
        const lz = tz + oz * scale;
        const ls = scale * sMul;
        pushTransformedGeo(
          targetCanopy,
          crownLobe,
          identity,
          lx,
          ly,
          lz,
          0,
          yaw + l * 1.1,
          0,
          ls,
          ls,
          ls
        );
        pushTransformedGeo(
          treeOutlineBucket,
          crownLobeOutline,
          identity,
          lx,
          ly,
          lz,
          0,
          yaw + l * 1.1,
          0,
          ls,
          ls,
          ls
        );
      }
    };

    // Trees & Garden Bushes around all 32 Homesteads
    let seedCounter = 100;
    for (const plot of VILLAGE_HOMESTEADS) {
      const halfW = plot.plotWidth * 0.5;
      const halfD = plot.plotDepth * 0.5;
      const corners: [number, number][] = [
        [plot.centerX - halfW + 1.3, plot.centerZ - halfD + 1.3],
        [plot.centerX + halfW - 1.3, plot.centerZ + halfD - 1.3],
      ];
      for (const [cx, cz] of corners) {
        seedCounter += 7;
        if (isSafeForTree(cx, cz)) {
          const s = 0.92 + pseudoRandom(seedCounter) * 0.30;
          addHandDrawnTree(cx, cz, s, seedCounter);
        }
      }

      for (const [bxOff, bzOff] of [
        [2.6, 2.1],
        [-2.7, -2.0],
      ]) {
        const bx = plot.centerX + plot.cottageOffsetX + bxOff;
        const bz = plot.centerZ + plot.cottageOffsetZ + bzOff;
        const by = getTerrainHeight(bx, bz) + 0.35;
        pushTransformedGeo(
          canopyLushBucket,
          bushPuff,
          identity,
          bx,
          by,
          bz,
          0,
          seedCounter,
          0,
          1,
          1,
          1
        );
        pushTransformedGeo(
          treeOutlineBucket,
          bushPuffOutline,
          identity,
          bx,
          by,
          bz,
          0,
          seedCounter,
          0,
          1,
          1,
          1
        );
      }
    }

    // 300 Scenic Valley, Riverbank & Hillside Ghibli Trees across the 3x World
    for (let i = 0; i < 300; i++) {
      const s = i * 19 + 1;
      const angle = pseudoRandom(s) * Math.PI * 2;
      const radius = 24 + pseudoRandom(s + 1) * 195;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;

      if (isSafeForTree(tx, tz)) {
        const treeScale = 0.88 + pseudoRandom(s + 2) * 0.58;
        addHandDrawnTree(tx, tz, treeScale, s);
      }
    }

    // Riverbank Boulders & Lush Cattail Reed Clusters along both banks of the winding river
    for (let i = 0; i < 130; i++) {
      const rs = i * 23 + 11;
      const rz = -165 + (i / 130) * 330 + (pseudoRandom(rs) - 0.5) * 2.2;
      const side = i % 2 === 0 ? -1 : 1;
      const rcx = getRiverCenterX(rz);
      const rhw = getRiverHalfWidth(rz);
      const rx = rcx + side * (rhw + 0.35 + pseudoRandom(rs + 1) * 1.4);

      // Skip right under bridges
      let nearBridge = false;
      for (const b of RIVER_BRIDGES) {
        if (Math.abs(rz - b.z) < 4.5) nearBridge = true;
      }
      if (nearBridge) continue;

      const ry = getTerrainHeight(rx, rz) + 0.12;
      const rScale = 0.65 + pseudoRandom(rs + 2) * 0.95;
      const rYaw = pseudoRandom(rs + 3) * Math.PI * 2;

      pushTransformedGeo(
        riverRockBucket,
        rockUnit,
        identity,
        rx,
        ry,
        rz,
        0,
        rYaw,
        0,
        rScale * 1.2,
        rScale * 0.8,
        rScale
      );
      pushTransformedGeo(
        treeOutlineBucket,
        rockOutlineUnit,
        identity,
        rx,
        ry,
        rz,
        0,
        rYaw,
        0,
        rScale * 1.2,
        rScale * 0.8,
        rScale
      );

      // River reeds / cattails beside every 2nd boulder
      if (i % 2 === 0) {
        for (let b = -1; b <= 1; b++) {
          pushTransformedGeo(
            grassBladeBucket,
            boxUnit,
            identity,
            rx + b * 0.22,
            ry + 0.42,
            rz + 0.3,
            0,
            b * 0.3,
            b * 0.14,
            0.055,
            0.85,
            0.055
          );
        }
      }
    }

    // 780 Meadow Grass Tufts & Wildflower Patches across the 3x Valley
    for (let i = 0; i < 780; i++) {
      const gs = i * 13 + 5;
      const gx = (pseudoRandom(gs) - 0.5) * 260;
      const gz = (pseudoRandom(gs + 1) - 0.5) * 260;
      if (Math.abs(gx - getRiverCenterX(gz)) < getRiverHalfWidth(gz) + 1.5) continue;

      const gy = getTerrainHeight(gx, gz);

      for (let b = -1; b <= 1; b++) {
        pushTransformedGeo(
          grassBladeBucket,
          boxUnit,
          identity,
          gx + b * 0.16,
          gy + 0.18,
          gz,
          0,
          pseudoRandom(gs + b) * 0.5,
          b * 0.18,
          0.045,
          0.38,
          0.045
        );
      }

      if (i % 2 === 0) {
        const targetFlower = i % 4 === 0 ? flowerPinkBucket : flowerYellowBucket;
        pushTransformedGeo(
          targetFlower,
          flowerDot,
          identity,
          gx + 0.25,
          gy + 0.22,
          gz + 0.18,
          0,
          0,
          0,
          1,
          1,
          1
        );
      }
    }

    crownMain.dispose();
    crownMainOutline.dispose();
    crownLobe.dispose();
    crownLobeOutline.dispose();
    bushPuff.dispose();
    bushPuffOutline.dispose();
    trunkBase.dispose();
    rockUnit.dispose();
    rockOutlineUnit.dispose();
    boxUnit.dispose();
    flowerDot.dispose();

    return {
      trunk: mergeBufferGeometries(trunkBucket),
      canopyLush: mergeBufferGeometries(canopyLushBucket),
      canopyWarm: mergeBufferGeometries(canopyWarmBucket),
      treeOutline: mergeBufferGeometries(treeOutlineBucket),
      riverRocks: mergeBufferGeometries(riverRockBucket),
      grassBlades: mergeBufferGeometries(grassBladeBucket),
      flowersYellow: mergeBufferGeometries(flowerYellowBucket),
      flowersPink: mergeBufferGeometries(flowerPinkBucket),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    terrainShaderMat.uniforms.uTime.value = t;
    riverShaderMat.uniforms.uTime.value = t;
    if (markerRingRef.current) {
      markerRingRef.current.rotation.z = t * 1.4;
      const pulse = 1.0 + Math.sin(t * 4.5) * 0.12;
      markerRingRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group>
      <mesh
        geometry={terrainGeo}
        material={terrainShaderMat}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick(e.point);
        }}
      />

      <mesh
        geometry={roadMeshGeo}
        material={roadShaderMat}
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick(e.point);
        }}
      />

      {/* Animated Winding Anime River */}
      <mesh
        geometry={brookWaterGeo}
        material={riverShaderMat}
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick(e.point);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('Sparkling Meadow River • Click to bank & fly along the water');
        }}
        onPointerOut={() => onHover(null)}
      />

      <mesh geometry={batchedBotany.riverRocks} material={materials.riverStone} castShadow receiveShadow />
      <mesh geometry={batchedBotany.trunk} material={materials.bark} castShadow receiveShadow />
      <mesh
        geometry={batchedBotany.canopyLush}
        material={foliageShaderMat}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedBotany.canopyWarm}
        material={foliageWarmShaderMat}
        castShadow
        receiveShadow
      />
      <mesh geometry={batchedBotany.treeOutline} material={materials.treeInkOutline} />

      <mesh geometry={batchedBotany.grassBlades} material={materials.grassInkBlade} />
      <mesh geometry={batchedBotany.flowersYellow} material={materials.wildflowerYellow} />
      <mesh geometry={batchedBotany.flowersPink} material={materials.wildflowerPink} />

      {flightMarker && (
        <mesh
          ref={markerRingRef}
          position={flightMarker}
          rotation={[-Math.PI * 0.5, 0, 0]}
          onPointerOver={() => onHover('Flight Waypoint')}
        >
          <ringGeometry args={[0.85, 1.25, 24]} />
          <meshBasicMaterial color="#FFF7C0" side={THREE.DoubleSide} transparent opacity={0.88} />
        </mesh>
      )}
    </group>
  );
}
