import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createIndigoCanopyShaderMaterial,
  createTrunkShaderMaterial,
} from '../../core/meadowShaders';
import {
  createPainterlyCanopyPuffGeometry,
  createPainterlyTrunkGeometry,
} from '../../core/treeGeometries';
import { MOOD_THEMES, type SkyMood } from '../../domain/meadowConfig';
import { NATURE_TREES, getMeadowHeight } from '../../domain/meadowLayout';

interface IndigoCanopyTreesProps {
  skyMood: SkyMood;
}

export default function IndigoCanopyTrees({ skyMood }: IndigoCanopyTreesProps) {
  // 1. Fine-Art Shaders for Foliage Crowns (Midnight Indigo, Royal Cobalt, Ultramarine, Sage-Olive)
  const deepIndigoMat = useMemo(() => createIndigoCanopyShaderMaterial('#142C62'), []);
  const navyCobaltMat = useMemo(() => createIndigoCanopyShaderMaterial('#1A428A'), []);
  const ultramarineMat = useMemo(() => createIndigoCanopyShaderMaterial('#2054B8'), []);
  const sageOliveMat = useMemo(() => createIndigoCanopyShaderMaterial('#3A5034'), []);

  // 2. Birch Wood Trunk Shader
  const trunkMat = useMemo(() => createTrunkShaderMaterial(), []);

  // 3. Pre-generated Organic Reusable Canopy Puff Geometries (at varied radius scales and seeds)
  const puffGeos = useMemo(() => {
    return [
      createPainterlyCanopyPuffGeometry(1.0, 10),
      createPainterlyCanopyPuffGeometry(1.0, 25),
      createPainterlyCanopyPuffGeometry(1.0, 42),
      createPainterlyCanopyPuffGeometry(1.0, 77),
    ];
  }, []);

  // 4. Sentinel Tree Custom Trunks
  const leftSentinelTrunkGeo = useMemo(() => {
    return createPainterlyTrunkGeometry(5.2, 0.28, true);
  }, []);

  const rightSentinelTrunkGeo = useMemo(() => {
    return createPainterlyTrunkGeometry(5.8, 0.29, false);
  }, []);

  const standardTrunkGeo = useMemo(() => {
    return createPainterlyTrunkGeometry(3.2, 0.2, false);
  }, []);

  // Synchronize atmosphere and sun direction across materials
  useEffect(() => {
    const theme = MOOD_THEMES[skyMood];
    const sunDir = new THREE.Vector3(...theme.sunPosition).normalize();
    const sunCol = new THREE.Color(theme.sunColor);
    const ambCol = new THREE.Color(theme.ambientColor);

    const foliageMaterials = [deepIndigoMat, navyCobaltMat, ultramarineMat, sageOliveMat];
    for (const mat of foliageMaterials) {
      mat.uniforms.uSunDir.value.copy(sunDir);
      mat.uniforms.uSunColor.value.copy(sunCol);
      mat.uniforms.uAmbientColor.value.copy(ambCol);
    }

    trunkMat.uniforms.uSunDir.value.copy(sunDir);
    trunkMat.uniforms.uSunColor.value.copy(sunCol);
    trunkMat.uniforms.uAmbientColor.value.copy(ambCol);

    if (skyMood === 'golden-hour') {
      trunkMat.uniforms.uTrunkBase.value.set('#F4E8D4');
      deepIndigoMat.uniforms.uHighlightDab.value.set('#E09F3E');
    } else if (skyMood === 'lavender-twilight') {
      trunkMat.uniforms.uTrunkBase.value.set('#9A95A8');
      deepIndigoMat.uniforms.uHighlightDab.value.set('#8B5CF6');
    } else {
      trunkMat.uniforms.uTrunkBase.value.set('#ECE7DD');
      deepIndigoMat.uniforms.uHighlightDab.value.set('#3B82F6');
    }
  }, [skyMood, deepIndigoMat, navyCobaltMat, ultramarineMat, sageOliveMat, trunkMat]);

  // Gentle wind sway in frame loop
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    deepIndigoMat.uniforms.uTime.value = t;
    navyCobaltMat.uniforms.uTime.value = t;
    ultramarineMat.uniforms.uTime.value = t;
    sageOliveMat.uniforms.uTime.value = t;
  });

  // 5. Construct Organic Painterly Trees
  const trees = useMemo(() => {
    return NATURE_TREES.map((t, idx) => {
      const terrainY = getMeadowHeight(t.x, t.z);

      let foliageMat = deepIndigoMat;
      if (t.colorType === 'navy-cobalt') foliageMat = navyCobaltMat;
      if (t.colorType === 'ultramarine') foliageMat = ultramarineMat;
      if (t.colorType === 'sage-olive') foliageMat = sageOliveMat;

      const isLeftSentinel = t.isSentinel && t.x < 0;
      const isRightSentinel = t.isSentinel && t.x > 0;

      const trunkGeometry = isLeftSentinel
        ? leftSentinelTrunkGeo
        : isRightSentinel
        ? rightSentinelTrunkGeo
        : standardTrunkGeo;

      // Canopy puff arrangements:
      // Multi-layered organic clusters creating negative spaces and scalloped gouache silhouettes
      const lobes: { offset: [number, number, number]; scale: [number, number, number]; geoIdx: number }[] = [];

      if (isLeftSentinel) {
        // Left Sentinel Tree Canopy (wide, branching, majestic)
        lobes.push(
          // Central crown core
          { offset: [0.1, t.trunkHeight * 0.95, 0.0], scale: [2.5, 2.3, 2.5], geoIdx: 0 },
          { offset: [-0.2, t.trunkHeight * 1.25, 0.1], scale: [2.2, 2.1, 2.2], geoIdx: 1 },
          { offset: [0.3, t.trunkHeight * 1.5, -0.1], scale: [1.8, 1.8, 1.8], geoIdx: 2 },
          // Left branching reach (hanging toward valley)
          { offset: [-1.4, t.trunkHeight * 0.92, 0.35], scale: [2.1, 1.9, 2.0], geoIdx: 3 },
          { offset: [-2.1, t.trunkHeight * 1.05, 0.45], scale: [1.6, 1.5, 1.6], geoIdx: 0 },
          // Right-balancing branch
          { offset: [1.2, t.trunkHeight * 1.02, -0.25], scale: [1.9, 1.8, 1.8], geoIdx: 1 },
          { offset: [1.6, t.trunkHeight * 1.15, -0.3], scale: [1.4, 1.3, 1.4], geoIdx: 2 },
          // Back depth volume
          { offset: [0.15, t.trunkHeight * 1.1, -0.8], scale: [1.8, 1.7, 1.7], geoIdx: 3 },
          // Lower decorative fringe dabs
          { offset: [-0.9, t.trunkHeight * 0.72, 0.25], scale: [1.2, 1.1, 1.2], geoIdx: 1 },
          { offset: [0.8, t.trunkHeight * 0.78, 0.2], scale: [1.1, 1.0, 1.1], geoIdx: 2 }
        );
      } else if (isRightSentinel) {
        // Right Sentinel Tree Canopy (taller, stately, lush oval crown)
        lobes.push(
          // Vertical spine clusters
          { offset: [0.0, t.trunkHeight * 0.88, 0.0], scale: [2.4, 2.2, 2.4], geoIdx: 0 },
          { offset: [0.1, t.trunkHeight * 1.18, 0.05], scale: [2.5, 2.4, 2.5], geoIdx: 1 },
          { offset: [-0.05, t.trunkHeight * 1.48, -0.05], scale: [2.1, 2.2, 2.1], geoIdx: 2 },
          { offset: [0.05, t.trunkHeight * 1.75, 0.0], scale: [1.6, 1.7, 1.6], geoIdx: 3 },
          // Flanking side lobes
          { offset: [0.95, t.trunkHeight * 1.05, 0.28], scale: [1.9, 1.8, 1.8], geoIdx: 0 },
          { offset: [1.25, t.trunkHeight * 1.28, 0.2], scale: [1.4, 1.4, 1.4], geoIdx: 1 },
          { offset: [-0.9, t.trunkHeight * 1.1, -0.3], scale: [1.8, 1.7, 1.7], geoIdx: 2 },
          { offset: [-1.15, t.trunkHeight * 1.32, -0.25], scale: [1.3, 1.3, 1.3], geoIdx: 3 },
          // Depth volume
          { offset: [0.1, t.trunkHeight * 1.2, 0.75], scale: [1.6, 1.5, 1.5], geoIdx: 0 },
          { offset: [-0.15, t.trunkHeight * 1.15, -0.7], scale: [1.6, 1.5, 1.5], geoIdx: 1 }
        );
      } else {
        // Distant Hill & Copse Trees
        lobes.push(
          { offset: [0, t.trunkHeight * 0.9, 0], scale: [1.8, 1.6, 1.8], geoIdx: idx % 4 },
          { offset: [0.3, t.trunkHeight * 1.15, 0.1], scale: [1.4, 1.3, 1.4], geoIdx: (idx + 1) % 4 },
          { offset: [-0.35, t.trunkHeight * 0.95, -0.2], scale: [1.3, 1.2, 1.3], geoIdx: (idx + 2) % 4 }
        );
      }

      return (
        <group
          key={`tree-${idx}`}
          position={[t.x, terrainY - 0.15, t.z]}
          scale={t.scale}
        >
          {/* Organic Tapered Branching Trunk */}
          <mesh
            geometry={trunkGeometry}
            material={trunkMat}
            castShadow
            receiveShadow
          />

          {/* Painterly Scalloped Leaf Cluster Puffs */}
          {lobes.map((lobe, lIdx) => (
            <mesh
              key={`lobe-${lIdx}`}
              position={lobe.offset}
              scale={lobe.scale}
              geometry={puffGeos[lobe.geoIdx]}
              material={foliageMat}
              castShadow
              receiveShadow
            />
          ))}
        </group>
      );
    });
  }, [
    deepIndigoMat,
    navyCobaltMat,
    ultramarineMat,
    sageOliveMat,
    trunkMat,
    puffGeos,
    leftSentinelTrunkGeo,
    rightSentinelTrunkGeo,
    standardTrunkGeo,
  ]);

  return <group name="IndigoCanopyTrees">{trees}</group>;
}
