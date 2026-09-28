export type CameraMode = 'road' | 'from-up' | 'painting' | 'clouds' | 'pov';

export type BrushMood = 'morning-wash' | 'persimmon-dusk' | 'moonlit-ink';

export interface VirtualWalkInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  sprint: boolean;
  jump: boolean;
  wave: boolean;
}

export interface CameraModeMeta {
  id: CameraMode;
  icon: string;
  label: string;
  shortLabel: string;
  hint: string;
}

export const CAMERA_MODES: CameraModeMeta[] = [
  {
    id: 'road',
    icon: '🚶',
    label: 'Road View',
    shortLabel: 'Road View',
    hint: 'Discover the city along winding brush-painted roads (Drag to look, Scroll to zoom)',
  },
  {
    id: 'from-up',
    icon: '🦅',
    label: 'From Up (Sky)',
    shortLabel: 'From Up',
    hint: 'Bird’s-eye aerial view from up above — Drag to orbit, Scroll to zoom, Click any road to walk there',
  },
  {
    id: 'painting',
    icon: '🖼️',
    label: 'Painting Vista',
    shortLabel: 'Painting',
    hint: 'Frames the exact watercolor & ink composition of the reference artwork',
  },
  {
    id: 'clouds',
    icon: '☁️',
    label: 'Cloud Orbit',
    shortLabel: 'Clouds',
    hint: 'Sweeping aerial flight gliding through the watercolor brush clouds & mountain peaks',
  },
  {
    id: 'pov',
    icon: '👁️',
    label: 'First-Person',
    shortLabel: 'POV',
    hint: 'Stroll through the village streets directly through Kaede’s eyes',
  },
];

export interface MoodThemeConfig {
  id: BrushMood;
  label: string;
  skyTop: string;
  skyHorizon: string;
  fogColor: string;
  ambientColor: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  cloudTop: string;
  cloudMid: string;
  cloudShadow: string;
  mountainPeak: string;
  mountainMid: string;
  mountainBase: string;
}

/**
 * Exact watercolor & sumi-e ink color palettes derived from the reference illustration.
 */
export const BRUSH_MOOD_THEMES: Record<BrushMood, MoodThemeConfig> = {
  'morning-wash': {
    id: 'morning-wash',
    label: '☀️ Watercolor Morning',
    skyTop: '#FDF9EE',
    skyHorizon: '#F5EBDC',
    fogColor: '#F4EBDC',
    ambientColor: '#FFF9EE',
    ambientIntensity: 1.08,
    hemiSky: '#FFFDF6',
    hemiGround: '#DFCDAE',
    hemiIntensity: 0.95,
    sunColor: '#FFF7E4',
    sunIntensity: 2.15,
    cloudTop: '#FFFFFF',
    cloudMid: '#FBF1E1',
    cloudShadow: '#D8DFD2',
    mountainPeak: '#ACB89F',
    mountainMid: '#C8D0BC',
    mountainBase: '#EFEAD9',
  },
  'persimmon-dusk': {
    id: 'persimmon-dusk',
    label: '🌅 Persimmon Sunset',
    skyTop: '#FCE8D5',
    skyHorizon: '#F7C59F',
    fogColor: '#F5CEA8',
    ambientColor: '#FFEAD8',
    ambientIntensity: 0.94,
    hemiSky: '#FCD2B0',
    hemiGround: '#C99B78',
    hemiIntensity: 0.88,
    sunColor: '#FFD19A',
    sunIntensity: 2.35,
    cloudTop: '#FFF8EE',
    cloudMid: '#FAD4B4',
    cloudShadow: '#CFA898',
    mountainPeak: '#9BA694',
    mountainMid: '#BFC2AE',
    mountainBase: '#F2D2B6',
  },
  'moonlit-ink': {
    id: 'moonlit-ink',
    label: '🌙 Sumi-e Moonwash',
    skyTop: '#24333E',
    skyHorizon: '#435864',
    fogColor: '#3B4F5B',
    ambientColor: '#9CB8C9',
    ambientIntensity: 0.76,
    hemiSky: '#68899E',
    hemiGround: '#2B3840',
    hemiIntensity: 0.78,
    sunColor: '#CBE3F5',
    sunIntensity: 1.55,
    cloudTop: '#DCEAF2',
    cloudMid: '#9EB6C4',
    cloudShadow: '#4E6573',
    mountainPeak: '#4A5F69',
    mountainMid: '#5E757E',
    mountainBase: '#3B4F5B',
  },
};

export const PALETTE = {
  inkOutline: '#382D27',
  inkSoft: '#54453C',
  plasterLight: '#FAF3E6',
  plasterWarm: '#F2E7D3',
  cedarLight: '#DFA274',
  cedarMid: '#CC8A5B',
  cedarDark: '#8C5B3C',
  woodDoor: '#B67848',
  woodDark: '#5C4231',
  roofSlate: '#586667',
  roofSlateLight: '#707E7F',
  roofSlateDark: '#3B4647',
  stoneLight: '#E5E1DA',
  stoneMid: '#C7C0B5',
  stoneDark: '#9A9389',
  roadSand: '#F4E8D1',
  roadTrack: '#E2CEAF',
  bankEarth: '#E3BC96',
  maplePersimmon: '#F06430',
  mapleAmber: '#F78E44',
  mapleVermilion: '#DF4A22',
  mapleGold: '#FAAE62',
  pineSage: '#7A8B68',
  pineOlive: '#93A37F',
  pineDeep: '#5C6D4E',
  flowerPink: '#F48B95',
  flowerPeach: '#F9B3BA',
  terracottaPot: '#CF6836',
} as const;
