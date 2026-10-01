import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { type SkyMood } from '../../domain/meadowConfig';

interface DistantRidgeMountainsProps {
  skyMood: SkyMood;
}

export default function DistantRidgeMountains({ skyMood }: DistantRidgeMountainsProps) {
  // Layer 1: Mid-distance tiered sage-slate ridge
  const layer1Mat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#8EA291',
      roughness: 0.92,
      metalness: 0.0,
      flatShading: false,
    });
  }, []);

  // Layer 2: Soft periwinkle mountain range
  const layer2Mat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#95A2B5',
      roughness: 0.98,
      metalness: 0.0,
      flatShading: false,
    });
  }, []);

  // Layer 3: Distant lilac-grey mountain silhouette against the sky
  const layer3Mat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#B0B8C8',
      roughness: 1.0,
      metalness: 0.0,
      flatShading: false,
    });
  }, []);

  useEffect(() => {
    if (skyMood === 'golden-hour') {
      layer1Mat.color.set('#B8A185');
      layer2Mat.color.set('#C9AA90');
      layer3Mat.color.set('#D9BDA6');
    } else if (skyMood === 'lavender-twilight') {
      layer1Mat.color.set('#4B4561');
      layer2Mat.color.set('#595275');
      layer3Mat.color.set('#6B638A');
    } else if (skyMood === 'misty-dawn') {
      layer1Mat.color.set('#8BA4A8');
      layer2Mat.color.set('#A4B9BE');
      layer3Mat.color.set('#BCCED4');
    } else {
      // Painterly Noon (matching reference-art.jpg)
      layer1Mat.color.set('#8EA291');
      layer2Mat.color.set('#95A2B5');
      layer3Mat.color.set('#B0B8C8');
    }
  }, [skyMood, layer1Mat, layer2Mat, layer3Mat]);

  // Build 3 layered mountain ridge ribbons with smooth curving gouache silhouettes
  const ridges = useMemo(() => {
    const createRidgeGeometry = (
      width: number,
      depth: number,
      baseHeight: number,
      freq: number,
      amp: number
    ) => {
      const geo = new THREE.PlaneGeometry(width, depth, 96, 24);
      geo.rotateX(-Math.PI * 0.5);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const curve =
          Math.sin(x * freq + 0.5) * amp +
          Math.cos(x * freq * 1.7) * (amp * 0.38) +
          Math.sin(x * freq * 3.2) * (amp * 0.12);
        const taper = Math.max(0, 1 - Math.abs(z / (depth * 0.5)));
        pos.setY(i, baseHeight + curve * taper);
      }
      geo.computeVertexNormals();
      return geo;
    };

    return {
      geo1: createRidgeGeometry(290, 48, 19, 0.022, 8.5),
      geo2: createRidgeGeometry(330, 52, 33, 0.017, 14.5),
      geo3: createRidgeGeometry(390, 62, 48, 0.011, 23.0),
    };
  }, []);

  return (
    <group name="DistantRidgeMountains">
      <mesh geometry={ridges.geo1} material={layer1Mat} position={[0, 0, -85]} />
      <mesh geometry={ridges.geo2} material={layer2Mat} position={[0, 4, -135]} />
      <mesh geometry={ridges.geo3} material={layer3Mat} position={[0, 10, -185]} />
    </group>
  );
}
