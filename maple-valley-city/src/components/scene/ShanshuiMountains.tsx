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

  const mountainsGeo = useMemo(() => {
    const buckets: THREE.BufferGeometry[] = [];
    const identity = new THREE.Matrix4();

    // 1. Iconic Hero Celadon-Sage Mountain Peak directly North (-Z) behind the Center House & Pine Tree
    // Framed to match the exact central mountain silhouette in the uploaded watercolor reference!
    const heroPeak = createSmoothMountainPeakGeometry(24, 26.5, 101, 64, 32);
    pushTransformedGeo(buckets, heroPeak, identity, -0.8, -0.5, -33.5, 0, 0.28, 0, 1.15, 1.0, 0.72);
    heroPeak.dispose();

    // 2. Left & Right flanking misty mountain shoulders seen in the reference painting
    const leftShoulder = createSmoothMountainPeakGeometry(19, 19.5, 202, 52, 26);
    pushTransformedGeo(
      buckets,
      leftShoulder,
      identity,
      -15.5,
      -0.5,
      -30.5,
      0,
      -0.35,
      0,
      1.1,
      1.0,
      0.75
    );
    leftShoulder.dispose();

    const rightShoulder = createSmoothMountainPeakGeometry(20, 18.5, 303, 52, 26);
    pushTransformedGeo(
      buckets,
      rightShoulder,
      identity,
      15.5,
      -0.5,
      -29.5,
      0,
      0.45,
      0,
      1.12,
      1.0,
      0.75
    );
    rightShoulder.dispose();

    // 3. 360-Degree Distant Shanshui Mountain Range Ring encircling the entire 11x11 City
    const peakCount = 16;
    for (let i = 0; i < peakCount; i++) {
      const angle = (i / peakCount) * Math.PI * 2;
      // Keep the northern sector clear for the 3 hero peaks above
      if (Math.cos(angle) < -0.68) continue;

      const dist = 62 + pseudoRandom(i * 13 + 1) * 18;
      const mx = Math.sin(angle) * dist;
      const mz = Math.cos(angle) * dist;
      const rad = 22 + pseudoRandom(i * 13 + 2) * 12;
      const h = 21 + pseudoRandom(i * 13 + 3) * 14;

      const peak = createSmoothMountainPeakGeometry(rad, h, 400 + i * 17, 44, 22);
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
        1.1,
        1.0,
        0.9
      );
      peak.dispose();
    }

    return mergeBufferGeometries(buckets);
  }, []);

  return <mesh geometry={mountainsGeo} material={mountainMat} />;
}
