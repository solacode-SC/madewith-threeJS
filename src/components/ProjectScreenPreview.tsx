import React, { useState } from 'react'
import type { ProjectWorld } from '../data/projects'

interface ProjectScreenPreviewProps {
  project: ProjectWorld
  priority?: boolean
}

export const ProjectScreenPreview: React.FC<ProjectScreenPreviewProps> = ({
  project,
  priority = false,
}) => {
  const [livePreview, setLivePreview] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (livePreview) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const nx = (px - 0.5) * 2
    const ny = (py - 0.5) * 2
    setTilt({
      x: ny * -2.8,
      y: nx * 2.8,
      glareX: Math.round(px * 100),
      glareY: Math.round(py * 100),
    })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 })
  }

  return (
    <div className="project-screen-column">
      <div
        className={`project-screen-window ${isHovered ? 'is-hovered' : ''} ${
          livePreview ? 'is-live' : ''
        }`}
        style={
          {
            transform: livePreview
              ? 'none'
              : `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            '--screen-accent': project.palette.accentBar,
            '--screen-highlight': project.palette.portalHighlight,
            '--glare-x': `${tilt.glareX}%`,
            '--glare-y': `${tilt.glareY}%`,
          } as React.CSSProperties
        }
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Minimal Studio Viewport Chrome Bar */}
        <div className="screen-window-topbar">
          <div className="screen-window-dots" aria-hidden="true">
            <span className="win-dot dot-red" />
            <span className="win-dot dot-amber" />
            <span className="win-dot dot-green" />
          </div>

          <div className="screen-window-url">
            <span className="url-live-pulse" />
            <code>{project.worldUrl}</code>
          </div>

          <div className="screen-window-actions">
            <button
              type="button"
              className={`screen-preview-mode-btn ${livePreview ? 'active' : ''}`}
              onClick={() => setLivePreview((prev) => !prev)}
              title="Toggle Live Interactive 3D Viewport"
            >
              <span className="mode-dot" />
              <span>{livePreview ? 'Exit Live 3D' : 'Interactive 3D'}</span>
            </button>

            <a
              href={project.worldUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="screen-topbar-launch"
              title={`Open ${project.fullTitle} in a new tab`}
              aria-label={`Open ${project.fullTitle} in a new tab`}
            >
              ↗
            </a>
          </div>
        </div>

        {/* Main Screen Viewport — Real 3D Project Screen or Live WebGL Iframe */}
        <div className="screen-viewport-body">
          {livePreview ? (
            <div className="screen-live-iframe-wrap">
              <iframe
                src={project.worldUrl}
                title={`${project.fullTitle} Live 3D Viewport`}
                className="screen-live-iframe"
                allow="accelerometer; autoplay; fullscreen; gamepad; gyroscope"
              />
              <a
                href={project.worldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="screen-live-newtab-pill"
              >
                <span>Open Fullscreen Experience</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : (
            <a
              href={project.worldUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="screen-clickable-stage"
              aria-label={`Open ${project.fullTitle} 3D world in a new tab`}
            >
              {/* Genuine Captured 3D WebGL Screen of the Project */}
              <img
                src={project.screenshotUrl}
                alt={`${project.fullTitle} — Real 3D WebGL Screen`}
                className="screen-real-image"
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
              />

              {/* Subtle Cursor-Following Specular Glare */}
              <div className="screen-specular-glare" aria-hidden="true" />

              {/* Bottom Ambient Vignette + Minimal Status Bar */}
              <div className="screen-bottom-overlay">
                <div className="screen-overlay-left">
                  <span
                    className="screen-protagonist-dot"
                    style={{ background: project.protagonist.badgeColor }}
                  />
                  <span className="screen-protagonist-name">{project.protagonist.name}</span>
                  <span className="screen-overlay-sep">•</span>
                  <span className="screen-protagonist-trait">{project.protagonist.trait}</span>
                </div>

                <div className="screen-overlay-right">
                  {project.toolBadges.map((badge) => (
                    <span key={badge} className="screen-tech-pill">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Smooth Center Floating Glass Launch Pill on Hover */}
              <div className="screen-hover-cta-overlay">
                <div className="screen-cta-pill">
                  <span className="screen-cta-text">Launch 3D World</span>
                  <span className="screen-cta-icon">↗</span>
                </div>
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
