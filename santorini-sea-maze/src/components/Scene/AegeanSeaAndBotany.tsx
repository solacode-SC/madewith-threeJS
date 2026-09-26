import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CELL_SIZE,
  MAZE_COLS,
  MAZE_DATA,
  MAZE_ROWS,
} from '../../utils/mazeLayout';
import {
  createPalmShadowGoboTexture,
  createWhiteAmphoraTextures,
} from '../../utils/textures';

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function mergeGeos(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
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
    if (normAttr) normals.set(normAttr.array as Float32Array, vertOffset * 3);
    if (uvAttr) uvs.set(uvAttr.array as Float32Array, vertOffset * 2);

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

export default function AegeanSeaAndBotany() {
  const seaMeshRef = useRef<THREE.Mesh>(null);
  const foamGroupRef = useRef<THREE.Group>(null);
  const sailboatsGroupRef = useRef<THREE.Group>(null);
  const palmCanopyRef = useRef<THREE.Mesh>(null);

  const whiteUrnTex = useMemo(() => createWhiteAmphoraTextures(false), []);
  const palmShadowGobo = useMemo(() => createPalmShadowGoboTexture(), []);

  const halfCityW = (MAZE_COLS * CELL_SIZE) / 2;
  const halfCityH = (MAZE_ROWS * CELL_SIZE) / 2;

  // =====================================================================
  // 1. SPIKY DRACAENA DRAGON PALMS IN WHITEWASHED AMPHORA URNS (Image 2!)
  // =====================================================================
  const mergedBotany = useMemo(() => {
    const urnGeos: THREE.BufferGeometry[] = [];
    const soilGeos: THREE.BufferGeometry[] = [];
    const trunkGeos: THREE.BufferGeometry[] = [];
    const bladeGeos: THREE.BufferGeometry[] = [];
    const shadowGoboGeos: THREE.BufferGeometry[] = [];

    // Bulbous Whitewashed Planter Urn Primitives (Matches Left Foreground Urn in Image 2!)
    const urnBellyBase = new THREE.SphereGeometry(0.42, 20, 16);
    const urnRimBase = new THREE.TorusGeometry(0.32, 0.042, 10, 20);
    urnRimBase.rotateX(Math.PI / 2);
    const urnSoilBase = new THREE.CylinderGeometry(0.31, 0.31, 0.06, 16);
    const shadowPlaneBase = new THREE.PlaneGeometry(2.7, 2.7);

    // Tapered Sword-Leaf Blade for the Spiky Dracaena Dragon Palm Crown
    const swordBladeBase = new THREE.ConeGeometry(0.065, 1.32, 5);
    swordBladeBase.scale(1.0, 1.0, 0.22);
    swordBladeBase.translate(0, 0.66, 0);

    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const euler = new THREE.Euler();

    for (const palm of MAZE_DATA.palms) {
      const { x, z, height, trunkCurveX, trunkCurveZ, frondCount, seed, hasWhiteUrn, urnScale } =
        palm;

      const urnTopY = hasWhiteUrn ? 0.78 * urnScale : 0.05;

      if (hasWhiteUrn) {
        // Large Smooth Whitewashed Ceramic Planter Pot
        pos.set(x, 0.42 * urnScale, z);
        euler.set(0, 0, 0);
        quat.setFromEuler(euler);
        scale.set(1.08 * urnScale, 1.12 * urnScale, 1.08 * urnScale);
        m.compose(pos, quat, scale);
        const belly = urnBellyBase.clone();
        belly.applyMatrix4(m);
        urnGeos.push(belly);

        pos.set(x, 0.76 * urnScale, z);
        scale.set(urnScale, urnScale, urnScale);
        m.compose(pos, quat, scale);
        const rim = urnRimBase.clone();
        rim.applyMatrix4(m);
        urnGeos.push(rim);

        pos.set(x, 0.74 * urnScale, z);
        m.compose(pos, quat, scale);
        const soil = urnSoilBase.clone();
        soil.applyMatrix4(m);
        soilGeos.push(soil);
      }

      // Crisp Spiky Palm Shadow Projected on the White & Turquoise Steps Next to the Urn!
      pos.set(x + 0.65, 0.017, z + 0.45);
      euler.set(-Math.PI / 2, 0, seed * 0.4);
      quat.setFromEuler(euler);
      scale.set(1, 1, 1);
      m.compose(pos, quat, scale);
      const sh = shadowPlaneBase.clone();
      sh.applyMatrix4(m);
      shadowGoboGeos.push(sh);

      // Slender Textured Woody Dragon-Palm Trunk Curve
      const topX = x + trunkCurveX;
      const topZ = z + trunkCurveZ;
      const midX = x + trunkCurveX * 0.45;
      const midZ = z + trunkCurveZ * 0.45;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, urnTopY - 0.06, z),
        new THREE.Vector3(midX, urnTopY + (height - urnTopY) * 0.5, midZ),
        new THREE.Vector3(topX, height, topZ),
      ]);
      const trunkTube = new THREE.TubeGeometry(curve, 10, 0.095, 8, false);
      trunkGeos.push(trunkTube);

      // Bursting Spherical Rosette of Spiky Sword-Like Dracaena Leaves (Matches Image 2!)
      const totalBlades = frondCount + 12;
      for (let b = 0; b < totalBlades; b++) {
        const tier = b % 3; // 0 = upright inner spike, 1 = mid radiating blade, 2 = lower arching blade
        const azimuth = (b * Math.PI * 2) / totalBlades + pseudoRandom(seed + b * 7) * 0.25;
        const polarPitch =
          tier === 0
            ? 0.22 + pseudoRandom(seed + b * 11) * 0.28
            : tier === 1
              ? 0.68 + pseudoRandom(seed + b * 13) * 0.35
              : 1.18 + pseudoRandom(seed + b * 17) * 0.38;

        const bladeLen = 0.88 + pseudoRandom(seed + b * 19) * 0.36;
        pos.set(topX, height - 0.06, topZ);
        euler.set(polarPitch, azimuth, 0, 'YXZ');
        quat.setFromEuler(euler);
        scale.set(0.95, bladeLen, 0.95);
        m.compose(pos, quat, scale);

        const blade = swordBladeBase.clone();
        blade.applyMatrix4(m);
        bladeGeos.push(blade);
      }
    }

    return {
      urnGeo: mergeGeos(urnGeos),
      soilGeo: mergeGeos(soilGeos),
      trunkGeo: mergeGeos(trunkGeos),
      bladeGeo: mergeGeos(bladeGeos),
      shadowGoboGeo: mergeGeos(shadowGoboGeos),
    };
  }, []);

  // =====================================================================
  // 2. AEGEAN SEA WAVE SURFACE GEOMETRY ("WITH SEA IN SIDE")
  // =====================================================================
  const { seaGeo, baseSeaPositions } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(140, 140, 72, 72);
    geo.rotateX(-Math.PI / 2);
    const posAttr = geo.attributes.position;
    const copy = new Float32Array(posAttr.array.length);
    copy.set(posAttr.array as Float32Array);
    return { seaGeo: geo, baseSeaPositions: copy };
  }, []);

  // 4 Scenic Aegean Sailboats Bobbing on the Western & Southern Coastline
  const sailboats = useMemo(
    () => [
      { id: 'boat-1', x: -halfCityW - 7.5, z: -8.0, yaw: 0.35, scale: 1.15 },
      { id: 'boat-2', x: -halfCityW - 12.0, z: 4.5, yaw: -0.25, scale: 1.35 },
      { id: 'boat-3', x: -halfCityW - 6.8, z: 16.5, yaw: 0.55, scale: 1.05 },
      { id: 'boat-4', x: -4.0, z: halfCityH + 8.5, yaw: 1.25, scale: 1.25 },
    ],
    [halfCityW, halfCityH]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Gentle Sea Breeze Sway on Dragon Palm Crowns
    if (palmCanopyRef.current) {
      palmCanopyRef.current.rotation.z = Math.sin(t * 1.6) * 0.004;
    }

    // Animate Aegean Sea Waves
    if (seaMeshRef.current) {
      const posAttr = seaMeshRef.current.geometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < posAttr.count; i++) {
        const ix = i * 3;
        const bx = baseSeaPositions[ix];
        const bz = baseSeaPositions[ix + 2];
        arr[ix + 1] =
          Math.sin(bx * 0.32 + t * 1.7) * 0.14 +
          Math.cos(bz * 0.28 + t * 1.3) * 0.12;
      }
      posAttr.needsUpdate = true;
    }

    // Pulse Shoreline White Surf Foam
    if (foamGroupRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.08;
      foamGroupRef.current.scale.set(s, 1, 1);
    }

    // Gently Bob & Roll Aegean Sailboats
    if (sailboatsGroupRef.current) {
      const children = sailboatsGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const boat = children[i];
        boat.position.y = -0.52 + Math.sin(t * 1.8 + i * 1.7) * 0.12;
        boat.rotation.z = Math.sin(t * 1.4 + i) * 0.065;
        boat.rotation.x = Math.cos(t * 1.2 + i) * 0.04;
      }
    }
  });

  return (
    <group>
      {/* ================================================================= */}
      {/* SPIKY DRACAENA DRAGON PALMS & WHITEWASHED AMPHORA URNS            */}
      {/* ================================================================= */}
      <mesh geometry={mergedBotany.urnGeo} castShadow receiveShadow>
        <meshStandardMaterial
          map={whiteUrnTex.map}
          bumpMap={whiteUrnTex.bumpMap}
          bumpScale={0.04}
          roughness={0.5}
          emissive="#DCE8FA"
          emissiveIntensity={0.12}
        />
      </mesh>

      <mesh geometry={mergedBotany.soilGeo}>
        <meshStandardMaterial color="#5C4838" roughness={0.9} />
      </mesh>

      <mesh geometry={mergedBotany.trunkGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#705A4A" roughness={0.82} />
      </mesh>

      <mesh ref={palmCanopyRef} geometry={mergedBotany.bladeGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#357A44"
          roughness={0.44}
          emissive="#22562E"
          emissiveIntensity={0.16}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh geometry={mergedBotany.shadowGoboGeo}>
        <meshBasicMaterial
          map={palmShadowGobo}
          transparent
          opacity={0.46}
          depthWrite={false}
        />
      </mesh>

      {/* ================================================================= */}
      {/* WHITEWASHED COASTAL CLIFF FOUNDATION & HARBOR QUAY WALLS          */}
      {/* ================================================================= */}
      {/* Solid Whitewashed Island Cliff Pedestal under the 9x9 Maze City */}
      <mesh position={[0, -1.25, 0]} receiveShadow>
        <boxGeometry args={[halfCityW * 2 + 0.6, 2.5, halfCityH * 2 + 0.6]} />
        <meshStandardMaterial color="#E6F0FC" roughness={0.75} />
      </mesh>

      {/* Western Harbor Stone Pier Jutting Into the Aegean Sea at Place 9 ([7, 0]) */}
      <group position={[-halfCityW - 3.2, -0.25, halfCityH - CELL_SIZE * 1.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[6.4, 0.65, 3.2]} />
          <meshStandardMaterial color="#F2F7FF" roughness={0.6} />
        </mesh>
        {/* Turquoise Inlaid Pier Stripe */}
        <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.8, 1.4]} />
          <meshStandardMaterial color="#6CE4F4" roughness={0.3} emissive="#3EC2DC" emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* SHIMMERING AEGEAN SEA ("WITH SEA IN SIDE")                        */}
      {/* ================================================================= */}
      {/* Deep Sapphire-Turquoise Animated Wave Ocean */}
      <mesh
        ref={seaMeshRef}
        geometry={seaGeo}
        position={[-22, -0.65, 18]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#1D9BE8"
          roughness={0.16}
          metalness={0.18}
          emissive="#126AB8"
          emissiveIntensity={0.28}
        />
      </mesh>

      {/* Shallow Glowing Aquamarine Coastal Lagoon Shelf Along West & South Edges */}
      <mesh position={[-halfCityW - 3.8, -0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.6, halfCityH * 2 + 8]} />
        <meshBasicMaterial color="#5CE8F8" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, -0.58, halfCityH + 3.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[halfCityW * 2 + 8, 7.6]} />
        <meshBasicMaterial color="#5CE8F8" transparent opacity={0.55} />
      </mesh>

      {/* Animated White Sea-Foam Shoreline Ribbon */}
      <group ref={foamGroupRef}>
        <mesh position={[-halfCityW - 0.55, -0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.55, halfCityH * 2 + 2]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.78} />
        </mesh>
        <mesh position={[0, -0.54, halfCityH + 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[halfCityW * 2 + 2, 0.55]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.78} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* BOBBING CYCLADIC SAILBOATS ON THE AEGEAN SEA                      */}
      {/* ================================================================= */}
      <group ref={sailboatsGroupRef}>
        {sailboats.map((b) => (
          <group
            key={b.id}
            position={[b.x, -0.52, b.z]}
            rotation={[0, b.yaw, 0]}
            scale={[b.scale, b.scale, b.scale]}
          >
            {/* White & Aegean-Blue Wooden Hull */}
            <mesh position={[0, 0.18, 0]} scale={[0.52, 0.35, 1.45]} castShadow>
              <cylinderGeometry args={[0.65, 0.38, 0.75, 14]} />
              <meshStandardMaterial color="#FAFCFF" roughness={0.4} />
            </mesh>
            {/* Cerulean Blue Hull Stripe */}
            <mesh position={[0, 0.28, 0]} scale={[0.54, 0.12, 1.47]}>
              <cylinderGeometry args={[0.66, 0.55, 0.7, 14]} />
              <meshStandardMaterial color="#2B88E4" roughness={0.35} />
            </mesh>
            {/* Tall Wooden Mast */}
            <mesh position={[0, 1.25, 0.08]} castShadow>
              <cylinderGeometry args={[0.025, 0.035, 2.2, 8]} />
              <meshStandardMaterial color="#7C5836" roughness={0.7} />
            </mesh>
            {/* Billowing White Main Sail */}
            <mesh position={[0, 1.32, -0.18]} rotation={[0.08, Math.PI / 2, 0]} castShadow>
              <coneGeometry args={[0.68, 1.65, 3]} />
              <meshStandardMaterial
                color="#FFFFFF"
                roughness={0.45}
                emissive="#E5F2FF"
                emissiveIntensity={0.22}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
