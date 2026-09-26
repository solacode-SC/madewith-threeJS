import React, { useState } from 'react'
import type { ProjectWorld } from '../data/projects'
import { IdeaRoughSketch } from './IdeaRoughSketch'
import { ProjectScreenPreview } from './ProjectScreenPreview'

interface ConceptSheetProps {
  project: ProjectWorld
  totalProjects: number
}

export const ConceptSheet: React.FC<ConceptSheetProps> = ({
  project,
  totalProjects,
}) => {
  const [infoTab, setInfoTab] = useState<'story' | 'landmarks' | 'controls'>('story')

  return (
    <article
      id={`project-${project.slug}`}
      className="concept-sheet-card"
      style={
        {
          '--sheet-accent': project.palette.accentBar,
          '--sheet-ink-accent': project.palette.inkAccent,
        } as React.CSSProperties
      }
    >
      {/* Top-Left Signature Gold Edge Block */}
      <div className="sheet-left-edge-block" aria-hidden="true" />

      {/* Top Editorial Header Row */}
      <header className="sheet-header">
        <div className="sheet-title-group">
          <div className="sheet-category-line">
            <span className="sheet-category-jp">{project.categoryJp}</span>
            <span className="sheet-category-divider">•</span>
            <span className="sheet-category-en">{project.categoryEn}</span>
          </div>
          <h2 className="sheet-main-title">
            <a
              href={project.worldUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sheet-title-link"
              title={`Open ${project.fullTitle} in a new page`}
            >
              {project.sheetTitle}
            </a>
          </h2>
        </div>

        {/* Top-Right Split Pill, Tool Icons & Direct New-Page Link */}
        <div className="sheet-meta-group">
          <div className="split-pill-badge" title="Engine & World Scale">
            <span className="split-pill-left">{project.pillLeft}</span>
            <span className="split-pill-right">{project.pillRight}</span>
          </div>

          <div className="tool-icon-row" aria-label="Tech Stack">
            {project.toolBadges.map((badge, i) => (
              <span
                key={badge}
                className={`tool-square-badge ${i === 0 ? 'is-round-glyph' : ''}`}
                title={`Built with ${badge}`}
              >
                {badge}
              </span>
            ))}
          </div>

          <a
            href={project.worldUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="all-worlds-trigger-btn"
            title={`Open ${project.fullTitle} in a new browser tab`}
          >
            <span>OPEN PROJECT</span>
            <span>↗</span>
          </a>
        </div>
      </header>

      {/* Main Two-Column Asymmetric Split Body */}
      <div className="sheet-body-grid">
        {/* LEFT COLUMN: CONCEPT + IDEA ROUGH SKETCH + BRACKETED FEATURE STORY */}
        <div className="sheet-left-col">
          {/* CONCEPT Section */}
          <section className="concept-section">
            <div className="concept-eyebrow-row">
              <h3 className="concept-eyebrow">CONCEPT</h3>
              <span className="concept-world-index">
                PROJECT {project.id} / 0{totalProjects}
              </span>
            </div>

            <h4 className="concept-headline-jp">{project.conceptHeadlineJp}</h4>
            <p className="concept-headline-en">{project.conceptHeadlineEn}</p>
            <p className="concept-lead-line">{project.conceptLead}</p>
          </section>

          {/* Middle Hand-Drawn Blueprint Sketch Box (アイデアラフ) */}
          <section className="sketch-section">
            <IdeaRoughSketch project={project} />
          </section>

          {/* Bottom Feature Story Section */}
          <section className="feature-story-section">
            <div className="feature-header-row">
              <h4 className="feature-bracket-title">{project.featureBracketHeadline}</h4>

              <div className="feature-mini-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={infoTab === 'story'}
                  className={`feature-tab-btn ${infoTab === 'story' ? 'active' : ''}`}
                  onClick={() => setInfoTab('story')}
                >
                  Story
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={infoTab === 'landmarks'}
                  className={`feature-tab-btn ${infoTab === 'landmarks' ? 'active' : ''}`}
                  onClick={() => setInfoTab('landmarks')}
                >
                  Landmarks ({project.landmarks.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={infoTab === 'controls'}
                  className={`feature-tab-btn ${infoTab === 'controls' ? 'active' : ''}`}
                  onClick={() => setInfoTab('controls')}
                >
                  Controls
                </button>
              </div>
            </div>

            {infoTab === 'story' && (
              <div className="feature-story-paragraphs">
                {project.featureStory.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            )}

            {infoTab === 'landmarks' && (
              <div className="feature-landmarks-list">
                {project.landmarks.map((lm, idx) => (
                  <span key={lm} className="landmark-chip">
                    <strong>0{idx + 1}</strong> {lm}
                  </span>
                ))}
              </div>
            )}

            {infoTab === 'controls' && (
              <div className="feature-controls-grid">
                {project.controls.map((ctrl) => (
                  <div key={ctrl.keys} className="control-item-row">
                    <kbd>{ctrl.keys}</kbd>
                    <span>{ctrl.action}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Golden-Ochre Bottom Rule */}
            <div className="feature-gold-underline" />
          </section>
        </div>

        {/* RIGHT COLUMN: SCREEN OF THE THREE.JS PROJECT (CLICK TO OPEN IN NEW PAGE) */}
        <div className="sheet-right-col">
          <ProjectScreenPreview project={project} />
        </div>
      </div>

      {/* Project Presentation Footer with Tags & Direct Standalone Link */}
      <footer className="sheet-footer-nav">
        <div className="sheet-tag-chips">
          {project.tags.map((tag) => (
            <span key={tag} className="sheet-tag-chip">
              #{tag}
            </span>
          ))}
        </div>

        <div className="sheet-keyboard-hint">
          <a
            href={project.worldUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sheet-footer-direct-link"
          >
            Launch standalone Three.js experience at <code>{project.worldUrl}</code> ↗
          </a>
        </div>
      </footer>
    </article>
  )
}
