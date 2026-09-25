import { useMemo } from 'react';
import * as THREE from 'three';
import { MAZE_DATA } from '../../utils/mazeLayout';
import { createTerracottaPotTextures } from '../../utils/textures';

interface TerracottaPotteryProps {
  onHover: (label: string | null) => void;
}

function mergePotteryGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  let totalVerts = 0;
  let totalIndices = 0;
  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let idxOffset = 0;

  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    const posAttr = g.attributes.position;
    const normAttr = g.attributes.normal;
    const uvAttr = g.attributes.uv;
    const count = posAttr.count;

    positions.set(posAttr.array as Float32Array, vertOffset * 3);
    if (normAttr) {
      normals.set(normAttr.array as Float32Array, vertOffset * 3);
    }
    if (uvAttr) {
      uvs.set(uvAttr.array as Float32Array, vertOffset * 2);
    }

    if (g.index) {
      const idxArr = g.index.array;
      for (let j = 0; j < idxArr.length; j++) {
        indices[idxOffset + j] = idxArr[j] + vertOffset;
      }
      idxOffset += idxArr.length;
    } else {
      for (let j = 0; j < count; j++) {
        indices[idxOffset + j] = vertOffset + j;
      }
      idxOffset += count;
    }

    vertOffset += count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingSphere();
  return merged;
}

export default function TerracottaPottery({ onHover }: TerracottaPotteryProps) {
  const ribbedClayTex = useMemo(() => createTerracottaPotTextures(false), []);
  const paintedClayTex = useMemo(() => createTerracottaPotTextures(true), []);

  const mergedPots = useMemo(() => {
    // 1. Tall Wide-Bellied Ribbed Water Jar
    const tallAmphoraBase = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.14, 0.0),
        new THREE.Vector2(0.24, 0.14),
        new THREE.Vector2(0.31, 0.34),
        new THREE.Vector2(0.29, 0.52),
        new THREE.Vector2(0.18, 0.66),
        new THREE.Vector2(0.085, 0.72),
        new THREE.Vector2(0.085, 0.82),
        new THREE.Vector2(0.098, 0.84),
        new THREE.Vector2(0.072, 0.84),
      ],
      18
    );

    // 2. Medium Pear-Shaped Companion Jar
    const mediumJarBase = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.11, 0.0),
        new THREE.Vector2(0.22, 0.15),
        new THREE.Vector2(0.25, 0.28),
        new THREE.Vector2(0.18, 0.44),
        new THREE.Vector2(0.068, 0.54),
        new THREE.Vector2(0.068, 0.62),
        new THREE.Vector2(0.08, 0.64),
        new THREE.Vector2(0.055, 0.64),
      ],
      18
    );

    // 3. Wide Geometric-Painted Earthenware Bowl
    const wideBowlBase = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.15, 0.0),
        new THREE.Vector2(0.27, 0.12),
        new THREE.Vector2(0.29, 0.24),
        new THREE.Vector2(0.23, 0.36),
        new THREE.Vector2(0.17, 0.41),
        new THREE.Vector2(0.19, 0.43),
        new THREE.Vector2(0.15, 0.43),
      ],
      18
    );

    const hoverProxyBase = new THREE.CylinderGeometry(0.42, 0.42, 0.85, 8);

    const darkAmphoraBucket: THREE.BufferGeometry[] = [];
    const paintedMedBucket: THREE.BufferGeometry[] = [];
    const paintedBowlBucket: THREE.BufferGeometry[] = [];
    const ribbedMedBucket: THREE.BufferGeometry[] = [];
    const granaryJarBucket: THREE.BufferGeometry[] = [];
    const hoverProxyBucket: THREE.BufferGeometry[] = [];

    const clusterMat = new THREE.Matrix4();
    const localMat = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    const addTransformed = (
      bucket: THREE.BufferGeometry[],
      base: THREE.BufferGeometry,
      lx: number,
      ly: number,
      lz: number,
      s = 1
    ) => {
      pos.set(lx, ly, lz);
      quat.identity();
      scale.set(s, s, s);
      localMat.compose(pos, quat, scale);
      localMat.premultiply(clusterMat);
      const clone = base.clone();
      clone.applyMatrix4(localMat);
      bucket.push(clone);
    };

    for (const cluster of MAZE_DATA.potteryClusters) {
      pos.set(cluster.position[0], cluster.position[1], cluster.position[2]);
      euler.set(0, cluster.rotationY, 0, 'XYZ');
      quat.setFromEuler(euler);
      scale.set(1, 1, 1);
      clusterMat.compose(pos, quat, scale);

      addTransformed(hoverProxyBucket, hoverProxyBase, 0, 0.42, 0, 1);

      if (cluster.variant === 'twin-arch-jars') {
        addTransformed(darkAmphoraBucket, tallAmphoraBase, 0.14, 0, -0.12, 1);
        addTransformed(paintedMedBucket, mediumJarBase, -0.16, 0, 0.14, 1);
      } else if (cluster.variant === 'painted-bowl-trio') {
        addTransformed(paintedBowlBucket, wideBowlBase, 0, 0, 0, 1);
        addTransformed(ribbedMedBucket, mediumJarBase, -0.34, 0, -0.18, 0.78);
      } else if (cluster.variant === 'tall-granary-jar') {
        addTransformed(granaryJarBucket, tallAmphoraBase, 0, 0, 0, 1.18);
      }
    }

    tallAmphoraBase.dispose();
    mediumJarBase.dispose();
    wideBowlBase.dispose();
    hoverProxyBase.dispose();

    return {
      darkAmphoraGeo: mergePotteryGeometries(darkAmphoraBucket),
      paintedMedGeo: mergePotteryGeometries(paintedMedBucket),
      paintedBowlGeo: mergePotteryGeometries(paintedBowlBucket),
      ribbedMedGeo: mergePotteryGeometries(ribbedMedBucket),
      granaryJarGeo: mergePotteryGeometries(granaryJarBucket),
      hoverProxyGeo: mergePotteryGeometries(hoverProxyBucket),
    };
  }, []);

  return (
    <group>
      {/* Single low-poly merged hover proxy for all pottery clusters */}
      <mesh
        geometry={mergedPots.hoverProxyGeo}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('Hand-Thrown Ribbed Terracotta Water Jars — Traditional Earthenware');
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      <mesh geometry={mergedPots.darkAmphoraGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={ribbedClayTex.map}
          bumpMap={ribbedClayTex.bumpMap}
          bumpScale={0.03}
          color="#8c4c29"
          roughness={0.68}
        />
      </mesh>

      <mesh geometry={mergedPots.paintedMedGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={paintedClayTex.map}
          bumpMap={paintedClayTex.bumpMap}
          bumpScale={0.026}
          color="#bd7d52"
          roughness={0.64}
        />
      </mesh>

      <mesh geometry={mergedPots.paintedBowlGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={paintedClayTex.map}
          bumpMap={paintedClayTex.bumpMap}
          bumpScale={0.028}
          color="#cfa074"
          roughness={0.66}
        />
      </mesh>

      <mesh geometry={mergedPots.ribbedMedGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={ribbedClayTex.map}
          bumpMap={ribbedClayTex.bumpMap}
          bumpScale={0.025}
          color="#9e5934"
          roughness={0.68}
        />
      </mesh>

      <mesh geometry={mergedPots.granaryJarGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={ribbedClayTex.map}
          bumpMap={ribbedClayTex.bumpMap}
          bumpScale={0.032}
          color="#96522d"
          roughness={0.66}
        />
      </mesh>
    </group>
  );
}
