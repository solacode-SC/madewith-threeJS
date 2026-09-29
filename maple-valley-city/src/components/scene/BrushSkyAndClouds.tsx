import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BRUSH_MOOD_THEMES, type BrushMood } from '../../domain/cityConfig';
import {
  createBrushCloudFoliageGeometry,
  mergeBufferGeometries,
  pseudoRandom,
  pushTransformedGeo,
} from '../../core/geometryBatcher';
import {
  createBrushCloudShaderMaterial,
  createRicePaperSkyShaderMaterial,
} from '../../core/brushShaders';

interface BrushSkyAndCloudsProps {
  brushMood: BrushMood;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
}

export default function BrushSkyAndClouds({
  brushMood,
  characterPosRef,
}: BrushSkyAndCloudsProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const highCloudsGroupRef = useRef<THREE.Group>(null);
  const petalsRef = useRef<THREE.Points>(null);

  const theme = BRUSH_MOOD_THEMES[brushMood];

  // Custom GLSL Rice-Paper Sky Dome Material
  const skyMat = useMemo(
    () => createRicePaperSkyShaderMaterial(theme.skyTop, theme.skyHorizon),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Custom GLSL Watercolor Brush Cloud Material (High Sky Clouds Only — zero low ground smoke/mist!)
  const cloudShaderMat = useMemo(
    () =>
      createBrushCloudShaderMaterial(
        theme.cloudTop,
        theme.cloudMid,
        theme.cloudShadow,
        0.92
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    skyMat.uniforms.uSkyTop.value.set(theme.skyTop);
    skyMat.uniforms.uSkyHorizon.value.set(theme.skyHorizon);

    cloudShaderMat.uniforms.uTopColor.value.set(theme.cloudTop);
    cloudShaderMat.uniforms.uMidColor.value.set(theme.cloudMid);
    cloudShaderMat.uniforms.uShadowColor.value.set(theme.cloudShadow);
  }, [theme, skyMat, cloudShaderMat]);

  /**
   * Build batched, High-Draw Anime Cumulonimbus & Cirrus Sky Clouds floating high on the outer sky horizon.
   * Placed at ringRadius = 158..228 and altitude cy = 62..106 so they frame the upper sky above/behind the
   * distant mountains and NEVER cover the city, green meadow, or mountain views!
   */
  const highCloudsGeo = useMemo(() => {
    const highBuckets: THREE.BufferGeometry[] = [];
    const identity = new THREE.Matrix4();

    const domeUnit = createBrushCloudFoliageGeometry(1.0, 0.95, 0.95, 11, 2);
    const puffUnit = createBrushCloudFoliageGeometry(1.15, 0.82, 1.0, 23, 2);
    const anvilSweepUnit = createBrushCloudFoliageGeometry(1.65, 0.44, 0.88, 37, 2);
    const wispRibbonUnit = createBrushCloudFoliageGeometry(2.1, 0.26, 0.62, 53, 1);

    const cloudCount = 24;
    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2 + (pseudoRandom(i * 11 + 1) - 0.5) * 0.14;
      const ringRadius = 162 + pseudoRandom(i * 11 + 2) * 56; // 162..218 (behind/above outer mountains!)
      const cx = Math.sin(angle) * ringRadius;
      const cz = Math.cos(angle) * ringRadius;

      // Keep the central Northern mountain summit sightline extra high so the Hero Peak silhouette is 100% unobstructed
      const isNorthCenter = cz < -90 && Math.abs(cx) < 48;
      const cy = (isNorthCenter ? 82.0 : 62.0) + pseudoRandom(i * 11 + 3) * 28.0;
      const baseScale = 5.4 + pseudoRandom(i * 11 + 4) * 4.2;
      const yaw = angle + Math.PI * 0.5 + (pseudoRandom(i * 11 + 5) - 0.5) * 0.35;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      // 1. Wide Flat-Bottomed Anime Cumulonimbus Anvil Base
      pushTransformedGeo(
        highBuckets,
        anvilSweepUnit,
        identity,
        cx,
        cy - baseScale * 0.36,
        cz,
        0,
        yaw,
        0,
        baseScale * 1.95,
        baseScale * 0.58,
        baseScale * 1.18
      );

      // 2. Towering Central Anime Cumulus Turret Crown
      pushTransformedGeo(
        highBuckets,
        domeUnit,
        identity,
        cx,
        cy + baseScale * 0.42,
        cz,
        0,
        yaw,
        0,
        baseScale * 1.38,
        baseScale * 1.28,
        baseScale * 1.18
      );

      // 3. Highest Sunlit Cauliflower Summit Puff
      pushTransformedGeo(
        highBuckets,
        domeUnit,
        identity,
        cx + cosY * baseScale * 0.25,
        cy + baseScale * 1.05,
        cz - sinY * baseScale * 0.25,
        0,
        yaw + 0.3,
        0,
        baseScale * 0.96,
        baseScale * 0.95,
        baseScale * 0.92
      );

      // 4. Multi-Lobed Secondary Billowing Shoulders (Left & Right)
      const lobeOffsets = [
        [-1.15, 0.08, 0.98, 0.88],
        [1.18, 0.12, 1.02, 0.92],
        [-0.68, 0.62, 0.86, 0.82],
        [0.74, 0.58, 0.88, 0.84],
        [-1.78, -0.18, 0.78, 0.65],
        [1.82, -0.15, 0.82, 0.68],
      ];
      for (let l = 0; l < lobeOffsets.length; l++) {
        const [ox, oy, sxMul, syMul] = lobeOffsets[l];
        pushTransformedGeo(
          highBuckets,
          puffUnit,
          identity,
          cx + cosY * baseScale * ox,
          cy + baseScale * oy,
          cz - sinY * baseScale * ox,
          0,
          yaw + l * 0.4,
          0,
          baseScale * sxMul,
          baseScale * syMul,
          baseScale * sxMul * 0.88
        );
      }

      // 5. Delicate High-Draw Anime Wind-Swept Trailing Cirrus Ribbons
      pushTransformedGeo(
        highBuckets,
        wispRibbonUnit,
        identity,
        cx - cosY * baseScale * 2.35,
        cy - baseScale * 0.28,
        cz + sinY * baseScale * 2.35,
        0,
        yaw + 0.08,
        0.04,
        baseScale * 1.35,
        baseScale * 0.42,
        baseScale * 0.75
      );
      pushTransformedGeo(
        highBuckets,
        wispRibbonUnit,
        identity,
        cx + cosY * baseScale * 2.4,
        cy + baseScale * 0.15,
        cz - sinY * baseScale * 2.4,
        0,
        yaw - 0.08,
        -0.04,
        baseScale * 1.28,
        baseScale * 0.38,
        baseScale * 0.72
      );
    }

    domeUnit.dispose();
    puffUnit.dispose();
    anvilSweepUnit.dispose();
    wispRibbonUnit.dispose();

    return mergeBufferGeometries(highBuckets);
  }, []);

  // Drifting autumn persimmon maple leaf particles
  const petalsGeo = useMemo(() => {
    const count = 240;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 90;
      positions[i * 3 + 1] = 1.2 + pseudoRandom(i * 3 + 2) * 12.5;
      positions[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 90;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const lastLightPosRef = useRef<{ x: number; z: number }>({ x: -999, z: -999 });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    cloudShaderMat.uniforms.uTime.value = t;

    if (highCloudsGroupRef.current) {
      highCloudsGroupRef.current.rotation.y = t * 0.0045;
      highCloudsGroupRef.current.position.y = Math.sin(t * 0.22) * 0.35;
    }

    if (petalsRef.current) {
      petalsRef.current.rotation.y = t * 0.018;
      petalsRef.current.position.y = Math.sin(t * 0.45) * 0.24;
    }

    // Track character with shadow-casting directional light
    const charPos = characterPosRef.current;
    if (dirLightRef.current) {
      const dx = charPos.x - lastLightPosRef.current.x;
      const dz = charPos.z - lastLightPosRef.current.z;
      if (dx * dx + dz * dz > 0.01) {
        lastLightPosRef.current.x = charPos.x;
        lastLightPosRef.current.z = charPos.z;
        dirLightRef.current.position.set(charPos.x - 14, 26, charPos.z + 16);
        dirLightRef.current.target.position.set(charPos.x, 0, charPos.z);
        dirLightRef.current.target.updateMatrixWorld();
      }
    }
  });

  return (
    <>
      <color attach="background" args={[theme.skyHorizon]} />
      {/* Distant horizon fog pushed far back beyond the outer mountains so city, green land & peaks stay crystal clear */}
      <fog attach="fog" args={[theme.fogColor, 195, 395]} />

      {/* Rice-Paper & Anime Watercolor Sky Dome */}
      <mesh material={skyMat} scale={[360, 360, 360]}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>

      {/* Soft Painterly Ambient & Hemisphere Fill */}
      <ambientLight color={theme.ambientColor} intensity={theme.ambientIntensity} />
      <hemisphereLight
        args={[theme.hemiSky, theme.hemiGround, theme.hemiIntensity]}
      />

      {/* Warm Sunlit High-Definition Shadow Light */}
      <directionalLight
        ref={dirLightRef}
        color={theme.sunColor}
        intensity={theme.sunIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-bias={-0.0004}
      />

      {/* Batched Sculpted High-Draw Anime Cumulonimbus Sky Clouds (High & Far — Never Covers View!) */}
      <group ref={highCloudsGroupRef}>
        <mesh geometry={highCloudsGeo} material={cloudShaderMat} />
      </group>

      {/* Drifting Persimmon Maple Petals */}
      <points ref={petalsRef} geometry={petalsGeo}>
        <pointsMaterial
          color="#F26A34"
          size={0.13}
          transparent
          opacity={0.72}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  );
}
