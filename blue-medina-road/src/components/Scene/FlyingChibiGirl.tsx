import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  INITIAL_SKY_STARS,
  LANDMARK_ZONES,
  ROAD_END_Z,
  ROAD_START_Z,
  getRoadCenterX,
  getRoadElevationY,
  getRoadHalfWidth,
} from '../../utils/roadPath';
import type { CameraMode, VirtualFlightInput } from '../../hooks/useSceneState';

interface FlyingChibiGirlProps {
  cameraMode: CameraMode;
  autoFly: boolean;
  collectedStars: number[];
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterYawRef: React.MutableRefObject<number>;
  characterSpeedRef: React.MutableRefObject<number>;
  flightAltitudeOffsetRef: React.MutableRefObject<number>;
  flyTargetRef: React.MutableRefObject<THREE.Vector3 | null>;
  waveTimerRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualFlightInput>;
  onClearFlyTarget: () => void;
  onManualMove: () => void;
  onDiscoverZone: (zoneId: string) => void;
  onCollectStar: (starId: number) => void;
  onSelectCharacter: () => void;
  onHover: (label: string | null) => void;
}

// Pre-allocated module-scope scratch vectors for zero GC allocations in useFrame
const _desiredDir = new THREE.Vector2();
const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _relTrail = new THREE.Vector3();

export default function FlyingChibiGirl({
  cameraMode,
  autoFly,
  collectedStars,
  characterPosRef,
  characterYawRef,
  characterSpeedRef,
  flightAltitudeOffsetRef,
  flyTargetRef,
  waveTimerRef,
  virtualInputRef,
  onClearFlyTarget,
  onManualMove,
  onDiscoverZone,
  onCollectStar,
  onSelectCharacter,
  onHover,
}: FlyingChibiGirlProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyTiltRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const ahogeRef = useRef<THREE.Group>(null);
  const hairStrandsRef = useRef<THREE.Group>(null);
  const sideWingsLeftRef = useRef<THREE.Group>(null);
  const sideWingsRightRef = useRef<THREE.Group>(null);
  const leftEyeBlinkRef = useRef<THREE.Group>(null);
  const rightEyeBlinkRef = useRef<THREE.Group>(null);
  const mouthGroupRef = useRef<THREE.Group>(null);
  const leftSleeveRef = useRef<THREE.Group>(null);
  const rightSleeveRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const swordRef = useRef<THREE.Group>(null);
  const faceSparkleRef = useRef<THREE.Group>(null);
  const groundHaloRef = useRef<THREE.Group>(null);
  const trailParticlesRef = useRef<THREE.Group>(null);
  const ribbonLeftRef = useRef<THREE.Mesh>(null);
  const ribbonRightRef = useRef<THREE.Mesh>(null);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const velocityRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const autoFlyDirectionRef = useRef<-1 | 1>(-1); // -1 = flying up the road (-Z), +1 = returning
  const smoothPitchRef = useRef<number>(0.04);
  const smoothRollRef = useRef<number>(0);
  const flightPhaseRef = useRef<number>(0);
  const lastZoneIdRef = useRef<string>('');

  // Trail history ring buffer for magical sparkle wake
  const trailHistoryRef = useRef<THREE.Vector3[]>(
    Array.from({ length: 12 }, () => new THREE.Vector3(0, 1, 1.4))
  );
  const trailTimerRef = useRef<number>(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'e', 'q', 'c'].includes(
          k
        )
      ) {
        waveTimerRef.current = 0;
        onManualMove();
      }
      if (k === 'f') {
        waveTimerRef.current = 2.6;
      }
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
  }, [onManualMove, waveTimerRef]);

  // Shared High-Clarity Anime Cel-Inspired Materials for Lumina
  const materials = useMemo(() => {
    const skinCream = '#FFF4EC';
    const blushColor = '#F48B82';
    const blushLineColor = '#D95850';
    const nosePeach = '#DF9B88';
    const mouthCoral = '#EC7672';
    const mouthOutline = '#5A2A26';
    const tonguePink = '#FFA4A4';

    const hairColor = '#46302B';
    const hairDark = '#2E1E1A';
    const hairHighlight = '#8C6254';
    const hairHighlightSoft = '#B88878';

    const tunicColor = '#CBC9BE';
    const tunicTrim = '#A6A498';
    const backpackColor = '#F29586';
    const strapColor = '#C2ADA2';
    const pantsColor = '#DFC5D6';
    const pantsCrease = '#BDA0B3';
    const scabbardColor = '#322726';
    const hiltWrapColor = '#C96242';
    const outlineInk = '#221614';

    // Sparkling Chefchaouen Azure-Sapphire Anime Eye Palette
    const lashInk = '#241614';
    const browInk = '#38221E';
    const irisOuterSapphire = '#143670';
    const irisMidAzure = '#2472DE';
    const irisLowerCyan = '#8AE8FF';
    const pupilDark = '#0A1936';

    return {
      faceMat: new THREE.MeshStandardMaterial({
        color: skinCream,
        roughness: 0.42,
        emissive: '#FFE8D6',
        emissiveIntensity: 0.26,
      }),
      handMat: new THREE.MeshStandardMaterial({
        color: skinCream,
        roughness: 0.45,
        emissive: '#FFE8D6',
        emissiveIntensity: 0.20,
      }),
      hairMat: new THREE.MeshStandardMaterial({
        color: hairColor,
        roughness: 0.48,
        emissive: '#2B1B17',
        emissiveIntensity: 0.14,
        side: THREE.DoubleSide,
      }),
      hairShadowMat: new THREE.MeshStandardMaterial({
        color: hairDark,
        roughness: 0.54,
        emissive: '#1D120F',
        emissiveIntensity: 0.10,
        side: THREE.DoubleSide,
      }),
      hairHighlightMat: new THREE.MeshBasicMaterial({
        color: hairHighlight,
      }),
      hairHighlightSoftMat: new THREE.MeshBasicMaterial({
        color: hairHighlightSoft,
      }),
      tunicMat: new THREE.MeshStandardMaterial({
        color: tunicColor,
        roughness: 0.52,
        emissive: '#9E9C90',
        emissiveIntensity: 0.12,
      }),
      tunicTrimMat: new THREE.MeshStandardMaterial({
        color: tunicTrim,
        roughness: 0.58,
      }),
      backpackMat: new THREE.MeshStandardMaterial({
        color: backpackColor,
        roughness: 0.48,
        emissive: '#D87262',
        emissiveIntensity: 0.14,
      }),
      strapMat: new THREE.MeshStandardMaterial({
        color: strapColor,
        roughness: 0.65,
      }),
      pantsMat: new THREE.MeshStandardMaterial({
        color: pantsColor,
        roughness: 0.54,
        emissive: '#BFA0B4',
        emissiveIntensity: 0.12,
      }),
      pantsCreaseMat: new THREE.MeshStandardMaterial({
        color: pantsCrease,
        roughness: 0.65,
      }),
      scabbardMat: new THREE.MeshStandardMaterial({
        color: scabbardColor,
        roughness: 0.50,
      }),
      tsubaMat: new THREE.MeshStandardMaterial({
        color: '#5A423A',
        roughness: 0.42,
      }),
      hiltWrapMat: new THREE.MeshStandardMaterial({
        color: hiltWrapColor,
        roughness: 0.55,
      }),
      outlineMat: new THREE.MeshBasicMaterial({
        color: outlineInk,
        side: THREE.BackSide,
      }),
      lashMat: new THREE.MeshBasicMaterial({ color: lashInk }),
      browMat: new THREE.MeshBasicMaterial({ color: browInk }),
      scleraMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      irisOuterMat: new THREE.MeshBasicMaterial({ color: irisOuterSapphire }),
      irisMidMat: new THREE.MeshBasicMaterial({ color: irisMidAzure }),
      irisLowerMat: new THREE.MeshBasicMaterial({ color: irisLowerCyan }),
      pupilMat: new THREE.MeshBasicMaterial({ color: pupilDark }),
      catchlightMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      blushMat: new THREE.MeshBasicMaterial({
        color: blushColor,
        transparent: true,
        opacity: 0.78,
      }),
      blushSlashMat: new THREE.MeshBasicMaterial({ color: blushLineColor }),
      noseMat: new THREE.MeshBasicMaterial({ color: nosePeach }),
      mouthMat: new THREE.MeshBasicMaterial({ color: mouthCoral }),
      mouthRingMat: new THREE.MeshBasicMaterial({ color: mouthOutline }),
      tongueMat: new THREE.MeshBasicMaterial({ color: tonguePink }),
      starGoldMat: new THREE.MeshBasicMaterial({
        color: '#FFF6D6',
        transparent: true,
        opacity: 0.88,
      }),
      starCyanMat: new THREE.MeshBasicMaterial({
        color: '#8CE4FF',
        transparent: true,
        opacity: 0.88,
      }),
    };
  }, []);

  // Reusable Sculpted Geometries for Hair Locks, Ahoge, Eyelashes, Brows, Smile & 4-Pointed Stars
  const customGeos = useMemo(() => {
    // Signature curved ahoge (bouncy top hair curl)
    const ahogeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.012, 0.068, 0.018),
      new THREE.Vector3(0.038, 0.132, 0.048),
      new THREE.Vector3(0.092, 0.112, 0.068),
      new THREE.Vector3(0.074, 0.078, 0.056),
    ]);

    // Flowing Anime Side Flyaway Strands
    const leftFlyaway = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.21, 0.08, 0.03),
      new THREE.Vector3(0.28, -0.01, 0.03),
      new THREE.Vector3(0.32, -0.11, 0.02),
      new THREE.Vector3(0.29, -0.20, 0.03),
    ]);
    const leftOuterFlick = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.20, -0.03, 0.01),
      new THREE.Vector3(0.26, -0.13, 0.01),
      new THREE.Vector3(0.34, -0.19, 0.02),
      new THREE.Vector3(0.38, -0.18, 0.03),
    ]);
    const rightFlyaway = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.21, 0.08, 0.03),
      new THREE.Vector3(-0.28, -0.01, 0.03),
      new THREE.Vector3(-0.32, -0.11, 0.02),
      new THREE.Vector3(-0.29, -0.20, 0.03),
    ]);
    const rightOuterFlick = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.20, -0.03, 0.01),
      new THREE.Vector3(-0.26, -0.13, 0.01),
      new THREE.Vector3(-0.34, -0.19, 0.02),
      new THREE.Vector3(-0.38, -0.18, 0.03),
    ]);

    // Bold Anime Upper Eyelash Arch with Winged Outer Corner
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.044, 0.002, -0.004),
      new THREE.Vector3(-0.024, 0.026, 0.004),
      new THREE.Vector3(0, 0.033, 0.007),
      new THREE.Vector3(0.024, 0.026, 0.004),
      new THREE.Vector3(0.046, 0.005, -0.003),
    ]);

    // Delicate Eyelid Crease Above Eye
    const lidCreaseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.032, 0.036, 0.001),
      new THREE.Vector3(0, 0.045, 0.005),
      new THREE.Vector3(0.032, 0.036, 0.001),
    ]);

    // Soft Arched Eyebrow
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.034, -0.003, -0.002),
      new THREE.Vector3(0, 0.009, 0.004),
      new THREE.Vector3(0.034, -0.002, -0.002),
    ]);

    // Happy Anime Smile Arc
    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.028, 0.008, -0.002),
      new THREE.Vector3(-0.014, -0.005, 0.003),
      new THREE.Vector3(0, -0.009, 0.005),
      new THREE.Vector3(0.014, -0.005, 0.003),
      new THREE.Vector3(0.028, 0.008, -0.002),
    ]);

    // Tapered anime hair wing cone
    const wingLockGeo = new THREE.ConeGeometry(0.066, 0.23, 14);
    wingLockGeo.scale(0.68, 1.0, 0.85);

    const bangCapsuleGeo = new THREE.CapsuleGeometry(0.036, 0.09, 8, 12);

    // 4-pointed star geometry (✧)
    const starShape = new THREE.Shape();
    const outer = 0.052;
    const inner = 0.013;
    starShape.moveTo(0, outer);
    starShape.quadraticCurveTo(inner, inner, outer, 0);
    starShape.quadraticCurveTo(inner, -inner, 0, -outer);
    starShape.quadraticCurveTo(-inner, -inner, -outer, 0);
    starShape.quadraticCurveTo(-inner, inner, 0, outer);
    const fourPointStarGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.008,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    });
    fourPointStarGeo.center();

    return {
      ahogeGeo: new THREE.TubeGeometry(ahogeCurve, 16, 0.015, 8, false),
      leftFlyaway: new THREE.TubeGeometry(leftFlyaway, 14, 0.0075, 6, false),
      leftOuterFlick: new THREE.TubeGeometry(leftOuterFlick, 12, 0.013, 7, false),
      rightFlyaway: new THREE.TubeGeometry(rightFlyaway, 14, 0.0075, 6, false),
      rightOuterFlick: new THREE.TubeGeometry(rightOuterFlick, 12, 0.013, 7, false),
      upperLashGeo: new THREE.TubeGeometry(lashCurve, 16, 0.0078, 8, false),
      lidCreaseGeo: new THREE.TubeGeometry(lidCreaseCurve, 10, 0.0026, 6, false),
      eyebrowGeo: new THREE.TubeGeometry(browCurve, 12, 0.0044, 6, false),
      smileArcGeo: new THREE.TubeGeometry(smileCurve, 14, 0.0052, 7, false),
      wingLockGeo,
      bangCapsuleGeo,
      fourPointStarGeo,
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const elapsed = state.clock.getElapsedTime();

    const pos = characterPosRef.current;
    const keys = keysRef.current;
    const vInput = virtualInputRef.current;

    const up = keys['w'] || keys['arrowup'] || vInput.up;
    const down = keys['s'] || keys['arrowdown'] || vInput.down;
    const left = keys['a'] || keys['arrowleft'] || vInput.left;
    const right = keys['d'] || keys['arrowright'] || vInput.right;
    const ascend = keys[' '] || keys['e'] || vInput.ascend;
    const descend = keys['c'] || keys['q'] || vInput.descend;
    const boost = keys['shift'] || vInput.boost;

    if (vInput.wave) {
      waveTimerRef.current = 2.6;
      vInput.wave = false;
    }
    if (waveTimerRef.current > 0) {
      waveTimerRef.current = Math.max(0, waveTimerRef.current - dt);
    }

    // Fast, responsive altitude adjustment (soaring higher or skimming steps)
    if (ascend) {
      flightAltitudeOffsetRef.current = Math.min(
        3.5,
        flightAltitudeOffsetRef.current + dt * 3.4
      );
    }
    if (descend) {
      flightAltitudeOffsetRef.current = Math.max(
        0.58,
        flightAltitudeOffsetRef.current - dt * 3.4
      );
    }

    _desiredDir.set(0, 0);
    let hasInput = false;
    let maxSpeed = boost ? 10.8 : 6.4;

    // 1. Direct Keyboard or On-Screen Flight Pad Input (Camera-relative XZ)
    if (up || down || left || right) {
      if (vInput.up || vInput.down || vInput.left || vInput.right) {
        waveTimerRef.current = 0;
        onManualMove();
      }
      state.camera.getWorldDirection(_camForward);
      _camForward.y = 0;
      if (_camForward.lengthSq() < 0.001) _camForward.set(0, 0, -1);
      _camForward.normalize();

      _camRight.crossVectors(_camForward, _upAxis).normalize();

      let moveX = 0;
      let moveZ = 0;
      if (up) {
        moveX += _camForward.x;
        moveZ += _camForward.z;
      }
      if (down) {
        moveX -= _camForward.x;
        moveZ -= _camForward.z;
      }
      if (right) {
        moveX += _camRight.x;
        moveZ += _camRight.z;
      }
      if (left) {
        moveX -= _camRight.x;
        moveZ -= _camRight.z;
      }

      const len = Math.hypot(moveX, moveZ);
      if (len > 0.001) {
        _desiredDir.set(moveX / len, moveZ / len);
        hasInput = true;
      }
    }
    // 2. Click-to-Fly Destination Navigation along the Blue Road
    else if (flyTargetRef.current) {
      const target = flyTargetRef.current;
      const dx = target.x - pos.x;
      const dz = target.z - pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.28) {
        onClearFlyTarget();
      } else {
        // Follow the road curve smoothly if flying a longer distance
        const aheadZ = pos.z + Math.sign(dz) * Math.min(3.0, dist);
        const guideX = THREE.MathUtils.lerp(getRoadCenterX(aheadZ), target.x, 0.55);
        const sx = dist < 3.8 ? dx : guideX - pos.x;
        const sz = dist < 3.8 ? dz : aheadZ - pos.z;
        const sLen = Math.hypot(sx, sz);
        if (sLen > 0.001) {
          _desiredDir.set(sx / sLen, sz / sLen);
          hasInput = true;
          maxSpeed = boost ? 11.2 : 8.2;
        }
      }
    }
    // 3. Auto-Fly Fantasy Journey along the entire 90m winding road
    else if (autoFly) {
      const dir = autoFlyDirectionRef.current; // -1 up road, +1 down road
      if (dir === -1 && pos.z <= ROAD_END_Z + 2.2) {
        autoFlyDirectionRef.current = 1;
      } else if (dir === 1 && pos.z >= ROAD_START_Z - 1.8) {
        autoFlyDirectionRef.current = -1;
      }

      const lookAheadZ = THREE.MathUtils.clamp(
        pos.z + autoFlyDirectionRef.current * 3.4,
        ROAD_END_Z + 1.2,
        ROAD_START_Z - 0.8
      );
      // Gentle figure-8 weaving along the centerline
      const weaveX = getRoadCenterX(lookAheadZ) + Math.sin(elapsed * 1.1) * 0.42;
      const sx = weaveX - pos.x;
      const sz = lookAheadZ - pos.z;
      const sLen = Math.hypot(sx, sz);
      if (sLen > 0.001) {
        _desiredDir.set(sx / sLen, sz / sLen);
        hasInput = true;
        maxSpeed = boost ? 10.5 : 6.2;
      }
    }

    // Critically-Damped Velocity Interpolation for Snappy, Silky-Smooth Flight
    const targetVx = hasInput ? _desiredDir.x * maxSpeed : 0;
    const targetVz = hasInput ? _desiredDir.y * maxSpeed : 0;
    const accelRate = hasInput ? 24.0 : 18.0;

    velocityRef.current.x = THREE.MathUtils.lerp(
      velocityRef.current.x,
      targetVx,
      Math.min(1, dt * accelRate)
    );
    velocityRef.current.y = THREE.MathUtils.lerp(
      velocityRef.current.y,
      targetVz,
      Math.min(1, dt * accelRate)
    );

    const speed = velocityRef.current.length();
    characterSpeedRef.current = speed;

    // Apply horizontal flight movement & clamp smoothly within the Blue Medina corridor
    if (speed > 0.01) {
      pos.x += velocityRef.current.x * dt;
      pos.z += velocityRef.current.y * dt;
    }

    pos.z = THREE.MathUtils.clamp(pos.z, ROAD_END_Z + 1.0, ROAD_START_Z - 0.2);
    const roadCenter = getRoadCenterX(pos.z);
    const corridorHalfWidth = getRoadHalfWidth(pos.z) - 0.42;
    pos.x = THREE.MathUtils.clamp(
      pos.x,
      roadCenter - corridorHalfWidth,
      roadCenter + corridorHalfWidth
    );

    // Smoothly hover above the ascending painted steps
    const groundY = getRoadElevationY(pos.z);
    const hoverBob =
      Math.sin(elapsed * 2.8) * 0.075 + Math.cos(elapsed * 1.6) * 0.03;
    const targetY = groundY + flightAltitudeOffsetRef.current + hoverBob;
    pos.y = THREE.MathUtils.lerp(pos.y, targetY, Math.min(1, dt * 14.0));

    // Compute yaw rotation & banking roll angle
    let turnRate = 0;
    const isMoving = speed > 0.15;
    if (isMoving) {
      const targetYaw = Math.atan2(velocityRef.current.x, velocityRef.current.y);
      let angleDiff = targetYaw - characterYawRef.current;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      turnRate = angleDiff;
      characterYawRef.current += angleDiff * Math.min(1, dt * 16.0);
      flightPhaseRef.current += dt * (boost ? 13.0 : 8.8);
    } else {
      flightPhaseRef.current += dt * 2.6;
      // When waving while idle or in Painter's Vista mode, face toward the camera so her expressive face & eyes shine!
      if (waveTimerRef.current > 0 || cameraMode === 'vista') {
        const toCamX = state.camera.position.x - pos.x;
        const toCamZ = state.camera.position.z - pos.z;
        const faceCamYaw =
          cameraMode === 'vista' ? 0.14 : Math.atan2(toCamX, toCamZ);
        let diff = faceCamYaw - characterYawRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        characterYawRef.current += diff * Math.min(1, dt * 9.5);
      }
    }

    // Update root transform
    if (rootRef.current) {
      rootRef.current.position.copy(pos);
      rootRef.current.rotation.y = characterYawRef.current;
    }

    // Keep ground wind-halo ring directly on the step surface below her
    if (groundHaloRef.current) {
      groundHaloRef.current.position.y = groundY - pos.y + 0.03;
      groundHaloRef.current.rotation.z = elapsed * 1.4;
      const haloScale = THREE.MathUtils.clamp(
        1.15 - (pos.y - groundY) * 0.16,
        0.45,
        1.15
      );
      groundHaloRef.current.scale.setScalar(haloScale);
    }

    // Check Landmark Zone Discovery along the road
    for (let i = 0; i < LANDMARK_ZONES.length; i++) {
      const zone = LANDMARK_ZONES[i];
      if (pos.z <= zone.zRange[0] && pos.z >= zone.zRange[1]) {
        if (lastZoneIdRef.current !== zone.id) {
          lastZoneIdRef.current = zone.id;
          onDiscoverZone(zone.id);
        }
        break;
      }
    }

    // Check Collectible Sky Stars (✧) proximity
    for (let i = 0; i < INITIAL_SKY_STARS.length; i++) {
      const star = INITIAL_SKY_STARS[i];
      if (!collectedStars.includes(star.id)) {
        const dx = pos.x - star.position[0];
        const dy = pos.y + 0.35 - star.position[1];
        const dz = pos.z - star.position[2];
        if (dx * dx + dy * dy + dz * dz < 1.35 * 1.35) {
          onCollectStar(star.id);
        }
      }
    }

    // =====================================================================
    // PROCEDURAL ANIME EXPRESSIONS, BLINKING, HAIR SPRING & FLIGHT POSES
    // =====================================================================
    const fp = flightPhaseRef.current;
    const isWaving = waveTimerRef.current > 0;
    const normSpeed = THREE.MathUtils.clamp(speed / 6.4, 0, 1.7);

    // 1. Expressive Anime Eye Blinking every ~3.5 seconds
    const blinkCycle = elapsed % 3.5;
    const blinkScaleY =
      blinkCycle > 3.34
        ? Math.max(0.08, Math.abs((blinkCycle - 3.42) / 0.08))
        : 1.0;
    if (leftEyeBlinkRef.current && rightEyeBlinkRef.current) {
      leftEyeBlinkRef.current.scale.y = blinkScaleY;
      rightEyeBlinkRef.current.scale.y = blinkScaleY;
    }

    // 2. Cheerful Anime Mouth Breathing & Excited Wave/Boost Expression
    if (mouthGroupRef.current) {
      const mouthExcite =
        isWaving || boost ? 1.25 : 1.0 + Math.sin(elapsed * 3.2) * 0.08;
      mouthGroupRef.current.scale.set(mouthExcite, mouthExcite, 1);
    }

    // 3. Aerodynamic Body Tilt & Turn Banking (kept gentle so head/face stay proud!)
    const targetPitch = isMoving ? (boost ? 0.28 : 0.16) : 0.02;
    const targetRoll = isMoving
      ? THREE.MathUtils.clamp(-turnRate * 0.42, -0.32, 0.32)
      : Math.sin(elapsed * 1.6) * 0.028;

    smoothPitchRef.current = THREE.MathUtils.lerp(
      smoothPitchRef.current,
      targetPitch,
      Math.min(1, dt * 10.0)
    );
    smoothRollRef.current = THREE.MathUtils.lerp(
      smoothRollRef.current,
      targetRoll,
      Math.min(1, dt * 10.0)
    );

    if (bodyTiltRef.current) {
      bodyTiltRef.current.rotation.x = smoothPitchRef.current;
      bodyTiltRef.current.rotation.z = smoothRollRef.current;
    }

    // 4. Head counter-tilts upward so her sparkling eyes, blush & smile stay upright and visible
    if (headRef.current) {
      headRef.current.rotation.x =
        -smoothPitchRef.current * 0.85 + Math.sin(fp * 1.2) * 0.028;
      headRef.current.rotation.z =
        -0.035 + Math.cos(fp * 0.9) * 0.026 - smoothRollRef.current * 0.35;
    }

    // 5. Bouncy top ahoge curl & feathered side hair wings sway in the slipstream
    if (ahogeRef.current) {
      ahogeRef.current.rotation.x =
        -smoothPitchRef.current * 0.5 + Math.sin(fp * 2.4) * 0.16;
      ahogeRef.current.rotation.z = Math.cos(fp * 2.0) * 0.18;
    }
    if (hairStrandsRef.current) {
      hairStrandsRef.current.rotation.z =
        Math.sin(elapsed * 3.8 + fp * 0.5) * 0.06 + normSpeed * 0.065;
      hairStrandsRef.current.rotation.y =
        -smoothRollRef.current * 0.45 + Math.cos(elapsed * 2.8) * 0.035;
    }
    if (sideWingsLeftRef.current && sideWingsRightRef.current) {
      const wingFlutter =
        Math.sin(elapsed * 3.5 + fp) * 0.05 + normSpeed * 0.07;
      sideWingsLeftRef.current.rotation.z = wingFlutter;
      sideWingsRightRef.current.rotation.z = -wingFlutter;
    }

    // 6. Wide bell sleeves trail like wings during flight, or wave cheerfully when greeting!
    if (leftSleeveRef.current && rightSleeveRef.current) {
      const wingSpread = isMoving ? (boost ? 0.58 : 0.42) : 0.32;
      const flutter = Math.sin(fp * 2.2) * 0.075;
      leftSleeveRef.current.rotation.z = -wingSpread - flutter;
      leftSleeveRef.current.rotation.x = -smoothPitchRef.current * 0.5;

      if (isWaving && !isMoving) {
        const waveOsc = Math.sin(elapsed * 9.5) * 0.26;
        rightSleeveRef.current.rotation.z = THREE.MathUtils.lerp(
          rightSleeveRef.current.rotation.z,
          2.15 + waveOsc,
          Math.min(1, dt * 12)
        );
        rightSleeveRef.current.rotation.x = THREE.MathUtils.lerp(
          rightSleeveRef.current.rotation.x,
          0.15,
          Math.min(1, dt * 12)
        );
      } else {
        rightSleeveRef.current.rotation.z = THREE.MathUtils.lerp(
          rightSleeveRef.current.rotation.z,
          wingSpread + flutter,
          Math.min(1, dt * 10)
        );
        rightSleeveRef.current.rotation.x = -smoothPitchRef.current * 0.5;
      }
    }

    // 7. Dangling legs & bare feet sway gently in mid-air
    if (leftLegRef.current && rightLegRef.current) {
      const swayA = Math.sin(fp * 1.5) * 0.12;
      const swayB = Math.cos(fp * 1.5) * 0.12;
      const trailAngle = isMoving ? -0.28 : -0.10;
      leftLegRef.current.rotation.x = trailAngle + swayA;
      rightLegRef.current.rotation.x = trailAngle + swayB;
    }

    // 8. Sheathed sword gentle aerodynamic sway
    if (swordRef.current) {
      swordRef.current.rotation.z = 0.28 + Math.sin(fp * 1.8) * 0.04;
    }

    // 9. Floating 4-pointed star sparkle (✧) beside her cheek
    if (faceSparkleRef.current) {
      faceSparkleRef.current.position.y = 0.72 + Math.sin(elapsed * 4.2) * 0.035;
      faceSparkleRef.current.rotation.y = elapsed * 1.8;
      const pulse = 0.92 + Math.sin(elapsed * 5.5) * 0.22;
      faceSparkleRef.current.scale.setScalar(pulse);
    }

    // 10. Wind-spirit ribbons streaming behind her coral backpack
    if (ribbonLeftRef.current && ribbonRightRef.current) {
      const ribbonOpacity = isMoving ? (boost ? 0.82 : 0.55) : 0.25;
      const ribbonScaleY = isMoving ? (boost ? 1.75 : 1.2) : 0.58;
      ribbonLeftRef.current.scale.set(1, ribbonScaleY, 1);
      ribbonRightRef.current.scale.set(1, ribbonScaleY, 1);
      ribbonLeftRef.current.rotation.z = Math.sin(elapsed * 6.5) * 0.18;
      ribbonRightRef.current.rotation.z = -Math.sin(elapsed * 6.5 + 1.2) * 0.18;
      (ribbonLeftRef.current.material as THREE.MeshBasicMaterial).opacity = ribbonOpacity;
      (ribbonRightRef.current.material as THREE.MeshBasicMaterial).opacity = ribbonOpacity;
    }

    // 11. Zero-allocation world-space sparkle trail history
    trailTimerRef.current += dt;
    const hist = trailHistoryRef.current;
    if (trailTimerRef.current > 0.032) {
      trailTimerRef.current = 0;
      for (let i = hist.length - 1; i > 0; i--) {
        hist[i].copy(hist[i - 1]);
      }
      hist[0].set(
        pos.x + Math.sin(elapsed * 9.0) * 0.12,
        pos.y + 0.28 + Math.cos(elapsed * 7.0) * 0.08,
        pos.z
      );
    }

    if (trailParticlesRef.current) {
      const invYaw = -characterYawRef.current;
      const children = trailParticlesRef.current.children;
      for (let idx = 0; idx < children.length; idx++) {
        const child = children[idx];
        const pt = hist[Math.min(idx + 1, hist.length - 1)];
        _relTrail.copy(pt).sub(pos).applyAxisAngle(_upAxis, invYaw);
        child.position.copy(_relTrail);
        child.rotation.y = elapsed * 3.0 + idx;
        child.rotation.z = elapsed * 2.0;
        const fade = (1 - idx / hist.length) * (isMoving ? 1.15 : 0.55);
        child.scale.setScalar(Math.max(0.01, fade));
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, 1.1, 1.4]}>
      {/* Single lightweight invisible hit cylinder for pointer hover/click */}
      <mesh
        position={[0, 0.48, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(
            'Lumina (Sky Wanderer) — Fly: WASD / Arrows • Boost: Shift • Wave: F • Altitude: Space / C'
          );
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          waveTimerRef.current = 2.6;
          onSelectCharacter();
        }}
      >
        <cylinderGeometry args={[0.3, 0.3, 1.05, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* ========================================================= */}
      {/* 0. GROUND CELESTIAL WIND HALO & SPARKLE WAKE TRAIL        */}
      {/* ========================================================= */}
      <group ref={groundHaloRef} position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.24, 0.31, 28]} />
          <meshBasicMaterial
            color="#8ce0ff"
            transparent
            opacity={0.68}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[0.22, 20]} />
          <meshBasicMaterial color="#0b2e78" transparent opacity={0.22} />
        </mesh>
      </group>

      {/* Trailing 4-Pointed Star Sparkles (✧) in Wake */}
      <group ref={trailParticlesRef}>
        {Array.from({ length: 12 }).map((_, idx) => (
          <mesh
            key={idx}
            geometry={customGeos.fourPointStarGeo}
            material={idx % 2 === 0 ? materials.starGoldMat : materials.starCyanMat}
          />
        ))}
      </group>

      {/* Soft Front & Rim Fill Lights so Lumina's Face, Azure Eyes & Hair Highlights Pop Vibrantly */}
      <pointLight position={[0, 0.88, 0.68]} color="#fffaf2" intensity={1.05} distance={4.0} />
      <pointLight position={[0, 0.82, -0.52]} color="#a8e4ff" intensity={0.65} distance={3.5} />

      {/* ========================================================= */}
      {/* MAIN LEVITATING & BANKING CHARACTER BODY GROUP            */}
      {/* ========================================================= */}
      <group ref={bodyTiltRef}>
        {/* ===================================================== */}
        {/* 1. DANGLING WIDE LAVENDER PANTS & BARE FEET           */}
        {/* ===================================================== */}
        <group position={[0, 0.22, 0]}>
          {/* Left Side Wide Cropped Lavender Pant Leg (+X) */}
          <group ref={leftLegRef} position={[0.075, 0.04, 0]}>
            <mesh
              position={[0, -0.09, 0]}
              material={materials.pantsMat}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.078, 0.112, 0.19, 16]} />
            </mesh>
            <mesh
              position={[0.02, -0.09, 0.098]}
              rotation={[0, 0, -0.08]}
              material={materials.pantsCreaseMat}
            >
              <boxGeometry args={[0.012, 0.15, 0.01]} />
            </mesh>
            {/* Dangling Relaxed Bare Foot */}
            <mesh
              position={[0, -0.21, 0.025]}
              rotation={[0.48, 0, 0]}
              scale={[0.82, 0.62, 1.35]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.046, 12, 12]} />
            </mesh>
          </group>

          {/* Right Side Wide Cropped Lavender Pant Leg (-X) */}
          <group ref={rightLegRef} position={[-0.075, 0.04, 0]}>
            <mesh
              position={[0, -0.09, 0]}
              material={materials.pantsMat}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.078, 0.112, 0.19, 16]} />
            </mesh>
            <mesh
              position={[-0.02, -0.09, 0.098]}
              rotation={[0, 0, 0.08]}
              material={materials.pantsCreaseMat}
            >
              <boxGeometry args={[0.012, 0.15, 0.01]} />
            </mesh>
            {/* Dangling Relaxed Bare Foot */}
            <mesh
              position={[0, -0.21, 0.025]}
              rotation={[0.52, 0, 0]}
              scale={[0.82, 0.62, 1.35]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.046, 12, 12]} />
            </mesh>
          </group>
        </group>

        {/* ===================================================== */}
        {/* 2. OVERSIZED SAGE-GREY TUNIC TOP & CORAL BACKPACK     */}
        {/* ===================================================== */}
        <group position={[0, 0.39, 0]}>
          {/* Flared Oversized Sage-Grey Tunic Torso */}
          <mesh
            position={[0, -0.01, 0]}
            material={materials.tunicMat}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.115, 0.198, 0.27, 22]} />
          </mesh>
          {/* Tunic Cel Outline */}
          <mesh
            position={[0, -0.01, 0]}
            scale={[1.04, 1.02, 1.04]}
            material={materials.outlineMat}
          >
            <cylinderGeometry args={[0.115, 0.198, 0.27, 18]} />
          </mesh>

          {/* Rounded Soft Collar Neckline Trim & Ivory Neck */}
          <mesh
            position={[0, 0.125, 0.01]}
            rotation={[Math.PI / 2 + 0.08, 0, 0]}
            material={materials.tunicTrimMat}
          >
            <torusGeometry args={[0.105, 0.018, 10, 22]} />
          </mesh>
          <mesh position={[0, 0.155, 0.01]} material={materials.faceMat}>
            <cylinderGeometry args={[0.054, 0.06, 0.055, 14]} />
          </mesh>

          {/* Coral-Pink Puffy Backpack / Satchel on Her Back */}
          <group position={[0, 0.01, -0.145]}>
            <mesh
              scale={[1.05, 1.15, 0.88]}
              material={materials.backpackMat}
              castShadow
              receiveShadow
            >
              <sphereGeometry args={[0.125, 18, 16]} />
            </mesh>
            <mesh
              scale={[1.11, 1.21, 0.94]}
              material={materials.outlineMat}
            >
              <sphereGeometry args={[0.125, 14, 12]} />
            </mesh>
            {/* Shoulder Straps Wrapping Over Tunic */}
            <mesh
              position={[-0.055, 0.03, 0.105]}
              rotation={[0.35, 0.2, -0.45]}
              material={materials.strapMat}
              castShadow
            >
              <boxGeometry args={[0.026, 0.22, 0.025]} />
            </mesh>
            <mesh
              position={[0.055, 0.03, 0.105]}
              rotation={[0.35, -0.2, 0.45]}
              material={materials.strapMat}
              castShadow
            >
              <boxGeometry args={[0.026, 0.22, 0.025]} />
            </mesh>

            {/* Streaming Sky-Spirit Wind Ribbons Trailing Behind Backpack */}
            <mesh
              ref={ribbonLeftRef}
              position={[-0.06, -0.04, -0.28]}
              rotation={[Math.PI / 2 - 0.2, 0, 0]}
            >
              <planeGeometry args={[0.055, 0.62]} />
              <meshBasicMaterial
                color="#d6f4ff"
                transparent
                opacity={0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh
              ref={ribbonRightRef}
              position={[0.06, -0.04, -0.28]}
              rotation={[Math.PI / 2 - 0.2, 0, 0]}
            >
              <planeGeometry args={[0.055, 0.62]} />
              <meshBasicMaterial
                color="#fff6d8"
                transparent
                opacity={0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* Right Side Wide Bell Sleeve + Cute Tiny Chibi Hand (+X) */}
          <group ref={rightSleeveRef} position={[0.115, 0.09, 0.01]}>
            <mesh
              position={[0.045, -0.095, 0.01]}
              rotation={[0.08, 0, 0.36]}
              scale={[0.92, 1.12, 1.12]}
              material={materials.tunicMat}
              castShadow
            >
              <coneGeometry args={[0.102, 0.22, 16]} />
            </mesh>
            <mesh
              position={[0.075, -0.195, 0.022]}
              scale={[1.08, 0.85, 0.9]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.036, 12, 12]} />
            </mesh>
          </group>

          {/* Left Side Wide Bell Sleeve + Cute Tiny Chibi Hand (-X) */}
          <group ref={leftSleeveRef} position={[-0.115, 0.09, 0.01]}>
            <mesh
              position={[-0.045, -0.095, 0.01]}
              rotation={[0.08, 0, -0.36]}
              scale={[0.92, 1.12, 1.12]}
              material={materials.tunicMat}
              castShadow
            >
              <coneGeometry args={[0.102, 0.22, 16]} />
            </mesh>
            <mesh
              position={[-0.075, -0.195, 0.022]}
              scale={[1.08, 0.85, 0.9]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.036, 12, 12]} />
            </mesh>
          </group>
        </group>

        {/* ===================================================== */}
        {/* 3. DIAGONAL DARK SWORD & TERRACOTTA HILT              */}
        {/* ===================================================== */}
        <group
          ref={swordRef}
          position={[-0.06, 0.28, -0.02]}
          rotation={[-0.34, 0.18, 0.15]}
        >
          <mesh
            position={[0, 0, -0.14]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.scabbardMat}
            castShadow
          >
            <cylinderGeometry args={[0.026, 0.014, 0.68, 12]} />
          </mesh>
          <mesh
            position={[0, 0, -0.51]}
            rotation={[-Math.PI / 2, 0, 0]}
            material={materials.scabbardMat}
            castShadow
          >
            <coneGeometry args={[0.014, 0.07, 10]} />
          </mesh>
          <mesh position={[0, 0, 0.21]} material={materials.tsubaMat}>
            <cylinderGeometry args={[0.044, 0.044, 0.014, 14]} />
          </mesh>
          <mesh
            position={[0, 0, 0.28]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.hiltWrapMat}
            castShadow
          >
            <cylinderGeometry args={[0.022, 0.024, 0.13, 12]} />
          </mesh>
        </group>

        {/* =============================================================== */}
        {/* 4. ANIME CHIBI HEAD: SPARKLING AZURE EYES, BLUSH, SMILE & HAIR  */}
        {/* =============================================================== */}
        <group ref={headRef} position={[0, 0.72, 0.02]}>
          {/* Smooth Porcelain-Peach Chibi Head */}
          <mesh
            position={[0, 0, 0]}
            scale={[1.14, 0.98, 1.02]}
            material={materials.faceMat}
            castShadow
          >
            <sphereGeometry args={[0.216, 32, 28]} />
          </mesh>
          {/* Crisp Anime Head Cel Outline */}
          <mesh
            position={[0, 0, 0]}
            scale={[1.175, 1.01, 1.05]}
            material={materials.outlineMat}
          >
            <sphereGeometry args={[0.216, 26, 22]} />
          </mesh>

          {/* Plump Anime Lower Cheeks (clear of eyes & blush!) */}
          <mesh
            position={[0.094, -0.048, 0.105]}
            scale={[1.12, 0.86, 1.01]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.106, 16, 14]} />
          </mesh>
          <mesh
            position={[-0.094, -0.048, 0.105]}
            scale={[1.12, 0.86, 1.01]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.106, 16, 14]} />
          </mesh>

          {/* Cute Rounded Chibi Ears */}
          <mesh
            position={[0.238, -0.01, 0.005]}
            scale={[0.45, 0.82, 0.62]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.046, 12, 12]} />
          </mesh>
          <mesh
            position={[-0.238, -0.01, 0.005]}
            scale={[0.45, 0.82, 0.62]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.046, 12, 12]} />
          </mesh>

          {/* ============================================================= */}
          {/* BIG SPARKLING AZURE-STARLIGHT ANIME EYES (100% Visible!)      */}
          {/* ============================================================= */}
          {/* Left Side Eye (+X) */}
          <group
            ref={leftEyeBlinkRef}
            position={[0.082, 0.008, 0.212]}
            rotation={[0.02, 0.28, 0]}
          >
            {/* Crisp White Sclera Cushion */}
            <mesh scale={[1.10, 1.16, 0.25]} material={materials.scleraMat}>
              <sphereGeometry args={[0.041, 20, 16]} />
            </mesh>
            {/* Outer Deep Sapphire Iris Ring */}
            <mesh
              position={[-0.002, -0.001, 0.004]}
              scale={[0.98, 1.12, 0.25]}
              material={materials.irisOuterMat}
            >
              <sphereGeometry args={[0.034, 20, 16]} />
            </mesh>
            {/* Middle Rich Chefchaouen Azure Iris */}
            <mesh
              position={[-0.002, -0.003, 0.007]}
              scale={[0.94, 1.06, 0.24]}
              material={materials.irisMidMat}
            >
              <sphereGeometry args={[0.029, 18, 14]} />
            </mesh>
            {/* Glowing Sky-Cyan Lower Iris Crescent */}
            <mesh
              position={[-0.002, -0.012, 0.010]}
              scale={[1.04, 0.62, 0.22]}
              material={materials.irisLowerMat}
            >
              <sphereGeometry args={[0.024, 16, 12]} />
            </mesh>
            {/* Deep Midnight Central Pupil */}
            <mesh
              position={[-0.002, 0.002, 0.011]}
              scale={[0.92, 1.08, 0.24]}
              material={materials.pupilMat}
            >
              <sphereGeometry args={[0.0165, 14, 12]} />
            </mesh>
            {/* Big Glossy White Upper-Inner Catchlight + Lower Sparkle Dots */}
            <mesh position={[-0.011, 0.014, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0102, 12, 12]} />
            </mesh>
            <mesh position={[0.012, -0.012, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.005, 8, 8]} />
            </mesh>
            <mesh position={[-0.004, -0.018, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0034, 8, 8]} />
            </mesh>
            {/* Bold Winged Upper Eyelash Arch */}
            <mesh
              geometry={customGeos.upperLashGeo}
              material={materials.lashMat}
              position={[0, 0.008, 0.008]}
              rotation={[0, 0, -0.05]}
            />
            {/* Upper Eyelash Spikes */}
            <mesh
              position={[0.035, 0.025, 0.006]}
              rotation={[0, 0, -0.58]}
              material={materials.lashMat}
            >
              <coneGeometry args={[0.0058, 0.021, 5]} />
            </mesh>
            <mesh
              position={[0.015, 0.037, 0.007]}
              rotation={[0, 0, -0.22]}
              material={materials.lashMat}
            >
              <coneGeometry args={[0.0048, 0.015, 5]} />
            </mesh>
            {/* Delicate Upper Eyelid Crease */}
            <mesh
              geometry={customGeos.lidCreaseGeo}
              material={materials.lashMat}
              position={[0, 0.006, 0.005]}
            />
          </group>

          {/* Right Side Eye (-X) */}
          <group
            ref={rightEyeBlinkRef}
            position={[-0.082, 0.010, 0.212]}
            rotation={[0.02, -0.28, 0]}
          >
            {/* Crisp White Sclera Cushion */}
            <mesh scale={[1.10, 1.16, 0.25]} material={materials.scleraMat}>
              <sphereGeometry args={[0.041, 20, 16]} />
            </mesh>
            {/* Outer Deep Sapphire Iris Ring */}
            <mesh
              position={[0.002, -0.001, 0.004]}
              scale={[0.98, 1.12, 0.25]}
              material={materials.irisOuterMat}
            >
              <sphereGeometry args={[0.034, 20, 16]} />
            </mesh>
            {/* Middle Rich Chefchaouen Azure Iris */}
            <mesh
              position={[0.002, -0.003, 0.007]}
              scale={[0.94, 1.06, 0.24]}
              material={materials.irisMidMat}
            >
              <sphereGeometry args={[0.029, 18, 14]} />
            </mesh>
            {/* Glowing Sky-Cyan Lower Iris Crescent */}
            <mesh
              position={[0.002, -0.012, 0.010]}
              scale={[1.04, 0.62, 0.22]}
              material={materials.irisLowerMat}
            >
              <sphereGeometry args={[0.024, 16, 12]} />
            </mesh>
            {/* Deep Midnight Central Pupil */}
            <mesh
              position={[0.002, 0.002, 0.011]}
              scale={[0.92, 1.08, 0.24]}
              material={materials.pupilMat}
            >
              <sphereGeometry args={[0.0165, 14, 12]} />
            </mesh>
            {/* Big Glossy White Catchlights */}
            <mesh position={[-0.011, 0.014, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0102, 12, 12]} />
            </mesh>
            <mesh position={[0.012, -0.012, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.005, 8, 8]} />
            </mesh>
            <mesh position={[0.004, -0.018, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0034, 8, 8]} />
            </mesh>
            {/* Bold Winged Upper Eyelash Arch */}
            <mesh
              geometry={customGeos.upperLashGeo}
              material={materials.lashMat}
              position={[0, 0.008, 0.008]}
              rotation={[0, 0, 0.05]}
            />
            {/* Upper Eyelash Spikes */}
            <mesh
              position={[-0.035, 0.025, 0.006]}
              rotation={[0, 0, 0.58]}
              material={materials.lashMat}
            >
              <coneGeometry args={[0.0058, 0.021, 5]} />
            </mesh>
            <mesh
              position={[-0.015, 0.037, 0.007]}
              rotation={[0, 0, 0.22]}
              material={materials.lashMat}
            >
              <coneGeometry args={[0.0048, 0.015, 5]} />
            </mesh>
            {/* Delicate Upper Eyelid Crease */}
            <mesh
              geometry={customGeos.lidCreaseGeo}
              material={materials.lashMat}
              position={[0, 0.006, 0.005]}
            />
          </group>

          {/* Arched Anime Eyebrows */}
          <mesh
            geometry={customGeos.eyebrowGeo}
            material={materials.browMat}
            position={[0.082, 0.068, 0.205]}
            rotation={[0.08, 0.28, -0.08]}
          />
          <mesh
            geometry={customGeos.eyebrowGeo}
            material={materials.browMat}
            position={[-0.082, 0.070, 0.205]}
            rotation={[0.08, -0.28, 0.08]}
          />

          {/* Tiny Delicate 3D Peach Anime Dot Nose */}
          <mesh
            position={[0, -0.013, 0.224]}
            scale={[1.08, 0.90, 0.82]}
            material={materials.noseMat}
          >
            <sphereGeometry args={[0.0095, 10, 10]} />
          </mesh>

          {/* Happy Expressive Anime Mouth & Smile */}
          <group ref={mouthGroupRef} position={[0, -0.047, 0.218]}>
            {/* Crisp Upper Smile Arc (◡) */}
            <mesh
              geometry={customGeos.smileArcGeo}
              material={materials.mouthRingMat}
              position={[0, 0.004, 0.004]}
            />
            {/* Cheerful Open Coral-Rose Mouth Cushion */}
            <mesh
              position={[0, -0.003, 0.001]}
              scale={[1.22, 0.82, 0.24]}
              material={materials.mouthMat}
            >
              <sphereGeometry args={[0.016, 14, 12]} />
            </mesh>
            {/* Cute Pink Tongue Highlight */}
            <mesh
              position={[0, -0.007, 0.004]}
              scale={[1.02, 0.52, 0.22]}
              material={materials.tongueMat}
            >
              <sphereGeometry args={[0.012, 12, 10]} />
            </mesh>
          </group>

          {/* Rosy Coral-Peach Cheeks with 3 Diagonal Anime Blush Hash Marks (///) */}
          <group position={[0.128, -0.030, 0.195]} rotation={[0.06, 0.44, 0]}>
            <mesh scale={[1.22, 0.78, 0.22]} material={materials.blushMat}>
              <sphereGeometry args={[0.040, 16, 12]} />
            </mesh>
            {[-0.013, 0, 0.013].map((ox, i) => (
              <mesh
                key={`blush-l-${i}`}
                position={[ox, 0.002, 0.010]}
                rotation={[0, 0, -0.34]}
                material={materials.blushSlashMat}
              >
                <boxGeometry args={[0.0042, 0.022, 0.002]} />
              </mesh>
            ))}
          </group>

          <group position={[-0.128, -0.028, 0.195]} rotation={[0.06, -0.44, 0]}>
            <mesh scale={[1.22, 0.78, 0.22]} material={materials.blushMat}>
              <sphereGeometry args={[0.040, 16, 12]} />
            </mesh>
            {[-0.013, 0, 0.013].map((ox, i) => (
              <mesh
                key={`blush-r-${i}`}
                position={[ox, 0.002, 0.010]}
                rotation={[0, 0, -0.34]}
                material={materials.blushSlashMat}
              >
                <boxGeometry args={[0.0042, 0.022, 0.002]} />
              </mesh>
            ))}
          </group>

          {/* ============================================================= */}
          {/* LAYERED ESPRESSO-COCOA BOB HAIR (100% OPEN FRONT!) & AHOGE    */}
          {/* ============================================================= */}
          <group position={[0, 0.015, -0.01]}>
            {/* 1. Full Rounded Upper Crown Dome (thetaLength = 0.44 * PI — 100% Clear of Eyes!) */}
            <mesh
              position={[0, 0.050, -0.012]}
              scale={[1.21, 1.03, 1.13]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry
                args={[0.224, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.44]}
              />
            </mesh>
            {/* Crown Cel Outline */}
            <mesh
              position={[0, 0.050, -0.012]}
              scale={[1.25, 1.06, 1.16]}
              material={materials.outlineMat}
            >
              <sphereGeometry
                args={[0.224, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.44]}
              />
            </mesh>

            {/* 2. Warm Cocoa-Caramel Anime Hair Crown Highlights */}
            <mesh
              position={[-0.025, 0.150, 0.166]}
              rotation={[0.45, -0.1, 0.08]}
              scale={[1.35, 0.55, 0.35]}
              material={materials.hairHighlightSoftMat}
            >
              <sphereGeometry args={[0.042, 14, 12]} />
            </mesh>
            <mesh
              position={[0.085, 0.156, 0.146]}
              rotation={[0.42, 0.3, -0.15]}
              scale={[1.1, 0.65, 0.32]}
              material={materials.hairHighlightMat}
            >
              <sphereGeometry args={[0.028, 12, 10]} />
            </mesh>
            <mesh
              position={[-0.105, 0.152, 0.140]}
              rotation={[0.42, -0.3, 0.15]}
              scale={[0.95, 0.6, 0.32]}
              material={materials.hairHighlightMat}
            >
              <sphereGeometry args={[0.024, 12, 10]} />
            </mesh>

            {/* 3. Back & Side Layered Bell-Bob Hair Curtain (Open in Front so Face Shines!) */}
            <mesh
              position={[0, -0.046, -0.028]}
              scale={[1.26, 1.06, 1.12]}
              material={materials.hairMat}
              castShadow
            >
              <cylinderGeometry
                args={[0.205, 0.282, 0.30, 28, 1, false, Math.PI * 0.36, Math.PI * 1.28]}
              />
            </mesh>
            {/* Darker Espresso Inner Hair Shadow Layer */}
            <mesh
              position={[0, -0.060, -0.022]}
              scale={[1.20, 1.04, 1.06]}
              material={materials.hairShadowMat}
            >
              <cylinderGeometry
                args={[0.195, 0.265, 0.29, 24, 1, false, Math.PI * 0.38, Math.PI * 1.24]}
              />
            </mesh>

            {/* Back Skull Closure Sphere */}
            <mesh
              position={[0, 0.012, -0.045]}
              scale={[1.19, 1.02, 1.05]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry
                args={[0.216, 22, 18, Math.PI * 0.34, Math.PI * 1.32, 0, Math.PI * 0.78]}
              />
            </mesh>

            {/* 4. Signature 3-Tier Outward-Winged Feathered Side Locks (Left & Right) */}
            {/* Left Side (+X) 3-Tier Outward Flared Bob Locks */}
            <group ref={sideWingsLeftRef} position={[0.212, -0.02, 0.03]}>
              <mesh
                position={[-0.01, 0.01, 0.02]}
                rotation={[0.08, 0.22, 0.32]}
                scale={[0.72, 1.15, 0.88]}
                material={materials.hairMat}
                castShadow
              >
                <sphereGeometry args={[0.114, 16, 14]} />
              </mesh>
              <mesh
                geometry={customGeos.wingLockGeo}
                material={materials.hairMat}
                position={[0.046, -0.082, -0.01]}
                rotation={[0.05, 0.12, 2.38]}
                castShadow
              />
              <mesh
                geometry={customGeos.wingLockGeo}
                material={materials.hairMat}
                position={[0.058, -0.162, -0.025]}
                rotation={[0.08, 0.18, 2.22]}
                scale={[1.12, 1.15, 1.0]}
                castShadow
              />
              <mesh
                geometry={customGeos.wingLockGeo}
                material={materials.hairShadowMat}
                position={[0.016, -0.188, -0.045]}
                rotation={[0.12, 0.25, 2.52]}
                scale={[0.9, 0.92, 0.9]}
              />
            </group>

            {/* Right Side (-X) 3-Tier Outward Flared Bob Locks */}
            <group ref={sideWingsRightRef} position={[-0.212, -0.02, 0.03]}>
              <mesh
                position={[0.01, 0.01, 0.02]}
                rotation={[0.08, -0.22, -0.32]}
                scale={[0.72, 1.15, 0.88]}
                material={materials.hairMat}
                castShadow
              >
                <sphereGeometry args={[0.114, 16, 14]} />
              </mesh>
              <mesh
                geometry={customGeos.wingLockGeo}
                material={materials.hairMat}
                position={[-0.046, -0.082, -0.01]}
                rotation={[0.05, -0.12, -2.38]}
                castShadow
              />
              <mesh
                geometry={customGeos.wingLockGeo}
                material={materials.hairMat}
                position={[-0.058, -0.162, -0.025]}
                rotation={[0.08, -0.18, -2.22]}
                scale={[1.12, 1.15, 1.0]}
                castShadow
              />
              <mesh
                geometry={customGeos.wingLockGeo}
                material={materials.hairShadowMat}
                position={[-0.016, -0.188, -0.045]}
                rotation={[0.12, -0.25, -2.52]}
                scale={[0.9, 0.92, 0.9]}
              />
            </group>

            {/* 5. Feathered Front Fringe Bangs (Parted Above Eyebrows — Eyes 100% Clear!) */}
            {[
              [0.140, 0.104, 0.172, 0.16, 0.36, -0.26, 0.88, 0.96],
              [0.080, 0.120, 0.194, 0.22, 0.16, -0.12, 0.86, 0.92],
              [0.018, 0.108, 0.208, 0.24, 0.04, -0.08, 0.70, 1.06],
              [-0.016, 0.110, 0.208, 0.24, -0.04, 0.06, 0.66, 1.02],
              [-0.080, 0.120, 0.194, 0.22, -0.16, 0.12, 0.86, 0.92],
              [-0.140, 0.104, 0.172, 0.16, -0.36, 0.26, 0.88, 0.96],
            ].map(([bx, by, bz, rx, ry, rz, sx, sy], idx) => (
              <mesh
                key={`bang-${idx}`}
                geometry={customGeos.bangCapsuleGeo}
                material={materials.hairMat}
                position={[bx, by, bz]}
                rotation={[rx, ry, rz]}
                scale={[sx, sy, 0.44]}
                castShadow
              />
            ))}

            {/* 6. Spring-Physics Outer Flyaway Hair Strands */}
            <group ref={hairStrandsRef} position={[0, 0.02, 0.02]}>
              <mesh geometry={customGeos.leftFlyaway} material={materials.hairMat} castShadow />
              <mesh geometry={customGeos.leftOuterFlick} material={materials.hairMat} castShadow />
              <mesh geometry={customGeos.rightFlyaway} material={materials.hairMat} castShadow />
              <mesh geometry={customGeos.rightOuterFlick} material={materials.hairMat} castShadow />
            </group>

            {/* 7. Signature Bouncy Curved Top Ahoge Hair Curl */}
            <group ref={ahogeRef} position={[0, 0.248, 0.01]}>
              <mesh geometry={customGeos.ahogeGeo} material={materials.hairMat} castShadow />
            </group>
          </group>
        </group>

        {/* ===================================================== */}
        {/* 5. FLOATING 4-POINTED STAR SPARKLE (✧) BY HER FACE    */}
        {/* ===================================================== */}
        <group ref={faceSparkleRef} position={[-0.26, 0.72, 0.24]}>
          <mesh geometry={customGeos.fourPointStarGeo}>
            <meshBasicMaterial color="#fff8e0" />
          </mesh>
          <mesh geometry={customGeos.fourPointStarGeo} scale={[1.35, 1.35, 0.8]}>
            <meshBasicMaterial color="#d8968c" transparent opacity={0.45} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
