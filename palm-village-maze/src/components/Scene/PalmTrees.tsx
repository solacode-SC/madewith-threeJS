import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAZE_DATA } from '../../utils/mazeLayout';

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function mergeGeos(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of geometries) {
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);

  let vertOff = 0;
  let idxOff = 0;

  for (const g of geometries) {
    const pAttr = g.attributes.position;
    const nAttr = g.attributes.normal;
    const count = pAttr.count;

    positions.set(pAttr.array as Float32Array, vertOff * 3);
    if (nAttr) {
      normals.set(nAttr.array as Float32Array, vertOff * 3);
    }

    if (g.index) {
      const idxArr = g.index.array;
      for (let j = 0; j < idxArr.length; j++) {
        indices[idxOff + j] = idxArr[j] + vertOff;
      }
      idxOff += idxArr.length;
    } else {
      for (let j = 0; j < count; j++) {
        indices[idxOff + j] = vertOff + j;
      }
      idxOff += count;
    }

    vertOff += count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingSphere();
  return merged;
}

/**
 * Builds a single tapered V-folded leaflet blade extending in +X (for side = +1)
 * or -X (for side = -1) with strictly positive scale so vertex normals never invert.
 */
function createTaperedLeafletBlade(side: 1 | -1): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(1.0, 0.016, 0.095, 4, 1, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // Shift from [-0.5, 0.5] to [0, 1] along outward axis
    const u = pos.getX(i) + 0.5;
    const vy = pos.getY(i);
    const vz = pos.getZ(i);

    // Taper width toward the pointed leaflet tip & add natural downward arch + V-keel fold
    const widthFactor = Math.sin(Math.pow(u, 0.65) * Math.PI) * (1 - u * 0.25) + 0.04;
    const keelLift = (1 - Math.abs(vz) / 0.0475) * 0.018 * (1 - u * 0.5);
    const tipDroop = -u * u * 0.14;

    pos.setX(i, side * u);
    pos.setY(i, vy + keelLift + tipDroop);
    pos.setZ(i, vz * widthFactor);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a high-detail arching pinnate date-palm frond geometry (continuous curved rachis stem
 * + V-folded feather leaflets in 3 foliage tones) with zero negative scales.
 */
function createArchingFrondBase(): {
  stemGeo: THREE.BufferGeometry;
  leafletSunlitGeo: THREE.BufferGeometry;
  leafletLightGeo: THREE.BufferGeometry;
  leafletRichGeo: THREE.BufferGeometry;
} {
  const stemGeos: THREE.BufferGeometry[] = [];
  const sunlitLeafGeos: THREE.BufferGeometry[] = [];
  const lightLeafGeos: THREE.BufferGeometry[] = [];
  const richLeafGeos: THREE.BufferGeometry[] = [];

  const mat = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const euler = new THREE.Euler();
  const upVec = new THREE.Vector3(0, 1, 0);
  const segDir = new THREE.Vector3();

  // Smoothly arching central rachis curve
  const totalLen = 2.95;
  const rachisPoints: THREE.Vector3[] = [];
  const curveSteps = 10;
  for (let i = 0; i <= curveSteps; i++) {
    const t = i / curveSteps;
    const z = t * totalLen;
    const y = Math.sin(t * Math.PI * 0.76) * 0.48 - t * t * 0.72;
    rachisPoints.push(new THREE.Vector3(0, y, z));
  }
  const rachisCurve = new THREE.CatmullRomCurve3(rachisPoints);

  // Build continuous tapered stem segments aligned with the curve tangent
  const segCount = 9;
  for (let s = 0; s < segCount; s++) {
    const t0 = s / segCount;
    const t1 = (s + 1) / segCount;
    const p0 = rachisCurve.getPoint(t0);
    const p1 = rachisCurve.getPoint(t1);
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const dist = p0.distanceTo(p1);

    segDir.subVectors(p1, p0).normalize();
    quat.setFromUnitVectors(upVec, segDir);

    const rBottom = THREE.MathUtils.lerp(0.038, 0.007, t0);
    const rTop = THREE.MathUtils.lerp(0.038, 0.006, t1);
    const cyl = new THREE.CylinderGeometry(rTop, rBottom, dist * 1.06, 7);

    mat.compose(mid, quat, scale);
    cyl.applyMatrix4(mat);
    stemGeos.push(cyl);
  }

  // Pinnate feather leaflets along both sides of the arching rachis
  const rightBladeBase = createTaperedLeafletBlade(1);
  const leftBladeBase = createTaperedLeafletBlade(-1);

  const pairs = 16;
  for (let p = 1; p <= pairs; p++) {
    const u = p / (pairs + 1);
    const spinePt = rachisCurve.getPoint(u);
    // Envelope of leaflet length: longest in the middle, shorter at base and tip
    const leafLen = Math.sin(Math.pow(u, 0.85) * Math.PI) * 0.78 + 0.16;
    const droopZ = 0.18 + u * 0.28;
    const sweepForwardY = 0.34 + u * 0.42;

    for (const side of [-1, 1] as const) {
      const leaf = (side === 1 ? rightBladeBase : leftBladeBase).clone();

      pos.set(side * 0.014, spinePt.y, spinePt.z);
      euler.set(
        -0.14 * u,
        side * -sweepForwardY,
        side * -droopZ,
        'YXZ'
      );
      quat.setFromEuler(euler);
      scale.set(leafLen, 1, 1.05 - u * 0.25);
      mat.compose(pos, quat, scale);
      leaf.applyMatrix4(mat);

      const bucketIdx = (p + (side > 0 ? 1 : 0)) % 3;
      if (bucketIdx === 0) {
        sunlitLeafGeos.push(leaf);
      } else if (bucketIdx === 1) {
        lightLeafGeos.push(leaf);
      } else {
        richLeafGeos.push(leaf);
      }
    }
  }

  rightBladeBase.dispose();
  leftBladeBase.dispose();

  return {
    stemGeo: mergeGeos(stemGeos),
    leafletSunlitGeo: mergeGeos(sunlitLeafGeos),
    leafletLightGeo: mergeGeos(lightLeafGeos),
    leafletRichGeo: mergeGeos(richLeafGeos),
  };
}

export default function PalmTrees() {
  const crownsGroupRef = useRef<THREE.Group>(null);

  const {
    trunkGeo,
    trunkRingGeo,
    planterStoneGeo,
    planterSoilGeo,
    dateStalkGeo,
    dateClusterGeo,
    crowns,
  } = useMemo(() => {
    const palms = MAZE_DATA.palms;
    const frondBase = createArchingFrondBase();

    const trunkGeos: THREE.BufferGeometry[] = [];
    const ringGeos: THREE.BufferGeometry[] = [];
    const planterStoneGeos: THREE.BufferGeometry[] = [];
    const planterSoilGeos: THREE.BufferGeometry[] = [];
    const stalkGeos: THREE.BufferGeometry[] = [];
    const dateGeos: THREE.BufferGeometry[] = [];

    const crownSpecs: Array<{
      position: [number, number, number];
      seed: number;
      sunlitGeo: THREE.BufferGeometry;
      lightGeo: THREE.BufferGeometry;
      richGeo: THREE.BufferGeometry;
      stemGeo: THREE.BufferGeometry;
    }> = [];

    const mat4 = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const euler = new THREE.Euler();
    const upVec = new THREE.Vector3(0, 1, 0);
    const segDir = new THREE.Vector3();

    const dateSphereBase = new THREE.SphereGeometry(0.062, 8, 8);
    const planterCurbBase = new THREE.CylinderGeometry(0.42, 0.46, 0.24, 14);
    const planterRimBase = new THREE.TorusGeometry(0.41, 0.045, 8, 16);
    planterRimBase.rotateX(Math.PI / 2);
    const planterSoilBase = new THREE.CylinderGeometry(0.38, 0.38, 0.20, 12);

    for (const palm of palms) {
      // 1. Stone Curb Planter Ring at Base of Interior Village Palms
      if (palm.hasPlanter) {
        pos.set(palm.x, 0.12, palm.z);
        quat.identity();
        scale.set(1, 1, 1);
        mat4.compose(pos, quat, scale);
        const curb = planterCurbBase.clone();
        curb.applyMatrix4(mat4);
        planterStoneGeos.push(curb);

        pos.set(palm.x, 0.24, palm.z);
        mat4.compose(pos, quat, scale);
        const rim = planterRimBase.clone();
        rim.applyMatrix4(mat4);
        planterStoneGeos.push(rim);

        pos.set(palm.x, 0.12, palm.z);
        mat4.compose(pos, quat, scale);
        const soil = planterSoilBase.clone();
        soil.applyMatrix4(mat4);
        planterSoilGeos.push(soil);
      }

      // 2. Smooth Natural Curved Trunk Spine (`CatmullRomCurve3`)
      // Lower trunk stays nearly vertical below wall height, then curves gracefully above the walls
      const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(palm.x, 0, palm.z),
        new THREE.Vector3(
          palm.x + palm.trunkCurveX * 0.15,
          palm.height * 0.35,
          palm.z + palm.trunkCurveZ * 0.15
        ),
        new THREE.Vector3(
          palm.x + palm.trunkCurveX * 0.58,
          palm.height * 0.72,
          palm.z + palm.trunkCurveZ * 0.58
        ),
        new THREE.Vector3(
          palm.x + palm.trunkCurveX,
          palm.height,
          palm.z + palm.trunkCurveZ
        ),
      ]);

      const segments = Math.ceil(palm.height / 0.65);
      for (let s = 0; s < segments; s++) {
        const t0 = s / segments;
        const t1 = (s + 1) / segments;
        const p0 = trunkCurve.getPoint(t0);
        const p1 = trunkCurve.getPoint(t1);
        const mid = p0.clone().add(p1).multiplyScalar(0.5);
        const segLen = p0.distanceTo(p1);

        segDir.subVectors(p1, p0).normalize();
        quat.setFromUnitVectors(upVec, segDir);

        const radiusBottom = THREE.MathUtils.lerp(0.24, 0.135, t0);
        const radiusTop = THREE.MathUtils.lerp(0.24, 0.135, t1);

        scale.set(1, 1, 1);
        mat4.compose(mid, quat, scale);

        const seg = new THREE.CylinderGeometry(radiusTop, radiusBottom, segLen * 1.05, 10);
        seg.applyMatrix4(mat4);
        trunkGeos.push(seg);

        // Sculpted diamond-cut frond-scar bark ring around each segment
        const ring = new THREE.CylinderGeometry(
          radiusTop * 1.13,
          radiusBottom * 0.95,
          segLen * 0.42,
          8
        );
        ring.rotateY((s % 2) * (Math.PI / 8));
        const ringPos = p0.clone().lerp(p1, 0.72);
        mat4.compose(ringPos, quat, scale);
        ring.applyMatrix4(mat4);
        ringGeos.push(ring);
      }

      const topPt = trunkCurve.getPoint(1.0);
      const topX = topPt.x;
      const topY = topPt.y;
      const topZ = topPt.z;

      // Swollen Fibrous Crown Shaft (`Al-Jummar`) at Top of Trunk Below Fronds
      const crownShaft = new THREE.SphereGeometry(0.22, 10, 8);
      pos.set(topX, topY - 0.04, topZ);
      quat.identity();
      scale.set(1.05, 1.18, 1.05);
      mat4.compose(pos, quat, scale);
      crownShaft.applyMatrix4(mat4);
      ringGeos.push(crownShaft);

      // 3. Arching Golden-Orange Date Stalks & Hanging Amber Date Clusters
      const clusterCount = 5;
      for (let c = 0; c < clusterCount; c++) {
        const cAngle = (c / clusterCount) * Math.PI * 2 + pseudoRandom(palm.seed + c * 17) * 0.45;
        const dirX = Math.cos(cAngle);
        const dirZ = Math.sin(cAngle);

        // Curved stalk emerging from crown shaft
        const stalkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(topX + dirX * 0.10, topY - 0.02, topZ + dirZ * 0.10),
          new THREE.Vector3(topX + dirX * 0.26, topY - 0.06, topZ + dirZ * 0.26),
          new THREE.Vector3(topX + dirX * 0.34, topY - 0.24, topZ + dirZ * 0.34),
        ]);
        const stalkGeo = new THREE.TubeGeometry(stalkCurve, 6, 0.018, 5, false);
        stalkGeos.push(stalkGeo);

        const cx = topX + dirX * 0.34;
        const cz = topZ + dirZ * 0.34;
        const cy = topY - 0.22;

        for (let d = 0; d < 9; d++) {
          const dClone = dateSphereBase.clone();
          const ringR = 0.04 + (d % 3) * 0.035;
          const dAngle = d * 2.1 + pseudoRandom(palm.seed + c * 31 + d);
          pos.set(
            cx + Math.cos(dAngle) * ringR,
            cy - Math.floor(d / 3) * 0.075 - (d % 3) * 0.02,
            cz + Math.sin(dAngle) * ringR
          );
          euler.set(0, 0, 0);
          quat.setFromEuler(euler);
          scale.set(0.88, 1.38, 0.88);
          mat4.compose(pos, quat, scale);
          dClone.applyMatrix4(mat4);
          dateGeos.push(dClone);
        }
      }

      // 4. Lush Multi-Tiered Pinnate Frond Crown (3 Tiers + 3 Leaf Tones)
      const crownSunlitGeos: THREE.BufferGeometry[] = [];
      const crownLightGeos: THREE.BufferGeometry[] = [];
      const crownRichGeos: THREE.BufferGeometry[] = [];
      const crownStemGeos: THREE.BufferGeometry[] = [];

      for (let f = 0; f < palm.frondCount; f++) {
        const tier = f % 3; // 0 = upper fountain tier, 1 = middle spreading canopy, 2 = lower arching skirt
        const tierCount = Math.ceil(palm.frondCount / 3);
        const idxInTier = Math.floor(f / 3);
        const angle =
          (idxInTier / tierCount) * Math.PI * 2 +
          tier * 0.72 +
          (pseudoRandom(palm.seed + f * 5) - 0.5) * 0.22;

        const pitchUp =
          tier === 0
            ? 0.58 + pseudoRandom(palm.seed + f * 3) * 0.16
            : tier === 1
              ? 0.22 + pseudoRandom(palm.seed + f * 3) * 0.14
              : -0.12 + pseudoRandom(palm.seed + f * 3) * 0.12;

        const frondScale =
          (tier === 0 ? 0.84 : tier === 1 ? 1.06 : 0.96) *
          (0.92 + pseudoRandom(palm.seed + f * 7) * 0.20);

        pos.set(0, tier * 0.06, 0);
        euler.set(-pitchUp, angle, (pseudoRandom(palm.seed + f * 11) - 0.5) * 0.10, 'YXZ');
        quat.setFromEuler(euler);
        scale.set(frondScale, frondScale, frondScale);
        mat4.compose(pos, quat, scale);

        const sClone = frondBase.stemGeo.clone();
        sClone.applyMatrix4(mat4);
        crownStemGeos.push(sClone);

        const sunClone = frondBase.leafletSunlitGeo.clone();
        sunClone.applyMatrix4(mat4);
        crownSunlitGeos.push(sunClone);

        const lClone = frondBase.leafletLightGeo.clone();
        lClone.applyMatrix4(mat4);
        crownLightGeos.push(lClone);

        const rClone = frondBase.leafletRichGeo.clone();
        rClone.applyMatrix4(mat4);
        crownRichGeos.push(rClone);
      }

      crownSpecs.push({
        position: [topX, topY, topZ],
        seed: palm.seed,
        sunlitGeo: mergeGeos(crownSunlitGeos),
        lightGeo: mergeGeos(crownLightGeos),
        richGeo: mergeGeos(crownRichGeos),
        stemGeo: mergeGeos(crownStemGeos),
      });
    }

    dateSphereBase.dispose();
    planterCurbBase.dispose();
    planterRimBase.dispose();
    planterSoilBase.dispose();
    frondBase.stemGeo.dispose();
    frondBase.leafletSunlitGeo.dispose();
    frondBase.leafletLightGeo.dispose();
    frondBase.leafletRichGeo.dispose();

    return {
      trunkGeo: mergeGeos(trunkGeos),
      trunkRingGeo: mergeGeos(ringGeos),
      planterStoneGeo: mergeGeos(planterStoneGeos),
      planterSoilGeo: mergeGeos(planterSoilGeos),
      dateStalkGeo: mergeGeos(stalkGeos),
      dateClusterGeo: mergeGeos(dateGeos),
      crowns: crownSpecs,
    };
  }, []);

  // Gentle breeze animation across palm crowns
  useFrame((state) => {
    if (!crownsGroupRef.current) return;
    const t = state.clock.getElapsedTime();
    const children = crownsGroupRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const spec = crowns[i];
      if (!spec) continue;
      child.rotation.z = Math.sin(t * 0.85 + spec.seed * 0.37) * 0.042;
      child.rotation.x = Math.cos(t * 0.68 + spec.seed * 0.53) * 0.036;
    }
  });

  return (
    <group>
      {/* Stone Planter Curbs at Palm Tree Bases */}
      <mesh geometry={planterStoneGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#C8AC88" roughness={0.85} />
      </mesh>
      <mesh geometry={planterSoilGeo} receiveShadow>
        <meshStandardMaterial color="#4A3522" roughness={0.95} />
      </mesh>

      {/* Merged Smoothly Curved Fibrous Date-Palm Trunks */}
      <mesh geometry={trunkGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#82603E" roughness={0.86} />
      </mesh>

      {/* Merged Diamond-Cut Bark Rings & Crown Shafts */}
      <mesh geometry={trunkRingGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#5E4227" roughness={0.92} />
      </mesh>

      {/* Golden-Orange Date Stalks */}
      <mesh geometry={dateStalkGeo} castShadow>
        <meshStandardMaterial color="#D67E1C" roughness={0.62} />
      </mesh>

      {/* Hanging Golden-Amber Date Clusters */}
      <mesh geometry={dateClusterGeo} castShadow>
        <meshStandardMaterial
          color="#E59A24"
          emissive="#5c3306"
          emissiveIntensity={0.18}
          roughness={0.42}
        />
      </mesh>

      {/* Lush 3-Tone Pinnate Palm Crowns */}
      <group ref={crownsGroupRef}>
        {crowns.map((crown, idx) => (
          <group key={`palm-crown-${idx}`} position={crown.position}>
            <mesh geometry={crown.stemGeo} castShadow>
              <meshStandardMaterial color="#56852E" roughness={0.72} />
            </mesh>
            <mesh geometry={crown.sunlitGeo} castShadow receiveShadow>
              <meshStandardMaterial
                color="#6AB53A"
                roughness={0.62}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh geometry={crown.lightGeo} castShadow receiveShadow>
              <meshStandardMaterial
                color="#4B9630"
                roughness={0.66}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh geometry={crown.richGeo} castShadow receiveShadow>
              <meshStandardMaterial
                color="#317020"
                roughness={0.72}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
