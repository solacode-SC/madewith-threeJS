import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  INITIAL_SEA_PEARLS,
  LANDMARK_ZONES,
  resolveMazeCollision,
} from '../../utils/mazeLayout';
import type { CameraMode, VirtualWalkInput } from '../../hooks/useMazeState';

interface GreenAnimeChibiGirlProps {
  cameraMode: CameraMode;
  autoWalk: boolean;
  collectedRelics: number[];
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterYawRef: React.MutableRefObject<number>;
  characterSpeedRef: React.MutableRefObject<number>;
  cameraYawRef: React.MutableRefObject<number>;
  walkPathRef: React.MutableRefObject<THREE.Vector3[]>;
  waveTimerRef: React.MutableRefObject<number>;
  jumpVelRef: React.MutableRefObject<number>;
  jumpHeightRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualWalkInput>;
  onClearWalkTarget: () => void;
  onManualMove: () => void;
  onDiscoverZone: (zoneId: string) => void;
  onCollectRelic: (relicId: number) => void;
  onSelectCharacter: () => void;
  onHover: (label: string | null) => void;
}

const _desiredDir = new THREE.Vector2();
const _charOrigin = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _relDust = new THREE.Vector3();

export default function GreenAnimeChibiGirl({
  cameraMode,
  autoWalk,
  collectedRelics,
  characterPosRef,
  characterYawRef,
  characterSpeedRef,
  cameraYawRef,
  walkPathRef,
  waveTimerRef,
  jumpVelRef,
  jumpHeightRef,
  virtualInputRef,
  onClearWalkTarget,
  onManualMove,
  onDiscoverZone,
  onCollectRelic,
  onSelectCharacter,
  onHover,
}: GreenAnimeChibiGirlProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyBounceRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const skirtRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const hairStrandsRef = useRef<THREE.Group>(null);
  const sideWingsLeftRef = useRef<THREE.Group>(null);
  const sideWingsRightRef = useRef<THREE.Group>(null);
  const leftEyeBlinkRef = useRef<THREE.Group>(null);
  const rightEyeBlinkRef = useRef<THREE.Group>(null);
  const mouthGroupRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const dustTrailRef = useRef<THREE.Group>(null);
  const groundRingRef = useRef<THREE.Group>(null);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const velocityRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const stridePhaseRef = useRef<number>(0);
  const smoothLeanRef = useRef<number>(0);
  const smoothBankRef = useRef<number>(0);
  const jumpSpinRef = useRef<number>(0);
  const lastZoneIdRef = useRef<string>('');

  // Ring buffer for sparkling turquoise-white footstep puffs
  const dustHistoryRef = useRef<Array<{ pos: THREE.Vector3; age: number }>>(
    Array.from({ length: 12 }, () => ({
      pos: new THREE.Vector3(0, -10, 0),
      age: 99,
    }))
  );
  const dustSpawnTimerRef = useRef<number>(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        onManualMove();
      }
      if (k === 'f') {
        waveTimerRef.current = 2.4;
      }
      if (k === ' ') {
        e.preventDefault();
        if (jumpHeightRef.current <= 0.01) {
          jumpVelRef.current = 4.6;
        }
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
  }, [onManualMove, waveTimerRef, jumpVelRef, jumpHeightRef]);

  // High-Clarity Anime Cel-Inspired Materials matching Reference Image 1
  const materials = useMemo(() => {
    const skinCream = '#FFF4EA';
    const blushPeach = '#FCA690';
    const blushSlashCoral = '#E06B56';
    const nosePeach = '#DEA28E';
    const mouthCoral = '#F08E82';
    const mouthOutline = '#5E2E28';

    // Hair & Sweater Greens matching the uploaded reference artwork
    const hairMainGreen = '#86D654';
    const hairDarkGreen = '#57A034';
    const hairHighlightLime = '#D2FA92';
    const sweaterGreen = '#88D456';
    const sweaterRibGreen = '#71BD42';

    // Skirt & Boots Charcoal-Black
    const skirtBlack = '#1E2028';
    const skirtFoldDark = '#14161C';
    const skirtSheen = '#2B2E3A';
    const bootBlack = '#1B1D24';
    const bootSoleDark = '#2D303A';
    const outlineInk = '#162214';

    // Emerald-to-Chartreuse Anime Eye Palette
    const lashInk = '#221714';
    const irisOuterForest = '#174727';
    const irisMidEmerald = '#2E8B46';
    const irisLowerLime = '#C8F766';
    const pupilDark = '#0F2B18';

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
        color: hairMainGreen,
        roughness: 0.46,
        emissive: '#68B838',
        emissiveIntensity: 0.16,
        side: THREE.DoubleSide,
      }),
      hairShadowMat: new THREE.MeshStandardMaterial({
        color: hairDarkGreen,
        roughness: 0.52,
        emissive: '#3D7A22',
        emissiveIntensity: 0.12,
        side: THREE.DoubleSide,
      }),
      hairHighlightMat: new THREE.MeshBasicMaterial({
        color: hairHighlightLime,
      }),
      sweaterMat: new THREE.MeshStandardMaterial({
        color: sweaterGreen,
        roughness: 0.48,
        emissive: '#62B434',
        emissiveIntensity: 0.15,
      }),
      sweaterRibMat: new THREE.MeshStandardMaterial({
        color: sweaterRibGreen,
        roughness: 0.52,
        emissive: '#4D9426',
        emissiveIntensity: 0.12,
      }),
      skirtMat: new THREE.MeshStandardMaterial({
        color: skirtBlack,
        roughness: 0.50,
        emissive: '#181A22',
        emissiveIntensity: 0.10,
      }),
      skirtFoldMat: new THREE.MeshStandardMaterial({
        color: skirtFoldDark,
        roughness: 0.58,
      }),
      skirtSheenMat: new THREE.MeshBasicMaterial({
        color: skirtSheen,
      }),
      sockMat: new THREE.MeshStandardMaterial({
        color: sweaterGreen,
        roughness: 0.48,
        emissive: '#62B434',
        emissiveIntensity: 0.14,
      }),
      bootMat: new THREE.MeshStandardMaterial({
        color: bootBlack,
        roughness: 0.42,
      }),
      bootSoleMat: new THREE.MeshStandardMaterial({
        color: bootSoleDark,
        roughness: 0.72,
      }),
      outlineMat: new THREE.MeshBasicMaterial({
        color: outlineInk,
        side: THREE.BackSide,
      }),
      trimInkMat: new THREE.MeshBasicMaterial({ color: outlineInk }),
      lashMat: new THREE.MeshBasicMaterial({ color: lashInk }),
      browMat: new THREE.MeshBasicMaterial({ color: '#283A20' }),
      scleraMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      irisOuterMat: new THREE.MeshBasicMaterial({ color: irisOuterForest }),
      irisMidMat: new THREE.MeshBasicMaterial({ color: irisMidEmerald }),
      irisLimeMat: new THREE.MeshBasicMaterial({ color: irisLowerLime }),
      pupilMat: new THREE.MeshBasicMaterial({ color: pupilDark }),
      catchlightMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      blushMat: new THREE.MeshBasicMaterial({
        color: blushPeach,
        transparent: true,
        opacity: 0.78,
      }),
      blushSlashMat: new THREE.MeshBasicMaterial({ color: blushSlashCoral }),
      noseMat: new THREE.MeshBasicMaterial({ color: nosePeach }),
      mouthMat: new THREE.MeshBasicMaterial({ color: mouthCoral }),
      mouthRingMat: new THREE.MeshBasicMaterial({ color: mouthOutline }),
      dustMat: new THREE.MeshBasicMaterial({
        color: '#8EF2FC',
        transparent: true,
        opacity: 0.52,
      }),
    };
  }, []);

  const dustSphereGeo = useMemo(() => new THREE.SphereGeometry(0.044, 8, 8), []);
  const bangCapsuleGeo = useMemo(() => new THREE.CapsuleGeometry(0.038, 0.095, 8, 12), []);
  const wingLockGeo = useMemo(() => {
    // Tapered anime hair lock cone-capsule that flares outward at the tip
    const geo = new THREE.ConeGeometry(0.068, 0.24, 14);
    geo.scale(0.68, 1.0, 0.85);
    return geo;
  }, []);

  // Sculpted Curves for Flowing Anime Flyaway Hair Strands, Eyelashes, Brows & Collar Seam
  const customGeos = useMemo(() => {
    const leftFlyaway = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.21, 0.08, 0.03),
      new THREE.Vector3(0.28, -0.01, 0.03),
      new THREE.Vector3(0.32, -0.12, 0.02),
      new THREE.Vector3(0.29, -0.22, 0.03),
    ]);

    const leftOuterFlick = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.20, -0.04, 0.01),
      new THREE.Vector3(0.26, -0.14, 0.01),
      new THREE.Vector3(0.34, -0.21, 0.02),
      new THREE.Vector3(0.39, -0.20, 0.03),
    ]);

    const rightFlyaway = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.21, 0.08, 0.03),
      new THREE.Vector3(-0.28, -0.01, 0.03),
      new THREE.Vector3(-0.32, -0.12, 0.02),
      new THREE.Vector3(-0.29, -0.22, 0.03),
    ]);

    const rightOuterFlick = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.20, -0.04, 0.01),
      new THREE.Vector3(-0.26, -0.14, 0.01),
      new THREE.Vector3(-0.34, -0.21, 0.02),
      new THREE.Vector3(-0.39, -0.20, 0.03),
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

    return {
      leftFlyaway: new THREE.TubeGeometry(leftFlyaway, 16, 0.0075, 6, false),
      leftOuterFlick: new THREE.TubeGeometry(leftOuterFlick, 14, 0.014, 7, false),
      rightFlyaway: new THREE.TubeGeometry(rightFlyaway, 16, 0.0075, 6, false),
      rightOuterFlick: new THREE.TubeGeometry(rightOuterFlick, 14, 0.014, 7, false),
      upperLashGeo: new THREE.TubeGeometry(lashCurve, 18, 0.0078, 8, false),
      lidCreaseGeo: new THREE.TubeGeometry(lidCreaseCurve, 12, 0.0026, 6, false),
      eyebrowGeo: new THREE.TubeGeometry(browCurve, 12, 0.0042, 6, false),
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.065);
    const elapsed = state.clock.getElapsedTime();

    const pos = characterPosRef.current;
    const keys = keysRef.current;
    const vInput = virtualInputRef.current;

    const up = keys['w'] || keys['arrowup'] || vInput.up;
    const down = keys['s'] || keys['arrowdown'] || vInput.down;
    const left = keys['a'] || keys['arrowleft'] || vInput.left;
    const right = keys['d'] || keys['arrowright'] || vInput.right;
    const sprint = keys['shift'] || vInput.sprint;

    if (vInput.wave) {
      waveTimerRef.current = 2.4;
      vInput.wave = false;
    }
    if (vInput.jump) {
      if (jumpHeightRef.current <= 0.01) {
        jumpVelRef.current = 4.6;
      }
      vInput.jump = false;
    }
    if (waveTimerRef.current > 0) {
      waveTimerRef.current = Math.max(0, waveTimerRef.current - dt);
    }

    // Jump & Mid-Air Anime Twirl Physics
    if (jumpHeightRef.current > 0 || jumpVelRef.current > 0) {
      jumpHeightRef.current += jumpVelRef.current * dt;
      jumpVelRef.current -= 13.5 * dt;
      jumpSpinRef.current += dt * 9.5;
      if (jumpHeightRef.current <= 0) {
        jumpHeightRef.current = 0;
        jumpVelRef.current = 0;
        jumpSpinRef.current = 0;
      }
    } else {
      jumpSpinRef.current = THREE.MathUtils.lerp(jumpSpinRef.current, 0, Math.min(1, dt * 14));
    }

    _desiredDir.set(0, 0);
    let hasInput = false;
    let maxSpeed = sprint ? 8.8 : 5.6;

    // 1. Direct Player Keyboard / Virtual D-Pad Input
    if (up || down || left || right) {
      if (vInput.up || vInput.down || vInput.left || vInput.right) {
        onManualMove();
      }
      const camYaw = cameraYawRef.current;
      const forwardX = Math.sin(camYaw);
      const forwardZ = Math.cos(camYaw);
      const rightX = -forwardZ;
      const rightZ = forwardX;

      let moveX = 0;
      let moveZ = 0;
      if (up) {
        moveX += forwardX;
        moveZ += forwardZ;
      }
      if (down) {
        moveX -= forwardX;
        moveZ -= forwardZ;
      }
      if (right) {
        moveX += rightX;
        moveZ += rightZ;
      }
      if (left) {
        moveX -= rightX;
        moveZ -= rightZ;
      }

      const len = Math.hypot(moveX, moveZ);
      if (len > 0.001) {
        _desiredDir.set(moveX / len, moveZ / len);
        hasInput = true;
      }
    }
    // 2. Click-to-Walk or 16-Place Auto-Tour Path Following
    else if (walkPathRef.current.length > 0) {
      maxSpeed = sprint ? 8.8 : 6.2;
      let target = walkPathRef.current[0];
      let dx = target.x - pos.x;
      let dz = target.z - pos.z;
      let dist = Math.hypot(dx, dz);

      const reachRadius = walkPathRef.current.length > 1 ? 0.54 : 0.28;
      if (dist < reachRadius) {
        walkPathRef.current.shift();
        if (walkPathRef.current.length === 0) {
          onClearWalkTarget();
        } else {
          target = walkPathRef.current[0];
          dx = target.x - pos.x;
          dz = target.z - pos.z;
          dist = Math.hypot(dx, dz);
        }
      }

      if (walkPathRef.current.length > 0 && dist > 0.001) {
        _desiredDir.set(dx / dist, dz / dist);
        hasInput = true;
      }
    }

    // Critically-Damped Velocity Interpolation
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

    // Sub-stepped Wall & Amphora Collision Resolution
    if (speed > 0.01) {
      const startX = pos.x;
      const startZ = pos.z;
      const totalMove = speed * dt;
      const subSteps = totalMove > 0.22 ? 2 : 1;
      const subDt = dt / subSteps;

      let curX = startX;
      let curZ = startZ;
      for (let s = 0; s < subSteps; s++) {
        const nextX = curX + velocityRef.current.x * subDt;
        const nextZ = curZ + velocityRef.current.y * subDt;
        const resolved = resolveMazeCollision(nextX, nextZ, 0.34);
        curX = resolved.x;
        curZ = resolved.z;
      }

      velocityRef.current.set((curX - startX) / dt, (curZ - startZ) / dt);
      pos.x = curX;
      pos.z = curZ;
    }

    // Character Yaw Rotation
    let turnRate = 0;
    if (cameraMode === 'pov') {
      let diff = cameraYawRef.current - characterYawRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      turnRate = diff;
      characterYawRef.current = cameraYawRef.current;
    } else if (speed > 0.12) {
      const targetYaw = Math.atan2(velocityRef.current.x, velocityRef.current.y);
      let diff = targetYaw - characterYawRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      turnRate = diff;
      characterYawRef.current += diff * Math.min(1, dt * 18.0);

      // Smoothly guide follow camera behind Midori when turning corners
      if (
        (cameraMode === 'follow' || cameraMode === 'cinematic') &&
        (left || right || autoWalk || walkPathRef.current.length > 0)
      ) {
        let camDiff = characterYawRef.current - cameraYawRef.current;
        while (camDiff > Math.PI) camDiff -= Math.PI * 2;
        while (camDiff < -Math.PI) camDiff += Math.PI * 2;
        cameraYawRef.current += camDiff * Math.min(1, dt * 3.8);
      }
    } else if (waveTimerRef.current > 0 || cameraMode === 'painting') {
      // Face toward the camera when waving or in Reference Vista mode so her cute anime face shines!
      const faceCamYaw = cameraMode === 'painting' ? 0.08 : cameraYawRef.current + Math.PI;
      let diff = faceCamYaw - characterYawRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      characterYawRef.current += diff * Math.min(1, dt * 8.5);
    }

    if (rootRef.current) {
      rootRef.current.position.set(pos.x, jumpHeightRef.current, pos.z);
      rootRef.current.rotation.y = characterYawRef.current + jumpSpinRef.current;
    }

    // Check Discovery across all 16 Landmark Places
    for (let i = 0; i < LANDMARK_ZONES.length; i++) {
      const zone = LANDMARK_ZONES[i];
      const dx = pos.x - zone.x;
      const dz = pos.z - zone.z;
      if (dx * dx + dz * dz < 2.15 * 2.15) {
        if (lastZoneIdRef.current !== zone.id) {
          lastZoneIdRef.current = zone.id;
          onDiscoverZone(zone.id);
        }
        break;
      }
    }

    // Check Collectible Sea Pearls
    for (let i = 0; i < INITIAL_SEA_PEARLS.length; i++) {
      const relic = INITIAL_SEA_PEARLS[i];
      if (!collectedRelics.includes(relic.id)) {
        const dx = pos.x - relic.position[0];
        const dz = pos.z - relic.position[2];
        if (dx * dx + dz * dz < 1.2 * 1.2) {
          onCollectRelic(relic.id);
        }
      }
    }

    // =====================================================================
    // PROCEDURAL ANIME CHIBI LOCOMOTION, SKIRT SWAY, HAIR SPRING & POSES
    // =====================================================================
    const normSpeed = THREE.MathUtils.clamp(speed / 4.2, 0, 1.65);
    if (speed > 0.08) {
      stridePhaseRef.current += dt * (7.6 + normSpeed * 6.4);
    } else {
      stridePhaseRef.current += dt * 1.9;
    }
    const phase = stridePhaseRef.current;
    const isJumping = jumpHeightRef.current > 0.02;
    const isWaving = waveTimerRef.current > 0;

    // 1. Expressive Anime Eye Blinking
    const blinkCycle = elapsed % 3.5;
    const blinkScaleY =
      blinkCycle > 3.34
        ? Math.max(0.08, Math.abs((blinkCycle - 3.42) / 0.08))
        : 1.0;
    if (leftEyeBlinkRef.current && rightEyeBlinkRef.current) {
      leftEyeBlinkRef.current.scale.y = blinkScaleY;
      rightEyeBlinkRef.current.scale.y = blinkScaleY;
    }

    // 2. Cute Surprised/Happy Anime "o" Mouth Breathing & Excited Morph
    if (mouthGroupRef.current) {
      const mouthExcite = isJumping || isWaving ? 1.28 : 1.0 + Math.sin(elapsed * 3.2) * 0.08;
      mouthGroupRef.current.scale.set(mouthExcite, mouthExcite, 1);
    }

    // 3. Bouncy Chibi Walk Cadence, Forward Sprint Lean & Corner Banking
    const walkBob = isJumping
      ? 0
      : speed > 0.08
        ? Math.abs(Math.sin(phase)) * 0.06 * Math.min(1.25, normSpeed)
        : Math.sin(elapsed * 2.5) * 0.011;

    const targetLean = speed > 0.1 ? normSpeed * 0.14 : 0;
    const targetBank = THREE.MathUtils.clamp(-turnRate * 0.3, -0.2, 0.2);

    smoothLeanRef.current = THREE.MathUtils.lerp(
      smoothLeanRef.current,
      targetLean,
      Math.min(1, dt * 12.0)
    );
    smoothBankRef.current = THREE.MathUtils.lerp(
      smoothBankRef.current,
      targetBank,
      Math.min(1, dt * 12.0)
    );

    if (bodyBounceRef.current) {
      bodyBounceRef.current.position.y = walkBob;
      bodyBounceRef.current.rotation.x = smoothLeanRef.current;
      bodyBounceRef.current.rotation.z =
        smoothBankRef.current +
        (speed > 0.08 ? Math.cos(phase) * 0.042 * normSpeed : Math.sin(elapsed * 1.8) * 0.016);
    }

    // 4. Dynamic Flared Black Skirt Sway & Bounce
    if (skirtRef.current) {
      skirtRef.current.rotation.z =
        speed > 0.08
          ? -Math.cos(phase) * 0.075 * normSpeed
          : Math.sin(elapsed * 2.1) * 0.018;
      skirtRef.current.rotation.x =
        -smoothLeanRef.current * 0.35 + (isJumping ? 0.12 : Math.sin(phase * 2) * 0.03 * normSpeed);
      const skirtFlare = isJumping ? 1.12 : 1.0 + Math.abs(Math.sin(phase)) * 0.035 * normSpeed;
      skirtRef.current.scale.set(skirtFlare, 1, skirtFlare);
    }

    // 5. Alternating Chibi Legs, Green Socks & V-Cut Boots Stride
    if (leftLegRef.current && rightLegRef.current) {
      const legSwing = isJumping
        ? 0.45
        : speed > 0.08
          ? Math.sin(phase) * 0.66 * Math.min(1.35, normSpeed)
          : isWaving
            ? Math.sin(elapsed * 5.0) * 0.16
            : 0;
      leftLegRef.current.rotation.x = legSwing;
      rightLegRef.current.rotation.x = isJumping ? -0.35 : -legSwing;
    }

    // 6. Puffed Sweater Sleeves & Outstretched Chibi Hands (Matches Image 1 Silhouette + Wave!)
    if (rightArmRef.current && leftArmRef.current) {
      if (isWaving || isJumping) {
        const waveOsc = Math.sin(elapsed * 9.5) * 0.26;
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          2.05 + waveOsc,
          Math.min(1, dt * 11)
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          0.18,
          Math.min(1, dt * 11)
        );
      } else {
        const armSwing = speed > 0.08 ? -Math.sin(phase) * 0.46 * Math.min(1.3, normSpeed) : 0;
        // Outstretched cute chibi A-pose angle matching Reference Image 1 (0.48 rad)
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          0.48 + Math.sin(elapsed * 2.3) * 0.045,
          Math.min(1, dt * 10)
        );
        rightArmRef.current.rotation.x = armSwing;
      }

      const leftSwing = isJumping
        ? -0.35
        : speed > 0.08
          ? Math.sin(phase) * 0.46 * Math.min(1.3, normSpeed)
          : 0;
      leftArmRef.current.rotation.x = leftSwing;
      leftArmRef.current.rotation.z = isJumping
        ? -1.65
        : -0.48 - Math.sin(elapsed * 2.3) * 0.045;
    }

    // 7. Expressive Anime Head Tilt & Nod
    if (headRef.current) {
      const baseTiltZ = -0.048;
      const walkNod = speed > 0.08 ? Math.sin(phase * 2) * 0.028 * normSpeed : 0;
      headRef.current.rotation.z =
        baseTiltZ + Math.sin(elapsed * 2.1) * 0.026 - smoothBankRef.current * 0.42;
      headRef.current.rotation.x = -smoothLeanRef.current * 0.45 + walkNod;
    }

    // 8. Secondary Spring Physics on Her Feathered Side Hair Wings & Flyaway Strands
    if (hairStrandsRef.current) {
      hairStrandsRef.current.rotation.z =
        Math.sin(elapsed * 3.8 + phase * 0.5) * 0.06 + normSpeed * 0.075;
      hairStrandsRef.current.rotation.y =
        -smoothBankRef.current * 0.5 + Math.cos(elapsed * 2.8) * 0.038;
    }
    if (sideWingsLeftRef.current && sideWingsRightRef.current) {
      const wingBounce =
        Math.sin(elapsed * 3.4 + phase) * 0.045 +
        (isJumping ? 0.14 : Math.abs(Math.sin(phase)) * 0.065 * normSpeed);
      sideWingsLeftRef.current.rotation.z = wingBounce;
      sideWingsRightRef.current.rotation.z = -wingBounce;
    }

    // 9. Rotating Turquoise Halo Ring Under Her Boots
    if (groundRingRef.current) {
      groundRingRef.current.position.y = 0.018 - jumpHeightRef.current * 0.85;
      groundRingRef.current.rotation.z = elapsed * 1.1;
    }

    // 10. Footstep Sparkling Sea-Breeze Puffs
    dustSpawnTimerRef.current += dt * (0.4 + normSpeed * 2.5);
    const dustHist = dustHistoryRef.current;
    if (speed > 0.25 && !isJumping && dustSpawnTimerRef.current > 0.15) {
      dustSpawnTimerRef.current = 0;
      for (let i = dustHist.length - 1; i > 0; i--) {
        dustHist[i].pos.copy(dustHist[i - 1].pos);
        dustHist[i].age = dustHist[i - 1].age;
      }
      dustHist[0].pos.set(
        pos.x + (Math.random() - 0.5) * 0.18,
        0.05,
        pos.z + (Math.random() - 0.5) * 0.18
      );
      dustHist[0].age = 0;
    }

    if (dustTrailRef.current) {
      const invYaw = -(characterYawRef.current + jumpSpinRef.current);
      _charOrigin.set(pos.x, 0, pos.z);
      const children = dustTrailRef.current.children;
      for (let idx = 0; idx < children.length; idx++) {
        const child = children[idx];
        const item = dustHist[idx];
        item.age += dt;
        const life = THREE.MathUtils.clamp(1 - item.age / 0.85, 0, 1);
        if (life <= 0.001) {
          child.visible = false;
        } else {
          child.visible = true;
          _relDust.copy(item.pos).sub(_charOrigin).applyAxisAngle(_upAxis, invYaw);
          child.position.set(
            _relDust.x,
            0.04 + item.age * 0.18 - jumpHeightRef.current,
            _relDust.z
          );
          child.scale.setScalar(life * 0.95);
        }
      }
    }
  });

  return (
    <group ref={rootRef}>
      {/* Interactive pointer target */}
      <mesh
        position={[0, 0.54, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(
            'Midori — Move: WASD / Arrows • Jump: Space • Wave: F • Camera Angles: V'
          );
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          waveTimerRef.current = 2.4;
          onSelectCharacter();
        }}
      >
        <cylinderGeometry args={[0.3, 0.3, 1.08, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* Turquoise-Glow Ground Footstep Ring */}
      <group ref={groundRingRef} position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.24, 0.295, 28]} />
          <meshBasicMaterial
            color="#5AD8F0"
            transparent
            opacity={cameraMode === 'pov' ? 0.16 : 0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Sparkling Turquoise Footstep Puffs */}
      <group ref={dustTrailRef}>
        {Array.from({ length: 12 }).map((_, idx) => (
          <mesh key={idx} geometry={dustSphereGeo} material={materials.dustMat} visible={false} />
        ))}
      </group>

      {/* Soft Front & Rim Fill Lights so Midori's Emerald Eyes & Lime Hair Pop Vibrantly */}
      <pointLight position={[0, 0.9, 0.65]} color="#ffffff" intensity={0.95} distance={3.8} />
      <pointLight position={[0, 0.85, -0.5]} color="#b8f5ff" intensity={0.55} distance={3.0} />

      {/* ================================================================= */}
      {/* MAIN BOUNCING & BANKING CHIBI BODY GROUP                          */}
      {/* ================================================================= */}
      <group ref={bodyBounceRef}>
        {/* =============================================================== */}
        {/* 1. LEGS, LIME-GREEN CREW SOCKS & V-NOTCHED CHUNKY BLACK BOOTS   */}
        {/* =============================================================== */}
        <group position={[0, 0.22, 0]}>
          {/* Left Side Leg (+X) */}
          <group ref={leftLegRef} position={[0.068, 0, 0]}>
            {/* Bare Ivory Upper Leg */}
            <mesh position={[0, -0.025, 0]} material={materials.faceMat} castShadow>
              <cylinderGeometry args={[0.039, 0.037, 0.07, 14]} />
            </mesh>
            {/* Lime-Green Ribbed Crew Sock Peeking Above Boot */}
            <mesh position={[0, -0.068, 0]} material={materials.sockMat} castShadow>
              <cylinderGeometry args={[0.041, 0.040, 0.058, 14]} />
            </mesh>
            {/* Sock Vertical Stitch Lines */}
            <mesh position={[0.012, -0.062, 0.039]} material={materials.trimInkMat}>
              <boxGeometry args={[0.003, 0.032, 0.003]} />
            </mesh>
            <mesh position={[-0.012, -0.062, 0.039]} material={materials.trimInkMat}>
              <boxGeometry args={[0.003, 0.032, 0.003]} />
            </mesh>

            {/* Chunky Black Ankle Boot Shaft */}
            <mesh position={[0, -0.132, 0]} material={materials.bootMat} castShadow receiveShadow>
              <cylinderGeometry args={[0.049, 0.045, 0.115, 16]} />
            </mesh>
            {/* Boot Cel Outline */}
            <mesh position={[0, -0.132, 0]} scale={[1.06, 1.02, 1.06]} material={materials.outlineMat}>
              <cylinderGeometry args={[0.049, 0.045, 0.115, 14]} />
            </mesh>
            {/* Signature V-Cut Green Sock Notch on Front of Boot Cuff (matches Image 1!) */}
            <mesh
              position={[0, -0.082, 0.044]}
              rotation={[0, 0, Math.PI]}
              material={materials.sockMat}
            >
              <coneGeometry args={[0.018, 0.028, 3]} />
            </mesh>

            {/* Rounded Chunky Boot Toe Box */}
            <mesh
              position={[0, -0.178, 0.022]}
              scale={[1.08, 0.82, 1.38]}
              material={materials.bootMat}
              castShadow
            >
              <sphereGeometry args={[0.044, 14, 12]} />
            </mesh>
            {/* Thick Dark Lug Sole */}
            <mesh position={[0, -0.204, 0.020]} material={materials.bootSoleMat}>
              <cylinderGeometry args={[0.049, 0.052, 0.018, 14]} />
            </mesh>
          </group>

          {/* Right Side Leg (-X) */}
          <group ref={rightLegRef} position={[-0.068, 0, 0]}>
            {/* Bare Ivory Upper Leg */}
            <mesh position={[0, -0.025, 0]} material={materials.faceMat} castShadow>
              <cylinderGeometry args={[0.039, 0.037, 0.07, 14]} />
            </mesh>
            {/* Lime-Green Ribbed Crew Sock Peeking Above Boot */}
            <mesh position={[0, -0.068, 0]} material={materials.sockMat} castShadow>
              <cylinderGeometry args={[0.041, 0.040, 0.058, 14]} />
            </mesh>
            {/* Sock Vertical Stitch Lines */}
            <mesh position={[0.012, -0.062, 0.039]} material={materials.trimInkMat}>
              <boxGeometry args={[0.003, 0.032, 0.003]} />
            </mesh>
            <mesh position={[-0.012, -0.062, 0.039]} material={materials.trimInkMat}>
              <boxGeometry args={[0.003, 0.032, 0.003]} />
            </mesh>

            {/* Chunky Black Ankle Boot Shaft */}
            <mesh position={[0, -0.132, 0]} material={materials.bootMat} castShadow receiveShadow>
              <cylinderGeometry args={[0.049, 0.045, 0.115, 16]} />
            </mesh>
            {/* Boot Cel Outline */}
            <mesh position={[0, -0.132, 0]} scale={[1.06, 1.02, 1.06]} material={materials.outlineMat}>
              <cylinderGeometry args={[0.049, 0.045, 0.115, 14]} />
            </mesh>
            {/* Signature V-Cut Green Sock Notch on Front of Boot Cuff */}
            <mesh
              position={[0, -0.082, 0.044]}
              rotation={[0, 0, Math.PI]}
              material={materials.sockMat}
            >
              <coneGeometry args={[0.018, 0.028, 3]} />
            </mesh>

            {/* Rounded Chunky Boot Toe Box */}
            <mesh
              position={[0, -0.178, 0.022]}
              scale={[1.08, 0.82, 1.38]}
              material={materials.bootMat}
              castShadow
            >
              <sphereGeometry args={[0.044, 14, 12]} />
            </mesh>
            {/* Thick Dark Lug Sole */}
            <mesh position={[0, -0.204, 0.020]} material={materials.bootSoleMat}>
              <cylinderGeometry args={[0.049, 0.052, 0.018, 14]} />
            </mesh>
          </group>
        </group>

        {/* =============================================================== */}
        {/* 2. HIGH-WAISTED FLARED BLACK PLEATED SKIRT (Matches Image 1!)   */}
        {/* =============================================================== */}
        <group ref={skirtRef} position={[0, 0.31, 0]}>
          {/* Fitted High Waistband */}
          <mesh position={[0, 0.115, 0]} material={materials.skirtFoldMat} castShadow>
            <cylinderGeometry args={[0.104, 0.112, 0.034, 24]} />
          </mesh>

          {/* Main Flared A-Line Black Skirt Cone */}
          <mesh position={[0, -0.005, 0]} material={materials.skirtMat} castShadow receiveShadow>
            <cylinderGeometry args={[0.110, 0.248, 0.22, 28]} />
          </mesh>
          {/* Skirt Anime Cel Outline Shell */}
          <mesh position={[0, -0.005, 0]} scale={[1.035, 1.02, 1.035]} material={materials.outlineMat}>
            <cylinderGeometry args={[0.110, 0.248, 0.22, 24]} />
          </mesh>

          {/* Sculpted Vertical Skirt Pleat Ridges Around the Circumference */}
          {Array.from({ length: 10 }).map((_, idx) => {
            const angle = (idx * Math.PI * 2) / 10 + 0.15;
            const px = Math.sin(angle) * 0.168;
            const pz = Math.cos(angle) * 0.168;
            const tiltX = Math.cos(angle) * 0.52;
            const tiltZ = -Math.sin(angle) * 0.52;
            return (
              <mesh
                key={`pleat-${idx}`}
                position={[px, -0.008, pz]}
                rotation={[tiltX, 0, tiltZ]}
                material={idx % 2 === 0 ? materials.skirtMat : materials.skirtFoldMat}
              >
                <cylinderGeometry args={[0.016, 0.038, 0.21, 8]} />
              </mesh>
            );
          })}

          {/* Soft Charcoal Highlight Sheen on Front Skirt Panel (visible in Image 1) */}
          <mesh
            position={[-0.065, -0.01, 0.166]}
            rotation={[0.52, -0.25, 0.12]}
            scale={[1.0, 1.0, 0.25]}
            material={materials.skirtSheenMat}
          >
            <cylinderGeometry args={[0.022, 0.048, 0.19, 8]} />
          </mesh>
        </group>

        {/* =============================================================== */}
        {/* 3. OVERSIZED LIME-GREEN TURTLENECK SWEATER & PUFFED SLEEVES     */}
        {/* =============================================================== */}
        <group ref={torsoRef} position={[0, 0.49, 0]}>
          {/* Cozy Bloused Lime-Green Sweater Torso */}
          <mesh
            position={[0, 0.005, 0.005]}
            scale={[1.08, 0.96, 0.92]}
            material={materials.sweaterMat}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.098, 0.114, 0.175, 24]} />
          </mesh>
          {/* Soft Bloused Sweater Tuck Fold Above Waistband */}
          <mesh
            position={[0, -0.062, 0.008]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1.05, 0.92, 1.0]}
            material={materials.sweaterRibMat}
          >
            <torusGeometry args={[0.104, 0.016, 10, 24]} />
          </mesh>
          {/* Sweater Cel Outline */}
          <mesh
            position={[0, 0.005, 0.005]}
            scale={[1.13, 0.98, 0.97]}
            material={materials.outlineMat}
          >
            <cylinderGeometry args={[0.098, 0.114, 0.175, 20]} />
          </mesh>

          {/* Thick Cozy Folded Lime-Green Turtleneck Collar */}
          <mesh
            position={[0, 0.098, 0.008]}
            material={materials.sweaterRibMat}
            castShadow
          >
            <cylinderGeometry args={[0.088, 0.094, 0.056, 22]} />
          </mesh>
          <mesh
            position={[0, 0.112, 0.008]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.sweaterMat}
          >
            <torusGeometry args={[0.076, 0.016, 10, 22]} />
          </mesh>
          {/* Ivory Neck Column */}
          <mesh position={[0, 0.132, 0.008]} material={materials.faceMat}>
            <cylinderGeometry args={[0.052, 0.058, 0.05, 14]} />
          </mesh>

          {/* Left Side Puffed Balloon Sleeve & Cute Chibi Hand (+X) */}
          <group ref={rightArmRef} position={[0.102, 0.072, 0.006]} rotation={[0.06, 0, 0.48]}>
            {/* Upper Shoulder Sleeve */}
            <mesh position={[0, -0.075, 0]} material={materials.sweaterMat} castShadow>
              <cylinderGeometry args={[0.044, 0.068, 0.15, 16]} />
            </mesh>
            {/* Full Puffed Lower Balloon Sleeve (matches Image 1's cozy oversized cuff gather!) */}
            <mesh
              position={[0, -0.155, 0.005]}
              scale={[1.08, 0.92, 1.02]}
              material={materials.sweaterMat}
              castShadow
            >
              <sphereGeometry args={[0.068, 16, 14]} />
            </mesh>
            {/* Sleeve Outline */}
            <mesh
              position={[0, -0.115, 0]}
              scale={[1.08, 1.02, 1.08]}
              material={materials.outlineMat}
            >
              <cylinderGeometry args={[0.044, 0.072, 0.21, 14]} />
            </mesh>
            {/* Fitted Ribbed Green Wrist Cuff */}
            <mesh position={[0, -0.212, 0.006]} material={materials.sweaterRibMat} castShadow>
              <cylinderGeometry args={[0.046, 0.042, 0.036, 14]} />
            </mesh>
            {/* Cute Outstretched Chibi Hand + Thumb */}
            <mesh
              position={[0.006, -0.242, 0.010]}
              rotation={[0, 0, 0.28]}
              scale={[1.15, 0.78, 0.85]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.034, 12, 12]} />
            </mesh>
          </group>

          {/* Right Side Puffed Balloon Sleeve & Cute Chibi Hand (-X) */}
          <group ref={leftArmRef} position={[-0.102, 0.072, 0.006]} rotation={[0.06, 0, -0.48]}>
            {/* Upper Shoulder Sleeve */}
            <mesh position={[0, -0.075, 0]} material={materials.sweaterMat} castShadow>
              <cylinderGeometry args={[0.044, 0.068, 0.15, 16]} />
            </mesh>
            {/* Full Puffed Lower Balloon Sleeve */}
            <mesh
              position={[0, -0.155, 0.005]}
              scale={[1.08, 0.92, 1.02]}
              material={materials.sweaterMat}
              castShadow
            >
              <sphereGeometry args={[0.068, 16, 14]} />
            </mesh>
            {/* Sleeve Outline */}
            <mesh
              position={[0, -0.115, 0]}
              scale={[1.08, 1.02, 1.08]}
              material={materials.outlineMat}
            >
              <cylinderGeometry args={[0.044, 0.072, 0.21, 14]} />
            </mesh>
            {/* Fitted Ribbed Green Wrist Cuff */}
            <mesh position={[0, -0.212, 0.006]} material={materials.sweaterRibMat} castShadow>
              <cylinderGeometry args={[0.046, 0.042, 0.036, 14]} />
            </mesh>
            {/* Cute Outstretched Chibi Hand + Thumb */}
            <mesh
              position={[-0.006, -0.242, 0.010]}
              rotation={[0, 0, -0.28]}
              scale={[1.15, 0.78, 0.85]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.034, 12, 12]} />
            </mesh>
          </group>
        </group>

        {/* =============================================================== */}
        {/* 4. ANIME CHIBI HEAD: EMERALD-LIME EYES, BLUSH, MOUTH & HAIR     */}
        {/* =============================================================== */}
        <group ref={headRef} position={[0, 0.81, 0.02]} visible={cameraMode !== 'pov'}>
          {/* Smooth Porcelain-Ivory Chibi Head */}
          <mesh
            position={[0, 0, 0]}
            scale={[1.15, 0.98, 1.03]}
            material={materials.faceMat}
            castShadow
          >
            <sphereGeometry args={[0.218, 32, 28]} />
          </mesh>
          {/* Crisp Anime Head Cel Outline */}
          <mesh
            position={[0, 0, 0]}
            scale={[1.185, 1.01, 1.06]}
            material={materials.outlineMat}
          >
            <sphereGeometry args={[0.218, 28, 24]} />
          </mesh>

          {/* Plump Anime Lower Cheeks */}
          <mesh
            position={[0.095, -0.048, 0.106]}
            scale={[1.14, 0.86, 1.02]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.108, 16, 14]} />
          </mesh>
          <mesh
            position={[-0.095, -0.048, 0.106]}
            scale={[1.14, 0.86, 1.02]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.108, 16, 14]} />
          </mesh>

          {/* Cute Rounded Ears */}
          <mesh
            position={[0.242, -0.01, 0.005]}
            scale={[0.45, 0.82, 0.62]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.046, 12, 12]} />
          </mesh>
          <mesh
            position={[-0.242, -0.01, 0.005]}
            scale={[0.45, 0.82, 0.62]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.046, 12, 12]} />
          </mesh>

          {/* ============================================================= */}
          {/* HUGE SPARKLING EMERALD-TO-CHARTREUSE ANIME EYES (Image 1!)    */}
          {/* ============================================================= */}
          {/* Left Side Eye (+X) */}
          <group
            ref={leftEyeBlinkRef}
            position={[0.084, 0.006, 0.214]}
            rotation={[0.02, 0.28, 0]}
          >
            {/* Crisp White Sclera Cushion */}
            <mesh scale={[1.10, 1.18, 0.25]} material={materials.scleraMat}>
              <sphereGeometry args={[0.042, 20, 16]} />
            </mesh>
            {/* Outer Deep Forest-Green Iris Ring */}
            <mesh
              position={[-0.002, -0.001, 0.004]}
              scale={[0.98, 1.14, 0.25]}
              material={materials.irisOuterMat}
            >
              <sphereGeometry args={[0.035, 20, 16]} />
            </mesh>
            {/* Middle Rich Emerald Iris */}
            <mesh
              position={[-0.002, -0.003, 0.007]}
              scale={[0.94, 1.06, 0.24]}
              material={materials.irisMidMat}
            >
              <sphereGeometry args={[0.030, 18, 14]} />
            </mesh>
            {/* Glowing Lime-Chartreuse Lower Iris Crescent (Signature Image 1 Detail!) */}
            <mesh
              position={[-0.002, -0.012, 0.010]}
              scale={[1.05, 0.64, 0.22]}
              material={materials.irisLimeMat}
            >
              <sphereGeometry args={[0.025, 16, 12]} />
            </mesh>
            {/* Deep Forest-Black Central Pupil */}
            <mesh
              position={[-0.002, 0.002, 0.011]}
              scale={[0.92, 1.08, 0.24]}
              material={materials.pupilMat}
            >
              <sphereGeometry args={[0.017, 14, 12]} />
            </mesh>
            {/* Big Glossy White Upper-Inner Catchlight + Lower Sparkle Dots */}
            <mesh position={[-0.011, 0.014, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0105, 12, 12]} />
            </mesh>
            <mesh position={[0.012, -0.012, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0052, 8, 8]} />
            </mesh>
            <mesh position={[-0.004, -0.018, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0035, 8, 8]} />
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
              position={[0.036, 0.026, 0.006]}
              rotation={[0, 0, -0.58]}
              material={materials.lashMat}
            >
              <coneGeometry args={[0.006, 0.022, 5]} />
            </mesh>
            <mesh
              position={[0.016, 0.038, 0.007]}
              rotation={[0, 0, -0.22]}
              material={materials.lashMat}
            >
              <coneGeometry args={[0.005, 0.016, 5]} />
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
            position={[-0.084, 0.008, 0.214]}
            rotation={[0.02, -0.28, 0]}
          >
            {/* Crisp White Sclera Cushion */}
            <mesh scale={[1.10, 1.18, 0.25]} material={materials.scleraMat}>
              <sphereGeometry args={[0.042, 20, 16]} />
            </mesh>
            {/* Outer Deep Forest-Green Iris Ring */}
            <mesh
              position={[0.002, -0.001, 0.004]}
              scale={[0.98, 1.14, 0.25]}
              material={materials.irisOuterMat}
            >
              <sphereGeometry args={[0.035, 20, 16]} />
            </mesh>
            {/* Middle Rich Emerald Iris */}
            <mesh
              position={[0.002, -0.003, 0.007]}
              scale={[0.94, 1.06, 0.24]}
              material={materials.irisMidMat}
            >
              <sphereGeometry args={[0.030, 18, 14]} />
            </mesh>
            {/* Glowing Lime-Chartreuse Lower Iris Crescent */}
            <mesh
              position={[0.002, -0.012, 0.010]}
              scale={[1.05, 0.64, 0.22]}
              material={materials.irisLimeMat}
            >
              <sphereGeometry args={[0.025, 16, 12]} />
            </mesh>
            {/* Deep Forest-Black Central Pupil */}
            <mesh
              position={[0.002, 0.002, 0.011]}
              scale={[0.92, 1.08, 0.24]}
              material={materials.pupilMat}
            >
              <sphereGeometry args={[0.017, 14, 12]} />
            </mesh>
            {/* Big Glossy White Catchlights */}
            <mesh position={[-0.011, 0.014, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0105, 12, 12]} />
            </mesh>
            <mesh position={[0.012, -0.012, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0052, 8, 8]} />
            </mesh>
            <mesh position={[0.004, -0.018, 0.016]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0035, 8, 8]} />
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
              position={[-0.036, 0.026, 0.006]}
              rotation={[0, 0, 0.58]}
              material={materials.lashMat}
            >
              <coneGeometry args={[0.006, 0.022, 5]} />
            </mesh>
            <mesh
              position={[-0.016, 0.038, 0.007]}
              rotation={[0, 0, 0.22]}
              material={materials.lashMat}
            >
              <coneGeometry args={[0.005, 0.016, 5]} />
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
            position={[0.084, 0.068, 0.206]}
            rotation={[0.08, 0.28, -0.08]}
          />
          <mesh
            geometry={customGeos.eyebrowGeo}
            material={materials.browMat}
            position={[-0.084, 0.070, 0.206]}
            rotation={[0.08, -0.28, 0.08]}
          />

          {/* Tiny Delicate Anime Dot Nose */}
          <mesh
            position={[0, -0.014, 0.226]}
            scale={[1.05, 0.88, 0.78]}
            material={materials.noseMat}
          >
            <sphereGeometry args={[0.0085, 10, 10]} />
          </mesh>

          {/* Signature Cute Small Open "o" Anime Mouth (Matches Image 1!) */}
          <group ref={mouthGroupRef} position={[0, -0.048, 0.221]}>
            {/* Dark Lip Outline Ring */}
            <mesh scale={[1.18, 0.95, 0.22]} material={materials.mouthRingMat}>
              <sphereGeometry args={[0.0165, 14, 12]} />
            </mesh>
            {/* Soft Coral-Pink Open Mouth Interior */}
            <mesh
              position={[0, 0, 0.002]}
              scale={[1.12, 0.88, 0.22]}
              material={materials.mouthMat}
            >
              <sphereGeometry args={[0.014, 14, 12]} />
            </mesh>
          </group>

          {/* Rosy Peach Cheeks with 3 Diagonal Anime Blush Hash Marks (///) */}
          <group position={[0.128, -0.032, 0.196]} rotation={[0.06, 0.44, 0]}>
            <mesh scale={[1.22, 0.78, 0.22]} material={materials.blushMat}>
              <sphereGeometry args={[0.040, 16, 12]} />
            </mesh>
            {[-0.013, 0, 0.013].map((ox, i) => (
              <mesh
                key={`blush-l-${i}`}
                position={[ox, 0.002, 0.010]}
                rotation={[0, 0, -0.36]}
                material={materials.blushSlashMat}
              >
                <boxGeometry args={[0.0042, 0.022, 0.002]} />
              </mesh>
            ))}
          </group>

          <group position={[-0.128, -0.030, 0.196]} rotation={[0.06, -0.44, 0]}>
            <mesh scale={[1.22, 0.78, 0.22]} material={materials.blushMat}>
              <sphereGeometry args={[0.040, 16, 12]} />
            </mesh>
            {[-0.013, 0, 0.013].map((ox, i) => (
              <mesh
                key={`blush-r-${i}`}
                position={[ox, 0.002, 0.010]}
                rotation={[0, 0, -0.36]}
                material={materials.blushSlashMat}
              >
                <boxGeometry args={[0.0042, 0.022, 0.002]} />
              </mesh>
            ))}
          </group>

          {/* ============================================================= */}
          {/* LAYERED LIME-GREEN WOLF-CUT / FEATHERED BOB HAIR (Image 1!)   */}
          {/* ============================================================= */}
          <group position={[0, 0.015, -0.01]}>
            {/* 1. Full Rounded Upper Crown Dome (`thetaLength = 0.44 * PI` — Clear of Eyes) */}
            <mesh
              position={[0, 0.052, -0.012]}
              scale={[1.22, 1.04, 1.14]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry
                args={[0.226, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.44]}
              />
            </mesh>
            {/* Crown Cel Outline */}
            <mesh
              position={[0, 0.052, -0.012]}
              scale={[1.26, 1.07, 1.17]}
              material={materials.outlineMat}
            >
              <sphereGeometry
                args={[0.226, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.44]}
              />
            </mesh>

            {/* 2. Bright Chartreuse-Yellow Anime Hair Crown Highlights (Exact Match to Image 1!) */}
            <mesh
              position={[-0.025, 0.152, 0.168]}
              rotation={[0.45, -0.1, 0.08]}
              scale={[1.35, 0.55, 0.35]}
              material={materials.hairHighlightMat}
            >
              <sphereGeometry args={[0.042, 14, 12]} />
            </mesh>
            <mesh
              position={[0.085, 0.158, 0.148]}
              rotation={[0.42, 0.3, -0.15]}
              scale={[1.1, 0.65, 0.32]}
              material={materials.hairHighlightMat}
            >
              <sphereGeometry args={[0.026, 12, 10]} />
            </mesh>
            <mesh
              position={[-0.105, 0.155, 0.142]}
              rotation={[0.42, -0.3, 0.15]}
              scale={[0.95, 0.6, 0.32]}
              material={materials.hairHighlightMat}
            >
              <sphereGeometry args={[0.022, 12, 10]} />
            </mesh>

            {/* 3. Back & Side Layered Bell-Bob Hair Curtain (Open in Front) */}
            <mesh
              position={[0, -0.048, -0.028]}
              scale={[1.28, 1.08, 1.14]}
              material={materials.hairMat}
              castShadow
            >
              <cylinderGeometry
                args={[0.205, 0.285, 0.31, 28, 1, false, Math.PI * 0.36, Math.PI * 1.28]}
              />
            </mesh>
            {/* Darker Forest-Green Inner Hair Shadow Layer */}
            <mesh
              position={[0, -0.062, -0.022]}
              scale={[1.22, 1.05, 1.08]}
              material={materials.hairShadowMat}
            >
              <cylinderGeometry
                args={[0.195, 0.268, 0.30, 24, 1, false, Math.PI * 0.38, Math.PI * 1.24]}
              />
            </mesh>

            {/* Back Skull Closure Sphere */}
            <mesh
              position={[0, 0.012, -0.045]}
              scale={[1.20, 1.02, 1.06]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry
                args={[0.218, 22, 18, Math.PI * 0.34, Math.PI * 1.32, 0, Math.PI * 0.78]}
              />
            </mesh>

            {/* 4. Signature 3-Tier Outward-Winged Feathered Side Locks (Left & Right — Image 1!) */}
            {/* Left Side (+X) 3-Tier Outward Flared Hair Wings */}
            <group ref={sideWingsLeftRef} position={[0.215, -0.02, 0.03]}>
              {/* Upper Cheek-Framing Lock */}
              <mesh
                position={[-0.01, 0.01, 0.02]}
                rotation={[0.08, 0.22, 0.34]}
                scale={[0.72, 1.15, 0.88]}
                material={materials.hairMat}
                castShadow
              >
                <sphereGeometry args={[0.115, 16, 14]} />
              </mesh>
              {/* Middle Outward-Flicked Wing Lock */}
              <mesh
                geometry={wingLockGeo}
                material={materials.hairMat}
                position={[0.048, -0.085, -0.01]}
                rotation={[0.05, 0.12, 2.38]}
                castShadow
              />
              {/* Lower Shoulder-Length Wide Outward Wing Lock */}
              <mesh
                geometry={wingLockGeo}
                material={materials.hairMat}
                position={[0.062, -0.168, -0.025]}
                rotation={[0.08, 0.18, 2.22]}
                scale={[1.15, 1.18, 1.0]}
                castShadow
              />
              {/* Inner Shadow Accent Wing */}
              <mesh
                geometry={wingLockGeo}
                material={materials.hairShadowMat}
                position={[0.018, -0.195, -0.045]}
                rotation={[0.12, 0.25, 2.52]}
                scale={[0.92, 0.95, 0.9]}
              />
            </group>

            {/* Right Side (-X) 3-Tier Outward Flared Hair Wings */}
            <group ref={sideWingsRightRef} position={[-0.215, -0.02, 0.03]}>
              {/* Upper Cheek-Framing Lock */}
              <mesh
                position={[0.01, 0.01, 0.02]}
                rotation={[0.08, -0.22, -0.34]}
                scale={[0.72, 1.15, 0.88]}
                material={materials.hairMat}
                castShadow
              >
                <sphereGeometry args={[0.115, 16, 14]} />
              </mesh>
              {/* Middle Outward-Flicked Wing Lock */}
              <mesh
                geometry={wingLockGeo}
                material={materials.hairMat}
                position={[-0.048, -0.085, -0.01]}
                rotation={[0.05, -0.12, -2.38]}
                castShadow
              />
              {/* Lower Shoulder-Length Wide Outward Wing Lock */}
              <mesh
                geometry={wingLockGeo}
                material={materials.hairMat}
                position={[-0.062, -0.168, -0.025]}
                rotation={[0.08, -0.18, -2.22]}
                scale={[1.15, 1.18, 1.0]}
                castShadow
              />
              {/* Inner Shadow Accent Wing */}
              <mesh
                geometry={wingLockGeo}
                material={materials.hairShadowMat}
                position={[-0.018, -0.195, -0.045]}
                rotation={[0.12, -0.25, -2.52]}
                scale={[0.92, 0.95, 0.9]}
              />
            </group>

            {/* 5. Feathered Front Fringe Bangs (Parted Above Eyes + Central Nose-Bridge Lock!) */}
            {[
              // Outer Left Bang
              [0.142, 0.104, 0.172, 0.16, 0.36, -0.26, 0.9, 0.98],
              // Mid Left Bang Above Left Brow
              [0.082, 0.122, 0.196, 0.22, 0.16, -0.12, 0.88, 0.94],
              // Center-Left Parted Lock (Dips gracefully between the eyes, leaving eyes 100% clear!)
              [0.018, 0.106, 0.212, 0.24, 0.04, -0.08, 0.72, 1.10],
              // Center-Right Parted Lock
              [-0.016, 0.108, 0.212, 0.24, -0.04, 0.06, 0.68, 1.06],
              // Mid Right Bang Above Right Brow
              [-0.082, 0.122, 0.196, 0.22, -0.16, 0.12, 0.88, 0.94],
              // Outer Right Bang
              [-0.142, 0.104, 0.172, 0.16, -0.36, 0.26, 0.9, 0.98],
            ].map(([bx, by, bz, rx, ry, rz, sx, sy], idx) => (
              <mesh
                key={`bang-${idx}`}
                geometry={bangCapsuleGeo}
                material={materials.hairMat}
                position={[bx, by, bz]}
                rotation={[rx, ry, rz]}
                scale={[sx, sy, 0.44]}
                castShadow
              />
            ))}

            {/* 6. Spring-Physics Outer Flyaway Hair Strands & Lower Flicks */}
            <group ref={hairStrandsRef} position={[0, 0.02, 0.02]}>
              <mesh geometry={customGeos.leftFlyaway} material={materials.hairMat} castShadow />
              <mesh geometry={customGeos.leftOuterFlick} material={materials.hairMat} castShadow />
              <mesh geometry={customGeos.rightFlyaway} material={materials.hairMat} castShadow />
              <mesh geometry={customGeos.rightOuterFlick} material={materials.hairMat} castShadow />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
