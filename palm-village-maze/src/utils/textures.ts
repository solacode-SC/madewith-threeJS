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
 * Warm weathered mud-brick wall texture matching the reference village image.
 * Sandy ochre with visible brick mortar lines and plaster patches.
 */
export function createMudBrickTextures(
  variant: 'warm-ochre' | 'sunlit-sand' | 'shaded-earth' = 'warm-ochre'
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = `mudbrick:${variant}`;
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

  // Brick mortar lines - horizontal courses
  const brickHeight = 28;
  for (let y = 0; y < size; y += brickHeight) {
    cCtx.fillStyle = 'rgba(120, 88, 58, 0.25)';
    cCtx.fillRect(0, y, size, 3);
    bCtx.fillStyle = '#404040';
    bCtx.fillRect(0, y, size, 3);

    // Vertical mortar joints (staggered)
    const offset = (Math.floor(y / brickHeight) % 2) * 42;
    for (let x = offset; x < size; x += 84) {
      cCtx.fillStyle = 'rgba(120, 88, 58, 0.22)';
      cCtx.fillRect(x, y, 3, brickHeight);
      bCtx.fillStyle = '#404040';
      bCtx.fillRect(x, y, 3, brickHeight);
    }
  }

  // Watercolor wash blooms & plaster patches
  const washColors = [
    'rgba(232, 206, 176, 0.18)',
    'rgba(168, 128, 90, 0.16)',
    'rgba(142, 104, 70, 0.14)',
    'rgba(244, 224, 198, 0.16)',
    'rgba(188, 148, 108, 0.18)',
  ];

  for (let i = 0; i < 800; i++) {
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

  // Fine sand speckles
  for (let i = 0; i < 500; i++) {
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
 * Cobblestone pathway texture matching the village's ancient stone paths.
 */
export function createCobblestoneFloorTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = 'cobblestone-floor';
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

  // Sandy base
  const grad = cCtx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#D4BC9A');
  grad.addColorStop(0.5, '#C8AD88');
  grad.addColorStop(1, '#B89C76');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Irregular cobblestones
  const stoneColors = ['#C8B090', '#BFA882', '#D0B898', '#B8A078', '#CCB494'];
  for (let i = 0; i < 120; i++) {
    const sx = pseudoRandom(i * 7 + 1) * size;
    const sy = pseudoRandom(i * 7 + 2) * size;
    const sw = 22 + pseudoRandom(i * 7 + 3) * 45;
    const sh = 18 + pseudoRandom(i * 7 + 4) * 38;
    const angle = (pseudoRandom(i * 7 + 5) - 0.5) * 0.4;

    cCtx.save();
    cCtx.translate(sx, sy);
    cCtx.rotate(angle);
    cCtx.fillStyle = stoneColors[i % stoneColors.length];
    cCtx.beginPath();
    // Rounded rectangle for each stone
    const rx = 6;
    cCtx.moveTo(-sw / 2 + rx, -sh / 2);
    cCtx.lineTo(sw / 2 - rx, -sh / 2);
    cCtx.quadraticCurveTo(sw / 2, -sh / 2, sw / 2, -sh / 2 + rx);
    cCtx.lineTo(sw / 2, sh / 2 - rx);
    cCtx.quadraticCurveTo(sw / 2, sh / 2, sw / 2 - rx, sh / 2);
    cCtx.lineTo(-sw / 2 + rx, sh / 2);
    cCtx.quadraticCurveTo(-sw / 2, sh / 2, -sw / 2, sh / 2 - rx);
    cCtx.lineTo(-sw / 2, -sh / 2 + rx);
    cCtx.quadraticCurveTo(-sw / 2, -sh / 2, -sw / 2 + rx, -sh / 2);
    cCtx.closePath();
    cCtx.fill();

    // Mortar gap around each stone
    cCtx.strokeStyle = 'rgba(92, 72, 48, 0.4)';
    cCtx.lineWidth = 2.5;
    cCtx.stroke();
    cCtx.restore();

    // Bump for stone edges
    bCtx.save();
    bCtx.translate(sx, sy);
    bCtx.rotate(angle);
    bCtx.fillStyle = '#a0a0a0';
    bCtx.fillRect(-sw / 2, -sh / 2, sw, sh);
    bCtx.strokeStyle = '#404040';
    bCtx.lineWidth = 3;
    bCtx.strokeRect(-sw / 2, -sh / 2, sw, sh);
    bCtx.restore();
  }

  // Moss in gaps
  for (let i = 0; i < 200; i++) {
    const x = pseudoRandom(i * 13 + 1) * size;
    const y = pseudoRandom(i * 13 + 2) * size;
    const r = 2 + pseudoRandom(i * 13 + 3) * 4;
    cCtx.fillStyle = `rgba(88, 128, 62, ${0.12 + pseudoRandom(i * 13 + 4) * 0.12})`;
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();
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
 * Dark weathered wooden door / shutter texture.
 */
export function createWoodenDoorTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = 'wooden-door';
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

  // Plank divisions & wood grain
  const planks = 6;
  const plankH = size / planks;
  for (let p = 0; p < planks; p++) {
    const py = p * plankH;
    const tone = p % 2 === 0 ? '#4E3423' : '#3E281A';
    cCtx.fillStyle = tone;
    cCtx.fillRect(0, py, size, plankH);

    cCtx.fillStyle = '#1E1109';
    cCtx.fillRect(0, py, size, 4);
    bCtx.fillStyle = '#181818';
    bCtx.fillRect(0, py, size, 5);
  }

  // Wood grain streaks
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
 * Dappled palm tree shadow / window lattice sunlight projection texture.
 */
export function createPalmShadowGoboTexture(): THREE.CanvasTexture {
  if (singleGoboCache) return singleGoboCache;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Palm frond shadow pattern - elongated leaf shapes radiating from center
  const cx = size / 2;
  const cy = size / 2;

  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 + 0.3;
    const len = 140 + pseudoRandom(i * 7) * 80;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, 'rgba(255, 250, 232, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 240, 205, 0.6)');
    grad.addColorStop(1, 'rgba(255, 235, 190, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(len * 0.4, 0, len * 0.45, 18 + pseudoRandom(i * 3) * 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sub-leaflets
    for (let j = 0; j < 6; j++) {
      const lx = 30 + j * 22;
      const ly = (j % 2 === 0 ? -1 : 1) * (12 + pseudoRandom(i * 11 + j) * 10);
      ctx.fillStyle = `rgba(255, 248, 224, ${0.5 - j * 0.06})`;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 16, 6, (j % 2 === 0 ? -0.3 : 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Soft outer vignette
  const vigGrad = ctx.createRadialGradient(cx, cy, 60, cx, cy, size * 0.5);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  singleGoboCache = tex;
  return tex;
}

/**
 * Clay pot / terracotta texture for village decorations.
 */
export function createClayPotTextures(paintedPattern = false): {
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

  // Horizontal wheel-thrown ribs
  for (let y = 6; y < size; y += 8) {
    cCtx.fillStyle = y % 16 === 0 ? 'rgba(255, 220, 185, 0.16)' : 'rgba(45, 18, 6, 0.24)';
    cCtx.fillRect(0, y, size, 3);

    bCtx.fillStyle = y % 16 === 0 ? '#d8d8d8' : '#303030';
    bCtx.fillRect(0, y, size, 4);
  }

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
