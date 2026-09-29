import * as THREE from 'three';

export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Merges an array of BufferGeometries into a single draw-call BufferGeometry and disposes intermediates.
 */
export function mergeBufferGeometries(
  geometries: THREE.BufferGeometry[]
): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();

  let totalVerts = 0;
  let totalIndices = 0;
  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let idxOffset = 0;

  for (let i = 0; i < geometries.length; i++) {
    const g = geometries[i];
    const posAttr = g.attributes.position;
    const normAttr = g.attributes.normal;
    const uvAttr = g.attributes.uv;
    const count = posAttr.count;

    positions.set(posAttr.array as Float32Array, vertOffset * 3);
    if (normAttr) {
      normals.set(normAttr.array as Float32Array, vertOffset * 3);
    }
    if (uvAttr) {
      uvs.set(uvAttr.array as Float32Array, vertOffset * 2);
    }

    if (g.index) {
      const idxArr = g.index.array;
      for (let j = 0; j < idxArr.length; j++) {
        indices[idxOffset + j] = idxArr[j] + vertOffset;
      }
      idxOffset += idxArr.length;
    } else {
      for (let j = 0; j < count; j++) {
        indices[idxOffset + j] = vertOffset + j;
      }
      idxOffset += count;
    }

    vertOffset += count;
    g.dispose();
  }

  for (let i = 0; i < positions.length; i++) {
    if (!Number.isFinite(positions[i])) positions[i] = 0;
  }
  for (let i = 0; i < normals.length; i++) {
    if (!Number.isFinite(normals[i])) normals[i] = i % 3 === 1 ? 1 : 0;
  }
  for (let i = 0; i < uvs.length; i++) {
    if (!Number.isFinite(uvs[i])) uvs[i] = 0;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingSphere();
  return merged;
}

const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _euler = new THREE.Euler();

export function pushTransformedGeo(
  bucket: THREE.BufferGeometry[],
  baseGeo: THREE.BufferGeometry,
  parentMat: THREE.Matrix4,
  px = 0,
  py = 0,
  pz = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1
): void {
  _pos.set(px, py, pz);
  _euler.set(rx, ry, rz, 'XYZ');
  _quat.setFromEuler(_euler);
  _scale.set(sx, sy, sz);
  _mat.compose(_pos, _quat, _scale);
  _mat.premultiply(parentMat);
  const clone = baseGeo.clone();
  clone.applyMatrix4(_mat);
  bucket.push(clone);
}

/**
 * Pushes both a box geometry to `colorBucket` and a uniformly inflated inverted-hull box to `outlineBucket`
 * so even thin planks, fence rails, and struts have crisp, uniform hand-drawn ink outlines.
 */
export function pushBoxWithInkOutline(
  colorBucket: THREE.BufferGeometry[],
  outlineBucket: THREE.BufferGeometry[],
  boxUnit: THREE.BufferGeometry,
  parentMat: THREE.Matrix4,
  px: number,
  py: number,
  pz: number,
  rx: number,
  ry: number,
  rz: number,
  sx: number,
  sy: number,
  sz: number,
  outlineThickness = 0.035
): void {
  pushTransformedGeo(colorBucket, boxUnit, parentMat, px, py, pz, rx, ry, rz, sx, sy, sz);
  const t2 = outlineThickness * 2.0;
  pushTransformedGeo(
    outlineBucket,
    boxUnit,
    parentMat,
    px,
    py,
    pz,
    rx,
    ry,
    rz,
    sx + t2,
    sy + t2,
    sz + t2
  );
}

/**
 * Creates a smooth averaged-normal inverted-hull geometry for hand-drawn ink outlines
 * on curved/organic meshes (tree canopies, pitched roofs, biplane wings, boulders).
 */
export function createInkOutlineGeometry(
  baseGeo: THREE.BufferGeometry,
  outlineThickness = 0.038
): THREE.BufferGeometry {
  const clone = baseGeo.clone();
  const pos = clone.attributes.position;
  const count = pos.count;

  // Compute welded average normals per unique vertex position so sharp edges don't split open
  const normalMap = new Map<string, THREE.Vector3>();
  const tempV = new THREE.Vector3();
  const tempN = new THREE.Vector3();
  const normAttr = clone.attributes.normal;

  for (let i = 0; i < count; i++) {
    tempV.fromBufferAttribute(pos, i);
    const key = `${Math.round(tempV.x * 200)},${Math.round(tempV.y * 200)},${Math.round(tempV.z * 200)}`;
    if (normAttr) {
      tempN.fromBufferAttribute(normAttr, i);
    } else {
      tempN.copy(tempV).normalize();
    }
    let acc = normalMap.get(key);
    if (!acc) {
      acc = new THREE.Vector3();
      normalMap.set(key, acc);
    }
    acc.add(tempN);
  }

  normalMap.forEach((v) => {
    if (v.lengthSq() > 1e-6) v.normalize();
    else v.set(0, 1, 0);
  });

  for (let i = 0; i < count; i++) {
    tempV.fromBufferAttribute(pos, i);
    const key = `${Math.round(tempV.x * 200)},${Math.round(tempV.y * 200)},${Math.round(tempV.z * 200)}`;
    const avgN = normalMap.get(key)!;
    // Slight organic hand-drawn brush pressure variation
    const wobble = 0.9 + 0.22 * Math.sin(tempV.x * 5.2 + tempV.y * 4.7 + tempV.z * 5.9);
    const disp = outlineThickness * wobble;
    pos.setXYZ(
      i,
      tempV.x + avgN.x * disp,
      tempV.y + avgN.y * disp,
      tempV.z + avgN.z * disp
    );
  }

  return clone;
}

/**
 * Builds a rustic hand-drawn pitched cottage gable roof matching Reference Image 2.
 * Includes a subtle hand-drawn ridge sag and clean shingle UVs.
 */
export function createPitchedCottageRoofGeometry(
  width: number,
  depth: number,
  ridgeHeight: number,
  thickness = 0.16,
  segsX = 14,
  segsZ = 16
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, thickness, depth, segsX, 2, segsZ);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const halfW = width * 0.5;
  const halfD = depth * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const u = THREE.MathUtils.clamp(x / halfW, -1, 1);
    const v = THREE.MathUtils.clamp(z / halfD, -1, 1);
    const absV = Math.abs(v);
    const oneMinusAbsV = Math.max(0, 1 - absV);

    // Classic pastoral straight-with-gentle-hand-drawn-softness gable pitch
    const slopeProfile = Math.pow(oneMinusAbsV, 1.06) * ridgeHeight;
    // Very slight organic hand-drawn wave along the ridge & eaves
    const handWave = Math.sin(u * Math.PI * 2.5) * 0.018;

    const finalY = y + slopeProfile + handWave;
    pos.setXYZ(i, x, finalY, z);
    uv.setXY(i, (u * 0.5 + 0.5) * (width / 2.4), absV * (depth / 2.2));
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a triangular gable wall tympanum infill that sits cleanly under `createPitchedCottageRoofGeometry`.
 */
export function createGableWallInfillGeometry(
  wallWidth: number,
  depthSpan: number,
  ridgeHeight: number
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(wallWidth, ridgeHeight, depthSpan, 2, 6, 14);
  const pos = geo.attributes.position;
  const halfD = depthSpan * 0.5;
  const halfH = ridgeHeight * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const t = THREE.MathUtils.clamp((y + halfH) / ridgeHeight, 0, 1);
    const absV = THREE.MathUtils.clamp(Math.abs(z / halfD), 0, 1);
    const oneMinusAbsV = Math.max(0, 1 - absV);
    const roofEnvelopeH = Math.max(0, Math.pow(oneMinusAbsV, 1.06) * (ridgeHeight - 0.08));

    pos.setXYZ(i, x, t * roofEnvelopeH, z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a billowing, multi-lobed Studio Ghibli / hand-drawn tree canopy puff geometry.
 */
export function createBillowingTreeCanopyGeometry(
  rx: number,
  ry: number,
  rz: number,
  seed: number,
  detail = 2
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();

  const p1 = pseudoRandom(seed + 1) * Math.PI * 2;
  const p2 = pseudoRandom(seed + 2) * Math.PI * 2;
  const p3 = pseudoRandom(seed + 3) * Math.PI * 2;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    const lobe1 = Math.sin(v.x * 3.4 + p1) * Math.cos(v.z * 3.4 + p2) * 0.14;
    const lobe2 = Math.sin(v.y * 4.1 + p3) * 0.09;
    const billow = Math.cos((v.x + v.z) * 2.8 + p1) * 0.08;

    // Flatten bottom slightly like classic Ghibli cloud-like tree crowns
    const bottomFlatten = v.y < -0.25 ? 1.0 + (v.y + 0.25) * 0.28 : 1.0;
    const disp = 1.0 + lobe1 + lobe2 + billow;

    const nx = v.x * rx * disp;
    const ny = v.y * ry * disp * bottomFlatten;
    const nz = v.z * rz * disp;

    pos.setXYZ(i, nx, ny, nz);
    if (uv) {
      uv.setXY(
        i,
        Math.atan2(v.z, v.x) / (Math.PI * 2) + 0.5,
        v.y * 0.5 + 0.5
      );
    }
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a smooth gnarled tree trunk or branch along a 3D Catmull-Rom spline.
 */
export function createSplineTrunkGeometry(
  points: THREE.Vector3[],
  baseRadius: number,
  topRadius: number,
  tubularSegments = 16,
  radialSegments = 10
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);

  const vertCount = (tubularSegments + 1) * (radialSegments + 1);
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const indices: number[] = [];

  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const refZ = new THREE.Vector3(0, 0, 1);
  const refX = new THREE.Vector3(1, 0, 0);

  let vIdx = 0;
  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    curve.getPointAt(u, P);
    curve.getTangentAt(u, T);
    if (T.lengthSq() < 0.0001) T.set(0, 1, 0);
    else T.normalize();

    const refAxis = Math.abs(T.z) < 0.88 ? refZ : refX;
    N.crossVectors(T, refAxis).normalize();
    B.crossVectors(T, N).normalize();

    const rootFlare = u < 0.18 ? Math.pow(1 - u / 0.18, 2) * baseRadius * 0.38 : 0;
    const rBase = THREE.MathUtils.lerp(baseRadius, topRadius, Math.pow(u, 0.85)) + rootFlare;

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);
      const flute = 1.0 + Math.sin(v * 4 + u * 5) * 0.05;
      const r = rBase * flute;

      normal.set(
        N.x * cosV + B.x * sinV,
        N.y * cosV + B.y * sinV,
        N.z * cosV + B.z * sinV
      ).normalize();

      positions[vIdx * 3] = P.x + normal.x * r;
      positions[vIdx * 3 + 1] = P.y + normal.y * r;
      positions[vIdx * 3 + 2] = P.z + normal.z * r;

      normals[vIdx * 3] = normal.x;
      normals[vIdx * 3 + 1] = normal.y;
      normals[vIdx * 3 + 2] = normal.z;

      uvs[vIdx * 2] = j / radialSegments;
      uvs[vIdx * 2 + 1] = u * 2.5;
      vIdx++;
    }
  }

  const ringStride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * ringStride + j;
      const b = (i + 1) * ringStride + j;
      const c = (i + 1) * ringStride + (j + 1);
      const d = i * ringStride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an authentic cambered vintage biplane wing geometry with rounded wingtips
 * and subtle fabric rib undulations matching Reference Image 1.
 */
export function createAirfoilWingGeometry(
  span: number,
  chord: number,
  thickness: number,
  segsX = 32,
  segsZ = 14
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(span, thickness, chord, segsX, 2, segsZ);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const halfSpan = span * 0.5;
  const halfChord = chord * 0.5;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // u in [-1..1] along wingspan, v in [-1..1] from leading edge (-z) to trailing edge (+z)
    const u = THREE.MathUtils.clamp(x / halfSpan, -1, 1);
    const absU = Math.abs(u);
    const v = THREE.MathUtils.clamp(z / halfChord, -1, 1);

    // Elliptical rounded wingtip planform near |u| > 0.80
    const tipT = THREE.MathUtils.smoothstep(absU, 0.78, 1.0);
    const chordScale = Math.sqrt(Math.max(0.06, 1.0 - tipT * tipT * 0.92));
    z *= chordScale;

    // Airfoil camber: thicker near leading edge (v ~ -0.35), tapering thin at trailing edge (v -> 1)
    const chordNorm = (v + 1) * 0.5; // 0 at leading edge, 1 at trailing edge
    const airfoilEnvelope = Math.sin(Math.pow(1.0 - chordNorm, 0.68) * Math.PI);
    const camberLift = Math.sin(chordNorm * Math.PI) * thickness * 0.28;

    // Subtle fabric rib scallops along the upper surface
    const ribRipple = y > 0 ? Math.abs(Math.sin(u * Math.PI * 12)) * 0.012 * (1 - tipT) : 0;

    // Gentle dihedral upward tilt toward wingtips
    const dihedral = absU * 0.055;

    y = y * (0.35 + 0.75 * airfoilEnvelope) * (1 - tipT * 0.55) + camberLift + ribRipple + dihedral;

    pos.setXYZ(i, x, y, z);
    uv.setXY(i, u * 0.5 + 0.5, chordNorm);
  }

  geo.computeVertexNormals();
  return geo;
}
