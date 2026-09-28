import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createCobaltStepTextures,
  createMedinaWallTextures,
  createZellijTileTexture,
} from '../../utils/textures';
import {
  INITIAL_SKY_STARS,
  getRoadCenterX,
  getRoadElevationY,
  getRoadHalfWidth,
  getRoadYaw,
} from '../../utils/roadPath';
import type { TimeOfDay } from '../../hooks/useSceneState';

interface BlueMedinaRoadProps {
  timeOfDay: TimeOfDay;
  collectedStars: number[];
  flyMarker: [number, number, number] | null;
  onRoadClick: (point: THREE.Vector3) => void;
  onSelectZone: (zoneId: string) => void;
  onHover: (label: string | null) => void;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 17.31 + 53.7) * 43758.5453;
  return x - Math.floor(x);
};

function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
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

function pushTransformedGeo(
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
) {
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

export default function BlueMedinaRoad({
  timeOfDay,
  collectedStars,
  flyMarker,
  onRoadClick,
  onSelectZone,
  onHover,
}: BlueMedinaRoadProps) {
  const stepTex = useMemo(() => createCobaltStepTextures(), []);
  const wallBlueLowerTex = useMemo(() => createMedinaWallTextures('blue-lower'), []);
  const wallWhiteTex = useMemo(() => createMedinaWallTextures('white-plaster'), []);
  const wallDeepBlueTex = useMemo(() => createMedinaWallTextures('deep-cobalt'), []);
  const zellijTex = useMemo(() => createZellijTileTexture(), []);

  const fountainOrbRef = useRef<THREE.Group>(null);
  const summitCrystalRef = useRef<THREE.Group>(null);
  const skyStarsGroupRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);

  // 4-pointed star geometry for collectible Sky Stars (✧)
  const starGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = 0.22;
    const inner = 0.055;
    shape.moveTo(0, outer);
    shape.quadraticCurveTo(inner, inner, outer, 0);
    shape.quadraticCurveTo(inner, -inner, 0, -outer);
    shape.quadraticCurveTo(-inner, -inner, -outer, 0);
    shape.quadraticCurveTo(-inner, inner, 0, outer);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
    geo.center();
    return geo;
  }, []);

  // Shared Memoized Materials for Batched Medina Architecture
  const isNightOrSunset = timeOfDay !== 'noon';
  const lanternGlowColor = timeOfDay === 'starlight' ? '#ffcf70' : '#ffdf9e';
  const lanternEmissiveIntensity =
    timeOfDay === 'starlight' ? 2.4 : timeOfDay === 'sunset' ? 1.4 : 0.35;

  const materials = useMemo(
    () => ({
      stepCobaltA: new THREE.MeshStandardMaterial({
        color: '#2776e6',
        map: stepTex.map,
        bumpMap: stepTex.bumpMap,
        bumpScale: 0.022,
        roughness: 0.74,
      }),
      stepCobaltB: new THREE.MeshStandardMaterial({
        color: '#1d62cc',
        map: stepTex.map,
        bumpMap: stepTex.bumpMap,
        bumpScale: 0.022,
        roughness: 0.76,
      }),
      whiteDrip: new THREE.MeshStandardMaterial({
        color: '#f5f9ff',
        roughness: 0.68,
      }),
      wallBlueLower: new THREE.MeshStandardMaterial({
        map: wallBlueLowerTex.map,
        bumpMap: wallBlueLowerTex.bumpMap,
        bumpScale: 0.022,
        roughness: 0.84,
      }),
      wallWhite: new THREE.MeshStandardMaterial({
        map: wallWhiteTex.map,
        bumpMap: wallWhiteTex.bumpMap,
        bumpScale: 0.02,
        roughness: 0.85,
      }),
      wallDeepBlue: new THREE.MeshStandardMaterial({
        map: wallDeepBlueTex.map,
        bumpMap: wallDeepBlueTex.bumpMap,
        bumpScale: 0.02,
        roughness: 0.8,
      }),
      zellij: new THREE.MeshStandardMaterial({
        map: zellijTex,
        roughness: 0.62,
      }),
      terracottaTile: new THREE.MeshStandardMaterial({
        color: '#c66038',
        roughness: 0.78,
      }),
      cedarWood: new THREE.MeshStandardMaterial({
        color: '#c8733b',
        roughness: 0.78,
      }),
      darkTimber: new THREE.MeshStandardMaterial({
        color: '#3b2618',
        roughness: 0.8,
      }),
      cobaltTrim: new THREE.MeshStandardMaterial({
        color: '#1854b8',
        roughness: 0.7,
      }),
      wroughtIron: new THREE.MeshStandardMaterial({
        color: '#1e2430',
        roughness: 0.58,
      }),
      vineGreenDark: new THREE.MeshStandardMaterial({
        color: '#3b6e32',
        roughness: 0.74,
      }),
      vineGreenLight: new THREE.MeshStandardMaterial({
        color: '#568e44',
        roughness: 0.74,
      }),
      goldBrass: new THREE.MeshStandardMaterial({
        color: '#f2b63d',
        metalness: 0.7,
        roughness: 0.25,
      }),
      turquoiseWater: new THREE.MeshStandardMaterial({
        color: '#26c6ec',
        emissive: '#1496c4',
        emissiveIntensity: 0.48,
        roughness: 0.18,
        metalness: 0.15,
      }),
      starGold: new THREE.MeshStandardMaterial({
        color: '#fff5c0',
        emissive: '#ffbf38',
        emissiveIntensity: 1.15,
        roughness: 0.2,
      }),
      starRing: new THREE.MeshBasicMaterial({
        color: '#9ae8ff',
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      }),
    }),
    [stepTex, wallBlueLowerTex, wallWhiteTex, wallDeepBlueTex, zellijTex]
  );

  // Pre-build & merge ALL static Medina steps, walls, buildings, arches & landmarks into batched BufferGeometries!
  const batchedMeshes = useMemo(() => {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const planeTop = new THREE.PlaneGeometry(1, 1);
    planeTop.rotateX(-Math.PI / 2);
    const planeFront = new THREE.PlaneGeometry(1, 1);
    const cyl16 = new THREE.CylinderGeometry(1, 1, 1, 16);
    const cyl8 = new THREE.CylinderGeometry(1, 1, 1, 8);
    const cyl6 = new THREE.CylinderGeometry(1, 1, 1, 6);
    const cone6 = new THREE.ConeGeometry(1, 1, 6);
    const cone4 = new THREE.ConeGeometry(1, 1, 4);
    const octGeo = new THREE.OctahedronGeometry(1, 0);
    const dodecaGeo = new THREE.DodecahedronGeometry(1, 0);
    const sphereDome = new THREE.SphereGeometry(
      2.05,
      28,
      20,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.52
    );
    const sphereFinial = new THREE.SphereGeometry(1, 14, 14);
    const circleWater = new THREE.CircleGeometry(1.18, 24);
    circleWater.rotateX(-Math.PI / 2);
    const ringTerrace = new THREE.RingGeometry(3.85, 4.35, 32);
    ringTerrace.rotateX(-Math.PI / 2);
    const doorArchCyl = new THREE.CylinderGeometry(0.46, 0.46, 0.09, 16);
    doorArchCyl.rotateZ(Math.PI / 2);

    const stepBucketA: THREE.BufferGeometry[] = [];
    const stepBucketB: THREE.BufferGeometry[] = [];
    const whiteDripBucket: THREE.BufferGeometry[] = [];
    const wallBlueLowerBucket: THREE.BufferGeometry[] = [];
    const wallWhiteBucket: THREE.BufferGeometry[] = [];
    const wallDeepBlueBucket: THREE.BufferGeometry[] = [];
    const zellijBucket: THREE.BufferGeometry[] = [];
    const terracottaBucket: THREE.BufferGeometry[] = [];
    const cedarWoodBucket: THREE.BufferGeometry[] = [];
    const darkTimberBucket: THREE.BufferGeometry[] = [];
    const cobaltTrimBucket: THREE.BufferGeometry[] = [];
    const windowPaneBucket: THREE.BufferGeometry[] = [];
    const wroughtIronBucket: THREE.BufferGeometry[] = [];
    const vineDarkBucket: THREE.BufferGeometry[] = [];
    const vineLightBucket: THREE.BufferGeometry[] = [];
    const lanternGlassBucket: THREE.BufferGeometry[] = [];
    const goldBrassBucket: THREE.BufferGeometry[] = [];
    const waterBucket: THREE.BufferGeometry[] = [];

    const parentMat = new THREE.Matrix4();
    const pPos = new THREE.Vector3();
    const pQuat = new THREE.Quaternion();
    const pScale = new THREE.Vector3(1, 1, 1);
    const pEuler = new THREE.Euler();

    const setParentTransform = (x: number, y: number, z: number, yaw: number) => {
      pPos.set(x, y, z);
      pEuler.set(0, yaw, 0, 'XYZ');
      pQuat.setFromEuler(pEuler);
      parentMat.compose(pPos, pQuat, pScale);
    };

    // =======================================================================
    // 1. 137 CONTINUOUS PAINTED COBALT STEPS & WHITE DRIPS (z=3.4 to -85.0)
    // =======================================================================
    const stepCount = 136;
    const zStart = 3.4;
    const zEnd = -85.0;
    const dz = (zStart - zEnd) / stepCount;

    for (let i = 0; i <= stepCount; i++) {
      const z = zStart - i * dz;
      const x = getRoadCenterX(z);
      const y = getRoadElevationY(z);
      const width = getRoadHalfWidth(z) * 2.04;
      const yaw = getRoadYaw(z) - Math.PI;
      const hasWhiteDrip = i < 22 || i % 5 === 0;
      const dripOffset = (pseudoRandom(i * 7 + 1) - 0.5) * 0.45;

      setParentTransform(x, y, z, yaw);

      // Step block
      pushTransformedGeo(
        i % 2 === 0 ? stepBucketA : stepBucketB,
        unitBox,
        parentMat,
        0,
        -0.14,
        0,
        0,
        0,
        0,
        width,
        0.28,
        0.74
      );

      // Impasto Whitewash Paint Splash & Riser Drip
      if (hasWhiteDrip) {
        pushTransformedGeo(
          whiteDripBucket,
          planeTop,
          parentMat,
          dripOffset,
          0.004,
          0.22,
          0,
          0,
          0,
          0.46,
          1,
          0.26
        );
        pushTransformedGeo(
          whiteDripBucket,
          unitBox,
          parentMat,
          dripOffset,
          -0.11,
          0.362,
          0,
          0,
          0,
          0.08,
          0.21,
          0.014
        );
        pushTransformedGeo(
          whiteDripBucket,
          unitBox,
          parentMat,
          dripOffset + 0.12,
          -0.08,
          0.362,
          0,
          0,
          0,
          0.045,
          0.15,
          0.014
        );
      }

      // Low Cobalt Curb Wall Along the Cloud Bridge Section (z in [-55, -75])
      if (z < -54.0 && z > -75.0 && i % 2 === 0) {
        pushTransformedGeo(
          wallDeepBlueBucket,
          unitBox,
          parentMat,
          -width * 0.5 + 0.14,
          0.35,
          0,
          0,
          0,
          0,
          0.28,
          0.95,
          1.38
        );
        pushTransformedGeo(
          wallDeepBlueBucket,
          unitBox,
          parentMat,
          width * 0.5 - 0.14,
          0.35,
          0,
          0,
          0,
          0,
          0.28,
          0.95,
          1.38
        );
      }
    }

    // =======================================================================
    // 2. THE PAINTER'S CHIMNEY TOWER (Moved Strictly Outside Road Corridor!)
    //    No wall or wing ever blocks the stairs!
    // =======================================================================
    {
      const towerZ = -13.4;
      const towerRoadX = getRoadCenterX(towerZ);
      const towerHalfW = getRoadHalfWidth(towerZ);
      const towerY = getRoadElevationY(towerZ);
      const towerYaw = getRoadYaw(towerZ) - Math.PI;
      // Place strictly outside the right edge of the stairs (+X side) so the road is 100% open!
      const towerX = towerRoadX + towerHalfW + 2.55;
      setParentTransform(towerX, towerY - 0.6, towerZ, towerYaw);

      // Main Whitewashed Tower Body
      pushTransformedGeo(wallWhiteBucket, unitBox, parentMat, 0, 4.4, 0, 0, 0, 0, 3.0, 9.2, 3.2);
      // Cobalt Blue Lower Dado Wash
      pushTransformedGeo(
        wallDeepBlueBucket,
        unitBox,
        parentMat,
        0,
        1.2,
        0,
        0,
        0,
        0,
        3.06,
        2.6,
        3.26
      );
      // Iconic Tall White Square Medina Chimney with Peaked Cap
      pushTransformedGeo(
        wallWhiteBucket,
        unitBox,
        parentMat,
        -0.65,
        9.4,
        1.0,
        0,
        0,
        0,
        0.48,
        1.65,
        0.48
      );
      pushTransformedGeo(
        wallBlueLowerBucket,
        unitBox,
        parentMat,
        -0.65,
        10.26,
        1.0,
        0,
        0,
        0,
        0.58,
        0.1,
        0.58
      );
      pushTransformedGeo(
        wallWhiteBucket,
        cone4,
        parentMat,
        -0.65,
        10.48,
        1.0,
        0,
        Math.PI / 4,
        0,
        0.38,
        0.36,
        0.38
      );
      // Secondary Stepped Building Wing extending OUTWARD (+X) away from the road
      pushTransformedGeo(
        wallWhiteBucket,
        unitBox,
        parentMat,
        2.1,
        3.9,
        -1.1,
        0,
        0,
        0,
        2.2,
        7.8,
        2.6
      );
      pushTransformedGeo(
        terracottaBucket,
        unitBox,
        parentMat,
        2.1,
        7.9,
        -1.1,
        0.15,
        0,
        0,
        2.32,
        0.22,
        2.75
      );
    }

    // =======================================================================
    // 3. FLANKING MEDINA BUILDINGS, WINDOWS, BALCONIES, VINES & LANTERNS
    //    Positioned perpendicular to road curve with deep foundations!
    // =======================================================================
    for (let i = 0; i < 16; i++) {
      const z = 2.2 - i * 3.6;
      const isCourtyard = Math.abs(z - -46.0) < 6.5;
      const cx = getRoadCenterX(z);
      const cy = getRoadElevationY(z);
      const halfW = getRoadHalfWidth(z);
      const yaw = getRoadYaw(z) - Math.PI;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      (['left', 'right'] as const).forEach((side, sIdx) => {
        // Skip right-side building right at towerZ = -13.4 where Painter's Tower stands
        if (side === 'right' && Math.abs(z - -13.4) < 2.2) return;

        const seed = i * 13 + sIdx * 7;
        const depth = 2.4;
        const length = 3.78;
        const height = isCourtyard
          ? 5.4 + pseudoRandom(seed) * 1.4
          : 7.6 + pseudoRandom(seed + 1) * 2.4;

        // Offset perpendicular to the road so walls & balconies NEVER jut onto the stairs
        const perpDist = halfW + depth * 0.5 + 0.36;
        const sideSign = side === 'left' ? -1 : 1;
        const bx = cx + sideSign * perpDist * cosY;
        const bz = z - sideSign * perpDist * sinY;

        const variant: 'blue-lower' | 'white-plaster' | 'deep-cobalt' =
          i < 4
            ? 'blue-lower'
            : (i + sIdx) % 3 === 0
              ? 'white-plaster'
              : (i + sIdx) % 2 === 0
                ? 'blue-lower'
                : 'deep-cobalt';

        const wallBucket =
          variant === 'white-plaster'
            ? wallWhiteBucket
            : variant === 'deep-cobalt'
              ? wallDeepBlueBucket
              : wallBlueLowerBucket;

        const inwardSign = side === 'left' ? 1 : -1;
        const faceX = inwardSign * (depth * 0.5 + 0.02);

        setParentTransform(bx, cy, bz, yaw);

        // Main Plaster Facade Mass (extended 1.2m below cy so downhill corners never float!)
        const totalH = height + 1.2;
        pushTransformedGeo(
          wallBucket,
          unitBox,
          parentMat,
          0,
          height * 0.5 - 0.6,
          0,
          0,
          0,
          0,
          depth,
          totalH,
          length
        );

        // Terracotta Eave Trim Along Top Edge
        if (i % 2 === 0) {
          pushTransformedGeo(
            terracottaBucket,
            unitBox,
            parentMat,
            faceX * 0.85,
            height - 0.15,
            0,
            0,
            0,
            inwardSign * -0.28,
            0.45,
            0.16,
            length + 0.06
          );
        }

        // Recessed Dark-Blue Windows with Wrought-Iron Grille Bars
        [-0.95, 0.95].forEach((wz, wIdx) => {
          const wy = 2.15 + (wIdx % 2) * 0.35;
          pushTransformedGeo(
            cobaltTrimBucket,
            unitBox,
            parentMat,
            faceX,
            wy,
            wz,
            0,
            0,
            0,
            0.08,
            1.32,
            0.78
          );
          pushTransformedGeo(
            windowPaneBucket,
            unitBox,
            parentMat,
            faceX + inwardSign * 0.02,
            wy,
            wz,
            0,
            0,
            0,
            0.06,
            1.14,
            0.62
          );
          [-0.16, 0, 0.16].forEach((barZ) => {
            pushTransformedGeo(
              wroughtIronBucket,
              cyl6,
              parentMat,
              faceX + inwardSign * 0.055,
              wy,
              wz + barZ,
              0,
              0,
              0,
              0.01,
              1.14,
              0.01
            );
          });
        });

        // Upper-Story Wrought-Iron Balcony & Cedar Planter Box with Trailing Vines
        if (i < 4 || (i + sIdx) % 2 === 0) {
          const balX = faceX + inwardSign * 0.22;
          const balY = 4.35;
          const balZ = 0.15;

          // Cedar planter box
          pushTransformedGeo(
            cedarWoodBucket,
            unitBox,
            parentMat,
            balX,
            balY + 0.02,
            balZ,
            0,
            0,
            0,
            0.42,
            0.42,
            1.34
          );
          // Wrought-iron top rail
          pushTransformedGeo(
            wroughtIronBucket,
            unitBox,
            parentMat,
            balX,
            balY + 0.68,
            balZ,
            0,
            0,
            0,
            0.46,
            0.05,
            1.4
          );
          // Support brackets
          [-0.48, 0.48].forEach((kz) => {
            pushTransformedGeo(
              darkTimberBucket,
              unitBox,
              parentMat,
              balX - inwardSign * 0.08,
              balY - 0.28,
              balZ + kz,
              0,
              0,
              inwardSign * 0.45,
              0.08,
              0.36,
              0.08
            );
          });
          // Cascading green vines
          for (let vIdx = 0; vIdx < 8; vIdx++) {
            const vz = balZ - 0.52 + vIdx * 0.15;
            const dropY = balY + 0.25 - (vIdx % 3) * 0.2;
            pushTransformedGeo(
              vIdx % 2 === 0 ? vineDarkBucket : vineLightBucket,
              dodecaGeo,
              parentMat,
              balX + inwardSign * 0.16,
              dropY,
              vz,
              0,
              0,
              0,
              0.14,
              0.14,
              0.14
            );
          }
        }

        // Vintage Wrought-Iron Wall Lantern
        if ((i + sIdx) % 2 === 0) {
          const lx = faceX + inwardSign * 0.22;
          const ly = 3.05;
          const lz = -0.85;
          pushTransformedGeo(
            wroughtIronBucket,
            unitBox,
            parentMat,
            lx - inwardSign * 0.11,
            ly + 0.12,
            lz,
            0,
            0,
            0,
            0.24,
            0.03,
            0.03
          );
          pushTransformedGeo(
            wroughtIronBucket,
            cone6,
            parentMat,
            lx,
            ly + 0.06,
            lz,
            0,
            0,
            0,
            0.12,
            0.1,
            0.12
          );
          pushTransformedGeo(
            lanternGlassBucket,
            cyl6,
            parentMat,
            lx,
            ly - 0.04,
            lz,
            0,
            0,
            0,
            0.08,
            0.16,
            0.08
          );
        }

        // Arched Cobalt-Blue Wooden Medina Door
        if (i > 1 && (i + sIdx) % 3 === 0) {
          pushTransformedGeo(
            cobaltTrimBucket,
            unitBox,
            parentMat,
            faceX,
            0.95,
            0,
            0,
            0,
            0,
            0.09,
            1.85,
            0.92
          );
          pushTransformedGeo(
            cobaltTrimBucket,
            doorArchCyl,
            parentMat,
            faceX,
            1.87,
            0,
            0,
            0,
            0,
            1,
            1,
            1
          );
        }
      });
    }

    // =======================================================================
    // 4. ZONE 2: WHISPERING KEYHOLE ARCHES & HANGING LANTERNS
    //    Wide pillar clearance & high overhead arch span so road is 100% clear
    // =======================================================================
    [-17.5, -25.0, -32.5].forEach((archZ) => {
      const cx = getRoadCenterX(archZ);
      const cy = getRoadElevationY(archZ);
      const halfW = getRoadHalfWidth(archZ);
      const yaw = getRoadYaw(archZ) - Math.PI;
      const span = halfW * 2.18;

      setParentTransform(cx, cy, archZ, yaw);

      // Left & Right Cobalt Arch Pillars (outside step edges)
      pushTransformedGeo(
        wallDeepBlueBucket,
        unitBox,
        parentMat,
        -span * 0.5 - 0.1,
        2.3,
        0,
        0,
        0,
        0,
        0.62,
        5.4,
        0.72
      );
      pushTransformedGeo(
        wallDeepBlueBucket,
        unitBox,
        parentMat,
        span * 0.5 + 0.1,
        2.3,
        0,
        0,
        0,
        0,
        0.62,
        5.4,
        0.72
      );

      // Upper Arch Spandrel Beam (high overhead at y = 5.35)
      pushTransformedGeo(
        wallWhiteBucket,
        unitBox,
        parentMat,
        0,
        5.35,
        0,
        0,
        0,
        0,
        span + 0.85,
        1.25,
        0.76
      );
      // Moroccan Zellij Mosaic Bands on Front & Back of Arch Beam
      pushTransformedGeo(
        zellijBucket,
        planeFront,
        parentMat,
        0,
        5.4,
        0.39,
        0,
        0,
        0,
        span - 0.1,
        0.52,
        1
      );
      pushTransformedGeo(
        zellijBucket,
        planeFront,
        parentMat,
        0,
        5.4,
        -0.39,
        0,
        Math.PI,
        0,
        span - 0.1,
        0.52,
        1
      );

      // Suspended Glowing Moroccan Star Lantern Hanging From Arch Crown
      pushTransformedGeo(
        wroughtIronBucket,
        cyl6,
        parentMat,
        0,
        4.45,
        0,
        0,
        0,
        0,
        0.012,
        0.65,
        0.012
      );
      pushTransformedGeo(
        lanternGlassBucket,
        octGeo,
        parentMat,
        0,
        4.08,
        0,
        0,
        0,
        0,
        0.22,
        0.22,
        0.22
      );
    });

    // =======================================================================
    // 5. ZONE 3: COURTYARD OF THE LEVITATING SKY FOUNTAIN (z = -46.0)
    // =======================================================================
    {
      const fz = -46.0;
      const fx = getRoadCenterX(fz);
      const fy = getRoadElevationY(fz);
      setParentTransform(fx, fy, fz, 0);

      // Octagonal Moroccan Zellij Mosaic Fountain Basin
      pushTransformedGeo(zellijBucket, cyl8, parentMat, 0, 0.28, 0, 0, 0, 0, 1.38, 0.56, 1.38);
      // Inner Glowing Turquoise Water Pool
      pushTransformedGeo(waterBucket, circleWater, parentMat, 0, 0.57, 0, 0, 0, 0, 1, 1, 1);
      // Sculpted White Marble Pedestal
      pushTransformedGeo(wallWhiteBucket, cyl16, parentMat, 0, 0.75, 0, 0, 0, 0, 0.28, 0.72, 0.28);
    }

    // =======================================================================
    // 6. ZONE 5: CELESTIAL BELVEDERE SUMMIT PAVILION (z = -81.5)
    // =======================================================================
    {
      const sz = -81.5;
      const sx = getRoadCenterX(sz);
      const sy = getRoadElevationY(sz);
      setParentTransform(sx, sy, sz, 0);

      // Circular Mosaic Summit Plaza Terrace
      pushTransformedGeo(zellijBucket, cyl16, parentMat, 0, -0.1, 0, 0, 0, 0, 4.5, 0.36, 4.5);
      pushTransformedGeo(cobaltTrimBucket, ringTerrace, parentMat, 0, 0.09, 0, 0, 0, 0, 1, 1, 1);

      // 4 Sculpted Whitewashed Pavilion Pillars
      [
        [-1.95, -1.95],
        [1.95, -1.95],
        [-1.95, 1.95],
        [1.95, 1.95],
      ].forEach(([px, pz]) => {
        pushTransformedGeo(
          wallBlueLowerBucket,
          unitBox,
          parentMat,
          px,
          1.95,
          pz,
          0,
          0,
          0,
          0.48,
          3.9,
          0.48
        );
      });

      // Pavilion Crown Cornice & Moroccan White-and-Azure Dome (Qubba)
      pushTransformedGeo(wallWhiteBucket, unitBox, parentMat, 0, 4.05, 0, 0, 0, 0, 4.5, 0.45, 4.5);
      pushTransformedGeo(wallWhiteBucket, sphereDome, parentMat, 0, 4.25, 0, 0, 0, 0, 1, 1, 1);

      // Golden Jamour Spire Finial on Top of Dome
      pushTransformedGeo(goldBrassBucket, cyl8, parentMat, 0, 6.45, 0, 0, 0, 0, 0.04, 0.75, 0.04);
      [0.16, 0.11, 0.07].forEach((r, fIdx) => {
        pushTransformedGeo(
          goldBrassBucket,
          sphereFinial,
          parentMat,
          0,
          6.22 + fIdx * 0.24,
          0,
          0,
          0,
          0,
          r,
          r,
          r
        );
      });
    }

    return {
      stepsA: mergeBufferGeometries(stepBucketA),
      stepsB: mergeBufferGeometries(stepBucketB),
      whiteDrips: mergeBufferGeometries(whiteDripBucket),
      wallBlueLower: mergeBufferGeometries(wallBlueLowerBucket),
      wallWhite: mergeBufferGeometries(wallWhiteBucket),
      wallDeepBlue: mergeBufferGeometries(wallDeepBlueBucket),
      zellij: mergeBufferGeometries(zellijBucket),
      terracotta: mergeBufferGeometries(terracottaBucket),
      cedarWood: mergeBufferGeometries(cedarWoodBucket),
      darkTimber: mergeBufferGeometries(darkTimberBucket),
      cobaltTrim: mergeBufferGeometries(cobaltTrimBucket),
      windowPanes: mergeBufferGeometries(windowPaneBucket),
      wroughtIron: mergeBufferGeometries(wroughtIronBucket),
      vineDark: mergeBufferGeometries(vineDarkBucket),
      vineLight: mergeBufferGeometries(vineLightBucket),
      lanternGlass: mergeBufferGeometries(lanternGlassBucket),
      goldBrass: mergeBufferGeometries(goldBrassBucket),
      water: mergeBufferGeometries(waterBucket),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (fountainOrbRef.current) {
      fountainOrbRef.current.position.y = 1.35 + Math.sin(t * 2.4) * 0.14;
      fountainOrbRef.current.rotation.y = t * 1.1;
    }

    if (summitCrystalRef.current) {
      summitCrystalRef.current.position.y = 2.15 + Math.sin(t * 2.0) * 0.18;
      summitCrystalRef.current.rotation.y = t * 0.85;
      summitCrystalRef.current.rotation.z = Math.sin(t * 1.4) * 0.15;
    }

    if (skyStarsGroupRef.current) {
      const children = skyStarsGroupRef.current.children;
      for (let idx = 0; idx < children.length; idx++) {
        const starMesh = children[idx];
        starMesh.rotation.y = t * 1.8 + idx * 0.7;
        starMesh.position.y =
          INITIAL_SKY_STARS[idx].position[1] + Math.sin(t * 2.6 + idx) * 0.12;
      }
    }

    if (markerRef.current && flyMarker) {
      const s = 1.0 + Math.sin(t * 5.5) * 0.14;
      markerRef.current.scale.set(s, 1, s);
      markerRef.current.rotation.y = t * 1.8;
    }
  });

  const fountainZ = -46.0;
  const fountainX = getRoadCenterX(fountainZ);
  const fountainY = getRoadElevationY(fountainZ);

  const summitZ = -81.5;
  const summitX = getRoadCenterX(summitZ);
  const summitY = getRoadElevationY(summitZ);

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. BATCHED COBALT STEPS (2 Draw Calls + Click Raycasting) */}
      {/* ========================================================= */}
      <mesh
        geometry={batchedMeshes.stepsA}
        material={materials.stepCobaltA}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onRoadClick(e.point);
        }}
      />
      <mesh
        geometry={batchedMeshes.stepsB}
        material={materials.stepCobaltB}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onRoadClick(e.point);
        }}
      />
      <mesh
        geometry={batchedMeshes.whiteDrips}
        material={materials.whiteDrip}
        receiveShadow
      />

      {/* ========================================================= */}
      {/* 2. BATCHED MEDINA WALLS, ARCHES, BALCONIES, VINES & DOORS */}
      {/* ========================================================= */}
      <mesh
        geometry={batchedMeshes.wallBlueLower}
        material={materials.wallBlueLower}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedMeshes.wallWhite}
        material={materials.wallWhite}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedMeshes.wallDeepBlue}
        material={materials.wallDeepBlue}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedMeshes.zellij}
        material={materials.zellij}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={batchedMeshes.terracotta}
        material={materials.terracottaTile}
        castShadow
      />
      <mesh
        geometry={batchedMeshes.cedarWood}
        material={materials.cedarWood}
        castShadow
      />
      <mesh
        geometry={batchedMeshes.darkTimber}
        material={materials.darkTimber}
      />
      <mesh
        geometry={batchedMeshes.cobaltTrim}
        material={materials.cobaltTrim}
        castShadow
      />
      <mesh
        geometry={batchedMeshes.wroughtIron}
        material={materials.wroughtIron}
      />
      <mesh
        geometry={batchedMeshes.vineDark}
        material={materials.vineGreenDark}
        castShadow
      />
      <mesh
        geometry={batchedMeshes.vineLight}
        material={materials.vineGreenLight}
        castShadow
      />
      <mesh
        geometry={batchedMeshes.goldBrass}
        material={materials.goldBrass}
        castShadow
      />
      <mesh
        geometry={batchedMeshes.water}
        material={materials.turquoiseWater}
      />

      {/* Time-of-Day Responsive Window Panes & Lantern Glass (2 Draw Calls) */}
      <mesh geometry={batchedMeshes.windowPanes}>
        <meshStandardMaterial
          color={isNightOrSunset ? '#ffd88a' : '#122648'}
          emissive={isNightOrSunset ? '#ffae42' : '#000000'}
          emissiveIntensity={
            timeOfDay === 'starlight'
              ? 0.85
              : timeOfDay === 'sunset'
                ? 0.35
                : 0
          }
          roughness={0.5}
        />
      </mesh>

      <mesh geometry={batchedMeshes.lanternGlass}>
        <meshStandardMaterial
          color={lanternGlowColor}
          emissive="#ffae38"
          emissiveIntensity={lanternEmissiveIntensity}
          roughness={0.28}
        />
      </mesh>

      {/* ========================================================= */}
      {/* 3. DYNAMIC LANDMARK ELEMENTS & LIGHTWEIGHT HOVER VOLUMES  */}
      {/* ========================================================= */}
      {/* Sky Fountain Levitating Water Orb (z = -46.0) */}
      <group position={[fountainX, fountainY, fountainZ]}>
        <group ref={fountainOrbRef} position={[0, 1.35, 0]}>
          <mesh>
            <icosahedronGeometry args={[0.28, 2]} />
            <meshStandardMaterial
              color="#6ce4ff"
              emissive="#28b8f5"
              emissiveIntensity={0.85}
              roughness={0.15}
            />
          </mesh>
          <mesh rotation={[Math.PI / 3, 0.4, 0]}>
            <torusGeometry args={[0.48, 0.022, 10, 28]} />
            <meshBasicMaterial color="#b8f2ff" transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 3, -0.4, 0]}>
            <torusGeometry args={[0.62, 0.016, 10, 28]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        </group>

        <pointLight
          position={[0, 1.5, 0]}
          color="#4cd4ff"
          intensity={1.5}
          distance={8.0}
        />

        {/* Interactive Hover/Click Volume for Sky Fountain */}
        <mesh
          position={[0, 1.1, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover('Courtyard of the Sky Fountain — Click to Fly to Landmark');
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectZone('sky-fountain');
          }}
        >
          <cylinderGeometry args={[1.5, 1.5, 2.2, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>

      {/* Celestial Belvedere Summit Levitating Star Crystal (z = -81.5) */}
      <group position={[summitX, summitY, summitZ]}>
        <group ref={summitCrystalRef} position={[0, 2.15, 0]}>
          <mesh>
            <octahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial
              color="#fff3b8"
              emissive="#ffbe3b"
              emissiveIntensity={1.2}
              roughness={0.15}
            />
          </mesh>
          <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <torusGeometry args={[0.72, 0.022, 10, 28]} />
            <meshBasicMaterial color="#8ae4ff" transparent opacity={0.85} />
          </mesh>
        </group>

        <pointLight
          position={[0, 2.4, 0]}
          color="#ffd670"
          intensity={2.0}
          distance={10.0}
        />

        {/* Interactive Hover/Click Volume for Celestial Belvedere */}
        <mesh
          position={[0, 2.5, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover('Celestial Belvedere — Summit Sanctuary at the End of the Blue Road');
          }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectZone('celestial-summit');
          }}
        >
          <cylinderGeometry args={[2.5, 2.5, 5.0, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>

      {/* Warm Archway Lantern Point Lights in Sunset/Starlight */}
      {isNightOrSunset &&
        [-17.5, -25.0, -32.5].map((archZ, idx) => (
          <pointLight
            key={`arch-light-${idx}`}
            position={[
              getRoadCenterX(archZ),
              getRoadElevationY(archZ) + 3.9,
              archZ,
            ]}
            color="#ffb84d"
            intensity={1.5}
            distance={8.5}
          />
        ))}

      {/* ========================================================= */}
      {/* 4. COLLECTIBLE LUMINA SKY STARS (✧) ALONG THE FLIGHT PATH */}
      {/* ========================================================= */}
      <group ref={skyStarsGroupRef}>
        {INITIAL_SKY_STARS.map((star) => {
          const isCollected = collectedStars.includes(star.id);
          return (
            <group
              key={star.id}
              position={star.position}
              visible={!isCollected}
            >
              <mesh geometry={starGeo} material={materials.starGold} />
              <mesh rotation={[0, 0, Math.PI / 4]} material={materials.starRing}>
                <ringGeometry args={[0.26, 0.3, 4]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ========================================================= */}
      {/* 5. CLICK-TO-FLY DESTINATION RING MARKER ON STEPS          */}
      {/* ========================================================= */}
      {flyMarker && (
        <group ref={markerRef} position={flyMarker}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.32, 28]} />
            <meshBasicMaterial
              color="#9be8ff"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.25, 0]} geometry={starGeo} scale={0.55}>
            <meshBasicMaterial color="#fff7cc" />
          </mesh>
        </group>
      )}
    </group>
  );
}
