import * as THREE from 'three';
import { pseudoRandom } from './geometryBatcher';

export interface TexturePair {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

const cache = new Map<string, TexturePair>();

function finalizePair(
  key: string,
  cCanvas: HTMLCanvasElement,
  bCanvas: HTMLCanvasElement
): TexturePair {
  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const res = { map, bumpMap };
  cache.set(key, res);
  return res;
}

/**
 * 1. Warm Rice-Paper & Cream Watercolor Plaster Wall Texture.
 * Features wet-on-wet watercolor pigment blooms and soft sepia weathering at the base.
 */
export function createWatercolorPlasterTextures(): TexturePair {
  const key = 'watercolor-plaster';
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#FBF5E9');
  grad.addColorStop(0.65, '#F5EBDA');
  grad.addColorStop(1, '#E8D9C2');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Soft wet-edge watercolor brush washes
  const washes = [
    'rgba(255, 252, 245, 0.35)',
    'rgba(236, 220, 196, 0.24)',
    'rgba(222, 202, 176, 0.18)',
    'rgba(248, 239, 224, 0.30)',
  ];
  for (let i = 0; i < 420; i++) {
    const x = pseudoRandom(i * 5 + 1) * size;
    const y = pseudoRandom(i * 5 + 2) * size;
    const rx = 20 + pseudoRandom(i * 5 + 3) * 55;
    const ry = 14 + pseudoRandom(i * 5 + 4) * 40;
    const rot = (pseudoRandom(i * 5 + 5) - 0.5) * 0.6;

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(rot);
    cCtx.fillStyle = washes[i % washes.length];
    cCtx.beginPath();
    cCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.restore();

    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(rot);
    bCtx.fillStyle = i % 2 === 0 ? 'rgba(185,185,185,0.22)' : 'rgba(95,95,95,0.20)';
    bCtx.beginPath();
    bCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.restore();
  }

  // Subtle hand-drawn sepia ink hairline plaster cracks & paper grain
  cCtx.strokeStyle = 'rgba(78, 62, 50, 0.16)';
  cCtx.lineWidth = 1.2;
  for (let i = 0; i < 24; i++) {
    const sx = pseudoRandom(i * 11 + 1) * size;
    const sy = pseudoRandom(i * 11 + 2) * size;
    cCtx.beginPath();
    cCtx.moveTo(sx, sy);
    cCtx.quadraticCurveTo(
      sx + (pseudoRandom(i * 11 + 3) - 0.5) * 35,
      sy + 18,
      sx + (pseudoRandom(i * 11 + 4) - 0.5) * 45,
      sy + 36
    );
    cCtx.stroke();
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 2. Hand-Drawn Scalloped Dark-Slate Roof Tile Texture matching the reference village roofs.
 */
export function createCurvedSlateTileTextures(): TexturePair {
  const key = 'curved-slate-tiles';
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const baseGrad = cCtx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0, '#4E5B5C');
  baseGrad.addColorStop(0.5, '#617071');
  baseGrad.addColorStop(1, '#485556');
  cCtx.fillStyle = baseGrad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const cols = 12;
  const rows = 14;
  const colW = size / cols;
  const rowH = size / rows;

  const tileShades = ['#596869', '#677677', '#526061', '#707F80', '#4C595A'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * colW;
      const y = r * rowH;
      const seed = r * 31 + c * 17;
      const shade = tileShades[Math.floor(pseudoRandom(seed) * tileShades.length)];

      // Painterly tile body
      cCtx.fillStyle = shade;
      cCtx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);

      // Soft watercolor highlight along tile center
      cCtx.fillStyle = 'rgba(218, 228, 224, 0.16)';
      cCtx.fillRect(x + colW * 0.22, y + 3, colW * 0.52, rowH - 6);

      // Hand-drawn charcoal ink scalloped tile overlap arc
      cCtx.strokeStyle = 'rgba(38, 44, 45, 0.72)';
      cCtx.lineWidth = 2.2;
      cCtx.beginPath();
      cCtx.moveTo(x, y + rowH - 3);
      cCtx.quadraticCurveTo(x + colW * 0.5, y + rowH + 4, x + colW, y + rowH - 3);
      cCtx.stroke();

      // Vertical barrel-tile rib line
      cCtx.strokeStyle = 'rgba(36, 42, 43, 0.58)';
      cCtx.lineWidth = 1.8;
      cCtx.beginPath();
      cCtx.moveTo(x, y);
      cCtx.lineTo(x, y + rowH);
      cCtx.stroke();

      // Bump map relief for tile ribs and overlap
      bCtx.fillStyle = '#b8b8b8';
      bCtx.fillRect(x + 4, y + 2, colW - 8, rowH - 6);
      bCtx.fillStyle = '#303030';
      bCtx.fillRect(x, y, 4, rowH);
      bCtx.fillRect(x, y + rowH - 4, colW, 4);
    }
  }

  // Subtle sage-moss & warm dust watercolor brush washes across roof
  for (let i = 0; i < 45; i++) {
    const x = pseudoRandom(i * 9 + 1) * size;
    const y = pseudoRandom(i * 9 + 2) * size;
    const rx = 24 + pseudoRandom(i * 9 + 3) * 48;
    const ry = 16 + pseudoRandom(i * 9 + 4) * 30;
    cCtx.fillStyle =
      i % 2 === 0 ? 'rgba(148, 164, 136, 0.14)' : 'rgba(236, 224, 204, 0.12)';
    cCtx.beginPath();
    cCtx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    cCtx.fill();
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 3. Warm Cedar & Ochre Timber Board Siding Texture matching the wooden upper stories.
 */
export function createCedarTimberTextures(): TexturePair {
  const key = 'cedar-timber';
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#E2A679');
  grad.addColorStop(0.5, '#D49466');
  grad.addColorStop(1, '#C38254');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#888888';
  bCtx.fillRect(0, 0, size, size);

  const planks = 10;
  const plankW = size / planks;
  const plankTones = [
    'rgba(255, 232, 206, 0.16)',
    'rgba(176, 108, 64, 0.14)',
    'rgba(242, 186, 140, 0.15)',
  ];

  for (let p = 0; p < planks; p++) {
    const px = p * plankW;
    cCtx.fillStyle = plankTones[p % plankTones.length];
    cCtx.fillRect(px, 0, plankW, size);

    // Hand-inked vertical plank seam
    cCtx.fillStyle = 'rgba(72, 46, 32, 0.68)';
    cCtx.fillRect(px, 0, 2.5, size);

    bCtx.fillStyle = '#282828';
    bCtx.fillRect(px, 0, 4, size);
  }

  // Soft vertical watercolor brush strokes along wood grain
  for (let i = 0; i < 280; i++) {
    const x = pseudoRandom(i * 4 + 1) * size;
    const y = pseudoRandom(i * 4 + 2) * size;
    const w = 3 + pseudoRandom(i * 4 + 3) * 6;
    const h = 45 + pseudoRandom(i * 4 + 4) * 120;
    cCtx.fillStyle =
      i % 2 === 0 ? 'rgba(255, 228, 198, 0.14)' : 'rgba(138, 82, 46, 0.13)';
    cCtx.fillRect(x, y - h * 0.5, w, h);
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 4. Irregular Polygonal River-Stone Masonry Texture with Sumi-e Ink Mortar Lines.
 * Matches the right-hand cottage lower stone wall and the hillside terrace walls.
 */
export function createFieldstoneMasonryTextures(): TexturePair {
  const key = 'fieldstone-masonry';
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  cCtx.fillStyle = '#DED7CB';
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#686868';
  bCtx.fillRect(0, 0, size, size);

  const stonePalette = ['#EAE4DA', '#D8D0C4', '#C6BEB2', '#F1ECE2', '#B9B0A4', '#DFD3C3'];

  for (let i = 0; i < 95; i++) {
    const cx = pseudoRandom(i * 7 + 1) * size;
    const cy = pseudoRandom(i * 7 + 2) * size;
    const rx = 20 + pseudoRandom(i * 7 + 3) * 36;
    const ry = 15 + pseudoRandom(i * 7 + 4) * 26;
    const rot = (pseudoRandom(i * 7 + 5) - 0.5) * 0.45;

    cCtx.save();
    cCtx.translate(cx, cy);
    cCtx.rotate(rot);

    cCtx.fillStyle = stonePalette[i % stonePalette.length];
    cCtx.beginPath();
    const sides = 6;
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2;
      const rMod = 0.84 + pseudoRandom(i * 13 + s) * 0.3;
      const vx = Math.cos(a) * rx * rMod;
      const vy = Math.sin(a) * ry * rMod;
      if (s === 0) cCtx.moveTo(vx, vy);
      else cCtx.lineTo(vx, vy);
    }
    cCtx.closePath();
    cCtx.fill();

    // Hand-inked charcoal-sepia mortar joint
    cCtx.strokeStyle = 'rgba(66, 54, 46, 0.62)';
    cCtx.lineWidth = 2.4;
    cCtx.stroke();
    cCtx.restore();

    bCtx.save();
    bCtx.translate(cx, cy);
    bCtx.rotate(rot);
    bCtx.fillStyle = '#b4b4b4';
    bCtx.beginPath();
    bCtx.ellipse(0, 0, rx * 0.88, ry * 0.88, 0, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.strokeStyle = '#2c2c2c';
    bCtx.lineWidth = 3;
    bCtx.stroke();
    bCtx.restore();
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 5. Smooth Sandy-Cream Earthen Road Texture with Sweeping Dry-Brush Footpath Strokes.
 * Matches the curving sandy road in the foreground of the reference painting.
 */
export function createBrushRoadTextures(): TexturePair {
  const key = 'brush-road';
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#E9D6B7');
  grad.addColorStop(0.2, '#F4E7CF');
  grad.addColorStop(0.5, '#F8EFE0');
  grad.addColorStop(0.8, '#F3E5CC');
  grad.addColorStop(1, '#E8D4B4');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Sweeping dry-brush footpath strokes along the road
  for (let i = 0; i < 160; i++) {
    const x = 60 + pseudoRandom(i * 5 + 1) * (size - 120);
    const y = pseudoRandom(i * 5 + 2) * size;
    const len = 60 + pseudoRandom(i * 5 + 3) * 140;
    const w = 2.5 + pseudoRandom(i * 5 + 4) * 7.5;

    cCtx.strokeStyle =
      i % 2 === 0 ? 'rgba(218, 194, 158, 0.35)' : 'rgba(255, 250, 240, 0.42)';
    cCtx.lineWidth = w;
    cCtx.lineCap = 'round';
    cCtx.beginPath();
    cCtx.moveTo(x, y);
    cCtx.quadraticCurveTo(x + (pseudoRandom(i * 5 + 5) - 0.5) * 18, y + len * 0.5, x, y + len);
    cCtx.stroke();
  }

  // Tiny scattered ink pebble specks like the foreground of the painting
  for (let i = 0; i < 95; i++) {
    const x = pseudoRandom(i * 11 + 1) * size;
    const y = pseudoRandom(i * 11 + 2) * size;
    const r = 1.2 + pseudoRandom(i * 11 + 3) * 2.4;
    cCtx.fillStyle = i % 3 === 0 ? 'rgba(92, 74, 58, 0.48)' : 'rgba(186, 162, 132, 0.45)';
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 6. Painterly Watercolor Foliage Brush-Dab Texture for Persimmon Maples & Sage Pines.
 */
export function createPainterlyFoliageTextures(
  variant: 'maple-persimmon' | 'pine-sage' = 'maple-persimmon'
): TexturePair {
  const key = `foliage:${variant}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  if (variant === 'maple-persimmon') {
    const grad = cCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#FA9E52');
    grad.addColorStop(0.5, '#F06430');
    grad.addColorStop(1, '#D94620');
    cCtx.fillStyle = grad;
  } else {
    const grad = cCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#96A682');
    grad.addColorStop(0.5, '#7A8B68');
    grad.addColorStop(1, '#5B6C4D');
    cCtx.fillStyle = grad;
  }
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const dabs =
    variant === 'maple-persimmon'
      ? [
          'rgba(255, 186, 112, 0.46)',
          'rgba(244, 112, 54, 0.44)',
          'rgba(222, 68, 32, 0.38)',
          'rgba(252, 148, 72, 0.42)',
        ]
      : [
          'rgba(174, 188, 152, 0.42)',
          'rgba(122, 139, 104, 0.44)',
          'rgba(88, 106, 74, 0.38)',
          'rgba(148, 164, 128, 0.40)',
        ];

  // Overlapping soft brush-tip leaf dabs
  for (let i = 0; i < 620; i++) {
    const x = pseudoRandom(i * 6 + 1) * size;
    const y = pseudoRandom(i * 6 + 2) * size;
    const rx = 10 + pseudoRandom(i * 6 + 3) * 26;
    const ry = 6 + pseudoRandom(i * 6 + 4) * 16;
    const rot = (pseudoRandom(i * 6 + 5) - 0.5) * 1.6;

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(rot);
    cCtx.fillStyle = dabs[i % dabs.length];
    cCtx.beginPath();
    cCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.restore();

    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(rot);
    bCtx.fillStyle = i % 2 === 0 ? '#b5b5b5' : '#4a4a4a';
    bCtx.beginPath();
    bCtx.ellipse(0, 0, rx * 0.9, ry * 0.9, 0, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.restore();
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 7. Gnarled Sumi-e & Watercolor Tree Bark Texture.
 */
export function createBarkBrushTextures(): TexturePair {
  const key = 'bark-brush';
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#55453B');
  grad.addColorStop(0.5, '#766355');
  grad.addColorStop(1, '#4E3F35');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 240; i++) {
    const x = pseudoRandom(i * 4 + 1) * size;
    const y = pseudoRandom(i * 4 + 2) * size;
    const w = 3 + pseudoRandom(i * 4 + 3) * 8;
    const h = 50 + pseudoRandom(i * 4 + 4) * 140;

    cCtx.fillStyle =
      i % 2 === 0 ? 'rgba(42, 32, 26, 0.36)' : 'rgba(154, 134, 116, 0.26)';
    cCtx.fillRect(x, y - h * 0.5, w, h);

    bCtx.fillStyle = i % 2 === 0 ? '#323232' : '#c6c6c6';
    bCtx.fillRect(x, y - h * 0.5, w, h);
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 8. Lush Painterly Green Meadow Grass Texture for the Out-of-City Green Pastures.
 * Combines vibrant spring-emerald watercolor washes, fine grass blade strokes, and clover highlights.
 */
export function createMeadowGrassTextures(): TexturePair {
  const key = 'meadow-grass-lush';
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#5FA148');
  grad.addColorStop(0.35, '#6DB353');
  grad.addColorStop(0.7, '#589842');
  grad.addColorStop(1, '#66AA4D');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Soft sunlit meadow washes
  const meadowWashes = [
    'rgba(142, 206, 98, 0.34)',
    'rgba(78, 138, 58, 0.28)',
    'rgba(168, 222, 114, 0.26)',
    'rgba(96, 162, 72, 0.32)',
  ];
  for (let i = 0; i < 360; i++) {
    const x = pseudoRandom(i * 5 + 1) * size;
    const y = pseudoRandom(i * 5 + 2) * size;
    const rx = 18 + pseudoRandom(i * 5 + 3) * 44;
    const ry = 14 + pseudoRandom(i * 5 + 4) * 34;
    const rot = (pseudoRandom(i * 5 + 5) - 0.5) * 1.4;

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(rot);
    cCtx.fillStyle = meadowWashes[i % meadowWashes.length];
    cCtx.beginPath();
    cCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.restore();
  }

  // Fine calligraphic grass-blade brush strokes
  for (let i = 0; i < 950; i++) {
    const x = pseudoRandom(i * 7 + 1) * size;
    const y = pseudoRandom(i * 7 + 2) * size;
    const h = 10 + pseudoRandom(i * 7 + 3) * 18;
    const lean = (pseudoRandom(i * 7 + 4) - 0.5) * 8;

    cCtx.strokeStyle =
      i % 3 === 0
        ? 'rgba(186, 236, 128, 0.52)'
        : i % 3 === 1
          ? 'rgba(62, 116, 44, 0.45)'
          : 'rgba(124, 188, 82, 0.48)';
    cCtx.lineWidth = 1.6;
    cCtx.lineCap = 'round';
    cCtx.beginPath();
    cCtx.moveTo(x, y);
    cCtx.quadraticCurveTo(x + lean * 0.5, y - h * 0.5, x + lean, y - h);
    cCtx.stroke();

    bCtx.strokeStyle = i % 2 === 0 ? '#b8b8b8' : '#484848';
    bCtx.lineWidth = 1.8;
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + lean, y - h);
    bCtx.stroke();
  }

  return finalizePair(key, cCanvas, bCanvas);
}

