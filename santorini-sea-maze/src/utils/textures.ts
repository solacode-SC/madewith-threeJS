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
 * Crisp Cycladic whitewashed stucco wall texture matching the Santorini reference photo.
 * Features granular hand-troweled Mediterranean plaster bump relief and cool sky-blue shadow undertones.
 */
export function createWhitewashedStuccoTextures(
  variant: 'sunlit-white' | 'periwinkle-shade' | 'terrace-step' = 'sunlit-white'
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = `stucco:${variant}`;
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
  if (variant === 'sunlit-white') {
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.55, '#F7FAFF');
    grad.addColorStop(1, '#E8F0FC');
  } else if (variant === 'periwinkle-shade') {
    grad.addColorStop(0, '#EBF2FC');
    grad.addColorStop(0.5, '#D8E5F7');
    grad.addColorStop(1, '#C4D6F0');
  } else {
    grad.addColorStop(0, '#FAFCFF');
    grad.addColorStop(0.5, '#EEF4FC');
    grad.addColorStop(1, '#DCE8F8');
  }
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Hand-troweled plaster wash blooms
  const plasterTones = [
    'rgba(255, 255, 255, 0.35)',
    'rgba(218, 232, 250, 0.22)',
    'rgba(200, 218, 244, 0.18)',
    'rgba(244, 249, 255, 0.30)',
  ];

  for (let i = 0; i < 650; i++) {
    const x = pseudoRandom(i * 5 + 1) * size;
    const y = pseudoRandom(i * 5 + 2) * size;
    const w = 18 + pseudoRandom(i * 5 + 3) * 56;
    const h = 14 + pseudoRandom(i * 5 + 4) * 44;
    const angle = (pseudoRandom(i * 5 + 5) - 0.5) * 0.5;

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(angle);
    cCtx.fillStyle = plasterTones[i % plasterTones.length];
    cCtx.fillRect(-w / 2, -h / 2, w, h);
    cCtx.restore();

    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(angle);
    bCtx.fillStyle = i % 2 === 0 ? 'rgba(210, 210, 210, 0.26)' : 'rgba(60, 60, 60, 0.24)';
    bCtx.fillRect(-w / 2, -h / 2, w, h);
    bCtx.restore();
  }

  // High-frequency granular stucco grains (visible on the right-hand wall of the reference photo)
  for (let i = 0; i < 2400; i++) {
    const x = pseudoRandom(i * 11 + 3) * size;
    const y = pseudoRandom(i * 11 + 7) * size;
    const r = 1.0 + pseudoRandom(i * 11 + 9) * 2.8;
    cCtx.fillStyle =
      i % 3 === 0 ? 'rgba(182, 202, 232, 0.20)' : 'rgba(255, 255, 255, 0.32)';
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();

    bCtx.fillStyle = i % 2 === 0 ? '#d8d8d8' : '#323232';
    bCtx.beginPath();
    bCtx.arc(x, y, r * 1.15, 0, Math.PI * 2);
    bCtx.fill();
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
 * Signature Santorini Turquoise-Stepped Road & Whitewashed Cobblestone Pavement Textures.
 * Matches the glowing aquamarine/turquoise stepped road and crisp white/lavender stone borders in the reference image.
 */
export function createCoastalRoadTextures(
  variant: 'turquoise-steps' | 'white-cobble' = 'turquoise-steps'
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = `road:${variant}`;
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

  if (variant === 'turquoise-steps') {
    // Crisp whitewashed stone sidewalk borders with glowing turquoise central stepped road
    cCtx.fillStyle = '#F2F7FE';
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#888888';
    bCtx.fillRect(0, 0, size, size);

    // Central Turquoise-Aquamarine Road Channel (from x = 88 to x = 424)
    const roadGrad = cCtx.createLinearGradient(88, 0, 424, 0);
    roadGrad.addColorStop(0, '#5BD0E4');
    roadGrad.addColorStop(0.18, '#7BE5F4');
    roadGrad.addColorStop(0.5, '#8EF0FC');
    roadGrad.addColorStop(0.82, '#75E1F0');
    roadGrad.addColorStop(1, '#58CCE0');
    cCtx.fillStyle = roadGrad;
    cCtx.fillRect(84, 0, 344, size);

    // Crisp whitewashed curb borders framing the turquoise road
    cCtx.fillStyle = '#FFFFFF';
    cCtx.fillRect(72, 0, 14, size);
    cCtx.fillRect(426, 0, 14, size);

    // Horizontal stepped terrace risers & cool periwinkle shadow bands matching the reference photo
    const stepCount = 8;
    const stepH = size / stepCount;
    for (let s = 0; s < stepCount; s++) {
      const sy = s * stepH;
      // White stone step nosing highlight
      cCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      cCtx.fillRect(0, sy, size, 6);

      // Cool lavender-cyan step riser shadow band
      cCtx.fillStyle = 'rgba(92, 165, 206, 0.32)';
      cCtx.fillRect(84, sy + 6, 344, 12);

      // Outer white step riser shadow
      cCtx.fillStyle = 'rgba(180, 202, 234, 0.42)';
      cCtx.fillRect(0, sy + 6, 84, 10);
      cCtx.fillRect(428, sy + 6, 84, 10);

      // Bump map step groove
      bCtx.fillStyle = '#e0e0e0';
      bCtx.fillRect(0, sy, size, 5);
      bCtx.fillStyle = '#303030';
      bCtx.fillRect(0, sy + 5, size, 8);
    }

    // Subtle shimmering turquoise water/mosaic caustics inside the center channel
    for (let i = 0; i < 240; i++) {
      const cx = 98 + pseudoRandom(i * 7 + 1) * 316;
      const cy = pseudoRandom(i * 7 + 2) * size;
      const rx = 10 + pseudoRandom(i * 7 + 3) * 26;
      const ry = 4 + pseudoRandom(i * 7 + 4) * 10;
      cCtx.fillStyle =
        i % 2 === 0
          ? 'rgba(255, 255, 255, 0.28)'
          : 'rgba(64, 188, 216, 0.22)';
      cCtx.beginPath();
      cCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      cCtx.fill();
    }

    // Fine granular Mediterranean limestone speckles on outer borders
    for (let i = 0; i < 900; i++) {
      const x = pseudoRandom(i * 13 + 1) * size;
      const y = pseudoRandom(i * 13 + 2) * size;
      const r = 1.2 + pseudoRandom(i * 13 + 3) * 2.5;
      bCtx.fillStyle = i % 2 === 0 ? '#b8b8b8' : '#525252';
      bCtx.beginPath();
      bCtx.arc(x, y, r, 0, Math.PI * 2);
      bCtx.fill();
    }
  } else {
    // Whitewashed Cycladic Flagstone / Cobblestone with cool periwinkle & turquoise mortar joints
    const grad = cCtx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#F5F9FF');
    grad.addColorStop(0.5, '#EBF2FC');
    grad.addColorStop(1, '#DCE8F8');
    cCtx.fillStyle = grad;
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const stoneColors = ['#FFFFFF', '#F4F8FF', '#EAF2FC', '#F8FBFF', '#E3EEFA'];
    for (let i = 0; i < 110; i++) {
      const sx = pseudoRandom(i * 7 + 1) * size;
      const sy = pseudoRandom(i * 7 + 2) * size;
      const sw = 28 + pseudoRandom(i * 7 + 3) * 48;
      const sh = 24 + pseudoRandom(i * 7 + 4) * 42;
      const angle = (pseudoRandom(i * 7 + 5) - 0.5) * 0.35;

      cCtx.save();
      cCtx.translate(sx, sy);
      cCtx.rotate(angle);
      cCtx.fillStyle = stoneColors[i % stoneColors.length];
      cCtx.beginPath();
      const rx = 7;
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

      // Crisp white/cyan-tinted mortar outline (famous Cycladic painted stone joints)
      cCtx.strokeStyle = i % 5 === 0 ? 'rgba(98, 206, 232, 0.55)' : 'rgba(176, 198, 230, 0.55)';
      cCtx.lineWidth = 3.0;
      cCtx.stroke();
      cCtx.restore();

      bCtx.save();
      bCtx.translate(sx, sy);
      bCtx.rotate(angle);
      bCtx.fillStyle = '#a8a8a8';
      bCtx.fillRect(-sw / 2, -sh / 2, sw, sh);
      bCtx.strokeStyle = '#383838';
      bCtx.lineWidth = 3;
      bCtx.strokeRect(-sw / 2, -sh / 2, sw, sh);
      bCtx.restore();
    }
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
 * Aegean Cerulean-Blue Painted Wood Texture for Santorini Arched Doors, Windows & Shutters.
 */
export function createAegeanBlueWoodTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = 'aegean-blue-wood';
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
  grad.addColorStop(0, '#5CB3F2');
  grad.addColorStop(0.5, '#469FE4');
  grad.addColorStop(1, '#3186CE');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Vertical paneled planks
  const planks = 6;
  const plankW = size / planks;
  for (let p = 0; p < planks; p++) {
    const px = p * plankW;
    cCtx.fillStyle = p % 2 === 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(20, 75, 135, 0.12)';
    cCtx.fillRect(px, 0, plankW, size);

    cCtx.fillStyle = 'rgba(22, 74, 130, 0.55)';
    cCtx.fillRect(px, 0, 4, size);
    bCtx.fillStyle = '#252525';
    bCtx.fillRect(px, 0, 5, size);
  }

  // Subtle painted wood grain
  for (let i = 0; i < 450; i++) {
    const x = pseudoRandom(i * 3 + 1) * size;
    const y = pseudoRandom(i * 3 + 2) * size;
    const w = 2 + pseudoRandom(i * 3 + 3) * 4;
    const h = 40 + pseudoRandom(i * 3 + 4) * 120;
    cCtx.fillStyle =
      i % 2 === 0 ? 'rgba(145, 212, 255, 0.18)' : 'rgba(24, 82, 142, 0.18)';
    cCtx.fillRect(x, y - h / 2, w, h);
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
 * Whitewashed & Pale-Stone Ribbed Ceramic Amphora Urn Texture matching the planters in the reference photo.
 */
export function createWhiteAmphoraTextures(withBlueBand = false): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cacheKey = `white-amphora:${withBlueBand ? 'banded' : 'pure'}`;
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
  grad.addColorStop(0, '#F7FAFF');
  grad.addColorStop(0.5, '#E5EEF9');
  grad.addColorStop(1, '#CCD9EE');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Horizontal wheel-thrown ribs (clearly visible on the lower-right amphora pot in the reference image)
  for (let y = 6; y < size; y += 7) {
    cCtx.fillStyle =
      y % 14 === 0 ? 'rgba(255, 255, 255, 0.55)' : 'rgba(162, 182, 214, 0.38)';
    cCtx.fillRect(0, y, size, 3);

    bCtx.fillStyle = y % 14 === 0 ? '#dedede' : '#343434';
    bCtx.fillRect(0, y, size, 3);
  }

  if (withBlueBand) {
    const bandY = size * 0.44;
    cCtx.fillStyle = 'rgba(74, 168, 232, 0.65)';
    cCtx.fillRect(0, bandY - 12, size, 24);
    cCtx.strokeStyle = '#FFFFFF';
    cCtx.lineWidth = 3;
    cCtx.beginPath();
    for (let x = 0; x <= size; x += 16) {
      const py = bandY + (x % 32 === 0 ? -7 : 7);
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

/**
 * Crisp spiky Dracaena / Dragon Palm shadow projection gobo matching the palm shadow on the white steps in the reference image.
 */
export function createPalmShadowGoboTexture(): THREE.CanvasTexture {
  if (singleGoboCache) return singleGoboCache;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Radiating spiky Dracaena sword-leaf shadow blades in cool periwinkle-blue
  for (let i = 0; i < 28; i++) {
    const angle = (i * Math.PI * 2) / 28 + pseudoRandom(i * 5) * 0.12;
    const len = 130 + pseudoRandom(i * 7) * 95;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, 'rgba(136, 168, 218, 0.55)');
    grad.addColorStop(0.65, 'rgba(148, 180, 226, 0.35)');
    grad.addColorStop(1, 'rgba(148, 180, 226, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(len * 0.5, -10, len, 0);
    ctx.quadraticCurveTo(len * 0.5, 10, 0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  singleGoboCache = tex;
  return tex;
}
