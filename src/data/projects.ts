export interface ControlItem {
  keys: string
  action: string
}

export interface SketchCallout {
  id: string
  title: string
  jpNote: string
  detail: string
  x: number
  y: number
}

export interface ProjectHighlight {
  label: string
  value: string
}

export interface ProjectWorld {
  id: string
  slug:
    | 'blue-medina-road'
    | 'coastal-house'
    | 'island-world'
    | 'palm-village-maze'
    | 'santorini-sea-maze'
    | 'sunlit-adobe-maze'
    | 'maple-valley-city'
    | 'sky-biplane-village'
    | 'cobalt-poppy-meadow'
    | 'harvest-river-canal'
  worldUrl: string
  screenshotUrl: string
  categoryJp: string
  categoryEn: string
  sheetTitle: string
  fullTitle: string
  shortSummary: string
  pillLeft: string
  pillRight: string
  toolBadges: [string, string, string]
  tags: string[]
  highlights: [ProjectHighlight, ProjectHighlight, ProjectHighlight]
  conceptHeadlineJp: string
  conceptHeadlineEn: string
  conceptLead: string
  featureBracketHeadline: string
  featureStory: string[]
  protagonist: {
    name: string
    titleJp: string
    role: string
    badgeColor: string
    accentColor: string
    trait: string
  }
  landmarks: string[]
  controls: ControlItem[]
  sketchCallouts: SketchCallout[]
  palette: {
    accentBar: string
    portalOuterRing: string
    portalSkyTop: string
    portalSkyBottom: string
    portalGround: string
    portalHighlight: string
    inkAccent: string
  }
}

export const PROJECT_WORLDS: ProjectWorld[] = [
  {
    id: '01',
    slug: 'blue-medina-road',
    worldUrl: '/worlds/blue-medina-road/',
    screenshotUrl: '/screenshots/blue-medina-road.png',
    categoryJp: '// 幻想階段グラフィック • 01',
    categoryEn: 'FANTASY SKY STAIRWAY',
    sheetTitle: 'Azure Medina',
    fullTitle: 'Lumina & the Azure Steps',
    shortSummary:
      'Ascend a hand-painted 90-meter Chefchaouen cobalt stairway engineered with geometry-batched 60fps draw calls, 136 impasto steps, white amphora bouquets, and fast chibi sky-flight.',
    pillLeft: '60 FPS Batched',
    pillRight: '136 Steps',
    toolBadges: ['Three.js', 'R3F', 'Batched'],
    tags: ['Character Flight', 'Geometry Batching', 'Procedural Textures', 'Atmosphere Modes'],
    highlights: [
      { label: 'Performance', value: 'Batched 60 FPS' },
      { label: 'Protagonist', value: 'Lumina (Azure Eyes)' },
      { label: 'Atmospheres', value: 'Noon • Golden • Starlit' },
    ],
    conceptHeadlineJp: '蒼い迷宮の136階段 vs 宙を舞う少女ルミナ！！',
    conceptHeadlineEn: 'Levitating Chibi Sky-Wanderer × 90-Meter Cobalt Stairway',
    conceptLead:
      'Soar effortlessly along unobstructed impasto cobalt alleys at locked 60fps, collect 15 floating sky stars, and switch live between three lighting atmospheres.',
    featureBracketHeadline: 'CHEFCHAOUEN × SKY FLIGHT',
    featureStory: [
      'Inspired by the hand-painted cobalt alleys of Chefchaouen, this 90-meter ascending sky road features 136 impasto oil-textured steps, open keyhole arches, and 5 architectural landmarks merged into high-speed batched geometries.',
      'Soar effortlessly as Lumina — sculpted with sparkling sapphire anime eyes, expressive blinking lashes, layered espresso bob hair with a bouncy ahoge curl, oversized sage tunic, coral backpack, and sheathed katana.',
      'Experience snappy critically-damped sky flight with Shift fast-boost wind ribbons, camera-facing wave emotes (F), and 15 collectible Lumina Sky Stars.',
    ],
    protagonist: {
      name: 'Lumina',
      titleJp: '空飛ぶちび少女',
      role: 'Sky-Step Wanderer',
      badgeColor: '#2563EB',
      accentColor: '#3B82F6',
      trait: 'Sparkling Azure Eyes & Fast Sky Flight',
    },
    landmarks: [
      "The Painter's Steps",
      'Whispering Lantern Arch',
      'Courtyard of the Sky Fountain',
      'Bridge of Levitating Amphoras',
      'Celestial Belvedere Summit',
    ],
    controls: [
      { keys: 'WASD / Arrows', action: 'Fast glide along the winding cobalt stairs' },
      { keys: 'Shift / F', action: 'Fast Sky Boost • Smile & Wave to camera' },
      { keys: 'Space / C', action: 'Ascend higher or swoop closer to steps' },
      { keys: 'Click Step', action: 'High-speed auto-pilot flight to any point' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#2563EB',
      portalOuterRing: '#1E3A8A',
      portalSkyTop: '#1D4ED8',
      portalSkyBottom: '#60A5FA',
      portalGround: '#93C5FD',
      portalHighlight: '#3B82F6',
      inkAccent: '#2563EB',
    },
  },
  {
    id: '02',
    slug: 'coastal-house',
    worldUrl: '/worlds/coastal-house/',
    screenshotUrl: '/screenshots/coastal-house.png',
    categoryJp: '// 海辺の建築ジオラマ • 02',
    categoryEn: 'COASTAL CAFE DIORAMA',
    sheetTitle: 'Sumomalo Coast',
    fullTitle: 'Sumomalo Coffee & Wandering Ronin',
    shortSummary:
      'A tactile Mediterranean espresso house diorama featuring pastel-blue stucco, terracotta barrel tiles, a custom GLSL turquoise wave shader, and a wandering bamboo-hat Ronin.',
    pillLeft: 'Custom GLSL',
    pillRight: '360° Diorama',
    toolBadges: ['Three.js', 'GLSL', 'R3F'],
    tags: ['Coastal / Ocean', 'Custom Shaders', 'Interactive Diorama', 'Character Walk'],
    highlights: [
      { label: 'Water Shader', value: 'Custom GLSL Waves' },
      { label: 'Protagonist', value: 'Kasa Ronin' },
      { label: 'Interactivity', value: '360° Walk & Hinged Door' },
    ],
    conceptHeadlineJp: '地中海の珈琲スタンド vs 旅するちび浪人！！',
    conceptHeadlineEn: 'Pastel-Blue Coastal Espresso House × Bamboo-Hat Chibi Samurai',
    conceptLead:
      'Stroll freely around all four sides of a sunlit coastal roastery with interactive doors, bistro seating, and golden-hour lighting.',
    featureBracketHeadline: 'SUMOMALO COFFEE × COASTAL SHADER',
    featureStory: [
      'A tactile Mediterranean coastal diorama featuring hand-troweled pastel-blue stucco bump textures, an iconic stepped parapet roofline, terracotta barrel-tile canopy, and a glowing 3D cafe interior.',
      'Guide the Chibi Wandering Ronin — wearing a wide woven bamboo kasa hat with a springy green leaf sprout on top, sage-green kimono, pleated hakama, and diagonal katana.',
      'Includes a custom GLSL turquoise Mediterranean wave shader with seawall foam, interactive hinged front door, and Sunny Noon / Golden Sunset lighting toggle.',
    ],
    protagonist: {
      name: 'Kasa Ronin',
      titleJp: '竹笠のちび浪人',
      role: 'Coastal Promenade Stroller',
      badgeColor: '#0D9488',
      accentColor: '#14B8A6',
      trait: 'Woven Bamboo Hat & Leaf Sprout',
    },
    landmarks: [
      'Sumomalo Coffee Arched Shopfront',
      'Terracotta Canopy & Hinged Teal Door',
      'Side Bistro Patio & Citrus Planters',
      'Ocean-Facing Limestone Seawall Bench',
      'Stepped Parapet Roof & Chimney',
    ],
    controls: [
      { keys: 'WASD / Arrows', action: 'Walk freely around all 4 sides of the house' },
      { keys: 'Click Ground', action: 'Click-to-walk on the limestone promenade' },
      { keys: 'Click Door', action: 'Open and close the cafe entrance door' },
      { keys: 'Sun Toggle', action: 'Switch between Sunny Noon & Golden Hour' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#0D9488',
      portalOuterRing: '#0F4C5C',
      portalSkyTop: '#0284C7',
      portalSkyBottom: '#38BDF8',
      portalGround: '#FDE68A',
      portalHighlight: '#14B8A6',
      inkAccent: '#0D9488',
    },
  },
  {
    id: '03',
    slug: 'island-world',
    worldUrl: '/worlds/island-world/',
    screenshotUrl: '/screenshots/island-world.png',
    categoryJp: '// 孤島アンビエント • 03',
    categoryEn: 'OCEAN SANCTUARY',
    sheetTitle: 'Isolated Atoll',
    fullTitle: 'ISOLATED — Quiet Place Between Sea & Sky',
    shortSummary:
      'A meditative architectural vignette floating on a tranquil teal ocean, with smooth camera choreography between the timber cabin, swaying palms, and moored wooden boat.',
    pillLeft: 'WebGL PostFX',
    pillRight: '3 Camera Presets',
    toolBadges: ['Three.js', 'R3F', 'PostFX'],
    tags: ['Coastal / Ocean', 'Atmospheric Lighting', 'Cinematic Camera', 'Minimalist'],
    highlights: [
      { label: 'Camera System', value: '3 Curated Presets' },
      { label: 'Environment', value: 'Animated Ocean & Palms' },
      { label: 'Atmosphere', value: 'Ambient Dust & Bloom' },
    ],
    conceptHeadlineJp: '海と空の狭間の孤島 × 静寂のジオラマ世界！！',
    conceptHeadlineEn: 'Drifting Wooden Boat & Island Cabin × Shimmering Horizon Ocean',
    conceptLead:
      'Glide between curated camera angles or orbit freely around a quiet coastal shelter surrounded by endless turquoise water.',
    featureBracketHeadline: 'ISOLATED CABIN × CINEMATIC CAMERA',
    featureStory: [
      'Designed as a meditative architectural vignette floating between sea and sky, combining sculpted coastal rocks, swaying island palms, a warm timber cabin, and a moored wooden boat.',
      'Interactive raycast hover highlights and smooth camera choreography glide effortlessly between the Cabin, Palm Grove, and Boat vantage points.',
      'Enhanced with atmospheric dust motes, multi-layered ocean water reflections, and bloom/vignette post-processing.',
    ],
    protagonist: {
      name: 'Sanctuary Atoll',
      titleJp: '孤島の小舟と小屋',
      role: 'Cinematic Vantage World',
      badgeColor: '#0284C7',
      accentColor: '#38BDF8',
      trait: 'Raycast Object Focus & Orbit Camera',
    },
    landmarks: [
      'Timber Island Cabin',
      'Swaying Tropical Palm Grove',
      'Moored Wooden Rowboat',
      'Sculpted Basalt Coastal Rocks',
    ],
    controls: [
      { keys: 'Click Object', action: 'Focus camera on Cabin, Palms, or Boat' },
      { keys: 'Mouse Drag', action: 'Free 360° orbital inspection' },
      { keys: 'Scroll Wheel', action: 'Smooth dolly zoom in and out' },
      { keys: 'Preset Pills', action: 'Switch curated cinematic camera angles' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#0284C7',
      portalOuterRing: '#1E293B',
      portalSkyTop: '#0F172A',
      portalSkyBottom: '#0284C7',
      portalGround: '#86EFAC',
      portalHighlight: '#38BDF8',
      inkAccent: '#0284C7',
    },
  },
  {
    id: '04',
    slug: 'palm-village-maze',
    worldUrl: '/worlds/palm-village-maze/',
    screenshotUrl: '/screenshots/palm-village-maze.png',
    categoryJp: '// 古代迷宮グラフィック • 04',
    categoryEn: 'MESOPOTAMIAN ALLEY MAZE',
    sheetTitle: 'Palm Labyrinth',
    fullTitle: 'Hana & the Palm Village Maze',
    shortSummary:
      'Explore a sunlit mud-brick date-palm village engineered with geometry-batched draw calls, BFS click-to-walk pathfinding, cascading bougainvillea, and hidden relics.',
    pillLeft: '60 FPS Batched',
    pillRight: '15 Draw Calls',
    toolBadges: ['Three.js', 'R3F', 'BFS'],
    tags: ['3D Maze', 'Geometry Batching', 'Pathfinding', 'Character Walk'],
    highlights: [
      { label: 'Performance', value: '~15 Merged Draw Calls' },
      { label: 'Protagonist', value: 'Hana (Yellow Coat)' },
      { label: 'Navigation', value: 'BFS Pathfinding + Minimap' },
    ],
    conceptHeadlineJp: '古代ナツメヤシの泥煉瓦迷宮 vs 黄色いコートのハナ！！',
    conceptHeadlineEn: 'Sunlit Ancient Mud-Brick Alleyways × Yellow-Raincoat Chibi Explorer',
    conceptLead:
      'Navigate dappled palm shadows and pointed stone archways at locked 60fps with O(1) spatial collision and automated pathfinding.',
    featureBracketHeadline: 'PALM VILLAGE × GEOMETRY BATCHING',
    featureStory: [
      'Recreates a sunlit ancient date-palm village with weathered mud-brick walls, exposed brick patches, protruding roof timber rondels, pointed stone archways, and cascading purple bougainvillea.',
      'Explore as Hana — sculpted with a porcelain-cream face, happy closed arc eyes, bell-shaped jet-black bob hair, and a flared golden-yellow raincoat.',
      'Engineered for ultra-smooth 60fps performance: all static village walls, doors, vines, pomegranate berries, and palm trunks are geometry-batched into ~15 merged BufferGeometry draw calls.',
    ],
    protagonist: {
      name: 'Hana',
      titleJp: '黄色いコートのハナ',
      role: 'Palm Alleyway Pathfinder',
      badgeColor: '#D97706',
      accentColor: '#F59E0B',
      trait: 'Golden Raincoat & BFS Guide Thread',
    },
    landmarks: [
      'Timber-Framed Palm Gate',
      'Bougainvillea & Pomegranate Vine Arch',
      'Date-Palm Oasis Courtyard',
      'Ancient Mud-Brick Rondel Corridor',
    ],
    controls: [
      { keys: 'WASD / Arrows', action: 'Navigate mud-brick maze corridors' },
      { keys: 'Click Floor / Map', action: 'BFS auto-pathfind to any alley or zone' },
      { keys: 'Camera & Sun HUD', action: 'Cycle sun moods, guide thread & wave emote' },
      { keys: 'Relic Hunt', action: 'Discover hidden village zones & golden relics' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#D97706',
      portalOuterRing: '#78350F',
      portalSkyTop: '#B45309',
      portalSkyBottom: '#FBBF24',
      portalGround: '#A3E635',
      portalHighlight: '#F59E0B',
      inkAccent: '#B45309',
    },
  },
  {
    id: '05',
    slug: 'santorini-sea-maze',
    worldUrl: '/worlds/santorini-sea-maze/',
    screenshotUrl: '/screenshots/santorini-sea-maze.png',
    categoryJp: '// 白亜の海岸迷宮 • 05',
    categoryEn: 'CYCLADIC SEA LABYRINTH',
    sheetTitle: 'Santorini Sea',
    fullTitle: 'Midori & the Santorini Sea Maze',
    shortSummary:
      'A sprawling 9×9 whitewashed Cycladic coastal city with glowing turquoise water channels, 16 landmarks, cel-shaded character physics, and 5 dynamic camera modes.',
    pillLeft: '9×9 Sea City',
    pillRight: '16 Landmarks',
    toolBadges: ['Three.js', 'R3F', 'GLSL'],
    tags: ['3D Maze', 'Coastal / Ocean', '5 Camera Modes', 'Cel-Shaded Character'],
    highlights: [
      { label: 'World Grid', value: '9×9 Grid • 16 Landmarks' },
      { label: 'Protagonist', value: 'Midori (Jump-Twirl)' },
      { label: 'Camera Rig', value: '5 Interactive Angles' },
    ],
    conceptHeadlineJp: '白亜とターコイズの海岸迷宮 vs ライム髪のミドリ！！',
    conceptHeadlineEn: '9×9 Cycladic Whitewashed Sea City × Lime Wolf-Cut Explorer',
    conceptLead:
      'Sprint and jump-twirl through glowing aquamarine stepped streets framed by blue domes, spinning windmills, and the Aegean sea.',
    featureBracketHeadline: 'SANTORINI DOMES × 5 CAMERA MODES',
    featureStory: [
      'A sprawling 9×9 Cycladic coastal maze combining granular whitewashed stucco walls, glowing aquamarine-turquoise stepped roads & reflection pools, blue domes, a spinning windmill, lighthouse, and bobbing sailboats.',
      'Play as Midori — crafted with layered apple-lime wolf-cut hair, sparkling emerald eyes, oversized green turtleneck sweater, pleated black skirt, and cel-shaded ink outlines.',
      'Features 16 discoverable landmarks, BFS click-to-walk pathfinding, Jump-Twirl & Wave animations, and 5 dynamic cameras including Postcard Vista and 1st-Person POV.',
    ],
    protagonist: {
      name: 'Midori',
      titleJp: 'ライム髪のミドリ',
      role: 'Cycladic Maze Sprinter',
      badgeColor: '#0284C7',
      accentColor: '#10B981',
      trait: 'Cel-Shaded Rig & Jump-Twirl Physics',
    },
    landmarks: [
      'Blue Dome Caldera Overlook',
      'Spinning Cycladic Windmill Plaza',
      'Turquoise Reflection Pool Steps',
      'Aegean Harbor Pier & Lighthouse',
      'Dragon Palm Amphora Courtyard',
    ],
    controls: [
      { keys: 'WASD + Shift', action: 'Walk and sprint across turquoise stepped alleys' },
      { keys: 'Space / Jump UI', action: 'Perform Midori Jump-Twirl & Wave emotes' },
      { keys: '5 Camera Modes', action: 'Follow, Postcard Vista, Vibe Director, Panorama, POV' },
      { keys: '16 Landmark Map', action: 'Auto-tour or teleport across the 9×9 coastal grid' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#0284C7',
      portalOuterRing: '#0C4A6E',
      portalSkyTop: '#0284C7',
      portalSkyBottom: '#2DD4BF',
      portalGround: '#F8FAFC',
      portalHighlight: '#0EA5E9',
      inkAccent: '#0284C7',
    },
  },
  {
    id: '06',
    slug: 'sunlit-adobe-maze',
    worldUrl: '/worlds/sunlit-adobe-maze/',
    screenshotUrl: '/screenshots/sunlit-adobe-maze.png',
    categoryJp: '// 木漏れ日の室内回廊 • 06',
    categoryEn: 'MASHRABIYA ARCH LABYRINTH',
    sheetTitle: 'Sunlit Adobe',
    fullTitle: 'Mina & the Sunlit Mashrabiya Labyrinth',
    shortSummary:
      'An enclosed cedar-rafter and ochre adobe labyrinth where carved wooden Mashrabiya lattice screens cast geometric diamond sunbeams across woven kilim carpets.',
    pillLeft: '7×7 Interior',
    pillRight: '3 Camera Modes',
    toolBadges: ['Three.js', 'R3F', 'BFS'],
    tags: ['3D Maze', 'Atmospheric Lighting', 'Collision Camera', 'Interior Architecture'],
    highlights: [
      { label: 'Lighting', value: 'Mashrabiya Sunbeams' },
      { label: 'Protagonist', value: 'Mina (Red A-Line Coat)' },
      { label: 'Camera Rig', value: 'Spring-Arm • POV • Arch' },
    ],
    conceptHeadlineJp: '木漏れ日のマシュラビーヤ回廊 vs 赤いコートのミナ！！',
    conceptHeadlineEn: 'Roofed Cedar-Beam & Lattice Sunlight Maze × Red-Coat Chibi Explorer',
    conceptLead:
      'Follow the golden sun-thread through pointed Persian archways, fringed kilim rugs, and carved lattice light projections.',
    featureBracketHeadline: 'MASHRABIYA LATTICE × SUNBEAM SHADER',
    featureStory: [
      'A completely roofed timber-beam and ochre mud-plaster labyrinth enclosed beneath weathered cedar rafters, pointed Persian archways, woven kilim carpets with 3D fringes, and pierced-brass lanterns.',
      '4-tier carved wooden Mashrabiya lattice window screens cast intricate geometric diamond sunbeams across recessed sills, terracotta water jars, and patterned rugs.',
      'Follow Mina in her bright red 7-button A-line coat using a wall-collision spring-arm camera, true 1st-Person POV, or the Watercolor Archway framing angle.',
    ],
    protagonist: {
      name: 'Mina',
      titleJp: '赤いコートのミナ',
      role: 'Sunbeam Corridor Explorer',
      badgeColor: '#C2410C',
      accentColor: '#EA580C',
      trait: 'Wall-Aware Spring Camera & Sun-Thread',
    },
    landmarks: [
      'Carved Mashrabiya Sunbeam Gallery',
      'Woven Kilim Carpet Hallway',
      'Pierced-Brass Lantern Rotunda',
      'Terracotta Amphora Alcove',
    ],
    controls: [
      { keys: 'WASD / Arrows', action: 'Smooth circle-vs-AABB sliding movement' },
      { keys: '3 Camera Angles', action: 'Spring-Arm Follow, 1st-Person POV & Watercolor Arch' },
      { keys: '7×7 Parchment Map', action: 'Click any cell for Golden Sun-Thread BFS guide' },
      { keys: 'Sun Mood Toggle', action: 'Shift lattice sunbeam warmth and shadow angle' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#C2410C',
      portalOuterRing: '#7C2D12',
      portalSkyTop: '#9A3412',
      portalSkyBottom: '#F59E0B',
      portalGround: '#FDE68A',
      portalHighlight: '#EA580C',
      inkAccent: '#C2410C',
    },
  },
  {
    id: '07',
    slug: 'maple-valley-city',
    worldUrl: '/worlds/maple-valley-city/',
    screenshotUrl: '/screenshots/maple-valley-city.png',
    categoryJp: '// 水墨と水彩の紅葉山里 • 07',
    categoryEn: 'SHANSHUI WATERCOLOR CITY',
    sheetTitle: 'Maple Valley',
    fullTitle: 'Kaede & the Maple Brush Valley',
    shortSummary:
      'A sprawling 11×11 East Asian shanshui mountain city surrounded by lush green meadows with grazing Sika deer, fluffy sheep & cranes — featuring detailed Kumiko-lattice houses, a straight-gaze smiling anime explorer with smart obstacle steering, and 3 studio Guzheng & flute songs.',
    pillLeft: '11×11 City & Meadow',
    pillRight: '3 Studio Songs',
    toolBadges: ['Three.js', 'GLSL', 'WebAudio'],
    tags: ['Watercolor / Brush', 'Green Meadow & Animals', 'Anime Character', 'Batched 60 FPS'],
    highlights: [
      { label: 'Protagonist', value: 'Kaede (Big Anime Smile)' },
      { label: 'Outskirts', value: 'Green Meadow & Animals' },
      { label: 'Soundtrack', value: '3 Guzheng & Flute Songs' },
    ],
    conceptHeadlineJp: '水彩筆致の紅葉山里 × 緑の牧場と笑顔の少女カエデ！！',
    conceptHeadlineEn: 'Painterly Shanshui Mountain City × Lush Green Pastures & Smiling Anime Explorer',
    conceptLead:
      'Stroll with Kaede through detailed Kumiko-windowed houses and out into lush green meadows teeming with grazing Sika deer, fluffy sheep, and cranes — with smart obstacle steering and 3 studio songs.',
    featureBracketHeadline: 'SHANSHUI BRUSHWORK × GREEN MEADOW SANCTUARY',
    featureStory: [
      'Upgraded Shanshui architecture featuring catenary-curved dark-slate tiled roofs, exposed eave rafter tails, golden upturned ridge finials, glowing Kumiko rice-paper lattice windows, cedar balconies, and vermilion silk lanterns.',
      'Play as Kaede — sculpted with a straight, confident anime posture, sparkling amber-gold eyes, a big cheerful smile, hime-cut straight locks with a maple kanzashi hairpin, and smart look-ahead obstacle steering that smoothly changes direction around trees and houses.',
      'Step outside the 11×11 city gates into expansive, crystal-clear green meadow pastures with 3D swaying grass, wildflowers, a turquoise spring pond, and animated Spotted Sika Deer, Fluffy Meadow Sheep, Red-Crowned Cranes, and hopping Bunnies.',
    ],
    protagonist: {
      name: 'Kaede',
      titleJp: '紅葉羽織の笑顔少女カエデ',
      role: 'Shanshui & Meadow Anime Explorer',
      badgeColor: '#E25B2B',
      accentColor: '#F78E44',
      trait: 'Big Anime Smile & Smart Obstacle Steering',
    },
    landmarks: [
      'Persimmon Maple Square & Detailed Hero House',
      'Southern Green Meadow Sanctuary (Deer, Sheep & Cranes)',
      'Stepped Whitewashed Arch Breezeway & Cedar Balcony',
      'Ancient Sage Pine Cliff Terrace & Ochre Lodge',
      'Celadon Peak Belvedere & Cloud-Brush Tea Pavilion',
    ],
    controls: [
      { keys: 'WASD / Click World', action: 'Flexible walk with automatic tree & obstacle steering' },
      { keys: 'Green Meadow Walk', action: 'Click outside the city to visit grazing Deer, Sheep & Cranes' },
      { keys: 'Music Pill (M / N)', action: 'Play/pause & switch between 3 Guzheng & Flute songs' },
      { keys: '5 Camera Modes (V)', action: 'Road View, From Up, Painting Vista, Cloud Orbit, POV' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#E25B2B',
      portalOuterRing: '#4E3C30',
      portalSkyTop: '#B5C0A6',
      portalSkyBottom: '#F5E9D4',
      portalGround: '#F48B95',
      portalHighlight: '#F78E44',
      inkAccent: '#C84B20',
    },
  },
  {
    id: '08',
    slug: 'sky-biplane-village',
    worldUrl: '/worlds/sky-biplane-village/',
    screenshotUrl: '/screenshots/sky-biplane-village.png',
    categoryJp: '// 手描き複葉機と大牧場渓谷 • 08',
    categoryEn: '3X ANIME SKY, RIVER & VILLAGE FLIGHT',
    sheetTitle: 'Sky Biplane',
    fullTitle: 'Sora & the Meadow Sky Biplane (3x Valley Edition)',
    shortSummary:
      'Pilot a fast vintage open-cockpit biplane in full-view anime cinema framing over a 3x expanded pastoral village of 32 detailed homesteads, a sparkling animated river with 4 arched bridges, articulated strolling & bridge-crossing villagers, and Morning, Noon, Evening & Starry Night modes.',
    pillLeft: '3x Village & River',
    pillRight: '6 Anime Cameras',
    toolBadges: ['Three.js', 'GLSL', 'WebAudio'],
    tags: ['Fast Biplane Flight', 'Animated River & 4 Bridges', 'Morning / Evening / Night', 'Anime Full View'],
    highlights: [
      { label: 'World Scale', value: '3x Village • 32 Homesteads' },
      { label: 'River & Bridges', value: 'GLSL River + 4 Arched Bridges' },
      { label: 'Time Modes', value: 'Morning • Noon • Evening • Night' },
    ],
    conceptHeadlineJp: '3倍広大な牧場村と煌めく大河・4つの太鼓橋を翔ける複葉機ソラ！！',
    conceptHeadlineEn: 'Fast Anime Full-View Biplane × 3x Village, Animated River Bridges & Day/Night Modes',
    conceptLead:
      'Soar at high speed with dual wingtip vortex ribbons across a 3x larger valley featuring an animated river, 4 arched bridges, articulated waving villagers, rowboats, and live Morning, Evening & Starry Night modes.',
    featureBracketHeadline: 'ANIME FULL VIEW × 3X VILLAGE & RIVER BRIDGES',
    featureStory: [
      'Fly Sora’s vintage open-cockpit biplane with optimized Fast & Turbo Anime speed presets, dynamic speed-FOV zoom, articulated pilot head & fluttering silk scarf, triple sky ribbons (center contrail + dual wingtip trails), and night navigation lights.',
      'Explore a 3x expanded valley with 32 richly detailed fenced homesteads (window shutters, flower boxes, stone wells, vegetable gardens, golden haystacks, chimney smoke, and glowing streetlamps) connected across a custom GLSL animated river by 4 iconic arched bridges.',
      'Watch articulated villagers walk the country lanes, climb up and over the 4 river bridges while waving at your biplane, and row wooden skiffs along the sparkling currents — across Morning Mist, High Noon, Crimson Evening, and Starry Night with twinkling stars, full moon, lantern halos, and river fireflies.',
    ],
    protagonist: {
      name: 'Aviator Sora',
      titleJp: '複葉機の飛行士ソラ',
      role: 'High-Speed Anime Sky Pilot',
      badgeColor: '#467E3E',
      accentColor: '#76B046',
      trait: 'Dual Wingtip Ribbons & Fast Anime Flight',
    },
    landmarks: [
      'Grand Village Stone & Timber Arch Bridge',
      'Riverside Watermill, Red Bridge & Rowboats',
      'Eastern Riverbank Terrace & Sunrise Windmill',
      'Northern Truss Bridge & Highland Orchards',
      'Southern Stone Arch Bridge & Cider Market',
    ],
    controls: [
      { keys: 'WASD / G (Speed)', action: 'Fast banking flight & Relaxed / Fast / Turbo speed presets' },
      { keys: 'Morning / Evening / Night (L)', action: 'Switch Morning Mist, Noon, Crimson Evening & Starry Night' },
      { keys: 'Click Village / Map', action: 'Bank and fly over 32 homesteads & 4 river bridges' },
      { keys: '6 Camera Modes (V)', action: 'Anime Full View, Illustration, Overlook, Chase, Wingtip, Cockpit' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#467E3E',
      portalOuterRing: '#243B22',
      portalSkyTop: '#CBE6D8',
      portalSkyBottom: '#F6F7E4',
      portalGround: '#8EC652',
      portalHighlight: '#76B046',
      inkAccent: '#3A6B33',
    },
  },
  {
    id: '09',
    slug: 'cobalt-poppy-meadow',
    worldUrl: '/worlds/cobalt-poppy-meadow/',
    screenshotUrl: '/screenshots/cobalt-poppy-meadow.png',
    categoryJp: '// 原風景の自然 • 蒼碧のポピー花野 • 09',
    categoryEn: 'PAINTERLY WILDFLOWER SANCTUARY',
    sheetTitle: 'Cobalt Poppy Meadow',
    fullTitle: 'Cobalt Poppy Meadow — Pure Nature Wildflower Sanctuary',
    shortSummary:
      'Immerse in a pristine hand-painted wildflower sanctuary with zero houses or humans. Over 7,950 instanced cobalt poppies, crimson poppies, cornflowers, and chamomiles sway in real-time GPU wind across rolling sage hills framed by iconic indigo sentinel trees.',
    pillLeft: '7,950+ Flora Instances',
    pillRight: 'Pure Nature • 60 FPS',
    toolBadges: ['Three.js', 'GPU Wind', 'WebAudio'],
    tags: ['Pure Untouched Nature', 'Zero Buildings/NPCs', 'InstancedMesh Flora', 'Gouache Landscape', 'Generative Soundscape'],
    highlights: [
      { label: 'Flora Instances', value: '7,950+ in 5 Draw Calls' },
      { label: 'Wind Physics', value: '0ms CPU Vertex Displacement' },
      { label: 'Lighting Moods', value: 'Painterly Noon • Golden • Twilight • Dawn' },
    ],
    conceptHeadlineJp: '人工物ゼロの純粋なる自然美！蒼碧のポピーと群青の巨木が彩る絵画世界！！',
    conceptHeadlineEn: 'Pure Untouched Nature Sanctuary × 7,950+ Wind-Animated Poppies & Indigo Sentinel Trees',
    conceptLead:
      'A serene fine-art landscape crafted strictly without human structures or inhabitants. Wander along a sunlit chalky path surrounded by thousands of velvety blue and scarlet poppies with authentic gouache lighting and synthesized meadow audio.',
    featureBracketHeadline: 'GOUACHE FINE ART × REAL-TIME GPU NATURE SIMULATION',
    featureStory: [
      'Authentic fine-art fidelity: Faithfully reproduces the aesthetic, palette, and composition of the hand-painted gouache artwork — featuring towering cobalt blue poppies (Meconopsis), striking crimson poppy accents, radiating sky-blue cornflowers, and ivory chamomile daisies.',
      'Extreme rendering optimization: 7,950+ wildflowers and tall grass stems batched into just 5 InstancedMesh draw calls, animated smoothly via custom GPU vertex shader wind dynamics with zero CPU recalculation overhead at a locked 60+ FPS.',
      'Generative nature soundscape: 100% synthesized Web Audio engine delivering organic mountain wind breezes, delicate grass and petal rustles, distant meadow warblers, and calming pentatonic harp chimes.',
      'Five cinematic camera views: Seamlessly switch between the exact Artwork Canvas View matching the reference painting, a peaceful eye-level Winding Path Stroll with WASD controls, Hilltop Vista, Macro Bloom close-up, and slow Cinematic Breeze Flight.',
    ],
    protagonist: {
      name: 'Wild Nature',
      titleJp: '大自然の息吹',
      role: 'Untouched Botanical Sanctuary',
      badgeColor: '#1E40AF',
      accentColor: '#3B82F6',
      trait: '7,950+ Wildflowers & Rustling Grasses in GPU Wind',
    },
    landmarks: [
      'Left Ridge Branching Sentinel Tree',
      'Right Hilltop Ultramarine Sentinel Tree',
      'Winding Chalk Sandstone Path',
      'Tiered Sage & Celadon Rolling Saddle Ridges',
      'Distant Periwinkle Atmospheric Mountain Range',
    ],
    controls: [
      { keys: 'WASD / Arrow Keys', action: 'Stroll along the winding earthen path among the flowers' },
      { keys: 'Click & Drag', action: 'Orbit and look around in full 360-degree freedom' },
      { keys: 'Camera View Presets', action: 'Canvas View, Path Stroll, Hilltop Vista, Macro Bloom, Breeze Drift' },
      { keys: 'Atmosphere Moods', action: 'Switch Noon Gouache, Golden Hour, Lavender Dusk, Misty Dawn' },
      { keys: 'Breeze & Sound Controls', action: 'Adjust meadow wind velocity and generative birdsong volume' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#1E40AF',
      portalOuterRing: '#172554',
      portalSkyTop: '#CAD7E6',
      portalSkyBottom: '#F5F5EC',
      portalGround: '#8FA87B',
      portalHighlight: '#3B82F6',
      inkAccent: '#1E3A8A',
    },
  },
  {
    id: '10',
    slug: 'harvest-river-canal',
    worldUrl: '/worlds/harvest-river-canal/',
    screenshotUrl: '/screenshots/harvest-river-canal.png',
    categoryJp: '// 収穫の運河と木造の町 • 10',
    categoryEn: 'ANIME CANAL VOYAGE',
    sheetTitle: 'Harvest River Canal',
    fullTitle: 'Mugi & the Harvest River Canal',
    shortSummary:
      'Steer an authentic anime wooden river skiff with Mugi in her golden wheat crown, braided hair and crescent sickle through a rustic multi-story timber canal town, passing 3 stone arch bridges, spinning watermill, river boulders, and autumn fields.',
    pillLeft: 'GLSL Water Waves',
    pillRight: 'Heroine Mugi & Sickle',
    toolBadges: ['Three.js', 'GLSL', 'WebAudio'],
    tags: ['Anime Boat Voyage', 'Heroine Mugi', 'GLSL River Shader', 'Timber Canal Town', 'Harvest Autumn Landscape'],
    highlights: [
      { label: 'Protagonist', value: 'Mugi (Wheat Crown & Sickle)' },
      { label: 'River Shader', value: 'Custom GLSL Flow & Caustics' },
      { label: 'Town Scene', value: 'Timber Houses, Chimneys & Boulders' },
    ],
    conceptHeadlineJp: '黄金の麦冠と大鎌を携えた少女ムギ × 霧立ち込める木造運河の町！！',
    conceptHeadlineEn: 'Anime River Skiff Voyage × Heroine Mugi, Weathered Timber Town & River Boulders',
    conceptLead:
      'Navigate with Mugi along a winding river canal framed by multi-story timber houses with stone chimneys, river boulders, waving villagers, and falling autumn foliage across 5 cinematic atmospheric moods.',
    featureBracketHeadline: 'ANIME HEROINE MUGI × GLSL WATER & TIMBER TOWN',
    featureStory: [
      'Sculpted 3D wooden canal skiff matching the reference artwork — complete with curved hull ribs, bow prow post, brass lantern with warm volumetric halo, harvested pumpkin crates, and golden wheat sheaves.',
      'Play with Mugi — crafted with long brown hair in two thick braided pigtails woven with golden wheat stalks, wheat wreath crown, emerald teardrop earrings, embroidered crop top and skirt, leather tool holster, and an ornate silver crescent sickle.',
      'Explore dense weathered multi-story timber-and-stone houses with smoking chimneys, mossy river boulders in shallow water, and 3 iconic stone arch bridges set to synthesized acoustic accordion and flute themes.',
    ],
    protagonist: {
      name: 'Mugi',
      titleJp: '麦冠の少女ムギ',
      role: 'Harvest River Navigator',
      badgeColor: '#EAB308',
      accentColor: '#10B981',
      trait: 'Wheat Wreath, Braided Hair, Crescent Sickle & Mismatched Boots',
    },
    landmarks: [
      'Old Granary & Splash Watermill',
      'Merchant Stone Arch Bridge',
      'Sunset Boathouse Quays',
      'Golden Wheat & Maple River Bend',
      'Lantern-Lit Canal Lock Gate',
    ],
    controls: [
      { keys: 'WASD / Arrow Keys', action: 'Manual boat steering & speed along canal' },
      { keys: 'Auto-Cruise (C)', action: 'Toggle hands-free automated canal voyage' },
      { keys: '6 Camera Modes (V)', action: 'Anime Cinema, Mugi Cam, Manga Angle, Arch Bridge, Bow POV, Postcard' },
      { keys: '5 Sky Moods (L)', action: 'Moody Anime Canal (Image 1), Golden Harvest, Dawn, Sunset, Night' },
      { keys: 'Soundtrack (Audio UI)', action: 'Toggle synthesized WebAudio accordion & flute themes' },
    ],
    sketchCallouts: [],
    palette: {
      accentBar: '#EAB308',
      portalOuterRing: '#451A03',
      portalSkyTop: '#4A7C9D',
      portalSkyBottom: '#FCE7C8',
      portalGround: '#CA8A04',
      portalHighlight: '#F59E0B',
      inkAccent: '#D97706',
    },
  },
]
