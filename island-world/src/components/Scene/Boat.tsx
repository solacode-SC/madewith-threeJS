import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BoatProps {
  position?: [number, number, number];
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  onClick?: () => void;
  hovered?: boolean;
}

export default function Boat({ position = [0.8, 0.0, 1.2], onPointerOver, onPointerOut, onClick, hovered }: BoatProps) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.getElapsedTime();
    // Very gentle vertical bobbing
    group.current.position.y = (position[1] || 0) + Math.sin(time * 0.5) * 0.01;
    // Very subtle rotation on Z axis
    group.current.rotation.z = Math.sin(time * 0.3) * 0.015;
    // Slight yaw on Y axis + base angle so it's not perfectly aligned
    group.current.rotation.y = -0.4 + Math.sin(time * 0.2) * 0.01;
  });

  return (
    <group 
      ref={group} 
      position={position} 
      onPointerOver={onPointerOver} 
      onPointerOut={onPointerOut}
      onClick={onClick}
      dispose={null}
    >
      <group position={[0, 0.05, 0]}>
        {/* Outer Hull */}
        <mesh rotation={[Math.PI, 0, 0]} scale={[0.1, 0.1, 0.3]} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hovered ? "#d46a3a" : "#c45a2a"} roughness={0.75} side={THREE.FrontSide} />
        </mesh>

        {/* Inner Hull */}
        <mesh rotation={[Math.PI, 0, 0]} scale={[0.095, 0.095, 0.29]} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#a04820" roughness={0.75} side={THREE.BackSide} />
        </mesh>

        {/* Top Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} scale={[0.105, 0.305, 0.1]} castShadow receiveShadow>
          <torusGeometry args={[1, 0.04, 8, 32]} />
          <meshStandardMaterial color="#8b5a1a" roughness={0.75} />
        </mesh>

        {/* Cross-beams (thwarts) */}
        <mesh position={[0, -0.02, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.17, 0.01, 0.04]} />
          <meshStandardMaterial color="#8b5a1a" roughness={0.75} />
        </mesh>
        
        <mesh position={[0, -0.02, -0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.17, 0.01, 0.04]} />
          <meshStandardMaterial color="#8b5a1a" roughness={0.75} />
        </mesh>
        
        <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.19, 0.01, 0.04]} />
          <meshStandardMaterial color="#8b5a1a" roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
}
