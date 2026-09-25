import * as THREE from 'three';

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const pairTextureCache = new Map<
  string,
  { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture }
>();
let singleGoboCache: THREE.CanvasTexture | null = null;

/**
 * Warm Watercolor Adobe / Mud-Plaster Wall Texture matching Reference Image 1.
 * Features earthy ochre-sandstone washes, subtle trowel strokes, and organic plaster mottling.
 */
export function createAdobePlasterTextures(
  variant: 'warm-ochre' | 'sunlit-sand' | 'shaded-earth' = 'warm-ochre'
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = `plaster:${variant}`;
  const cached = pairTextureCache.get(cacheKey);
  if (cached) return cached;

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
  if (variant === 'sunlit-sand') {
    grad.addColorStop(0, '#DFC4A4');
    grad.addColorStop(0.5, '#D2B28E');
    grad.addColorStop(1, '#C19D78');
  } else if (variant === 'shaded-earth') {
    grad.addColorStop(0, '#B5926E');
    grad.addColorStop(0.5, '#A6825E');
    grad.addColorStop(1, '#936F4D');
  } else {
    grad.addColorStop(0, '#CFB08E');
    grad.addColorStop(0.48, '#C39F7B');
    grad.addColorStop(0.82, '#B58F6B');
    grad.addColorStop(1, '#A6805C');
  }
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Watercolor wash blooms & hand-troweled mud plaster patches
  const washColors = [
    'rgba(232, 206, 176, 0.18)',
    'rgba(168, 128, 90, 0.16)',
    'rgba(142, 104, 70, 0.14)',
    'rgba(244, 224, 198, 0.16)',
    'rgba(188, 148, 108, 0.18)',
  ];

  for (let i = 0; i < 950; i++) {
    const x = pseudoRandom(i * 5 + 1) * size;
    const y = pseudoRandom(i * 5 + 2) * size;
    const w = 16 + pseudoRandom(i * 5 + 3) * 58;
    const h = 14 + pseudoRandom(i * 5 + 4) * 52;
    const angle = (pseudoRandom(i * 5 + 5) - 0.5) * 0.6;

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(angle);
    cCtx.fillStyle = washColors[i % washColors.length];
    cCtx.fillRect(-w / 2, -h / 2, w, h);
    cCtx.restore();

    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(angle);
    bCtx.fillStyle = i % 2 === 0 ? 'rgba(215, 215, 215, 0.22)' : 'rgba(55, 55, 55, 0.22)';
    bCtx.fillRect(-w / 2, -h / 2, w, h);
    bCtx.restore();
  }

  // Fine mineral sand speckles & watercolor granulations
  for (let i = 0; i < 600; i++) {
    const x = pseudoRandom(i * 11 + 3) * size;
    const y = pseudoRandom(i * 11 + 7) * size;
    const r = 1.5 + pseudoRandom(i * 11 + 9) * 5.5;
    cCtx.fillStyle =
      i % 3 === 0 ? 'rgba(115, 82, 52, 0.15)' : 'rgba(248, 232, 210, 0.18)';
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const res = { map, bumpMap };
  pairTextureCache.set(cacheKey, res);
  return res;
}

/**
 * Sun-bleached dusty lime-plaster & stone floor texture matching Reference Image 1.
 */
export function createSandyFloorTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = 'sandy-floor';
  const cached = pairTextureCache.get(cacheKey);
  if (cached) return cached;

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
  grad.addColorStop(0, '#DAC8B2');
  grad.addColorStop(0.5, '#CBB69D');
  grad.addColorStop(1, '#BEA68B');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Soft brushed plaster floor sweeps
  for (let i = 0; i < 800; i++) {
    const x = pseudoRandom(i * 7 + 1) * size;
    const y = pseudoRandom(i * 7 + 2) * size;
    const w = 24 + pseudoRandom(i * 7 + 3) * 68;
    const h = 10 + pseudoRandom(i * 7 + 4) * 28;
    const angle = (pseudoRandom(i * 7 + 5) - 0.5) * 0.25;

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(angle);
    cCtx.fillStyle =
      i % 2 === 0 ? 'rgba(238, 224, 206, 0.22)' : 'rgba(168, 144, 116, 0.18)';
    cCtx.fillRect(-w / 2, -h / 2, w, h);
    cCtx.restore();

    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(angle);
    bCtx.fillStyle = i % 2 === 0 ? 'rgba(205,205,205,0.2)' : 'rgba(65,65,65,0.2)';
    bCtx.fillRect(-w / 2, -h / 2, w, h);
    bCtx.restore();
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);

  const res = { map, bumpMap };
  pairTextureCache.set(cacheKey, res);
  return res;
}

/**
 * Dark Weathered Cedar & Walnut Timber Ceiling Texture (Beams & Planks)
 * Matching the rustic wooden roof in Reference Image 1.
 */
export function createTimberCeilingTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = 'timber-ceiling';
  const cached = pairTextureCache.get(cacheKey);
  if (cached) return cached;

  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  cCtx.fillStyle = '#4A3121';
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#787878';
  bCtx.fillRect(0, 0, size, size);

  // Plank divisions & wood grain fibers
  const planks = 6;
  const plankH = size / planks;
  for (let p = 0; p < planks; p++) {
    const py = p * plankH;
    const tone = p % 2 === 0 ? '#4E3423' : '#3E281A';
    cCtx.fillStyle = tone;
    cCtx.fillRect(0, py, size, plankH);

    // Dark seam between ceiling planks
    cCtx.fillStyle = '#1E1109';
    cCtx.fillRect(0, py, size, 4);
    bCtx.fillStyle = '#181818';
    bCtx.fillRect(0, py, size, 5);
  }

  // Fibrous wood grain streaks
  for (let i = 0; i < 750; i++) {
    const x = pseudoRandom(i * 3 + 1) * size;
    const y = pseudoRandom(i * 3 + 2) * size;
    const w = 45 + pseudoRandom(i * 3 + 3) * 140;
    const h = 2 + pseudoRandom(i * 3 + 4) * 5;
    cCtx.fillStyle =
      i % 3 === 0
        ? 'rgba(118, 82, 54, 0.28)'
        : i % 3 === 1
          ? 'rgba(38, 22, 12, 0.34)'
          : 'rgba(150, 108, 74, 0.18)';
    cCtx.fillRect(x - w / 2, y, w, h);

    bCtx.fillStyle = i % 2 === 0 ? 'rgba(220,220,220,0.25)' : 'rgba(40,40,40,0.3)';
    bCtx.fillRect(x - w / 2, y, w, h);
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const res = { map, bumpMap };
  pairTextureCache.set(cacheKey, res);
  return res;
}

/**
 * Woven Persian / Anatolian Kilim Carpet Texture matching Reference Image 1's foreground rugs.
 * Terracotta rust, slate-charcoal, warm ochre, and cream geometric motifs + weave bump.
 */
export function createPersianKilimRugTexture(
  variant: 'kilim-rust' | 'persian-indigo' | 'ochre-tribal' | 'royal-medallion' = 'kilim-rust'
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = `rug:${variant}`;
  const cached = pairTextureCache.get(cacheKey);
  if (cached) return cached;

  const w = 512;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = w;
  bCanvas.height = h;
  const bCtx = bCanvas.getContext('2d')!;

  const palettes = {
    'kilim-rust': {
      base: '#9C5230',
      center: '#283038',
      border1: '#B86B40',
      border2: '#363B42',
      accent1: '#DFC5A4',
      accent2: '#7A391E',
    },
    'persian-indigo': {
      base: '#2D3540',
      center: '#984C2A',
      border1: '#C47A4A',
      border2: '#222730',
      accent1: '#E5CFAF',
      accent2: '#8C4324',
    },
    'ochre-tribal': {
      base: '#B66E3E',
      center: '#7A3B20',
      border1: '#2C333B',
      border2: '#9E542E',
      accent1: '#E6D2B5',
      accent2: '#3A3E45',
    },
    'royal-medallion': {
      base: '#8B4224',
      center: '#262C34',
      border1: '#C9824E',
      border2: '#342822',
      accent1: '#EFE0C6',
      accent2: '#B55E34',
    },
  };

  const pal = palettes[variant];

  // Outer field
  ctx.fillStyle = pal.base;
  ctx.fillRect(0, 0, w, h);

  // Multi-frame geometric borders matching Image 1's dual-panel runner look
  ctx.strokeStyle = pal.border2;
  ctx.lineWidth = 18;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  ctx.strokeStyle = pal.accent1;
  ctx.lineWidth = 5;
  ctx.strokeRect(34, 34, w - 68, h - 68);

  ctx.fillStyle = pal.border1;
  ctx.fillRect(42, 42, w - 84, h - 84);

  ctx.strokeStyle = pal.border2;
  ctx.lineWidth = 8;
  ctx.strokeRect(64, 64, w - 128, h - 128);

  // Two distinct longitudinal panels or central dark indigo-charcoal field (just like Image 1!)
  const panelMarginX = 78;
  const panelMarginY = 82;
  ctx.fillStyle = pal.center;
  ctx.fillRect(panelMarginX, panelMarginY, w - panelMarginX * 2, h - panelMarginY * 2);

  // Decorative geometric border teeth
  ctx.fillStyle = pal.accent1;
  for (let y = 52; y < h - 52; y += 28) {
    ctx.fillRect(48, y, 10, 14);
    ctx.fillRect(w - 58, y, 10, 14);
  }
  for (let x = 52; x < w - 52; x += 28) {
    ctx.fillRect(x, 48, 14, 10);
    ctx.fillRect(x, h - 58, 14, 10);
  }

  // Tribal Diamond Medallions down the center spine
  const medallionCount = 3;
  const innerH = h - panelMarginY * 2;
  for (let m = 0; m < medallionCount; m++) {
    const cx = w / 2;
    const cy = panelMarginY + ((m + 0.5) * innerH) / medallionCount;
    const rx = 86;
    const ry = 74;

    // Outer stepped diamond
    ctx.fillStyle = pal.border1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx + rx, cy);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx - rx, cy);
    ctx.closePath();
    ctx.fill();

    // Inner cream & rust star motif
    ctx.fillStyle = pal.accent1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry * 0.62);
    ctx.lineTo(cx + rx * 0.62, cy);
    ctx.lineTo(cx, cy + ry * 0.62);
    ctx.lineTo(cx - rx * 0.62, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = pal.accent2;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Corner tribal hooks inside panel
    ctx.fillStyle = pal.border1;
    ctx.fillRect(cx - 115, cy - 55, 22, 22);
    ctx.fillRect(cx + 93, cy - 55, 22, 22);
    ctx.fillRect(cx - 115, cy + 33, 22, 22);
    ctx.fillRect(cx + 93, cy + 33, 22, 22);
  }

  // Woven wool warp & weft texture overlay + sun-faded distressing
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(255, 245, 230, 0.06)' : 'rgba(20, 12, 8, 0.07)';
    ctx.fillRect(0, y, w, 2);
    bCtx.fillStyle = y % 8 === 0 ? '#a8a8a8' : '#585858';
    bCtx.fillRect(0, y, w, 2);
  }
  for (let x = 0; x < w; x += 4) {
    bCtx.fillStyle = x % 8 === 0 ? 'rgba(230,230,230,0.25)' : 'rgba(50,50,50,0.25)';
    bCtx.fillRect(x, 0, 2, h);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(bCanvas);

  const res = { map, bumpMap };
  pairTextureCache.set(cacheKey, res);
  return res;
}

/**
 * Dappled Mashrabiya Lattice Sunlight Projection Texture!
 * Reproduces the crisp-yet-soft geometric sunlight patches cast across the floor, rugs,
 * and recessed adobe window reveals in Reference Image 1.
 */
export function createMashrabiyaLightGoboTexture(): THREE.CanvasTexture {
  if (singleGoboCache) return singleGoboCache;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Soft outer vignette mask so the light patch blends seamlessly on the floor/wall
  const cols = 6;
  const rows = 8;
  const cellW = size / cols;
  const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Leave horizontal wooden crossbar shadow gaps at r === 3 and r === 5
      if (r === 3 || r === 6) continue;

      const cx = (c + 0.5) * cellW;
      const cy = (r + 0.5) * cellH;

      // Radial distance from center for soft penumbra falloff
      const nx = (cx / size - 0.5) * 2;
      const ny = (cy / size - 0.5) * 2;
      const edgeFade = Math.max(0, 1 - Math.pow(nx * nx * 0.75 + ny * ny * 0.75, 1.4));
      if (edgeFade <= 0.02) continue;

      // Central 8-point star / polygon light opening
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, cellW * 0.44);
      grad.addColorStop(0, `rgba(255, 250, 232, ${0.88 * edgeFade})`);
      grad.addColorStop(0.65, `rgba(255, 240, 205, ${0.68 * edgeFade})`);
      grad.addColorStop(1, 'rgba(255, 235, 190, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      const rad = cellW * 0.36;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + Math.PI / 8;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad * 0.85;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Secondary corner diamond light holes of the Mashrabiya pattern
      const subGrad = ctx.createRadialGradient(
        cx + cellW * 0.45,
        cy + cellH * 0.45,
        1,
        cx + cellW * 0.45,
        cy + cellH * 0.45,
        cellW * 0.22
      );
      subGrad.addColorStop(0, `rgba(255, 248, 224, ${0.72 * edgeFade})`);
      subGrad.addColorStop(1, 'rgba(255, 238, 195, 0)');
      ctx.fillStyle = subGrad;
      ctx.beginPath();
      ctx.arc(cx + cellW * 0.45, cy + cellH * 0.45, cellW * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  singleGoboCache = tex;
  return tex;
}

/**
 * Ribbed Terracotta & Painted Earthenware Pottery Texture matching Reference Image 1's jars.
 */
export function createTerracottaPotTextures(paintedPattern = false): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = `pot:${paintedPattern ? 'painted' : 'ribbed'}`;
  const cached = pairTextureCache.get(cacheKey);
  if (cached) return cached;

  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, 0, size);
  if (paintedPattern) {
    grad.addColorStop(0, '#C99B70');
    grad.addColorStop(0.5, '#BA8658');
    grad.addColorStop(1, '#8F5E38');
  } else {
    grad.addColorStop(0, '#A8623B');
    grad.addColorStop(0.45, '#8F4C28');
    grad.addColorStop(0.85, '#72391C');
    grad.addColorStop(1, '#582A13');
  }
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Horizontal wheel-thrown ribs (prominent in Reference Image 1's amphorae!)
  for (let y = 6; y < size; y += 8) {
    cCtx.fillStyle = y % 16 === 0 ? 'rgba(255, 220, 185, 0.16)' : 'rgba(45, 18, 6, 0.24)';
    cCtx.fillRect(0, y, size, 3);

    bCtx.fillStyle = y % 16 === 0 ? '#d8d8d8' : '#303030';
    bCtx.fillRect(0, y, size, 4);
  }

  // Optional geometric zig-zag band (matching the round patterned pot in Reference Image 1!)
  if (paintedPattern) {
    const bandY = size * 0.46;
    cCtx.fillStyle = 'rgba(245, 232, 212, 0.65)';
    cCtx.fillRect(0, bandY - 22, size, 44);

    cCtx.strokeStyle = '#5C331C';
    cCtx.lineWidth = 5;
    cCtx.beginPath();
    for (let x = 0; x <= size; x += 16) {
      const py = bandY + (x % 32 === 0 ? -14 : 14);
      if (x === 0) cCtx.moveTo(x, py);
      else cCtx.lineTo(x, py);
    }
    cCtx.stroke();
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const res = { map, bumpMap };
  pairTextureCache.set(cacheKey, res);
  return res;
}
