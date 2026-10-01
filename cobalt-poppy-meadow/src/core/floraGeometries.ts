import * as THREE from 'three';

/**
 * Helper to apply vertex colors across a buffer geometry
 */
function applyVertexColor(geo: THREE.BufferGeometry, color: THREE.Color) {
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/**
 * 1. HIGH-DETAIL HAND-PAINTED POPPY GEOMETRY:
 * - Slender curving stem with natural nod and taper
 * - Stylized clasping stem leaves with painted pale margins
 * - Calyx sepals clasping the flower head
 * - Two concentric layers of ruffled, fluted gouache petals (9 total petals)
 * - Radial petal surface waves and curling edges
 * - Central dark ink seed capsule dome
 * - Radiant starburst ring of golden stamen filaments with bright ivory/cream anther tips
 * (Faithfully reproducing the signature white starburst flower centers in reference-art.jpg)
 */
export function createPoppyGeometry(
  petalColorHex: string,
  darkCenterHex: string = '#090E1A',
  isNodding: boolean = false
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  const petalColor = new THREE.Color(petalColorHex);
  const stemColor = new THREE.Color('#2C4223');
  const leafColor = new THREE.Color('#1F323D'); // stylized blue-green foliage matching painting
  const leafMarginColor = new THREE.Color('#8EA8BE');
  const darkCenterColor = new THREE.Color(darkCenterHex);
  const stamenStemColor = new THREE.Color('#CA8A04');
  const stamenTipColor = new THREE.Color('#FFFDF5'); // bright starburst tips

  // --- A. Slender Curving Botanical Stem ---
  const stemCurvePoints = isNodding
    ? [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.04, 0.35, 0.02),
        new THREE.Vector3(-0.02, 0.72, -0.03),
        new THREE.Vector3(0.08, 1.02, 0.06),
        new THREE.Vector3(0.18, 1.15, 0.12),
      ]
    : [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.02, 0.35, -0.01),
        new THREE.Vector3(-0.03, 0.7, 0.02),
        new THREE.Vector3(0.01, 1.05, 0.0),
        new THREE.Vector3(0.0, 1.18, 0.0),
      ];

  const stemCurve = new THREE.CatmullRomCurve3(stemCurvePoints);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.016, 5, false);
  applyVertexColor(stemGeo, stemColor);
  geometries.push(stemGeo);

  // --- B. Stylized Clasping Stem Leaves (1-2 leaves) ---
  const leaf1Geo = new THREE.PlaneGeometry(0.12, 0.34, 2, 4);
  const l1Pos = leaf1Geo.attributes.position;
  const l1Colors = new Float32Array(l1Pos.count * 3);
  for (let i = 0; i < l1Pos.count; i++) {
    const y = l1Pos.getY(i) + 0.17;
    const t = y / 0.34;
    const x = l1Pos.getX(i);
    // Taper to sharp tip and curve outward
    l1Pos.setX(i, x * (1.0 - t * 0.8));
    l1Pos.setZ(i, Math.sin(t * Math.PI) * 0.05);

    // Margin highlight (pale blue-grey painted contour)
    const isEdge = Math.abs(x) > 0.035 || t > 0.85;
    const c = isEdge ? leafMarginColor : leafColor;
    l1Colors[i * 3] = c.r;
    l1Colors[i * 3 + 1] = c.g;
    l1Colors[i * 3 + 2] = c.b;
  }
  leaf1Geo.setAttribute('color', new THREE.BufferAttribute(l1Colors, 3));
  leaf1Geo.computeVertexNormals();
  leaf1Geo.rotateX(0.7);
  leaf1Geo.rotateY(0.4);
  leaf1Geo.translate(0.02, 0.45, 0.0);
  geometries.push(leaf1Geo);

  // --- C. Flower Head Base Sepals (Calyx) ---
  const headPos = stemCurvePoints[stemCurvePoints.length - 1];
  const calyxGeo = new THREE.ConeGeometry(0.045, 0.06, 5);
  calyxGeo.rotateX(Math.PI);
  calyxGeo.translate(headPos.x, headPos.y - 0.02, headPos.z);
  applyVertexColor(calyxGeo, new THREE.Color('#1B331A'));
  geometries.push(calyxGeo);

  // Head tilt rotation if nodding
  const headTiltX = isNodding ? 0.65 : 0.08;
  const headTiltZ = isNodding ? 0.35 : 0.0;

  // --- D. Layer 1: Outer Scalloped Petals (5 broad ruffled petals) ---
  const outerPetalCount = 5;
  for (let i = 0; i < outerPetalCount; i++) {
    const angle = (i / outerPetalCount) * Math.PI * 2 + (i % 2) * 0.12;
    // Ruffled fan shape
    const petalGeo = new THREE.PlaneGeometry(0.32, 0.42, 5, 5);
    const pos = petalGeo.attributes.position;

    for (let p = 0; p < pos.count; p++) {
      const px = pos.getX(p);
      const py = pos.getY(p) + 0.21; // 0 to 0.42
      const t = py / 0.42;

      // Scalloped fan expansion
      const fanWidth = 1.0 + t * 0.9;
      pos.setX(p, px * fanWidth);

      // Fluted ruffles on outer edge (creating that hand-painted wavy brush edge)
      const edgeWave = Math.sin(px * 24.0) * 0.025 * t;
      const cupCurl = Math.pow(t, 1.8) * 0.12 - Math.abs(px) * 0.05;
      pos.setZ(p, cupCurl + edgeWave);
    }
    petalGeo.computeVertexNormals();

    // Petal color gradient with painted brush highlights on rim
    const colors = new Float32Array(pos.count * 3);
    for (let c = 0; c < pos.count; c++) {
      const py = pos.getY(c) + 0.21;
      const t = py / 0.42;
      // Inky dark near base, vibrant pure cobalt/scarlet in middle, luminous rim
      const rimHighlight = Math.pow(t, 2.5) * 0.28;
      const cMix = petalColor.clone().multiplyScalar(0.4 + t * 0.6).addScalar(rimHighlight);
      colors[c * 3] = cMix.r;
      colors[c * 3 + 1] = cMix.g;
      colors[c * 3 + 2] = cMix.b;
    }
    petalGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Position and orient petal around center
    petalGeo.rotateX(0.72); // cupped outward
    petalGeo.rotateY(angle);
    petalGeo.rotateX(headTiltX);
    petalGeo.rotateZ(headTiltZ);
    petalGeo.translate(
      headPos.x + Math.sin(angle) * 0.08,
      headPos.y + 0.02,
      headPos.z + Math.cos(angle) * 0.08
    );
    geometries.push(petalGeo);
  }

  // --- E. Layer 2: Inner Ruffled Petals (4 cupped petals) ---
  const innerPetalCount = 4;
  for (let i = 0; i < innerPetalCount; i++) {
    const angle = (i / innerPetalCount) * Math.PI * 2 + 0.4;
    const petalGeo = new THREE.PlaneGeometry(0.26, 0.35, 4, 4);
    const pos = petalGeo.attributes.position;

    for (let p = 0; p < pos.count; p++) {
      const px = pos.getX(p);
      const py = pos.getY(p) + 0.175;
      const t = py / 0.35;
      pos.setX(p, px * (1.0 + t * 0.7));
      pos.setZ(p, Math.pow(t, 2.0) * 0.14 - Math.abs(px) * 0.04);
    }
    petalGeo.computeVertexNormals();

    const colors = new Float32Array(pos.count * 3);
    for (let c = 0; c < pos.count; c++) {
      const py = pos.getY(c) + 0.175;
      const t = py / 0.35;
      const cMix = petalColor.clone().multiplyScalar(0.35 + t * 0.72);
      colors[c * 3] = cMix.r;
      colors[c * 3 + 1] = cMix.g;
      colors[c * 3 + 2] = cMix.b;
    }
    petalGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    petalGeo.rotateX(0.5); // tighter cup
    petalGeo.rotateY(angle);
    petalGeo.rotateX(headTiltX);
    petalGeo.rotateZ(headTiltZ);
    petalGeo.translate(
      headPos.x + Math.sin(angle) * 0.04,
      headPos.y + 0.03,
      headPos.z + Math.cos(angle) * 0.04
    );
    geometries.push(petalGeo);
  }

  // --- F. Dark Poppy Center Capsule Seed Dome ---
  const centerGeo = new THREE.CylinderGeometry(0.065, 0.045, 0.05, 8);
  centerGeo.rotateX(headTiltX);
  centerGeo.rotateZ(headTiltZ);
  centerGeo.translate(headPos.x, headPos.y + 0.04, headPos.z);
  applyVertexColor(centerGeo, darkCenterColor);
  geometries.push(centerGeo);

  // --- G. Radiant Stamen Starburst Crown (Golden ring + Cream/White anther dots) ---
  const stamenRingGeo = new THREE.TorusGeometry(0.075, 0.016, 4, 10);
  stamenRingGeo.rotateX(Math.PI * 0.5 + headTiltX);
  stamenRingGeo.rotateZ(headTiltZ);
  stamenRingGeo.translate(headPos.x, headPos.y + 0.045, headPos.z);
  applyVertexColor(stamenRingGeo, stamenStemColor);
  geometries.push(stamenRingGeo);

  // Outer radiant white stamen dot ring (signature white gouache starburst dots from painting)
  const stamenCount = 12;
  for (let s = 0; s < stamenCount; s++) {
    const sAngle = (s / stamenCount) * Math.PI * 2;
    const dotGeo = new THREE.BoxGeometry(0.018, 0.024, 0.018);
    const rad = 0.088;
    dotGeo.translate(Math.sin(sAngle) * rad, 0, Math.cos(sAngle) * rad);
    dotGeo.rotateX(headTiltX);
    dotGeo.rotateZ(headTiltZ);
    dotGeo.translate(headPos.x, headPos.y + 0.052, headPos.z);
    applyVertexColor(dotGeo, stamenTipColor);
    geometries.push(dotGeo);
  }

  return mergeBufferGeometries(geometries);
}

/**
 * 2. MAGNIFICENT WILD MEADOW ROSE GEOMETRY:
 * - Rich multi-tiered ruffled petals (14 overlapping ruffled rose petals)
 * - Thorny botanical stem with serrated pinnate rose foliage
 * - Raised golden-amber button floret center
 * - Rendered in velvet carmine crimson, madder rose, or coral blush
 */
export function createWildRoseGeometry(
  petalColorHex: string,
  centerColorHex: string = '#EAB308'
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  const petalColor = new THREE.Color(petalColorHex);
  const stemColor = new THREE.Color('#384D28');
  const leafColor = new THREE.Color('#223D26');
  const centerColor = new THREE.Color(centerColorHex);
  const coreDark = new THREE.Color('#3A0D10');

  // A. Curving Rose Stem with delicate thorns
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.02, 0.35, 0.02),
    new THREE.Vector3(0.03, 0.72, -0.01),
    new THREE.Vector3(0.0, 1.05, 0.0),
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 10, 0.018, 5, false);
  applyVertexColor(stemGeo, stemColor);
  geometries.push(stemGeo);

  // B. Serrated Rose Foliage (3-leaflet spray)
  for (let l = 0; l < 3; l++) {
    const leafletGeo = new THREE.PlaneGeometry(0.14, 0.26, 3, 3);
    const pos = leafletGeo.attributes.position;
    for (let p = 0; p < pos.count; p++) {
      const px = pos.getX(p);
      const py = pos.getY(p) + 0.13;
      const t = py / 0.26;
      pos.setX(p, px * (1.0 - Math.pow(t - 0.5, 2) * 2.2));
      pos.setZ(p, Math.sin(t * Math.PI) * 0.04);
    }
    leafletGeo.computeVertexNormals();
    applyVertexColor(leafletGeo, leafColor);

    const angle = (l - 1) * 0.55;
    leafletGeo.rotateZ(angle);
    leafletGeo.rotateX(0.6);
    leafletGeo.translate(Math.sin(angle) * 0.12, 0.52 + l * 0.05, 0.04);
    geometries.push(leafletGeo);
  }

  const headY = 1.05;

  // C. Outer Rose Petals (5 large undulating heart-scalloped petals)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const petalGeo = new THREE.PlaneGeometry(0.34, 0.38, 4, 4);
    const pos = petalGeo.attributes.position;
    for (let p = 0; p < pos.count; p++) {
      const px = pos.getX(p);
      const py = pos.getY(p) + 0.19;
      const t = py / 0.38;
      // Heart scallop top indent
      const heartDip = (1.0 - Math.abs(px) * 5.0) * (t > 0.8 ? 0.04 : 0);
      pos.setY(p, pos.getY(p) - heartDip);
      pos.setZ(p, Math.pow(t, 1.8) * 0.16 + Math.sin(px * 18.0) * 0.02);
    }
    petalGeo.computeVertexNormals();

    const colors = new Float32Array(pos.count * 3);
    for (let c = 0; c < pos.count; c++) {
      const t = (pos.getY(c) + 0.19) / 0.38;
      const cMix = petalColor.clone().multiplyScalar(0.45 + t * 0.65);
      colors[c * 3] = cMix.r;
      colors[c * 3 + 1] = cMix.g;
      colors[c * 3 + 2] = cMix.b;
    }
    petalGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    petalGeo.rotateX(0.78);
    petalGeo.rotateY(angle);
    petalGeo.translate(Math.sin(angle) * 0.09, headY + 0.02, Math.cos(angle) * 0.09);
    geometries.push(petalGeo);
  }

  // D. Middle Rose Petals (5 overlapping cupped petals)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.35;
    const petalGeo = new THREE.PlaneGeometry(0.28, 0.32, 3, 3);
    const pos = petalGeo.attributes.position;
    for (let p = 0; p < pos.count; p++) {
      const t = (pos.getY(p) + 0.16) / 0.32;
      pos.setZ(p, Math.pow(t, 2.0) * 0.14);
    }
    petalGeo.computeVertexNormals();
    applyVertexColor(petalGeo, petalColor.clone().multiplyScalar(0.85));

    petalGeo.rotateX(0.55);
    petalGeo.rotateY(angle);
    petalGeo.translate(Math.sin(angle) * 0.05, headY + 0.04, Math.cos(angle) * 0.05);
    geometries.push(petalGeo);
  }

  // E. Inner Rose Petal Core (4 tightly curled petals)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.7;
    const petalGeo = new THREE.PlaneGeometry(0.2, 0.24, 3, 3);
    petalGeo.rotateX(0.38);
    petalGeo.rotateY(angle);
    petalGeo.translate(Math.sin(angle) * 0.025, headY + 0.055, Math.cos(angle) * 0.025);
    applyVertexColor(petalGeo, petalColor.clone().multiplyScalar(0.72));
    geometries.push(petalGeo);
  }

  // F. Rose Center Button with Velvety Core
  const centerGeo = new THREE.CylinderGeometry(0.045, 0.03, 0.03, 8);
  centerGeo.translate(0, headY + 0.06, 0);
  applyVertexColor(centerGeo, coreDark);
  geometries.push(centerGeo);

  const ringGeo = new THREE.TorusGeometry(0.048, 0.014, 4, 8);
  ringGeo.rotateX(Math.PI * 0.5);
  ringGeo.translate(0, headY + 0.065, 0);
  applyVertexColor(ringGeo, centerColor);
  geometries.push(ringGeo);

  return mergeBufferGeometries(geometries);
}

/**
 * 3. RADIATING CORNFLOWER & STARBURST DAISY:
 * - Slender stem
 * - Radiating ray petals with notched serrated tips
 * - Central raised circular button floret with white/gold stamen ring
 */
export function createDaisyGeometry(
  petalColorHex: string,
  centerColorHex: string,
  petalCount = 14
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  const petalColor = new THREE.Color(petalColorHex);
  const centerColor = new THREE.Color(centerColorHex);
  const stemColor = new THREE.Color('#2F4828');

  // Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.015, 0.38, -0.01),
    new THREE.Vector3(0.0, 0.82, 0.0),
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 8, 0.013, 5, false);
  applyVertexColor(stemGeo, stemColor);
  geometries.push(stemGeo);

  // Radiating ray petals
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    // Tapered notched cone/blade
    const petalGeo = new THREE.ConeGeometry(0.045, 0.28, 4);
    petalGeo.rotateX(Math.PI * 0.5);
    petalGeo.rotateZ(angle);
    petalGeo.translate(Math.cos(angle) * 0.14, 0.82, Math.sin(angle) * 0.14);

    // Subtle petal color gradient
    const colors = new Float32Array(petalGeo.attributes.position.count * 3);
    for (let c = 0; c < petalGeo.attributes.position.count; c++) {
      const tipFactor = (i % 2 === 0) ? 1.0 : 0.88;
      const cMix = petalColor.clone().multiplyScalar(tipFactor);
      colors[c * 3] = cMix.r;
      colors[c * 3 + 1] = cMix.g;
      colors[c * 3 + 2] = cMix.b;
    }
    petalGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometries.push(petalGeo);
  }

  // Central disc floret
  const discGeo = new THREE.CylinderGeometry(0.055, 0.042, 0.035, 8);
  discGeo.translate(0, 0.835, 0);
  applyVertexColor(discGeo, centerColor);
  geometries.push(discGeo);

  // Starburst white stamen rim
  const stamenRing = new THREE.TorusGeometry(0.052, 0.012, 4, 8);
  stamenRing.rotateX(Math.PI * 0.5);
  stamenRing.translate(0, 0.84, 0);
  applyVertexColor(stamenRing, new THREE.Color('#FFFDF0'));
  geometries.push(stamenRing);

  return mergeBufferGeometries(geometries);
}

/**
 * 4. STYLIZED INDIGO & BLUE-GREY FOREGROUND FOLIAGE SPRAY:
 * Exactly matching the prominent pointed leaves in the bottom corners of reference-art.jpg.
 * Features broad lanceolate leaves with crisp pale painted central vein ridges.
 */
export function createBroadFoliageGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  const deepIndigo = new THREE.Color('#14284B');
  const paleVein = new THREE.Color('#94B2D8');

  const leafCount = 5;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 1.5 - 0.75;
    const leafGeo = new THREE.PlaneGeometry(0.24, 0.65, 3, 5);
    const pos = leafGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let p = 0; p < pos.count; p++) {
      const px = pos.getX(p);
      const py = pos.getY(p) + 0.325;
      const t = py / 0.65;

      // Lanceolate leaf curve
      const widthTaper = Math.sin(t * Math.PI);
      pos.setX(p, px * (0.4 + widthTaper * 0.8));

      // Leaf arching back and down under gravity
      pos.setZ(p, Math.pow(t, 2.0) * 0.22 - Math.abs(px) * 0.06);

      // Vein coloring: center ridge is pale painted blue/white, blade is deep indigo
      const isVein = Math.abs(px) < 0.03;
      const c = isVein ? paleVein : deepIndigo.clone().multiplyScalar(0.7 + t * 0.35);
      colors[p * 3] = c.r;
      colors[p * 3 + 1] = c.g;
      colors[p * 3 + 2] = c.b;
    }
    leafGeo.computeVertexNormals();
    leafGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    leafGeo.rotateX(0.7);
    leafGeo.rotateY(angle);
    leafGeo.translate(Math.sin(angle) * 0.08, 0.15, Math.cos(angle) * 0.08);
    geometries.push(leafGeo);
  }

  return mergeBufferGeometries(geometries);
}

/**
 * 5. TALL WILD GRASS BLADE GEOMETRY
 */
export function createGrassBladeGeometry(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(0.065, 0.95, 2, 4);
  const pos = geo.attributes.position;
  const grassBase = new THREE.Color('#223B1E');
  const grassTip = new THREE.Color('#7C9B58');

  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + 0.475;
    const t = y / 0.95;

    const x = pos.getX(i);
    pos.setX(i, x * (1.0 - t * 0.75));
    pos.setZ(i, Math.pow(t, 2) * 0.22);

    const c = grassBase.clone().lerp(grassTip, t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.translate(0, 0.475, 0);
  geo.computeVertexNormals();
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * 6. FALLEN PATH PETALS GEOMETRY
 */
export function createPathPetalGeometry(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(0.08, 0.12, 2, 2);
  geo.rotateX(-Math.PI * 0.5);
  applyVertexColor(geo, new THREE.Color('#2563EB'));
  return geo;
}

/**
 * Merges an array of BufferGeometries into a single BufferGeometry
 */
export function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalPositions = 0;
  let totalNormals = 0;
  let totalUvs = 0;
  let totalColors = 0;
  let totalIndices = 0;

  for (const g of geometries) {
    totalPositions += g.attributes.position.count * 3;
    totalNormals += (g.attributes.normal ? g.attributes.normal.count * 3 : 0);
    totalUvs += (g.attributes.uv ? g.attributes.uv.count * 2 : 0);
    totalColors += (g.attributes.color ? g.attributes.color.count * 3 : 0);
    totalIndices += (g.index ? g.index.count : 0);
  }

  const mergedPos = new Float32Array(totalPositions);
  const mergedNorm = new Float32Array(totalPositions);
  const mergedUv = new Float32Array(totalPositions / 3 * 2);
  const mergedColor = new Float32Array(totalPositions);
  const mergedIdx: number[] = [];

  let posOffset = 0;
  let uvOffset = 0;
  let colorOffset = 0;
  let vertOffset = 0;

  for (const g of geometries) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    const uv = g.attributes.uv;
    const color = g.attributes.color;
    const idx = g.index;
    const count = pos.count;

    mergedPos.set(pos.array, posOffset);

    if (norm) {
      mergedNorm.set(norm.array, posOffset);
    } else {
      for (let i = 0; i < count * 3; i += 3) {
        mergedNorm[posOffset + i + 1] = 1.0;
      }
    }

    if (uv) {
      mergedUv.set(uv.array, uvOffset);
    }

    if (color) {
      mergedColor.set(color.array, colorOffset);
    } else {
      for (let i = 0; i < count * 3; i++) {
        mergedColor[colorOffset + i] = 1.0;
      }
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        mergedIdx.push(idx.array[i] + vertOffset);
      }
    } else {
      for (let i = 0; i < count; i++) {
        mergedIdx.push(i + vertOffset);
      }
    }

    posOffset += count * 3;
    uvOffset += count * 2;
    colorOffset += count * 3;
    vertOffset += count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  if (totalUvs > 0) merged.setAttribute('uv', new THREE.BufferAttribute(mergedUv, 2));
  merged.setAttribute('color', new THREE.BufferAttribute(mergedColor, 3));
  if (mergedIdx.length > 0) merged.setIndex(mergedIdx);

  return merged;
}
