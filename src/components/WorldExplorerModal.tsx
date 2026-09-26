import React, { useEffect, useState } from 'react'
import type { ProjectWorld } from '../data/projects'

interface WorldExplorerModalProps {
  project: ProjectWorld
  allProjects: ProjectWorld[]
  onSelectProject: (project: ProjectWorld) => void
  onClose: () => void
}

export const WorldExplorerModal: React.FC<WorldExplorerModalProps> = ({
  project,
  allProjects,
  onSelectProject,
  onClose,
}) => {
  const [iframeLoading, setIframeLoading] = useState(true)
  const [showControlsHelp, setShowControlsHelp] = useState(false)
  const [hudMinimized, setHudMinimized] = useState(false)

  useEffect(() => {
    setIframeLoading(true)
  }, [project.slug])

  return (
    <div className="world-explorer-overlay" role="dialog" aria-modal="true" aria-label={project.fullTitle}>
      {/* Floating Platform Navigator Bar at Top */}
      <header className={`explorer-floating-hud ${hudMinimized ? 'is-minimized' : ''}`}>
        <button
          type="button"
          className="explorer-back-btn"
          onClick={onClose}
          title="Return to Concept Sheet Showcase"
        >
          <span>←</span>
          <span>CONCEPT SHEET</span>
        </button>

        {!hudMinimized && (
          <>
            <div className="explorer-world-title-pill">
              <span className="explorer-badge-num">{project.id}</span>
              <strong>{project.fullTitle}</strong>
            </div>

            <div className="explorer-quick-switcher" aria-label="Quick Switch World">
              {allProjects.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  className={`explorer-switch-dot ${item.slug === project.slug ? 'active' : ''}`}
                  onClick={() => onSelectProject(item)}
                  title={`${item.id}: ${item.fullTitle}`}
                >
                  {item.id}
                </button>
              ))}
            </div>

            <div className="explorer-hud-actions">
              <button
                type="button"
                className={`explorer-action-btn ${showControlsHelp ? 'active' : ''}`}
                onClick={() => setShowControlsHelp((prev) => !prev)}
              >
                🎮 Controls
              </button>
              <a
                href={project.worldUrl}
                target="_blank"
                rel="noreferrer"
                className="explorer-action-btn"
                title="Open World in Standalone Tab"
              >
                ↗ New Tab
              </a>
            </div>
          </>
        )}

        <button
          type="button"
          className="explorer-minimize-btn"
          onClick={() => setHudMinimized((prev) => !prev)}
          title={hudMinimized ? 'Expand Platform Bar' : 'Minimize Platform Bar'}
        >
          {hudMinimized ? '▾ HUD' : '▴'}
        </button>
      </header>

      {/* Optional Controls Guide Popover */}
      {showControlsHelp && !hudMinimized && (
        <aside className="explorer-controls-popover">
          <div className="popover-header">
            <strong>{project.fullTitle} — Controls &amp; Landmarks</strong>
            <button type="button" onClick={() => setShowControlsHelp(false)}>
              ✕
            </button>
          </div>
          <div className="popover-controls-list">
            {project.controls.map((c) => (
              <div key={c.keys} className="popover-ctrl-row">
                <kbd>{c.keys}</kbd>
                <span>{c.action}</span>
              </div>
            ))}
          </div>
          <div className="popover-landmarks-row">
            {project.landmarks.map((lm) => (
              <span key={lm} className="popover-lm-tag">
                ✦ {lm}
              </span>
            ))}
          </div>
        </aside>
      )}

      {/* Portal Loading Curtain */}
      {iframeLoading && (
        <div className="explorer-loading-curtain">
          <div className="explorer-portal-spinner">
            <span className="spinner-star">✦</span>
          </div>
          <p className="explorer-loading-title">ENTERING «{project.sheetTitle}»</p>
          <p className="explorer-loading-sub">{project.conceptHeadlineJp}</p>
        </div>
      )}

      {/* Fullscreen Interactive Three.js World Iframe */}
      <iframe
        key={project.slug}
        src={project.worldUrl}
        title={project.fullTitle}
        className="explorer-world-iframe"
        allow="accelerometer; autoplay; fullscreen; gamepad; gyroscope"
        onLoad={() => setIframeLoading(false)}
      />
    </div>
  )
}
