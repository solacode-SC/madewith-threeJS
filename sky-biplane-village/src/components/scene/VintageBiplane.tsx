import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type {
  CameraMode,
  FlightSpeedPreset,
  SkyMood,
  VirtualFlightInput,
} from '../../domain/skyConfig';
import { SKY_MOOD_THEMES } from '../../domain/skyConfig';
import {
  SKY_RINGS,
  VILLAGE_LANDMARKS,
  getTerrainHeight,
  getTerrainNormal,
} from '../../domain/villageLayout';
import {
  createAirfoilWingGeometry,
  createInkOutlineGeometry,
} from '../../core/inkOutlineBatcher';
import { createBiplaneWingCanvasTextures } from '../../core/handDrawnTextures';

interface VintageBiplaneProps {
  cameraMode: CameraMode;
  skyMood: SkyMood;
  speedPreset: FlightSpeedPreset;
  autoCruise: boolean;
  collectedRings: number[];
  planePosRef: React.MutableRefObject<THREE.Vector3>;
  planeYawRef: React.MutableRefObject<number>;
  planePitchRef: React.MutableRefObject<number>;
  planeRollRef: React.MutableRefObject<number>;
  planeSpeedRef: React.MutableRefObject<number>;
  targetPointRef: React.MutableRefObject<THREE.Vector3 | null>;
  barrelRollTimerRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualFlightInput>;
  onClearFlightTarget: () => void;
  onDiscoverLandmark: (landmarkId: string) => void;
  onCollectRing: (ringId: number) => void;
  onHover: (label: string | null) => void;
}

const TRAIL_SEGMENTS = 64;
const _groundNormal = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _shadowQuat = new THREE.Quaternion();
const _yawQuat = new THREE.Quaternion();

function createUnifiedBiplaneShadowGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  shape.moveTo(0, 1.48);
  shape.lineTo(0.28, 1.42);
  shape.lineTo(0.30, 0.56);

  shape.lineTo(2.05, 0.56);
  shape.quadraticCurveTo(2.42, 0.54, 2.42, 0.08);
  shape.quadraticCurveTo(2.42, -0.38, 2.05, -0.40);

  shape.lineTo(0.28, -0.40);

  shape.lineTo(0.18, -1.56);
  shape.lineTo(0.78, -1.62);
  shape.quadraticCurveTo(0.88, -1.64, 0.88, -1.86);
  shape.quadraticCurveTo(0.88, -2.06, 0.72, -2.08);
  shape.lineTo(0.12, -2.08);

  shape.lineTo(0, -2.22);

  shape.lineTo(-0.12, -2.08);
  shape.lineTo(-0.72, -2.08);
  shape.quadraticCurveTo(-0.88, -2.06, -0.88, -1.86);
  shape.quadraticCurveTo(-0.88, -1.64, -0.78, -1.62);
  shape.lineTo(-0.18, -1.56);

  shape.lineTo(-0.28, -0.40);
  shape.lineTo(-2.05, -0.40);
  shape.quadraticCurveTo(-2.42, -0.38, -2.42, 0.08);
  shape.quadraticCurveTo(-2.42, 0.54, -2.05, 0.56);

  shape.lineTo(-0.30, 0.56);
  shape.lineTo(-0.28, 1.42);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, 16);
  geo.rotateX(Math.PI * 0.5);
  return geo;
}

function createSleekFuselageGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.58, 0.54, 2.65, 8, 8, 18);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    const z = pos.getZ(i);

    const u = THREE.MathUtils.clamp((1.325 - z) / 2.65, 0, 1);
    const widthTaper = THREE.MathUtils.lerp(1.0, 0.22, Math.pow(u, 1.35));
    const heightTaper = THREE.MathUtils.lerp(1.0, 0.42, Math.pow(u, 1.25));

    if (y > 0) {
      const xNorm = Math.abs(x) / 0.29;
      y += (1.0 - xNorm * xNorm) * 0.08 * (1.0 - u * 0.6);
    }

    pos.setXYZ(i, x * widthTaper, y * heightTaper, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function createRibbonTrailState() {
  const vertCount = TRAIL_SEGMENTS * 2;
  const positions = new Float32Array(vertCount * 3);
  const indices: number[] = [];
  for (let i = 0; i < TRAIL_SEGMENTS - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);

  const history: THREE.Vector3[] = [];
  for (let i = 0; i < TRAIL_SEGMENTS; i++) {
    history.push(new THREE.Vector3(2.5, 18.2, 16.5));
  }
  return { geo, history };
}

export default function VintageBiplane({
  cameraMode,
  skyMood,
  speedPreset,
  autoCruise,
  collectedRings,
  planePosRef,
  planeYawRef,
  planePitchRef,
  planeRollRef,
  planeSpeedRef,
  targetPointRef,
  barrelRollTimerRef,
  virtualInputRef,
  onClearFlightTarget,
  onDiscoverLandmark,
  onCollectRing,
  onHover,
}: VintageBiplaneProps) {
  const planeRootRef = useRef<THREE.Group>(null);
  const airframeBankRef = useRef<THREE.Group>(null);
  const propellerRef = useRef<THREE.Group>(null);
  const shadowPropRef = useRef<THREE.Group>(null);
  const rudderRef = useRef<THREE.Mesh>(null);
  const elevatorRef = useRef<THREE.Mesh>(null);
  const pilotHeadRef = useRef<THREE.Group>(null);
  const scarfGroupRef = useRef<THREE.Group>(null);
  const scarfTailRef = useRef<THREE.Mesh>(null);
  const groundShadowGroupRef = useRef<THREE.Group>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const wingTex = useMemo(() => createBiplaneWingCanvasTextures(), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const geometries = useMemo(() => {
    const upperWing = createAirfoilWingGeometry(4.75, 0.96, 0.13, 32, 14);
    const upperWingOutline = createInkOutlineGeometry(upperWing, 0.026);

    const lowerWing = createAirfoilWingGeometry(4.35, 0.90, 0.12, 28, 12);
    const lowerWingOutline = createInkOutlineGeometry(lowerWing, 0.026);

    const fuselage = createSleekFuselageGeometry();
    const fuselageOutline = createInkOutlineGeometry(fuselage, 0.026);

    const hStab = createAirfoilWingGeometry(1.68, 0.56, 0.07, 16, 8);
    const hStabOutline = createInkOutlineGeometry(hStab, 0.022);

    const vFin = createAirfoilWingGeometry(0.72, 0.52, 0.06, 12, 8);
    vFin.rotateZ(Math.PI * 0.5);
    const vFinOutline = createInkOutlineGeometry(vFin, 0.022);

    const unifiedShadow = createUnifiedBiplaneShadowGeometry();

    return {
      upperWing,
      upperWingOutline,
      lowerWing,
      lowerWingOutline,
      fuselage,
      fuselageOutline,
      hStab,
      hStabOutline,
      vFin,
      vFinOutline,
      unifiedShadow,
    };
  }, []);

  const materials = useMemo(() => {
    return {
      wingFabric: new THREE.MeshStandardMaterial({
        map: wingTex.map,
        bumpMap: wingTex.bumpMap,
        bumpScale: 0.025,
        roughness: 0.76,
      }),
      fuselageCream: new THREE.MeshStandardMaterial({
        color: '#E6E1D2',
        roughness: 0.68,
      }),
      cowlingDarkOlive: new THREE.MeshStandardMaterial({
        color: '#2B3329',
        roughness: 0.55,
        metalness: 0.18,
      }),
      noseWhitePanel: new THREE.MeshStandardMaterial({
        color: '#F5F2E8',
        roughness: 0.52,
      }),
      strutDark: new THREE.MeshStandardMaterial({
        color: '#242A21',
        roughness: 0.65,
      }),
      propWood: new THREE.MeshStandardMaterial({
        color: '#3B2B20',
        roughness: 0.48,
      }),
      propBlur: new THREE.MeshBasicMaterial({
        color: '#EAE6D8',
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      inkOutline: new THREE.MeshBasicMaterial({
        color: '#1A2018',
        side: THREE.BackSide,
      }),
      leatherBrown: new THREE.MeshStandardMaterial({
        color: '#4E3626',
        roughness: 0.72,
      }),
      goggleBrass: new THREE.MeshStandardMaterial({
        color: '#D8A444',
        metalness: 0.55,
        roughness: 0.32,
      }),
      goggleGlass: new THREE.MeshStandardMaterial({
        color: '#7CC6D8',
        emissive: '#3B8CA2',
        emissiveIntensity: 0.35,
        roughness: 0.18,
      }),
      scarfSilk: new THREE.MeshStandardMaterial({
        color: '#F6F2E4',
        emissive: '#FFFDF5',
        emissiveIntensity: 0.22,
        roughness: 0.5,
      }),
      navLightRed: new THREE.MeshBasicMaterial({
        color: '#FF4B3A',
      }),
      navLightGreen: new THREE.MeshBasicMaterial({
        color: '#38F27A',
      }),
      headlampCone: new THREE.MeshBasicMaterial({
        color: '#FFF4C2',
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      groundShadow: new THREE.MeshBasicMaterial({
        color: '#243C18',
        transparent: true,
        opacity: 0.74,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      }),
      contrailRibbon: new THREE.MeshBasicMaterial({
        color: '#FBF9EF',
        transparent: true,
        opacity: 0.84,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      wingtipRibbon: new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0.46,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    };
  }, [wingTex]);

  useEffect(() => {
    const moodTheme = SKY_MOOD_THEMES[skyMood];
    materials.groundShadow.opacity = moodTheme.shadowDarkness;
  }, [skyMood, materials]);

  const { tailTrail, leftTipTrail, rightTipTrail } = useMemo(() => {
    return {
      tailTrail: createRibbonTrailState(),
      leftTipTrail: createRibbonTrailState(),
      rightTipTrail: createRibbonTrailState(),
    };
  }, []);

  const trailInitRef = useRef(false);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const elapsed = state.clock.getElapsedTime();
    const keys = keysRef.current;
    const vIn = virtualInputRef.current;

    const pos = planePosRef.current;
    let yaw = planeYawRef.current;
    let pitch = planePitchRef.current;
    let roll = planeRollRef.current;
    let speed = planeSpeedRef.current;

    const turnL = keys['a'] || keys['arrowleft'] || vIn.turnLeft;
    const turnR = keys['d'] || keys['arrowright'] || vIn.turnRight;
    const fwd = keys['w'] || keys['arrowup'] || vIn.forward;
    const back = keys['s'] || keys['arrowdown'] || vIn.backward;
    const climb = keys[' '] || keys['e'] || vIn.climb;
    const descend = keys['c'] || keys['q'] || vIn.descend;
    const boost = keys['shift'] || vIn.boost;

    if (turnL || turnR || fwd || back || climb || descend) {
      if (targetPointRef.current) {
        onClearFlightTarget();
      }
    }

    // Fast, Exhilarating Anime Flight Speeds scaled by speedPreset!
    const presetBase =
      speedPreset === 'turbo' ? 32.0 : speedPreset === 'fast' ? 21.5 : 14.0;
    const presetFwd =
      speedPreset === 'turbo' ? 42.0 : speedPreset === 'fast' ? 30.0 : 21.0;
    const presetBoost =
      speedPreset === 'turbo' ? 54.0 : speedPreset === 'fast' ? 42.0 : 30.0;

    let desiredSpeed = autoCruise ? presetBase : 0.0;
    if (fwd) desiredSpeed = boost ? presetBoost : presetFwd;
    else if (back) desiredSpeed = 8.5;
    else if (boost && autoCruise) desiredSpeed = presetBoost;

    speed = THREE.MathUtils.lerp(speed, desiredSpeed, Math.min(1, dt * 5.5));
    planeSpeedRef.current = speed;

    let turnInput = 0;
    let desiredPitch = 0;

    if (turnL) turnInput += 1.0;
    if (turnR) turnInput -= 1.0;

    if (climb) desiredPitch = 0.36;
    else if (descend) desiredPitch = -0.36;

    if (targetPointRef.current) {
      const tgt = targetPointRef.current;
      const dx = tgt.x - pos.x;
      const dz = tgt.z - pos.z;
      const horizDist = Math.hypot(dx, dz);

      if (horizDist < 6.5) {
        onClearFlightTarget();
      } else {
        const desiredYaw = Math.atan2(dx, dz);
        let diff = desiredYaw - yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turnInput = THREE.MathUtils.clamp(diff * 2.1, -1.25, 1.25);

        const dy = tgt.y - pos.y;
        desiredPitch = THREE.MathUtils.clamp(dy * 0.09, -0.32, 0.32);
      }
    } else if (autoCruise && !turnL && !turnR) {
      // Wide scenic figure-8 / panoramic tour over the 3x village & river bridges!
      const distFromValleyCenter = Math.hypot(pos.x - 18.0, pos.z);
      if (distFromValleyCenter > 108.0) {
        const toCenterYaw = Math.atan2(18.0 - pos.x, -pos.z);
        let diff = toCenterYaw - yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        turnInput = THREE.MathUtils.clamp(diff * 1.45, -0.95, 0.95);
      } else {
        turnInput = Math.sin(elapsed * 0.24) * 0.28 + Math.cos(elapsed * 0.11) * 0.14;
      }
    }

    yaw += turnInput * 1.55 * dt;
    planeYawRef.current = yaw;

    const targetRoll = THREE.MathUtils.clamp(-turnInput * 0.54, -0.65, 0.65);
    roll = THREE.MathUtils.lerp(roll, targetRoll, Math.min(1, dt * 6.8));
    pitch = THREE.MathUtils.lerp(pitch, desiredPitch, Math.min(1, dt * 6.0));

    let extraBarrelRoll = 0;
    if (barrelRollTimerRef.current > 0) {
      barrelRollTimerRef.current = Math.max(0, barrelRollTimerRef.current - dt);
      const progress = 1.0 - barrelRollTimerRef.current / 1.35;
      extraBarrelRoll = progress * Math.PI * 2;
    }

    planeRollRef.current = roll;
    planePitchRef.current = pitch;

    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    pos.x += fwdX * speed * dt;
    pos.z += fwdZ * speed * dt;
    pos.y += Math.sin(pitch) * speed * 0.9 * dt;

    const groundUnderPlane = getTerrainHeight(pos.x, pos.z);
    const minSafeAlt = groundUnderPlane + 11.5;
    const maxSafeAlt = 48.0;
    if (pos.y < minSafeAlt) {
      pos.y = THREE.MathUtils.lerp(pos.y, minSafeAlt, Math.min(1, dt * 7.0));
    } else if (pos.y > maxSafeAlt) {
      pos.y = THREE.MathUtils.lerp(pos.y, maxSafeAlt, Math.min(1, dt * 7.0));
    }

    // 3x Expanded Flight Airspace Bounds
    pos.x = THREE.MathUtils.clamp(pos.x, -215, 215);
    pos.z = THREE.MathUtils.clamp(pos.z, -215, 215);

    const gentleAirBob = Math.sin(elapsed * 2.6) * 0.08;
    const totalRoll = roll + extraBarrelRoll;

    if (planeRootRef.current) {
      planeRootRef.current.position.set(pos.x, pos.y + gentleAirBob, pos.z);
      planeRootRef.current.rotation.set(0, yaw, 0);
      planeRootRef.current.visible = cameraMode !== 'cockpit';
    }

    if (airframeBankRef.current) {
      airframeBankRef.current.rotation.set(-pitch, 0, totalRoll);
    }

    const propSpeed = 30.0 + speed * 2.4;
    if (propellerRef.current) {
      propellerRef.current.rotation.z += propSpeed * dt;
    }
    if (shadowPropRef.current) {
      shadowPropRef.current.rotation.y += propSpeed * dt;
    }
    if (rudderRef.current) {
      rudderRef.current.rotation.y = -turnInput * 0.38;
    }
    if (elevatorRef.current) {
      elevatorRef.current.rotation.x = pitch * 0.85;
    }
    if (pilotHeadRef.current) {
      pilotHeadRef.current.rotation.y = turnInput * 0.42 + Math.sin(elapsed * 1.5) * 0.14;
      pilotHeadRef.current.rotation.x = -pitch * 0.55;
    }
    if (scarfGroupRef.current) {
      const windFreq = 14.0 + speed * 0.45;
      scarfGroupRef.current.rotation.y = Math.sin(elapsed * windFreq) * 0.28 - turnInput * 0.28;
      scarfGroupRef.current.rotation.x = Math.cos(elapsed * (windFreq * 0.8)) * 0.18;
    }
    if (scarfTailRef.current) {
      scarfTailRef.current.rotation.y = Math.cos(elapsed * 22.0) * 0.35;
    }

    // Update Unified Crisp Ground-Projected Biplane Silhouette Shadow
    if (groundShadowGroupRef.current) {
      const altAboveGround = Math.max(4.0, pos.y - groundUnderPlane);
      const shadowOffsetX = -altAboveGround * 0.32;
      const shadowOffsetZ = altAboveGround * 0.24;
      const sx = pos.x + shadowOffsetX;
      const sz = pos.z + shadowOffsetZ;
      const sy = getTerrainHeight(sx, sz) + 0.15;

      getTerrainNormal(sx, sz, _groundNormal);
      _shadowQuat.setFromUnitVectors(_upVec, _groundNormal);
      _yawQuat.setFromAxisAngle(_upVec, yaw);
      _shadowQuat.multiply(_yawQuat);

      groundShadowGroupRef.current.position.set(sx, sy, sz);
      groundShadowGroupRef.current.quaternion.copy(_shadowQuat);
      const shadowScale = THREE.MathUtils.clamp(1.02 - (altAboveGround - 14.0) * 0.008, 0.76, 1.08);
      groundShadowGroupRef.current.scale.set(shadowScale, 1.0, shadowScale);
    }

    // Update Center Tail Contrail + Left & Right Wingtip Vortex Ribbons
    const tailWorldX = pos.x - fwdX * 1.98;
    const tailWorldY = pos.y + gentleAirBob + 0.06;
    const tailWorldZ = pos.z - fwdZ * 1.98;

    const cosRoll = Math.cos(totalRoll);
    const sinRoll = Math.sin(totalRoll);
    const wingSpanHalf = 2.34;
    const wingLocalY = 0.54;

    const leftTipX = pos.x - rightX * (wingSpanHalf * cosRoll) - fwdX * 0.15;
    const leftTipY = pos.y + gentleAirBob + wingLocalY - wingSpanHalf * sinRoll;
    const leftTipZ = pos.z - rightZ * (wingSpanHalf * cosRoll) - fwdZ * 0.15;

    const rightTipX = pos.x + rightX * (wingSpanHalf * cosRoll) - fwdX * 0.15;
    const rightTipY = pos.y + gentleAirBob + wingLocalY + wingSpanHalf * sinRoll;
    const rightTipZ = pos.z + rightZ * (wingSpanHalf * cosRoll) - fwdZ * 0.15;

    const updateRibbon = (
      ribbon: { geo: THREE.BufferGeometry; history: THREE.Vector3[] },
      headX: number,
      headY: number,
      headZ: number,
      baseHalfWidth: number
    ) => {
      for (let i = TRAIL_SEGMENTS - 1; i > 0; i--) {
        ribbon.history[i].lerp(ribbon.history[i - 1], Math.min(1, dt * 30.0));
      }
      ribbon.history[0].set(headX, headY, headZ);

      const posAttr = ribbon.geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < TRAIL_SEGMENTS; i++) {
        const p = ribbon.history[i];
        const t = i / (TRAIL_SEGMENTS - 1);
        const halfW = (1.0 - t * 0.82) * baseHalfWidth;
        posAttr.setXYZ(i * 2, p.x - rightX * halfW, p.y, p.z - rightZ * halfW);
        posAttr.setXYZ(i * 2 + 1, p.x + rightX * halfW, p.y, p.z + rightZ * halfW);
      }
      posAttr.needsUpdate = true;
      ribbon.geo.computeBoundingSphere();
    };

    if (!trailInitRef.current) {
      trailInitRef.current = true;
      for (let i = 0; i < TRAIL_SEGMENTS; i++) {
        tailTrail.history[i].set(tailWorldX - fwdX * i * 0.45, tailWorldY, tailWorldZ - fwdZ * i * 0.45);
        leftTipTrail.history[i].set(leftTipX - fwdX * i * 0.45, leftTipY, leftTipZ - fwdZ * i * 0.45);
        rightTipTrail.history[i].set(rightTipX - fwdX * i * 0.45, rightTipY, rightTipZ - fwdZ * i * 0.45);
      }
    }

    updateRibbon(tailTrail, tailWorldX, tailWorldY, tailWorldZ, 0.13);
    updateRibbon(leftTipTrail, leftTipX, leftTipY, leftTipZ, 0.055);
    updateRibbon(rightTipTrail, rightTipX, rightTipY, rightTipZ, 0.055);

    for (let i = 0; i < VILLAGE_LANDMARKS.length; i++) {
      const lm = VILLAGE_LANDMARKS[i];
      const d = Math.hypot(pos.x - lm.x, pos.z - lm.z);
      if (d < 22.0) {
        onDiscoverLandmark(lm.id);
        break;
      }
    }

    for (let i = 0; i < SKY_RINGS.length; i++) {
      const ring = SKY_RINGS[i];
      if (collectedRings.includes(ring.id)) continue;
      const d3 = Math.hypot(pos.x - ring.x, pos.y - ring.y, pos.z - ring.z);
      if (d3 < 4.5) {
        onCollectRing(ring.id);
      }
    }
  });

  const isNightOrEvening = skyMood === 'starry-night' || skyMood === 'evening-sunset';

  return (
    <>
      <group
        ref={planeRootRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('Sora’s Vintage Meadow Biplane • Press F for Barrel Roll');
        }}
        onPointerOut={() => onHover(null)}
      >
        <group ref={airframeBankRef}>
          {/* --- UPPER CAMBERED WING + HAND-DRAWN INK OUTLINE & NAV LIGHTS --- */}
          <group position={[0, 0.54, 0.08]}>
            <mesh
              geometry={geometries.upperWing}
              material={materials.wingFabric}
              castShadow
              receiveShadow
            />
            <mesh
              geometry={geometries.upperWingOutline}
              material={materials.inkOutline}
            />
            {/* Port Red & Starboard Green Navigation Wingtip Lights */}
            <mesh position={[-2.32, 0.06, 0.05]} material={materials.navLightRed}>
              <sphereGeometry args={[0.055, 8, 8]} />
            </mesh>
            <mesh position={[2.32, 0.06, 0.05]} material={materials.navLightGreen}>
              <sphereGeometry args={[0.055, 8, 8]} />
            </mesh>
          </group>

          {/* --- LOWER CAMBERED WING + HAND-DRAWN INK OUTLINE --- */}
          <group position={[0, -0.22, 0.02]}>
            <mesh
              geometry={geometries.lowerWing}
              material={materials.wingFabric}
              castShadow
              receiveShadow
            />
            <mesh
              geometry={geometries.lowerWingOutline}
              material={materials.inkOutline}
            />
          </group>

          {/* --- INTERPLANE N-STRUTS & CABANE STRUTS --- */}
          {[-1.52, 1.52].map((sx) => (
            <group key={`wing-struts-${sx}`} position={[sx, 0.16, 0.05]}>
              <mesh position={[0, 0, 0.24]} material={materials.strutDark} castShadow>
                <cylinderGeometry args={[0.022, 0.022, 0.78, 8]} />
              </mesh>
              <mesh position={[0, 0, -0.24]} material={materials.strutDark} castShadow>
                <cylinderGeometry args={[0.022, 0.022, 0.78, 8]} />
              </mesh>
              <mesh
                position={[0, 0, 0]}
                rotation={[0.56, 0, 0]}
                material={materials.strutDark}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.90, 6]} />
              </mesh>
            </group>
          ))}

          {[-0.30, 0.30].map((cx) => (
            <group key={`cabane-${cx}`} position={[cx, 0.34, 0.12]}>
              <mesh
                position={[0, 0, 0.16]}
                rotation={[0, 0, cx > 0 ? 0.18 : -0.18]}
                material={materials.strutDark}
              >
                <cylinderGeometry args={[0.018, 0.018, 0.44, 6]} />
              </mesh>
              <mesh
                position={[0, 0, -0.16]}
                rotation={[0, 0, cx > 0 ? 0.18 : -0.18]}
                material={materials.strutDark}
              >
                <cylinderGeometry args={[0.018, 0.018, 0.44, 6]} />
              </mesh>
            </group>
          ))}

          {/* Cross-Bracing Rigging Wires */}
          <mesh
            position={[-0.92, 0.16, 0.24]}
            rotation={[0, 0, Math.PI * 0.5 - 0.52]}
            material={materials.strutDark}
          >
            <cylinderGeometry args={[0.006, 0.006, 1.38, 4]} />
          </mesh>
          <mesh
            position={[0.92, 0.16, 0.24]}
            rotation={[0, 0, Math.PI * 0.5 + 0.52]}
            material={materials.strutDark}
          >
            <cylinderGeometry args={[0.006, 0.006, 1.38, 4]} />
          </mesh>

          {/* --- SLEEK CONTINUOUS TAPERED FUSELAGE + HAND-INKED OUTLINE --- */}
          <group position={[0, -0.02, -0.58]}>
            <mesh
              geometry={geometries.fuselage}
              material={materials.fuselageCream}
              castShadow
            />
            <mesh
              geometry={geometries.fuselageOutline}
              material={materials.inkOutline}
            />
          </group>

          {/* Forward Dark Olive-Charcoal Engine Cowling */}
          <mesh position={[0, -0.01, 1.05]} material={materials.cowlingDarkOlive} castShadow>
            <boxGeometry args={[0.58, 0.54, 0.72]} />
          </mesh>
          <mesh position={[0, -0.01, 1.05]} material={materials.inkOutline}>
            <boxGeometry args={[0.63, 0.59, 0.77]} />
          </mesh>

          {/* Signature White Top/Nose Radiator Panel on Cowling */}
          <mesh position={[0, 0.14, 1.08]} material={materials.noseWhitePanel} castShadow>
            <boxGeometry args={[0.42, 0.28, 0.68]} />
          </mesh>
          <mesh position={[0, -0.02, 1.42]} material={materials.strutDark}>
            <boxGeometry args={[0.38, 0.36, 0.04]} />
          </mesh>

          {/* Evening & Night Forward Aviator Headlamp Beam */}
          {isNightOrEvening && (
            <mesh
              position={[0, -0.1, 4.8]}
              rotation={[-Math.PI * 0.5, 0, 0]}
              material={materials.headlampCone}
            >
              <coneGeometry args={[1.85, 6.8, 16, 1, true]} />
            </mesh>
          )}

          {/* Twin Spinning Wooden Propeller + Motion-Blur Disc */}
          <group ref={propellerRef} position={[0, -0.01, 1.48]}>
            <mesh rotation={[Math.PI * 0.5, 0, 0]} material={materials.goggleBrass}>
              <coneGeometry args={[0.11, 0.22, 12]} />
            </mesh>
            <mesh rotation={[0, 0, 0.12]} material={materials.propWood}>
              <boxGeometry args={[1.42, 0.13, 0.03]} />
            </mesh>
            <mesh rotation={[0, 0, 0.12]} material={materials.inkOutline}>
              <boxGeometry args={[1.46, 0.16, 0.05]} />
            </mesh>
            <mesh material={materials.propBlur}>
              <circleGeometry args={[0.72, 24]} />
            </mesh>
          </group>

          {/* --- TAILPLANE (HORIZONTAL STABILIZER, ELEVATOR, FIN & RUDDER) --- */}
          <group position={[0, 0.02, -1.84]}>
            <mesh
              geometry={geometries.hStab}
              material={materials.wingFabric}
              castShadow
            />
            <mesh
              geometry={geometries.hStabOutline}
              material={materials.inkOutline}
            />
            <mesh ref={elevatorRef} position={[0, 0, -0.26]} material={materials.wingFabric}>
              <boxGeometry args={[1.45, 0.04, 0.18]} />
            </mesh>

            <group position={[0, 0.34, -0.02]}>
              <mesh
                geometry={geometries.vFin}
                material={materials.wingFabric}
                castShadow
              />
              <mesh
                geometry={geometries.vFinOutline}
                material={materials.inkOutline}
              />
              <mesh ref={rudderRef} position={[0, 0, -0.24]} material={materials.wingFabric}>
                <boxGeometry args={[0.04, 0.58, 0.18]} />
              </mesh>
            </group>
          </group>

          {/* --- UNDERCARRIAGE LANDING GEAR & VINTAGE WHEELS --- */}
          <group position={[0, -0.52, 0.62]}>
            <mesh position={[-0.28, 0.14, 0]} rotation={[0, 0, 0.24]} material={materials.strutDark}>
              <cylinderGeometry args={[0.022, 0.022, 0.56, 8]} />
            </mesh>
            <mesh position={[0.28, 0.14, 0]} rotation={[0, 0, -0.24]} material={materials.strutDark}>
              <cylinderGeometry args={[0.022, 0.022, 0.56, 8]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI * 0.5]} material={materials.strutDark}>
              <cylinderGeometry args={[0.02, 0.02, 0.78, 8]} />
            </mesh>
            {[-0.38, 0.38].map((wx) => (
              <group key={`wheel-${wx}`} position={[wx, -0.04, 0]}>
                <mesh rotation={[0, 0, Math.PI * 0.5]} material={materials.cowlingDarkOlive} castShadow>
                  <cylinderGeometry args={[0.19, 0.19, 0.09, 16]} />
                </mesh>
                <mesh rotation={[0, 0, Math.PI * 0.5]} material={materials.noseWhitePanel}>
                  <cylinderGeometry args={[0.11, 0.11, 0.10, 12]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* --- OPEN COCKPIT & ARTICULATED AVIATOR PILOT "SORA" --- */}
          <group position={[0, 0.24, -0.28]}>
            <mesh material={materials.leatherBrown}>
              <boxGeometry args={[0.44, 0.12, 0.52]} />
            </mesh>
            <mesh position={[0, 0.12, 0.24]} rotation={[-0.45, 0, 0]} material={materials.goggleGlass}>
              <boxGeometry args={[0.34, 0.18, 0.03]} />
            </mesh>
            <mesh position={[0, 0.12, -0.02]} material={materials.leatherBrown} castShadow>
              <boxGeometry args={[0.32, 0.24, 0.24]} />
            </mesh>

            {/* Articulated Pilot Head looking into turns */}
            <group ref={pilotHeadRef} position={[0, 0.32, 0.0]}>
              <mesh material={materials.leatherBrown} castShadow>
                <sphereGeometry args={[0.15, 14, 12]} />
              </mesh>
              <mesh position={[-0.055, 0.03, 0.13]} material={materials.goggleBrass}>
                <cylinderGeometry args={[0.045, 0.045, 0.04, 10]} />
              </mesh>
              <mesh position={[0.055, 0.03, 0.13]} material={materials.goggleBrass}>
                <cylinderGeometry args={[0.045, 0.045, 0.04, 10]} />
              </mesh>
              <mesh position={[-0.055, 0.03, 0.145]} material={materials.goggleGlass}>
                <sphereGeometry args={[0.036, 8, 8]} />
              </mesh>
              <mesh position={[0.055, 0.03, 0.145]} material={materials.goggleGlass}>
                <sphereGeometry args={[0.036, 8, 8]} />
              </mesh>
            </group>

            {/* Multi-Segment Fluttering White Silk Aviator Scarf */}
            <group ref={scarfGroupRef} position={[0, 0.22, -0.14]}>
              <mesh position={[0, 0, -0.18]} material={materials.scarfSilk}>
                <boxGeometry args={[0.11, 0.03, 0.38]} />
              </mesh>
              <mesh
                ref={scarfTailRef}
                position={[0.02, 0.02, -0.46]}
                rotation={[0.12, 0.15, 0]}
                material={materials.scarfSilk}
              >
                <boxGeometry args={[0.09, 0.025, 0.34]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 2. UNIFIED CRISP DARK-OLIVE GROUND SHADOW                         */}
      {/* ================================================================= */}
      <group ref={groundShadowGroupRef}>
        <mesh geometry={geometries.unifiedShadow} material={materials.groundShadow} />
        <group ref={shadowPropRef} position={[0, 0.01, 1.54]}>
          <mesh material={materials.groundShadow}>
            <boxGeometry args={[1.38, 0.01, 0.13]} />
          </mesh>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 3. TRIPLE ANIME SKY RIBBONS (TAIL CONTRAIL + DUAL WINGTIP TRAILS) */}
      {/* ================================================================= */}
      <mesh geometry={tailTrail.geo} material={materials.contrailRibbon} frustumCulled={false} />
      <mesh geometry={leftTipTrail.geo} material={materials.wingtipRibbon} frustumCulled={false} />
      <mesh geometry={rightTipTrail.geo} material={materials.wingtipRibbon} frustumCulled={false} />
    </>
  );
}
