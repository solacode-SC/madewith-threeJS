import React, { useState } from 'react'
import type { ProjectWorld } from '../data/projects'

interface IdeaRoughSketchProps {
  project: ProjectWorld
}

export const IdeaRoughSketch: React.FC<IdeaRoughSketchProps> = ({ project }) => {
  const [activeCallout, setActiveCallout] = useState<string | null>(null)

  const renderCustomSketchSvg = () => {
    switch (project.slug) {
      case 'blue-medina-road':
        return (
          <svg viewBox="0 0 460 195" className="rough-svg" aria-label="Blue Medina Road Idea Rough">
            {/* Subtle grid lines */}
            <g stroke="#CBD5E1" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6">
              <line x1="15" y1="98" x2="445" y2="98" />
              <line x1="155" y1="12" x2="155" y2="182" />
              <line x1="305" y1="12" x2="305" y2="182" />
            </g>

            {/* Top-Left: Moroccan Horseshoe Arch & Chimney Tower Sketch */}
            <g stroke="#475569" strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="28" y="22" width="44" height="62" rx="2" />
              <path d="M 36 84 L 36 52 C 36 36, 64 36, 64 52 L 64 84" />
              <circle cx="50" cy="46" r="4" fill="#FDE68A" />
              <path d="M 80 84 L 80 35 L 98 35 L 98 84" />
              <path d="M 76 35 L 102 35 L 95 24 L 83 24 Z" />
              {/* Amphora pots */}
              <ellipse cx="114" cy="74" rx="7" ry="9" />
              <path d="M 109 65 L 119 65 M 114 65 C 110 56, 118 56, 114 49" />
            </g>
            <text x="24" y="16" className="sketch-note">① 馬蹄形アーチ &amp; 白塔</text>
            <text x="104" y="54" className="sketch-note-sm">白アンフォラ壺</text>

            {/* Top-Center: Winding 90m Ascending Cobalt Steps */}
            <g stroke="#475569" strokeWidth="1.3" fill="none" strokeLinecap="round">
              <path d="M 172 82 Q 205 64 218 42 T 268 20" strokeWidth="1.8" />
              <path d="M 192 85 Q 225 67 238 45 T 288 23" strokeWidth="1.8" />
              <line x1="176" y1="78" x2="196" y2="81" />
              <line x1="186" y1="70" x2="206" y2="73" />
              <line x1="196" y1="62" x2="216" y2="65" />
              <line x1="206" y1="53" x2="226" y2="56" />
              <line x1="215" y1="44" x2="235" y2="47" />
              <line x1="228" y1="35" x2="248" y2="38" />
              <line x1="245" y1="27" x2="265" y2="30" />
              {/* Floating star */}
              <path d="M 225 22 L 228 29 L 235 32 L 228 35 L 225 42 L 222 35 L 215 32 L 222 29 Z" fill="#FBBF24" stroke="#B45309" />
            </g>
            <text x="170" y="18" className="sketch-note">② 136段・上昇迷宮ルート</text>
            <text x="244" y="72" className="sketch-note-sm">油彩タッチ階段</text>

            {/* Top-Right Colored Vignette (like the colored plate in the reference!) */}
            <g transform="translate(318, 16)">
              <ellipse cx="58" cy="52" rx="52" ry="22" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.4" />
              <path d="M 20 52 C 32 25, 84 25, 96 52 Z" fill="#60A5FA" stroke="#1E3A8A" strokeWidth="1.3" />
              {/* Chibi flying figure with star */}
              <circle cx="58" cy="24" r="10" fill="#FEF3C7" stroke="#1E293B" strokeWidth="1.3" />
              <path d="M 58 14 C 61 6, 68 9, 63 15" fill="none" stroke="#1E293B" strokeWidth="1.4" />
              <path d="M 48 35 L 68 35 L 72 52 L 44 52 Z" fill="#93C5FD" stroke="#1E293B" strokeWidth="1.2" />
              <path d="M 85 16 L 88 22 L 94 25 L 88 28 L 85 34 L 82 28 L 76 25 L 82 22 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
              <text x="4" y="84" className="sketch-note">③ 空飛ぶルミナ (✧星軌跡)</text>
            </g>

            {/* Bottom Row Sketches: Chibi Face, Katana & Sky Fountain */}
            <g stroke="#475569" strokeWidth="1.25" fill="none" strokeLinecap="round">
              {/* Chibi bob + ahoge */}
              <circle cx="58" cy="142" r="18" />
              <path d="M 40 138 C 42 118, 74 118, 76 138" />
              <path d="M 58 122 C 60 110, 70 112, 64 123" />
              <path d="M 49 142 Q 52 145 55 142 M 61 142 Q 64 145 67 142" />
              <text x="22" y="176" className="sketch-note-sm">あほ毛 + 閉じ目スマイル</text>

              {/* Sky Fountain Orb */}
              <polygon points="195,158 212,148 236,148 253,158 236,168 212,168" />
              <circle cx="224" cy="132" r="11" fill="#E0F2FE" />
              <path d="M 224 143 L 224 156 M 216 148 Q 224 138 232 148" />
              <text x="182" y="182" className="sketch-note-sm">浮遊水球の噴水広場</text>

              {/* Katana & Wind Ribbon */}
              <path d="M 330 156 L 386 126" strokeWidth="2.2" />
              <path d="M 326 142 C 352 132, 372 158, 412 138" strokeDasharray="4 2" stroke="#2563EB" />
              <text x="326" y="174" className="sketch-note-sm">帯リボン &amp; 刀シルエット</text>
            </g>
          </svg>
        )

      case 'coastal-house':
        return (
          <svg viewBox="0 0 460 195" className="rough-svg" aria-label="Coastal House Idea Rough">
            <g stroke="#CBD5E1" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6">
              <line x1="15" y1="98" x2="445" y2="98" />
              <line x1="155" y1="12" x2="155" y2="182" />
              <line x1="305" y1="12" x2="305" y2="182" />
            </g>

            {/* Top-Left: Stepped L-Parapet Coastal House Elevation */}
            <g stroke="#475569" strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 28 84 L 28 32 L 68 32 L 68 44 L 112 44 L 112 84 Z" />
              {/* Terracotta Awning */}
              <path d="M 64 58 L 116 58 L 122 68 L 58 68 Z" fill="#FED7AA" />
              {/* Arched Cafe Window */}
              <path d="M 36 84 L 36 58 C 36 48, 56 48, 56 58 L 56 84" />
              {/* Chimney */}
              <rect x="42" y="20" width="8" height="12" />
            </g>
            <text x="22" y="16" className="sketch-note">① 段差パラペット珈琲店</text>

            {/* Top-Center: 4-Sided Promenade Walk Loop */}
            <g stroke="#475569" strokeWidth="1.3" fill="none" strokeLinecap="round">
              <rect x="195" y="36" width="54" height="38" rx="3" fill="#E0F2FE" />
              <rect x="176" y="24" width="92" height="62" rx="8" strokeDasharray="4 3" stroke="#0D9488" />
              <path d="M 268 52 L 273 46 M 268 52 L 263 46" stroke="#0D9488" />
              <text x="172" y="18" className="sketch-note">② 四方回遊プロムナード</text>
              <text x="203" y="59" className="sketch-note-sm">SUMOMALO</text>
            </g>

            {/* Top-Right Colored Vignette: Chibi Kasa Ronin with Sprout */}
            <g transform="translate(318, 14)">
              <ellipse cx="58" cy="62" rx="48" ry="16" fill="#CCFBF1" stroke="#0F766E" strokeWidth="1.3" />
              {/* Kasa Bamboo Hat */}
              <path d="M 20 38 Q 58 14 96 38 Z" fill="#FDE68A" stroke="#78350F" strokeWidth="1.4" />
              {/* Green Leaf Sprout on top */}
              <path d="M 58 24 L 58 12 C 58 6, 68 6, 66 13 C 64 16, 58 15, 58 15" fill="#4ADE80" stroke="#166534" strokeWidth="1.2" />
              {/* Chibi Head & Kimono */}
              <circle cx="58" cy="44" r="10" fill="#FFEDD5" stroke="#1E293B" strokeWidth="1.3" />
              <path d="M 45 54 L 71 54 L 75 68 L 41 68 Z" fill="#86EFAC" stroke="#1E293B" strokeWidth="1.2" />
              <text x="8" y="86" className="sketch-note">③ 竹笠ちび浪人 (若葉つき)</text>
            </g>

            {/* Bottom Row: Chalkboard A-Frame, Espresso Cup & GLSL Seawall Waves */}
            <g stroke="#475569" strokeWidth="1.25" fill="none" strokeLinecap="round">
              <path d="M 42 165 L 56 125 L 70 165 M 46 154 L 66 154" />
              <rect x="84" y="134" width="24" height="28" rx="3" />
              <text x="28" y="180" className="sketch-note-sm">A看板 &amp; 開閉ドアギミック</text>

              <path d="M 178 145 Q 195 135 212 145 T 246 145 T 280 145" stroke="#0284C7" strokeWidth="1.6" />
              <path d="M 178 158 Q 195 148 212 158 T 246 158 T 280 158" stroke="#38BDF8" strokeWidth="1.4" />
              <text x="180" y="180" className="sketch-note-sm">GLSL 地中海シェーダー波</text>

              <circle cx="372" cy="142" r="16" fill="#FEF3C7" />
              <path d="M 352 162 L 396 162" />
              <text x="334" y="180" className="sketch-note-sm">昼 / 夕焼けライティング切替</text>
            </g>
          </svg>
        )

      case 'island-world':
        return (
          <svg viewBox="0 0 460 195" className="rough-svg" aria-label="Island World Idea Rough">
            <g stroke="#CBD5E1" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6">
              <line x1="15" y1="98" x2="445" y2="98" />
              <line x1="155" y1="12" x2="155" y2="182" />
              <line x1="305" y1="12" x2="305" y2="182" />
            </g>

            {/* Top-Left: Island Cabin & Basalt Rocks */}
            <g stroke="#475569" strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 24 78 Q 72 56 122 78 Z" fill="#E2E8F0" />
              <polygon points="52,66 52,44 86,44 86,66" />
              <polygon points="46,44 69,26 92,44" fill="#FED7AA" />
              <rect x="64" y="52" width="10" height="14" />
            </g>
            <text x="24" y="16" className="sketch-note">① 孤島の木造キャビン</text>

            {/* Top-Center: 3 Camera Orbit Presets */}
            <g stroke="#475569" strokeWidth="1.3" fill="none" strokeLinecap="round">
              <ellipse cx="225" cy="56" rx="46" ry="22" strokeDasharray="4 3" stroke="#0284C7" />
              <circle cx="225" cy="56" r="10" fill="#BAE6FD" />
              <circle cx="180" cy="52" r="4" fill="#F59E0B" />
              <circle cx="256" cy="38" r="4" fill="#F59E0B" />
              <circle cx="248" cy="74" r="4" fill="#F59E0B" />
              <text x="172" y="18" className="sketch-note">② 3視点シネマカメラ軌道</text>
            </g>

            {/* Top-Right Colored Vignette: Island Atoll, Palms & Boat */}
            <g transform="translate(318, 14)">
              <ellipse cx="58" cy="56" rx="52" ry="20" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.4" />
              <ellipse cx="52" cy="52" rx="30" ry="11" fill="#FDE68A" stroke="#B45309" strokeWidth="1.2" />
              {/* Palm tree */}
              <path d="M 46 50 Q 42 32 36 22" fill="none" stroke="#78350F" strokeWidth="2" />
              <path d="M 22 24 Q 36 14 50 24 M 26 18 Q 38 16 48 28" fill="none" stroke="#15803D" strokeWidth="1.8" />
              {/* Wooden Boat */}
              <polygon points="72,56 96,56 90,63 77,63" fill="#F97316" stroke="#7C2D12" strokeWidth="1.2" />
              <text x="10" y="86" className="sketch-note">③ ヤシの孤島と小舟</text>
            </g>

            {/* Bottom Row: Palm Fronds, Rowboat Profile & Floating Particles */}
            <g stroke="#475569" strokeWidth="1.25" fill="none" strokeLinecap="round">
              <path d="M 56 168 Q 60 142 72 124" strokeWidth="2" />
              <path d="M 52 128 Q 72 116 92 128 M 56 136 Q 74 124 90 140" />
              <text x="28" y="182" className="sketch-note-sm">風に揺れるヤシの葉アニメーション</text>

              <polygon points="188,148 262,148 248,162 202,162" fill="#FFEDD5" />
              <line x1="218" y1="148" x2="232" y2="166" />
              <text x="190" y="182" className="sketch-note-sm">浮力揺れ木舟モデル</text>

              <circle cx="348" cy="136" r="2.5" fill="#FBBF24" />
              <circle cx="372" cy="152" r="3.5" fill="#38BDF8" />
              <circle cx="395" cy="132" r="2" fill="#FBBF24" />
              <text x="330" y="182" className="sketch-note-sm">60個の光粒子 &amp; PostFX</text>
            </g>
          </svg>
        )

      case 'palm-village-maze':
        return (
          <svg viewBox="0 0 460 195" className="rough-svg" aria-label="Palm Village Maze Idea Rough">
            <g stroke="#CBD5E1" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6">
              <line x1="15" y1="98" x2="445" y2="98" />
              <line x1="155" y1="12" x2="155" y2="182" />
              <line x1="305" y1="12" x2="305" y2="182" />
            </g>

            {/* Top-Left: Mud-Brick Wall with Roof Timber Rondels & Pointed Arch */}
            <g stroke="#475569" strokeWidth="1.35" fill="none" strokeLinecap="round">
              <rect x="26" y="26" width="96" height="58" />
              {/* Roof timber rondels */}
              <circle cx="38" cy="34" r="3" fill="#D97706" />
              <circle cx="54" cy="34" r="3" fill="#D97706" />
              <circle cx="70" cy="34" r="3" fill="#D97706" />
              <circle cx="86" cy="34" r="3" fill="#D97706" />
              <circle cx="102" cy="34" r="3" fill="#D97706" />
              {/* Pointed archway */}
              <path d="M 56 84 L 56 58 L 70 44 L 84 58 L 84 84" />
              {/* Exposed brick patch */}
              <rect x="32" y="52" width="12" height="6" />
              <rect x="36" y="58" width="12" height="6" />
            </g>
            <text x="22" y="16" className="sketch-note">① 泥煉瓦壁と丸太梁 (Rondels)</text>

            {/* Top-Center: Batched Maze Grid & Date Palm */}
            <g stroke="#475569" strokeWidth="1.3" fill="none" strokeLinecap="round">
              <rect x="182" y="26" width="86" height="56" />
              <path d="M 204 26 L 204 62 M 226 44 L 226 82 M 248 26 L 248 62 M 182 46 L 204 46 M 226 46 L 268 46" />
              <path d="M 192 74 L 215 74 L 215 36 L 258 36" stroke="#D97706" strokeWidth="1.8" strokeDasharray="3 2" />
              <text x="172" y="18" className="sketch-note">② BFS迷宮探索 &amp; 15 Draw Calls</text>
            </g>

            {/* Top-Right Colored Vignette: Hana in Golden Raincoat */}
            <g transform="translate(318, 14)">
              <ellipse cx="58" cy="62" rx="48" ry="16" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.3" />
              {/* Bell-shaped black bob hair */}
              <path d="M 38 38 C 36 16, 80 16, 78 38 L 82 46 L 34 46 Z" fill="#1E293B" />
              <circle cx="58" cy="36" r="11" fill="#FFFBEB" stroke="#1E293B" strokeWidth="1.2" />
              {/* ^ ^ happy eyes */}
              <path d="M 52 35 Q 54 32 56 35 M 60 35 Q 62 32 64 35" stroke="#1E293B" strokeWidth="1.3" fill="none" />
              {/* Wide flared golden-yellow raincoat */}
              <polygon points="46,47 70,47 80,68 36,68" fill="#FACC15" stroke="#854D0E" strokeWidth="1.3" />
              <circle cx="58" cy="54" r="1.6" fill="#1E293B" />
              <circle cx="58" cy="61" r="1.6" fill="#1E293B" />
              <text x="8" y="86" className="sketch-note">③ 黄色いコートのハナ (^ ^)</text>
            </g>

            {/* Bottom Row: Date Palm Trunk, Bougainvillea & Pomegranate Berries */}
            <g stroke="#475569" strokeWidth="1.25" fill="none" strokeLinecap="round">
              <path d="M 52 168 L 56 124 L 66 124 L 70 168" />
              <path d="M 53 136 L 69 144 M 69 136 L 53 144 M 52 150 L 70 158 M 70 150 L 52 158" />
              <text x="24" y="182" className="sketch-note-sm">菱形樹皮のナツメヤシ</text>

              <circle cx="212" cy="142" r="12" fill="#F3E8FF" stroke="#9333EA" />
              <circle cx="228" cy="138" r="10" fill="#F3E8FF" stroke="#9333EA" />
              <circle cx="242" cy="148" r="8" fill="#FEE2E2" stroke="#DC2626" />
              <text x="178" y="182" className="sketch-note-sm">ブーゲンビリア &amp; ザクロの実</text>

              <rect x="338" y="128" width="68" height="34" rx="4" />
              <text x="348" y="149" className="sketch-note-sm">Batch × 15</text>
              <text x="328" y="182" className="sketch-note-sm">高速ジオメトリ結合最適化</text>
            </g>
          </svg>
        )

      case 'santorini-sea-maze':
        return (
          <svg viewBox="0 0 460 195" className="rough-svg" aria-label="Santorini Sea Maze Idea Rough">
            <g stroke="#CBD5E1" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6">
              <line x1="15" y1="98" x2="445" y2="98" />
              <line x1="155" y1="12" x2="155" y2="182" />
              <line x1="305" y1="12" x2="305" y2="182" />
            </g>

            {/* Top-Left: Cycladic Blue Dome & Windmill */}
            <g stroke="#475569" strokeWidth="1.35" fill="none" strokeLinecap="round">
              <path d="M 32 52 C 32 28, 74 28, 74 52 Z" fill="#BAE6FD" stroke="#0284C7" />
              <rect x="32" y="52" width="42" height="32" />
              <line x1="53" y1="22" x2="53" y2="32" />
              {/* Windmill */}
              <rect x="90" y="46" width="24" height="38" />
              <line x1="84" y1="32" x2="120" y2="60" />
              <line x1="120" y1="32" x2="84" y2="60" />
            </g>
            <text x="20" y="16" className="sketch-note">① 青ドームと風車の白亜都市</text>

            {/* Top-Center: 9x9 Coastal Grid & Turquoise Stepped Pools */}
            <g stroke="#475569" strokeWidth="1.3" fill="none" strokeLinecap="round">
              <path d="M 178 78 L 198 78 L 198 64 L 222 64 L 222 48 L 248 48 L 248 32 L 274 32" stroke="#06B6D4" strokeWidth="2.5" />
              <ellipse cx="225" cy="72" rx="34" ry="8" fill="#A5F3FC" stroke="#0891B2" />
              <text x="170" y="18" className="sketch-note">② ターコイズ水路階段 (9×9)</text>
            </g>

            {/* Top-Right Colored Vignette: Midori (Lime Wolf-Cut Chibi) */}
            <g transform="translate(318, 14)">
              <ellipse cx="58" cy="62" rx="48" ry="16" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.3" />
              {/* Spiky lime wolf-cut hair */}
              <path d="M 34 40 L 40 20 L 58 14 L 76 20 L 82 40 L 74 46 L 42 46 Z" fill="#84CC16" stroke="#15803D" strokeWidth="1.3" />
              <circle cx="58" cy="38" r="10" fill="#FFFBEB" stroke="#1E293B" strokeWidth="1.2" />
              {/* Oversized green turtleneck + black pleated skirt */}
              <polygon points="45,48 71,48 74,60 42,60" fill="#22C55E" stroke="#14532D" strokeWidth="1.2" />
              <polygon points="40,60 76,60 80,68 36,68" fill="#1E293B" />
              <text x="6" y="86" className="sketch-note">③ ライム髪ミドリ (Jump-Twirl)</text>
            </g>

            {/* Bottom Row: Dragon Palm in Amphora, Sailboat & 5 Camera Angles */}
            <g stroke="#475569" strokeWidth="1.25" fill="none" strokeLinecap="round">
              <ellipse cx="60" cy="156" rx="12" ry="14" fill="#F8FAFC" />
              <path d="M 60 142 L 46 122 M 60 142 L 60 118 M 60 142 L 74 122" stroke="#15803D" strokeWidth="1.6" />
              <text x="22" y="182" className="sketch-note-sm">白アンフォラ壺の竜血樹</text>

              <polygon points="205,156 248,156 240,164 212,164" />
              <polygon points="226,124 226,152 244,152" fill="#BAE6FD" />
              <text x="184" y="182" className="sketch-note-sm">エーゲ海のヨットと灯台</text>

              <rect x="332" y="128" width="82" height="34" rx="6" />
              <text x="342" y="149" className="sketch-note-sm">5 CAM MODES</text>
              <text x="326" y="182" className="sketch-note-sm">絵葉書アングル &amp; 一人称POV</text>
            </g>
          </svg>
        )

      case 'sunlit-adobe-maze':
        return (
          <svg viewBox="0 0 460 195" className="rough-svg" aria-label="Sunlit Adobe Maze Idea Rough">
            <g stroke="#CBD5E1" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.6">
              <line x1="15" y1="98" x2="445" y2="98" />
              <line x1="155" y1="12" x2="155" y2="182" />
              <line x1="305" y1="12" x2="305" y2="182" />
            </g>

            {/* Top-Left: 4-Tier Mashrabiya Lattice Window & Diamond Sunbeams */}
            <g stroke="#475569" strokeWidth="1.35" fill="none" strokeLinecap="round">
              <rect x="30" y="24" width="46" height="56" fill="#FEF3C7" />
              <line x1="53" y1="24" x2="53" y2="80" />
              <line x1="30" y1="42" x2="76" y2="42" />
              <line x1="30" y1="60" x2="76" y2="60" />
              {/* Projected sunbeam rays */}
              <polygon points="76,30 124,52 124,82 76,78" fill="#FDE68A" opacity="0.55" stroke="none" />
              <line x1="76" y1="32" x2="122" y2="54" stroke="#D97706" strokeDasharray="3 2" />
              <line x1="76" y1="64" x2="122" y2="82" stroke="#D97706" strokeDasharray="3 2" />
            </g>
            <text x="20" y="16" className="sketch-note">① マシュラビーヤ格子窓の光投影</text>

            {/* Top-Center: Enclosed Cedar Rafters & Persian Pointed Archway */}
            <g stroke="#475569" strokeWidth="1.3" fill="none" strokeLinecap="round">
              <line x1="172" y1="26" x2="278" y2="26" strokeWidth="2.4" />
              <line x1="184" y1="32" x2="266" y2="32" />
              <path d="M 192 84 L 192 54 L 225 36 L 258 54 L 258 84" />
              {/* Hanging brass lantern */}
              <line x1="225" y1="36" x2="225" y2="48" />
              <polygon points="220,48 230,48 233,56 225,62 217,56" fill="#FBBF24" />
              <text x="170" y="18" className="sketch-note">② 杉梁天井と尖頭アーチ回廊</text>
            </g>

            {/* Top-Right Colored Vignette: Mina in Red 7-Button A-Line Coat */}
            <g transform="translate(318, 14)">
              <ellipse cx="58" cy="62" rx="48" ry="16" fill="#FED7AA" stroke="#C2410C" strokeWidth="1.3" />
              {/* Jet-black bob with side hair loops */}
              <path d="M 38 38 C 36 16, 80 16, 78 38 L 80 45 L 36 45 Z" fill="#18181B" />
              <circle cx="36" cy="36" r="5" fill="none" stroke="#18181B" strokeWidth="1.5" />
              <circle cx="58" cy="36" r="10.5" fill="#FFFBEB" stroke="#18181B" strokeWidth="1.2" />
              {/* Red A-line coat with white buttons */}
              <polygon points="45,46 71,46 80,68 36,68" fill="#EF4444" stroke="#991B1B" strokeWidth="1.3" />
              <circle cx="58" cy="51" r="1.5" fill="#FFFFFF" />
              <circle cx="58" cy="56" r="1.5" fill="#FFFFFF" />
              <circle cx="58" cy="61" r="1.5" fill="#FFFFFF" />
              <circle cx="58" cy="66" r="1.5" fill="#FFFFFF" />
              <text x="8" y="86" className="sketch-note">③ 赤いコートのミナ (7ボタン)</text>
            </g>

            {/* Bottom Row: Fringed Kilim Rug, Ribbed Water Jar & Golden Sun-Thread */}
            <g stroke="#475569" strokeWidth="1.25" fill="none" strokeLinecap="round">
              <polygon points="34,158 98,158 108,140 44,140" fill="#FEE2E2" stroke="#B91C1C" />
              <polygon points="58,152 72,144 86,152 72,156" fill="#FDE68A" />
              <text x="24" y="182" className="sketch-note-sm">3Dフリンジ付きキリム絨毯</text>

              <ellipse cx="222" cy="150" rx="14" ry="18" fill="#FFEDD5" stroke="#C2410C" />
              <line x1="210" y1="145" x2="234" y2="145" />
              <line x1="209" y1="153" x2="235" y2="153" />
              <text x="184" y="182" className="sketch-note-sm">ろくろ成形テラコッタ水瓶</text>

              <path d="M 332 160 Q 360 126 385 148 T 426 130" stroke="#F59E0B" strokeWidth="2.2" strokeDasharray="4 2" />
              <text x="328" y="182" className="sketch-note-sm">黄金の太陽糸ナビゲーション</text>
            </g>
          </svg>
        )
    }
  }

  return (
    <div className="idea-rough-container">
      <div className="idea-rough-box">
        {renderCustomSketchSvg()}

        {/* Interactive callout pins overlaid on the sketch */}
        <div className="sketch-pins-layer">
          {project.sketchCallouts.map((c, idx) => {
            const isOpen = activeCallout === c.id
            return (
              <button
                key={c.id}
                type="button"
                className={`sketch-pin ${isOpen ? 'active' : ''}`}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                onMouseEnter={() => setActiveCallout(c.id)}
                onMouseLeave={() => setActiveCallout(null)}
                onClick={() => setActiveCallout(isOpen ? null : c.id)}
                aria-label={c.title}
              >
                <span className="sketch-pin-num">{idx + 1}</span>
                {isOpen && (
                  <span className="sketch-pin-tooltip">
                    <strong>{c.jpNote}</strong>
                    <em>{c.title}</em>
                    <span>{c.detail}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="idea-rough-caption-row">
        <span className="idea-rough-hint">
          ✦ Hover pins ①–③ to inspect architectural &amp; shader blueprint notes
        </span>
        <span className="idea-rough-label">アイデアラフ</span>
      </div>
    </div>
  )
}
