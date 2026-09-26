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

export interface ProjectWorld {
  id: string
  slug:
    | 'blue-medina-road'
    | 'coastal-house'
    | 'island-world'
    | 'palm-village-maze'
    | 'santorini-sea-maze'
    | 'sunlit-adobe-maze'
  worldUrl: string
  categoryJp: string
  categoryEn: string
  sheetTitle: string
  fullTitle: string
  pillLeft: string
  pillRight: string
  toolBadges: [string, string, string]
  tags: string[]
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
    categoryJp: '// 幻想階段グラフィック • 01',
    categoryEn: 'FANTASY SKY STAIRWAY',
    sheetTitle: 'AZURE MEDINA!',
    fullTitle: 'Lumina & the Azure Steps',
    pillLeft: '2026年 • R3F',
    pillRight: '136 STEPS',
    toolBadges: ['3js', 'R3F', 'GSAP'],
    tags: ['Chibi Character', 'Fantasy Architecture', 'Flight Physics', 'Atmosphere Modes'],
    conceptHeadlineJp: '蒼い迷宮の136階段 vs 宙を舞う少女ルミナ！！',
    conceptHeadlineEn: 'Levitating Chibi Sky-Wanderer × 90-Meter Cobalt Stairway!!',
    conceptLead:
      '油彩パレットナイフで描かれたシャウエンの蒼き石段を、星屑の軌跡とともに駆け上がる——！',
    featureBracketHeadline: '「CHEFCHAOUEN × 浮遊ちび少女」!?',
    featureStory: [
      'Inspired by the hand-painted cobalt alleys of Chefchaouen, this 90-meter ascending sky road features 136 impasto oil-textured steps with whitewash paint drips and 5 architectural landmarks.',
      'Soar effortlessly as Lumina — sculpted with a bouncy ahoge curl, oversized sage tunic, coral backpack, sheathed katana, and aerodynamic pitch/roll banking with streaming wind ribbons.',
      'Collect 15 floating Lumina Sky Stars (✧) and switch live between Chefchaouen Noon, Golden Medina, and Starlit Fantasy atmospheres.',
    ],
    protagonist: {
      name: 'Lumina',
      titleJp: '空飛ぶちび少女',
      role: 'Sky-Step Wanderer',
      badgeColor: '#2563EB',
      accentColor: '#F59E0B',
      trait: 'Ahoge Curl + Star Trail ✧',
    },
    landmarks: [
      "The Painter's Steps",
      'Whispering Lantern Arch',
      'Courtyard of the Sky Fountain',
      'Bridge of Levitating Amphoras',
      'Celestial Belvedere Summit',
    ],
    controls: [
      { keys: 'WASD / Arrows', action: 'Fly along the winding cobalt stairs' },
      { keys: 'Space / C', action: 'Soar higher / Swoop closer to steps' },
      { keys: 'Shift', action: 'Sky Boost with wind ribbons' },
      { keys: 'Click Any Step', action: 'Auto-pilot flight to landmark' },
    ],
    sketchCallouts: [
      {
        id: 'arch',
        title: 'Zellij Horseshoe Arch',
        jpNote: 'モロッコ馬蹄形アーチ',
        detail: 'Keyhole arches with geometric mosaic spandrels & hanging star lanterns',
        x: 22,
        y: 28,
      },
      {
        id: 'steps',
        title: '136 Impasto Cobalt Steps',
        jpNote: '油彩コバルト階段',
        detail: 'Procedural palette-knife oil canvas textures with whitewash drips',
        x: 52,
        y: 66,
      },
      {
        id: 'chibi',
        title: 'Lumina Flight Rig',
        jpNote: '浮遊ちびキャラ構造',
        detail: 'Pitch/roll banking, katana scabbard, bare feet & 4-point star particles',
        x: 78,
        y: 34,
      },
    ],
    palette: {
      accentBar: '#F4B63F',
      portalOuterRing: '#1E3A8A',
      portalSkyTop: '#1D4ED8',
      portalSkyBottom: '#60A5FA',
      portalGround: '#93C5FD',
      portalHighlight: '#FBBF24',
      inkAccent: '#1D4ED8',
    },
  },
  {
    id: '02',
    slug: 'coastal-house',
    worldUrl: '/worlds/coastal-house/',
    categoryJp: '// 海辺の建築ジオラマ • 02',
    categoryEn: 'COASTAL CAFE DIORAMA',
    sheetTitle: 'SUMOMALO COAST!',
    fullTitle: 'Sumomalo Coffee & Wandering Ronin',
    pillLeft: '2026年 • GLSL',
    pillRight: '360° PATIO',
    toolBadges: ['3js', 'GLSL', 'R3F'],
    tags: ['Chibi Character', 'Coastal / Ocean', 'Custom Shaders', 'Interactive Interior'],
    conceptHeadlineJp: '地中海の珈琲スタンド vs 旅するちび浪人！！',
    conceptHeadlineEn: 'Pastel-Blue Coastal Espresso House × Bamboo-Hat Chibi Samurai!!',
    conceptLead:
      '潮風が吹くパステルブルーの珈琲店を舞台に、竹笠の小さな浪人が四方の石畳を自由に歩む——！',
    featureBracketHeadline: '「SUMOMALO COFFEE × 竹笠ちび浪人」!?',
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
      accentColor: '#F97316',
      trait: 'Bamboo Hat + Leaf Sprout 🌱',
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
      { keys: 'Click Ground', action: 'Click-to-walk on limestone promenade' },
      { keys: 'Click Teal Door', action: 'Open/close cafe entrance door' },
      { keys: 'Sun / Sunset HUD', action: 'Switch Noon & Golden Hour lighting' },
    ],
    sketchCallouts: [
      {
        id: 'parapet',
        title: 'Stepped L-Parapet & Awning',
        jpNote: '段差パラペット屋根',
        detail: 'Hand-troweled pastel stucco with terracotta barrel tiles & scalloped mortar',
        x: 25,
        y: 26,
      },
      {
        id: 'cafe',
        title: '3D Espresso Interior',
        jpNote: '珈琲店内部ジオラマ',
        detail: 'Gold transom lettering, espresso tins, wooden counter & warm pendant lamp',
        x: 48,
        y: 62,
      },
      {
        id: 'ronin',
        title: 'Chibi Ronin & Kasa Hat',
        jpNote: '頭上の若葉が揺れる浪人',
        detail: 'Woven bamboo hat with springy leaf sprout, hakama & lacquered katana',
        x: 80,
        y: 40,
      },
    ],
    palette: {
      accentBar: '#F4B63F',
      portalOuterRing: '#0F4C5C',
      portalSkyTop: '#0284C7',
      portalSkyBottom: '#38BDF8',
      portalGround: '#FDE68A',
      portalHighlight: '#F97316',
      inkAccent: '#0F766E',
    },
  },
  {
    id: '03',
    slug: 'island-world',
    worldUrl: '/worlds/island-world/',
    categoryJp: '// 孤島アンビエント • 03',
    categoryEn: 'OCEAN SANCTUARY',
    sheetTitle: 'ISOLATED ATOLL!',
    fullTitle: 'ISOLATED — Quiet Place Between Sea & Sky',
    pillLeft: '2026年 • WEBGL',
    pillRight: '3 PRESETS',
    toolBadges: ['3js', 'R3F', 'FX'],
    tags: ['Coastal / Ocean', 'Atmospheric Lighting', 'Cinematic Camera', 'Postprocessing'],
    conceptHeadlineJp: '海と空の狭間の孤島 × 静寂のジオラマ世界！！',
    conceptHeadlineEn: 'Drifting Wooden Boat & Island Cabin × Shimmering Horizon Ocean!!',
    conceptLead:
      '波音と光粒子だけが漂う絶海の小島で、キャビン・ヤシの木・小舟を巡るシネマティック体験——！',
    featureBracketHeadline: '「ISOLATED CABIN × 絶海シネマカメラ」!?',
    featureStory: [
      'Designed as a meditative architectural vignette floating between sea and sky, combining sculpted coastal rocks, swaying island palms, a warm timber cabin, and a moored wooden boat.',
      'Interactive raycast hover highlights and smooth camera choreography glide effortlessly between the Cabin, Palm Grove, and Boat vantage points.',
      'Enhanced with atmospheric dust motes, multi-layered ocean water reflections, and bloom/vignette post-processing.',
    ],
    protagonist: {
      name: 'The Drifter Boat',
      titleJp: '孤島の小舟と小屋',
      role: 'Sanctuary Vantage Vessel',
      badgeColor: '#0369A1',
      accentColor: '#38BDF8',
      trait: '3 Cinematic Camera Presets ⚓',
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
      { keys: 'Scroll Wheel', action: 'Smooth dolly zoom in/out' },
      { keys: 'Preset Pills', action: 'Switch curated cinematic angles' },
    ],
    sketchCallouts: [
      {
        id: 'cabin',
        title: 'Island Timber Cabin',
        jpNote: '孤島の木造キャビン',
        detail: 'Elevated coastal shelter framed by basalt boulders and warm sunlight',
        x: 28,
        y: 32,
      },
      {
        id: 'palms',
        title: 'Wind-Swaying Palm Cluster',
        jpNote: '海風に揺れるヤシ林',
        detail: 'Curved trunks and layered fronds casting soft island shadows',
        x: 56,
        y: 25,
      },
      {
        id: 'boat',
        title: 'Moored Rowboat & Ocean',
        jpNote: '波間に浮かぶ木舟',
        detail: 'Gentle buoyancy bobbing on animated ocean shader waves',
        x: 75,
        y: 64,
      },
    ],
    palette: {
      accentBar: '#F4B63F',
      portalOuterRing: '#1E293B',
      portalSkyTop: '#0F172A',
      portalSkyBottom: '#0284C7',
      portalGround: '#86EFAC',
      portalHighlight: '#38BDF8',
      inkAccent: '#0369A1',
    },
  },
  {
    id: '04',
    slug: 'palm-village-maze',
    worldUrl: '/worlds/palm-village-maze/',
    categoryJp: '// 古代迷宮グラフィック • 04',
    categoryEn: 'MESOPOTAMIAN ALLEY MAZE',
    sheetTitle: 'PALM LABYRINTH!',
    fullTitle: 'Hana & the Palm Village Maze',
    pillLeft: '2026年 • 60FPS',
    pillRight: '15 DRAW CALLS',
    toolBadges: ['3js', 'R3F', 'BFS'],
    tags: ['Chibi Character', '3D Maze', 'Geometry Batching', 'Pathfinding'],
    conceptHeadlineJp: '古代ナツメヤシの泥煉瓦迷宮 vs 黄色いコートのハナ！！',
    conceptHeadlineEn: 'Sunlit Ancient Mud-Brick Alleyways × Yellow-Raincoat Chibi Explorer!!',
    conceptLead:
      'ナツメヤシの葉影とブーゲンビリアが彩る古代集落の迷宮を、黄金色コートのハナが駆け抜ける——！',
    featureBracketHeadline: '「ANCIENT PALM VILLAGE × 15 DRAW CALLS」!?',
    featureStory: [
      'Recreates a sunlit ancient Iraqi date-palm village with weathered mud-brick walls, exposed brick patches, protruding roof timber rondels, pointed stone archways, and cascading purple bougainvillea.',
      'Explore as Hana — sculpted with a porcelain-cream face, happy closed arc eyes (^ ^), bell-shaped jet-black bob hair, and a wide flared golden-yellow raincoat with 2 black buttons.',
      'Engineered for ultra-smooth 60fps performance: all static village walls, doors, vines, pomegranate berries, and palm trunks are geometry-batched into ~15 merged BufferGeometry draw calls with O(1) spatial collision.',
    ],
    protagonist: {
      name: 'Hana',
      titleJp: '黄色いコートのハナ',
      role: 'Palm Alleyway Pathfinder',
      badgeColor: '#D97706',
      accentColor: '#FACC15',
      trait: 'Golden Raincoat + ^ ^ Smile',
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
      { keys: 'Relic Hunt', action: 'Discover hidden village zones & relics' },
    ],
    sketchCallouts: [
      {
        id: 'mudbrick',
        title: 'Batched Mud-Brick & Rondels',
        jpNote: '泥煉瓦壁と丸太梁',
        detail: 'Weathered plaster with exposed brick patches & protruding roof timbers',
        x: 24,
        y: 30,
      },
      {
        id: 'palms',
        title: 'Date Palms & Bougainvillea',
        jpNote: 'ナツメヤシと紫の花',
        detail: 'Diamond-cut bark rings, golden date clusters & dappled gobo shadows',
        x: 54,
        y: 65,
      },
      {
        id: 'hana',
        title: 'Hana (Yellow Coat Chibi)',
        jpNote: '黄色いレインコートの少女',
        detail: 'Bell bob hair, ^ ^ smiling eyes, flared yellow coat & black boots',
        x: 79,
        y: 35,
      },
    ],
    palette: {
      accentBar: '#F4B63F',
      portalOuterRing: '#78350F',
      portalSkyTop: '#B45309',
      portalSkyBottom: '#FBBF24',
      portalGround: '#A3E635',
      portalHighlight: '#FDE047',
      inkAccent: '#B45309',
    },
  },
  {
    id: '05',
    slug: 'santorini-sea-maze',
    worldUrl: '/worlds/santorini-sea-maze/',
    categoryJp: '// 白亜の海岸迷宮 • 05',
    categoryEn: 'CYCLADIC SEA LABYRINTH',
    sheetTitle: 'SANTORINI SEA!',
    fullTitle: 'Midori & the Santorini Sea Maze',
    pillLeft: '2026年 • 9×9',
    pillRight: '16 LANDMARKS',
    toolBadges: ['3js', 'R3F', 'GLSL'],
    tags: ['Chibi Character', '3D Maze', 'Coastal / Ocean', '5 Camera Modes'],
    conceptHeadlineJp: '白亜とターコイズの海岸迷宮 vs ライム髪のミドリ！！',
    conceptHeadlineEn: '9×9 Cycladic Whitewashed Sea City × Lime Wolf-Cut Anime Explorer!!',
    conceptLead:
      '輝くエーゲ海と16の名所が広がる白亜の迷宮都市を、ジャンプ＆スピンで縦横無尽に探索せよ——！',
    featureBracketHeadline: '「SANTORINI DOMES × 5 CAMERA ANGLES」!?',
    featureStory: [
      'A sprawling 9×9 Cycladic coastal maze combining granular whitewashed stucco walls, glowing aquamarine-turquoise stepped roads & reflection pools, blue domes, a spinning windmill, lighthouse, and bobbing sailboats.',
      'Play as Midori — crafted with layered apple-lime wolf-cut hair, sparkling emerald anime eyes, diagonal /// blush marks, oversized green turtleneck sweater, pleated black skirt, and cel-shaded ink outlines.',
      'Features 16 discoverable landmarks, BFS click-to-walk pathfinding, Jump-Twirl & Wave animations, and 5 dynamic cameras including Reference Postcard Vista and 1st-Person POV.',
    ],
    protagonist: {
      name: 'Midori',
      titleJp: 'ライム髪のミドリ',
      role: 'Cycladic Maze Sprinter',
      badgeColor: '#16A34A',
      accentColor: '#84CC16',
      trait: 'Lime Wolf-Cut + Jump-Twirl ✦',
    },
    landmarks: [
      'Blue Dome Caldera Overlook',
      'Spinning Cycladic Windmill Plaza',
      'Turquoise Reflection Pool Steps',
      'Aegean Harbor Pier & Lighthouse',
      'Dragon Palm Amphora Courtyard',
    ],
    controls: [
      { keys: 'WASD + Shift', action: 'Walk & Sprint across turquoise stepped alleys' },
      { keys: 'Space / Jump UI', action: 'Perform Midori Jump-Twirl & Wave emotes' },
      { keys: '5 Camera Modes', action: 'Follow, Postcard Vista, Vibe Director, Sea Panorama, POV' },
      { keys: '16 Landmark Map', action: 'Auto-tour or teleport across 9×9 coastal grid' },
    ],
    sketchCallouts: [
      {
        id: 'domes',
        title: 'Cycladic Domes & Sea Cliffs',
        jpNote: '白亜のドームとエーゲ海',
        detail: 'Whitewashed arches, azure shutters, spinning windmill & vertex-wave sea',
        x: 24,
        y: 26,
      },
      {
        id: 'pools',
        title: 'Turquoise Stepped Roads',
        jpNote: 'ターコイズ色の水路階段',
        detail: 'Glowing aquamarine water channels & Dragon Palm amphora planters',
        x: 52,
        y: 66,
      },
      {
        id: 'midori',
        title: 'Midori Cel-Shaded Rig',
        jpNote: 'ウルフカットのミドリ',
        detail: 'Lime wolf-cut bob, /// blush, turtleneck sweater & Jump-Twirl physics',
        x: 80,
        y: 36,
      },
    ],
    palette: {
      accentBar: '#F4B63F',
      portalOuterRing: '#0C4A6E',
      portalSkyTop: '#0284C7',
      portalSkyBottom: '#2DD4BF',
      portalGround: '#F8FAFC',
      portalHighlight: '#84CC16',
      inkAccent: '#0284C7',
    },
  },
  {
    id: '06',
    slug: 'sunlit-adobe-maze',
    worldUrl: '/worlds/sunlit-adobe-maze/',
    categoryJp: '// 木漏れ日の室内回廊 • 06',
    categoryEn: 'MASHRABIYA ARCH LABYRINTH',
    sheetTitle: 'SUNLIT ADOBE!',
    fullTitle: 'Mina & the Sunlit Mashrabiya Labyrinth',
    pillLeft: '2026年 • 7×7',
    pillRight: '3 CAMERAS',
    toolBadges: ['3js', 'R3F', 'BFS'],
    tags: ['Chibi Character', '3D Maze', 'Atmospheric Lighting', 'Collision Camera'],
    conceptHeadlineJp: '木漏れ日のマシュラビーヤ回廊 vs 赤いコートのミナ！！',
    conceptHeadlineEn: 'Roofed Cedar-Beam & Lattice Sunlight Maze × Red-Coat Chibi Explorer!!',
    conceptLead:
      '幾何学模様の陽射しが降り注ぐ屋根付き土壁の回廊で、金の太陽糸を頼りに秘宝を探し出せ——！',
    featureBracketHeadline: '「MASHRABIYA LATTICE × 水彩画カメラ」!?',
    featureStory: [
      'A completely roofed timber-beam and ochre mud-plaster labyrinth enclosed beneath weathered cedar rafters, pointed Persian archways, woven kilim carpets with 3D fringes, and pierced-brass lanterns.',
      '4-tier carved wooden Mashrabiya lattice window screens cast intricate geometric diamond sunbeams across recessed sills, terracotta water jars, and patterned rugs.',
      'Follow Mina in her bright red 7-button A-line coat using a wall-collision spring-arm camera, true 1st-Person POV, or the Watercolor Archway framing angle.',
    ],
    protagonist: {
      name: 'Mina',
      titleJp: '赤いコートのミナ',
      role: 'Sunbeam Corridor Explorer',
      badgeColor: '#DC2626',
      accentColor: '#F59E0B',
      trait: 'Red 7-Button Coat + Sun-Thread ☀️',
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
      { keys: 'Sun Mood Toggle', action: 'Shift lattice sunbeam warmth & shadows' },
    ],
    sketchCallouts: [
      {
        id: 'lattice',
        title: '4-Tier Mashrabiya Screen',
        jpNote: '木彫り格子窓の光投影',
        detail: 'Carved wooden lattice projecting geometric diamond light onto rugs',
        x: 24,
        y: 28,
      },
      {
        id: 'archway',
        title: 'Cedar Rafters & Kilim Rugs',
        jpNote: '杉梁天井とキリム絨毯',
        detail: 'Enclosed timber roof, pointed arches & 3D fringed woven carpets',
        x: 52,
        y: 66,
      },
      {
        id: 'mina',
        title: 'Mina (Red-Coat Chibi)',
        jpNote: '赤いAラインコートのミナ',
        detail: 'Jet-black bob with side loops, crimson cheeks & 7 white coat buttons',
        x: 79,
        y: 36,
      },
    ],
    palette: {
      accentBar: '#F4B63F',
      portalOuterRing: '#7C2D12',
      portalSkyTop: '#9A3412',
      portalSkyBottom: '#F59E0B',
      portalGround: '#FDE68A',
      portalHighlight: '#EF4444',
      inkAccent: '#C2410C',
    },
  },
]
