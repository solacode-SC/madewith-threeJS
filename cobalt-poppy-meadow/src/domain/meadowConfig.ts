export type SkyMood = 'painterly-noon' | 'golden-hour' | 'lavender-twilight' | 'misty-dawn';

export type CameraPreset =
  | 'reference-canvas'
  | 'path-stroll'
  | 'hilltop-overview'
  | 'macro-bloom'
  | 'cinematic-orbit';

export interface MoodTheme {
  name: string;
  jpName: string;
  description: string;
  sunPosition: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  skyTopColor: string;
  skyMidColor: string;
  skyHorizonColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  poppyGlow: number;
  butterflyColor: string;
}

export const MOOD_THEMES: Record<SkyMood, MoodTheme> = {
  'painterly-noon': {
    name: 'Painterly Gouache Noon',
    jpName: '絵画正午 • 原画トーン',
    description: 'Crisp hand-painted noon light echoing the original gouache art with cobalt poppies & tiered sage hills.',
    sunPosition: [25, 45, -20],
    sunColor: '#FFFDF0',
    sunIntensity: 1.85,
    ambientColor: '#DCE8F5',
    ambientIntensity: 1.25,
    skyTopColor: '#CAD7E6',
    skyMidColor: '#E6EDF2',
    skyHorizonColor: '#F5F5EC',
    fogColor: '#DCE5EE',
    fogNear: 45,
    fogFar: 260,
    poppyGlow: 0.15,
    butterflyColor: '#4378BA',
  },
  'golden-hour': {
    name: 'Golden Sunlit Afternoon',
    jpName: '黄金色の午後 • 夕映え',
    description: 'Warm honey-amber light filtering across the flower tops with long dramatic shadows.',
    sunPosition: [40, 22, -35],
    sunColor: '#FFD79E',
    sunIntensity: 2.2,
    ambientColor: '#F2D3B8',
    ambientIntensity: 1.1,
    skyTopColor: '#7A9CB8',
    skyMidColor: '#F3BE8A',
    skyHorizonColor: '#FFE0B5',
    fogColor: '#F5CBA5',
    fogNear: 35,
    fogFar: 240,
    poppyGlow: 0.35,
    butterflyColor: '#FFCB65',
  },
  'lavender-twilight': {
    name: 'Lavender Dusk & Fireflies',
    jpName: '夕闇ラベンダー • 蛍の舞',
    description: 'Poetic twilight with mystical periwinkle mountains, glowing fireflies, and deep cobalt blossoms.',
    sunPosition: [10, 8, -45],
    sunColor: '#DDA0DD',
    sunIntensity: 0.9,
    ambientColor: '#6B7A9E',
    ambientIntensity: 0.85,
    skyTopColor: '#1B2444',
    skyMidColor: '#4A4870',
    skyHorizonColor: '#9B8CB2',
    fogColor: '#444265',
    fogNear: 25,
    fogFar: 200,
    poppyGlow: 0.7,
    butterflyColor: '#A5E6FF',
  },
  'misty-dawn': {
    name: 'Ethereal Dawn Dew',
    jpName: '朝露の夜明け • 淡彩霧',
    description: 'Soft pastel dawn with cool morning dew on petals, soft hill mist, and gentle bird serenades.',
    sunPosition: [-35, 18, -30],
    sunColor: '#FFF0E2',
    sunIntensity: 1.4,
    ambientColor: '#C4D7DE',
    ambientIntensity: 1.15,
    skyTopColor: '#9AB4C9',
    skyMidColor: '#DCE8EE',
    skyHorizonColor: '#FCE7DF',
    fogColor: '#CADCE5',
    fogNear: 30,
    fogFar: 220,
    poppyGlow: 0.25,
    butterflyColor: '#E6F0FA',
  },
};

export interface CameraPresetConfig {
  name: string;
  jpName: string;
  icon: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  description: string;
}

export const CAMERA_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  'reference-canvas': {
    name: 'Artwork Canvas View',
    jpName: '原画フレーム構図',
    icon: '🖼️',
    // Carefully calibrated to match the user's reference picture view:
    // Standing at the start of the wildflower path, looking slightly uphill between the two sentinel trees!
    position: [0.15, 3.8, 12.8],
    target: [0.3, 7.2, -32.0],
    fov: 46,
    description: 'Exact composition matching the original gouache artwork with sentinel trees and rolling hills.',
  },
  'path-stroll': {
    name: 'Winding Path Stroll',
    jpName: '花咲く小径の散策',
    icon: '🚶',
    position: [1.2, 1.35, 3.5],
    target: [0.4, 2.8, -18.0],
    fov: 54,
    description: 'Eye-level walk along the chalky earthen path submerged among towering cobalt poppies.',
  },
  'hilltop-overview': {
    name: 'Hilltop Vista',
    jpName: '緑風の丘陵パノラマ',
    icon: '⛰️',
    position: [-16.0, 16.5, 14.0],
    target: [4.0, 5.0, -22.0],
    fov: 52,
    description: 'Sweeping panoramic viewpoint over the undulating ridges, cobalt fields, and distant mist.',
  },
  'macro-bloom': {
    name: 'Poppy Bloom Macro',
    jpName: 'ポピー花弁接写',
    icon: '🔍',
    position: [-1.45, 1.25, 6.8],
    target: [-1.15, 1.32, 5.6],
    fov: 38,
    description: 'Intimate close-up focused on the velvety cobalt petals, dark stamens, and fluttering petals.',
  },
  'cinematic-orbit': {
    name: 'Cinematic Breeze Drift',
    jpName: 'そよ風の遊覧飛行',
    icon: '🕊️',
    position: [8.5, 9.2, 8.5],
    target: [0.0, 3.5, -8.0],
    fov: 50,
    description: 'Gentle slow orbital drift around the floral valley capturing dynamic wind and light.',
  },
};
