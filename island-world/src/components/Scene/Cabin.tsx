import React, { useMemo } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

type CabinProps = ThreeElements['group'] & {
  position?: [number, number, number];
  onPointerOver?: (e: unknown) => void;
  onPointerOut?: (e: unknown) => void;
  hovered?: boolean;
};

const WALL_COLOR_BASE = new THREE.Color('#89ccc8');

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const Cabin: React.FC<CabinProps> = ({ position = [0.3, 0.45, 0], hovered, ...props }) => {
  // Colors
  const roofColor = '#c45a3c';
  const doorColor = '#c44a2a';
  const windowGlass = '#1a3a3a';
  const bushColor = '#5a7a4a';

  const emissiveColor = hovered ? new THREE.Color('#ffffff') : new THREE.Color('#000000');
  const emissiveIntensity = hovered ? 0.1 : 0;

  // Generate planks
  const planks = useMemo(() => {
    const p = [];
    const numPlanks = 7;
    const height = 0.7;
    const plankHeight = height / numPlanks;
    
    for (let i = 0; i < numPlanks; i++) {
      // Very subtle variation
      const hueShift = (pseudoRandom(i * 2 + 1) - 0.5) * 0.02;
      const lightShift = (pseudoRandom(i * 2 + 2) - 0.5) * 0.05;
      
      const c = WALL_COLOR_BASE.clone().offsetHSL(hueShift, 0, lightShift);
      
      p.push({
        y: -height/2 + plankHeight/2 + i * plankHeight,
        color: c
      });
    }
    return p;
  }, []);

  return (
    <group position={position} {...props}>
      {/* Main Body - Planks */}
      <group>
        {planks.map((plank, i) => (
          <mesh 
            key={i} 
            position={[0, plank.y + 0.35, 0]} 
            castShadow 
            receiveShadow
          >
            <boxGeometry args={[1.0, 0.7/7 - 0.01, 0.8]} />
            <meshStandardMaterial 
              color={plank.color} 
              roughness={0.7} 
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        ))}
      </group>

      {/* Roof */}
      <group position={[0, 0.7, 0]}>
        {/* Left pitch */}
        <mesh position={[-0.26, 0.15, 0]} rotation={[0, 0, Math.PI / 6]} castShadow receiveShadow>
            <boxGeometry args={[0.65, 0.05, 0.9]} />
            <meshStandardMaterial color={roofColor} roughness={0.75} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        {/* Right pitch */}
        <mesh position={[0.26, 0.15, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow receiveShadow>
            <boxGeometry args={[0.65, 0.05, 0.9]} />
            <meshStandardMaterial color={roofColor} roughness={0.75} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        {/* Gable filler (front and back) */}
        <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.55, 0.55, 0.78]} />
            <meshStandardMaterial color={WALL_COLOR_BASE} roughness={0.7} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
      </group>

      {/* Door */}
      <group position={[0, 0.25, 0.41]}>
        {/* Frame */}
        <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.26, 0.46, 0.02]} />
            <meshStandardMaterial color="#6aaaa6" roughness={0.7} />
        </mesh>
        {/* Door */}
        <mesh position={[0, 0, 0.01]} castShadow>
          <boxGeometry args={[0.22, 0.42, 0.02]} />
          <meshStandardMaterial color={doorColor} roughness={0.7} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.07, 0, 0.025]} castShadow>
          <sphereGeometry args={[0.015]} />
          <meshStandardMaterial color="#333333" roughness={0.5} />
        </mesh>
      </group>

      {/* Window */}
      <group position={[-0.25, 0.35, 0.41]}>
        {/* Frame */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.02]} />
          <meshStandardMaterial color="#6aaaa6" roughness={0.7} />
        </mesh>
        {/* Glass */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshStandardMaterial color={windowGlass} transparent opacity={0.8} />
        </mesh>
        {/* Dividers */}
        <mesh position={[0, 0, 0.015]} castShadow>
          <boxGeometry args={[0.18, 0.015, 0.01]} />
          <meshStandardMaterial color="#6aaaa6" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.015]} castShadow>
          <boxGeometry args={[0.015, 0.18, 0.01]} />
          <meshStandardMaterial color="#6aaaa6" roughness={0.7} />
        </mesh>
      </group>

      {/* Steps */}
      <mesh position={[0, 0.025, 0.46]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 0.05, 0.15]} />
        <meshStandardMaterial color="#d8b088" roughness={0.8} />
      </mesh>

      {/* Bushes */}
      <mesh position={[-0.55, 0.15, 0.2]} castShadow receiveShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={bushColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.45, 0.1, 0.35]} castShadow receiveShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={bushColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.12, 0.1]} castShadow receiveShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={bushColor} roughness={0.9} />
      </mesh>
    </group>
  );
};

export default Cabin;
