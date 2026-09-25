import * as THREE from 'three';

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Painterly cobalt & cerulean step texture with palette-knife strokes
 * and signature whitewash paint drips matching Reference Image 1.
 */
export function createCobaltStepTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  // Base cobalt blue pigment
  const baseGrad = cCtx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#1c64d4');
  baseGrad.addColorStop(0.5, '#2b7de9');
  baseGrad.addColorStop(1, '#154eb5');
  cCtx.fillStyle = baseGrad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#888888';
  bCtx.fillRect(0, 0, size, size);

  // Impasto palette-knife rectangles & brush strokes in ultramarine, cerulean, and sky blue
  const palette = [
    'rgba(17, 62, 156, 0.48)',
    'rgba(38, 115, 224, 0.45)',
    'rgba(78, 154, 245, 0.42)',
    'rgba(118, 188, 252, 0.35)',
    'rgba(12, 45, 122, 0.40)',
  ];

  for (let i = 0; i < 950; i++) {
    const x = pseudoRandom(i * 5 + 1) * size;
    const y = pseudoRandom(i * 5 + 2) * size;
    const w = 14 + pseudoRandom(i * 5 + 3) * 48;
    const h = 8 + pseudoRandom(i * 5 + 4) * 28;
    const angle = (pseudoRandom(i * 5 + 5) - 0.5) * 0.35;
    const col = palette[i % palette.length];

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(angle);
    cCtx.fillStyle = col;
    cCtx.fillRect(-w / 2, -h / 2, w, h);
    cCtx.restore();

    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(angle);
    bCtx.fillStyle = i % 2 === 0 ? 'rgba(220,220,220,0.28)' : 'rgba(60,60,60,0.28)';
    bCtx.fillRect(-w / 2, -h / 2, w, h);
    bCtx.restore();
  }

  // Cut stone slab mortar joints
  cCtx.strokeStyle = 'rgba(10, 38, 102, 0.45)';
  cCtx.lineWidth = 3;
  bCtx.strokeStyle = 'rgba(30, 30, 30, 0.7)';
  bCtx.lineWidth = 4;
  for (let r = 1; r < 4; r++) {
    const y = (r * size) / 4;
    cCtx.beginPath();
    cCtx.moveTo(0, y);
    cCtx.lineTo(size, y);
    cCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(size, y);
    bCtx.stroke();
  }

  // Authentic whitewash paint splashes & vertical riser drips (exact detail from Image 1!)
  for (let i = 0; i < 38; i++) {
    const dripX = 160 + pseudoRandom(i * 11 + 3) * 190;
    const dripY = pseudoRandom(i * 11 + 7) * size;
    const dripLen = 18 + pseudoRandom(i * 11 + 9) * 65;
    const dripW = 3 + pseudoRandom(i * 11 + 13) * 9;

    cCtx.fillStyle = 'rgba(244, 248, 255, 0.82)';
    cCtx.beginPath();
    cCtx.roundRect(dripX, dripY, dripW, dripLen, 4);
    cCtx.fill();

    // Paint splash crown
    cCtx.beginPath();
    cCtx.ellipse(dripX + dripW * 0.5, dripY, dripW * 1.8, dripW * 0.9, 0, 0, Math.PI * 2);
    cCtx.fill();

    bCtx.fillStyle = 'rgba(250, 250, 250, 0.65)';
    bCtx.fillRect(dripX, dripY, dripW, dripLen);
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

/**
 * Chefchaouen two-tone plaster wall texture:
 * Rich cobalt/sky-blue hand-brushed lower wall blending into crisp chalk-white upper lime plaster.
 */
export function createMedinaWallTextures(variant: 'blue-lower' | 'white-plaster' | 'deep-cobalt' = 'blue-lower'): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  if (variant === 'white-plaster') {
    const grad = cCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#fcfdff');
    grad.addColorStop(0.75, '#f2f6fc');
    grad.addColorStop(1, '#dce9fb');
    cCtx.fillStyle = grad;
    cCtx.fillRect(0, 0, size, size);
  } else if (variant === 'deep-cobalt') {
    const grad = cCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#5ba0f5');
    grad.addColorStop(0.5, '#2b78e4');
    grad.addColorStop(1, '#1652bc');
    cCtx.fillStyle = grad;
    cCtx.fillRect(0, 0, size, size);
  } else {
    // Classic Image 1 gradient: chalky white upper wall -> sky blue -> deep cobalt base
    const grad = cCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#fbfdff');
    grad.addColorStop(0.32, '#f4f8ff');
    grad.addColorStop(0.52, '#a3ccf9');
    grad.addColorStop(0.72, '#4c94f0');
    grad.addColorStop(1, '#1d64d6');
    cCtx.fillStyle = grad;
    cCtx.fillRect(0, 0, size, size);
  }

  bCtx.fillStyle = '#c8c8c8';
  bCtx.fillRect(0, 0, size, size);

  // Expressive oil/limewash brush strokes & trowel plaster texture
  for (let i = 0; i < 1100; i++) {
    const x = pseudoRandom(i * 7 + 1) * size;
    const y = pseudoRandom(i * 7 + 2) * size;
    const w = 10 + pseudoRandom(i * 7 + 3) * 42;
    const h = 14 + pseudoRandom(i * 7 + 4) * 54;
    const angle = (pseudoRandom(i * 7 + 5) - 0.5) * 0.4;

    const isLower = y > size * 0.45;
    if (variant === 'blue-lower') {
      cCtx.fillStyle = isLower
        ? i % 2 === 0
          ? 'rgba(30, 104, 218, 0.22)'
          : 'rgba(130, 188, 252, 0.20)'
        : i % 3 === 0
          ? 'rgba(210, 228, 250, 0.25)'
          : 'rgba(255, 255, 255, 0.35)';
    } else if (variant === 'white-plaster') {
      cCtx.fillStyle =
        i % 3 === 0 ? 'rgba(205, 224, 248, 0.22)' : 'rgba(255, 255, 255, 0.35)';
    } else {
      cCtx.fillStyle =
        i % 2 === 0 ? 'rgba(22, 82, 188, 0.28)' : 'rgba(115, 178, 250, 0.24)';
    }

    cCtx.save();
    cCtx.translate(x, y);
    cCtx.rotate(angle);
    cCtx.fillRect(-w / 2, -h / 2, w, h);
    cCtx.restore();

    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(angle);
    bCtx.fillStyle = i % 2 === 0 ? 'rgba(245, 245, 245, 0.3)' : 'rgba(90, 90, 90, 0.3)';
    bCtx.fillRect(-w / 2, -h / 2, w, h);
    bCtx.restore();
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;

  return { map, bumpMap };
}

/**
 * Chalky whitewashed ceramic amphora texture matching the large foreground pots in Image 1.
 */
export function createCeramicPotTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 256;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#eef4fc');
  grad.addColorStop(1, '#cbdff6');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#bcbcbc';
  bCtx.fillRect(0, 0, size, size);

  // Hand-thrown potter's wheel ribs & thick white impasto dabs
  for (let y = 8; y < size; y += 12) {
    bCtx.strokeStyle = 'rgba(240, 240, 240, 0.35)';
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(size, y);
    bCtx.stroke();
  }

  for (let i = 0; i < 450; i++) {
    const x = pseudoRandom(i * 3 + 1) * size;
    const y = pseudoRandom(i * 3 + 2) * size;
    const r = 4 + pseudoRandom(i * 3 + 3) * 14;
    cCtx.fillStyle =
      i % 3 === 0 ? 'rgba(180, 208, 242, 0.25)' : 'rgba(255, 255, 255, 0.45)';
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();

    bCtx.fillStyle = i % 2 === 0 ? 'rgba(250,250,250,0.4)' : 'rgba(80,80,80,0.35)';
    bCtx.beginPath();
    bCtx.arc(x, y, r * 0.7, 0, Math.PI * 2);
    bCtx.fill();
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

/**
 * Moroccan Zellij geometric star mosaic tile texture for fountains, arches & plazas.
 */
export function createZellijTileTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f4f8ff';
  ctx.fillRect(0, 0, size, size);

  const cells = 4;
  const cellSize = size / cells;

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const cx = (c + 0.5) * cellSize;
      const cy = (r + 0.5) * cellSize;

      // Outer cobalt octagon/star
      ctx.fillStyle = (r + c) % 2 === 0 ? '#1858c8' : '#268bd2';
      for (let rot = 0; rot < 2; rot++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((rot * Math.PI) / 4);
        ctx.fillRect(-cellSize * 0.28, -cellSize * 0.28, cellSize * 0.56, cellSize * 0.56);
        ctx.restore();
      }

      // Inner white & gold rosette
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f0a830';
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
