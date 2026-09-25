import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  INITIAL_GOLDEN_DATES,
  LANDMARK_ZONES,
  resolveMazeCollision,
} from '../../utils/mazeLayout';
import type { CameraMode, VirtualWalkInput } from '../../hooks/useMazeState';

interface YellowCoatChibiGirlProps {
  cameraMode: CameraMode;
  autoWalk: boolean;
  collectedRelics: number[];
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterYawRef: React.MutableRefObject<number>;
  characterSpeedRef: React.MutableRefObject<number>;
  cameraYawRef: React.MutableRefObject<number>;
  walkPathRef: React.MutableRefObject<THREE.Vector3[]>;
  waveTimerRef: React.MutableRefObject<number>;
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

export default function YellowCoatChibiGirl({
  cameraMode,
  autoWalk,
  collectedRelics,
  characterPosRef,
  characterYawRef,
  characterSpeedRef,
  cameraYawRef,
  walkPathRef,
  waveTimerRef,
  virtualInputRef,
  onClearWalkTarget,
  onManualMove,
  onDiscoverZone,
  onCollectRelic,
  onSelectCharacter,
  onHover,
}: YellowCoatChibiGirlProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyBounceRef = useRef<THREE.Group>(null);
  const coatRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const hairStrandsRef = useRef<THREE.Group>(null);
  const leftEyeBlinkRef = useRef<THREE.Group>(null);
  const rightEyeBlinkRef = useRef<THREE.Group>(null);
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
  const lastZoneIdRef = useRef<string>('');

  // Ring buffer for sunlit floor dust puffs behind her footsteps
  const dustHistoryRef = useRef<Array<{ pos: THREE.Vector3; age: number }>>(
    Array.from({ length: 10 }, () => ({
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
      if (k === 'f' || k === ' ') {
        waveTimerRef.current = 2.4;
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

  // Shared High-Clarity Materials for Hana
  const materials = useMemo(() => {
    const faceCream = '#FFF6EE';
    const cheekCoral = '#F68B82';
    const cheekHighlight = '#FFC4BE';
    const nosePeach = '#E59584';
    const mouthCoral = '#D64C54';
    const tonguePink = '#F78A8D';
    const coatYellow = '#F9C716';
    const coatFoldAmber = '#DC9E08';
    const inkBlack = '#141418';
    const hairHighlight = '#2B2D3C';
    const irisDark = '#1C1526';
    const irisAmber = '#E09624';

    return {
      faceMat: new THREE.MeshStandardMaterial({
        color: faceCream,
        roughness: 0.42,
        emissive: '#FFE8D6',
        emissiveIntensity: 0.25,
      }),
      handMat: new THREE.MeshStandardMaterial({
        color: faceCream,
        roughness: 0.45,
        emissive: '#FFE8D6',
        emissiveIntensity: 0.18,
      }),
      coatMat: new THREE.MeshStandardMaterial({
        color: coatYellow,
        roughness: 0.48,
        emissive: '#F5B800',
        emissiveIntensity: 0.14,
      }),
      coatFoldMat: new THREE.MeshStandardMaterial({
        color: coatFoldAmber,
        roughness: 0.54,
      }),
      bootMat: new THREE.MeshStandardMaterial({
        color: inkBlack,
        roughness: 0.45,
      }),
      bootSoleMat: new THREE.MeshStandardMaterial({
        color: '#2C2623',
        roughness: 0.75,
      }),
      trimBasicMat: new THREE.MeshBasicMaterial({ color: inkBlack }),
      hairMat: new THREE.MeshStandardMaterial({
        color: inkBlack,
        roughness: 0.58,
        side: THREE.DoubleSide,
      }),
      hairSheenMat: new THREE.MeshBasicMaterial({
        color: hairHighlight,
      }),
      hairBasicMat: new THREE.MeshBasicMaterial({ color: '#101014' }),
      scleraMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      irisMat: new THREE.MeshBasicMaterial({ color: irisDark }),
      irisAmberMat: new THREE.MeshBasicMaterial({ color: irisAmber }),
      pupilMat: new THREE.MeshBasicMaterial({ color: '#08080C' }),
      catchlightMat: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      buttonMat: new THREE.MeshStandardMaterial({
        color: inkBlack,
        roughness: 0.28,
      }),
      cheekMat: new THREE.MeshBasicMaterial({ color: cheekCoral }),
      cheekSlashMat: new THREE.MeshBasicMaterial({ color: cheekHighlight }),
      noseMat: new THREE.MeshBasicMaterial({ color: nosePeach }),
      mouthMat: new THREE.MeshBasicMaterial({ color: mouthCoral }),
      tongueMat: new THREE.MeshBasicMaterial({ color: tonguePink }),
      dustMat: new THREE.MeshBasicMaterial({
        color: '#f5dfc0',
        transparent: true,
        opacity: 0.42,
      }),
    };
  }, []);

  const dustSphereGeo = useMemo(() => new THREE.SphereGeometry(0.042, 8, 8), []);
  const buttonCylinderGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.017, 0.017, 0.009, 16);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);
  const bangCapsuleGeo = useMemo(() => new THREE.CapsuleGeometry(0.036, 0.082, 8, 12), []);

  // Sculpted Curves for Flowing Side Hair Strands & Coat Placket
  const hairStrandGeos = useMemo(() => {
    const leftLoop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.20, 0.06, 0.04),
      new THREE.Vector3(0.27, -0.01, 0.04),
      new THREE.Vector3(0.31, -0.10, 0.02),
      new THREE.Vector3(0.28, -0.18, 0.02),
    ]);

    const leftWispy = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.21, 0.02, 0.02),
      new THREE.Vector3(0.29, -0.06, 0.02),
      new THREE.Vector3(0.34, -0.15, 0.01),
      new THREE.Vector3(0.31, -0.22, 0.01),
    ]);

    const rightLoop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.20, 0.05, 0.04),
      new THREE.Vector3(-0.27, -0.02, 0.04),
      new THREE.Vector3(-0.31, -0.11, 0.02),
      new THREE.Vector3(-0.28, -0.18, 0.02),
    ]);

    const rightWispy = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.21, 0.01, 0.02),
      new THREE.Vector3(-0.29, -0.07, 0.02),
      new THREE.Vector3(-0.33, -0.16, 0.01),
      new THREE.Vector3(-0.30, -0.22, 0.01),
    ]);

    const coatPlacketCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.19, 0.112),
      new THREE.Vector3(-0.006, 0.09, 0.146),
      new THREE.Vector3(-0.014, -0.01, 0.180),
      new THREE.Vector3(-0.022, -0.10, 0.210),
    ]);

    return {
      leftLoop: new THREE.TubeGeometry(leftLoop, 14, 0.009, 6, false),
      leftWispy: new THREE.TubeGeometry(leftWispy, 14, 0.0068, 6, false),
      rightLoop: new THREE.TubeGeometry(rightLoop, 14, 0.009, 6, false),
      rightWispy: new THREE.TubeGeometry(rightWispy, 14, 0.0068, 6, false),
      placket: new THREE.TubeGeometry(coatPlacketCurve, 12, 0.006, 6, false),
    };
  }, []);

  // Crisp Upper Eyelash Arches, Eyebrows & Cute Smile Geometries
  const { upperLashGeo, eyebrowGeo, smileArcGeo } = useMemo(() => {
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.042, 0.004, -0.004),
      new THREE.Vector3(-0.022, 0.024, 0.003),
      new THREE.Vector3(0, 0.030, 0.006),
      new THREE.Vector3(0.022, 0.024, 0.003),
      new THREE.Vector3(0.044, 0.006, -0.003),
    ]);
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.034, -0.004, -0.003),
      new THREE.Vector3(0, 0.008, 0.003),
      new THREE.Vector3(0.034, -0.002, -0.003),
    ]);
    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.030, 0.009, -0.002),
      new THREE.Vector3(-0.015, -0.006, 0.003),
      new THREE.Vector3(0, -0.010, 0.005),
      new THREE.Vector3(0.015, -0.006, 0.003),
      new THREE.Vector3(0.030, 0.009, -0.002),
    ]);
    return {
      upperLashGeo: new THREE.TubeGeometry(lashCurve, 16, 0.0072, 8, false),
      eyebrowGeo: new THREE.TubeGeometry(browCurve, 12, 0.0048, 6, false),
      smileArcGeo: new THREE.TubeGeometry(smileCurve, 16, 0.0058, 8, false),
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
    if (waveTimerRef.current > 0) {
      waveTimerRef.current = Math.max(0, waveTimerRef.current - dt);
    }

    _desiredDir.set(0, 0);
    let hasInput = false;
    let maxSpeed = sprint ? 8.6 : 5.4;

    // 1. Direct Player Keyboard / D-Pad Input
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
    // 2. Click-to-Walk or Auto-Explore Waypoint Path Following
    else if (walkPathRef.current.length > 0) {
      maxSpeed = sprint ? 8.6 : 6.0;
      let target = walkPathRef.current[0];
      let dx = target.x - pos.x;
      let dz = target.z - pos.z;
      let dist = Math.hypot(dx, dz);

      const reachRadius = walkPathRef.current.length > 1 ? 0.52 : 0.26;
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

    // Snappy Critically-Damped Velocity Interpolation
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

    // Apply displacement with sub-stepped collision for silky high-speed wall sliding
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

      // Smoothly guide the 3rd-person follow camera behind her when turning corridor corners
      if (cameraMode === 'follow' && (left || right || autoWalk || walkPathRef.current.length > 0)) {
        let camDiff = characterYawRef.current - cameraYawRef.current;
        while (camDiff > Math.PI) camDiff -= Math.PI * 2;
        while (camDiff < -Math.PI) camDiff += Math.PI * 2;
        cameraYawRef.current += camDiff * Math.min(1, dt * 3.6);
      }
    } else if (waveTimerRef.current > 0 || cameraMode === 'painting') {
      // When waving while idle or in Painting mode, face toward the camera so her cute face & smile shine!
      const faceCamYaw = cameraMode === 'painting' ? 0.12 : cameraYawRef.current + Math.PI;
      let diff = faceCamYaw - characterYawRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      characterYawRef.current += diff * Math.min(1, dt * 8.5);
    }

    // Update Root Transform
    if (rootRef.current) {
      rootRef.current.position.set(pos.x, 0, pos.z);
      rootRef.current.rotation.y = characterYawRef.current;
    }

    // Check Landmark Zone Discovery
    for (let i = 0; i < LANDMARK_ZONES.length; i++) {
      const zone = LANDMARK_ZONES[i];
      const dx = pos.x - zone.x;
      const dz = pos.z - zone.z;
      if (dx * dx + dz * dz < 2.1 * 2.1) {
        if (lastZoneIdRef.current !== zone.id) {
          lastZoneIdRef.current = zone.id;
          onDiscoverZone(zone.id);
        }
        break;
      }
    }

    // Check Collectible Golden Dates
    for (let i = 0; i < INITIAL_GOLDEN_DATES.length; i++) {
      const relic = INITIAL_GOLDEN_DATES[i];
      if (!collectedRelics.includes(relic.id)) {
        const dx = pos.x - relic.position[0];
        const dz = pos.z - relic.position[2];
        if (dx * dx + dz * dz < 1.15 * 1.15) {
          onCollectRelic(relic.id);
        }
      }
    }

    // =====================================================================
    // PROCEDURAL CHIBI WALKING, TROTTING, BLINKING & WAVING ANIMATIONS
    // =====================================================================
    const normSpeed = THREE.MathUtils.clamp(speed / 4.2, 0, 1.55);
    if (speed > 0.08) {
      stridePhaseRef.current += dt * (7.2 + normSpeed * 6.2);
    } else {
      stridePhaseRef.current += dt * 1.8;
    }
    const phase = stridePhaseRef.current;

    // Natural Chibi Eye Blinking every ~3.6 seconds
    const blinkCycle = elapsed % 3.6;
    const blinkScaleY =
      blinkCycle > 3.44
        ? Math.max(0.1, Math.abs((blinkCycle - 3.52) / 0.08))
        : 1.0;
    if (leftEyeBlinkRef.current && rightEyeBlinkRef.current) {
      leftEyeBlinkRef.current.scale.y = blinkScaleY;
      rightEyeBlinkRef.current.scale.y = blinkScaleY;
    }

    // 1. Cushioned Chibi Walk Bounce & Forward Lean
    const walkBob =
      speed > 0.08
        ? Math.abs(Math.sin(phase)) * 0.055 * Math.min(1.2, normSpeed)
        : Math.sin(elapsed * 2.4) * 0.009;

    const targetLean = speed > 0.1 ? normSpeed * 0.13 : 0;
    const targetBank = THREE.MathUtils.clamp(-turnRate * 0.28, -0.18, 0.18);

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
        (speed > 0.08 ? Math.cos(phase) * 0.038 * normSpeed : Math.sin(elapsed * 1.8) * 0.018);
    }

    // 2. Alternating Short Black Boots / Legs Stride
    if (leftLegRef.current && rightLegRef.current) {
      const legSwing =
        speed > 0.08
          ? Math.sin(phase) * 0.62 * Math.min(1.3, normSpeed)
          : waveTimerRef.current > 0
            ? Math.sin(elapsed * 4.5) * 0.14
            : 0;
      leftLegRef.current.rotation.x = legSwing;
      rightLegRef.current.rotation.x = -legSwing;
    }

    // 3. Flared Bell-Sleeve Arms (Outstretched Poncho Silhouette + Cheerful Wave)
    const isWaving = waveTimerRef.current > 0;
    if (rightArmRef.current && leftArmRef.current) {
      if (isWaving) {
        const waveOsc = Math.sin(elapsed * 9.0) * 0.24;
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          1.98 + waveOsc,
          Math.min(1, dt * 10)
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          0.16,
          Math.min(1, dt * 10)
        );
      } else {
        const armSwing = speed > 0.08 ? -Math.sin(phase) * 0.42 * Math.min(1.25, normSpeed) : 0;
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          0.54 + Math.sin(elapsed * 2.2) * 0.04,
          Math.min(1, dt * 10)
        );
        rightArmRef.current.rotation.x = armSwing;
      }

      const leftSwing = speed > 0.08 ? Math.sin(phase) * 0.42 * Math.min(1.25, normSpeed) : 0;
      leftArmRef.current.rotation.x = leftSwing;
      leftArmRef.current.rotation.z = -0.54 - Math.sin(elapsed * 2.2) * 0.04;
    }

    // 4. Expressive Chibi Head Tilt
    if (headRef.current) {
      const baseTiltZ = -0.055;
      const walkNod = speed > 0.08 ? Math.sin(phase * 2) * 0.025 * normSpeed : 0;
      headRef.current.rotation.z =
        baseTiltZ + Math.sin(elapsed * 2.1) * 0.024 - smoothBankRef.current * 0.4;
      headRef.current.rotation.x = -smoothLeanRef.current * 0.45 + walkNod;
    }

    // 5. Secondary Spring Physics on Her Flowing Black Hair Strands
    if (hairStrandsRef.current) {
      hairStrandsRef.current.rotation.z =
        Math.sin(elapsed * 3.8 + phase * 0.5) * 0.055 + normSpeed * 0.07;
      hairStrandsRef.current.rotation.y =
        -smoothBankRef.current * 0.5 + Math.cos(elapsed * 2.9) * 0.035;
    }

    // 6. Subtle Ground Halo Ring
    if (groundRingRef.current) {
      groundRingRef.current.rotation.z = elapsed * 0.9;
    }

    // 7. Footstep Golden Dust Puffs (Zero Heap Allocations!)
    dustSpawnTimerRef.current += dt * (0.4 + normSpeed * 2.4);
    const dustHist = dustHistoryRef.current;
    if (speed > 0.25 && dustSpawnTimerRef.current > 0.16) {
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
      const invYaw = -characterYawRef.current;
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
          child.position.set(_relDust.x, 0.04 + item.age * 0.16, _relDust.z);
          child.scale.setScalar(life * 0.95);
        }
      }
    }
  });

  return (
    <group ref={rootRef}>
      {/* Single lightweight invisible hit cylinder for pointer hover/click */}
      <mesh
        position={[0, 0.52, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover('Hana — Move with WASD / Arrows, Press F to Wave, or Click V for POV!');
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          waveTimerRef.current = 2.4;
          onSelectCharacter();
        }}
      >
        <cylinderGeometry args={[0.28, 0.28, 1.05, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* Subtle Sunlit Ground Footstep Ring */}
      <group ref={groundRingRef} position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.24, 0.29, 24]} />
          <meshBasicMaterial
            color="#ffe299"
            transparent
            opacity={cameraMode === 'pov' ? 0.18 : 0.48}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Soft Footstep Golden Dust Puffs */}
      <group ref={dustTrailRef}>
        {Array.from({ length: 10 }).map((_, idx) => (
          <mesh key={idx} geometry={dustSphereGeo} material={materials.dustMat} visible={false} />
        ))}
      </group>

      {/* Warm Front & Back Fill Lights so Hana's Face & Yellow Coat Pop Clearly */}
      <pointLight position={[0, 0.88, 0.62]} color="#fff9f0" intensity={0.95} distance={3.8} />
      <pointLight position={[0, 0.85, -0.45]} color="#ffe9c8" intensity={0.48} distance={2.8} />

      {/* ================================================================= */}
      {/* MAIN BOUNCING & BANKING CHIBI BODY GROUP                          */}
      {/* ================================================================= */}
      <group ref={bodyBounceRef}>
        {/* =============================================================== */}
        {/* 1. SHORT INK-BLACK BOOTS / LEGS WITH CUFFS & SOLES              */}
        {/* =============================================================== */}
        <group position={[0, 0.18, 0]}>
          {/* Right Boot */}
          <group ref={rightLegRef} position={[0.058, 0, 0]}>
            <mesh position={[0, -0.08, 0]} material={materials.bootMat} castShadow receiveShadow>
              <cylinderGeometry args={[0.044, 0.039, 0.16, 14]} />
            </mesh>
            <mesh
              position={[0, -0.155, 0.018]}
              scale={[1.05, 0.78, 1.32]}
              material={materials.bootMat}
              castShadow
            >
              <sphereGeometry args={[0.041, 12, 12]} />
            </mesh>
            <mesh position={[0, -0.175, 0.016]} material={materials.bootSoleMat}>
              <cylinderGeometry args={[0.043, 0.045, 0.014, 12]} />
            </mesh>
          </group>

          {/* Left Boot */}
          <group ref={leftLegRef} position={[-0.058, 0, 0]}>
            <mesh position={[0, -0.08, 0]} material={materials.bootMat} castShadow receiveShadow>
              <cylinderGeometry args={[0.044, 0.039, 0.16, 14]} />
            </mesh>
            <mesh
              position={[0, -0.155, 0.018]}
              scale={[1.05, 0.78, 1.32]}
              material={materials.bootMat}
              castShadow
            >
              <sphereGeometry args={[0.041, 12, 12]} />
            </mesh>
            <mesh position={[0, -0.175, 0.016]} material={materials.bootSoleMat}>
              <cylinderGeometry args={[0.043, 0.045, 0.014, 12]} />
            </mesh>
          </group>
        </group>

        {/* =============================================================== */}
        {/* 2. WIDE FLARED GOLDEN-YELLOW RAINCOAT / PONCHO WITH 2 BUTTONS   */}
        {/* =============================================================== */}
        <group ref={coatRef} position={[0, 0.36, 0]}>
          {/* Wide Flared A-Line Yellow Coat Dress */}
          <mesh position={[0, 0, 0]} material={materials.coatMat} castShadow receiveShadow>
            <cylinderGeometry args={[0.106, 0.256, 0.40, 28]} />
          </mesh>

          {/* Upturned Yellow Raincoat Collar & Neck */}
          <mesh position={[0, 0.20, 0.005]} material={materials.coatFoldMat} castShadow>
            <cylinderGeometry args={[0.116, 0.104, 0.055, 22, 1, true]} />
          </mesh>
          <mesh position={[0, 0.215, 0.008]} material={materials.faceMat}>
            <cylinderGeometry args={[0.058, 0.064, 0.065, 16]} />
          </mesh>

          {/* Bottom Coat Hem Amber Trim */}
          <mesh position={[0, -0.196, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.coatFoldMat}>
            <torusGeometry args={[0.252, 0.010, 8, 28]} />
          </mesh>

          {/* Warm Amber Inner Pleat/Fold Accents on Left & Right Front Sides */}
          <mesh
            position={[0.11, -0.02, 0.11]}
            rotation={[0.25, 0.45, -0.28]}
            material={materials.coatFoldMat}
          >
            <cylinderGeometry args={[0.015, 0.042, 0.35, 10]} />
          </mesh>
          <mesh
            position={[-0.11, -0.02, 0.11]}
            rotation={[0.25, -0.45, 0.28]}
            material={materials.coatFoldMat}
          >
            <cylinderGeometry args={[0.015, 0.042, 0.35, 10]} />
          </mesh>

          {/* Black Side Seam Lines Running Along Inner Arm Folds */}
          <mesh
            position={[0.125, -0.02, 0.118]}
            rotation={[0.25, 0.45, -0.31]}
            material={materials.trimBasicMat}
          >
            <boxGeometry args={[0.007, 0.36, 0.007]} />
          </mesh>
          <mesh
            position={[-0.125, -0.02, 0.118]}
            rotation={[0.25, -0.45, 0.31]}
            material={materials.trimBasicMat}
          >
            <boxGeometry args={[0.007, 0.36, 0.007]} />
          </mesh>

          {/* Curved Front Center Placket Seam Line */}
          <mesh geometry={hairStrandGeos.placket} material={materials.trimBasicMat} />

          {/* 2 Distinct Round Black Buttons Below the Collar */}
          <mesh
            geometry={buttonCylinderGeo}
            material={materials.buttonMat}
            position={[0.008, 0.115, 0.147]}
            rotation={[0.34, 0, 0]}
          />
          <mesh
            geometry={buttonCylinderGeo}
            material={materials.buttonMat}
            position={[0.002, 0.038, 0.174]}
            rotation={[0.34, 0, 0]}
          />

          {/* Flared Bell-Sleeve Right Arm with Cute Hand */}
          <group ref={rightArmRef} position={[0.095, 0.14, 0.01]} rotation={[0.08, 0, 0.54]}>
            <mesh position={[0, -0.105, 0]} material={materials.coatMat} castShadow>
              <cylinderGeometry args={[0.044, 0.102, 0.24, 16]} />
            </mesh>
            <mesh position={[0, -0.115, 0.014]} material={materials.coatFoldMat}>
              <cylinderGeometry args={[0.038, 0.086, 0.22, 12]} />
            </mesh>
            <mesh
              position={[0, -0.228, 0.008]}
              scale={[0.92, 1.08, 0.84]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.036, 12, 12]} />
            </mesh>
          </group>

          {/* Flared Bell-Sleeve Left Arm with Cute Hand */}
          <group ref={leftArmRef} position={[-0.095, 0.14, 0.01]} rotation={[0.08, 0, -0.54]}>
            <mesh position={[0, -0.105, 0]} material={materials.coatMat} castShadow>
              <cylinderGeometry args={[0.044, 0.102, 0.24, 16]} />
            </mesh>
            <mesh position={[0, -0.115, 0.014]} material={materials.coatFoldMat}>
              <cylinderGeometry args={[0.038, 0.086, 0.22, 12]} />
            </mesh>
            <mesh
              position={[0, -0.228, 0.008]}
              scale={[0.92, 1.08, 0.84]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.036, 12, 12]} />
            </mesh>
          </group>
        </group>

        {/* =============================================================== */}
        {/* 3. CRYSTAL-CLEAR CHIBI FACE: EXPRESSIVE EYES, NOSE, MOUTH, HAIR */}
        {/* =============================================================== */}
        <group ref={headRef} position={[0, 0.77, 0.02]} visible={cameraMode !== 'pov'}>
          {/* Smooth Porcelain-Cream Chibi Head */}
          <mesh
            position={[0, 0, 0]}
            scale={[1.14, 0.98, 1.02]}
            material={materials.faceMat}
            castShadow
          >
            <sphereGeometry args={[0.215, 32, 28]} />
          </mesh>

          {/* Soft Rounded Chibi Lower Cheeks */}
          <mesh
            position={[0.092, -0.048, 0.105]}
            scale={[1.12, 0.86, 1.02]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.108, 16, 14]} />
          </mesh>
          <mesh
            position={[-0.092, -0.048, 0.105]}
            scale={[1.12, 0.86, 1.02]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.108, 16, 14]} />
          </mesh>

          {/* Cute Rounded Ears Peeking on Both Sides */}
          <mesh
            position={[0.238, -0.008, 0.005]}
            scale={[0.45, 0.82, 0.62]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.046, 12, 12]} />
          </mesh>
          <mesh
            position={[-0.238, -0.008, 0.005]}
            scale={[0.45, 0.82, 0.62]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.046, 12, 12]} />
          </mesh>

          {/* ============================================================= */}
          {/* EXPRESSIVE CHIBI EYES WITH SCLERA, IRIS, CATCHLIGHTS & LASHES */}
          {/* ============================================================= */}
          {/* Left Side Eye (+X) */}
          <group
            ref={leftEyeBlinkRef}
            position={[0.080, 0.010, 0.210]}
            rotation={[0.02, 0.28, 0]}
          >
            {/* Crisp White Sclera Cushion */}
            <mesh scale={[1.08, 1.12, 0.26]} material={materials.scleraMat}>
              <sphereGeometry args={[0.039, 18, 14]} />
            </mesh>
            {/* Deep Glossy Espresso-Indigo Iris */}
            <mesh
              position={[-0.002, -0.001, 0.005]}
              scale={[0.96, 1.08, 0.26]}
              material={materials.irisMat}
            >
              <sphereGeometry args={[0.031, 18, 14]} />
            </mesh>
            {/* Golden-Amber Lower Iris Crescent Highlight */}
            <mesh
              position={[-0.002, -0.011, 0.009]}
              scale={[1.0, 0.58, 0.22]}
              material={materials.irisAmberMat}
            >
              <sphereGeometry args={[0.022, 14, 10]} />
            </mesh>
            {/* Deep Ink Pupil */}
            <mesh
              position={[-0.002, 0, 0.010]}
              scale={[0.94, 1.06, 0.24]}
              material={materials.pupilMat}
            >
              <sphereGeometry args={[0.017, 14, 10]} />
            </mesh>
            {/* Bright White Starlight Catchlights */}
            <mesh position={[0.010, 0.012, 0.015]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.009, 10, 10]} />
            </mesh>
            <mesh position={[-0.011, -0.011, 0.015]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0048, 8, 8]} />
            </mesh>
            {/* Bold Upper Eyelash Arch */}
            <mesh
              geometry={upperLashGeo}
              material={materials.hairBasicMat}
              position={[0, 0.006, 0.008]}
              rotation={[0, 0, -0.05]}
            />
          </group>

          {/* Right Side Eye (-X) */}
          <group
            ref={rightEyeBlinkRef}
            position={[-0.080, 0.012, 0.210]}
            rotation={[0.02, -0.28, 0]}
          >
            {/* Crisp White Sclera Cushion */}
            <mesh scale={[1.08, 1.12, 0.26]} material={materials.scleraMat}>
              <sphereGeometry args={[0.039, 18, 14]} />
            </mesh>
            {/* Deep Glossy Espresso-Indigo Iris */}
            <mesh
              position={[0.002, -0.001, 0.005]}
              scale={[0.96, 1.08, 0.26]}
              material={materials.irisMat}
            >
              <sphereGeometry args={[0.031, 18, 14]} />
            </mesh>
            {/* Golden-Amber Lower Iris Crescent Highlight */}
            <mesh
              position={[0.002, -0.011, 0.009]}
              scale={[1.0, 0.58, 0.22]}
              material={materials.irisAmberMat}
            >
              <sphereGeometry args={[0.022, 14, 10]} />
            </mesh>
            {/* Deep Ink Pupil */}
            <mesh
              position={[0.002, 0, 0.010]}
              scale={[0.94, 1.06, 0.24]}
              material={materials.pupilMat}
            >
              <sphereGeometry args={[0.017, 14, 10]} />
            </mesh>
            {/* Bright White Starlight Catchlights */}
            <mesh position={[0.010, 0.012, 0.015]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.009, 10, 10]} />
            </mesh>
            <mesh position={[-0.011, -0.011, 0.015]} material={materials.catchlightMat}>
              <sphereGeometry args={[0.0048, 8, 8]} />
            </mesh>
            {/* Bold Upper Eyelash Arch */}
            <mesh
              geometry={upperLashGeo}
              material={materials.hairBasicMat}
              position={[0, 0.006, 0.008]}
              rotation={[0, 0, 0.05]}
            />
          </group>

          {/* Expressive Arched Eyebrows Above Eyes */}
          <mesh
            geometry={eyebrowGeo}
            material={materials.hairBasicMat}
            position={[0.082, 0.064, 0.204]}
            rotation={[0.08, 0.28, -0.08]}
          />
          <mesh
            geometry={eyebrowGeo}
            material={materials.hairBasicMat}
            position={[-0.082, 0.066, 0.204]}
            rotation={[0.08, -0.28, 0.08]}
          />

          {/* Cute Sculpted 3D Peach-Terracotta Nose */}
          <mesh
            position={[0, -0.011, 0.223]}
            scale={[1.15, 0.92, 0.85]}
            material={materials.noseMat}
          >
            <sphereGeometry args={[0.012, 12, 12]} />
          </mesh>

          {/* Clear Happy Chibi Mouth & Smile */}
          <group position={[0.0, -0.046, 0.216]}>
            {/* Crisp Upper Smile Line (`◡`) */}
            <mesh
              geometry={smileArcGeo}
              material={materials.hairBasicMat}
              position={[0, 0.004, 0.004]}
            />
            {/* Cheerful Open Coral-Rose Mouth Cushion */}
            <mesh
              position={[0, -0.004, 0.001]}
              scale={[1.28, 0.78, 0.25]}
              material={materials.mouthMat}
            >
              <sphereGeometry args={[0.019, 14, 12]} />
            </mesh>
            {/* Cute Pink Tongue Highlight */}
            <mesh
              position={[0, -0.008, 0.004]}
              scale={[1.05, 0.52, 0.22]}
              material={materials.tongueMat}
            >
              <sphereGeometry args={[0.014, 12, 10]} />
            </mesh>
          </group>

          {/* Signature Large Round Rosy Coral-Pink Cheeks + Blush Accents */}
          <group position={[0.132, -0.024, 0.192]} rotation={[0.06, 0.46, 0]}>
            <mesh scale={[1.18, 0.85, 0.24]} material={materials.cheekMat}>
              <sphereGeometry args={[0.041, 16, 12]} />
            </mesh>
            <mesh position={[0, 0.002, 0.011]} rotation={[0, 0, -0.35]} material={materials.cheekSlashMat}>
              <boxGeometry args={[0.005, 0.022, 0.002]} />
            </mesh>
          </group>
          <group position={[-0.132, -0.022, 0.192]} rotation={[0.06, -0.46, 0]}>
            <mesh scale={[1.18, 0.85, 0.24]} material={materials.cheekMat}>
              <sphereGeometry args={[0.041, 16, 12]} />
            </mesh>
            <mesh position={[0, 0.002, 0.011]} rotation={[0, 0, -0.35]} material={materials.cheekSlashMat}>
              <boxGeometry args={[0.005, 0.022, 0.002]} />
            </mesh>
          </group>

          {/* ============================================================= */}
          {/* VOLUMINOUS JET-BLACK BELL BOB HAIR (100% OPEN FRONT FACE!)    */}
          {/* ============================================================= */}
          <group position={[0, 0.015, -0.01]}>
            {/* Upper Crown Skull Dome — Stops High Above Forehead (`thetaLength = 0.44 * PI`) */}
            <mesh
              position={[0, 0.048, -0.015]}
              scale={[1.20, 1.02, 1.12]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry
                args={[0.224, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.44]}
              />
            </mesh>

            {/* Glossy Charcoal-Indigo Hair Crown Sheen Band */}
            <mesh
              position={[0, 0.145, 0.165]}
              rotation={[0.42, 0, 0]}
              scale={[1.15, 0.25, 0.45]}
              material={materials.hairSheenMat}
            >
              <torusGeometry args={[0.125, 0.012, 8, 24, Math.PI * 0.75]} />
            </mesh>

            {/* Back & Side Flared Bell-Bob Hair Curtain — Open in Front (`thetaStart = 0.38*PI, thetaLength = 1.24*PI`) */}
            <mesh
              position={[0, -0.038, -0.028]}
              scale={[1.24, 1.02, 1.12]}
              material={materials.hairMat}
              castShadow
            >
              <cylinderGeometry
                args={[0.205, 0.265, 0.28, 28, 1, false, Math.PI * 0.38, Math.PI * 1.24]}
              />
            </mesh>

            {/* Back Skull Closure Sphere So Back of Hair Is Solid */}
            <mesh
              position={[0, 0.01, -0.045]}
              scale={[1.18, 1.0, 1.05]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry
                args={[0.215, 22, 18, Math.PI * 0.35, Math.PI * 1.30, 0, Math.PI * 0.78]}
              />
            </mesh>

            {/* Left & Right Cheek-Framing Rounded Bob Side Locks (Clear of Eyes & Cheeks!) */}
            <mesh
              position={[0.208, -0.042, 0.035]}
              rotation={[0.08, 0.22, 0.20]}
              scale={[0.68, 1.18, 0.88]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry args={[0.125, 18, 16]} />
            </mesh>
            <mesh
              position={[-0.208, -0.042, 0.035]}
              rotation={[0.08, -0.22, -0.20]}
              scale={[0.68, 1.18, 0.88]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry args={[0.125, 18, 16]} />
            </mesh>

            {/* Front Parted Fringe Bangs Above the Eyebrows */}
            {[
              [0.125, 0.105, 0.178, 0.18, 0.32, -0.22],
              [0.062, 0.118, 0.198, 0.22, 0.12, -0.10],
              [0.004, 0.122, 0.204, 0.24, 0.02, -0.02],
              [-0.068, 0.118, 0.196, 0.22, -0.14, 0.12],
              [-0.128, 0.102, 0.176, 0.18, -0.32, 0.24],
            ].map(([bx, by, bz, rx, ry, rz], idx) => (
              <mesh
                key={`bang-${idx}`}
                geometry={bangCapsuleGeo}
                material={materials.hairMat}
                position={[bx, by, bz]}
                rotation={[rx, ry, rz]}
                scale={[0.86, 0.92, 0.46]}
                castShadow
              />
            ))}

            {/* Delicate Flowing Side Strands on Both Left & Right Edges */}
            <group ref={hairStrandsRef} position={[0, 0.02, 0.02]}>
              <mesh geometry={hairStrandGeos.leftLoop} material={materials.hairMat} castShadow />
              <mesh geometry={hairStrandGeos.leftWispy} material={materials.hairMat} castShadow />
              <mesh geometry={hairStrandGeos.rightLoop} material={materials.hairMat} castShadow />
              <mesh geometry={hairStrandGeos.rightWispy} material={materials.hairMat} castShadow />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
