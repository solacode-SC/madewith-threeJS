import * as THREE from 'three';
import type { RoofVariant } from '../domain/villageLayout';
import { pseudoRandom } from './inkOutlineBatcher';

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
 * 1. Hand-Drawn Rustic Weathered Timber Plank Wall Texture (matching Reference Image 2's cottage walls).
 */
export function createWeatheredTimberWallTextures(): TexturePair {
  const key = 'weathered-timber-wall';
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
  grad.addColorStop(0, '#CAB8A0');
  grad.addColorStop(0.65, '#B8A48C');
  grad.addColorStop(1, '#988870');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const planks = 14;
  const plankW = size / planks;
  const plankTones = [
    'rgba(245, 232, 212, 0.22)',
    'rgba(152, 130, 108, 0.18)',
    'rgba(218, 200, 176, 0.20)',
    'rgba(136, 118, 96, 0.16)',
  ];

  for (let p = 0; p < planks; p++) {
    const px = p * plankW;
    cCtx.fillStyle = plankTones[p % plankTones.length];
    cCtx.fillRect(px, 0, plankW, size);

    // Subtle vertical wood grain brush strokes
    cCtx.strokeStyle = 'rgba(82, 68, 54, 0.20)';
    cCtx.lineWidth = 1.2;
    for (let g = 0; g < 5; g++) {
      const gx = px + 5 + pseudoRandom(p * 19 + g) * (plankW - 10);
      cCtx.beginPath();
      cCtx.moveTo(gx, 0);
      cCtx.quadraticCurveTo(
        gx + (pseudoRandom(p * 31 + g) - 0.5) * 6,
        size * 0.5,
        gx,
        size
      );
      cCtx.stroke();
    }

    // Hand-inked vertical plank seam line
    cCtx.strokeStyle = 'rgba(42, 36, 30, 0.76)';
    cCtx.lineWidth = 2.4;
    cCtx.beginPath();
    cCtx.moveTo(px, 0);
    cCtx.lineTo(px, size);
    cCtx.stroke();

    bCtx.fillStyle = '#282828';
    bCtx.fillRect(px, 0, 4, size);
  }

  // Horizontal weatherboard cross-lines & mossy watercolor wash near the base
  cCtx.strokeStyle = 'rgba(44, 38, 32, 0.45)';
  cCtx.lineWidth = 1.8;
  for (let y = 96; y < size; y += 128) {
    cCtx.beginPath();
    cCtx.moveTo(0, y);
    cCtx.lineTo(size, y);
    cCtx.stroke();
  }

  // Soft green pasture moss wash along the bottom foundation
  const mossGrad = cCtx.createLinearGradient(0, size * 0.76, 0, size);
  mossGrad.addColorStop(0, 'rgba(92, 134, 74, 0.0)');
  mossGrad.addColorStop(1, 'rgba(78, 118, 62, 0.34)');
  cCtx.fillStyle = mossGrad;
  cCtx.fillRect(0, size * 0.76, size, size * 0.24);

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 2. Hand-Drawn Pitched Cottage Roof Shingle & Batten Textures matching Reference Image 2's 4 palettes.
 */
export function createHandDrawnRoofTextures(variant: RoofVariant): TexturePair {
  const key = `hand-drawn-roof-${variant}`;
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

  const palettes: Record<RoofVariant, { top: string; mid: string; bot: string; tiles: string[] }> = {
    'teal-slate': {
      top: '#78AA96',
      mid: '#5E927E',
      bot: '#4B7A68',
      tiles: ['#669A86', '#72A692', '#558875', '#80B29E', '#4F7E6C'],
    },
    'cedar-umber': {
      top: '#8E7464',
      mid: '#765E50',
      bot: '#5E493E',
      tiles: ['#846B5C', '#937968', '#6D5648', '#7B6354', '#634E41'],
    },
    'blue-slate': {
      top: '#829AA8',
      mid: '#688292',
      bot: '#536B7A',
      tiles: ['#728C9C', '#809AA8', '#5E7786', '#8CA5B2', '#556E7C'],
    },
    'moss-timber': {
      top: '#829E6E',
      mid: '#698656',
      bot: '#526C42',
      tiles: ['#749260', '#84A070', '#5E7A4C', '#6B8858', '#557044'],
    },
  };

  const pal = palettes[variant];
  const baseGrad = cCtx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0, pal.top);
  baseGrad.addColorStop(0.55, pal.mid);
  baseGrad.addColorStop(1, pal.bot);
  cCtx.fillStyle = baseGrad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const cols = 10;
  const rows = 12;
  const colW = size / cols;
  const rowH = size / rows;

  for (let r = 0; r < rows; r++) {
    const offsetX = (r % 2) * (colW * 0.25);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offsetX;
      const y = r * rowH;
      const seed = r * 29 + c * 17;
      const shade = pal.tiles[Math.floor(pseudoRandom(seed) * pal.tiles.length)];

      cCtx.fillStyle = shade;
      cCtx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);

      // Soft sunlit watercolor streak along the shingle center
      cCtx.fillStyle = 'rgba(248, 252, 236, 0.16)';
      cCtx.fillRect(x + colW * 0.18, y + 2, colW * 0.56, rowH - 5);

      // Hand-drawn dark charcoal ink shingle overlap & vertical seam lines
      cCtx.strokeStyle = 'rgba(30, 36, 32, 0.74)';
      cCtx.lineWidth = 2.2;
      cCtx.strokeRect(x + 0.5, y + 0.5, colW - 1, rowH - 1);

      bCtx.fillStyle = '#b6b6b6';
      bCtx.fillRect(x + 3, y + 2, colW - 6, rowH - 5);
      bCtx.fillStyle = '#303030';
      bCtx.fillRect(x, y + rowH - 4, colW, 4);
    }
  }

  // Diagonal morning sunbeam wash across the roof
  const sunWash = cCtx.createLinearGradient(0, 0, size, size);
  sunWash.addColorStop(0, 'rgba(255, 250, 220, 0.22)');
  sunWash.addColorStop(0.5, 'rgba(255, 250, 220, 0.04)');
  sunWash.addColorStop(1, 'rgba(32, 48, 40, 0.16)');
  cCtx.fillStyle = sunWash;
  cCtx.fillRect(0, 0, size, size);

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 3. Hand-Inked Red-Clay Brick Chimney Texture.
 */
export function createBrickChimneyTextures(): TexturePair {
  const key = 'brick-chimney';
  if (cache.has(key)) return cache.get(key)!;

  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  cCtx.fillStyle = '#D8CFC0';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 4;
  const rowH = size / rows;
  const colW = size / cols;
  const brickTones = ['#B8644C', '#C67258', '#A85842', '#CE7B62'];

  for (let r = 0; r < rows; r++) {
    const shift = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + shift;
      const y = r * rowH;
      cCtx.fillStyle = brickTones[(r * 3 + c + 4) % brickTones.length];
      cCtx.fillRect(x + 3, y + 3, colW - 6, rowH - 6);

      cCtx.strokeStyle = 'rgba(42, 30, 26, 0.78)';
      cCtx.lineWidth = 2.0;
      cCtx.strokeRect(x + 2.5, y + 2.5, colW - 5, rowH - 5);

      bCtx.fillStyle = '#c8c8c8';
      bCtx.fillRect(x + 4, y + 4, colW - 8, rowH - 8);
    }
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 4. Hand-Painted Vintage Biplane Wing Fabric Texture (matching Reference Image 1).
 * Features warm cream-ivory doped linen, painted grey-olive rib shading strips, and ink seams.
 */
export function createBiplaneWingCanvasTextures(): TexturePair {
  const key = 'biplane-wing-canvas';
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

  // Chord-wise gradient: warm sunlit ivory leading edge to subtle grey-cream trailing edge
  const grad = cCtx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#F4F0E4');
  grad.addColorStop(0.32, '#EAE4D4');
  grad.addColorStop(0.75, '#DDD6C4');
  grad.addColorStop(1, '#CFC7B4');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Hand-painted wing rib shading strokes (just like the rib stripes on the biplane in Image 1!)
  const ribs = 16;
  const ribSpacing = size / ribs;
  for (let i = 0; i <= ribs; i++) {
    const rx = i * ribSpacing;

    // Soft grey-olive watercolor rib shadow band
    cCtx.fillStyle = 'rgba(138, 134, 118, 0.34)';
    cCtx.fillRect(rx - 6, 18, 12, size - 36);

    // Crisp hand-drawn dark ink rib line
    cCtx.strokeStyle = 'rgba(48, 46, 40, 0.62)';
    cCtx.lineWidth = 1.8;
    cCtx.beginPath();
    cCtx.moveTo(rx, 8);
    cCtx.lineTo(rx, size - 8);
    cCtx.stroke();

    bCtx.fillStyle = '#d0d0d0';
    bCtx.fillRect(rx - 3, 10, 6, size - 20);
  }

  // Leading-edge & trailing-edge spar ink lines (matching Image 1's wing layout)
  cCtx.strokeStyle = 'rgba(44, 42, 36, 0.72)';
  cCtx.lineWidth = 2.4;
  cCtx.beginPath();
  cCtx.moveTo(0, size * 0.16);
  cCtx.lineTo(size, size * 0.16);
  cCtx.moveTo(0, size * 0.78);
  cCtx.lineTo(size, size * 0.78);
  cCtx.stroke();

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 5. Hand-Painted Country Dirt Road Texture (matching Reference Image 1 & 2's sandy paths).
 */
export function createDirtRoadBrushTextures(): TexturePair {
  const key = 'dirt-road-brush';
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

  // Cross-road gradient with grassy verges on left/right edges and sandy-ochre center
  const grad = cCtx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#78AC4C');
  grad.addColorStop(0.12, '#BBA882');
  grad.addColorStop(0.28, '#DCCAA8');
  grad.addColorStop(0.5, '#E5D5B5');
  grad.addColorStop(0.72, '#DCCAA8');
  grad.addColorStop(0.88, '#BBA882');
  grad.addColorStop(1, '#78AC4C');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Watercolor brush dabs along the dirt lane
  const roadTones = [
    'rgba(235, 220, 192, 0.35)',
    'rgba(186, 164, 132, 0.28)',
    'rgba(212, 194, 162, 0.30)',
    'rgba(140, 174, 92, 0.25)',
  ];
  for (let i = 0; i < 280; i++) {
    const x = pseudoRandom(i * 7 + 1) * size;
    const y = pseudoRandom(i * 7 + 2) * size;
    const rx = 12 + pseudoRandom(i * 7 + 3) * 28;
    const ry = 22 + pseudoRandom(i * 7 + 4) * 52;
    cCtx.fillStyle = roadTones[i % roadTones.length];
    cCtx.beginPath();
    cCtx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    cCtx.fill();
  }

  // Hand-drawn ink pebbles & wheel-rut dashes
  cCtx.strokeStyle = 'rgba(58, 48, 38, 0.55)';
  cCtx.lineWidth = 1.6;
  for (let i = 0; i < 55; i++) {
    const px = size * 0.18 + pseudoRandom(i * 11 + 1) * (size * 0.64);
    const py = pseudoRandom(i * 11 + 2) * size;
    const pr = 2.5 + pseudoRandom(i * 11 + 3) * 4.5;
    cCtx.beginPath();
    cCtx.arc(px, py, pr, 0, Math.PI * 2);
    cCtx.stroke();
  }

  return finalizePair(key, cCanvas, bCanvas);
}

/**
 * 6. Hand-Drawn Tree Bark & Fence Timber Texture.
 */
export function createTreeBarkBrushTextures(): TexturePair {
  const key = 'tree-bark-brush';
  if (cache.has(key)) return cache.get(key)!;

  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  cCtx.fillStyle = '#7A624E';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 90; i++) {
    const x = pseudoRandom(i * 5 + 1) * size;
    const y = pseudoRandom(i * 5 + 2) * size;
    const w = 6 + pseudoRandom(i * 5 + 3) * 14;
    const h = 28 + pseudoRandom(i * 5 + 4) * 64;
    cCtx.fillStyle = i % 2 === 0 ? 'rgba(98, 76, 58, 0.45)' : 'rgba(142, 116, 92, 0.38)';
    cCtx.fillRect(x, y, w, h);

    cCtx.strokeStyle = 'rgba(38, 28, 22, 0.65)';
    cCtx.lineWidth = 1.8;
    cCtx.beginPath();
    cCtx.moveTo(x, y);
    cCtx.lineTo(x, y + h);
    cCtx.stroke();
  }

  return finalizePair(key, cCanvas, bCanvas);
}
