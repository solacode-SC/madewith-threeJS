export type CameraMode =
  | 'anime-cinema'
  | 'illustration'
  | 'overlook'
  | 'chase'
  | 'wingtip'
  | 'cockpit';

export type SkyMood =
  | 'morning-mist'
  | 'noon-gouache'
  | 'evening-sunset'
  | 'starry-night';

export type FlightSpeedPreset = 'relaxed' | 'fast' | 'turbo';

export interface CameraModeMeta {
  id: CameraMode;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const CAMERA_MODES: CameraModeMeta[] = [
  {
    id: 'anime-cinema',
    label: 'Anime Full View',
    shortLabel: 'Anime Full',
    icon: '🎬',
    description:
      'Wide panoramic Ghibli/Shinkai anime cinema view framing the fast biplane, winding river bridges, 3x village & sky horizon',
  },
  {
    id: 'illustration',
    label: 'Sky Illustration',
    shortLabel: 'Illustration',
    icon: '🎨',
    description:
      'High-angled hand-drawn illustration view framing the biplane, its ground shadow & the fenced village below',
  },
  {
    id: 'overlook',
    label: 'Valley Overlook',
    shortLabel: 'Overlook',
    icon: '🏡',
    description:
      'Grand bird’s-eye perspective looking over the 3x expanded village districts, animated river & arched bridges',
  },
  {
    id: 'chase',
    label: 'High-Speed Chase',
    shortLabel: 'Chase',
    icon: '✈️',
    description:
      'Dynamic trailing flight camera behind the upper wing with anime speed-FOV zoom over the valley',
  },
  {
    id: 'wingtip',
    label: 'Wingtip Cinema',
    shortLabel: 'Wingtip',
    icon: '🌤️',
    description:
      'Cinematic side angle across the interplane struts, pilot Sora & fluttering scarf with cottages scrolling below',
  },
  {
    id: 'cockpit',
    label: 'Cockpit POV',
    shortLabel: 'Cockpit',
    icon: '🥽',
    description:
      'First-person aviator view from behind the open cockpit windscreen & spinning propeller',
  },
];

export interface SkyMoodTheme {
  id: SkyMood;
  label: string;
  shortLabel: string;
  badgeIcon: string;
  skyTop: string;
  skyHorizon: string;
  sunGlowColor: string;
  sunDirection: [number, number, number];
  fogColor: string;
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  cloudTop: string;
  cloudMid: string;
  cloudShadow: string;
  mistColor: string;
  mistOpacity: number;
  sunbeamColor: string;
  sunbeamOpacity: number;
  terrainSunlit: string;
  terrainWarm: string;
  terrainLush: string;
  terrainDeep: string;
  terrainShadow: string;
  foliageTop: string;
  foliageMid: string;
  foliageShadow: string;
  foliageRim: string;
  riverDeep: string;
  riverShallow: string;
  riverFoam: string;
  riverShimmer: string;
  windowEmissiveIntensity: number;
  lanternEmissiveIntensity: number;
  starIntensity: number;
  moonIntensity: number;
  fireflyIntensity: number;
  shadowDarkness: number;
}

export const SKY_MOOD_THEMES: Record<SkyMood, SkyMoodTheme> = {
  'morning-mist': {
    id: 'morning-mist',
    label: 'Morning Mist & Sunbeams',
    shortLabel: 'Morning',
    badgeIcon: '🌅',
    skyTop: '#BCE0D4',
    skyHorizon: '#F7F6E2',
    sunGlowColor: '#FFF9D2',
    sunDirection: [0.54, 0.62, -0.42],
    fogColor: '#E6F1E0',
    sunColor: '#FFF6D0',
    sunIntensity: 2.45,
    ambientColor: '#DCF0E4',
    ambientIntensity: 0.95,
    hemiSky: '#E6F5EC',
    hemiGround: '#5C9246',
    hemiIntensity: 0.88,
    cloudTop: '#FFFFFF',
    cloudMid: '#F2F9F0',
    cloudShadow: '#B8D2CA',
    mistColor: '#FAFCF6',
    mistOpacity: 0.62,
    sunbeamColor: '#FFF8C4',
    sunbeamOpacity: 0.38,
    terrainSunlit: '#CEE46C',
    terrainWarm: '#95C852',
    terrainLush: '#62A446',
    terrainDeep: '#3C7034',
    terrainShadow: '#274E22',
    foliageTop: '#B8E470',
    foliageMid: '#68A846',
    foliageShadow: '#386E2C',
    foliageRim: '#EEFA9E',
    riverDeep: '#1E7A8C',
    riverShallow: '#58C4D0',
    riverFoam: '#F4FCFA',
    riverShimmer: '#FFFAD6',
    windowEmissiveIntensity: 0.22,
    lanternEmissiveIntensity: 0.15,
    starIntensity: 0.0,
    moonIntensity: 0.0,
    fireflyIntensity: 0.0,
    shadowDarkness: 0.74,
  },
  'noon-gouache': {
    id: 'noon-gouache',
    label: 'High Noon Anime Sky',
    shortLabel: 'Noon',
    badgeIcon: '☀️',
    skyTop: '#6EB8E6',
    skyHorizon: '#E6F4E8',
    sunGlowColor: '#FFFDF0',
    sunDirection: [0.35, 0.86, -0.32],
    fogColor: '#E0F0E4',
    sunColor: '#FFF9E2',
    sunIntensity: 2.75,
    ambientColor: '#E4F2DC',
    ambientIntensity: 1.02,
    hemiSky: '#E8F7FA',
    hemiGround: '#6CA23E',
    hemiIntensity: 0.94,
    cloudTop: '#FFFFFF',
    cloudMid: '#F6F9F2',
    cloudShadow: '#B8CCCE',
    mistColor: '#F8FCF8',
    mistOpacity: 0.32,
    sunbeamColor: '#FFFCE0',
    sunbeamOpacity: 0.20,
    terrainSunlit: '#D4E86E',
    terrainWarm: '#9ACE54',
    terrainLush: '#66A846',
    terrainDeep: '#3F7434',
    terrainShadow: '#2A5224',
    foliageTop: '#C0E872',
    foliageMid: '#6EAE48',
    foliageShadow: '#3C742E',
    foliageRim: '#F2FCA8',
    riverDeep: '#166E8E',
    riverShallow: '#48BED4',
    riverFoam: '#FFFFFF',
    riverShimmer: '#FFFFFF',
    windowEmissiveIntensity: 0.12,
    lanternEmissiveIntensity: 0.08,
    starIntensity: 0.0,
    moonIntensity: 0.0,
    fireflyIntensity: 0.0,
    shadowDarkness: 0.82,
  },
  'evening-sunset': {
    id: 'evening-sunset',
    label: 'Crimson & Gold Evening',
    shortLabel: 'Evening',
    badgeIcon: '🌇',
    skyTop: '#4A3B6E',
    skyHorizon: '#FF9E68',
    sunGlowColor: '#FFD478',
    sunDirection: [0.68, 0.32, -0.58],
    fogColor: '#F2B892',
    sunColor: '#FF9448',
    sunIntensity: 2.55,
    ambientColor: '#F4C4A4',
    ambientIntensity: 0.82,
    hemiSky: '#FFB884',
    hemiGround: '#5E5838',
    hemiIntensity: 0.78,
    cloudTop: '#FFE4BA',
    cloudMid: '#F8A888',
    cloudShadow: '#6E5278',
    mistColor: '#FFD6B8',
    mistOpacity: 0.48,
    sunbeamColor: '#FFB868',
    sunbeamOpacity: 0.46,
    terrainSunlit: '#E2C45A',
    terrainWarm: '#9EAE48',
    terrainLush: '#6B883E',
    terrainDeep: '#425C30',
    terrainShadow: '#2B3A26',
    foliageTop: '#D8B858',
    foliageMid: '#7E9440',
    foliageShadow: '#465A2B',
    foliageRim: '#FFD27A',
    riverDeep: '#2C4E6E',
    riverShallow: '#7A8E9A',
    riverFoam: '#FFE6CC',
    riverShimmer: '#FFB868',
    windowEmissiveIntensity: 1.55,
    lanternEmissiveIntensity: 1.45,
    starIntensity: 0.25,
    moonIntensity: 0.15,
    fireflyIntensity: 0.55,
    shadowDarkness: 0.68,
  },
  'starry-night': {
    id: 'starry-night',
    label: 'Starry Night & Lanterns',
    shortLabel: 'Night',
    badgeIcon: '🌙',
    skyTop: '#0B1528',
    skyHorizon: '#1E3658',
    sunGlowColor: '#D6E8FF',
    sunDirection: [-0.48, 0.64, -0.52],
    fogColor: '#162844',
    sunColor: '#9CC4F8',
    sunIntensity: 1.35,
    ambientColor: '#243B5C',
    ambientIntensity: 0.62,
    hemiSky: '#3A5E8C',
    hemiGround: '#182820',
    hemiIntensity: 0.65,
    cloudTop: '#4A688A',
    cloudMid: '#2D4464',
    cloudShadow: '#152238',
    mistColor: '#3A5878',
    mistOpacity: 0.42,
    sunbeamColor: '#B8DAFF',
    sunbeamOpacity: 0.22,
    terrainSunlit: '#4E7A5E',
    terrainWarm: '#38624C',
    terrainLush: '#284C3C',
    terrainDeep: '#1B362C',
    terrainShadow: '#10221C',
    foliageTop: '#48785C',
    foliageMid: '#2E5642',
    foliageShadow: '#1B382B',
    foliageRim: '#88B8E6',
    riverDeep: '#0F2C44',
    riverShallow: '#225874',
    riverFoam: '#A8D8F0',
    riverShimmer: '#FFE298',
    windowEmissiveIntensity: 2.85,
    lanternEmissiveIntensity: 2.65,
    starIntensity: 1.0,
    moonIntensity: 1.0,
    fireflyIntensity: 1.0,
    shadowDarkness: 0.52,
  },
};

export interface VirtualFlightInput {
  forward: boolean;
  backward: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  climb: boolean;
  descend: boolean;
  boost: boolean;
}
