import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createBroadFoliageGeometry,
  createDaisyGeometry,
  createGrassBladeGeometry,
  createPathPetalGeometry,
  createPoppyGeometry,
  createWildRoseGeometry,
} from '../../core/floraGeometries';
import { createInstancedFloraShaderMaterial } from '../../core/meadowShaders';
import { MOOD_THEMES, type SkyMood } from '../../domain/meadowConfig';
import { getDistanceToPath, getMeadowHeight, pseudoRandom } from '../../domain/meadowLayout';

interface InstancedWildflowersProps {
  skyMood: SkyMood;
  windSpeed?: number;
}

export default function InstancedWildflowers({ skyMood, windSpeed = 1.0 }: InstancedWildflowersProps) {
  // Refs for Instanced Meshes
  const cobaltPoppyRef = useRef<THREE.InstancedMesh>(null);
  const noddingPoppyRef = useRef<THREE.InstancedMesh>(null);
  const wildRoseRef = useRef<THREE.InstancedMesh>(null);
  const cornflowerRef = useRef<THREE.InstancedMesh>(null);
  const chamomileRef = useRef<THREE.InstancedMesh>(null);
  const broadFoliageRef = useRef<THREE.InstancedMesh>(null);
  const pathPetalsRef = useRef<THREE.InstancedMesh>(null);
  const grassRef = useRef<THREE.InstancedMesh>(null);

  // 1. High-Detail Hand-Painted Geometries
  const cobaltPoppyGeo = useMemo(() => createPoppyGeometry('#1E40AF', '#080E1C', false), []);
  const noddingPoppyGeo = useMemo(() => createPoppyGeometry('#1D4ED8', '#080E1C', true), []);
  const wildRoseGeo = useMemo(() => createWildRoseGeometry('#C92A2A', '#EAB308'), []);
  const cornflowerGeo = useMemo(() => createDaisyGeometry('#60A5FA', '#162C5C', 14), []);
  const chamomileGeo = useMemo(() => createDaisyGeometry('#FAF9F5', '#F59E0B', 12), []);
  const broadFoliageGeo = useMemo(() => createBroadFoliageGeometry(), []);
  const pathPetalGeo = useMemo(() => createPathPetalGeometry(), []);
  const grassGeo = useMemo(() => createGrassBladeGeometry(), []);

  // 2. Fine-Art Shader Materials with Cel Stepping & Painted Contours
  const cobaltPoppyMat = useMemo(() => createInstancedFloraShaderMaterial('#1E4DB8', '#081226'), []);
  const noddingPoppyMat = useMemo(() => createInstancedFloraShaderMaterial('#1C44A0', '#070F20'), []);
  const wildRoseMat = useMemo(() => createInstancedFloraShaderMaterial('#C82532', '#28070A'), []);
  const cornflowerMat = useMemo(() => createInstancedFloraShaderMaterial('#689AE5', '#12234A'), []);
  const chamomileMat = useMemo(() => createInstancedFloraShaderMaterial('#FCFAF5', '#78350F'), []);
  const broadFoliageMat = useMemo(() => createInstancedFloraShaderMaterial('#183256', '#091526'), []);
  const pathPetalsMat = useMemo(() => createInstancedFloraShaderMaterial('#2563EB', '#0F1E3D'), []);
  const grassMat = useMemo(() => createInstancedFloraShaderMaterial('#4D6E38', '#162812'), []);

  // Instance counts (Rich, dense floral sanctuary: 9,200+ total instanced botanical elements)
  const COBALT_COUNT = 1500;
  const NODDING_COUNT = 450;
  const ROSE_COUNT = 650;
  const CORNFLOWER_COUNT = 1250;
  const CHAMOMILE_COUNT = 950;
  const FOLIAGE_COUNT = 320;
  const PETAL_COUNT = 380;
  const GRASS_COUNT = 3700;

  // 3. Populate Instance Matrices & Artistic Color Variations
  useEffect(() => {
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();

    // --- A. Cobalt Blue Poppies (Upright Hero Blossoms) ---
    if (cobaltPoppyRef.current) {
      let placed = 0;
      let seed = 101;
      while (placed < COBALT_COUNT) {
        seed++;
        // Natural distribution: dense along the path verges and cascading down the valley
        const x = (pseudoRandom(seed * 1.3) - 0.5) * 44;
        const z = 14 - Math.pow(pseudoRandom(seed * 1.7), 1.32) * 56;
        const distToPath = getDistanceToPath(x, z);

        if (distToPath < 0.42) continue; // Keep path walkable

        const y = getMeadowHeight(x, z);
        // Foreground flowers (Z > 4) are scaled up for dramatic painterly composition
        const isForeground = z > 3;
        const baseScale = isForeground ? 1.15 : 0.85;
        const scale = (baseScale + pseudoRandom(seed * 2.1) * 0.45);
        const rotY = pseudoRandom(seed * 3.3) * Math.PI * 2;
        const tiltX = (pseudoRandom(seed * 4.1) - 0.5) * 0.22;
        const tiltZ = (pseudoRandom(seed * 5.7) - 0.5) * 0.22;

        dummy.position.set(x, y, z);
        dummy.rotation.set(tiltX, rotY, tiltZ);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        cobaltPoppyRef.current.setMatrixAt(placed, dummy.matrix);

        // Harmonious sapphire, ultramarine, and royal cobalt palette
        const jitter = pseudoRandom(seed * 6.9);
        if (jitter < 0.38) {
          tempColor.set('#1D4ED8'); // Royal Cobalt
        } else if (jitter < 0.72) {
          tempColor.set('#2563EB'); // Vivid French Ultramarine
        } else {
          tempColor.set('#173B8A'); // Deep Indigo Navy
        }
        cobaltPoppyRef.current.setColorAt(placed, tempColor);
        placed++;
      }
      cobaltPoppyRef.current.instanceMatrix.needsUpdate = true;
      if (cobaltPoppyRef.current.instanceColor) cobaltPoppyRef.current.instanceColor.needsUpdate = true;
    }

    // --- B. Nodding Profile Cobalt Blossoms (Graceful curved silhouette bells) ---
    if (noddingPoppyRef.current) {
      let placed = 0;
      let seed = 310;
      while (placed < NODDING_COUNT) {
        seed++;
        const x = (pseudoRandom(seed * 1.4) - 0.5) * 38;
        const z = 13.5 - Math.pow(pseudoRandom(seed * 1.8), 1.3) * 50;
        const distToPath = getDistanceToPath(x, z);

        if (distToPath < 0.45) continue;

        const y = getMeadowHeight(x, z);
        const scale = 0.85 + pseudoRandom(seed * 2.3) * 0.4;
        // Tendency to bow toward the path
        const pathAngle = Math.atan2(-x, 10 - z);
        const rotY = pathAngle + (pseudoRandom(seed * 3.5) - 0.5) * 0.8;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        noddingPoppyRef.current.setMatrixAt(placed, dummy.matrix);

        const jitter = pseudoRandom(seed * 7.4);
        tempColor.set(jitter < 0.5 ? '#1E4DB8' : '#2A68DE');
        noddingPoppyRef.current.setColorAt(placed, tempColor);
        placed++;
      }
      noddingPoppyRef.current.instanceMatrix.needsUpdate = true;
      if (noddingPoppyRef.current.instanceColor) noddingPoppyRef.current.instanceColor.needsUpdate = true;
    }

    // --- C. Magnificent Wild Meadow Roses (Layered ruffled blooms in crimson & rose) ---
    if (wildRoseRef.current) {
      let placed = 0;
      let seed = 601;
      while (placed < ROSE_COUNT) {
        seed++;
        // Concentrated in distinct vibrant clusters (matching mid-left & mid-right in reference-art.jpg)
        const clusterBias = pseudoRandom(seed * 1.2) > 0.42 ? 1 : -1;
        const clusterOffset = clusterBias > 0 ? 3.5 : -3.8;
        const x = clusterOffset + (pseudoRandom(seed * 1.5) - 0.5) * 16;
        const z = 13.2 - Math.pow(pseudoRandom(seed * 1.9), 1.25) * 48;
        const distToPath = getDistanceToPath(x, z);

        if (distToPath < 0.48) continue;

        const y = getMeadowHeight(x, z);
        const isFg = z > 3;
        const scale = (isFg ? 1.05 : 0.82) + pseudoRandom(seed * 2.2) * 0.38;
        const rotY = pseudoRandom(seed * 3.6) * Math.PI * 2;
        const tilt = (pseudoRandom(seed * 4.5) - 0.5) * 0.25;

        dummy.position.set(x, y, z);
        dummy.rotation.set(tilt, rotY, tilt * 0.6);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        wildRoseRef.current.setMatrixAt(placed, dummy.matrix);

        // Rich fine-art palette: Carmine scarlet, velvety madder lake, and deep ruby rose
        const roseJitter = pseudoRandom(seed * 7.8);
        if (roseJitter < 0.42) {
          tempColor.set('#C8222E'); // Carmine Madder Scarlet
        } else if (roseJitter < 0.75) {
          tempColor.set('#D9343A'); // Glowing Vermillion Rose
        } else {
          tempColor.set('#A91626'); // Deep Velvet Crimson
        }
        wildRoseRef.current.setColorAt(placed, tempColor);
        placed++;
      }
      wildRoseRef.current.instanceMatrix.needsUpdate = true;
      if (wildRoseRef.current.instanceColor) wildRoseRef.current.instanceColor.needsUpdate = true;
    }

    // --- D. Cornflower Daisies & Feathered Asters ---
    if (cornflowerRef.current) {
      let placed = 0;
      let seed = 1204;
      while (placed < CORNFLOWER_COUNT) {
        seed++;
        const x = (pseudoRandom(seed * 1.4) - 0.5) * 42;
        const z = 13 - pseudoRandom(seed * 1.9) * 54;
        const distToPath = getDistanceToPath(x, z);

        if (distToPath < 0.38) continue;

        const y = getMeadowHeight(x, z);
        const scale = 0.78 + pseudoRandom(seed * 2.2) * 0.4;
        const rotY = pseudoRandom(seed * 3.1) * Math.PI * 2;
        const tilt = (pseudoRandom(seed * 4.4) - 0.5) * 0.22;

        dummy.position.set(x, y, z);
        dummy.rotation.set(tilt, rotY, tilt * 0.8);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        cornflowerRef.current.setMatrixAt(placed, dummy.matrix);

        const blueJitter = pseudoRandom(seed * 6.3);
        if (blueJitter < 0.4) {
          tempColor.set('#5B8CE4'); // Periwinkle Blue
        } else if (blueJitter < 0.78) {
          tempColor.set('#84B1F2'); // Sky Cerulean
        } else {
          tempColor.set('#3668C8'); // Deep Cornflower
        }
        cornflowerRef.current.setColorAt(placed, tempColor);
        placed++;
      }
      cornflowerRef.current.instanceMatrix.needsUpdate = true;
      if (cornflowerRef.current.instanceColor) cornflowerRef.current.instanceColor.needsUpdate = true;
    }

    // --- E. Chamomile & White Meadow Daisies ---
    if (chamomileRef.current) {
      let placed = 0;
      let seed = 2309;
      while (placed < CHAMOMILE_COUNT) {
        seed++;
        const x = (pseudoRandom(seed * 1.25) - 0.5) * 40;
        const z = 12.5 - pseudoRandom(seed * 1.6) * 50;
        const distToPath = getDistanceToPath(x, z);

        if (distToPath < 0.4) continue;

        const y = getMeadowHeight(x, z);
        const scale = 0.72 + pseudoRandom(seed * 2.5) * 0.42;
        const rotY = pseudoRandom(seed * 3.5) * Math.PI * 2;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        chamomileRef.current.setMatrixAt(placed, dummy.matrix);

        const whiteJitter = pseudoRandom(seed * 5.8);
        tempColor.set(whiteJitter > 0.45 ? '#FAF8F2' : '#F1EFE8');
        chamomileRef.current.setColorAt(placed, tempColor);
        placed++;
      }
      chamomileRef.current.instanceMatrix.needsUpdate = true;
      if (chamomileRef.current.instanceColor) chamomileRef.current.instanceColor.needsUpdate = true;
    }

    // --- F. Stylized Broad Indigo Foreground Foliage (Anchoring foreground corners) ---
    if (broadFoliageRef.current) {
      let placed = 0;
      let seed = 3401;
      while (placed < FOLIAGE_COUNT) {
        seed++;
        // Heavy bias toward foreground (Z: 14 to 0, flanking sides X: -14 to -2 and +2 to +14)
        const side = pseudoRandom(seed * 1.1) > 0.5 ? 1 : -1;
        const x = side * (1.8 + pseudoRandom(seed * 1.7) * 14);
        const z = 14 - Math.pow(pseudoRandom(seed * 2.1), 1.6) * 36;
        const distToPath = getDistanceToPath(x, z);

        if (distToPath < 0.5) continue;

        const y = getMeadowHeight(x, z);
        const isFgCorner = z > 6 && Math.abs(x) > 2.5;
        const scale = (isFgCorner ? 1.4 : 0.95) + pseudoRandom(seed * 2.8) * 0.35;
        const rotY = pseudoRandom(seed * 3.9) * Math.PI * 2;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        broadFoliageRef.current.setMatrixAt(placed, dummy.matrix);

        tempColor.set(pseudoRandom(seed * 6.2) > 0.4 ? '#142848' : '#1C365C');
        broadFoliageRef.current.setColorAt(placed, tempColor);
        placed++;
      }
      broadFoliageRef.current.instanceMatrix.needsUpdate = true;
      if (broadFoliageRef.current.instanceColor) broadFoliageRef.current.instanceColor.needsUpdate = true;
    }

    // --- G. Fallen Path Petals & Scattered Flecks ---
    if (pathPetalsRef.current) {
      let placed = 0;
      let seed = 4102;
      while (placed < PETAL_COUNT) {
        seed++;
        // Placed primarily on and directly adjacent to the winding chalk path
        const z = 14 - pseudoRandom(seed * 1.5) * 58;
        // Derive path center at this Z
        const pathCenterX = 0.5 + Math.sin(z * 0.08) * 1.4 + Math.cos(z * 0.035) * 0.8;
        const x = pathCenterX + (pseudoRandom(seed * 2.3) - 0.5) * 1.8;
        const y = getMeadowHeight(x, z) + 0.015;

        const scale = 0.6 + pseudoRandom(seed * 3.1) * 0.55;
        const rotY = pseudoRandom(seed * 4.2) * Math.PI * 2;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        pathPetalsRef.current.setMatrixAt(placed, dummy.matrix);

        const pJitter = pseudoRandom(seed * 5.5);
        if (pJitter < 0.6) {
          tempColor.set('#2563EB'); // Blue poppy petal
        } else if (pJitter < 0.85) {
          tempColor.set('#DC2626'); // Scarlet rose petal
        } else {
          tempColor.set('#60A5FA'); // Azure cornflower petal
        }
        pathPetalsRef.current.setColorAt(placed, tempColor);
        placed++;
      }
      pathPetalsRef.current.instanceMatrix.needsUpdate = true;
      if (pathPetalsRef.current.instanceColor) pathPetalsRef.current.instanceColor.needsUpdate = true;
    }

    // --- H. Tall Wild Grass Blades ---
    if (grassRef.current) {
      let placed = 0;
      let seed = 5501;
      while (placed < GRASS_COUNT) {
        seed++;
        const x = (pseudoRandom(seed * 1.15) - 0.5) * 48;
        const z = 14 - pseudoRandom(seed * 1.45) * 65;
        const distToPath = getDistanceToPath(x, z);

        if (distToPath < 0.28) continue;

        const y = getMeadowHeight(x, z);
        const scale = 0.78 + pseudoRandom(seed * 2.1) * 0.55;
        const rotY = pseudoRandom(seed * 3.4) * Math.PI * 2;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(scale * 0.9, scale, scale * 0.9);
        dummy.updateMatrix();

        grassRef.current.setMatrixAt(placed, dummy.matrix);

        const grassJitter = pseudoRandom(seed * 6.5);
        if (grassJitter < 0.35) {
          tempColor.set('#486E36'); // Warm Sage
        } else if (grassJitter < 0.7) {
          tempColor.set('#5D8442'); // Celadon Meadow
        } else {
          tempColor.set('#365426'); // Olive Base
        }
        grassRef.current.setColorAt(placed, tempColor);
        placed++;
      }
      grassRef.current.instanceMatrix.needsUpdate = true;
      if (grassRef.current.instanceColor) grassRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  // Update atmosphere lighting uniforms whenever mood changes
  useEffect(() => {
    const theme = MOOD_THEMES[skyMood];
    const sunDir = new THREE.Vector3(...theme.sunPosition).normalize();
    const sunCol = new THREE.Color(theme.sunColor);
    const ambCol = new THREE.Color(theme.ambientColor);

    const materials = [
      cobaltPoppyMat,
      noddingPoppyMat,
      wildRoseMat,
      cornflowerMat,
      chamomileMat,
      broadFoliageMat,
      pathPetalsMat,
      grassMat,
    ];
    for (const mat of materials) {
      mat.uniforms.uSunDir.value.copy(sunDir);
      mat.uniforms.uSunColor.value.copy(sunCol);
      mat.uniforms.uAmbientColor.value.copy(ambCol);
      mat.uniforms.uEmissiveGlow.value = theme.poppyGlow;
    }
  }, [
    skyMood,
    cobaltPoppyMat,
    noddingPoppyMat,
    wildRoseMat,
    cornflowerMat,
    chamomileMat,
    broadFoliageMat,
    pathPetalsMat,
    grassMat,
  ]);

  // Frame tick: update GPU time uniform for wind swaying (0 CPU cost)
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    cobaltPoppyMat.uniforms.uTime.value = t;
    cobaltPoppyMat.uniforms.uWindStrength.value = windSpeed;

    noddingPoppyMat.uniforms.uTime.value = t;
    noddingPoppyMat.uniforms.uWindStrength.value = windSpeed;

    wildRoseMat.uniforms.uTime.value = t;
    wildRoseMat.uniforms.uWindStrength.value = windSpeed;

    cornflowerMat.uniforms.uTime.value = t;
    cornflowerMat.uniforms.uWindStrength.value = windSpeed;

    chamomileMat.uniforms.uTime.value = t;
    chamomileMat.uniforms.uWindStrength.value = windSpeed;

    broadFoliageMat.uniforms.uTime.value = t;
    broadFoliageMat.uniforms.uWindStrength.value = windSpeed * 0.7;

    pathPetalsMat.uniforms.uTime.value = t;
    pathPetalsMat.uniforms.uWindStrength.value = 0.1;

    grassMat.uniforms.uTime.value = t;
    grassMat.uniforms.uWindStrength.value = windSpeed;
  });

  return (
    <group name="InstancedWildflowers">
      {/* 1. Cobalt Blue Poppies (Upright Hero Blossoms with White Starburst Centers) */}
      <instancedMesh
        ref={cobaltPoppyRef}
        args={[cobaltPoppyGeo, cobaltPoppyMat, COBALT_COUNT]}
        castShadow
        receiveShadow
      />
      {/* 2. Nodding Profile Cobalt Blossoms */}
      <instancedMesh
        ref={noddingPoppyRef}
        args={[noddingPoppyGeo, noddingPoppyMat, NODDING_COUNT]}
        castShadow
        receiveShadow
      />
      {/* 3. Wild English Meadow Roses (Crimson & Carmine Ruffled Blooms) */}
      <instancedMesh
        ref={wildRoseRef}
        args={[wildRoseGeo, wildRoseMat, ROSE_COUNT]}
        castShadow
        receiveShadow
      />
      {/* 4. Cornflower Blue Daisies & Asters */}
      <instancedMesh
        ref={cornflowerRef}
        args={[cornflowerGeo, cornflowerMat, CORNFLOWER_COUNT]}
        castShadow
        receiveShadow
      />
      {/* 5. Chamomile & White Meadow Flowers */}
      <instancedMesh
        ref={chamomileRef}
        args={[chamomileGeo, chamomileMat, CHAMOMILE_COUNT]}
        castShadow
        receiveShadow
      />
      {/* 6. Stylized Broad Indigo Foreground Foliage Sprays */}
      <instancedMesh
        ref={broadFoliageRef}
        args={[broadFoliageGeo, broadFoliageMat, FOLIAGE_COUNT]}
        castShadow
        receiveShadow
      />
      {/* 7. Fallen Path Petals */}
      <instancedMesh
        ref={pathPetalsRef}
        args={[pathPetalGeo, pathPetalsMat, PETAL_COUNT]}
        receiveShadow
      />
      {/* 8. Tall Wild Grass Blades */}
      <instancedMesh
        ref={grassRef}
        args={[grassGeo, grassMat, GRASS_COUNT]}
        receiveShadow
      />
    </group>
  );
}
