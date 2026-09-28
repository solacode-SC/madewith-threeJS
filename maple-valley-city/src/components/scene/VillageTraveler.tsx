import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraMode, VirtualWalkInput } from '../../domain/cityConfig';
import {
  CITY_DISTRICTS,
  INITIAL_MAPLE_CHARMS,
  resolveCityCollision,
  steerAroundObstacles,
} from '../../domain/cityLayout';
import { soundtrack } from '../../audio/SoundtrackEngine';

interface VillageTravelerProps {
  cameraMode: CameraMode;
  autoWalk: boolean;
  collectedCharms: number[];
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
  onDiscoverDistrict: (districtId: string) => void;
  onCollectCharm: (charmId: number) => void;
  onSelectCharacter: () => void;
  onHover: (label: string | null) => void;
}

const _desiredDir = new THREE.Vector2();

export default function VillageTraveler({
  cameraMode,
  autoWalk: _autoWalk,
  collectedCharms,
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
  onDiscoverDistrict,
  onCollectCharm,
  onSelectCharacter,
  onHover,
}: VillageTravelerProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyBounceRef = useRef<THREE.Group>(null);
  const skirtRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const ahogeRef = useRef<THREE.Group>(null);
  const sideLocksLeftRef = useRef<THREE.Group>(null);
  const sideLocksRightRef = useRef<THREE.Group>(null);
  const leftEyeBlinkRef = useRef<THREE.Group>(null);
  const rightEyeBlinkRef = useRef<THREE.Group>(null);
  const mouthGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const obiBowRef = useRef<THREE.Group>(null);
  const groundRingRef = useRef<THREE.Group>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const velocityRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const stridePhaseRef = useRef<number>(0);
  const avoidTurnSignRef = useRef<number>(1);
  const manualSteerOffsetRef = useRef<number>(0);
  const stuckTimerRef = useRef<number>(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        if (!soundtrack.getState().isPlaying) {
          void soundtrack.start();
        }
        onManualMove();
      }
      if (k === 'f') {
        waveTimerRef.current = 2.6;
      }
      if (k === ' ') {
        e.preventDefault();
        if (jumpHeightRef.current <= 0.01) {
          jumpVelRef.current = 4.6;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        manualSteerOffsetRef.current = 0;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onManualMove, waveTimerRef, jumpVelRef, jumpHeightRef]);

  // High-Clarity Anime Cel-Inspired Materials for Kaede (Straight Look & Big Smile!)
  const mats = useMemo(() => {
    return {
      skin: new THREE.MeshStandardMaterial({
        color: '#FFF3E8',
        roughness: 0.42,
        emissive: '#FFE6D4',
        emissiveIntensity: 0.26,
      }),
      hairMain: new THREE.MeshStandardMaterial({
        color: '#2B1E1A',
        roughness: 0.45,
        emissive: '#1D1310',
        emissiveIntensity: 0.14,
        side: THREE.DoubleSide,
      }),
      hairShadow: new THREE.MeshStandardMaterial({
        color: '#1A110E',
        roughness: 0.52,
        side: THREE.DoubleSide,
      }),
      hairHighlight: new THREE.MeshBasicMaterial({
        color: '#8C5B48',
      }),
      hairHighlightBright: new THREE.MeshBasicMaterial({
        color: '#C78D75',
      }),
      haoriPersimmon: new THREE.MeshStandardMaterial({
        color: '#E65328',
        roughness: 0.48,
        emissive: '#B83814',
        emissiveIntensity: 0.14,
      }),
      haoriGoldTrim: new THREE.MeshStandardMaterial({
        color: '#F5B041',
        roughness: 0.38,
        metalness: 0.25,
      }),
      kimonoCream: new THREE.MeshStandardMaterial({
        color: '#FFF9F0',
        roughness: 0.52,
        emissive: '#F5E6D0',
        emissiveIntensity: 0.12,
      }),
      collarCrimson: new THREE.MeshStandardMaterial({
        color: '#D93829',
        roughness: 0.45,
      }),
      hakamaSage: new THREE.MeshStandardMaterial({
        color: '#3F5E43',
        roughness: 0.52,
        emissive: '#283D2B',
        emissiveIntensity: 0.1,
      }),
      hakamaFold: new THREE.MeshStandardMaterial({
        color: '#2C4430',
        roughness: 0.58,
      }),
      obiGold: new THREE.MeshStandardMaterial({
        color: '#F2A93B',
        roughness: 0.42,
        emissive: '#C97A16',
        emissiveIntensity: 0.14,
      }),
      sockCream: new THREE.MeshStandardMaterial({
        color: '#FFFBF5',
        roughness: 0.48,
      }),
      bootsSepia: new THREE.MeshStandardMaterial({
        color: '#36261E',
        roughness: 0.45,
      }),
      bootSole: new THREE.MeshStandardMaterial({
        color: '#221712',
        roughness: 0.7,
      }),
      inkOutline: new THREE.MeshBasicMaterial({
        color: '#221612',
        side: THREE.BackSide,
      }),
      lashMat: new THREE.MeshBasicMaterial({ color: '#1F1310' }),
      browMat: new THREE.MeshBasicMaterial({ color: '#2E1C16' }),
      scleraMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      irisOuterMat: new THREE.MeshBasicMaterial({ color: '#5E1914' }),
      irisMidMat: new THREE.MeshBasicMaterial({ color: '#E25822' }),
      irisLowerMat: new THREE.MeshBasicMaterial({ color: '#FFCC4D' }),
      pupilMat: new THREE.MeshBasicMaterial({ color: '#1F0A08' }),
      catchlightMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      blushMat: new THREE.MeshBasicMaterial({
        color: '#FF8A80',
        transparent: true,
        opacity: 0.82,
      }),
      blushSlashMat: new THREE.MeshBasicMaterial({ color: '#E04F44' }),
      noseMat: new THREE.MeshBasicMaterial({ color: '#DDA08E' }),
      mouthInteriorMat: new THREE.MeshBasicMaterial({ color: '#E85D68' }),
      mouthOutlineMat: new THREE.MeshBasicMaterial({ color: '#4A1C1A' }),
      teethWhiteMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      tonguePinkMat: new THREE.MeshBasicMaterial({ color: '#FF9EAA' }),
    };
  }, []);

  // Custom Sculpted Anime Geometries for Big Smile, Winged Eyelashes, Sleek Straight Locks & Ahoge
  const customGeos = useMemo(() => {
    // Bouncy Top Ahoge Hair Curl
    const ahogeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.01, 0.065, 0.015),
      new THREE.Vector3(0.032, 0.125, 0.04),
      new THREE.Vector3(0.082, 0.105, 0.055),
      new THREE.Vector3(0.065, 0.072, 0.045),
    ]);

    // Bold Anime Upper Eyelash Arch
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.045, 0.004, -0.003),
      new THREE.Vector3(-0.024, 0.028, 0.005),
      new THREE.Vector3(0, 0.035, 0.008),
      new THREE.Vector3(0.024, 0.028, 0.005),
      new THREE.Vector3(0.047, 0.006, -0.002),
    ]);

    // Eyelid Crease
    const lidCreaseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.032, 0.038, 0.002),
      new THREE.Vector3(0, 0.046, 0.006),
      new THREE.Vector3(0.032, 0.038, 0.002),
    ]);

    // Straight-Look Confident Anime Eyebrow
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.035, 0.001, -0.002),
      new THREE.Vector3(0, 0.009, 0.004),
      new THREE.Vector3(0.035, 0.002, -0.002),
    ]);

    // BIG SMILE Upper Arch & Wide Open Happy Lower Smile Arc (◡ / :D)
    const bigSmileUpperCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.044, 0.012, -0.005),
      new THREE.Vector3(-0.022, 0.005, 0.004),
      new THREE.Vector3(0, 0.003, 0.007),
      new THREE.Vector3(0.022, 0.005, 0.004),
      new THREE.Vector3(0.044, 0.012, -0.005),
    ]);

    const bigSmileLowerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.044, 0.012, -0.005),
      new THREE.Vector3(-0.028, -0.018, 0.003),
      new THREE.Vector3(0, -0.028, 0.006),
      new THREE.Vector3(0.028, -0.018, 0.003),
      new THREE.Vector3(0.044, 0.012, -0.005),
    ]);

    const bangCapsuleGeo = new THREE.CapsuleGeometry(0.034, 0.082, 8, 12);

    return {
      ahogeGeo: new THREE.TubeGeometry(ahogeCurve, 16, 0.014, 8, false),
      upperLashGeo: new THREE.TubeGeometry(lashCurve, 16, 0.0082, 8, false),
      lidCreaseGeo: new THREE.TubeGeometry(lidCreaseCurve, 10, 0.0026, 6, false),
      eyebrowGeo: new THREE.TubeGeometry(browCurve, 12, 0.0046, 6, false),
      bigSmileUpperGeo: new THREE.TubeGeometry(bigSmileUpperCurve, 16, 0.0048, 8, false),
      bigSmileLowerGeo: new THREE.TubeGeometry(bigSmileLowerCurve, 18, 0.0052, 8, false),
      bangCapsuleGeo,
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.065);
    const elapsed = state.clock.getElapsedTime();
    const pos = characterPosRef.current;
    const keys = keysRef.current;
    const vInput = virtualInputRef.current;

    const moveUp = keys['w'] || keys['arrowup'] || vInput.up;
    const moveDown = keys['s'] || keys['arrowdown'] || vInput.down;
    const moveLeft = keys['a'] || keys['arrowleft'] || vInput.left;
    const moveRight = keys['d'] || keys['arrowright'] || vInput.right;
    const sprinting = keys['shift'] || vInput.sprint;

    const forwardInput = (moveUp ? 1 : 0) - (moveDown ? 1 : 0);
    const strafeInput = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);

    const camYaw = cameraYawRef.current;
    const fwdX = Math.sin(camYaw);
    const fwdZ = Math.cos(camYaw);
    const rightX = -fwdZ;
    const rightZ = fwdX;

    _desiredDir.set(0, 0);
    let isMovingInput = false;

    if (forwardInput !== 0 || strafeInput !== 0) {
      let rawX = fwdX * forwardInput + rightX * strafeInput;
      let rawZ = fwdZ * forwardInput + rightZ * strafeInput;
      const len = Math.hypot(rawX, rawZ);
      if (len > 0.001) {
        rawX /= len;
        rawZ /= len;
        // Apply persistent obstacle deflection angle if steering around a tree or house
        if (Math.abs(manualSteerOffsetRef.current) > 0.001) {
          const baseAng = Math.atan2(rawX, rawZ) + manualSteerOffsetRef.current;
          rawX = Math.sin(baseAng);
          rawZ = Math.cos(baseAng);
        }
        _desiredDir.set(rawX, rawZ);
        isMovingInput = true;
      }
    } else if (walkPathRef.current.length > 0) {
      const target = walkPathRef.current[0];
      const dx = target.x - pos.x;
      const dz = target.z - pos.z;
      const dist = Math.hypot(dx, dz);
      const reachRadius = walkPathRef.current.length > 1 ? 0.55 : 0.35;
      if (dist < reachRadius) {
        walkPathRef.current.shift();
        stuckTimerRef.current = 0;
        if (walkPathRef.current.length === 0) {
          onClearWalkTarget();
        }
      } else {
        _desiredDir.set(dx / dist, dz / dist);
        isMovingInput = true;
      }
    }

    // =========================================================================
    // FLEXIBLE OBSTACLE AVOIDANCE & AUTOMATIC DIRECTION STEERING
    // When Kaede faces a tree, boulder, fence, or house wall, she automatically
    // steers and changes direction around the obstacle so she NEVER stops!
    // =========================================================================
    if (isMovingInput && _desiredDir.lengthSq() > 0.001) {
      const steered = steerAroundObstacles(
        pos.x,
        pos.z,
        _desiredDir.x,
        _desiredDir.y,
        0.42,
        avoidTurnSignRef.current
      );
      avoidTurnSignRef.current = steered.turnSign;
      _desiredDir.set(steered.dirX, steered.dirZ);

      if (steered.deflected) {
        if (forwardInput !== 0 || strafeInput !== 0) {
          // Smoothly rotate persistent heading offset so holding W continues around the obstacle
          manualSteerOffsetRef.current += steered.turnSign * dt * 2.1;
          // Also gently guide camera yaw when turning around obstacles
          cameraYawRef.current -= steered.turnSign * dt * 0.85;
        } else if (walkPathRef.current.length > 0) {
          stuckTimerRef.current += dt;
          // If current waypoint is right inside/behind an obstacle, advance to next or offset it
          if (stuckTimerRef.current > 0.45) {
            stuckTimerRef.current = 0;
            if (walkPathRef.current.length > 1) {
              walkPathRef.current.shift();
            } else {
              walkPathRef.current[0].x = pos.x + steered.dirX * 2.2;
              walkPathRef.current[0].z = pos.z + steered.dirZ * 2.2;
            }
          }
        }
      } else if (forwardInput !== 0 || strafeInput !== 0) {
        // Decay manual steer offset gradually once past the obstacle
        manualSteerOffsetRef.current = THREE.MathUtils.lerp(
          manualSteerOffsetRef.current,
          0,
          Math.min(1, dt * 3.5)
        );
      }
    }

    const maxSpeed = sprinting ? 7.2 : 4.8;
    const targetVx = _desiredDir.x * maxSpeed;
    const targetVz = _desiredDir.y * maxSpeed;

    velocityRef.current.x = THREE.MathUtils.lerp(
      velocityRef.current.x,
      targetVx,
      Math.min(1, dt * 18)
    );
    velocityRef.current.y = THREE.MathUtils.lerp(
      velocityRef.current.y,
      targetVz,
      Math.min(1, dt * 18)
    );

    const speed = velocityRef.current.length();
    characterSpeedRef.current = speed;

    if (speed > 0.02) {
      const startX = pos.x;
      const startZ = pos.z;
      const subSteps = speed * dt > 0.2 ? 2 : 1;
      const subDt = dt / subSteps;

      let curX = startX;
      let curZ = startZ;

      for (let s = 0; s < subSteps; s++) {
        const nextX = curX + velocityRef.current.x * subDt;
        const nextZ = curZ + velocityRef.current.y * subDt;
        const resolved = resolveCityCollision(nextX, nextZ, 0.36);

        if (resolved.hitObstacle) {
          // Compute tangent vector perpendicular to obstacle normal so she slides & changes direction!
          const tanX = -resolved.normalZ * avoidTurnSignRef.current;
          const tanZ = resolved.normalX * avoidTurnSignRef.current;
          curX = resolved.x + tanX * speed * subDt * 0.65;
          curZ = resolved.z + tanZ * speed * subDt * 0.65;
          const reResolved = resolveCityCollision(curX, curZ, 0.36);
          curX = reResolved.x;
          curZ = reResolved.z;

          // Rotate velocity vector toward the open tangent so she visibly turns and keeps moving
          velocityRef.current.x = THREE.MathUtils.lerp(
            velocityRef.current.x,
            tanX * maxSpeed,
            Math.min(1, subDt * 16)
          );
          velocityRef.current.y = THREE.MathUtils.lerp(
            velocityRef.current.y,
            tanZ * maxSpeed,
            Math.min(1, subDt * 16)
          );
        } else {
          curX = resolved.x;
          curZ = resolved.z;
        }
      }

      pos.x = curX;
      pos.z = curZ;

      // Face straight in the direction of movement
      const actualDx = curX - startX;
      const actualDz = curZ - startZ;
      const moveAngle =
        actualDx * actualDx + actualDz * actualDz > 0.00001
          ? Math.atan2(actualDx, actualDz)
          : Math.atan2(velocityRef.current.x, velocityRef.current.y);

      let diff = moveAngle - characterYawRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      characterYawRef.current += diff * Math.min(1, dt * 16);
    } else {
      // When standing still / idle / waving, face straight toward the camera so her straight look & big smile shine!
      const toCamX = state.camera.position.x - pos.x;
      const toCamZ = state.camera.position.z - pos.z;
      const faceCamYaw = Math.atan2(toCamX, toCamZ);
      let diff = faceCamYaw - characterYawRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      characterYawRef.current += diff * Math.min(1, dt * 8.5);
    }

    // Jump physics
    if (jumpHeightRef.current > 0 || jumpVelRef.current !== 0) {
      jumpHeightRef.current += jumpVelRef.current * dt;
      jumpVelRef.current -= 13.5 * dt;
      if (jumpHeightRef.current <= 0) {
        jumpHeightRef.current = 0;
        jumpVelRef.current = 0;
      }
    }

    // District & Charm proximity detection
    for (let i = 0; i < CITY_DISTRICTS.length; i++) {
      const d = CITY_DISTRICTS[i];
      const dx = pos.x - d.worldX;
      const dz = pos.z - d.worldZ;
      if (dx * dx + dz * dz < 8.5) {
        onDiscoverDistrict(d.id);
      }
    }

    for (let i = 0; i < INITIAL_MAPLE_CHARMS.length; i++) {
      const c = INITIAL_MAPLE_CHARMS[i];
      if (!collectedCharms.includes(c.id)) {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        if (dx * dx + dz * dz < 1.35) {
          onCollectCharm(c.id);
        }
      }
    }

    // =========================================================================
    // ANIME CHARACTER ANIMATION: STRAIGHT POSTURE, BIG SMILE & EXPRESSIVE BLINK
    // =========================================================================
    if (speed > 0.1) {
      stridePhaseRef.current += dt * (6.8 + speed * 1.5);
    } else {
      stridePhaseRef.current += dt * 1.8;
    }
    const stride = speed > 0.1 ? Math.sin(stridePhaseRef.current) : 0;
    const bounce =
      speed > 0.1
        ? Math.abs(Math.cos(stridePhaseRef.current)) * 0.055
        : Math.sin(elapsed * 2.4) * 0.012;

    if (waveTimerRef.current > 0) {
      waveTimerRef.current = Math.max(0, waveTimerRef.current - dt);
    }

    // 1. Expressive Anime Eye Blinking
    const blinkCycle = elapsed % 3.6;
    const blinkScaleY =
      blinkCycle > 3.44
        ? Math.max(0.08, Math.abs((blinkCycle - 3.52) / 0.08))
        : 1.0;
    if (leftEyeBlinkRef.current && rightEyeBlinkRef.current) {
      leftEyeBlinkRef.current.scale.y = blinkScaleY;
      rightEyeBlinkRef.current.scale.y = blinkScaleY;
    }

    // 2. Cheerful Big Anime Smile Pulse
    if (mouthGroupRef.current) {
      const smileScale =
        waveTimerRef.current > 0 || jumpHeightRef.current > 0.02
          ? 1.18
          : 1.04 + Math.sin(elapsed * 3.0) * 0.04;
      mouthGroupRef.current.scale.set(smileScale, smileScale, 1);
    }

    if (rootRef.current) {
      rootRef.current.position.set(pos.x, jumpHeightRef.current, pos.z);
      rootRef.current.rotation.y = characterYawRef.current;
      rootRef.current.visible = cameraMode !== 'pov';
    }

    // Straight, proud anime posture (no sideways head slouch!)
    if (bodyBounceRef.current) {
      bodyBounceRef.current.position.y = bounce;
      bodyBounceRef.current.rotation.x = speed > 0.1 ? Math.min(0.08, speed * 0.012) : 0;
      bodyBounceRef.current.rotation.z = 0;
    }

    if (headRef.current) {
      headRef.current.rotation.x = speed > 0.1 ? -Math.min(0.06, speed * 0.01) : 0;
      headRef.current.rotation.z = 0; // Straight look!
    }

    if (ahogeRef.current) {
      ahogeRef.current.rotation.z = Math.sin(elapsed * 3.2 + stridePhaseRef.current) * 0.12;
    }

    if (sideLocksLeftRef.current && sideLocksRightRef.current) {
      const lockFlutter = Math.abs(stride) * 0.05 + Math.sin(elapsed * 2.8) * 0.02;
      sideLocksLeftRef.current.rotation.z = lockFlutter;
      sideLocksRightRef.current.rotation.z = -lockFlutter;
    }

    if (skirtRef.current) {
      const flare = 1.0 + Math.abs(stride) * 0.035;
      skirtRef.current.scale.set(flare, 1, flare);
      skirtRef.current.rotation.z = stride * 0.03;
    }

    if (obiBowRef.current) {
      obiBowRef.current.rotation.z = Math.sin(elapsed * 3.5 + stridePhaseRef.current) * 0.06;
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = stride * 0.58;
      rightLegRef.current.rotation.x = -stride * 0.58;
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = -stride * 0.46;
      leftArmRef.current.rotation.z = -0.32 - Math.sin(elapsed * 2.2) * 0.03;
      if (waveTimerRef.current > 0) {
        rightArmRef.current.rotation.x = -0.25;
        rightArmRef.current.rotation.z = 2.15 + Math.sin(elapsed * 11) * 0.26;
      } else {
        rightArmRef.current.rotation.x = stride * 0.46;
        rightArmRef.current.rotation.z = 0.32 + Math.sin(elapsed * 2.2) * 0.03;
      }
    }

    if (groundRingRef.current) {
      groundRingRef.current.rotation.z = elapsed * 1.1;
    }
  });

  return (
    <group
      ref={rootRef}
      onClick={(e) => {
        e.stopPropagation();
        waveTimerRef.current = 2.6;
        onSelectCharacter();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover('🍁 Kaede (楓) — Anime Shanshui Explorer • Click to Wave & Cycle Camera');
      }}
      onPointerOut={() => onHover(null)}
    >
      {/* Dedicated Front & Rim Fill Lights so Kaede's Straight Gaze & Big Anime Smile Always Shine */}
      <pointLight position={[0, 0.92, 0.72]} color="#FFFBF4" intensity={1.05} distance={4.2} />
      <pointLight position={[0, 0.88, -0.55]} color="#FFD6A8" intensity={0.6} distance={3.5} />

      {/* Subtle Ground Brush Shadow & Persimmon Halo Ring */}
      <group ref={groundRingRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <circleGeometry args={[0.32, 24]} />
          <meshBasicMaterial color="#3B2E26" transparent opacity={0.26} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.28, 0.33, 28]} />
          <meshBasicMaterial
            color="#F78E44"
            transparent
            opacity={0.58}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* MAIN STRAIGHT-POSTURE ANIME CHARACTER BODY                          */}
      {/* =================================================================== */}
      <group ref={bodyBounceRef}>
        {/* 1. Legs, Cream Knee-High Socks & Laced Anime Traveler Boots */}
        <group position={[0, 0.24, 0]}>
          {/* Left Side Leg (+X) */}
          <group ref={leftLegRef} position={[0.074, 0, 0]}>
            <mesh position={[0, -0.04, 0]} material={mats.sockCream} castShadow>
              <cylinderGeometry args={[0.042, 0.038, 0.1, 14]} />
            </mesh>
            {/* Crimson Sock Ribbon Trim */}
            <mesh position={[0, -0.01, 0]} material={mats.collarCrimson}>
              <cylinderGeometry args={[0.0435, 0.0435, 0.014, 14]} />
            </mesh>
            {/* Laced Traveler Boot */}
            <mesh position={[0, -0.13, 0.01]} material={mats.bootsSepia} castShadow>
              <capsuleGeometry args={[0.046, 0.09, 6, 12]} />
            </mesh>
            <mesh
              position={[0, -0.19, 0.028]}
              scale={[1.04, 0.45, 1.35]}
              material={mats.bootSole}
            >
              <sphereGeometry args={[0.048, 12, 10]} />
            </mesh>
          </group>

          {/* Right Side Leg (-X) */}
          <group ref={rightLegRef} position={[-0.074, 0, 0]}>
            <mesh position={[0, -0.04, 0]} material={mats.sockCream} castShadow>
              <cylinderGeometry args={[0.042, 0.038, 0.1, 14]} />
            </mesh>
            {/* Crimson Sock Ribbon Trim */}
            <mesh position={[0, -0.01, 0]} material={mats.collarCrimson}>
              <cylinderGeometry args={[0.0435, 0.0435, 0.014, 14]} />
            </mesh>
            {/* Laced Traveler Boot */}
            <mesh position={[0, -0.13, 0.01]} material={mats.bootsSepia} castShadow>
              <capsuleGeometry args={[0.046, 0.09, 6, 12]} />
            </mesh>
            <mesh
              position={[0, -0.19, 0.028]}
              scale={[1.04, 0.45, 1.35]}
              material={mats.bootSole}
            >
              <sphereGeometry args={[0.048, 12, 10]} />
            </mesh>
          </group>
        </group>

        {/* 2. Pleated Matcha-Sage Hakama Skirt with Sculpted Vertical Pleats */}
        <group ref={skirtRef} position={[0, 0.34, 0]}>
          <mesh material={mats.hakamaSage} castShadow>
            <cylinderGeometry args={[0.135, 0.255, 0.27, 22]} />
          </mesh>
          <mesh material={mats.inkOutline} scale={[1.045, 1.03, 1.045]}>
            <cylinderGeometry args={[0.135, 0.255, 0.27, 18]} />
          </mesh>
          {/* Golden Hem Trim Band */}
          <mesh position={[0, -0.122, 0]} material={mats.haoriGoldTrim}>
            <cylinderGeometry args={[0.246, 0.258, 0.022, 22]} />
          </mesh>
          {/* 8 Sculpted Pleat Ridges around Skirt */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh
                key={`pleat-${i}`}
                position={[Math.sin(a) * 0.195, -0.01, Math.cos(a) * 0.195]}
                rotation={[0, a, 0]}
                material={mats.hakamaFold}
              >
                <boxGeometry args={[0.018, 0.24, 0.016]} />
              </mesh>
            );
          })}
        </group>

        {/* 3. Cream Inner Kimono, Crimson Collar, Golden Obi Sash & 3D Back Obi Bow */}
        <group position={[0, 0.54, 0]}>
          <mesh material={mats.kimonoCream} castShadow>
            <cylinderGeometry args={[0.12, 0.155, 0.25, 20]} />
          </mesh>
          {/* Crossed Crimson & White V-Collar (Eri) */}
          <mesh
            position={[0.028, 0.09, 0.105]}
            rotation={[0.2, 0, -0.45]}
            material={mats.collarCrimson}
          >
            <boxGeometry args={[0.028, 0.11, 0.02]} />
          </mesh>
          <mesh
            position={[-0.028, 0.09, 0.108]}
            rotation={[0.2, 0, 0.45]}
            material={mats.collarCrimson}
          >
            <boxGeometry args={[0.028, 0.11, 0.02]} />
          </mesh>
          {/* Slender Anime Neck */}
          <mesh position={[0, 0.145, 0.01]} material={mats.skin}>
            <cylinderGeometry args={[0.052, 0.058, 0.06, 14]} />
          </mesh>

          {/* Golden Brocade Obi Sash */}
          <mesh position={[0, -0.065, 0]} material={mats.obiGold} castShadow>
            <cylinderGeometry args={[0.152, 0.162, 0.085, 20]} />
          </mesh>
          {/* Front Crimson Obijime Cord & Golden Maple Clasp */}
          <mesh position={[0, -0.065, 0.004]} material={mats.collarCrimson}>
            <cylinderGeometry args={[0.158, 0.164, 0.018, 20]} />
          </mesh>
          <mesh position={[0, -0.065, 0.165]} rotation={[0, 0, Math.PI / 4]} material={mats.haoriGoldTrim}>
            <boxGeometry args={[0.032, 0.032, 0.016]} />
          </mesh>

          {/* 3D Decorative Back Obi Bow (Taiko Musubi) */}
          <group ref={obiBowRef} position={[0, -0.05, -0.175]}>
            <mesh
              position={[-0.075, 0.01, 0]}
              rotation={[0, -0.25, 0.35]}
              scale={[1.1, 0.75, 0.45]}
              material={mats.obiGold}
              castShadow
            >
              <sphereGeometry args={[0.075, 14, 12]} />
            </mesh>
            <mesh
              position={[0.075, 0.01, 0]}
              rotation={[0, 0.25, -0.35]}
              scale={[1.1, 0.75, 0.45]}
              material={mats.obiGold}
              castShadow
            >
              <sphereGeometry args={[0.075, 14, 12]} />
            </mesh>
            <mesh material={mats.collarCrimson} castShadow>
              <sphereGeometry args={[0.038, 12, 12]} />
            </mesh>
          </group>

          {/* Persimmon-Crimson Open Autumn Haori Jacket + Cel Outline */}
          <mesh position={[0, 0.0, -0.01]} material={mats.haoriPersimmon} castShadow>
            <cylinderGeometry
              args={[0.135, 0.215, 0.27, 20, 1, false, Math.PI * 0.22, Math.PI * 1.56]}
            />
          </mesh>
          <mesh
            position={[0, 0.0, -0.01]}
            material={mats.inkOutline}
            scale={[1.045, 1.03, 1.045]}
          >
            <cylinderGeometry
              args={[0.135, 0.215, 0.27, 18, 1, false, Math.PI * 0.22, Math.PI * 1.56]}
            />
          </mesh>
        </group>

        {/* 4. Wide Anime Haori Bell Sleeves & Cute Chibi Hands */}
        {/* Left Side Sleeve (-X) */}
        <group ref={leftArmRef} position={[-0.13, 0.62, 0.01]}>
          <mesh
            position={[-0.04, -0.095, 0]}
            rotation={[0, 0, -0.22]}
            material={mats.haoriPersimmon}
            castShadow
          >
            <coneGeometry args={[0.092, 0.22, 16]} />
          </mesh>
          <mesh
            position={[-0.04, -0.095, 0]}
            rotation={[0, 0, -0.22]}
            scale={[1.05, 1.03, 1.05]}
            material={mats.inkOutline}
          >
            <coneGeometry args={[0.092, 0.22, 14]} />
          </mesh>
          <mesh position={[-0.065, -0.2, 0.01]} material={mats.skin} castShadow>
            <sphereGeometry args={[0.038, 12, 12]} />
          </mesh>
        </group>

        {/* Right Side Sleeve (+X) */}
        <group ref={rightArmRef} position={[0.13, 0.62, 0.01]}>
          <mesh
            position={[0.04, -0.095, 0]}
            rotation={[0, 0, 0.22]}
            material={mats.haoriPersimmon}
            castShadow
          >
            <coneGeometry args={[0.092, 0.22, 16]} />
          </mesh>
          <mesh
            position={[0.04, -0.095, 0]}
            rotation={[0, 0, 0.22]}
            scale={[1.05, 1.03, 1.05]}
            material={mats.inkOutline}
          >
            <coneGeometry args={[0.092, 0.22, 14]} />
          </mesh>
          <mesh position={[0.065, -0.2, 0.01]} material={mats.skin} castShadow>
            <sphereGeometry args={[0.038, 12, 12]} />
          </mesh>
        </group>

        {/* ================================================================= */}
        {/* 5. ANIME HEAD: STRAIGHT LOOK, SPARKLING EYES & BIG CHEERFUL SMILE */}
        {/* ================================================================= */}
        <group ref={headRef} position={[0, 0.88, 0.02]}>
          {/* Smooth Porcelain-Peach Anime Head */}
          <mesh scale={[1.12, 0.98, 1.02]} material={mats.skin} castShadow>
            <sphereGeometry args={[0.215, 32, 28]} />
          </mesh>
          {/* Crisp Sumi-e Cel Outline */}
          <mesh scale={[1.16, 1.015, 1.055]} material={mats.inkOutline}>
            <sphereGeometry args={[0.215, 26, 22]} />
          </mesh>

          {/* Soft Plump Anime Lower Cheeks */}
          <mesh
            position={[0.092, -0.046, 0.104]}
            scale={[1.1, 0.85, 1.0]}
            material={mats.skin}
          >
            <sphereGeometry args={[0.104, 16, 14]} />
          </mesh>
          <mesh
            position={[-0.092, -0.046, 0.104]}
            scale={[1.1, 0.85, 1.0]}
            material={mats.skin}
          >
            <sphereGeometry args={[0.104, 16, 14]} />
          </mesh>

          {/* Cute Rounded Anime Ears */}
          <mesh
            position={[0.235, -0.01, 0.005]}
            scale={[0.45, 0.82, 0.62]}
            material={mats.skin}
          >
            <sphereGeometry args={[0.045, 12, 12]} />
          </mesh>
          <mesh
            position={[-0.235, -0.01, 0.005]}
            scale={[0.45, 0.82, 0.62]}
            material={mats.skin}
          >
            <sphereGeometry args={[0.045, 12, 12]} />
          </mesh>

          {/* =============================================================== */}
          {/* STRAIGHT-LOOK SPARKLING AUTUMN AMBER-GOLD ANIME EYES            */}
          {/* =============================================================== */}
          {/* Left Side Eye (+X) */}
          <group
            ref={leftEyeBlinkRef}
            position={[0.08, 0.014, 0.21]}
            rotation={[0, 0.24, 0]}
          >
            {/* White Sclera */}
            <mesh scale={[1.12, 1.18, 0.25]} material={mats.scleraMat}>
              <sphereGeometry args={[0.041, 20, 16]} />
            </mesh>
            {/* Deep Crimson-Espresso Outer Iris */}
            <mesh
              position={[-0.002, 0, 0.004]}
              scale={[0.98, 1.12, 0.25]}
              material={mats.irisOuterMat}
            >
              <sphereGeometry args={[0.034, 20, 16]} />
            </mesh>
            {/* Vibrant Persimmon-Amber Mid Iris */}
            <mesh
              position={[-0.002, -0.002, 0.007]}
              scale={[0.94, 1.06, 0.24]}
              material={mats.irisMidMat}
            >
              <sphereGeometry args={[0.029, 18, 14]} />
            </mesh>
            {/* Glowing Golden-Honey Lower Iris Crescent */}
            <mesh
              position={[-0.002, -0.011, 0.01]}
              scale={[1.04, 0.62, 0.22]}
              material={mats.irisLowerMat}
            >
              <sphereGeometry args={[0.024, 16, 12]} />
            </mesh>
            {/* Straight-Gaze Central Pupil */}
            <mesh
              position={[-0.002, 0.002, 0.011]}
              scale={[0.92, 1.08, 0.24]}
              material={mats.pupilMat}
            >
              <sphereGeometry args={[0.0165, 14, 12]} />
            </mesh>
            {/* Glossy White Catchlights */}
            <mesh position={[-0.011, 0.014, 0.016]} material={mats.catchlightMat}>
              <sphereGeometry args={[0.0105, 12, 12]} />
            </mesh>
            <mesh position={[0.012, -0.012, 0.016]} material={mats.catchlightMat}>
              <sphereGeometry args={[0.0052, 8, 8]} />
            </mesh>
            <mesh position={[-0.004, -0.018, 0.016]} material={mats.catchlightMat}>
              <sphereGeometry args={[0.0035, 8, 8]} />
            </mesh>
            {/* Bold Winged Upper Eyelash Arch */}
            <mesh
              geometry={customGeos.upperLashGeo}
              material={mats.lashMat}
              position={[0, 0.008, 0.008]}
            />
            <mesh
              position={[0.036, 0.026, 0.006]}
              rotation={[0, 0, -0.55]}
              material={mats.lashMat}
            >
              <coneGeometry args={[0.006, 0.022, 5]} />
            </mesh>
            <mesh
              geometry={customGeos.lidCreaseGeo}
              material={mats.lashMat}
              position={[0, 0.006, 0.005]}
            />
          </group>

          {/* Right Side Eye (-X) */}
          <group
            ref={rightEyeBlinkRef}
            position={[-0.08, 0.014, 0.21]}
            rotation={[0, -0.24, 0]}
          >
            {/* White Sclera */}
            <mesh scale={[1.12, 1.18, 0.25]} material={mats.scleraMat}>
              <sphereGeometry args={[0.041, 20, 16]} />
            </mesh>
            {/* Deep Crimson-Espresso Outer Iris */}
            <mesh
              position={[0.002, 0, 0.004]}
              scale={[0.98, 1.12, 0.25]}
              material={mats.irisOuterMat}
            >
              <sphereGeometry args={[0.034, 20, 16]} />
            </mesh>
            {/* Vibrant Persimmon-Amber Mid Iris */}
            <mesh
              position={[0.002, -0.002, 0.007]}
              scale={[0.94, 1.06, 0.24]}
              material={mats.irisMidMat}
            >
              <sphereGeometry args={[0.029, 18, 14]} />
            </mesh>
            {/* Glowing Golden-Honey Lower Iris Crescent */}
            <mesh
              position={[0.002, -0.011, 0.01]}
              scale={[1.04, 0.62, 0.22]}
              material={mats.irisLowerMat}
            >
              <sphereGeometry args={[0.024, 16, 12]} />
            </mesh>
            {/* Straight-Gaze Central Pupil */}
            <mesh
              position={[0.002, 0.002, 0.011]}
              scale={[0.92, 1.08, 0.24]}
              material={mats.pupilMat}
            >
              <sphereGeometry args={[0.0165, 14, 12]} />
            </mesh>
            {/* Glossy White Catchlights */}
            <mesh position={[-0.011, 0.014, 0.016]} material={mats.catchlightMat}>
              <sphereGeometry args={[0.0105, 12, 12]} />
            </mesh>
            <mesh position={[0.012, -0.012, 0.016]} material={mats.catchlightMat}>
              <sphereGeometry args={[0.0052, 8, 8]} />
            </mesh>
            <mesh position={[0.004, -0.018, 0.016]} material={mats.catchlightMat}>
              <sphereGeometry args={[0.0035, 8, 8]} />
            </mesh>
            {/* Bold Winged Upper Eyelash Arch */}
            <mesh
              geometry={customGeos.upperLashGeo}
              material={mats.lashMat}
              position={[0, 0.008, 0.008]}
            />
            <mesh
              position={[-0.036, 0.026, 0.006]}
              rotation={[0, 0, 0.55]}
              material={mats.lashMat}
            >
              <coneGeometry args={[0.006, 0.022, 5]} />
            </mesh>
            <mesh
              geometry={customGeos.lidCreaseGeo}
              material={mats.lashMat}
              position={[0, 0.006, 0.005]}
            />
          </group>

          {/* Confident Straight-Look Anime Eyebrows */}
          <mesh
            geometry={customGeos.eyebrowGeo}
            material={mats.browMat}
            position={[0.08, 0.074, 0.204]}
            rotation={[0.04, 0.24, -0.04]}
          />
          <mesh
            geometry={customGeos.eyebrowGeo}
            material={mats.browMat}
            position={[-0.08, 0.074, 0.204]}
            rotation={[0.04, -0.24, 0.04]}
          />

          {/* Delicate 3D Anime Nose Dot */}
          <mesh
            position={[0, -0.008, 0.222]}
            scale={[1.05, 0.9, 0.82]}
            material={mats.noseMat}
          >
            <sphereGeometry args={[0.009, 10, 10]} />
          </mesh>

          {/* =============================================================== */}
          {/* BIG CHEERFUL ANIME SMILE (:D / ◡) WITH TEETH & TONGUE           */}
          {/* =============================================================== */}
          <group ref={mouthGroupRef} position={[0, -0.046, 0.214]}>
            {/* Upper Smile Lip Outline */}
            <mesh
              geometry={customGeos.bigSmileUpperGeo}
              material={mats.mouthOutlineMat}
              position={[0, 0.004, 0.005]}
            />
            {/* Lower Wide Open Smile Outline */}
            <mesh
              geometry={customGeos.bigSmileLowerGeo}
              material={mats.mouthOutlineMat}
              position={[0, 0.002, 0.004]}
            />
            {/* Wide Happy Coral-Rose Open Mouth Interior */}
            <mesh
              position={[0, -0.007, 0.001]}
              scale={[1.68, 1.08, 0.26]}
              material={mats.mouthInteriorMat}
            >
              <sphereGeometry args={[0.022, 18, 14]} />
            </mesh>
            {/* Bright White Anime Upper Teeth Smile Bar */}
            <mesh
              position={[0, 0.003, 0.005]}
              scale={[1.55, 0.34, 0.22]}
              material={mats.teethWhiteMat}
            >
              <sphereGeometry args={[0.02, 16, 10]} />
            </mesh>
            {/* Cheerful Pink Tongue Cushion at Bottom of Big Smile */}
            <mesh
              position={[0, -0.015, 0.005]}
              scale={[1.25, 0.58, 0.22]}
              material={mats.tonguePinkMat}
            >
              <sphereGeometry args={[0.017, 14, 10]} />
            </mesh>
            {/* Upturned Smile Dimple Corners */}
            <mesh
              position={[0.045, 0.014, -0.002]}
              rotation={[0, 0, 0.55]}
              material={mats.mouthOutlineMat}
            >
              <boxGeometry args={[0.01, 0.004, 0.004]} />
            </mesh>
            <mesh
              position={[-0.045, 0.014, -0.002]}
              rotation={[0, 0, -0.55]}
              material={mats.mouthOutlineMat}
            >
              <boxGeometry args={[0.01, 0.004, 0.004]} />
            </mesh>
          </group>

          {/* Rosy Anime Blush Cheeks with 3 Diagonal Blush Hash Marks (///) */}
          <group position={[0.128, -0.026, 0.192]} rotation={[0.05, 0.42, 0]}>
            <mesh scale={[1.24, 0.78, 0.22]} material={mats.blushMat}>
              <sphereGeometry args={[0.04, 16, 12]} />
            </mesh>
            {[-0.013, 0, 0.013].map((ox, i) => (
              <mesh
                key={`blush-l-${i}`}
                position={[ox, 0.002, 0.01]}
                rotation={[0, 0, -0.34]}
                material={mats.blushSlashMat}
              >
                <boxGeometry args={[0.0042, 0.022, 0.002]} />
              </mesh>
            ))}
          </group>

          <group position={[-0.128, -0.026, 0.192]} rotation={[0.05, -0.42, 0]}>
            <mesh scale={[1.24, 0.78, 0.22]} material={mats.blushMat}>
              <sphereGeometry args={[0.04, 16, 12]} />
            </mesh>
            {[-0.013, 0, 0.013].map((ox, i) => (
              <mesh
                key={`blush-r-${i}`}
                position={[ox, 0.002, 0.01]}
                rotation={[0, 0, -0.34]}
                material={mats.blushSlashMat}
              >
                <boxGeometry args={[0.0042, 0.022, 0.002]} />
              </mesh>
            ))}
          </group>

          {/* =============================================================== */}
          {/* SLEEK STRAIGHT HIME-CUT ANIME HAIR & MAPLE KANZASHI HAIRPIN     */}
          {/* =============================================================== */}
          <group position={[0, 0.015, -0.01]}>
            {/* Upper Glossy Straight Hair Crown Dome (100% Clear of Eyes!) */}
            <mesh
              position={[0, 0.05, -0.012]}
              scale={[1.2, 1.03, 1.12]}
              material={mats.hairMain}
              castShadow
            >
              <sphereGeometry
                args={[0.224, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.43]}
              />
            </mesh>
            <mesh
              position={[0, 0.05, -0.012]}
              scale={[1.24, 1.06, 1.15]}
              material={mats.inkOutline}
            >
              <sphereGeometry
                args={[0.224, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.43]}
              />
            </mesh>

            {/* Anime Hair Angel-Ring Crown Highlights */}
            <mesh
              position={[-0.02, 0.152, 0.165]}
              rotation={[0.45, -0.08, 0.05]}
              scale={[1.38, 0.52, 0.34]}
              material={mats.hairHighlightBright}
            >
              <sphereGeometry args={[0.042, 14, 12]} />
            </mesh>
            <mesh
              position={[0.085, 0.156, 0.145]}
              rotation={[0.42, 0.28, -0.14]}
              scale={[1.1, 0.62, 0.32]}
              material={mats.hairHighlight}
            >
              <sphereGeometry args={[0.028, 12, 10]} />
            </mesh>
            <mesh
              position={[-0.105, 0.152, 0.14]}
              rotation={[0.42, -0.28, 0.14]}
              scale={[0.95, 0.58, 0.32]}
              material={mats.hairHighlight}
            >
              <sphereGeometry args={[0.024, 12, 10]} />
            </mesh>

            {/* Sleek Straight Back Hair Curtain */}
            <mesh
              position={[0, -0.06, -0.032]}
              scale={[1.22, 1.12, 1.08]}
              material={mats.hairMain}
              castShadow
            >
              <cylinderGeometry
                args={[0.202, 0.245, 0.34, 28, 1, false, Math.PI * 0.36, Math.PI * 1.28]}
              />
            </mesh>
            <mesh
              position={[0, -0.072, -0.026]}
              scale={[1.16, 1.08, 1.03]}
              material={mats.hairShadow}
            >
              <cylinderGeometry
                args={[0.192, 0.235, 0.33, 24, 1, false, Math.PI * 0.38, Math.PI * 1.24]}
              />
            </mesh>

            {/* Straight Hime-Cut Cheek-Framing Side Locks + Crimson Ribbons */}
            <group ref={sideLocksLeftRef} position={[0.205, -0.03, 0.055]}>
              <mesh
                position={[0, -0.04, 0]}
                scale={[0.72, 1.15, 0.85]}
                material={mats.hairMain}
                castShadow
              >
                <capsuleGeometry args={[0.048, 0.19, 8, 12]} />
              </mesh>
              {/* Crimson Hair Ribbon Tie */}
              <mesh position={[0.02, 0.03, 0.02]} material={mats.collarCrimson}>
                <boxGeometry args={[0.045, 0.022, 0.045]} />
              </mesh>
            </group>

            <group ref={sideLocksRightRef} position={[-0.205, -0.03, 0.055]}>
              <mesh
                position={[0, -0.04, 0]}
                scale={[0.72, 1.15, 0.85]}
                material={mats.hairMain}
                castShadow
              >
                <capsuleGeometry args={[0.048, 0.19, 8, 12]} />
              </mesh>
              {/* Crimson Hair Ribbon Tie */}
              <mesh position={[-0.02, 0.03, 0.02]} material={mats.collarCrimson}>
                <boxGeometry args={[0.045, 0.022, 0.045]} />
              </mesh>
            </group>

            {/* Neat Straight-Cut Front Bangs (Positioned High Above Eyebrows so Eyes Shine!) */}
            {[
              [0.138, 0.116, 0.172, 0.14, 0.34, -0.18, 0.86, 0.92],
              [0.078, 0.128, 0.194, 0.18, 0.14, -0.08, 0.84, 0.88],
              [0.02, 0.122, 0.206, 0.2, 0.03, -0.04, 0.72, 0.92],
              [-0.02, 0.122, 0.206, 0.2, -0.03, 0.04, 0.72, 0.92],
              [-0.078, 0.128, 0.194, 0.18, -0.14, 0.08, 0.84, 0.88],
              [-0.138, 0.116, 0.172, 0.14, -0.34, 0.18, 0.86, 0.92],
            ].map(([bx, by, bz, rx, ry, rz, sx, sy], idx) => (
              <mesh
                key={`bang-${idx}`}
                geometry={customGeos.bangCapsuleGeo}
                material={mats.hairMain}
                position={[bx, by, bz]}
                rotation={[rx, ry, rz]}
                scale={[sx, sy, 0.42]}
                castShadow
              />
            ))}

            {/* Bouncy Top Ahoge Hair Curl */}
            <group ref={ahogeRef} position={[0, 0.245, 0.01]}>
              <mesh geometry={customGeos.ahogeGeo} material={mats.hairMain} castShadow />
            </group>

            {/* Ornate Persimmon Maple Kanzashi Hairpin & Golden Tassels */}
            <group position={[-0.175, 0.12, 0.11]} rotation={[0.2, -0.4, 0.3]}>
              <mesh material={mats.haoriPersimmon}>
                <octahedronGeometry args={[0.052, 0]} />
              </mesh>
              <mesh position={[0, 0, 0.025]} material={mats.haoriGoldTrim}>
                <sphereGeometry args={[0.02, 10, 10]} />
              </mesh>
              {/* Twin Golden Dangling Tassels */}
              <mesh position={[-0.018, -0.065, 0]} material={mats.haoriGoldTrim}>
                <cylinderGeometry args={[0.005, 0.008, 0.08, 8]} />
              </mesh>
              <mesh position={[0.018, -0.075, 0]} material={mats.collarCrimson}>
                <cylinderGeometry args={[0.005, 0.008, 0.09, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
