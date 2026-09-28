import React, { useEffect, useState } from 'react'
import type { ProjectWorld } from '../data/projects'

interface HeroSectionProps {
  projects: ProjectWorld[]
  onScrollToProject: (slug: ProjectWorld['slug']) => void
  onOpenDirectory: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  projects,
  onScrollToProject,
  onOpenDirectory,
}) => {
  const [featuredIndex, setFeaturedIndex] = useState(projects.length - 1)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const timer = window.setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % projects.length)
    }, 4800)
    return () => window.clearInterval(timer)
  }, [isPaused, projects.length])

  const featuredProject = projects[featuredIndex] || projects[0]

  return (
    <section id="hero" className="hero-section">
      <div className="hero-container">
        <div className="hero-main-grid">
          {/* Left Column: Clean High-Contrast Editorial Intro */}
          <div className="hero-copy-col">
            <div className="hero-status-pill">
              <span className="status-pulse-dot" />
              <span>THREE.JS • REACT THREE FIBER • GLSL</span>
            </div>

            <h1 className="hero-headline">
              Interactive 3D Worlds,{' '}
              <span className="hero-headline-serif">Crafted for the Web.</span>
            </h1>

            <p className="hero-subtitle">
              A curated collection of seven standalone real-time 3D environments featuring custom
              shaders, stylized characters, and spatial navigation. Every screen below is captured
              directly from the live WebGL experience.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="hero-btn-primary"
                onClick={() => onScrollToProject(projects[projects.length - 1].slug)}
              >
                <span>Explore All 7 Worlds</span>
                <span className="btn-icon-down" aria-hidden="true">
                  ↓
                </span>
              </button>

              <button
                type="button"
                className="hero-btn-secondary"
                onClick={onOpenDirectory}
              >
                <span>Quick Index &amp; Filter</span>
              </button>
            </div>

            <div className="hero-metrics-bar">
              <div className="hero-metric-item">
                <strong>07</strong>
                <span>Standalone Worlds</span>
              </div>
              <div className="hero-metric-divider" />
              <div className="hero-metric-item">
                <strong>60 FPS</strong>
                <span>Real-Time WebGL</span>
              </div>
              <div className="hero-metric-divider" />
              <div className="hero-metric-item">
                <strong>GLSL</strong>
                <span>Custom Shaders</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Real-Screen Stage */}
          <div
            className="hero-stage-col"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="hero-featured-screen-card"
              style={
                {
                  '--hero-accent': featuredProject.palette.accentBar,
                } as React.CSSProperties
              }
            >
              <div className="hero-screen-topbar">
                <div className="hero-screen-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="hero-screen-route">{featuredProject.worldUrl}</span>
                <span className="hero-screen-badge">
                  {featuredProject.id} / 0{projects.length}
                </span>
              </div>

              <div className="hero-screen-viewport">
                {projects.map((proj, idx) => (
                  <a
                    key={proj.slug}
                    href={proj.worldUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hero-screen-slide ${idx === featuredIndex ? 'is-active' : ''}`}
                    aria-label={`Open ${proj.fullTitle} in a new tab`}
                    tabIndex={idx === featuredIndex ? 0 : -1}
                  >
                    <img
                      src={proj.screenshotUrl}
                      alt={`${proj.fullTitle} real 3D screenshot`}
                      className="hero-slide-img"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="hero-slide-gradient" />

                    <div className="hero-slide-caption">
                      <div className="hero-slide-meta">
                        <span className="hero-slide-cat">{proj.categoryEn}</span>
                        <h2 className="hero-slide-title">{proj.fullTitle}</h2>
                      </div>

                      <span className="hero-slide-launch-pill">
                        <span>Open World</span>
                        <span aria-hidden="true">↗</span>
                      </span>
                    </div>
                  </a>
                ))}
              </div>

              {/* Interactive Slide Selector Dots */}
              <div className="hero-screen-controls" role="tablist" aria-label="Featured world slides">
                {projects.map((proj, idx) => (
                  <button
                    key={proj.slug}
                    type="button"
                    role="tab"
                    aria-selected={idx === featuredIndex}
                    className={`hero-slide-dot ${idx === featuredIndex ? 'active' : ''}`}
                    onClick={() => setFeaturedIndex(idx)}
                    title={proj.fullTitle}
                  >
                    <span className="dot-num">{proj.id}</span>
                    <span className="dot-label">{proj.sheetTitle}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Visual Filmstrip of All 6 Real Project Screens */}
        <div className="hero-filmstrip">
          <div className="filmstrip-header">
            <span className="filmstrip-title">Collection Index — Real Project Screens</span>
            <span className="filmstrip-hint">Select a world to inspect or open in a new tab ↗</span>
          </div>

          <div className="filmstrip-grid">
            {projects.map((proj, idx) => (
              <div
                key={proj.slug}
                className={`filmstrip-card ${idx === featuredIndex ? 'is-featured' : ''}`}
                onMouseEnter={() => setFeaturedIndex(idx)}
              >
                <button
                  type="button"
                  className="filmstrip-card-main"
                  onClick={() => onScrollToProject(proj.slug)}
                >
                  <div className="filmstrip-thumb-wrap">
                    <img
                      src={proj.screenshotUrl}
                      alt={proj.fullTitle}
                      className="filmstrip-thumb"
                      loading="eager"
                    />
                    <span className="filmstrip-num">{proj.id}</span>
                  </div>
                  <div className="filmstrip-info">
                    <strong>{proj.sheetTitle}</strong>
                    <span>{proj.categoryEn}</span>
                  </div>
                </button>

                <a
                  href={proj.worldUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="filmstrip-external-btn"
                  title={`Open ${proj.fullTitle} in a new tab`}
                  aria-label={`Open ${proj.fullTitle} in a new tab`}
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
