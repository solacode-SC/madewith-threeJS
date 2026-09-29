import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SKY_MOOD_THEMES, type SkyMood } from '../../domain/skyConfig';
import { getTerrainHeight } from '../../domain/villageLayout';
import {
  createBillowingTreeCanopyGeometry,
  mergeBufferGeometries,
  pseudoRandom,
  pushTransformedGeo,
} from '../../core/inkOutlineBatcher';
import {
  createFeatheredMistPlaneShaderMaterial,
  createHandDrawnCloudMistShaderMaterial,
  createSkyDomeShaderMaterial,
  createSunbeamGodRayShaderMaterial,
} from '../../core/handDrawnShaders';

interface SkyMistAndSunbeamsProps {
  skyMood: SkyMood;
  planePosRef: React.MutableRefObject<THREE.Vector3>;
}

export default function SkyMistAndSunbeams({
  skyMood,
  planePosRef,
}: SkyMistAndSunbeamsProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const frameCloudsGroupRef = useRef<THREE.Group>(null);
  const villageMistGroupRef = useRef<THREE.Group>(null);

  const theme = SKY_MOOD_THEMES[skyMood];

  const skyMat = useMemo(
    () => createSkyDomeShaderMaterial(theme.skyTop, theme.skyHorizon),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const frameCloudMat = useMemo(
    () =>
      createHandDrawnCloudMistShaderMaterial(
        theme.cloudTop,
        theme.cloudMid,
        theme.cloudShadow,
        0.84,
        24.0,
        44.0
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const featheredMistMat = useMemo(
    () => createFeatheredMistPlaneShaderMaterial(theme.mistOpacity * 0.72),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const sunbeamMat = useMemo(
    () => createSunbeamGodRayShaderMaterial(theme.sunbeamColor, theme.sunbeamOpacity * 0.65),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    skyMat.uniforms.uSkyTop.value.set(theme.skyTop);
    skyMat.uniforms.uSkyHorizon.value.set(theme.skyHorizon);
    skyMat.uniforms.uSunGlow.value.set(theme.sunGlowColor);
    skyMat.uniforms.uSunDir.value.set(...theme.sunDirection).normalize();
    skyMat.uniforms.uStarIntensity.value = theme.starIntensity;
    skyMat.uniforms.uMoonIntensity.value = theme.moonIntensity;

    frameCloudMat.uniforms.uTopColor.value.set(theme.cloudTop);
    frameCloudMat.uniforms.uMidColor.value.set(theme.cloudMid);
    frameCloudMat.uniforms.uShadowColor.value.set(theme.cloudShadow);

    featheredMistMat.uniforms.uMistColor.value.set(theme.mistColor);
    featheredMistMat.uniforms.uOpacity.value = theme.mistOpacity * 0.72;

    sunbeamMat.uniforms.uBeamColor.value.set(theme.sunbeamColor);
    sunbeamMat.uniforms.uOpacity.value = theme.sunbeamOpacity * 0.65;
  }, [theme, skyMat, frameCloudMat, featheredMistMat, sunbeamMat]);

  // 1. High-Subdivision Smooth Fluffy Perimeter Clouds around the 3x outer valley
  const frameCloudsGeo = useMemo(() => {
    const frameBuckets: THREE.BufferGeometry[] = [];
    const identity = new THREE.Matrix4();

    const puffUnit = createBillowingTreeCanopyGeometry(1.3, 0.75, 1.1, 19, 3);
    const wispUnit = createBillowingTreeCanopyGeometry(2.2, 0.4, 1.0, 37, 2);

    for (let i = 0; i < 44; i++) {
      const s = i * 11 + 3;
      const angle = (i / 44) * Math.PI * 2 + (pseudoRandom(s) - 0.5) * 0.14;
      const radius = 148 + pseudoRandom(s + 1) * 115;
      const cx = Math.cos(angle) * radius;
      const cz = Math.sin(angle) * radius;
      const cy = getTerrainHeight(cx, cz) + 18.0 + pseudoRandom(s + 2) * 24.0;
      const scale = 4.6 + pseudoRandom(s + 3) * 3.8;
      const yaw = angle + Math.PI * 0.5;

      pushTransformedGeo(
        frameBuckets,
        puffUnit,
        identity,
        cx,
        cy,
        cz,
        0,
        yaw,
        0,
        scale * 1.35,
        scale * 0.78,
        scale * 1.1
      );
      pushTransformedGeo(
        frameBuckets,
        puffUnit,
        identity,
        cx + Math.cos(yaw) * scale * 1.1,
        cy - scale * 0.18,
        cz - Math.sin(yaw) * scale * 1.1,
        0,
        yaw + 0.4,
        0,
        scale * 0.95,
        scale * 0.65,
        scale * 0.9
      );
      pushTransformedGeo(
        frameBuckets,
        wispUnit,
        identity,
        cx - Math.cos(yaw) * scale * 1.2,
        cy - scale * 0.25,
        cz + Math.sin(yaw) * scale * 1.2,
        0,
        yaw,
        0,
        scale * 1.1,
        scale * 0.55,
        scale * 0.85
      );
    }

    puffUnit.dispose();
    wispUnit.dispose();

    return mergeBufferGeometries(frameBuckets);
  }, []);

  // 2. Soft Gaussian-Feathered Horizontal Watercolor Mist Layers across the 3x Village & River
  const mistLayers = useMemo(() => {
    return [
      { pos: [-10.0, 4.8, 3.5] as [number, number, number], size: [26, 18] as [number, number], yaw: 0.3 },
      { pos: [14.0, 5.2, -18.0] as [number, number, number], size: [30, 20] as [number, number], yaw: -0.25 },
      { pos: [-16.0, 5.0, -22.0] as [number, number, number], size: [28, 20] as [number, number], yaw: 0.4 },
      { pos: [-14.0, 4.6, 24.0] as [number, number, number], size: [26, 18] as [number, number], yaw: -0.18 },
      { pos: [38.0, 4.4, -10.0] as [number, number, number], size: [32, 22] as [number, number], yaw: 0.15 },
      { pos: [44.0, 4.3, 22.0] as [number, number, number], size: [30, 20] as [number, number], yaw: -0.22 },
      { pos: [28.0, 4.5, -54.0] as [number, number, number], size: [34, 22] as [number, number], yaw: 0.12 },
      { pos: [52.0, 4.4, 56.0] as [number, number, number], size: [32, 22] as [number, number], yaw: -0.16 },
      { pos: [70.0, 5.2, -14.0] as [number, number, number], size: [30, 20] as [number, number], yaw: 0.28 },
      { pos: [-45.0, 5.4, -18.0] as [number, number, number], size: [28, 18] as [number, number], yaw: -0.3 },
      { pos: [-12.0, 5.5, -66.0] as [number, number, number], size: [32, 22] as [number, number], yaw: 0.08 },
      { pos: [8.0, 5.0, 64.0] as [number, number, number], size: [30, 20] as [number, number], yaw: -0.14 },
    ];
  }, []);

  // 3. Diagonal Sunbeam / Moonbeam Shafts across the 3x Valley
  const sunbeamShafts = useMemo(() => {
    return [
      { pos: [22, 18, -24] as [number, number, number], width: 13.0, height: 42 },
      { pos: [12, 17, -18] as [number, number, number], width: 11.0, height: 38 },
      { pos: [38, 18, -8] as [number, number, number], width: 14.0, height: 44 },
      { pos: [4, 17, -28] as [number, number, number], width: 10.5, height: 36 },
      { pos: [64, 19, -22] as [number, number, number], width: 13.5, height: 42 },
      { pos: [-22, 18, 14] as [number, number, number], width: 12.0, height: 38 },
      { pos: [46, 18, 36] as [number, number, number], width: 13.0, height: 40 },
    ];
  }, []);

  const lastLightTargetRef = useRef<{ x: number; z: number; mood: string }>({
    x: -999,
    z: -999,
    mood: '',
  });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    skyMat.uniforms.uTime.value = t;
    frameCloudMat.uniforms.uTime.value = t;
    featheredMistMat.uniforms.uTime.value = t;
    sunbeamMat.uniforms.uTime.value = t;

    if (frameCloudsGroupRef.current) {
      frameCloudsGroupRef.current.rotation.y = t * 0.004;
    }
    if (villageMistGroupRef.current) {
      villageMistGroupRef.current.position.x = Math.sin(t * 0.18) * 1.6;
      villageMistGroupRef.current.position.z = Math.cos(t * 0.14) * 1.2;
    }

    const p = planePosRef.current;
    if (dirLightRef.current) {
      const dx = p.x - lastLightTargetRef.current.x;
      const dz = p.z - lastLightTargetRef.current.z;
      if (dx * dx + dz * dz > 0.5 || lastLightTargetRef.current.mood !== skyMood) {
        lastLightTargetRef.current.x = p.x;
        lastLightTargetRef.current.z = p.z;
        lastLightTargetRef.current.mood = skyMood;
        const [sx, sy, sz] = theme.sunDirection;
        dirLightRef.current.position.set(p.x + sx * 52, Math.max(24, sy * 56), p.z + sz * 52);
        dirLightRef.current.target.position.set(p.x, 0, p.z);
        dirLightRef.current.target.updateMatrixWorld();
      }
    }
  });

  return (
    <>
      <color attach="background" args={[theme.skyHorizon]} />
      <fog attach="fog" args={[theme.fogColor, 210, 540]} />

      <mesh material={skyMat} scale={[760, 760, 760]}>
        <sphereGeometry args={[1, 36, 28]} />
      </mesh>

      <ambientLight color={theme.ambientColor} intensity={theme.ambientIntensity} />
      <hemisphereLight args={[theme.hemiSky, theme.hemiGround, theme.hemiIntensity]} />

      <directionalLight
        ref={dirLightRef}
        color={theme.sunColor}
        intensity={theme.sunIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={145}
        shadow-camera-left={-58}
        shadow-camera-right={58}
        shadow-camera-top={58}
        shadow-camera-bottom={-58}
        shadow-bias={-0.0004}
      />

      <group ref={frameCloudsGroupRef}>
        <mesh geometry={frameCloudsGeo} material={frameCloudMat} />
      </group>

      {/* Soft Gaussian-Feathered Mist Wisps over the 3x Village & River */}
      <group ref={villageMistGroupRef}>
        {mistLayers.map((m, idx) => (
          <mesh
            key={`mist-plane-${idx}`}
            position={m.pos}
            rotation={[-Math.PI * 0.5, 0, m.yaw]}
            material={featheredMistMat}
          >
            <planeGeometry args={m.size} />
          </mesh>
        ))}
      </group>

      {/* Diagonal Sunbeam / Moonbeam Shafts */}
      <group>
        {sunbeamShafts.map((shaft, idx) => (
          <mesh
            key={`sunbeam-${idx}`}
            position={shaft.pos}
            rotation={[0.22, -0.35, -0.52]}
            material={sunbeamMat}
          >
            <planeGeometry args={[shaft.width, shaft.height]} />
          </mesh>
        ))}
      </group>
    </>
  );
}
