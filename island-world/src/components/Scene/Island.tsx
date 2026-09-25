import { useMemo } from 'react';
import * as THREE from 'three';

const noise = (x: number, y: number, z: number) => {
  return (
    Math.sin(x * 2.5) * 0.1 +
    Math.sin(y * 3.1) * 0.1 +
    Math.sin(z * 2.3) * 0.1 +
    Math.sin(x * 5 + z * 5) * 0.05
  );
};

export default function Island() {
  const { rockGeometry, sandGeometry } = useMemo(() => {
    // Base rocky formation
    const rockGeom = new THREE.SphereGeometry(1.5, 32, 32);
    const rockPos = rockGeom.attributes.position;
    for (let i = 0; i < rockPos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(rockPos, i);
      v.y *= 0.4; // Flatten
      const n = noise(v.x, v.y, v.z);
      v.add(v.clone().normalize().multiplyScalar(n * 2));
      rockPos.setXYZ(i, v.x, v.y, v.z);
    }
    rockGeom.computeVertexNormals();

    // Sandy surface
    const sandGeom = new THREE.SphereGeometry(1.55, 32, 32);
    const sandPos = sandGeom.attributes.position;
    for (let i = 0; i < sandPos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(sandPos, i);
      v.y *= 0.35; // Flatten slightly more
      v.y += 0.1; // Shift up slightly
      const n = noise(v.x, v.y, v.z);
      v.add(v.clone().normalize().multiplyScalar(n * 2.1));
      sandPos.setXYZ(i, v.x, v.y, v.z);
    }
    sandGeom.computeVertexNormals();

    return { rockGeometry: rockGeom, sandGeometry: sandGeom };
  }, []);

  return (
    <group position={[0, -0.1, 0]}>
      <mesh geometry={rockGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#c5b8a0" roughness={0.8} />
      </mesh>
      <mesh geometry={sandGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#f5e6c8" roughness={0.9} />
      </mesh>
    </group>
  );
}
