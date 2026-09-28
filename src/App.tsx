import { useCallback, useEffect, useState } from 'react'
import { PROJECT_WORLDS, type ProjectWorld } from './data/projects'
import { HeroSection } from './components/HeroSection'
import { ConceptSheet } from './components/ConceptSheet'
import { AllWorldsGrid } from './components/AllWorldsGrid'

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [showAtlasGrid, setShowAtlasGrid] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'editorial' | 'grid'>('editorial')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const scrollToProject = useCallback(
    (slug: ProjectWorld['slug']) => {
      if (layoutMode === 'grid') {
        const gridEl = document.getElementById('projects-collection')
        if (gridEl) {
          gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        setActiveSection(slug)
        return
      }
      const el = document.getElementById(`project-${slug}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setActiveSection(slug)
      }
    },
    [layoutMode]
  )

  const scrollToHero = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setActiveSection('hero')
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 320) {
        setActiveSection('hero')
        return
      }
      for (const proj of PROJECT_WORLDS) {
        const el = document.getElementById(`project-${proj.slug}`)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= window.innerHeight * 0.48 && rect.bottom >= 180) {
            setActiveSection(proj.slug)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showAtlasGrid && e.key === 'Escape') {
        setShowAtlasGrid(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showAtlasGrid])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const activePaletteProject =
    PROJECT_WORLDS.find((p) => p.slug === activeSection) || PROJECT_WORLDS[0]

  return (
    <div className={`platform-shell theme-${theme}`}>
      {/* Subtle Ambient Background Orbs */}
      <div
        className="ambient-glow glow-one"
        style={{ background: activePaletteProject.palette.portalSkyBottom }}
      />
      <div
        className="ambient-glow glow-two"
        style={{ background: activePaletteProject.palette.accentBar }}
      />

      {/* Sticky Top Studio Navigation Bar */}
      <header className="top-studio-dock-wrap">
        <nav className="top-studio-dock" aria-label="Portfolio Navigation">
          <button
            type="button"
            className="studio-brand-btn"
            onClick={scrollToHero}
            title="Back to top"
          >
            <span className="studio-brand-mark">✦</span>
            <span className="studio-brand-title">MADE WITH THREE.JS</span>
          </button>

          <div className="studio-world-tabs">
            <button
              type="button"
              className={`studio-world-tab ${activeSection === 'hero' ? 'active' : ''}`}
              onClick={scrollToHero}
            >
              <span className="tab-name">Overview</span>
            </button>

            {PROJECT_WORLDS.map((item) => (
              <button
                key={item.slug}
                type="button"
                className={`studio-world-tab ${activeSection === item.slug ? 'active' : ''}`}
                onClick={() => scrollToProject(item.slug)}
              >
                <span className="tab-num">{item.id}</span>
                <span className="tab-name">{item.sheetTitle}</span>
              </button>
            ))}
          </div>

          <div className="studio-dock-actions">
            <button
              type="button"
              className="dock-icon-btn"
              onClick={() => setShowAtlasGrid(true)}
              title="Search & Filter All Worlds"
            >
              <span>Search</span>
            </button>

            <button
              type="button"
              className="dock-theme-btn"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle color theme"
            >
              {theme === 'light' ? '◐ Dark' : '☀ Light'}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Landing Page Content */}
      <main className="portfolio-landing-main">
        {/* 1. Clean Editorial Hero with Real 3D Screens */}
        <HeroSection
          projects={PROJECT_WORLDS}
          onScrollToProject={scrollToProject}
          onOpenDirectory={() => setShowAtlasGrid(true)}
        />

        {/* Section Header & Layout Switcher */}
        <div id="projects-collection" className="collection-section-header">
          <div className="collection-title-group">
            <span className="collection-eyebrow">FEATURED 3D EXPERIENCES • 01 — 07</span>
            <h2 className="collection-heading">Real-Time WebGL Worlds</h2>
          </div>

          <div className="collection-controls">
            <div className="layout-segmented-control" role="group" aria-label="Layout mode">
              <button
                type="button"
                className={`layout-mode-btn ${layoutMode === 'editorial' ? 'active' : ''}`}
                onClick={() => setLayoutMode('editorial')}
              >
                Editorial Showcase
              </button>
              <button
                type="button"
                className={`layout-mode-btn ${layoutMode === 'grid' ? 'active' : ''}`}
                onClick={() => setLayoutMode('grid')}
              >
                Compact Grid
              </button>
            </div>
          </div>
        </div>

        {/* 2. Presentation of All 7 Three.js Projects with Real Screens */}
        {layoutMode === 'editorial' ? (
          <section className="projects-vertical-stack" aria-label="Three.js Project Presentations">
            {PROJECT_WORLDS.map((project, index) => (
              <ConceptSheet
                key={project.slug}
                project={project}
                totalProjects={PROJECT_WORLDS.length}
                index={index}
              />
            ))}
          </section>
        ) : (
          <section className="projects-bento-grid" aria-label="Three.js Projects Compact Grid">
            {PROJECT_WORLDS.map((proj) => (
              <article
                key={proj.slug}
                id={`project-${proj.slug}`}
                className="bento-world-card"
                style={
                  {
                    '--project-accent': proj.palette.accentBar,
                  } as React.CSSProperties
                }
              >
                <a
                  href={proj.worldUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bento-screen-link"
                >
                  <img
                    src={proj.screenshotUrl}
                    alt={`${proj.fullTitle} real 3D screen`}
                    className="bento-screen-img"
                    loading="lazy"
                  />
                  <div className="bento-screen-top">
                    <span className="bento-num-pill">{proj.id}</span>
                    <span className="bento-route-pill">{proj.worldUrl}</span>
                  </div>
                  <div className="bento-hover-cta">
                    <span>Open 3D World ↗</span>
                  </div>
                </a>

                <div className="bento-card-content">
                  <div className="bento-meta-line">
                    <span className="bento-cat">{proj.categoryEn}</span>
                    <div className="bento-badges">
                      {proj.toolBadges.map((b) => (
                        <span key={b} className="bento-tech-tag">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="bento-title">
                    <a href={proj.worldUrl} target="_blank" rel="noopener noreferrer">
                      {proj.fullTitle}
                    </a>
                  </h3>
                  <p className="bento-summary">{proj.shortSummary}</p>

                  <div className="bento-footer">
                    <div className="bento-protagonist">
                      <span
                        className="bento-dot"
                        style={{ background: proj.protagonist.badgeColor }}
                      />
                      <span>{proj.protagonist.name}</span>
                    </div>

                    <a
                      href={proj.worldUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bento-launch-btn"
                    >
                      <span>Launch World</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {/* Clean Minimal Footer with Visual World Links */}
      <footer className="portfolio-landing-footer">
        <div className="footer-inner">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div className="studio-brand">
                <span className="studio-brand-mark">✦</span>
                <span className="studio-brand-title">MADE WITH THREE.JS</span>
              </div>
              <p className="footer-desc">
                Seven standalone interactive 3D worlds built with Three.js, React Three Fiber, and
                custom GLSL shaders. Click any world to explore the live WebGL scene in a new tab.
              </p>
            </div>

            <button type="button" className="footer-top-btn" onClick={scrollToHero}>
              <span>↑ Back to Top</span>
            </button>
          </div>

          <div className="footer-links-grid">
            {PROJECT_WORLDS.map((proj) => (
              <a
                key={proj.slug}
                href={proj.worldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-world-link"
              >
                <img
                  src={proj.screenshotUrl}
                  alt={proj.sheetTitle}
                  className="footer-link-thumb"
                  loading="lazy"
                />
                <div className="footer-link-meta">
                  <span className="footer-link-num">
                    {proj.id} • {proj.sheetTitle}
                  </span>
                  <strong className="footer-link-title">{proj.fullTitle}</strong>
                </div>
                <span className="footer-link-arrow">↗</span>
              </a>
            ))}
          </div>

          <div className="footer-bottom-bar">
            <span>© 2026 MADE WITH THREE.JS — Interactive 3D World Showcase</span>
            <span>Three.js • React Three Fiber • Custom GLSL</span>
          </div>
        </div>
      </footer>

      {/* Search & Filter Directory Modal */}
      {showAtlasGrid && (
        <AllWorldsGrid
          projects={PROJECT_WORLDS}
          onScrollToProject={scrollToProject}
          onClose={() => setShowAtlasGrid(false)}
        />
      )}
    </div>
  )
}
