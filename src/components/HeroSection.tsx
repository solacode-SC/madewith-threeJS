import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import type { ProjectWorld } from '../data/projects'

interface HeroSectionProps {
  projects: ProjectWorld[]
  onScrollToProject: (slug: ProjectWorld['slug']) => void
  onOpenDirectory: () => void
}

const HeroDioramaConstellation: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Group>(null)

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.28 + pointer.x * 0.35
      groupRef.current.rotation.x = 0.16 + pointer.y * -0.18
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.35
    }
  })

  const worldOrbs: { pos: [number, number, number]; color: string }[] = [
    { pos: [1.55, 0.45, 0], color: '#3B82F6' },
    { pos: [0.78, 0.65, 1.34], color: '#14B8A6' },
    { pos: [-0.78, 0.35, 1.34], color: '#0284C7' },
    { pos: [-1.55, 0.55, 0], color: '#F59E0B' },
    { pos: [-0.78, 0.4, -1.34], color: '#84CC16' },
    { pos: [0.78, 0.6, -1.34], color: '#EF4444' },
  ]

  return (
    <group ref={groupRef}>
      <Float speed={1.8} rotationIntensity={0.16} floatIntensity={0.32}>
        {/* Lower Studio Turntable Base */}
        <mesh position={[0, -0.62, 0]} receiveShadow>
          <cylinderGeometry args={[1.65, 1.48, 0.26, 40]} />
          <meshStandardMaterial color="#1E293B" roughness={0.35} />
        </mesh>

        <mesh position={[0, -0.45, 0]} receiveShadow>
          <cylinderGeometry args={[1.38, 1.42, 0.1, 36]} />
          <meshStandardMaterial color="#F4B63F" roughness={0.4} />
        </mesh>

        {/* Central Architectural Citadel Crown */}
        <group position={[0, 0.05, 0]}>
          <mesh position={[0, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.92, 1.08, 0.45, 8]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <sphereGeometry args={[0.68, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#2563EB" roughness={0.25} />
          </mesh>
          {/* Glowing Golden Star Finial */}
          <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI / 4, Math.PI / 4]}>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial
              color="#FDE047"
              emissive="#F59E0B"
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Orbiting Ring of the 6 Three.js Worlds */}
        <group ref={ringRef} position={[0, 0.12, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
          <mesh>
            <torusGeometry args={[1.55, 0.022, 12, 64]} />
            <meshStandardMaterial color="#F4B63F" emissive="#F4B63F" emissiveIntensity={0.25} />
          </mesh>
        </group>

        {worldOrbs.map((orb, idx) => (
          <mesh key={idx} position={orb.pos} castShadow>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.25}
              roughness={0.25}
            />
          </mesh>
        ))}
      </Float>
    </group>
  )
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  projects,
  onScrollToProject,
  onOpenDirectory,
}) => {
  return (
    <section id="hero" className="portfolio-hero-section">
      <div className="hero-sheet-card">
        {/* Signature Top-Left Vertical Gold Block */}
        <div className="sheet-left-edge-block" aria-hidden="true" />

        <div className="hero-main-grid">
          {/* Left Column: Portfolio Intro, Headline, Metrics & Actions */}
          <div className="hero-copy-col">
            <div className="hero-eyebrow-pill">
              <span className="hero-eyebrow-star">✦</span>
              <span>THREE.JS &amp; REACT THREE FIBER PORTFOLIO</span>
              <span className="hero-eyebrow-jp">// 作品コンセプト図鑑</span>
            </div>

            <p className="hero-super-jp">6つの立体的世界を旅するインタラクティブ作品集</p>
            <h1 className="hero-display-title">MADE WITH THREE.JS</h1>

            <p className="hero-lead-description">
              An editorial showcase of <strong>6 standalone interactive 3D worlds</strong> crafted
              with Three.js, React Three Fiber, custom GLSL shaders, and procedural geometry. Scroll
              down to inspect each project&apos;s concept sheet, architectural rough sketch, and
              screen preview — and click any project to open the full 3D experience in a{' '}
              <strong>new page</strong>.
            </p>

            {/* Key Portfolio Highlights */}
            <div className="hero-stats-grid">
              <div className="hero-stat-box">
                <strong>06</strong>
                <span>Standalone 3D Worlds</span>
              </div>
              <div className="hero-stat-box">
                <strong>60 FPS</strong>
                <span>WebGL 2.0 &amp; R3F</span>
              </div>
              <div className="hero-stat-box">
                <strong>GLSL</strong>
                <span>Custom Shaders &amp; FX</span>
              </div>
              <div className="hero-stat-box">
                <strong>NEW TAB ↗</strong>
                <span>Full-Page Launch</span>
              </div>
            </div>

            {/* Primary CTA Buttons */}
            <div className="hero-cta-row">
              <button
                type="button"
                className="hero-primary-btn"
                onClick={() => onScrollToProject(projects[0].slug)}
              >
                <span>↓ EXPLORE ALL 6 PROJECTS</span>
                <span className="hero-btn-jp">作品一覧へスクロール</span>
              </button>

              <button
                type="button"
                className="hero-secondary-btn"
                onClick={onOpenDirectory}
              >
                <span>❖ SEARCH &amp; FILTER ATLAS</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive 3D Hero Constellation Portal */}
          <div className="hero-visual-col">
            <div className="hero-3d-orb-frame">
              <div className="portal-starry-backdrop">
                <div className="portal-cloud cloud-left" />
                <div className="portal-cloud cloud-right" />
                <span className="portal-star s1">✦</span>
                <span className="portal-star s2">✦</span>
                <span className="portal-star s3">✦</span>
                <span className="portal-star s4">✦</span>
                <span className="portal-star s5">✦</span>
              </div>

              <div className="portal-webgl-stage">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.45, 4.2], fov: 38 }}>
                  <ambientLight intensity={0.95} />
                  <directionalLight position={[4, 6, 4]} intensity={1.45} castShadow />
                  <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#BAE6FD" />
                  <HeroDioramaConstellation />
                </Canvas>
              </div>

              <div className="portal-discover-pill">
                <span className="portal-live-dot" />
                <span>6 INTERACTIVE WORLDS READY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quick-Jump Project Index Cards (01 to 06) */}
        <div className="hero-projects-strip">
          <div className="hero-strip-header">
            <span className="hero-strip-label">
              // FEATURED 3D WORLDS INDEX — CLICK TO SCROLL TO PRESENTATION OR OPEN IN NEW PAGE ↗
            </span>
          </div>

          <div className="hero-strip-cards">
            {projects.map((proj) => (
              <div key={proj.slug} className="hero-mini-project-card">
                <button
                  type="button"
                  className="hero-mini-scroll-trigger"
                  onClick={() => onScrollToProject(proj.slug)}
                  title={`Scroll to ${proj.fullTitle} presentation`}
                >
                  <span
                    className="hero-mini-num"
                    style={{ background: proj.palette.portalOuterRing }}
                  >
                    {proj.id}
                  </span>
                  <span className="hero-mini-info">
                    <strong>{proj.sheetTitle}</strong>
                    <small>{proj.fullTitle}</small>
                  </span>
                </button>

                <a
                  href={proj.worldUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-mini-newtab-link"
                  title={`Open ${proj.fullTitle} in a new page`}
                  aria-label={`Open ${proj.fullTitle} in a new page`}
                >
                  ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
