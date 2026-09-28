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
 * Builds a smooth, catenary-curved East Asian sweeping tiled gable roof with upturned eaves.
 * Eliminates harsh flat cube planes — smooth vertex normals and organic curvature from both road and sky views.
 */
export function createSweepingGableRoofGeometry(
  width: number,
  depth: number,
  ridgeHeight: number,
  curveSag = 0.22,
  cornerLift = 0.24,
  segsX = 20,
  segsZ = 22
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, 0.16, depth, segsX, 2, segsZ);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const halfW = width * 0.5;
  const halfD = depth * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Normalized coordinates: u along width (-1..1), v along depth/slope (-1..1)
    const u = THREE.MathUtils.clamp(x / halfW, -1, 1);
    const v = THREE.MathUtils.clamp(z / halfD, -1, 1);
    const absU = Math.abs(u);
    const absV = Math.abs(v);
    const oneMinusAbsV = Math.max(0, 1 - absV);

    // Parabolic / catenary concave slope from central ridge (v=0) down to eaves (absV=1)
    const slopeProfile = Math.pow(oneMinusAbsV, 1.38) * ridgeHeight;
    // Subtle saddle sag along the ridge with upturned gable ends
    const ridgeFlare = Math.pow(absU, 2.4) * cornerLift * 0.65;
    // Upturned flying corner eaves at (|u|->1, |v|->1)
    const eaveLift = Math.pow(absU, 2.2) * Math.pow(absV, 1.8) * cornerLift;
    // Gentle organic brush ripple along the front/back drip edge
    const scallopWave =
      absV > 0.84 ? Math.sin(u * Math.PI * 11) * 0.024 * ((absV - 0.84) / 0.16) : 0;

    const curvedY =
      y + slopeProfile + ridgeFlare + eaveLift - curveSag * absV * oneMinusAbsV + scallopWave;
    // Slight outward flare at the eaves
    const flaredZ = z * (1 + Math.pow(absV, 2.0) * 0.045);

    pos.setXYZ(i, x, curvedY, flaredZ);
    uv.setXY(i, (u * 0.5 + 0.5) * (width / 2.2), absV * (depth / 1.9));
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a triangular/curved gable tympanum wall infill whose base sits at y=0 and tapers smoothly
 * underneath the sweeping gable roof so it never pokes above the roof tiles.
 */
export function createCurvedGableWallInfillGeometry(
  wallWidth: number,
  depthSpan: number,
  ridgeHeight: number,
  curveSag = 0.22
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(wallWidth, ridgeHeight, depthSpan, 2, 8, 16);
  const pos = geo.attributes.position;
  const halfD = depthSpan * 0.5;
  const halfH = ridgeHeight * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Normalize height t in [0..1] from bottom of box
    const t = THREE.MathUtils.clamp((y + halfH) / ridgeHeight, 0, 1);
    const absV = THREE.MathUtils.clamp(Math.abs(z / halfD), 0, 1);
    const oneMinusAbsV = Math.max(0, 1 - absV);
    const roofEnvelopeH =
      Math.max(0, Math.pow(oneMinusAbsV, 1.42) * (ridgeHeight - 0.12) - curveSag * absV * oneMinusAbsV);

    const clampedY = t * roofEnvelopeH;
    pos.setXYZ(i, x, clampedY, z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a smooth, curvy, gnarled tree trunk or branch along a 3D Catmull-Rom spline with continuous radius tapering.
 * Uses an explicit, NaN-free orthonormal frame at every sample along the spline.
 */
export function createSplineTrunkGeometry(
  points: THREE.Vector3[],
  baseRadius: number,
  topRadius: number,
  tubularSegments = 22,
  radialSegments = 12
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
    if (T.lengthSq() < 0.0001) {
      T.set(0, 1, 0);
    } else {
      T.normalize();
    }

    const refAxis = Math.abs(T.z) < 0.88 ? refZ : refX;
    N.crossVectors(T, refAxis).normalize();
    B.crossVectors(T, N).normalize();

    // Smooth root flare at bottom (u < 0.18) and natural taper toward top
    const rootFlare = u < 0.18 ? Math.pow(1 - u / 0.18, 2) * baseRadius * 0.42 : 0;
    const rBase = THREE.MathUtils.lerp(baseRadius, topRadius, Math.pow(u, 0.85)) + rootFlare;

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      // Organic gnarled bark fluting
      const barkFlute = 1 + Math.sin(v * 3 + u * 8) * 0.07 + Math.cos(v * 5 - u * 6) * 0.035;
      const r = rBase * barkFlute;

      const sin = Math.sin(v);
      const cos = -Math.cos(v);

      normal.x = cos * N.x + sin * B.x;
      normal.y = cos * N.y + sin * B.y;
      normal.z = cos * N.z + sin * B.z;
      normal.normalize();

      positions[vIdx * 3] = P.x + r * normal.x;
      positions[vIdx * 3 + 1] = P.y + r * normal.y;
      positions[vIdx * 3 + 2] = P.z + r * normal.z;

      normals[vIdx * 3] = normal.x;
      normals[vIdx * 3 + 1] = normal.y;
      normals[vIdx * 3 + 2] = normal.z;

      uvs[vIdx * 2] = j / radialSegments;
      uvs[vIdx * 2 + 1] = u * 3;
      vIdx++;
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * Builds an ultra-smooth, indexed, organically sculpted watercolor brush-cloud / foliage puff.
 * Uses an indexed SphereGeometry with shared vertices and smooth radial-blended normals so there
 * are ZERO flat polygon facets.
 */
export function createBrushCloudFoliageGeometry(
  rx: number,
  ry: number,
  rz: number,
  seed: number,
  detail = 2
): THREE.BufferGeometry {
  const widthSegs = detail >= 2 ? 26 : 18;
  const heightSegs = detail >= 2 ? 18 : 14;
  const geo = new THREE.SphereGeometry(1, widthSegs, heightSegs);
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;

  const p1 = pseudoRandom(seed * 3 + 1) * Math.PI * 2;
  const p2 = pseudoRandom(seed * 3 + 2) * Math.PI * 2;
  const p3 = pseudoRandom(seed * 3 + 3) * Math.PI * 2;
  const nVec = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);

    // Soft billowy brush-stroke lobes
    const lobe =
      1.0 +
      0.14 * Math.sin(vx * 2.8 + p1) * Math.cos(vz * 2.6 + p2) +
      0.09 * Math.sin(vy * 3.4 + p3) +
      0.06 * Math.cos((vx + vz) * 4.2 + p1);

    // Gently cushion the bottom of the brush stroke
    const bottomCushion = vy < -0.25 ? 0.82 : 1.0;

    const px = vx * rx * lobe;
    const py = vy * ry * lobe * bottomCushion;
    const pz = vz * rz * lobe;
    pos.setXYZ(i, px, py, pz);

    // Smooth painterly normal (ellipsoid gradient normal) for silky shading without hard creases
    nVec.set(vx / Math.max(0.05, rx), vy / Math.max(0.05, ry), vz / Math.max(0.05, rz)).normalize();
    norm.setXYZ(i, nVec.x, nVec.y, nVec.z);
  }

  return geo;
}

/**
 * Builds an ultra-smooth, rounded river boulder or hillside mound geometry using indexed SphereGeometry.
 * Zero flat facets — looks painted with a soft sumi-e & watercolor wash brush.
 */
export function createSculptedBoulderGeometry(
  rx: number,
  ry: number,
  rz: number,
  seed: number
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 24, 16);
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;

  const s1 = pseudoRandom(seed * 7 + 1) * 6.28;
  const s2 = pseudoRandom(seed * 7 + 2) * 6.28;
  const nVec = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);

    const n =
      1.0 +
      0.12 * Math.sin(vx * 2.4 + s1) * Math.cos(vz * 2.2 + s2) +
      0.07 * Math.cos(vy * 3.0 + s1);

    // Flatten bottom where boulder nestles into the sandy soil
    const flatBottom = vy < -0.15 ? 0.55 : 1.0;
    pos.setXYZ(i, vx * rx * n, vy * ry * n * flatBottom, vz * rz * n);

    nVec.set(vx / Math.max(0.05, rx), vy / Math.max(0.05, ry), vz / Math.max(0.05, rz)).normalize();
    norm.setXYZ(i, nVec.x, nVec.y, nVec.z);
  }

  return geo;
}
