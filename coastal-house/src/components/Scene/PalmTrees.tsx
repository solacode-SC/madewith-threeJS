import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 4.141) * 43758.5453;
  return x - Math.floor(x);
};

interface SinglePalmProps {
  position: [number, number, number];
  controlPoints: [number, number, number][];
  trunkRadiusBottom: number;
  trunkRadiusTop: number;
  crownScale: number;
  timeOffset: number;
}

function SinglePalm({
  position,
  controlPoints,
  trunkRadiusBottom,
  trunkRadiusTop,
  crownScale,
  timeOffset,
}: SinglePalmProps) {
  const crownRef = useRef<THREE.Group>(null);

  const { trunkSegments, topPos } = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(
      controlPoints.map((pt) => new THREE.Vector3(pt[0], pt[1], pt[2]))
    );
    const segs = 28;
    const rings: {
      pos: [number, number, number];
      quat: [number, number, number, number];
      rBottom: number;
      rTop: number;
      len: number;
      color: string;
    }[] = [];

    for (let i = 0; i < segs; i++) {
      const t0 = i / segs;
      const t1 = (i + 1) / segs;
      const p0 = c.getPoint(t0);
      const p1 = c.getPoint(t1);
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      const dir = p1.clone().sub(p0);
      const len = dir.length();
      dir.normalize();

      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const rB = THREE.MathUtils.lerp(trunkRadiusBottom, trunkRadiusTop, t0);
      const rT = THREE.MathUtils.lerp(trunkRadiusBottom, trunkRadiusTop, t1) * 1.06;
      const shade = i % 2 === 0 ? '#a99987' : '#968573';

      rings.push({
        pos: [mid.x, mid.y, mid.z],
        quat: [quat.x, quat.y, quat.z, quat.w],
        rBottom: rB,
        rTop: rT,
        len: len * 1.08,
        color: shade,
      });
    }

    const top = c.getPoint(1);
    return {
      trunkSegments: rings,
      topPos: [top.x, top.y, top.z] as [number, number, number],
    };
  }, [controlPoints, trunkRadiusBottom, trunkRadiusTop]);

  // Sculpted Curved Palm Frond Geometry + Drooping Brown Skirt Geometry
  const { frondGeo, skirtData, frondData } = useMemo(() => {
    // 1. Curved pleated palm frond blade
    const geo = new THREE.PlaneGeometry(0.42, 1.55, 5, 10);
    geo.translate(0, 0.775, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const normY = y / 1.55; // 0 at base, 1 at tip

      // Wide fan/feather profile in middle, tapering at base and tip
      const widthProfile = Math.sin(normY * Math.PI) * 1.15 + (1 - normY) * 0.25;
      // Pleated V-ridge for realistic shadow catching
      const ridgeZ = Math.abs(x) * 0.22;
      // Graceful downward arch along length
      const archZ = -Math.pow(normY, 1.85) * 0.68;

      pos.setXYZ(i, x * widthProfile, y, archZ + ridgeZ);
    }
    geo.computeVertexNormals();

    // 2. Dried golden-brown petiole skirt under the green crown (signature detail in photo)
    const skirts: { rot: [number, number, number]; scale: number; color: string }[] = [];
    const skirtColors = ['#8c542b', '#a16638', '#73421f', '#b07442'];
    for (let i = 0; i < 18; i++) {
      const yaw = (i / 18) * Math.PI * 2 + pseudoRandom(i * 3) * 0.2;
      const pitch = 2.05 + pseudoRandom(i * 7) * 0.45; // Drooping downward
      skirts.push({
        rot: [pitch, yaw, 0],
        scale: (0.52 + pseudoRandom(i * 11) * 0.2) * crownScale,
        color: skirtColors[i % skirtColors.length],
      });
    }

    // 3. Multi-layered green palm fronds (lower, middle, upper tiers)
    const fronds: {
      rot: [number, number, number];
      scale: number;
      color: string;
      phase: number;
    }[] = [];
    const greenPalette = ['#8cb063', '#9ec274', '#799e51', '#abc982', '#6d9147'];

    const tiers = [
      { count: 10, basePitch: 1.48, scaleMul: 1.05 }, // Outer arching fronds
      { count: 9, basePitch: 1.02, scaleMul: 0.95 },  // Mid-level spreading fronds
      { count: 7, basePitch: 0.52, scaleMul: 0.78 },  // Upper sunlit crown fronds
    ];

    let seedIdx = 1;
    tiers.forEach((tier, tIdx) => {
      for (let i = 0; i < tier.count; i++) {
        const yaw =
          (i / tier.count) * Math.PI * 2 +
          tIdx * 0.45 +
          (pseudoRandom(seedIdx * 5) - 0.5) * 0.25;
        const pitch = tier.basePitch + (pseudoRandom(seedIdx * 9) - 0.5) * 0.22;
        const roll = (pseudoRandom(seedIdx * 13) - 0.5) * 0.2;
        fronds.push({
          rot: [pitch, yaw, roll],
          scale: tier.scaleMul * (0.88 + pseudoRandom(seedIdx * 17) * 0.24) * crownScale,
          color: greenPalette[(seedIdx + tIdx) % greenPalette.length],
          phase: pseudoRandom(seedIdx * 23) * Math.PI * 2,
        });
        seedIdx++;
      }
    });

    return { frondGeo: geo, skirtData: skirts, frondData: fronds };
  }, [crownScale]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + timeOffset;
    if (crownRef.current) {
      crownRef.current.rotation.z = Math.sin(t * 0.9) * 0.028;
      crownRef.current.rotation.x = Math.cos(t * 0.7) * 0.02;
    }
  });

  return (
    <group position={position}>
      {/* Ringed Curved Palm Trunk */}
      {trunkSegments.map((seg, idx) => (
        <mesh
          key={idx}
          position={seg.pos}
          quaternion={seg.quat}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[seg.rTop, seg.rBottom, seg.len, 10]} />
          <meshStandardMaterial color={seg.color} roughness={0.92} />
        </mesh>
      ))}

      {/* Crown at Top of Trunk */}
      <group position={topPos} ref={crownRef}>
        {/* Textured Dark Brown Fibrous Core Bulb */}
        <mesh position={[0, -0.08, 0]} castShadow>
          <sphereGeometry args={[0.26 * crownScale, 12, 12]} />
          <meshStandardMaterial color="#593318" roughness={0.95} />
        </mesh>

        {/* Dried Golden-Brown Shaggy Petiole Skirt */}
        {skirtData.map((s, idx) => (
          <group key={`skirt-${idx}`} rotation={[0, s.rot[1], 0]}>
            <mesh
              geometry={frondGeo}
              rotation={[s.rot[0], 0, 0]}
              scale={[s.scale * 0.75, s.scale, s.scale * 0.75]}
              castShadow
            >
              <meshStandardMaterial
                color={s.color}
                roughness={0.88}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* Lush Sunlit Green Fan/Feather Fronds */}
        {frondData.map((f, idx) => (
          <group key={`frond-${idx}`} rotation={[0, f.rot[1], f.rot[2]]}>
            <mesh
              geometry={frondGeo}
              rotation={[f.rot[0], 0, 0]}
              scale={[f.scale, f.scale, f.scale]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={f.color}
                roughness={0.68}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export default function PalmTrees() {
  return (
    <group>
      {/* Left Palm Tree (curving gently left behind the citrus pot, matching Picture 1) */}
      <SinglePalm
        position={[-2.15, 0, 0.15]}
        controlPoints={[
          [0, 0, 0],
          [-0.08, 1.1, -0.04],
          [-0.24, 2.2, -0.08],
          [-0.42, 3.25, -0.1],
        ]}
        trunkRadiusBottom={0.13}
        trunkRadiusTop={0.085}
        crownScale={0.92}
        timeOffset={0}
      />

      {/* Right Taller Palm Tree (rising high on the right side above the stepped roof, matching Picture 1) */}
      <SinglePalm
        position={[2.05, 0, 0.25]}
        controlPoints={[
          [0, 0, 0],
          [0.05, 1.4, -0.02],
          [0.02, 2.9, -0.05],
          [-0.06, 4.35, -0.08],
        ]}
        trunkRadiusBottom={0.15}
        trunkRadiusTop={0.095}
        crownScale={1.14}
        timeOffset={1.7}
      />
    </group>
  );
}
