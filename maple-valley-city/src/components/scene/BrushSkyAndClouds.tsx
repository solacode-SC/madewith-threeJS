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
   * Build batched, high-altitude sculpted watercolor brush clouds floating high in the sky dome.
   * All low-hanging ground/valley mist & smoke have been removed so the street, house, and meadow views are 100% clear!
   */
  const highCloudsGeo = useMemo(() => {
    const highBuckets: THREE.BufferGeometry[] = [];
    const identity = new THREE.Matrix4();

    const puffUnit = createBrushCloudFoliageGeometry(1, 1, 1, 11, 2);
    const softSweepUnit = createBrushCloudFoliageGeometry(1.4, 0.55, 0.9, 29, 2);

    // 28 High-Altitude Sky Watercolor Brush Clouds floating well above the mountain peaks
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2 + pseudoRandom(i * 7 + 1) * 0.22;
      const ringRadius = 58 + pseudoRandom(i * 7 + 2) * 44;
      const cx = Math.sin(angle) * ringRadius;
      const cz = Math.cos(angle) * ringRadius - 6;
      const cy = 26.0 + pseudoRandom(i * 7 + 3) * 15.0;
      const baseScale = 3.6 + pseudoRandom(i * 7 + 4) * 3.8;
      const yaw = pseudoRandom(i * 7 + 5) * Math.PI;

      // Central billowy brush crown
      pushTransformedGeo(
        highBuckets,
        puffUnit,
        identity,
        cx,
        cy,
        cz,
        0,
        yaw,
        0,
        baseScale * 1.6,
        baseScale * 0.7,
        baseScale * 1.12
      );
      // Left & right sweeping brush-tail lobes
      pushTransformedGeo(
        highBuckets,
        softSweepUnit,
        identity,
        cx - Math.cos(yaw) * baseScale * 1.15,
        cy - baseScale * 0.14,
        cz + Math.sin(yaw) * baseScale * 1.15,
        0,
        yaw + 0.15,
        0.05,
        baseScale * 1.2,
        baseScale * 0.62,
        baseScale * 0.92
      );
      pushTransformedGeo(
        highBuckets,
        softSweepUnit,
        identity,
        cx + Math.cos(yaw) * baseScale * 1.18,
        cy - baseScale * 0.12,
        cz - Math.sin(yaw) * baseScale * 1.18,
        0,
        yaw - 0.12,
        -0.05,
        baseScale * 1.25,
        baseScale * 0.6,
        baseScale * 0.9
      );
      // Upper sunlit brush crest
      pushTransformedGeo(
        highBuckets,
        puffUnit,
        identity,
        cx + (pseudoRandom(i * 7 + 6) - 0.5) * baseScale * 0.55,
        cy + baseScale * 0.35,
        cz,
        0,
        yaw,
        0,
        baseScale * 1.0,
        baseScale * 0.56,
        baseScale * 0.82
      );
    }

    puffUnit.dispose();
    softSweepUnit.dispose();

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
      highCloudsGroupRef.current.rotation.y = t * 0.0075;
      highCloudsGroupRef.current.position.y = Math.sin(t * 0.25) * 0.35;
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
      {/* Distant horizon fog pushed far back so ground, houses & green meadow stay crystal clear */}
      <fog attach="fog" args={[theme.fogColor, 105, 235]} />

      {/* Rice-Paper Watercolor Sky Dome */}
      <mesh material={skyMat} scale={[190, 190, 190]}>
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

      {/* Batched Sculpted High-Altitude Watercolor Sky Clouds */}
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
