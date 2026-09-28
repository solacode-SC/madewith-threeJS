import React, { useEffect, useRef, useState } from 'react'
import type { ProjectWorld } from '../data/projects'
import { ProjectScreenPreview } from './ProjectScreenPreview'

interface ConceptSheetProps {
  project: ProjectWorld
  totalProjects: number
  index: number
}

export const ConceptSheet: React.FC<ConceptSheetProps> = ({
  project,
  totalProjects,
  index,
}) => {
  const [detailTab, setDetailTab] = useState<'controls' | 'landmarks' | 'story'>('controls')
  const [isVisible, setIsVisible] = useState(index === 0)
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <article
      ref={cardRef}
      id={`project-${project.slug}`}
      className={`project-showcase-card ${isVisible ? 'is-visible' : ''} ${
        index % 2 === 1 ? 'is-reversed' : ''
      }`}
      style={
        {
          '--project-accent': project.palette.accentBar,
          '--project-ink': project.palette.inkAccent,
          '--project-badge': project.protagonist.badgeColor,
        } as React.CSSProperties
      }
    >
      <div className="project-card-grid">
        {/* Clean Editorial Details Column */}
        <div className="project-info-col">
          <div className="project-eyebrow-row">
            <span className="project-index-pill">
              {project.id} <span className="index-slash">/</span> 0{totalProjects}
            </span>
            <span className="project-category-label">{project.categoryEn}</span>
          </div>

          <h2 className="project-title">
            <a
              href={project.worldUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-title-link"
            >
              {project.fullTitle}
            </a>
          </h2>

          <p className="project-summary">{project.shortSummary}</p>

          {/* 3 Structured World Highlights */}
          <div className="project-highlights-row">
            {project.highlights.map((item) => (
              <div key={item.label} className="project-highlight-cell">
                <span className="highlight-label">{item.label}</span>
                <strong className="highlight-value">{item.value}</strong>
              </div>
            ))}
          </div>

          {/* Minimal Segmented Details Switcher */}
          <div className="project-details-box">
            <div className="details-tabs-bar" role="tablist" aria-label="Project details">
              <button
                type="button"
                role="tab"
                aria-selected={detailTab === 'controls'}
                className={`details-tab-btn ${detailTab === 'controls' ? 'active' : ''}`}
                onClick={() => setDetailTab('controls')}
              >
                Controls
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={detailTab === 'landmarks'}
                className={`details-tab-btn ${detailTab === 'landmarks' ? 'active' : ''}`}
                onClick={() => setDetailTab('landmarks')}
              >
                Landmarks ({project.landmarks.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={detailTab === 'story'}
                className={`details-tab-btn ${detailTab === 'story' ? 'active' : ''}`}
                onClick={() => setDetailTab('story')}
              >
                About World
              </button>
            </div>

            <div className="details-tab-panel">
              {detailTab === 'controls' && (
                <div className="controls-compact-grid">
                  {project.controls.map((ctrl) => (
                    <div key={ctrl.keys} className="control-compact-item">
                      <kbd className="control-kbd">{ctrl.keys}</kbd>
                      <span className="control-desc">{ctrl.action}</span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'landmarks' && (
                <div className="landmarks-compact-list">
                  {project.landmarks.map((lm, idx) => (
                    <span key={lm} className="landmark-pill">
                      <span className="landmark-num">0{idx + 1}</span>
                      <span>{lm}</span>
                    </span>
                  ))}
                </div>
              )}

              {detailTab === 'story' && (
                <div className="story-compact-copy">
                  {project.featureStory.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Primary Launch Action & Tag Chips */}
          <div className="project-footer-actions">
            <a
              href={project.worldUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-primary-launch-btn"
            >
              <span>Explore 3D World</span>
              <span className="btn-arrow" aria-hidden="true">
                ↗
              </span>
            </a>

            <div className="project-tag-list">
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="project-tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Real 3D Project Screen Column */}
        <div className="project-visual-col">
          <ProjectScreenPreview project={project} priority={index < 2} />
        </div>
      </div>
    </article>
  )
}
