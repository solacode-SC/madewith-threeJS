import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  createStuccoTextures,
  createShopSignTexture,
  createChalkboardTexture,
  createHangingSignTexture,
} from '../../utils/textures';
import type { TimeOfDay } from '../../hooks/useSceneState';

interface CoastalHouseProps {
  timeOfDay: TimeOfDay;
  doorOpen: boolean;
  onToggleDoor: () => void;
  onSelectWindow: () => void;
  onHover: (label: string | null) => void;
}

export default function CoastalHouse({
  timeOfDay,
  doorOpen,
  onToggleDoor,
  onSelectWindow,
  onHover,
}: CoastalHouseProps) {
  const doorPivotRef = useRef<THREE.Group>(null);
  const hangingSignRef = useRef<THREE.Group>(null);

  const stucco = useMemo(() => createStuccoTextures(), []);
  const shopSignTex = useMemo(() => createShopSignTexture(), []);
  const mainChalkTex = useMemo(() => createChalkboardTexture('main'), []);
  const smallChalkTex = useMemo(() => createChalkboardTexture('small'), []);
  const hangingSignTex = useMemo(() => createHangingSignTexture(), []);

  const isGolden = timeOfDay === 'golden';
  const tealColor = '#0d89b3';
  const tealDark = '#096b8c';
  const terracottaTile = '#ee8422';
  const terracottaTileAlt = '#d96e11';
  const terracottaPot = '#d85c27';
  const terracottaPotDark = '#b84718';

  // Animate front door opening/closing and hanging sign swaying in sea breeze
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (doorPivotRef.current) {
      const targetRot = doorOpen ? -Math.PI * 0.58 : 0;
      doorPivotRef.current.rotation.y = THREE.MathUtils.lerp(
        doorPivotRef.current.rotation.y,
        targetRot,
        Math.min(1, delta * 6)
      );
    }
    if (hangingSignRef.current) {
      hangingSignRef.current.rotation.z = Math.sin(t * 1.8) * 0.045;
    }
  });

  // Shared stucco material props
  const stuccoMatProps = {
    map: stucco.map,
    bumpMap: stucco.bumpMap,
    bumpScale: 0.038,
    roughness: 0.88,
    metalness: 0.02,
  };

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================= */}
      {/* 1. MAIN STEPPED MEDITERRANEAN BLUE STUCCO BUILDING BODY   */}
      {/* ========================================================= */}
      <group>
        {/* Left Taller 2-Story Tower Section (stepped roof left side) */}
        <RoundedBox
          args={[1.95, 4.45, 2.6]}
          radius={0.11}
          smoothness={5}
          position={[-0.68, 2.225, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...stuccoMatProps} />
        </RoundedBox>

        {/* Right Lower Section (stepped roof right side) */}
        <RoundedBox
          args={[1.65, 3.65, 2.6]}
          radius={0.11}
          smoothness={5}
          position={[0.82, 1.825, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...stuccoMatProps} />
        </RoundedBox>

        {/* Curved Concave/Fillet Transition at Roof Step */}
        <RoundedBox
          args={[0.38, 0.45, 2.56]}
          radius={0.14}
          smoothness={4}
          position={[0.26, 3.68, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...stuccoMatProps} />
        </RoundedBox>

        {/* Subtle Foundation Base Plinth */}
        <RoundedBox
          args={[3.36, 0.14, 2.66]}
          radius={0.03}
          smoothness={2}
          position={[0, 0.07, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#8ac6d6" roughness={0.92} bumpMap={stucco.bumpMap} bumpScale={0.02} />
        </RoundedBox>

        {/* Rooftop Chimney / Silver Vent Cap on the lower right roof (as in photo) */}
        <group position={[0.58, 3.65, -0.15]}>
          {/* Stucco Chimney Base */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.19, 0.22, 16]} />
            <meshStandardMaterial color="#b5dce6" roughness={0.85} />
          </mesh>
          {/* Metallic Vent Pipe */}
          <mesh position={[0, 0.24, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.16, 16]} />
            <meshStandardMaterial color="#c8d1d6" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Conical Rain Cap */}
          <mesh position={[0, 0.35, 0]} castShadow>
            <coneGeometry args={[0.2, 0.1, 16]} />
            <meshStandardMaterial color="#dfe6e9" roughness={0.35} metalness={0.55} />
          </mesh>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 2. UPPER FLOOR RECESSED TEAL WINDOW & LOUVERED SHUTTER    */}
      {/* ========================================================= */}
      <group position={[-0.78, 3.22, 1.26]}>
        {/* Recessed Stucco Sill & Surround */}
        <RoundedBox args={[0.62, 0.82, 0.12]} radius={0.03} position={[0, 0, -0.02]} receiveShadow>
          <meshStandardMaterial color="#7dbcd0" roughness={0.9} />
        </RoundedBox>

        {/* Warm Interior Room Box Behind Upper Window */}
        <mesh position={[0, 0, -0.06]}>
          <planeGeometry args={[0.48, 0.68]} />
          <meshStandardMaterial
            color="#3a2314"
            emissive="#ff9c3b"
            emissiveIntensity={isGolden ? 0.95 : 0.35}
          />
        </mesh>

        {/* Interior Mini Bookshelves Silhouette */}
        {[-0.14, 0.04, 0.18].map((shelfY, idx) => (
          <group key={idx} position={[0, shelfY, -0.04]}>
            <mesh>
              <boxGeometry args={[0.44, 0.025, 0.04]} />
              <meshStandardMaterial color="#6e4124" />
            </mesh>
            <mesh position={[-0.1, 0.05, 0]}>
              <boxGeometry args={[0.08, 0.08, 0.03]} />
              <meshStandardMaterial color="#d95c27" />
            </mesh>
            <mesh position={[0.05, 0.055, 0]}>
              <boxGeometry args={[0.11, 0.09, 0.03]} />
              <meshStandardMaterial color="#e6b84c" />
            </mesh>
          </group>
        ))}

        {/* Teal Outer Frame */}
        {/* Top / Bottom / Left / Right Frame Bars */}
        <mesh position={[0, 0.35, 0.02]} castShadow>
          <boxGeometry args={[0.54, 0.055, 0.06]} />
          <meshStandardMaterial color={tealColor} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.35, 0.02]} castShadow>
          <boxGeometry args={[0.56, 0.065, 0.08]} />
          <meshStandardMaterial color={tealColor} roughness={0.55} />
        </mesh>
        <mesh position={[-0.24, 0, 0.02]} castShadow>
          <boxGeometry args={[0.055, 0.74, 0.06]} />
          <meshStandardMaterial color={tealColor} roughness={0.55} />
        </mesh>
        <mesh position={[0.24, 0, 0.02]} castShadow>
          <boxGeometry args={[0.055, 0.74, 0.06]} />
          <meshStandardMaterial color={tealColor} roughness={0.55} />
        </mesh>
        {/* Center Vertical & Horizontal Mullions */}
        <mesh position={[-0.02, 0, 0.015]}>
          <boxGeometry args={[0.03, 0.68, 0.04]} />
          <meshStandardMaterial color={tealColor} roughness={0.55} />
        </mesh>
        {[-0.16, 0.0, 0.16].map((barY, i) => (
          <mesh key={i} position={[-0.02, barY, 0.015]}>
            <boxGeometry args={[0.44, 0.025, 0.035]} />
            <meshStandardMaterial color={tealColor} roughness={0.55} />
          </mesh>
        ))}

        {/* Window Glass */}
        <mesh position={[0, 0, 0.0]}>
          <planeGeometry args={[0.46, 0.66]} />
          <meshPhysicalMaterial
            color="#a8dce8"
            transparent
            opacity={0.38}
            roughness={0.1}
            metalness={0.1}
            reflectivity={0.9}
          />
        </mesh>

        {/* Right Side Louvered Teal Shutter (iconic detail in photo) */}
        <group position={[0.14, 0, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.21, 0.7, 0.035]} />
            <meshStandardMaterial color={tealColor} roughness={0.5} />
          </mesh>
          {Array.from({ length: 11 }).map((_, idx) => (
            <mesh
              key={idx}
              position={[0, -0.28 + idx * 0.056, 0.018]}
              rotation={[0.35, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.16, 0.022, 0.015]} />
              <meshStandardMaterial color="#1599c7" roughness={0.55} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ========================================================= */}
      {/* 3. GROUND FLOOR LEFT: ARCHED "SUMOMALO COFFEE" SHOPFRONT  */}
      {/* ========================================================= */}
      <group
        position={[-0.82, 1.24, 1.25]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('Sumomalo Coffee Window — Click to Inspect');
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectWindow();
        }}
      >
        {/* Cozy 3D Cafe Interior Box Recessed Behind the Window */}
        <group position={[0, 0.04, -0.28]}>
          {/* Interior Back Wall */}
          <mesh position={[0, 0.1, -0.35]}>
            <planeGeometry args={[1.15, 1.75]} />
            <meshStandardMaterial color="#8c5834" roughness={0.85} />
          </mesh>
          {/* Interior Side Walls */}
          <mesh position={[-0.52, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.7, 1.75]} />
            <meshStandardMaterial color="#a66c43" roughness={0.85} />
          </mesh>
          <mesh position={[0.52, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.7, 1.75]} />
            <meshStandardMaterial color="#a66c43" roughness={0.85} />
          </mesh>

          {/* Warm Interior Cafe Glow PointLight */}
          <pointLight
            position={[0, 0.45, -0.05]}
            color="#ff9f38"
            intensity={isGolden ? 2.6 : 1.35}
            distance={3.2}
            decay={2}
          />

          {/* Hanging Interior Pendant Lamp */}
          <mesh position={[0, 0.58, -0.05]}>
            <coneGeometry args={[0.11, 0.09, 16]} />
            <meshStandardMaterial color="#d9822b" emissive="#ff9f38" emissiveIntensity={0.8} />
          </mesh>

          {/* Wooden Coffee Shelves & Canisters on Back Wall */}
          {[-0.02, 0.22, 0.44].map((sy, sIdx) => (
            <group key={sIdx} position={[0, sy, -0.26]}>
              <mesh>
                <boxGeometry args={[0.88, 0.03, 0.14]} />
                <meshStandardMaterial color="#5c361e" roughness={0.8} />
              </mesh>
              {/* Coffee Jars & Tins */}
              {[-0.32, -0.18, -0.04, 0.12, 0.28].map((jx, jIdx) => {
                const colors = ['#d94e34', '#e8a838', '#1488b0', '#f0e6d2', '#7a9e4b'];
                const col = colors[(sIdx * 3 + jIdx) % colors.length];
                return (
                  <mesh key={jIdx} position={[jx, 0.065, 0]}>
                    <cylinderGeometry args={[0.038, 0.038, 0.095, 10]} />
                    <meshStandardMaterial color={col} roughness={0.5} />
                  </mesh>
                );
              })}
            </group>
          ))}

          {/* Front Window Display Counter with Pastries & Espresso Gear */}
          <mesh position={[0, -0.35, 0.08]}>
            <boxGeometry args={[0.92, 0.26, 0.32]} />
            <meshStandardMaterial color="#c98b56" roughness={0.75} />
          </mesh>
          {/* Display Tins & Pastry Boxes in the Window */}
          <mesh position={[-0.25, -0.16, 0.12]}>
            <boxGeometry args={[0.16, 0.14, 0.12]} />
            <meshStandardMaterial color="#e04f33" roughness={0.6} />
          </mesh>
          <mesh position={[0.0, -0.17, 0.14]}>
            <boxGeometry args={[0.22, 0.11, 0.14]} />
            <meshStandardMaterial color="#f5d284" roughness={0.65} />
          </mesh>
          <mesh position={[0.25, -0.15, 0.11]}>
            <cylinderGeometry args={[0.07, 0.07, 0.15, 12]} />
            <meshStandardMaterial color="#1288b2" roughness={0.4} />
          </mesh>
        </group>

        {/* Protruding Stucco Windowsill */}
        <RoundedBox
          args={[1.08, 0.09, 0.22]}
          radius={0.025}
          position={[0, -0.56, 0.07]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#a9e0ee" roughness={0.85} />
        </RoundedBox>

        {/* Teal Rectangular Lower Window Frame */}
        <mesh position={[-0.45, -0.02, 0.04]} castShadow>
          <boxGeometry args={[0.075, 1.04, 0.09]} />
          <meshStandardMaterial color={tealColor} roughness={0.5} />
        </mesh>
        <mesh position={[0.45, -0.02, 0.04]} castShadow>
          <boxGeometry args={[0.075, 1.04, 0.09]} />
          <meshStandardMaterial color={tealColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.5, 0.04]} castShadow>
          <boxGeometry args={[0.96, 0.07, 0.09]} />
          <meshStandardMaterial color={tealColor} roughness={0.5} />
        </mesh>

        {/* Horizontal Transom Bar Between Arch & Main Display Window */}
        <mesh position={[0, 0.48, 0.045]} castShadow>
          <boxGeometry args={[0.96, 0.075, 0.095]} />
          <meshStandardMaterial color={tealColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.56, 0.045]} castShadow>
          <boxGeometry args={[0.92, 0.035, 0.09]} />
          <meshStandardMaterial color={tealDark} roughness={0.5} />
        </mesh>

        {/* Semicircular Teal Arch Frame */}
        <mesh position={[0, 0.48, 0.04]} castShadow>
          <torusGeometry args={[0.45, 0.042, 12, 32, Math.PI]} />
          <meshStandardMaterial color={tealColor} roughness={0.5} />
        </mesh>

        {/* Outer Recessed Stucco Arch Brow */}
        <mesh position={[0, 0.48, 0.06]} castShadow>
          <torusGeometry args={[0.505, 0.03, 10, 32, Math.PI]} />
          <meshStandardMaterial color="#7dc2d6" roughness={0.88} />
        </mesh>

        {/* Arched Glass Transom with "SUMOMALO COFFEE" Vintage Gold Lettering */}
        <mesh position={[0, 0.48, 0.03]}>
          <circleGeometry args={[0.44, 32, 0, Math.PI]} />
          <meshStandardMaterial
            color="#124e63"
            roughness={0.25}
            transparent
            opacity={0.88}
          />
        </mesh>
        <mesh position={[0, 0.69, 0.038]}>
          <planeGeometry args={[0.82, 0.42]} />
          <meshBasicMaterial map={shopSignTex} transparent depthWrite={false} />
        </mesh>

        {/* Clear Glass Pane for Main Shop Window */}
        <mesh position={[0, -0.02, 0.03]}>
          <planeGeometry args={[0.84, 0.94]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.22}
            roughness={0.08}
            reflectivity={0.95}
          />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 4. TERRACOTTA BARREL-TILE AWNING & TEAL PANELED DOOR      */}
      {/* ========================================================= */}
      <group position={[0.64, 0, 1.28]}>
        {/* Terracotta Curved Barrel-Tile Canopy Awning */}
        <group position={[0, 2.02, 0.16]}>
          {/* Awning Under-Structure & Cream Scalloped Valance */}
          <mesh position={[0, -0.04, 0]} rotation={[0.28, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.26, 0.06, 0.52]} />
            <meshStandardMaterial color="#f5ebd6" roughness={0.75} />
          </mesh>

          {/* Cream Scalloped Cones Along Front Edge (matching the photo's white under-tiles) */}
          {Array.from({ length: 9 }).map((_, idx) => {
            const xPos = -0.54 + idx * 0.135;
            return (
              <group key={idx} position={[xPos, 0, 0]}>
                {/* Upper Sloped Orange Barrel Tile */}
                <mesh
                  position={[0, 0.04, -0.01]}
                  rotation={[Math.PI / 2 + 0.3, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <cylinderGeometry args={[0.052, 0.058, 0.52, 12, 1, false, 0, Math.PI]} />
                  <meshStandardMaterial
                    color={idx % 2 === 0 ? terracottaTile : terracottaTileAlt}
                    roughness={0.62}
                  />
                </mesh>
                {/* Ridge Cap Barrel Tile Layer */}
                <mesh
                  position={[0, 0.1, -0.12]}
                  rotation={[Math.PI / 2 + 0.32, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry args={[0.048, 0.052, 0.28, 12, 1, false, 0, Math.PI]} />
                  <meshStandardMaterial color={terracottaTile} roughness={0.6} />
                </mesh>
                {/* White/Cream Mortar End Plug at Front Lip */}
                <mesh position={[0, -0.04, 0.23]} rotation={[0.3, 0, 0]}>
                  <sphereGeometry args={[0.044, 10, 10]} />
                  <meshStandardMaterial color="#faeed7" roughness={0.8} />
                </mesh>
              </group>
            );
          })}

          {/* Small Side Brackets Under Awning */}
          {[-0.58, 0.58].map((bx, i) => (
            <mesh key={i} position={[bx, -0.14, -0.08]} castShadow>
              <boxGeometry args={[0.05, 0.18, 0.24]} />
              <meshStandardMaterial color="#d8eef5" roughness={0.8} />
            </mesh>
          ))}
        </group>

        {/* Warm Interior Hallway Behind Front Door (visible through glass or when door opens) */}
        <group position={[0, 1.0, -0.18]}>
          <mesh position={[0, 0, -0.25]}>
            <planeGeometry args={[0.92, 1.9]} />
            <meshStandardMaterial
              color="#7a4928"
              emissive="#ff9933"
              emissiveIntensity={isGolden ? 0.75 : 0.3}
            />
          </mesh>
          <pointLight
            position={[0, 0.5, -0.05]}
            color="#ff9d3b"
            intensity={isGolden ? 1.8 : 0.8}
            distance={2.5}
          />
        </group>

        {/* Outer Teal Door Frame */}
        <mesh position={[-0.43, 1.02, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 1.88, 0.1]} />
          <meshStandardMaterial color={tealDark} roughness={0.55} />
        </mesh>
        <mesh position={[0.43, 1.02, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 1.88, 0.1]} />
          <meshStandardMaterial color={tealDark} roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.92, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.94, 0.08, 0.1]} />
          <meshStandardMaterial color={tealDark} roughness={0.55} />
        </mesh>

        {/* Interactive Hinged Teal Front Door */}
        <group
          ref={doorPivotRef}
          position={[0.38, 1.0, 0.02]}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(doorOpen ? 'Front Door — Click to Close' : 'Front Door — Click to Open');
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDoor();
          }}
        >
          <group position={[-0.38, 0, 0]}>
            {/* Door Outer Stiles & Rails */}
            <mesh position={[-0.33, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.11, 1.78, 0.055]} />
              <meshStandardMaterial color={tealColor} roughness={0.5} />
            </mesh>
            <mesh position={[0.33, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.11, 1.78, 0.055]} />
              <meshStandardMaterial color={tealColor} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.81, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.76, 0.16, 0.055]} />
              <meshStandardMaterial color={tealColor} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.04, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.76, 0.14, 0.055]} />
              <meshStandardMaterial color={tealColor} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.82, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.76, 0.14, 0.055]} />
              <meshStandardMaterial color={tealColor} roughness={0.5} />
            </mesh>

            {/* Lower Half: Two Vertical Recessed Wood Panels */}
            <mesh position={[0, -0.43, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.62, 0.68, 0.035]} />
              <meshStandardMaterial color={tealDark} roughness={0.55} />
            </mesh>
            <mesh position={[-0.14, -0.43, 0.012]} castShadow>
              <boxGeometry args={[0.21, 0.56, 0.025]} />
              <meshStandardMaterial color="#1496c4" roughness={0.5} />
            </mesh>
            <mesh position={[0.14, -0.43, 0.012]} castShadow>
              <boxGeometry args={[0.21, 0.56, 0.025]} />
              <meshStandardMaterial color="#1496c4" roughness={0.5} />
            </mesh>

            {/* Upper Half: 6-Pane Window Grid + Arched Top Header */}
            <mesh position={[0, 0.39, 0]}>
              <planeGeometry args={[0.56, 0.72]} />
              <meshPhysicalMaterial
                color="#ffdfad"
                transparent
                opacity={0.35}
                roughness={0.12}
              />
            </mesh>
            {/* Vertical & Horizontal Window Bars on Door */}
            <mesh position={[0, 0.39, 0.015]}>
              <boxGeometry args={[0.03, 0.72, 0.03]} />
              <meshStandardMaterial color={tealColor} roughness={0.5} />
            </mesh>
            {[0.22, 0.48].map((gy, idx) => (
              <mesh key={idx} position={[0, gy, 0.015]}>
                <boxGeometry args={[0.56, 0.03, 0.03]} />
                <meshStandardMaterial color={tealColor} roughness={0.5} />
              </mesh>
            ))}

            {/* Brass/Bronze Lever Door Handle on Left Side */}
            <group position={[-0.29, -0.05, 0.038]}>
              <mesh>
                <boxGeometry args={[0.035, 0.14, 0.015]} />
                <meshStandardMaterial color="#3d2f24" metalness={0.7} roughness={0.35} />
              </mesh>
              <mesh position={[0.03, 0.02, 0.02]}>
                <boxGeometry args={[0.08, 0.022, 0.02]} />
                <meshStandardMaterial color="#c4933f" metalness={0.8} roughness={0.25} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Whitewashed Stone Threshold Step in Front of Door */}
        <RoundedBox
          args={[0.98, 0.11, 0.32]}
          radius={0.03}
          position={[0, 0.055, 0.16]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#e8e4da" roughness={0.9} />
        </RoundedBox>
      </group>

      {/* ========================================================= */}
      {/* 5. VINTAGE WALL LANTERN, A-FRAME CHALKBOARD & WALL SHELF  */}
      {/* ========================================================= */}
      {/* Vintage Wall Sconce Lantern between window and door */}
      <group position={[-0.1, 1.56, 1.32]}>
        {/* Iron Wall Mount */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.05, 0.12, 0.03]} />
          <meshStandardMaterial color="#2b2623" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.09, 0.06]} castShadow>
          <boxGeometry args={[0.025, 0.025, 0.12]} />
          <meshStandardMaterial color="#2b2623" roughness={0.5} metalness={0.6} />
        </mesh>
        {/* Lantern Cap & Warm Glowing Bulb */}
        <mesh position={[0, 0.04, 0.11]} castShadow>
          <coneGeometry args={[0.085, 0.06, 6]} />
          <meshStandardMaterial color="#2b2623" roughness={0.45} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.03, 0.11]}>
          <cylinderGeometry args={[0.058, 0.042, 0.11, 6]} />
          <meshStandardMaterial
            color="#ffcb6b"
            emissive="#ff9d2e"
            emissiveIntensity={isGolden ? 2.4 : 1.2}
          />
        </mesh>
        <pointLight
          position={[0, -0.04, 0.18]}
          color="#ffa834"
          intensity={isGolden ? 1.8 : 0.65}
          distance={3.0}
          decay={2}
        />
      </group>

      {/* Wooden A-Frame Chalkboard Menu Sign + Small Pot on Top */}
      <group position={[-0.1, 0, 1.5]}>
        {/* Front Chalkboard Panel */}
        <group position={[0, 0.34, 0.05]} rotation={[-0.12, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.56, 0.03]} />
            <meshStandardMaterial color="#c88d51" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0, 0.017]}>
            <planeGeometry args={[0.35, 0.46]} />
            <meshBasicMaterial map={mainChalkTex} />
          </mesh>
        </group>
        {/* Back Support Frame */}
        <mesh position={[0, 0.34, -0.05]} rotation={[0.14, 0, 0]} castShadow>
          <boxGeometry args={[0.4, 0.56, 0.025]} />
          <meshStandardMaterial color="#b57b42" roughness={0.8} />
        </mesh>
        {/* Small Terracotta Pot Perched Above Chalkboard (as in reference photo) */}
        <group position={[0, 0.64, -0.02]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.055, 0.13, 12]} />
            <meshStandardMaterial color="#d9895b" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.16, 0]} castShadow>
            <sphereGeometry args={[0.085, 10, 10]} />
            <meshStandardMaterial color="#5c873a" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* Right-of-Door Yellow Menu Plaque, Mini Shelf & Bakery Basket Stand */}
      <group position={[1.34, 0, 1.31]}>
        {/* Yellow/Orange Rounded Wall Sign Plaque */}
        <RoundedBox args={[0.34, 0.24, 0.03]} radius={0.02} position={[0, 1.28, 0.01]} castShadow>
          <meshStandardMaterial color="#f5a623" roughness={0.55} />
        </RoundedBox>
        <mesh position={[-0.06, 1.31, 0.028]}>
          <boxGeometry args={[0.14, 0.08, 0.01]} />
          <meshStandardMaterial color="#d94e28" roughness={0.6} />
        </mesh>

        {/* Small Floating Shelf with Mini Coffee Tins */}
        <mesh position={[0, 0.92, 0.05]} castShadow>
          <boxGeometry args={[0.32, 0.025, 0.1]} />
          <meshStandardMaterial color="#e8b94f" roughness={0.65} />
        </mesh>
        {[-0.09, 0, 0.09].map((tx, idx) => (
          <mesh key={idx} position={[tx, 0.965, 0.05]} castShadow>
            <cylinderGeometry args={[0.026, 0.024, 0.065, 10]} />
            <meshStandardMaterial
              color={idx === 0 ? '#d94e28' : idx === 1 ? '#f5efe2' : '#168ab3'}
              roughness={0.45}
            />
          </mesh>
        ))}

        {/* Small Wooden Stand with Pastry Baskets & Mini Chalkboard at Base */}
        <group position={[-0.02, 0, 0.18]}>
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.38, 0.26]} />
            <meshStandardMaterial color="#d49553" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.18, 0.135]}>
            <planeGeometry args={[0.32, 0.26]} />
            <meshBasicMaterial map={smallChalkTex} />
          </mesh>
          {/* Golden Woven Pastry Basket on Top */}
          <mesh position={[0.05, 0.44, 0]} castShadow>
            <boxGeometry args={[0.26, 0.11, 0.2]} />
            <meshStandardMaterial color="#e09f41" roughness={0.8} />
          </mesh>
          <mesh position={[-0.12, 0.43, 0.02]} castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.09, 10]} />
            <meshStandardMaterial color="#78a84b" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 6. TERRACOTTA FLOWER POTS & MEDITERRANEAN PLANTS          */}
      {/* ========================================================= */}
      {/* Far Left: Large Terracotta Planter with Lush Citrus/Orange Tree */}
      <group position={[-1.72, 0, 1.48]}>
        {/* Pot Body & Rim */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.16, 0.44, 18]} />
          <meshStandardMaterial color={terracottaPot} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.41, 0]} castShadow>
          <cylinderGeometry args={[0.265, 0.25, 0.065, 18]} />
          <meshStandardMaterial color={terracottaPot} roughness={0.7} />
        </mesh>
        {/* Woody Stems */}
        <mesh position={[-0.03, 0.58, 0]} rotation={[0, 0, 0.15]} castShadow>
          <cylinderGeometry args={[0.025, 0.04, 0.45, 8]} />
          <meshStandardMaterial color="#6e4b32" roughness={0.9} />
        </mesh>
        <mesh position={[0.04, 0.56, 0.02]} rotation={[0, 0, -0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.035, 0.4, 8]} />
          <meshStandardMaterial color="#6e4b32" roughness={0.9} />
        </mesh>
        {/* Lush Green Foliage Clusters */}
        {[
          [0, 0.85, 0, 0.24, '#5a8238'],
          [-0.18, 0.78, 0.06, 0.19, '#699442'],
          [0.19, 0.76, 0.05, 0.18, '#4e752f'],
          [-0.08, 0.98, -0.04, 0.17, '#75a14c'],
          [0.12, 0.94, 0.08, 0.16, '#5f8a3b'],
          [0.02, 0.72, 0.14, 0.16, '#6d9946'],
        ].map(([fx, fy, fz, fr, col], idx) => (
          <mesh
            key={idx}
            position={[fx as number, fy as number, fz as number]}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[fr as number, 1]} />
            <meshStandardMaterial color={col as string} roughness={0.85} />
          </mesh>
        ))}
        {/* Tiny Bright Oranges in the Foliage */}
        {[
          [-0.12, 0.84, 0.18],
          [0.14, 0.88, 0.16],
          [0.04, 0.74, 0.24],
          [-0.22, 0.75, 0.12],
          [0.21, 0.78, 0.12],
        ].map(([ox, oy, oz], idx) => (
          <mesh key={idx} position={[ox, oy, oz]}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshStandardMaterial color="#f57c18" roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* Small Companion Terracotta Pot Next to Left Planter */}
      <group position={[-1.44, 0, 1.56]}>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.075, 0.2, 14]} />
          <meshStandardMaterial color={terracottaPotDark} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.105, 0.035, 14]} />
          <meshStandardMaterial color={terracottaPot} roughness={0.75} />
        </mesh>
      </group>

      {/* Medium Terracotta Pot with Bushy Herbs Under Left Window */}
      <group position={[-1.15, 0, 1.52]}>
        <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.115, 0.08, 0.22, 14]} />
          <meshStandardMaterial color={terracottaPot} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow>
          <dodecahedronGeometry args={[0.13, 1]} />
          <meshStandardMaterial color="#5b8739" roughness={0.85} />
        </mesh>
        <mesh position={[0.06, 0.25, 0.04]} castShadow>
          <dodecahedronGeometry args={[0.09, 1]} />
          <meshStandardMaterial color="#709c49" roughness={0.85} />
        </mesh>
      </group>

      {/* Small Terracotta Pot Under Right Corner of Arched Window */}
      <group position={[-0.64, 0, 1.52]}>
        <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.09, 0.065, 0.18, 14]} />
          <meshStandardMaterial color={terracottaPot} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <dodecahedronGeometry args={[0.095, 1]} />
          <meshStandardMaterial color="#628f3f" roughness={0.85} />
        </mesh>
      </group>

      {/* Far Right: Large Terracotta Planter with Spiky Mini-Palm / Dracaena */}
      <group position={[1.76, 0, 1.44]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.17, 0.44, 18]} />
          <meshStandardMaterial color={terracottaPot} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.41, 0]} castShadow>
          <cylinderGeometry args={[0.265, 0.25, 0.065, 18]} />
          <meshStandardMaterial color={terracottaPot} roughness={0.7} />
        </mesh>
        {/* Mini Palm Trunk */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.05, 0.36, 8]} />
          <meshStandardMaterial color="#8c6747" roughness={0.9} />
        </mesh>
        {/* Arching Spiky Fronds */}
        {Array.from({ length: 8 }).map((_, idx) => {
          const angle = (idx / 8) * Math.PI * 2;
          return (
            <group key={idx} position={[0, 0.72, 0]} rotation={[0, angle, 0]}>
              <mesh position={[0, 0.06, 0.16]} rotation={[0.65, 0, 0]} castShadow>
                <coneGeometry args={[0.045, 0.36, 4]} />
                <meshStandardMaterial color={idx % 2 === 0 ? '#749c48' : '#8ab35b'} roughness={0.75} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 7. RIGHT, BACK & LEFT SIDE DETAILS FOR 360° EXPLORATION   */}
      {/* ========================================================= */}
      {/* RIGHT WALL: Bracketed Hanging Sign + Striped Side Awning & Bistro Table */}
      <group position={[1.65, 0, 0]}>
        {/* Hanging Cafe Sign on Iron Bracket (visible on right edge of photo) */}
        <group position={[0.24, 1.78, 0.72]}>
          <mesh position={[-0.04, 0.2, 0]} castShadow>
            <boxGeometry args={[0.52, 0.03, 0.03]} />
            <meshStandardMaterial color="#36393b" metalness={0.6} roughness={0.4} />
          </mesh>
          <group ref={hangingSignRef} position={[0.04, 0.18, 0]}>
            <RoundedBox args={[0.04, 0.38, 0.38]} radius={0.01} position={[0, -0.2, 0]} castShadow>
              <meshStandardMaterial color="#b2dce8" roughness={0.6} />
            </RoundedBox>
            <mesh position={[0.022, -0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.34, 0.34]} />
              <meshBasicMaterial map={hangingSignTex} />
            </mesh>
            <mesh position={[-0.022, -0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.34, 0.34]} />
              <meshBasicMaterial map={hangingSignTex} />
            </mesh>
          </group>
        </group>

        {/* Side Takeaway Window & Coastal Fabric Awning */}
        <group position={[0.02, 1.45, -0.18]}>
          {/* Sloped White & Coral Side Awning */}
          <mesh position={[0.28, 0.56, 0]} rotation={[0, 0, -0.45]} castShadow>
            <boxGeometry args={[0.68, 0.04, 1.15]} />
            <meshStandardMaterial color="#f5f0e6" roughness={0.8} />
          </mesh>
          <mesh position={[0.54, 0.39, 0]} castShadow>
            <boxGeometry args={[0.03, 0.1, 1.15]} />
            <meshStandardMaterial color="#eb7434" roughness={0.75} />
          </mesh>
          {/* Side Service Window */}
          <mesh position={[0.01, -0.05, 0]} castShadow>
            <boxGeometry args={[0.06, 0.85, 0.85]} />
            <meshStandardMaterial color={tealColor} roughness={0.5} />
          </mesh>
          <mesh position={[0.02, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.72, 0.72]} />
            <meshStandardMaterial
              color="#3b2313"
              emissive="#ff9f38"
              emissiveIntensity={isGolden ? 0.85 : 0.35}
            />
          </mesh>
          {/* Wooden Takeaway Counter Ledge */}
          <mesh position={[0.12, -0.48, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.24, 0.05, 0.96]} />
            <meshStandardMaterial color="#c98b52" roughness={0.75} />
          </mesh>
        </group>

        {/* Cozy Side Patio Bistro Table & Stools */}
        <group position={[0.78, 0, -0.18]}>
          {/* Round Wooden Table */}
          <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.04, 20]} />
            <meshStandardMaterial color="#d49553" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.31, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.62, 10]} />
            <meshStandardMaterial color="#2f3638" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.04, 16]} />
            <meshStandardMaterial color="#2f3638" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Two Coffee Cups on Patio Table */}
          <mesh position={[-0.1, 0.67, 0.08]} castShadow>
            <cylinderGeometry args={[0.04, 0.032, 0.07, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0.12, 0.67, -0.06]} castShadow>
            <cylinderGeometry args={[0.04, 0.032, 0.07, 12]} />
            <meshStandardMaterial color="#0d89b3" roughness={0.3} />
          </mesh>
          {/* Two Wooden Bistro Stools */}
          {[-0.52, 0.52].map((sz, idx) => (
            <group key={idx} position={[0, 0, sz]}>
              <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.16, 0.16, 0.04, 14]} />
                <meshStandardMaterial color="#c98747" roughness={0.75} />
              </mesh>
              <mesh position={[0, 0.21, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.05, 0.42, 8]} />
                <meshStandardMaterial color="#2f3638" roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* BACK WALL (Ocean-Facing Side): Balcony Window, Wooden Bench & Crates */}
      <group position={[0, 0, -1.3]}>
        {/* Upper Sea-View Window */}
        <group position={[-0.65, 2.85, -0.02]} rotation={[0, Math.PI, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.68, 0.82, 0.07]} />
            <meshStandardMaterial color={tealColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[0.54, 0.68]} />
            <meshStandardMaterial
              color="#2d1b10"
              emissive="#ff9c38"
              emissiveIntensity={isGolden ? 0.85 : 0.3}
            />
          </mesh>
        </group>

        {/* Ocean-View Wooden Bench Behind the House */}
        <group position={[0.45, 0, -0.36]}>
          <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.15, 0.05, 0.38]} />
            <meshStandardMaterial color="#c7884a" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.62, 0.16]} rotation={[-0.15, 0, 0]} castShadow>
            <boxGeometry args={[1.15, 0.28, 0.04]} />
            <meshStandardMaterial color="#c7884a" roughness={0.78} />
          </mesh>
          {[-0.46, 0.46].map((lx, idx) => (
            <mesh key={idx} position={[lx, 0.19, 0]} castShadow>
              <boxGeometry args={[0.06, 0.38, 0.34]} />
              <meshStandardMaterial color="#2f3638" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* Stacked Coffee Bean Shipping Crates & Terracotta Amphora */}
        <group position={[-1.05, 0, -0.32]}>
          <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.46, 0.44, 0.42]} />
            <meshStandardMaterial color="#b87d44" roughness={0.85} />
          </mesh>
          <mesh position={[0.04, 0.56, -0.02]} rotation={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.34, 0.26, 0.32]} />
            <meshStandardMaterial color="#c98e54" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* LEFT WALL: Window Planter Box & Coastal Copper Downspout */}
      <group position={[-1.65, 0, 0]}>
        {/* Copper Rain Downspout Pipe */}
        <mesh position={[-0.03, 2.2, -0.85]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 4.3, 10]} />
          <meshStandardMaterial color="#7da89b" roughness={0.55} metalness={0.3} />
        </mesh>
        {/* Left Wall Arched Niche Window with Flower Box */}
        <group position={[-0.02, 1.65, -0.1]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.58, 0.74, 0.07]} />
            <meshStandardMaterial color={tealColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[0.44, 0.6]} />
            <meshStandardMaterial
              color="#3a2314"
              emissive="#ff9c38"
              emissiveIntensity={isGolden ? 0.85 : 0.3}
            />
          </mesh>
          {/* Terracotta Window Box with Flowers */}
          <mesh position={[0, -0.44, 0.08]} castShadow>
            <boxGeometry args={[0.64, 0.16, 0.18]} />
            <meshStandardMaterial color={terracottaPot} roughness={0.75} />
          </mesh>
          {[-0.2, 0, 0.2].map((bx, i) => (
            <mesh key={i} position={[bx, -0.31, 0.08]} castShadow>
              <dodecahedronGeometry args={[0.09, 1]} />
              <meshStandardMaterial color={i === 1 ? '#e85d75' : '#65913e'} roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
