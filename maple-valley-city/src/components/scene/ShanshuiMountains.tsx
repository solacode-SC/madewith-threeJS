import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BRUSH_MOOD_THEMES, type BrushMood } from '../../domain/cityConfig';
import {
  mergeBufferGeometries,
  pseudoRandom,
  pushTransformedGeo,
} from '../../core/geometryBatcher';
import { createShanshuiMountainShaderMaterial } from '../../core/brushShaders';

interface ShanshuiMountainsProps {
  brushMood: BrushMood;
}

/**
 * Builds a smooth, sculpted shanshui mountain peak with flowing ridge lines and rounded summit.
 */
function createSmoothMountainPeakGeometry(
  radius: number,
  height: number,
  seed: number,
  radialSegs = 64,
  heightSegs = 32
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, radialSegs, heightSegs, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;

  const phase1 = pseudoRandom(seed * 5 + 1) * Math.PI * 2;
  const phase2 = pseudoRandom(seed * 5 + 2) * Math.PI * 2;
  const nVec = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);

    // Convert hemisphere y (0..1) into a sweeping shanshui mountain profile with a soft rounded summit
    const hNorm = THREE.MathUtils.clamp(vy, 0, 1);
    const angle = Math.atan2(vz, vx);

    // Conical-parabolic mountain slope with a softly rounded brush-tip summit
    const radialFactor = Math.pow(1 - hNorm * 0.88, 1.18);

    // Flowing shanshui ridge folds (cunfa) radiating down the slopes
    const ridgeWave =
      1.0 +
      0.14 * Math.sin(angle * 3 + phase1) * (1 - hNorm * 0.65) +
      0.08 * Math.cos(angle * 5 - hNorm * 3.0 + phase2) * (1 - hNorm * 0.55);

    const r = radius * radialFactor * ridgeWave;
    const px = Math.cos(angle) * r;
    const pz = Math.sin(angle) * r;
    const py = Math.pow(hNorm, 1.12) * height;

    pos.setXYZ(i, px, py, pz);

    nVec.set(Math.cos(angle) * 0.65, 0.55 + hNorm * 0.35, Math.sin(angle) * 0.65).normalize();
    norm.setXYZ(i, nVec.x, nVec.y, nVec.z);
  }

  return geo;
}

export default function ShanshuiMountains({ brushMood }: ShanshuiMountainsProps) {
  const theme = BRUSH_MOOD_THEMES[brushMood];

  const mountainMat = useMemo(
    () =>
      createShanshuiMountainShaderMaterial(
        theme.mountainPeak,
        theme.mountainMid,
        theme.mountainBase
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    mountainMat.uniforms.uPeakColor.value.set(theme.mountainPeak);
    mountainMat.uniforms.uMidColor.value.set(theme.mountainMid);
    mountainMat.uniforms.uBaseColor.value.set(theme.mountainBase);
  }, [theme, mountainMat]);

  const slopeFoliageMats = useMemo(
    () => ({
      crimson: new THREE.MeshStandardMaterial({
        color: '#F05A2B',
        emissive: '#B83412',
        emissiveIntensity: 0.18,
        roughness: 0.72,
      }),
      amber: new THREE.MeshStandardMaterial({
        color: '#FBA63B',
        emissive: '#C97816',
        emissiveIntensity: 0.18,
        roughness: 0.72,
      }),
      jade: new THREE.MeshStandardMaterial({
        color: '#3CA35D',
        emissive: '#1F6B38',
        emissiveIntensity: 0.15,
        roughness: 0.76,
      }),
      sakura: new THREE.MeshStandardMaterial({
        color: '#F57E92',
        emissive: '#C44B60',
        emissiveIntensity: 0.18,
        roughness: 0.7,
      }),
    }),
    []
  );

  const {
    mountainsGeo,
    crimsonSlopeGeo,
    amberSlopeGeo,
    jadeSlopeGeo,
    sakuraSlopeGeo,
  } = useMemo(() => {
    const buckets: THREE.BufferGeometry[] = [];
    const crimsonBucket: THREE.BufferGeometry[] = [];
    const amberBucket: THREE.BufferGeometry[] = [];
    const jadeBucket: THREE.BufferGeometry[] = [];
    const sakuraBucket: THREE.BufferGeometry[] = [];
    const identity = new THREE.Matrix4();

    const foliagePuff = new THREE.SphereGeometry(1, 14, 10);

    // Helper to scatter colorful 3D forest & blossom puffs along the lower/mid slopes of a mountain peak
    const addMountainColorClusters = (
      mx: number,
      mz: number,
      rad: number,
      height: number,
      seed: number,
      count: number
    ) => {
      for (let c = 0; c < count; c++) {
        const s = seed * 31 + c * 17;
        // Face mostly inward toward the green land & city
        const inwardAngle = Math.atan2(-mx, -mz) + (pseudoRandom(s + 1) - 0.5) * 1.95;
        const hFrac = 0.08 + pseudoRandom(s + 2) * 0.44;
        const slopeR = rad * Math.pow(1 - hFrac * 0.88, 1.18) * 0.84;
        const fx = mx + Math.sin(inwardAngle) * slopeR;
        const fz = mz + Math.cos(inwardAngle) * slopeR;
        const fy = Math.pow(hFrac, 1.12) * height - 0.4;
        const pScale = 2.2 + pseudoRandom(s + 3) * 2.4;

        const targetBucket =
          c % 4 === 0
            ? crimsonBucket
            : c % 4 === 1
              ? amberBucket
              : c % 4 === 2
                ? jadeBucket
                : sakuraBucket;

        pushTransformedGeo(
          targetBucket,
          foliagePuff,
          identity,
          fx,
          fy,
          fz,
          0,
          inwardAngle,
          0,
          pScale * 1.35,
          pScale * 0.68,
          pScale * 1.15
        );
      }
    };

    // =========================================================================
    // ALL MOUNTAINS PLACED OUTSIDE THE CITY AND AFTER THE GREEN LAND (r >= 92)!
    // (City is [-40.7, 40.7], Lush Green Meadow Land is [40.7 .. 88.0])
    // =========================================================================

    // 1. Iconic Hero Qinglü-Shanshui Mountain Peak directly North (-Z) AFTER the Northern Green Land
    const heroPeak = createSmoothMountainPeakGeometry(30, 52.0, 101, 64, 32);
    pushTransformedGeo(buckets, heroPeak, identity, -1.5, -1.2, -118.0, 0, 0.28, 0, 1.16, 1.0, 0.78);
    heroPeak.dispose();
    addMountainColorClusters(-1.5, -118.0, 26, 52.0, 101, 18);

    // 2. Left & Right flanking colorful mountain shoulders after the Northern Green Land
    const leftShoulder = createSmoothMountainPeakGeometry(25, 40.0, 202, 52, 26);
    pushTransformedGeo(
      buckets,
      leftShoulder,
      identity,
      -38.0,
      -1.2,
      -114.0,
      0,
      -0.35,
      0,
      1.12,
      1.0,
      0.78
    );
    leftShoulder.dispose();
    addMountainColorClusters(-38.0, -114.0, 22, 40.0, 202, 14);

    const rightShoulder = createSmoothMountainPeakGeometry(26, 38.5, 303, 52, 26);
    pushTransformedGeo(
      buckets,
      rightShoulder,
      identity,
      38.0,
      -1.2,
      -113.0,
      0,
      0.45,
      0,
      1.14,
      1.0,
      0.78
    );
    rightShoulder.dispose();
    addMountainColorClusters(38.0, -113.0, 22, 38.5, 303, 14);

    // 3. 360-Degree Inner Colorful Shanshui Mountain Range Ring AFTER the Green Meadow Land
    const innerPeakCount = 22;
    for (let i = 0; i < innerPeakCount; i++) {
      const angle = (i / innerPeakCount) * Math.PI * 2;
      // Keep the northern center sector reserved for the 3 hero peaks above
      if (Math.cos(angle) < -0.78 && Math.abs(Math.sin(angle)) < 0.55) continue;

      const dist = 116 + pseudoRandom(i * 13 + 1) * 16; // 116..132 (foot starts >= 92, after green land!)
      const mx = Math.sin(angle) * dist;
      const mz = Math.cos(angle) * dist;
      const rad = 22 + pseudoRandom(i * 13 + 2) * 8;
      const h = 32 + pseudoRandom(i * 13 + 3) * 16;

      const peak = createSmoothMountainPeakGeometry(rad, h, 400 + i * 17, 48, 24);
      pushTransformedGeo(
        buckets,
        peak,
        identity,
        mx,
        -1.5,
        mz,
        0,
        angle + pseudoRandom(i * 13 + 4),
        0,
        1.08,
        1.0,
        0.82
      );
      peak.dispose();

      addMountainColorClusters(mx, mz, rad * 0.88, h, 400 + i * 17, 10);
    }

    // 4. Outer High Alpine Shanshui Horizon Peaks (Layered behind the inner mountain ring)
    const outerPeakCount = 16;
    for (let j = 0; j < outerPeakCount; j++) {
      const angle = ((j + 0.5) / outerPeakCount) * Math.PI * 2;
      const dist = 144 + pseudoRandom(j * 19 + 1) * 18;
      const mx = Math.sin(angle) * dist;
      const mz = Math.cos(angle) * dist;
      const rad = 28 + pseudoRandom(j * 19 + 2) * 10;
      const h = 44 + pseudoRandom(j * 19 + 3) * 18;

      const outerPeak = createSmoothMountainPeakGeometry(rad, h, 800 + j * 23, 40, 20);
      pushTransformedGeo(
        buckets,
        outerPeak,
        identity,
        mx,
        -2.0,
        mz,
        0,
        angle,
        0,
        1.12,
        1.0,
        0.88
      );
      outerPeak.dispose();
    }

    foliagePuff.dispose();

    return {
      mountainsGeo: mergeBufferGeometries(buckets),
      crimsonSlopeGeo: mergeBufferGeometries(crimsonBucket),
      amberSlopeGeo: mergeBufferGeometries(amberBucket),
      jadeSlopeGeo: mergeBufferGeometries(jadeBucket),
      sakuraSlopeGeo: mergeBufferGeometries(sakuraBucket),
    };
  }, []);

  return (
    <group>
      <mesh geometry={mountainsGeo} material={mountainMat} />
      <mesh geometry={crimsonSlopeGeo} material={slopeFoliageMats.crimson} />
      <mesh geometry={amberSlopeGeo} material={slopeFoliageMats.amber} />
      <mesh geometry={jadeSlopeGeo} material={slopeFoliageMats.jade} />
      <mesh geometry={sakuraSlopeGeo} material={slopeFoliageMats.sakura} />
    </group>
  );
}
