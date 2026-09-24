import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Group } from 'three';

interface PalmTreesProps {
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  hovered?: boolean;
}

export default function PalmTrees({ onPointerOver, onPointerOut, hovered }: PalmTreesProps) {
  // Tree 1 Trunk Curve (leaning left)
  const curve1 = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.2, 1, 0.1),
      new THREE.Vector3(-0.6, 2, 0.2),
      new THREE.Vector3(-1.2, 3.5, 0.3)
    ]);
  }, []);

  // Tree 2 Trunk Curve (leaning right and forward)
  const curve2 = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.1, 1, 0.2),
      new THREE.Vector3(0.3, 2, 0.5),
      new THREE.Vector3(0.5, 3.2, 0.8)
    ]);
  }, []);

  return (
    <group onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <PalmTree 
        position={[-0.5, 0.3, -0.2]} 
        curve={curve1} 
        leafCount={7} 
        timeOffset={0}
      />
      <PalmTree 
        position={[-0.2, 0.3, -0.3]} 
        curve={curve2} 
        leafCount={8} 
        timeOffset={1.5}
      />
    </group>
  );
}

function PalmTree({ 
  position, 
  curve, 
  leafCount,
  timeOffset
}: { 
  position: [number, number, number], 
  curve: THREE.CatmullRomCurve3,
  leafCount: number,
  timeOffset: number
}) {
  const treeGroupRef = useRef<Group>(null);
  const leavesRef = useRef<Group>(null);
  const topPoint = curve.getPoint(1);

  // Generate trunk with vertex colors
  const trunkGeo = useMemo(() => {
    const geo = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const color1 = new THREE.Color('#8b6914');
    const color2 = new THREE.Color('#7a5c10');
    
    // The TubeGeometry vertices are ordered such that all radial vertices for a given segment are contiguous
    // 21 segment loops, each with 8+1 = 9 vertices (due to duplication at seam) -> actually 8 radial segments usually means 9 vertices if closed loop, or 8 depending on three.js version.
    // We can just rely on vertex index
    for (let i = 0; i < count; i++) {
      const segmentIndex = Math.floor(i / 9); // approximate
      const useColor1 = segmentIndex % 4 < 2;
      const col = useColor1 ? color1 : color2;
      
      // add slight random variation
      const rVar = (Math.random() - 0.5) * 0.05;
      
      colors[i * 3] = col.r + rVar;
      colors[i * 3 + 1] = col.g + rVar;
      colors[i * 3 + 2] = col.b + rVar;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [curve]);

  // Generate fronds
  const fronds = useMemo(() => {
    const arr = [];
    const colors = ['#c4952a', '#b8891e', '#d4a030'];
    
    // Custom leaf geometry
    const leafGeo = new THREE.PlaneGeometry(0.3, 1.8, 4, 8);
    // Deform leaf to curve downward
    const pos = leafGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      
      // Taper towards the tip (y = 0.9)
      const taper = 1 - Math.max(0, (y + 0.9) / 1.8);
      // Curve downward (z axis)
      const curveZ = -Math.pow((y + 0.9) / 1.8, 2) * 0.8;
      
      pos.setXYZ(i, x * taper, y, curveZ);
    }
    leafGeo.computeVertexNormals();

    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      arr.push({
        rotation: [0, angle, 0] as [number, number, number],
        color: color,
        phase: Math.random() * Math.PI * 2
      });
    }
    return { leafGeo, data: arr };
  }, [leafCount]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime() + timeOffset;
    
    // Animate leaves
    if (leavesRef.current) {
      leavesRef.current.children.forEach((leaf, i) => {
        const phase = fronds.data[i].phase;
        // Subtle side-to-side and up-down
        const swayY = Math.sin(time * 0.5 + phase) * 0.02;
        const swayZ = Math.cos(time * 0.3 + phase) * 0.03;
        leaf.rotation.x = -Math.PI / 2.2 + swayZ;
        leaf.rotation.z = swayY;
      });
    }

    // Trunk imperceptible sway
    if (treeGroupRef.current) {
      treeGroupRef.current.rotation.x = Math.sin(time * 0.2) * 0.005;
      treeGroupRef.current.rotation.z = Math.cos(time * 0.25) * 0.005;
    }
  });

  return (
    <group position={position} ref={treeGroupRef}>
      {/* Trunk */}
      <mesh geometry={trunkGeo} castShadow receiveShadow>
        <meshStandardMaterial 
          vertexColors={true}
          roughness={0.9}
        />
      </mesh>

      {/* Leaves */}
      <group position={topPoint} ref={leavesRef}>
        {fronds.data.map((frond, i) => (
          <group key={i} rotation={frond.rotation}>
            {/* Shift so base is at origin */}
            <mesh 
              geometry={fronds.leafGeo}
              position={[0, 0.9, 0]}
              castShadow
            >
              <meshStandardMaterial 
                color={frond.color}
                roughness={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
