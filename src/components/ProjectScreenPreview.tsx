import React, { useState } from 'react'
import type { ProjectWorld } from '../data/projects'

interface ProjectScreenPreviewProps {
  project: ProjectWorld
}

export const ProjectScreenPreview: React.FC<ProjectScreenPreviewProps> = ({ project }) => {
  const [livePreview, setLivePreview] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (livePreview) return
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setTilt({ x: ny * -3.5, y: nx * 3.5 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  const renderScreenArtwork = () => {
    switch (project.slug) {
      case 'blue-medina-road':
        return (
          <svg viewBox="0 0 800 500" className="screen-scene-svg" aria-label={project.fullTitle}>
            <defs>
              <linearGradient id="medina-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="45%" stopColor="#1E3A8A" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="medina-wall-l" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="medina-wall-r" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
              <radialGradient id="lantern-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Starlit Cobalt Sky Backdrop */}
            <rect width="800" height="500" fill="url(#medina-sky)" />
            <circle cx="650" cy="88" r="54" fill="#FEF3C7" opacity="0.14" />
            <circle cx="650" cy="88" r="32" fill="#FDE68A" opacity="0.28" />

            {/* Twinkling Stars */}
            {[
              [120, 62, 3],
              [240, 44, 2.5],
              [390, 70, 3.5],
              [520, 48, 2.5],
              [710, 66, 3],
              [610, 125, 2],
              [165, 118, 2],
            ].map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="#FFFBEB" opacity="0.85" />
            ))}

            {/* Distant Celestial Belvedere Summit Arch */}
            <g transform="translate(335, 62)">
              <rect x="0" y="26" width="130" height="110" rx="4" fill="#1E40AF" stroke="#60A5FA" strokeWidth="1.5" />
              <path d="M 22 136 L 22 68 C 22 36, 108 36, 108 68 L 108 136 Z" fill="#0F172A" />
              <circle cx="65" cy="64" r="24" fill="url(#lantern-glow)" />
              <polygon points="65,48 69,59 80,63 69,67 65,78 61,67 50,63 61,59" fill="#FDE047" />
            </g>

            {/* Left & Right Chefchaouen Cobalt Medina Buildings */}
            <polygon points="0,110 255,155 255,470 0,500" fill="url(#medina-wall-l)" />
            <polygon points="800,95 545,150 545,470 800,500" fill="url(#medina-wall-r)" />

            {/* Whitewash Top Parapets */}
            <polygon points="0,110 255,155 255,176 0,136" fill="#EFF6FF" opacity="0.92" />
            <polygon points="800,95 545,150 545,172 800,122" fill="#EFF6FF" opacity="0.92" />

            {/* Moroccan Keyhole Archways on Walls */}
            <path d="M 65 370 L 65 255 C 65 215, 145 215, 145 255 L 145 370 Z" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="2" />
            <path d="M 640 355 L 640 245 C 640 205, 725 205, 725 245 L 725 355 Z" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="2" />

            {/* Ascending 136 Impasto Cobalt Stairway */}
            {Array.from({ length: 11 }).map((_, idx) => {
              const t = idx / 10
              const y = 175 + t * 295
              const h = 16 + t * 14
              const w = 150 + t * 410
              const x = 400 - w / 2
              const colors = ['#93C5FD', '#60A5FA', '#3B82F6', '#2563EB']
              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx="3"
                    fill={colors[idx % colors.length]}
                    stroke="#DBEAFE"
                    strokeWidth="1.2"
                  />
                  <line
                    x1={x + 12}
                    y1={y + 4}
                    x2={x + w - 18}
                    y2={y + 4}
                    stroke="#EFF6FF"
                    strokeWidth="2"
                    opacity="0.65"
                  />
                </g>
              )
            })}

            {/* Hanging Moroccan Lanterns */}
            <circle cx="195" cy="195" r="36" fill="url(#lantern-glow)" />
            <polygon points="195,178 203,195 195,212 187,195" fill="#FDE047" />
            <circle cx="605" cy="188" r="36" fill="url(#lantern-glow)" />
            <polygon points="605,171 613,188 605,205 597,188" fill="#FDE047" />

            {/* White Amphora Pots along Steps */}
            <ellipse cx="235" cy="365" rx="18" ry="24" fill="#F8FAFC" stroke="#93C5FD" strokeWidth="2" />
            <ellipse cx="565" cy="335" rx="16" ry="22" fill="#F8FAFC" stroke="#93C5FD" strokeWidth="2" />

            {/* Streaming Wind Ribbons & Star Trail */}
            <path
              d="M 250 385 Q 330 330 392 268 T 485 188"
              fill="none"
              stroke="#FDE047"
              strokeWidth="3.5"
              strokeDasharray="8 6"
            />
            <path
              d="M 275 400 Q 350 345 408 278"
              fill="none"
              stroke="#BAE6FD"
              strokeWidth="2.5"
              opacity="0.85"
            />

            {/* Soaring Chibi Protagonist: Lumina */}
            <g transform="translate(396, 232) rotate(-12)">
              {/* Katana Scabbard */}
              <line x1="-34" y1="22" x2="26" y2="-4" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
              {/* Coral Backpack */}
              <rect x="-18" y="2" width="16" height="22" rx="5" fill="#FB7185" />
              {/* Sage Tunic */}
              <polygon points="-20,28 20,28 12,-2 -12,-2" fill="#A7F3D0" stroke="#1E293B" strokeWidth="2" />
              {/* Chibi Head */}
              <circle cx="0" cy="-20" r="18" fill="#FFE4C4" stroke="#1E293B" strokeWidth="2" />
              {/* Cobalt-Black Bob Hair & Bouncy Ahoge Curl */}
              <path d="M -18 -20 C -18 -42, 18 -42, 18 -20 Z" fill="#1E293B" />
              <path d="M 0 -38 C 6 -54, 22 -48, 12 -36" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
              {/* Sparkling Star Trail */}
              <polygon points="42,-28 46,-18 56,-14 46,-10 42,0 38,-10 28,-14 38,-18" fill="#FDE047" />
            </g>
          </svg>
        )

      case 'coastal-house':
        return (
          <svg viewBox="0 0 800 500" className="screen-scene-svg" aria-label={project.fullTitle}>
            <defs>
              <linearGradient id="coastal-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="58%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#E0F2FE" />
              </linearGradient>
              <linearGradient id="coastal-sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" />
                <stop offset="50%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#2DD4BF" />
              </linearGradient>
            </defs>

            {/* Mediterranean Sky & Sun */}
            <rect width="800" height="300" fill="url(#coastal-sky)" />
            <circle cx="660" cy="86" r="42" fill="#FEF08A" opacity="0.9" />

            {/* GLSL Turquoise Mediterranean Ocean & Seawall Foam */}
            <rect x="0" y="265" width="800" height="110" fill="url(#coastal-sea)" />
            <path d="M 0 292 Q 80 282 160 292 T 320 292 T 480 292 T 640 292 T 800 292" fill="none" stroke="#CCFBF1" strokeWidth="3" opacity="0.75" />
            <path d="M 0 325 Q 100 315 200 325 T 400 325 T 600 325 T 800 325" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity="0.85" />

            {/* Warm Limestone Seawall Promenade */}
            <rect x="0" y="340" width="800" height="160" fill="#FDE68A" />
            <line x1="0" y1="340" x2="800" y2="340" stroke="#D97706" strokeWidth="4" />

            {/* Pastel-Blue Coastal Espresso House (Stepped L-Parapet) */}
            <g transform="translate(175, 92)">
              {/* Chimney */}
              <rect x="52" y="-26" width="24" height="30" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" />
              <rect x="48" y="-32" width="32" height="8" rx="2" fill="#EA580C" />

              {/* Stepped L-Parapet Stucco Body */}
              <path
                d="M 0 255 L 0 0 L 185 0 L 185 46 L 390 46 L 390 255 Z"
                fill="#BAE6FD"
                stroke="#0284C7"
                strokeWidth="2.5"
              />
              {/* White Coping Trim */}
              <path d="M -4 0 L 189 0 L 189 46 L 394 46" fill="none" stroke="#FFFFFF" strokeWidth="6" />

              {/* Arched Cafe Shopfront Window ("SUMOMALO COFFEE") */}
              <path d="M 32 255 L 32 108 C 32 58, 148 58, 148 108 L 148 255 Z" fill="#451A03" stroke="#F8FAFC" strokeWidth="5" />
              {/* Warm Glowing Interior Pendant & Counter */}
              <circle cx="90" cy="118" r="16" fill="#FDE047" opacity="0.9" />
              <rect x="44" y="192" width="92" height="46" fill="#B45309" />
              <text x="52" y="102" fill="#FDE047" fontSize="11" fontWeight="800" letterSpacing="1.5">
                SUMOMALO
              </text>

              {/* Terracotta Barrel-Tile Canopy Awning */}
              <polygon points="195,112 378,112 396,144 182,144" fill="#EA580C" stroke="#9A3412" strokeWidth="2" />
              {/* Hinged Teal Cafe Door */}
              <rect x="235" y="148" width="58" height="107" fill="#0D9488" stroke="#F8FAFC" strokeWidth="4" />
              <rect x="245" y="160" width="38" height="44" fill="#FEF3C7" opacity="0.85" />

              {/* Side Window & Mediterranean Planters */}
              <rect x="315" y="156" width="46" height="52" rx="4" fill="#FEF3C7" stroke="#0284C7" strokeWidth="3" />
              <circle cx="172" cy="238" r="22" fill="#16A34A" />
              <rect x="156" y="242" width="32" height="20" rx="3" fill="#EA580C" />
              <circle cx="395" cy="234" r="26" fill="#15803D" />
              <circle cx="388" cy="226" r="5" fill="#FACC15" />
              <circle cx="405" cy="236" r="5" fill="#FB923C" />
            </g>

            {/* Chibi Wandering Ronin with Woven Kasa Hat & Green Leaf Sprout */}
            <g transform="translate(615, 368)">
              <ellipse cx="0" cy="54" rx="28" ry="9" fill="#B45309" opacity="0.28" />
              {/* Diagonal Katana */}
              <line x1="-32" y1="30" x2="32" y2="2" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
              {/* Sage Kimono & Pleated Hakama */}
              <polygon points="-18,12 18,12 24,50 -24,50" fill="#1E293B" />
              <polygon points="-16,-4 16,-4 20,24 -20,24" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
              {/* Chibi Head */}
              <circle cx="0" cy="-18" r="16" fill="#FFE4C4" stroke="#1E293B" strokeWidth="2" />
              {/* Wide Woven Bamboo Kasa Hat */}
              <polygon points="-42,-22 0,-46 42,-22" fill="#FDE047" stroke="#92400E" strokeWidth="2.5" />
              {/* Springy Green Leaf Sprout on Top */}
              <path d="M 0 -46 L 0 -60 C 0 -68, 14 -68, 12 -58 C 9 -52, 0 -54, 0 -54" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
            </g>
          </svg>
        )

      case 'island-world':
        return (
          <svg viewBox="0 0 800 500" className="screen-scene-svg" aria-label={project.fullTitle}>
            <defs>
              <linearGradient id="island-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="48%" stopColor="#1E3A8A" />
                <stop offset="85%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <linearGradient id="island-sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0369A1" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>

            {/* Atmospheric Sanctuary Sky */}
            <rect width="800" height="320" fill="url(#island-sky)" />
            <circle cx="400" cy="240" r="110" fill="#FDE68A" opacity="0.16" />

            {/* Shimmering Horizon Ocean */}
            <rect x="0" y="305" width="800" height="195" fill="url(#island-sea)" />

            {/* Water Reflections */}
            <ellipse cx="400" cy="365" rx="235" ry="26" fill="#38BDF8" opacity="0.22" />
            <ellipse cx="390" cy="355" rx="165" ry="14" fill="#FDE047" opacity="0.18" />

            {/* Sculpted Basalt Coastal Rocks & Golden Island Mound */}
            <polygon points="180,325 235,268 305,295 320,325" fill="#475569" />
            <polygon points="480,325 525,272 595,302 620,325" fill="#334155" />
            <ellipse cx="395" cy="322" rx="195" ry="38" fill="#FBBF24" />
            <ellipse cx="395" cy="312" rx="165" ry="28" fill="#4ADE80" />

            {/* Swaying Tropical Palm Grove */}
            <g stroke="#78350F" strokeWidth="7" fill="none" strokeLinecap="round">
              <path d="M 295 305 Q 275 225 245 162" />
              <path d="M 485 305 Q 505 230 535 170" />
            </g>
            <g fill="#16A34A">
              <ellipse cx="220" cy="162" rx="34" ry="10" transform="rotate(-22 220 162)" />
              <ellipse cx="268" cy="158" rx="34" ry="10" transform="rotate(18 268 158)" />
              <ellipse cx="245" cy="145" rx="30" ry="9" transform="rotate(-4 245 145)" />
              <ellipse cx="512" cy="168" rx="34" ry="10" transform="rotate(-18 512 168)" />
              <ellipse cx="558" cy="172" rx="34" ry="10" transform="rotate(24 558 172)" />
            </g>

            {/* Warm Timber Island Cabin */}
            <g transform="translate(338, 215)">
              <rect x="12" y="34" width="92" height="62" fill="#B45309" stroke="#78350F" strokeWidth="2" />
              <polygon points="0,36 58,-6 116,36" fill="#7C2D12" stroke="#451A03" strokeWidth="2" />
              {/* Glowing Cabin Window */}
              <rect x="44" y="52" width="28" height="26" rx="3" fill="#FEF08A" />
              <line x1="58" y1="52" x2="58" y2="78" stroke="#78350F" strokeWidth="2" />
              <line x1="44" y1="65" x2="72" y2="65" stroke="#78350F" strokeWidth="2" />
            </g>

            {/* Moored Wooden Rowboat Bobbing on Ocean */}
            <g transform="translate(545, 348)">
              <polygon points="0,0 86,0 70,22 16,22" fill="#EA580C" stroke="#7C2D12" strokeWidth="2" />
              <line x1="36" y1="4" x2="54" y2="30" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
              <path d="M -10 26 Q 43 34 96 26" fill="none" stroke="#BAE6FD" strokeWidth="2" />
            </g>

            {/* Atmospheric Floating Light Motes */}
            {[
              [210, 230, 3],
              [310, 180, 4],
              [440, 160, 3.5],
              [560, 225, 3],
              [375, 130, 2.5],
            ].map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="#FDE047" opacity="0.8" />
            ))}
          </svg>
        )

      case 'palm-village-maze':
        return (
          <svg viewBox="0 0 800 500" className="screen-scene-svg" aria-label={project.fullTitle}>
            <defs>
              <linearGradient id="palm-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B45309" />
                <stop offset="55%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FEF3C7" />
              </linearGradient>
            </defs>

            {/* Warm Mesopotamian Golden Sky */}
            <rect width="800" height="500" fill="url(#palm-sky)" />

            {/* Sunlit Packed-Earth Maze Corridor Floor */}
            <polygon points="0,500 245,285 555,285 800,500" fill="#FDE68A" />

            {/* Left & Right Ancient Mud-Brick Alley Walls */}
            <polygon points="0,40 265,145 265,295 0,485" fill="#D97706" stroke="#92400E" strokeWidth="2" />
            <polygon points="800,40 535,145 535,295 800,485" fill="#B45309" stroke="#78350F" strokeWidth="2" />

            {/* Center Pointed Stone Archway Gate */}
            <rect x="265" y="115" width="270" height="180" fill="#D97706" stroke="#78350F" strokeWidth="2" />
            <path d="M 325 295 L 325 195 L 400 142 L 475 195 L 475 295 Z" fill="#FEF3C7" stroke="#92400E" strokeWidth="4" />

            {/* Protruding Roof Timber Rondels (Signature Iraqi Mud-Brick Detail) */}
            {[60, 115, 170, 225].map((x, i) => (
              <circle key={i} cx={x} cy={88 + i * 20} r="7" fill="#78350F" stroke="#FDE68A" strokeWidth="1.5" />
            ))}
            {[740, 685, 630, 575].map((x, i) => (
              <circle key={i} cx={x} cy={88 + i * 20} r="7" fill="#78350F" stroke="#FDE68A" strokeWidth="1.5" />
            ))}

            {/* Cascading Purple Bougainvillea & Red Pomegranate Vines */}
            <g>
              <circle cx="265" cy="145" r="34" fill="#9333EA" />
              <circle cx="302" cy="135" r="28" fill="#A855F7" />
              <circle cx="535" cy="142" r="36" fill="#9333EA" />
              <circle cx="495" cy="132" r="26" fill="#C084FC" />
              <circle cx="282" cy="152" r="6" fill="#EF4444" />
              <circle cx="515" cy="148" r="6" fill="#EF4444" />
            </g>

            {/* Towering Date Palms Overhead */}
            <path d="M 365 142 L 365 20" stroke="#78350F" strokeWidth="14" />
            <ellipse cx="320" cy="32" rx="58" ry="14" fill="#15803D" transform="rotate(-18 320 32)" />
            <ellipse cx="415" cy="32" rx="58" ry="14" fill="#16A34A" transform="rotate(18 415 32)" />

            {/* Glowing BFS Auto-Pathfinding Guide Thread on Floor */}
            <path
              d="M 400 475 Q 425 395 400 335 T 400 265"
              fill="none"
              stroke="#FACC15"
              strokeWidth="5"
              strokeDasharray="10 6"
            />

            {/* Protagonist: Hana in Wide Flared Golden-Yellow Raincoat */}
            <g transform="translate(400, 368)">
              <ellipse cx="0" cy="58" rx="30" ry="10" fill="#92400E" opacity="0.3" />
              {/* Black Boots */}
              <rect x="-12" y="40" width="9" height="18" rx="3" fill="#1E293B" />
              <rect x="3" y="40" width="9" height="18" rx="3" fill="#1E293B" />
              {/* Flared Golden Raincoat with 2 Black Buttons */}
              <polygon points="-16,0 16,0 32,44 -32,44" fill="#FACC15" stroke="#854D0E" strokeWidth="2.5" />
              <circle cx="0" cy="15" r="3" fill="#1E293B" />
              <circle cx="0" cy="28" r="3" fill="#1E293B" />
              {/* Bell-Shaped Jet-Black Bob & ^ ^ Smiling Eyes */}
              <path d="M -22 -14 C -22 -42, 22 -42, 22 -14 L 26 -2 L -26 -2 Z" fill="#0F172A" />
              <circle cx="0" cy="-16" r="16" fill="#FFFBEB" stroke="#1E293B" strokeWidth="2" />
              <path d="M -9 -17 Q -6 -22 -3 -17 M 3 -17 Q 6 -22 9 -17" fill="none" stroke="#1E293B" strokeWidth="2.2" />
            </g>
          </svg>
        )

      case 'santorini-sea-maze':
        return (
          <svg viewBox="0 0 800 500" className="screen-scene-svg" aria-label={project.fullTitle}>
            <defs>
              <linearGradient id="santorini-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="60%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#BAE6FD" />
              </linearGradient>
              <linearGradient id="santorini-pool" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#2DD4BF" />
              </linearGradient>
            </defs>

            {/* Crisp Aegean Sky & Horizon Sea */}
            <rect width="800" height="270" fill="url(#santorini-sky)" />
            <rect x="0" y="210" width="800" height="90" fill="#0369A1" />

            {/* White Sailboats on the Aegean */}
            <g transform="translate(635, 195)">
              <polygon points="0,24 38,24 32,32 6,32" fill="#FFFFFF" />
              <polygon points="18,0 18,22 34,22" fill="#F8FAFC" />
            </g>

            {/* Whitewashed Cycladic Labyrinth Walls & Blue Domes */}
            <g transform="translate(75, 85)">
              {/* Left Blue Dome Church */}
              <path d="M 30 95 C 30 32, 140 32, 140 95 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
              <line x1="85" y1="22" x2="85" y2="46" stroke="#FFFFFF" strokeWidth="3" />
              <line x1="75" y1="32" x2="95" y2="32" stroke="#FFFFFF" strokeWidth="3" />
              <rect x="15" y="95" width="145" height="150" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
              <path d="M 62 245 L 62 155 C 62 132, 108 132, 108 155 L 108 245 Z" fill="#38BDF8" />

              {/* Center Cycladic Windmill */}
              <rect x="215" y="72" width="84" height="135" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
              <polygon points="210,72 257,38 304,72" fill="#0284C7" />
              <g stroke="#E2E8F0" strokeWidth="3">
                <line x1="215" y1="42" x2="299" y2="112" />
                <line x1="299" y1="42" x2="215" y2="112" />
              </g>

              {/* Right Whitewashed Terrace & Blue Dome */}
              <path d="M 445 105 C 445 55, 535 55, 535 105 Z" fill="#0284C7" />
              <rect x="425" y="105" width="140" height="140" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
            </g>

            {/* Glowing Aquamarine-Turquoise Stepped Water Channels */}
            <polygon points="0,500 185,295 615,295 800,500" fill="#F8FAFC" />
            <polygon points="145,500 265,310 535,310 655,500" fill="url(#santorini-pool)" />
            {[335, 375, 415, 455].map((y, i) => (
              <line
                key={i}
                x1={245 - i * 22}
                y1={y}
                x2={555 + i * 22}
                y2={y}
                stroke="#CCFBF1"
                strokeWidth="3"
                opacity="0.8"
              />
            ))}

            {/* White Amphora Planters with Dragon Palms */}
            <g transform="translate(175, 345)">
              <ellipse cx="0" cy="36" rx="20" ry="26" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
              <path d="M 0 10 L -22 -24 M 0 10 L 0 -30 M 0 10 L 22 -24" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Protagonist: Midori (Lime Wolf-Cut Hair, Turtleneck & Pleated Skirt) */}
            <g transform="translate(400, 358)">
              <ellipse cx="0" cy="64" rx="28" ry="9" fill="#0284C7" opacity="0.3" />
              {/* Black Pleated Skirt */}
              <polygon points="-20,24 20,24 28,44 -28,44" fill="#1E293B" />
              {/* Oversized Green Turtleneck Sweater */}
              <polygon points="-18,-2 18,-2 22,26 -22,26" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
              {/* Chibi Head */}
              <circle cx="0" cy="-20" r="16" fill="#FFFBEB" stroke="#1E293B" strokeWidth="2" />
              {/* Apple-Lime Wolf-Cut Spiky Bob */}
              <polygon points="-24,-14 -18,-40 0,-46 18,-40 24,-14 16,-8 -16,-8" fill="#84CC16" stroke="#15803D" strokeWidth="2" />
            </g>
          </svg>
        )

      case 'sunlit-adobe-maze':
        return (
          <svg viewBox="0 0 800 500" className="screen-scene-svg" aria-label={project.fullTitle}>
            <defs>
              <linearGradient id="adobe-wall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C2D12" />
                <stop offset="50%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="sunbeam-ray" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Enclosed Warm Ochre Mud-Plaster Corridor */}
            <rect width="800" height="500" fill="url(#adobe-wall)" />

            {/* Overhead Weathered Cedar Rafters Ceiling */}
            {[18, 46, 74, 102].map((y, i) => (
              <rect
                key={i}
                x={0}
                y={y}
                width={800}
                height={14}
                fill="#451A03"
                opacity={0.9 - i * 0.12}
              />
            ))}

            {/* Pointed Persian Archway Framing the Corridor */}
            <path
              d="M 145 490 L 145 215 L 400 105 L 655 215 L 655 490"
              fill="#9A3412"
              stroke="#FDE68A"
              strokeWidth="3"
            />

            {/* Left 4-Tier Carved Wooden Mashrabiya Lattice Window */}
            <g transform="translate(175, 185)">
              <rect x="0" y="0" width="92" height="145" fill="#FEF08A" stroke="#451A03" strokeWidth="5" />
              <line x1="46" y1="0" x2="46" y2="145" stroke="#78350F" strokeWidth="4" />
              <line x1="0" y1="48" x2="92" y2="48" stroke="#78350F" strokeWidth="4" />
              <line x1="0" y1="96" x2="92" y2="96" stroke="#78350F" strokeWidth="4" />
            </g>

            {/* Projected Diagonal Mashrabiya Sunbeam Rays */}
            <polygon points="267,185 620,355 620,485 267,330" fill="url(#sunbeam-ray)" />

            {/* Corridor Floor & Woven Crimson/Gold Kilim Carpet with Fringes */}
            <polygon points="85,500 245,325 555,325 715,500" fill="#FDE68A" />
            <polygon points="215,490 305,345 495,345 585,490" fill="#B91C1C" stroke="#FEF08A" strokeWidth="3" />
            <polygon points="335,445 400,375 465,445 400,475" fill="#F59E0B" />

            {/* Hanging Pierced-Brass Lantern */}
            <line x1="400" y1="105" x2="400" y2="165" stroke="#FDE047" strokeWidth="3" />
            <polygon points="384,165 416,165 424,190 400,212 376,190" fill="#FDE047" stroke="#78350F" strokeWidth="2" />

            {/* Protagonist: Mina in Bright Red 7-Button A-Line Coat */}
            <g transform="translate(400, 362)">
              <ellipse cx="0" cy="62" rx="28" ry="9" fill="#451A03" opacity="0.35" />
              {/* Red A-Line Coat */}
              <polygon points="-16,0 16,0 30,48 -30,48" fill="#EF4444" stroke="#991B1B" strokeWidth="2.5" />
              {[8, 16, 24, 32, 40].map((by) => (
                <circle key={by} cx="0" cy={by} r="2.2" fill="#FFFFFF" />
              ))}
              {/* Jet-Black Bob with Side Hair Loops */}
              <path d="M -22 -14 C -22 -42, 22 -42, 22 -14 L 24 -2 L -24 -2 Z" fill="#18181B" />
              <circle cx="-22" cy="-12" r="7" fill="none" stroke="#18181B" strokeWidth="3" />
              <circle cx="0" cy="-16" r="16" fill="#FFFBEB" stroke="#18181B" strokeWidth="2" />
            </g>
          </svg>
        )
    }
  }

  return (
    <div className="project-screen-column">
      <div
        className="project-screen-window"
        style={
          {
            transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            '--screen-ring': project.palette.portalOuterRing,
            '--screen-accent': project.palette.accentBar,
            '--screen-highlight': project.palette.portalHighlight,
          } as React.CSSProperties
        }
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top Studio Window Chrome Bar */}
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
              title="Toggle Live Interactive 3D Viewport Preview"
            >
              {livePreview ? '◼ Static Screen' : '⚡ Live 3D Preview'}
            </button>
          </div>
        </div>

        {/* Main Screen Viewport — Clicking Opens the Standalone Three.js Project in a New Page */}
        <div className="screen-viewport-body">
          {livePreview ? (
            <div className="screen-live-iframe-wrap">
              <iframe
                src={project.worldUrl}
                title={`${project.fullTitle} Live Preview`}
                className="screen-live-iframe"
                allow="accelerometer; autoplay; fullscreen; gamepad; gyroscope"
              />
              <a
                href={project.worldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="screen-live-newtab-pill"
              >
                <span>↗ Open Fullscreen in New Page</span>
              </a>
            </div>
          ) : (
            <a
              href={project.worldUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="screen-clickable-stage"
              aria-label={`Open ${project.fullTitle} in a new page`}
            >
              {/* Authentic Rendered Screen of the Three.js Project */}
              {renderScreenArtwork()}

              {/* Simulated In-Game Three.js HUD Overlay on the Screen */}
              <div className="screen-ingame-hud-top">
                <div className="hud-world-chip">
                  <span className="hud-chip-dot" />
                  <strong>{project.fullTitle}</strong>
                </div>
                <div className="hud-tech-chip">
                  {project.pillLeft} • {project.pillRight}
                </div>
              </div>

              <div className="screen-ingame-hud-bottom">
                <div className="hud-protagonist-pill">
                  <span
                    className="hud-protagonist-badge"
                    style={{ background: project.protagonist.badgeColor }}
                  >
                    {project.protagonist.name}
                  </span>
                  <span>{project.protagonist.trait}</span>
                </div>

                <div className="hud-controls-preview">
                  {project.controls.slice(0, 2).map((c) => (
                    <span key={c.keys} className="hud-key-pill">
                      <kbd>{c.keys}</kbd>
                    </span>
                  ))}
                </div>
              </div>

              {/* Center Interactive Hover Launch Overlay */}
              <div className="screen-hover-cta-overlay">
                <div className="screen-cta-circle">
                  <span className="screen-cta-arrow">↗</span>
                </div>
                <span className="screen-cta-title">OPEN 3D WORLD IN NEW PAGE</span>
                <span className="screen-cta-sub">{project.worldUrl}</span>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Bottom Screen Caption & Primary New-Page Action Row */}
      <div className="main-visual-caption-row">
        <a
          href={project.worldUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="launch-world-btn"
        >
          <span className="launch-world-btn-icon">↗</span>
          <span>OPEN «{project.fullTitle}» IN NEW PAGE</span>
          <span className="launch-world-btn-jp">別タブで開く</span>
        </a>
        <span className="main-visual-jp-label">プロジェクト画面 • SCREEN</span>
      </div>
    </div>
  )
}
