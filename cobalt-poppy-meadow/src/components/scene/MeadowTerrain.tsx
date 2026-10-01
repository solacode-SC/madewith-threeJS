import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createMeadowTerrainShaderMaterial } from '../../core/meadowShaders';
import { MOOD_THEMES, type SkyMood } from '../../domain/meadowConfig';
import { getMeadowHeight } from '../../domain/meadowLayout';

interface MeadowTerrainProps {
  skyMood: SkyMood;
}

export default function MeadowTerrain({ skyMood }: MeadowTerrainProps) {
  const terrainShaderMat = useMemo(() => createMeadowTerrainShaderMaterial(), []);

  // 1. Procedural Sculpted Rolling Hill Mesh
  const terrainGeo = useMemo(() => {
    // 240m wide, 260m deep, 180x180 segments for crisp hill contours
    const width = 240;
    const depth = 260;
    const segX = 180;
    const segZ = 180;

    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geo.rotateX(-Math.PI * 0.5);

    // Center terrain around Z = -60 so it extends from +20 to -140
    geo.translate(0, 0, -60);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getMeadowHeight(x, z));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Update lighting and atmosphere colors
  useEffect(() => {
    const theme = MOOD_THEMES[skyMood];
    terrainShaderMat.uniforms.uSunDir.value.set(...theme.sunPosition).normalize();
    terrainShaderMat.uniforms.uSunColor.value.set(theme.sunColor);
    terrainShaderMat.uniforms.uAmbientColor.value.set(theme.ambientColor);

    if (skyMood === 'golden-hour') {
      terrainShaderMat.uniforms.uSageGreen.value.set('#A4975C');
      terrainShaderMat.uniforms.uCeladon.value.set('#C2B076');
      terrainShaderMat.uniforms.uChartreuse.value.set('#D9B464');
      terrainShaderMat.uniforms.uChalkPath.value.set('#FFE8C2');
      terrainShaderMat.uniforms.uChalkPathEdge.value.set('#E2C498');
    } else if (skyMood === 'lavender-twilight') {
      terrainShaderMat.uniforms.uSageGreen.value.set('#3D4958');
      terrainShaderMat.uniforms.uCeladon.value.set('#4A5668');
      terrainShaderMat.uniforms.uChartreuse.value.set('#52586D');
      terrainShaderMat.uniforms.uChalkPath.value.set('#8C889E');
      terrainShaderMat.uniforms.uChalkPathEdge.value.set('#6B677E');
    } else if (skyMood === 'misty-dawn') {
      terrainShaderMat.uniforms.uSageGreen.value.set('#8BA27F');
      terrainShaderMat.uniforms.uCeladon.value.set('#AEC3A4');
      terrainShaderMat.uniforms.uChartreuse.value.set('#C4D9A8');
      terrainShaderMat.uniforms.uChalkPath.value.set('#F4EFE6');
      terrainShaderMat.uniforms.uChalkPathEdge.value.set('#D6CDB8');
    } else {
      // Painterly Gouache Noon (matching reference-art.jpg)
      terrainShaderMat.uniforms.uSageGreen.value.set('#98AD85');
      terrainShaderMat.uniforms.uCeladon.value.set('#BFD1B3');
      terrainShaderMat.uniforms.uChartreuse.value.set('#D3E2B6');
      terrainShaderMat.uniforms.uChalkPath.value.set('#F6F2E7');
      terrainShaderMat.uniforms.uChalkPathEdge.value.set('#DED4BC');
    }
  }, [skyMood, terrainShaderMat]);

  useFrame((state) => {
    terrainShaderMat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      geometry={terrainGeo}
      material={terrainShaderMat}
      receiveShadow
      name="MeadowTerrain"
    />
  );
}
