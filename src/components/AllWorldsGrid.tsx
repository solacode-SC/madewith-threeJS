import React, { useMemo, useState } from 'react'
import type { ProjectWorld } from '../data/projects'

interface AllWorldsGridProps {
  projects: ProjectWorld[]
  onScrollToProject: (slug: ProjectWorld['slug']) => void
  onClose: () => void
}

const FILTER_TAGS = ['All', '3D Maze', 'Coastal / Ocean', 'Custom Shaders', 'Character']

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
        p.shortSummary.toLowerCase().includes(q) ||
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
            <span className="atlas-eyebrow">COLLECTION DIRECTORY • 06 WORLDS</span>
            <h2 className="atlas-title">Browse All Interactive 3D Worlds</h2>
          </div>

          <button type="button" className="atlas-close-btn" onClick={onClose}>
            <span>✕ Close</span>
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
              placeholder="Search world, character, shader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="atlas-cards-grid">
          {filteredProjects.map((proj) => (
            <div
              key={proj.slug}
              className="atlas-world-card"
              style={
                {
                  '--card-accent': proj.palette.accentBar,
                } as React.CSSProperties
              }
            >
              <a
                href={proj.worldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="atlas-card-screen-wrap"
                title={`Open ${proj.fullTitle} in a new tab`}
              >
                <img
                  src={proj.screenshotUrl}
                  alt={`${proj.fullTitle} real 3D screen`}
                  className="atlas-card-screen-img"
                  loading="lazy"
                />
                <span className="atlas-card-num-badge">{proj.id}</span>
                <span className="atlas-card-hover-pill">Launch ↗</span>
              </a>

              <div className="atlas-card-body">
                <div className="atlas-card-meta-row">
                  <span className="atlas-card-cat">{proj.categoryEn}</span>
                  <span className="atlas-card-spec">{proj.pillRight}</span>
                </div>

                <h3 className="atlas-card-title">{proj.fullTitle}</h3>
                <p className="atlas-card-desc">{proj.shortSummary}</p>

                <div className="atlas-card-actions">
                  <button
                    type="button"
                    className="atlas-btn-secondary"
                    onClick={() => {
                      onScrollToProject(proj.slug)
                      onClose()
                    }}
                  >
                    View Details
                  </button>
                  <a
                    href={proj.worldUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="atlas-btn-primary"
                  >
                    <span>Open 3D World</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
