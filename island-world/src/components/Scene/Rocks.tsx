import { useMemo } from 'react';
import * as THREE from 'three';

const noise = (x: number, y: number, z: number) => {
  return (
    Math.sin(x * 4.5) * 0.1 +
    Math.sin(y * 4.1) * 0.1 +
    Math.sin(z * 4.3) * 0.1
  );
};

export default function Rocks() {
  const rocks = useMemo(() => {
    const rockData = [
      { pos: [-1.2, 0.1, 0.5], scale: 0.5, color: '#d5cdc0' },
      { pos: [-1.5, 0.05, -0.2], scale: 0.4, color: '#c8c0b0' },
      { pos: [-1.0, 0.15, -0.8], scale: 0.45, color: '#cfc6b8' },
      { pos: [-0.6, 0.0, -1.2], scale: 0.25, color: '#d0c8b8' },
      { pos: [1.2, 0.05, -0.5], scale: 0.3, color: '#c8c0b0' },
      { pos: [1.0, -0.05, -1.0], scale: 0.2, color: '#d5cdc0' },
    ];

    return rockData.map((data, index) => {
      const geom = new THREE.IcosahedronGeometry(data.scale, 2);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, i);
        const n = noise(v.x + index, v.y + index, v.z + index);
        v.add(v.clone().normalize().multiplyScalar(n));
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geom.computeVertexNormals();

      return {
        geom,
        ...data,
      };
    });
  }, []);

  return (
    <group>
      {rocks.map((rock, i) => (
        <mesh
          key={i}
          geometry={rock.geom}
          position={new THREE.Vector3(...rock.pos)}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={rock.color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
