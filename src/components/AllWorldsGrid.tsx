import React, { useMemo, useState } from 'react'
import type { ProjectWorld } from '../data/projects'

interface AllWorldsGridProps {
  projects: ProjectWorld[]
  onScrollToProject: (slug: ProjectWorld['slug']) => void
  onClose: () => void
}

const FILTER_TAGS = ['All', 'Chibi Character', '3D Maze', 'Coastal / Ocean', 'Custom Shaders']

export const AllWorldsGrid: React.FC<AllWorldsGridProps> = ({
  projects,
  onScrollToProject,
  onClose,
}) => {
  const [selectedTag, setSelectedTag] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesTag =
        selectedTag === 'All' ||
        p.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()))
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        p.fullTitle.toLowerCase().includes(q) ||
        p.sheetTitle.toLowerCase().includes(q) ||
        p.conceptHeadlineEn.toLowerCase().includes(q) ||
        p.protagonist.name.toLowerCase().includes(q) ||
        p.landmarks.some((l) => l.toLowerCase().includes(q))
      return matchesTag && matchesSearch
    })
  }, [projects, selectedTag, searchQuery])

  return (
    <div className="atlas-modal-backdrop" onClick={onClose}>
      <div
        className="atlas-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="All Three.js Worlds Directory"
      >
        <header className="atlas-modal-header">
          <div>
            <span className="atlas-eyebrow">// 全6作品アーカイブ • ALL THREE.JS WORLDS ATLAS</span>
            <h2 className="atlas-title">DISCOVER ALL 6 INTERACTIVE WORLDS</h2>
          </div>

          <button type="button" className="atlas-close-btn" onClick={onClose}>
            ✕ CLOSE ATLAS
          </button>
        </header>

        <div className="atlas-filter-bar">
          <div className="atlas-tag-pills">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`atlas-tag-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="atlas-search-box">
            <input
              type="search"
              placeholder="Search character, landmark, shader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="atlas-cards-grid">
          {filteredProjects.map((proj) => {
            return (
              <div
                key={proj.slug}
                className="atlas-world-card"
                style={
                  {
                    '--card-ring': proj.palette.portalOuterRing,
                    '--card-sky': proj.palette.portalSkyTop,
                    '--card-accent': proj.protagonist.accentColor,
                  } as React.CSSProperties
                }
              >
                <div className="atlas-card-top">
                  <span className="atlas-card-id">{proj.categoryJp}</span>
                  <div className="atlas-card-pill">
                    <span>{proj.pillLeft}</span>
                    <strong>{proj.pillRight}</strong>
                  </div>
                </div>

                <div className="atlas-card-main">
                  <div className="atlas-card-text">
                    <h3>{proj.sheetTitle}</h3>
                    <h4>{proj.fullTitle}</h4>
                    <p>{proj.conceptHeadlineEn}</p>
                  </div>

                  {/* Mini circular emblem preview that opens in a new page */}
                  <a
                    href={proj.worldUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="atlas-mini-orb"
                    title={`Open ${proj.fullTitle} in a new page`}
                  >
                    <div className="atlas-mini-orb-inner">
                      <span className="atlas-orb-play">↗</span>
                    </div>
                  </a>
                </div>

                <div className="atlas-card-protagonist">
                  <span
                    className="protagonist-dot"
                    style={{ background: proj.protagonist.badgeColor }}
                  />
                  <strong>{proj.protagonist.name}</strong>
                  <span>• {proj.protagonist.trait}</span>
                </div>

                <div className="atlas-card-actions">
                  <button
                    type="button"
                    className="atlas-btn-secondary"
                    onClick={() => {
                      onScrollToProject(proj.slug)
                      onClose()
                    }}
                  >
                    ↓ Scroll to Section
                  </button>
                  <a
                    href={proj.worldUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="atlas-btn-primary atlas-link-btn"
                  >
                    ↗ Open in New Page
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
