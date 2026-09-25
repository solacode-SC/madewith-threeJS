import * as THREE from 'three';

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function createStuccoTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Base pastel sky-blue stucco color matching the reference photo
  cCtx.fillStyle = '#9dd9e8';
  cCtx.fillRect(0, 0, size, size);

  // Neutral mid-high bump base
  bCtx.fillStyle = '#d8d8d8';
  bCtx.fillRect(0, 0, size, size);

  // Large soft plaster undulations
  for (let i = 0; i < 600; i++) {
    const x = pseudoRandom(i * 3 + 1) * size;
    const y = pseudoRandom(i * 3 + 2) * size;
    const r = 8 + pseudoRandom(i * 3 + 3) * 26;
    const isLight = pseudoRandom(i * 5) > 0.45;

    cCtx.fillStyle = isLight ? 'rgba(182, 234, 246, 0.14)' : 'rgba(125, 194, 214, 0.14)';
    cCtx.beginPath();
    cCtx.arc(x, y, r, 0, Math.PI * 2);
    cCtx.fill();

    bCtx.fillStyle = isLight ? 'rgba(245, 245, 245, 0.22)' : 'rgba(160, 160, 160, 0.22)';
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  // Characteristic Mediterranean pitted stucco pockets & trowel ridges
  for (let i = 0; i < 3200; i++) {
    const x = pseudoRandom(i * 7 + 11) * size;
    const y = pseudoRandom(i * 7 + 13) * size;
    const w = 1.5 + pseudoRandom(i * 7 + 17) * 6.5;
    const h = 1.0 + pseudoRandom(i * 7 + 19) * 3.5;
    const angle = (pseudoRandom(i * 7 + 23) - 0.5) * 0.6;
    const isPit = pseudoRandom(i * 11) > 0.32;

    bCtx.save();
    bCtx.translate(x, y);
    bCtx.rotate(angle);
    bCtx.fillStyle = isPit ? 'rgba(65, 65, 65, 0.55)' : 'rgba(255, 255, 255, 0.45)';
    bCtx.beginPath();
    bCtx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.restore();

    if (isPit && i % 2 === 0) {
      cCtx.save();
      cCtx.translate(x, y);
      cCtx.rotate(angle);
      cCtx.fillStyle = 'rgba(106, 178, 198, 0.22)';
      cCtx.beginPath();
      cCtx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.restore();
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2.5);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2.5);

  return { map, bumpMap };
}

export function createShopSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 256);

  // Subtle frosted border inside the arch glass
  ctx.strokeStyle = 'rgba(255, 244, 214, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 240, 210, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  // Warm gold-cream vintage shop lettering
  ctx.fillStyle = '#fff3d1';
  ctx.shadowColor = 'rgba(25, 15, 5, 0.65)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.textAlign = 'center';

  ctx.font = 'bold 44px "DM Serif Display", Georgia, serif';
  ctx.fillText('SUMOMALO', 256, 138);

  ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('• COFFEE •', 256, 188);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createChalkboardTexture(variant: 'main' | 'small' = 'main'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // Dark slate chalkboard surface
  ctx.fillStyle = '#262b2a';
  ctx.fillRect(0, 0, 256, 320);

  // Subtle dusty chalk smudges
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.beginPath();
    ctx.arc(
      pseudoRandom(i * 4 + 1) * 256,
      pseudoRandom(i * 4 + 2) * 320,
      10 + pseudoRandom(i * 4 + 3) * 30,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(245, 236, 215, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, 228, 292);

  ctx.fillStyle = '#f4ebd6';
  ctx.textAlign = 'center';

  if (variant === 'main') {
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText('SUMOMALO', 128, 56);

    ctx.strokeStyle = '#f09d51';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(45, 70);
    ctx.lineTo(211, 70);
    ctx.stroke();

    ctx.fillStyle = '#f5e8c7';
    ctx.font = '18px sans-serif';
    ctx.fillText('Sea Salt Latte .... 4.5', 128, 108);
    ctx.fillText('Citrus Espresso ... 3.8', 128, 142);
    ctx.fillText('Matcha Brioche .... 4.0', 128, 176);
    ctx.fillText('Cold Brew Tonic ... 4.2', 128, 210);

    // Cute chalk coffee cup icon
    ctx.strokeStyle = '#f4ebd6';
    ctx.lineWidth = 3;
    ctx.strokeRect(104, 236, 42, 34);
    ctx.beginPath();
    ctx.arc(146, 253, 10, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(94, 276);
    ctx.lineTo(160, 276);
    ctx.stroke();
  } else {
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText('FRESH', 128, 115);
    ctx.fillStyle = '#f5b86e';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('BAKERY &', 128, 165);
    ctx.fillText('ROASTERY', 128, 205);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createHangingSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f7f4ec';
  ctx.fillRect(0, 0, 256, 256);

  // Pastel blue inner frame
  ctx.strokeStyle = '#7ec4d8';
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, 228, 228);

  // Circular emblem
  ctx.strokeStyle = '#2d5c6e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 118, 62, 0, Math.PI * 2);
  ctx.stroke();

  // Coffee cup + wave illustration
  ctx.fillStyle = '#e87a1e';
  ctx.beginPath();
  ctx.arc(128, 122, 26, 0, Math.PI);
  ctx.fill();

  ctx.fillStyle = '#1f5a73';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SUMOMALO', 128, 212);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPromenadeTextures(): {
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

  // Sun-bleached whitewashed limestone base
  cCtx.fillStyle = '#f3efe6';
  cCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#d0d0d0';
  bCtx.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 4;
  const tileW = size / cols;
  const tileH = size / rows;

  for (let r = 0; r < rows; r++) {
    const offsetX = (r % 2) * (tileW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * tileW + offsetX;
      const y = r * tileH;
      const seed = r * 31 + c * 17 + 100;
      const shade = 236 + Math.floor((pseudoRandom(seed) - 0.5) * 14);
      cCtx.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade - 11})`;
      cCtx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);

      cCtx.strokeStyle = 'rgba(195, 186, 170, 0.65)';
      cCtx.lineWidth = 2.5;
      cCtx.strokeRect(x + 2, y + 2, tileW - 4, tileH - 4);

      bCtx.fillStyle = '#efefef';
      bCtx.fillRect(x + 3, y + 3, tileW - 6, tileH - 6);
      bCtx.strokeStyle = '#707070';
      bCtx.lineWidth = 3;
      bCtx.strokeRect(x + 1.5, y + 1.5, tileW - 3, tileH - 3);
    }
  }

  // Subtle sand speckles
  for (let i = 0; i < 1800; i++) {
    const x = pseudoRandom(i * 5 + 1) * size;
    const y = pseudoRandom(i * 5 + 2) * size;
    const isDark = pseudoRandom(i * 5 + 3) > 0.5;
    cCtx.fillStyle = isDark ? 'rgba(198, 186, 164, 0.25)' : 'rgba(255, 253, 248, 0.35)';
    cCtx.fillRect(x, y, 2, 2);
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(8, 8);

  return { map, bumpMap };
}

export function createStrawHatTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm woven bamboo/straw tone matching the 2nd reference illustration
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#c8ab8e');
  grad.addColorStop(0.25, '#dcc2a8');
  grad.addColorStop(0.85, '#d1b497');
  grad.addColorStop(1, '#b8987a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle woven concentric rings
  ctx.strokeStyle = 'rgba(110, 78, 52, 0.14)';
  ctx.lineWidth = 2;
  for (let y = 16; y < size; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Hand-drawn style radial straw reed hash marks (just like the 2nd image!)
  ctx.strokeStyle = 'rgba(82, 54, 36, 0.38)';
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 140; i++) {
    const x = pseudoRandom(i * 9 + 1) * size;
    const y = 30 + pseudoRandom(i * 9 + 2) * (size - 45);
    const len = 10 + pseudoRandom(i * 9 + 3) * 24;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (pseudoRandom(i * 9 + 4) - 0.5) * 4, y + len);
    ctx.stroke();
  }

  // Soft anime specular highlight oval near upper-left of hat
  ctx.fillStyle = 'rgba(255, 250, 242, 0.55)';
  ctx.beginPath();
  ctx.ellipse(170, 175, 28, 16, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Dark rim accent at bottom edge and apex ring
  ctx.fillStyle = 'rgba(72, 46, 31, 0.65)';
  ctx.fillRect(0, 0, size, 16);
  ctx.fillRect(0, size - 10, size, 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
