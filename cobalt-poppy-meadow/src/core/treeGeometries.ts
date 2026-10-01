import * as THREE from 'three';

/**
 * Creates an organic, hand-crafted painterly tree trunk with natural curves,
 * tapering, and graceful branching limbs matching the sentinel trees in the reference painting.
 */
export function createPainterlyTrunkGeometry(
  height: number,
  baseRadius: number,
  isLeftSentinel: boolean = false
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Pale birch / cream wood palette matching reference art
  const barkLight = new THREE.Color('#EFEBE0');
  const barkMid = new THREE.Color('#D8D2C2');
  const barkDark = new THREE.Color('#8C8472');

  // Helper to create a curving, tapered branch tube
  const createCurvedBranch = (
    curvePoints: THREE.Vector3[],
    radiusStart: number,
    radiusEnd: number,
    radialSegments = 8,
    tubularSegments = 16
  ) => {
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const branchGeo = new THREE.TubeGeometry(curve, tubularSegments, radiusStart, radialSegments, false);
    
    // Taper radius along length
    const pos = branchGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = (i / radialSegments) / tubularSegments;
      const t = Math.min(1.0, Math.max(0.0, u));
      // Interpolate radius taper
      const currentRadius = THREE.MathUtils.lerp(radiusStart, radiusEnd, t);
      const scaleFactor = currentRadius / radiusStart;
      
      // Get point on curve
      const pt = curve.getPoint(t);
      const px = pos.getX(i);
      const py = pos.getY(i);
      const pz = pos.getZ(i);
      
      pos.setXYZ(
        i,
        pt.x + (px - pt.x) * scaleFactor,
        pt.y + (py - pt.y) * scaleFactor,
        pt.z + (pz - pt.z) * scaleFactor
      );
    }
    branchGeo.computeVertexNormals();

    // Painterly bark vertex coloring: subtle rings and wood tone variations
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const ringNoise = Math.sin(y * 4.5) * 0.5 + 0.5;
      const c = barkLight.clone().lerp(barkMid, ringNoise * 0.6);
      if (Math.sin(y * 12.0) > 0.7) {
        c.lerp(barkDark, 0.4); // Birch bark knot/ring streak
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    branchGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return branchGeo;
  };

  // 1. Main Trunk
  const mainCurvePoints = isLeftSentinel
    ? [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.15, height * 0.25, 0.05),
        new THREE.Vector3(-0.05, height * 0.55, -0.05),
        new THREE.Vector3(0.2, height * 0.85, 0.1),
        new THREE.Vector3(0.15, height * 1.05, 0.0),
      ]
    : [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.1, height * 0.28, -0.05),
        new THREE.Vector3(-0.08, height * 0.58, 0.08),
        new THREE.Vector3(0.05, height * 0.88, -0.05),
        new THREE.Vector3(0.0, height * 1.08, 0.0),
      ];

  geometries.push(createCurvedBranch(mainCurvePoints, baseRadius, baseRadius * 0.35, 8, 20));

  // 2. Graceful Primary & Secondary Branching Limbs (reaching out into the foliage)
  if (isLeftSentinel) {
    // Left sentinel signature reaching limb (reaching toward the path)
    const branch1 = [
      new THREE.Vector3(-0.08, height * 0.48, 0.0),
      new THREE.Vector3(-0.6, height * 0.62, 0.25),
      new THREE.Vector3(-1.25, height * 0.82, 0.35),
      new THREE.Vector3(-1.6, height * 1.05, 0.4),
    ];
    geometries.push(createCurvedBranch(branch1, baseRadius * 0.52, baseRadius * 0.2, 6, 12));

    // Right-reaching branch
    const branch2 = [
      new THREE.Vector3(0.05, height * 0.65, 0.02),
      new THREE.Vector3(0.55, height * 0.78, -0.2),
      new THREE.Vector3(1.1, height * 0.98, -0.25),
    ];
    geometries.push(createCurvedBranch(branch2, baseRadius * 0.42, baseRadius * 0.18, 6, 10));

    // Back upper branch
    const branch3 = [
      new THREE.Vector3(0.1, height * 0.78, 0.05),
      new THREE.Vector3(0.2, height * 0.95, -0.5),
      new THREE.Vector3(0.35, height * 1.15, -0.7),
    ];
    geometries.push(createCurvedBranch(branch3, baseRadius * 0.35, baseRadius * 0.15, 6, 8));
  } else {
    // Right sentinel upright branching
    const branch1 = [
      new THREE.Vector3(0.02, height * 0.52, -0.02),
      new THREE.Vector3(0.5, height * 0.68, 0.2),
      new THREE.Vector3(0.9, height * 0.92, 0.3),
    ];
    geometries.push(createCurvedBranch(branch1, baseRadius * 0.48, baseRadius * 0.2, 6, 10));

    const branch2 = [
      new THREE.Vector3(-0.05, height * 0.62, 0.05),
      new THREE.Vector3(-0.45, height * 0.76, -0.2),
      new THREE.Vector3(-0.85, height * 0.98, -0.3),
    ];
    geometries.push(createCurvedBranch(branch2, baseRadius * 0.42, baseRadius * 0.18, 6, 10));

    const branch3 = [
      new THREE.Vector3(0.0, height * 0.82, 0.0),
      new THREE.Vector3(-0.2, height * 1.05, 0.3),
    ];
    geometries.push(createCurvedBranch(branch3, baseRadius * 0.32, baseRadius * 0.14, 6, 8));
  }

  // Merge into single buffer geometry
  return mergeBufferGeometriesDirect(geometries);
}

/**
 * Creates an organic, painterly scalloped foliage cluster.
 * Rather than a generic low-poly geometric shape, this generates
 * multi-lobed puff volumes with surface displacement, organic negative spaces,
 * and ruffled perimeter silhouettes that catch light like hand-painted gouache brush dabs!
 */
export function createPainterlyCanopyPuffGeometry(radius: number, seed: number = 0): THREE.BufferGeometry {
  // Use icosahedron with subdivision for smooth organic displacement
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geo.attributes.position;

  // Organic gouache puff displacement
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Multi-frequency organic puff lobes
    const len = Math.hypot(x, y, z);
    const dirX = x / len;
    const dirY = y / len;
    const dirZ = z / len;

    // Organic harmonic wave lobing (creates the scalloped gouache leaf clusters)
    const lobe1 = Math.sin(dirX * 3.5 + seed) * Math.cos(dirY * 3.5) * 0.22;
    const lobe2 = Math.sin(dirZ * 4.8 + seed * 1.7) * 0.15;
    const lobe3 = Math.cos(dirX * 6.0 + dirZ * 6.0) * 0.08;

    // Flatten slightly on bottom like real foliage clumps hanging under gravity
    const gravityFlatten = dirY < -0.2 ? (dirY + 0.2) * 0.15 : 0;

    const displacement = 1.0 + lobe1 + lobe2 + lobe3 - gravityFlatten;

    pos.setXYZ(i, x * displacement, y * displacement, z * displacement);
  }

  geo.computeVertexNormals();

  // Add painterly vertex color tonal variations (deeper indigo near base, brighter azure on outer tips)
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const heightFactor = (y + radius) / (radius * 2);
    // Tip brightness factor
    const tipFactor = THREE.MathUtils.clamp(heightFactor * 0.8 + 0.2, 0.3, 1.0);
    colors[i * 3] = tipFactor;
    colors[i * 3 + 1] = tipFactor;
    colors[i * 3 + 2] = tipFactor;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return geo;
}

/**
 * Direct merger of buffer geometries with position, normal, uv, and color
 */
export function mergeBufferGeometriesDirect(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
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
