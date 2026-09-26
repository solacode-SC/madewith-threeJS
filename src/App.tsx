import { useCallback, useEffect, useState } from 'react'
import { PROJECT_WORLDS, type ProjectWorld } from './data/projects'
import { HeroSection } from './components/HeroSection'
import { ConceptSheet } from './components/ConceptSheet'
import { AllWorldsGrid } from './components/AllWorldsGrid'

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [showAtlasGrid, setShowAtlasGrid] = useState(false)

  const scrollToProject = useCallback((slug: ProjectWorld['slug']) => {
    const el = document.getElementById(`project-${slug}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(slug)
    }
  }, [])

  const scrollToHero = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setActiveSection('hero')
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 340) {
        setActiveSection('hero')
        return
      }
      for (const proj of PROJECT_WORLDS) {
        const el = document.getElementById(`project-${proj.slug}`)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= 160) {
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

  const activePaletteProject =
    PROJECT_WORLDS.find((p) => p.slug === activeSection) || PROJECT_WORLDS[0]

  return (
    <div className="platform-shell">
      {/* Subtle Ambient Background Orbs */}
      <div
        className="ambient-glow glow-one"
        style={{ background: activePaletteProject.palette.portalSkyBottom }}
      />
      <div
        className="ambient-glow glow-two"
        style={{ background: activePaletteProject.palette.accentBar }}
      />

      {/* Sticky Top Portfolio Navigation Bar */}
      <nav className="top-studio-dock" aria-label="Portfolio Navigation">
        <button
          type="button"
          className="studio-brand studio-brand-btn"
          onClick={scrollToHero}
          title="Back to Hero Section"
        >
          <span className="studio-brand-mark">✦</span>
          <span className="studio-brand-title">MADE WITH THREE.JS</span>
          <span className="studio-brand-sub">// 作品コンセプト図鑑</span>
        </button>

        <div className="studio-world-tabs">
          <button
            type="button"
            className={`studio-world-tab ${activeSection === 'hero' ? 'active' : ''}`}
            onClick={scrollToHero}
          >
            <span className="tab-num">★</span>
            <span className="tab-name">HERO</span>
          </button>

          {PROJECT_WORLDS.map((item) => (
            <button
              key={item.slug}
              type="button"
              className={`studio-world-tab ${activeSection === item.slug ? 'active' : ''}`}
              onClick={() => scrollToProject(item.slug)}
            >
              <span className="tab-num">{item.id}</span>
              <span className="tab-name">{item.sheetTitle.replace('!', '')}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Vertical Landing Page Content */}
      <main className="portfolio-landing-main">
        {/* 1. Portfolio Hero Section */}
        <HeroSection
          projects={PROJECT_WORLDS}
          onScrollToProject={scrollToProject}
          onOpenDirectory={() => setShowAtlasGrid(true)}
        />

        {/* Section Divider Banner */}
        <div className="projects-showcase-divider">
          <div className="divider-line" />
          <div className="divider-badge">
            <span className="divider-star">✦</span>
            <span>ALL 6 THREE.JS PROJECT PRESENTATIONS — CLICK ANY SCREEN TO OPEN IN NEW PAGE ↗</span>
          </div>
          <div className="divider-line" />
        </div>

        {/* 2. Sequential Presentation of Each Three.js Project (01 to 06) */}
        <section className="projects-vertical-stack" aria-label="Three.js Project Presentations">
          {PROJECT_WORLDS.map((project) => (
            <ConceptSheet
              key={project.slug}
              project={project}
              totalProjects={PROJECT_WORLDS.length}
            />
          ))}
        </section>
      </main>

      {/* Portfolio Footer with Direct New-Page Links */}
      <footer className="portfolio-landing-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="studio-brand">
              <span className="studio-brand-mark">✦</span>
              <span className="studio-brand-title">MADE WITH THREE.JS</span>
            </div>
            <p className="footer-desc">
              6 standalone interactive 3D worlds built with Three.js, React Three Fiber, and custom
              GLSL shaders. Every project opens in its own dedicated browser tab.
            </p>
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
                <span className="footer-link-num">{proj.id}</span>
                <span className="footer-link-title">{proj.fullTitle}</span>
                <span className="footer-link-arrow">↗</span>
              </a>
            ))}
          </div>

          <div className="footer-bottom-bar">
            <span>© 2026 MADE WITH THREE.JS — 3D Interactive World Portfolio</span>
            <button type="button" className="footer-top-btn" onClick={scrollToHero}>
              ↑ BACK TO HERO
            </button>
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
