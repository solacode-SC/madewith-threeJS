import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import type { ProjectWorld } from '../data/projects'

interface CircularWorldPortalProps {
  project: ProjectWorld
  onLaunchWorld: (project: ProjectWorld, originRect?: DOMRect) => void
}

interface MiniatureDioramaProps {
  slug: ProjectWorld['slug']
  hovered: boolean
}

const StarCrown: React.FC<{ color?: string; y?: number }> = ({ color = '#FBBF24', y = 1.65 }) => {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 1.1
      ref.current.position.y = y + Math.sin(clock.getElapsedTime() * 2.4) * 0.07
    }
  })
  return (
    <group ref={ref} position={[0.15, y, 0.1]}>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
        <meshStandardMaterial color="#92400E" />
      </mesh>
    </group>
  )
}

const ChibiFigureMini: React.FC<{
  coatColor: string
  hairColor: string
  position?: [number, number, number]
  hasKasaHat?: boolean
  hasAhoge?: boolean
  scale?: number
}> = ({
  coatColor,
  hairColor,
  position = [-0.55, -0.25, 0.65],
  hasKasaHat = false,
  hasAhoge = false,
  scale = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime()
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * 3.2)) * 0.08
      groupRef.current.rotation.z = Math.sin(t * 2.2) * 0.06
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Chibi Coat / Tunic */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <coneGeometry args={[0.24, 0.44, 16]} />
        <meshStandardMaterial color={coatColor} roughness={0.45} />
      </mesh>
      {/* Chibi Head */}
      <mesh position={[0, 0.54, 0]} castShadow>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial color="#FFE4C4" roughness={0.5} />
      </mesh>
      {/* Hair Cap */}
      <mesh position={[0, 0.6, -0.02]}>
        <sphereGeometry args={[0.21, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={hairColor} roughness={0.4} />
      </mesh>
      {/* Cute Eyes */}
      <mesh position={[-0.06, 0.53, 0.18]}>
        <capsuleGeometry args={[0.015, 0.04, 4, 8]} />
        <meshBasicMaterial color="#1E293B" />
      </mesh>
      <mesh position={[0.06, 0.53, 0.18]}>
        <capsuleGeometry args={[0.015, 0.04, 4, 8]} />
        <meshBasicMaterial color="#1E293B" />
      </mesh>
      {/* Rosy Cheeks */}
      <mesh position={[-0.11, 0.49, 0.16]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#FB7185" />
      </mesh>
      <mesh position={[0.11, 0.49, 0.16]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#FB7185" />
      </mesh>

      {hasAhoge && (
        <mesh position={[0.04, 0.82, 0]} rotation={[0, 0, -0.35]}>
          <torusGeometry args={[0.06, 0.016, 8, 16, Math.PI * 1.3]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
      )}

      {hasKasaHat && (
        <group position={[0, 0.72, 0]}>
          <mesh>
            <coneGeometry args={[0.38, 0.16, 20]} />
            <meshStandardMaterial color="#FDE68A" roughness={0.6} />
          </mesh>
          {/* Green leaf sprout on top */}
          <mesh position={[0.03, 0.12, 0]} rotation={[0, 0, -0.4]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#22C55E" />
          </mesh>
        </group>
      )}
    </group>
  )
}

const WorldMiniatureScene: React.FC<MiniatureDioramaProps> = ({ slug, hovered }) => {
  const rootRef = useRef<THREE.Group>(null)

  useFrame(({ clock, pointer }) => {
    if (!rootRef.current) return
    const t = clock.getElapsedTime()
    const targetRotY = t * (hovered ? 0.55 : 0.32) + pointer.x * 0.45
    const targetRotX = 0.18 + pointer.y * -0.22
    rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, targetRotY, 0.08)
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetRotX, 0.08)
  })

  return (
    <group ref={rootRef}>
      <Float speed={2} rotationIntensity={0.18} floatIntensity={0.35}>
        {/* Lower Circular Pasture / Base Disc (mirrors the green/blue disc in the reference image) */}
        <mesh position={[0, -0.58, 0]} receiveShadow>
          <cylinderGeometry args={[1.52, 1.38, 0.28, 36]} />
          <meshStandardMaterial
            color={
              slug === 'blue-medina-road'
                ? '#60A5FA'
                : slug === 'coastal-house'
                  ? '#2DD4BF'
                  : slug === 'island-world'
                    ? '#0284C7'
                    : slug === 'palm-village-maze'
                      ? '#A3E635'
                      : slug === 'santorini-sea-maze'
                        ? '#22D3EE'
                        : '#F59E0B'
            }
            roughness={0.45}
          />
        </mesh>

        {/* Inner grassy/stone plate */}
        <mesh position={[0, -0.42, 0]} receiveShadow>
          <cylinderGeometry args={[1.22, 1.26, 0.1, 32]} />
          <meshStandardMaterial
            color={
              slug === 'blue-medina-road'
                ? '#DBEAFE'
                : slug === 'coastal-house'
                  ? '#FEF3C7'
                  : slug === 'island-world'
                    ? '#86EFAC'
                    : slug === 'palm-village-maze'
                      ? '#FDE68A'
                      : slug === 'santorini-sea-maze'
                        ? '#F8FAFC'
                        : '#FED7AA'
            }
            roughness={0.55}
          />
        </mesh>

        {/* Upper Tilted Dish / Architectural Crown (mirrors the tilted omurice UFO plate in reference!) */}
        <group position={[0.18, 0.38, -0.05]} rotation={[0.22, -0.25, -0.18]}>
          {/* Octagonal Rim Platter */}
          <mesh castShadow>
            <cylinderGeometry args={[1.05, 0.88, 0.22, 10]} />
            <meshStandardMaterial color="#334155" roughness={0.35} />
          </mesh>

          {slug === 'blue-medina-road' && (
            <group>
              {/* Cobalt Dome & Ascending Steps */}
              <mesh position={[0, 0.25, 0]}>
                <sphereGeometry args={[0.82, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial color="#3B82F6" roughness={0.35} />
              </mesh>
              {[0, 1, 2, 3, 4].map((step) => (
                <mesh key={step} position={[-0.35 + step * 0.18, 0.16 + step * 0.1, 0.32 - step * 0.08]}>
                  <boxGeometry args={[0.32, 0.09, 0.26]} />
                  <meshStandardMaterial color={step % 2 === 0 ? '#1D4ED8' : '#93C5FD'} />
                </mesh>
              ))}
              {/* White Amphora Pots */}
              <mesh position={[0.56, 0.24, 0.35]}>
                <sphereGeometry args={[0.15, 14, 14]} />
                <meshStandardMaterial color="#F8FAFC" />
              </mesh>
            </group>
          )}

          {slug === 'coastal-house' && (
            <group>
              {/* Pastel-Blue Coastal Coffee House */}
              <mesh position={[-0.08, 0.42, 0]}>
                <boxGeometry args={[0.92, 0.68, 0.68]} />
                <meshStandardMaterial color="#BAE6FD" roughness={0.5} />
              </mesh>
              {/* Terracotta Awning */}
              <mesh position={[0.05, 0.36, 0.42]} rotation={[0.35, 0, 0]}>
                <boxGeometry args={[0.62, 0.08, 0.32]} />
                <meshStandardMaterial color="#EA580C" />
              </mesh>
              {/* Coastal Citrus Bush */}
              <mesh position={[0.58, 0.26, 0.28]}>
                <sphereGeometry args={[0.2, 14, 14]} />
                <meshStandardMaterial color="#22C55E" />
              </mesh>
            </group>
          )}

          {slug === 'island-world' && (
            <group>
              {/* Golden Atoll Mound + Timber Cabin + Palm + Boat */}
              <mesh position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.82, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                <meshStandardMaterial color="#FBBF24" roughness={0.45} />
              </mesh>
              <mesh position={[-0.15, 0.48, 0]}>
                <boxGeometry args={[0.46, 0.36, 0.38]} />
                <meshStandardMaterial color="#B45309" />
              </mesh>
              <mesh position={[-0.15, 0.75, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[0.42, 0.26, 4]} />
                <meshStandardMaterial color="#7C2D12" />
              </mesh>
              <mesh position={[0.48, 0.32, 0.25]}>
                <sphereGeometry args={[0.22, 14, 14]} />
                <meshStandardMaterial color="#16A34A" />
              </mesh>
            </group>
          )}

          {slug === 'palm-village-maze' && (
            <group>
              {/* Warm Mud-Brick Dome & Archway + Bougainvillea */}
              <mesh position={[0, 0.24, 0]}>
                <sphereGeometry args={[0.82, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial color="#F59E0B" roughness={0.45} />
              </mesh>
              <mesh position={[0, 0.48, 0.1]}>
                <boxGeometry args={[0.72, 0.52, 0.42]} />
                <meshStandardMaterial color="#D97706" />
              </mesh>
              {/* Purple Bougainvillea Clusters */}
              <mesh position={[0.52, 0.34, 0.32]}>
                <sphereGeometry args={[0.2, 14, 14]} />
                <meshStandardMaterial color="#A855F7" />
              </mesh>
              <mesh position={[0.68, 0.24, 0.12]}>
                <sphereGeometry args={[0.16, 14, 14]} />
                <meshStandardMaterial color="#22C55E" />
              </mesh>
            </group>
          )}

          {slug === 'santorini-sea-maze' && (
            <group>
              {/* Whitewashed Cycladic Buildings & Blue Dome */}
              <mesh position={[0, 0.24, 0]}>
                <sphereGeometry args={[0.82, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.56, 0]}>
                <sphereGeometry args={[0.42, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial color="#0284C7" roughness={0.25} />
              </mesh>
              <mesh position={[0.55, 0.3, 0.28]}>
                <sphereGeometry args={[0.18, 14, 14]} />
                <meshStandardMaterial color="#16A34A" />
              </mesh>
            </group>
          )}

          {slug === 'sunlit-adobe-maze' && (
            <group>
              {/* Warm Golden Ochre Dome & Mashrabiya Arch */}
              <mesh position={[0, 0.25, 0]}>
                <sphereGeometry args={[0.84, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                <meshStandardMaterial color="#FBBF24" roughness={0.35} />
              </mesh>
              {/* Central sunny yolk-like glowing sun dome (homage to reference!) */}
              <mesh position={[0, 0.56, 0.08]}>
                <sphereGeometry args={[0.38, 20, 20]} />
                <meshStandardMaterial color="#F97316" roughness={0.25} />
              </mesh>
              <mesh position={[0.56, 0.28, 0.3]}>
                <sphereGeometry args={[0.2, 14, 14]} />
                <meshStandardMaterial color="#16A34A" />
              </mesh>
            </group>
          )}

          <StarCrown color="#FDE047" y={1.08} />
        </group>

        {/* Chibi Protagonist & Mini Companions on the Lower Circular Pasture */}
        {slug === 'blue-medina-road' && (
          <ChibiFigureMini coatColor="#60A5FA" hairColor="#1E293B" hasAhoge />
        )}
        {slug === 'coastal-house' && (
          <ChibiFigureMini coatColor="#4ADE80" hairColor="#1E293B" hasKasaHat />
        )}
        {slug === 'island-world' && (
          <ChibiFigureMini coatColor="#38BDF8" hairColor="#0F172A" />
        )}
        {slug === 'palm-village-maze' && (
          <ChibiFigureMini coatColor="#FACC15" hairColor="#0F172A" />
        )}
        {slug === 'santorini-sea-maze' && (
          <ChibiFigureMini coatColor="#22C55E" hairColor="#84CC16" />
        )}
        {slug === 'sunlit-adobe-maze' && (
          <ChibiFigureMini coatColor="#EF4444" hairColor="#18181B" />
        )}

        {/* Cute Companion Props on the Pasture (like the little cows in the reference image!) */}
        <mesh position={[0.28, -0.26, 0.58]} castShadow>
          <dodecahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#FB923C" roughness={0.4} />
        </mesh>
        <mesh position={[0.52, -0.3, 0.85]} castShadow>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#FDE047" emissive="#F59E0B" emissiveIntensity={0.3} />
        </mesh>
      </Float>
    </group>
  )
}

export const CircularWorldPortal: React.FC<CircularWorldPortalProps> = ({
  project,
  onLaunchWorld,
}) => {
  const portalRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!portalRef.current) return
    const rect = portalRef.current.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setTilt({ x: ny * -6, y: nx * 6 })
  }

  const handleMouseLeave = () => {
    setHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  const triggerLaunch = () => {
    const rect = portalRef.current?.getBoundingClientRect()
    onLaunchWorld(project, rect)
  }

  return (
    <div className="portal-column-wrapper">
      <div
        ref={portalRef}
        className={`circular-main-visual ${hovered ? 'is-hovered' : ''}`}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          '--portal-outer': project.palette.portalOuterRing,
          '--portal-sky-top': project.palette.portalSkyTop,
          '--portal-sky-bottom': project.palette.portalSkyBottom,
          '--portal-ground': project.palette.portalGround,
          '--portal-highlight': project.palette.portalHighlight,
        } as React.CSSProperties}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={triggerLaunch}
        role="button"
        tabIndex={0}
        aria-label={`Discover ${project.fullTitle} in 3D`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            triggerLaunch()
          }
        }}
      >
        {/* Outer Navy/Theme Starry Circle Backdrop (matches the reference image's circular frame) */}
        <div className="portal-starry-backdrop">
          {/* Decorative soft cloud arcs along top edge */}
          <div className="portal-cloud cloud-left" />
          <div className="portal-cloud cloud-right" />

          {/* Twinkling 4-pointed white stars (✦) matching reference */}
          <span className="portal-star s1">✦</span>
          <span className="portal-star s2">✦</span>
          <span className="portal-star s3">✦</span>
          <span className="portal-star s4">✦</span>
          <span className="portal-star s5">✦</span>
        </div>

        {/* Live Interactive Three.js 3D Miniature inside the Circular Portal */}
        <div className="portal-webgl-stage">
          <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.35, 3.9], fov: 38 }}>
            <ambientLight intensity={0.95} />
            <directionalLight position={[4, 6, 4]} intensity={1.45} castShadow />
            <directionalLight position={[-3, 2, -2]} intensity={0.45} color="#BAE6FD" />
            <WorldMiniatureScene slug={project.slug} hovered={hovered} />
          </Canvas>
        </div>

        {/* Hover / Discover CTA Pill inside top-left of circle */}
        <div className="portal-discover-pill">
          <span className="portal-live-dot" />
          <span>CLICK TO ENTER 3D WORLD</span>
          <span className="portal-arrow">↗</span>
        </div>

        {/* Secondary Overlapping Bottom-Right Circular Emblem Badge (matches the egg UFO mini-circle in reference!) */}
        <div
          className="portal-sub-circle-badge"
          title={`${project.protagonist.name} — ${project.protagonist.role}`}
        >
          <svg viewBox="0 0 120 120" className="sub-circle-svg">
            {/* Outer white/cream saucer plate with double hand-drawn rim */}
            <ellipse
              cx="60"
              cy="64"
              rx="52"
              ry="44"
              fill="#FFFDF9"
              stroke="#475569"
              strokeWidth="2.2"
            />
            <ellipse
              cx="60"
              cy="64"
              rx="46"
              ry="38"
              fill="#FEF3C7"
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            {/* Antenna / Star Stem on top (just like the reference sub-circle!) */}
            <line x1="60" y1="16" x2="60" y2="38" stroke="#78350F" strokeWidth="2.5" />
            <circle
              cx="60"
              cy="14"
              r="9"
              fill="#FDE68A"
              stroke="#78350F"
              strokeWidth="2"
            />
            <circle cx="60" cy="14" r="3.5" fill={project.protagonist.accentColor} />

            {/* Cute Glowing Yolk / Chibi Mascot Core */}
            <ellipse
              cx="60"
              cy="64"
              rx="29"
              ry="25"
              fill={project.protagonist.accentColor}
              stroke="#78350F"
              strokeWidth="2"
            />
            {/* Highlight shine */}
            <ellipse cx="48" cy="52" rx="7" ry="4" fill="#FFFFFF" opacity="0.75" transform="rotate(-20 48 52)" />
            {/* Cute vertical capsule eyes | | */}
            <line x1="54" y1="60" x2="54" y2="68" stroke="#451A03" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="66" y1="60" x2="66" y2="68" stroke="#451A03" strokeWidth="2.8" strokeLinecap="round" />
            {/* Rosy cheeks */}
            <circle cx="46" cy="67" r="3.8" fill="#FB7185" opacity="0.75" />
            <circle cx="74" cy="67" r="3.8" fill="#FB7185" opacity="0.75" />
          </svg>
          <span className="sub-circle-protagonist-tag">{project.protagonist.name}</span>
        </div>
      </div>

      {/* Bottom-right caption matching "メインビジュアル" in the reference image */}
      <div className="main-visual-caption-row">
        <button type="button" className="launch-world-btn" onClick={triggerLaunch}>
          <span className="launch-world-btn-icon">▶</span>
          <span>DISCOVER «{project.fullTitle}»</span>
          <span className="launch-world-btn-jp">探索する</span>
        </button>
        <span className="main-visual-jp-label">メインビジュアル</span>
      </div>
    </div>
  )
}
