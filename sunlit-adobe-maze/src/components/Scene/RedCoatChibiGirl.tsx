import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  INITIAL_SUN_RELICS,
  LANDMARK_ZONES,
  resolveMazeCollision,
} from '../../utils/mazeLayout';
import type { CameraMode, VirtualWalkInput } from '../../hooks/useMazeState';

interface RedCoatChibiGirlProps {
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

export default function RedCoatChibiGirl({
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
}: RedCoatChibiGirlProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyBounceRef = useRef<THREE.Group>(null);
  const coatRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const hairStrandsRef = useRef<THREE.Group>(null);
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
        waveTimerRef.current = 1.8;
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

  // Shared Materials & Geometries for Mina
  const materials = useMemo(() => {
    const faceWhite = '#fffdfa';
    const cheekRed = '#d93426';
    const coatRed = '#d4241b';
    const coatDarkTrim = '#141416';
    const hairBlack = '#111114';
    const buttonWhite = '#ffffff';

    return {
      faceMat: new THREE.MeshStandardMaterial({ color: faceWhite, roughness: 0.55 }),
      handMat: new THREE.MeshStandardMaterial({ color: faceWhite, roughness: 0.5 }),
      coatMat: new THREE.MeshStandardMaterial({ color: coatRed, roughness: 0.62 }),
      bootMat: new THREE.MeshStandardMaterial({ color: coatDarkTrim, roughness: 0.65 }),
      trimBasicMat: new THREE.MeshBasicMaterial({ color: coatDarkTrim }),
      hairMat: new THREE.MeshStandardMaterial({ color: hairBlack, roughness: 0.78 }),
      hairBasicMat: new THREE.MeshBasicMaterial({ color: hairBlack }),
      buttonMat: new THREE.MeshBasicMaterial({ color: buttonWhite }),
      cheekMat: new THREE.MeshBasicMaterial({ color: cheekRed }),
      dustMat: new THREE.MeshBasicMaterial({
        color: '#f5dfc0',
        transparent: true,
        opacity: 0.42,
      }),
    };
  }, []);

  const dustSphereGeo = useMemo(() => new THREE.SphereGeometry(0.042, 8, 8), []);
  const buttonSphereGeo = useMemo(() => new THREE.SphereGeometry(0.0095, 8, 8), []);
  const bangCapsuleGeo = useMemo(() => new THREE.CapsuleGeometry(0.042, 0.085, 6, 8), []);

  // Sculpted Curves for Reference Image 2's Signature Flowing Left-Side Hair Strands & Loop
  const hairStrandGeos = useMemo(() => {
    const loopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.14, 0.12, 0.01),
      new THREE.Vector3(0.28, 0.08, 0.01),
      new THREE.Vector3(0.36, 0.02, 0.0),
      new THREE.Vector3(0.26, -0.01, 0.0),
      new THREE.Vector3(0.16, 0.04, 0.01),
    ]);

    const strand1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.16, 0.05, 0.0),
      new THREE.Vector3(0.27, -0.04, 0.0),
      new THREE.Vector3(0.38, -0.14, -0.01),
      new THREE.Vector3(0.44, -0.21, -0.02),
    ]);

    const strand2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.17, 0.01, 0.01),
      new THREE.Vector3(0.26, -0.09, 0.01),
      new THREE.Vector3(0.33, -0.22, 0.0),
      new THREE.Vector3(0.35, -0.31, -0.01),
    ]);

    const strand3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, -0.04, 0.01),
      new THREE.Vector3(0.24, -0.15, 0.01),
      new THREE.Vector3(0.28, -0.26, 0.01),
    ]);

    return {
      loop: new THREE.TubeGeometry(loopCurve, 16, 0.011, 6, false),
      s1: new THREE.TubeGeometry(strand1, 12, 0.011, 6, false),
      s2: new THREE.TubeGeometry(strand2, 12, 0.01, 6, false),
      s3: new THREE.TubeGeometry(strand3, 10, 0.01, 6, false),
    };
  }, []);

  // Curved Happy Eye Arc (`^`) and Cute Smile (`◡`) Geometries matching Image 2
  const { eyeArcGeo, smileArcGeo } = useMemo(() => {
    const eyeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.032, -0.008, 0),
      new THREE.Vector3(-0.015, 0.01, 0.004),
      new THREE.Vector3(0, 0.014, 0.006),
      new THREE.Vector3(0.015, 0.01, 0.004),
      new THREE.Vector3(0.032, -0.008, 0),
    ]);
    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.022, 0.008, 0),
      new THREE.Vector3(-0.01, -0.01, 0.004),
      new THREE.Vector3(0, -0.014, 0.006),
      new THREE.Vector3(0.01, -0.01, 0.004),
      new THREE.Vector3(0.022, 0.008, 0),
    ]);
    return {
      eyeArcGeo: new THREE.TubeGeometry(eyeCurve, 12, 0.0068, 6, false),
      smileArcGeo: new THREE.TubeGeometry(smileCurve, 12, 0.0062, 6, false),
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
      waveTimerRef.current = 1.6;
      vInput.wave = false;
    }
    if (waveTimerRef.current > 0) {
      waveTimerRef.current = Math.max(0, waveTimerRef.current - dt);
    }

    _desiredDir.set(0, 0);
    let hasInput = false;
    // Fast, responsive movement speeds (Walk: 5.4 m/s, Path-Walk: 6.0 m/s, Sprint: 8.6 m/s)
    let maxSpeed = sprint ? 8.6 : 5.4;

    // 1. Direct Player Keyboard / D-Pad Input (Camera-relative XZ)
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
    }

    // Update Root Transform
    if (rootRef.current) {
      rootRef.current.position.set(pos.x, 0, pos.z);
      rootRef.current.rotation.y = characterYawRef.current;
    }

    // Check Landmark Zone Discovery (only trigger callback when entering a different zone)
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

    // Check Collectible Sun Relics (✧)
    for (let i = 0; i < INITIAL_SUN_RELICS.length; i++) {
      const relic = INITIAL_SUN_RELICS[i];
      if (!collectedRelics.includes(relic.id)) {
        const dx = pos.x - relic.position[0];
        const dz = pos.z - relic.position[2];
        if (dx * dx + dz * dz < 1.15 * 1.15) {
          onCollectRelic(relic.id);
        }
      }
    }

    // =====================================================================
    // PROCEDURAL CHIBI WALKING, TROTTING & CHEERFUL WAVING ANIMATIONS
    // =====================================================================
    const normSpeed = THREE.MathUtils.clamp(speed / 4.2, 0, 1.55);
    if (speed > 0.08) {
      stridePhaseRef.current += dt * (7.2 + normSpeed * 6.2);
    } else {
      stridePhaseRef.current += dt * 1.8;
    }
    const phase = stridePhaseRef.current;

    // 1. Cushioned Chibi Walk Bounce & Forward Lean
    const walkBob =
      speed > 0.08
        ? Math.abs(Math.sin(phase)) * 0.055 * Math.min(1.2, normSpeed)
        : Math.sin(elapsed * 2.4) * 0.008;

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
        (speed > 0.08 ? Math.cos(phase) * 0.038 * normSpeed : Math.sin(elapsed * 1.8) * 0.015);
    }

    // 2. Alternating Short Black Boots / Legs Stride
    if (leftLegRef.current && rightLegRef.current) {
      const legSwing = speed > 0.08 ? Math.sin(phase) * 0.62 * Math.min(1.3, normSpeed) : 0;
      leftLegRef.current.rotation.x = legSwing;
      rightLegRef.current.rotation.x = -legSwing;
    }

    // 3. Cheerful Waving Right Arm + Walking Arm Swing
    const isWaving = waveTimerRef.current > 0 || speed < 0.08;
    if (rightArmRef.current && leftArmRef.current) {
      if (isWaving) {
        const waveOsc = Math.sin(elapsed * 8.5) * 0.22;
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          2.25 + waveOsc,
          Math.min(1, dt * 10)
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          0.18,
          Math.min(1, dt * 10)
        );
      } else {
        const armSwing = -Math.sin(phase) * 0.48 * Math.min(1.25, normSpeed);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          0.32,
          Math.min(1, dt * 10)
        );
        rightArmRef.current.rotation.x = armSwing;
      }

      const leftSwing = speed > 0.08 ? Math.sin(phase) * 0.45 * Math.min(1.25, normSpeed) : 0;
      leftArmRef.current.rotation.x = leftSwing;
      leftArmRef.current.rotation.z = -0.26 - Math.abs(leftSwing) * 0.08;
    }

    // 4. Expressive Chibi Head Tilt
    if (headRef.current) {
      const baseTiltZ = -0.09;
      const walkNod = speed > 0.08 ? Math.sin(phase * 2) * 0.025 * normSpeed : 0;
      headRef.current.rotation.z =
        baseTiltZ + Math.sin(elapsed * 2.1) * 0.025 - smoothBankRef.current * 0.4;
      headRef.current.rotation.x = -smoothLeanRef.current * 0.45 + walkNod;
    }

    // 5. Secondary Spring Physics on Her Flowing Black Hair Strands
    if (hairStrandsRef.current) {
      hairStrandsRef.current.rotation.z =
        Math.sin(elapsed * 3.8 + phase * 0.5) * 0.08 + normSpeed * 0.12;
      hairStrandsRef.current.rotation.y =
        -smoothBankRef.current * 0.8 + Math.cos(elapsed * 2.9) * 0.06;
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
          onHover('Mina — Move with WASD / Arrows, Press F to Wave, or Click V for POV!');
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          waveTimerRef.current = 1.8;
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

      {/* Warm Personal Fill Light so Mina's Red Coat & Face Pop in Shaded Corners */}
      <pointLight position={[0, 0.85, 0.35]} color="#fff3dc" intensity={0.65} distance={3.2} />

      {/* ================================================================= */}
      {/* MAIN BOUNCING & BANKING CHIBI BODY GROUP                          */}
      {/* ================================================================= */}
      <group ref={bodyBounceRef}>
        {/* =============================================================== */}
        {/* 1. SHORT INK-BLACK BOOTS / LEGS                                 */}
        {/* =============================================================== */}
        <group position={[0, 0.18, 0]}>
          {/* Right Leg */}
          <group ref={rightLegRef} position={[0.052, 0, 0]}>
            <mesh position={[0, -0.085, 0]} material={materials.bootMat} castShadow receiveShadow>
              <cylinderGeometry args={[0.044, 0.038, 0.17, 12]} />
            </mesh>
            <mesh
              position={[0, -0.165, 0.015]}
              scale={[1.0, 0.75, 1.25]}
              material={materials.bootMat}
              castShadow
            >
              <sphereGeometry args={[0.04, 10, 10]} />
            </mesh>
          </group>

          {/* Left Leg */}
          <group ref={leftLegRef} position={[-0.052, 0, 0]}>
            <mesh position={[0, -0.085, 0]} material={materials.bootMat} castShadow receiveShadow>
              <cylinderGeometry args={[0.044, 0.038, 0.17, 12]} />
            </mesh>
            <mesh
              position={[0, -0.165, 0.015]}
              scale={[1.0, 0.75, 1.25]}
              material={materials.bootMat}
              castShadow
            >
              <sphereGeometry args={[0.04, 10, 10]} />
            </mesh>
          </group>
        </group>

        {/* =============================================================== */}
        {/* 2. CRIMSON-RED A-LINE COAT WITH 7 WHITE BUTTONS                 */}
        {/* =============================================================== */}
        <group ref={coatRef} position={[0, 0.36, 0]}>
          {/* Flared A-Line Red Coat Torso */}
          <mesh position={[0, 0, 0]} material={materials.coatMat} castShadow receiveShadow>
            <cylinderGeometry args={[0.105, 0.215, 0.39, 20]} />
          </mesh>

          {/* Crisp Black Bottom Hem Outline Ring */}
          <mesh
            position={[0, -0.192, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            material={materials.trimBasicMat}
          >
            <torusGeometry args={[0.213, 0.008, 6, 24]} />
          </mesh>

          {/* Subtle Front Center Seam Line & Collar V-Neck Lapel */}
          <mesh
            position={[0, -0.01, 0.162]}
            rotation={[-0.27, 0, 0]}
            material={materials.trimBasicMat}
          >
            <boxGeometry args={[0.009, 0.37, 0.01]} />
          </mesh>

          {/* White Neck Peeking at Top of Red Coat Collar */}
          <mesh position={[0, 0.195, 0.015]} material={materials.handMat} castShadow>
            <cylinderGeometry args={[0.048, 0.055, 0.06, 12]} />
          </mesh>

          {/* 7 Signature Tiny White Buttons Running Down the Front */}
          {[0, 1, 2, 3, 4, 5, 6].map((bIdx) => {
            const t = bIdx / 6;
            const by = 0.12 - t * 0.26;
            const fracFromTop = (0.195 - by) / 0.39;
            const rAtY = THREE.MathUtils.lerp(0.105, 0.215, fracFromTop) + 0.006;
            return (
              <mesh
                key={`btn-${bIdx}`}
                geometry={buttonSphereGeo}
                material={materials.buttonMat}
                position={[-0.016, by, rAtY]}
                rotation={[0.26, 0, 0]}
              />
            );
          })}

          {/* Cheerful Waving Right Arm */}
          <group ref={rightArmRef} position={[0.105, 0.13, 0.02]} rotation={[0.15, 0, 2.25]}>
            <mesh position={[0, -0.085, 0]} material={materials.coatMat} castShadow>
              <cylinderGeometry args={[0.042, 0.058, 0.18, 12]} />
            </mesh>
            <mesh
              position={[0, -0.172, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              material={materials.trimBasicMat}
            >
              <torusGeometry args={[0.056, 0.007, 6, 14]} />
            </mesh>
            <mesh
              position={[0, -0.195, 0]}
              scale={[0.95, 1.05, 0.85]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.038, 12, 12]} />
            </mesh>
          </group>

          {/* Cozy Left Arm */}
          <group ref={leftArmRef} position={[-0.105, 0.13, 0.02]} rotation={[0, 0, -0.26]}>
            <mesh position={[0, -0.095, 0]} material={materials.coatMat} castShadow>
              <cylinderGeometry args={[0.044, 0.064, 0.21, 12]} />
            </mesh>
            <mesh
              position={[0, -0.198, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              material={materials.trimBasicMat}
            >
              <torusGeometry args={[0.062, 0.008, 6, 14]} />
            </mesh>
            <mesh
              position={[0, -0.218, 0]}
              scale={[0.95, 0.9, 0.85]}
              material={materials.handMat}
              castShadow
            >
              <sphereGeometry args={[0.038, 12, 12]} />
            </mesh>
          </group>
        </group>

        {/* =============================================================== */}
        {/* 3. ADORABLE CHIBI HEAD, HAPPY ARC EYES, RED CHEEKS & BLACK HAIR */}
        {/* =============================================================== */}
        <group ref={headRef} position={[0, 0.77, 0.02]} visible={cameraMode !== 'pov'}>
          {/* Main Round Porcelain-White Chibi Face */}
          <mesh
            position={[0, -0.01, 0.02]}
            scale={[1.14, 0.96, 1.04]}
            material={materials.faceMat}
            castShadow
          >
            <sphereGeometry args={[0.215, 22, 22]} />
          </mesh>

          {/* Soft Puffed Lower Chibi Cheeks */}
          <mesh
            position={[0.095, -0.055, 0.11]}
            scale={[1.15, 0.88, 1.05]}
            material={materials.faceMat}
            castShadow
          >
            <sphereGeometry args={[0.115, 14, 14]} />
          </mesh>
          <mesh
            position={[-0.095, -0.055, 0.11]}
            scale={[1.15, 0.88, 1.05]}
            material={materials.faceMat}
            castShadow
          >
            <sphereGeometry args={[0.115, 14, 14]} />
          </mesh>

          {/* Cute White Ear Peeking on Right Side */}
          <mesh
            position={[-0.235, 0.01, 0.02]}
            scale={[0.45, 0.85, 0.65]}
            material={materials.faceMat}
          >
            <sphereGeometry args={[0.048, 10, 10]} />
          </mesh>

          {/* Happy Closed Smiling Arc Eyes (`^ ^`) */}
          <mesh
            geometry={eyeArcGeo}
            material={materials.hairBasicMat}
            position={[0.088, 0.008, 0.232]}
            rotation={[0, 0.18, -0.08]}
          />
          <mesh
            geometry={eyeArcGeo}
            material={materials.hairBasicMat}
            position={[-0.088, 0.015, 0.232]}
            rotation={[0, -0.18, -0.04]}
          />

          {/* Sweet Tiny Center Smile (`◡`) */}
          <mesh
            geometry={smileArcGeo}
            material={materials.hairBasicMat}
            position={[0.0, -0.022, 0.238]}
            rotation={[0, 0, -0.05]}
          />

          {/* Signature Round Crimson-Red Cheeks */}
          <mesh
            position={[0.128, -0.042, 0.218]}
            rotation={[0.08, 0.42, 0]}
            material={materials.cheekMat}
          >
            <circleGeometry args={[0.036, 16]} />
          </mesh>
          <mesh
            position={[-0.128, -0.032, 0.218]}
            rotation={[0.08, -0.42, 0]}
            material={materials.cheekMat}
          >
            <circleGeometry args={[0.036, 16]} />
          </mesh>

          {/* ============================================================= */}
          {/* VOLUMINOUS GLOSSY JET-BLACK BOB HAIR & FLOWING LEFT STRANDS   */}
          {/* ============================================================= */}
          <group position={[0, 0.02, -0.01]}>
            <mesh
              position={[0, 0.035, 0]}
              scale={[1.22, 1.04, 1.16]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry
                args={[0.222, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.64]}
              />
            </mesh>

            <mesh
              position={[0, -0.045, -0.04]}
              scale={[1.24, 1.02, 1.12]}
              material={materials.hairMat}
              castShadow
            >
              <cylinderGeometry args={[0.21, 0.255, 0.26, 20]} />
            </mesh>

            <mesh
              position={[0.15, -0.065, -0.01]}
              rotation={[0, 0, 0.32]}
              scale={[1.15, 1.05, 1.0]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry args={[0.145, 14, 14]} />
            </mesh>

            <mesh
              position={[-0.165, -0.045, 0.01]}
              rotation={[0, 0, -0.22]}
              scale={[0.95, 1.12, 1.0]}
              material={materials.hairMat}
              castShadow
            >
              <sphereGeometry args={[0.135, 14, 14]} />
            </mesh>

            {[
              [0.095, 0.085, 0.195, 0.22, 0.22, -0.28],
              [0.028, 0.095, 0.212, 0.26, 0.06, -0.18],
              [-0.035, 0.095, 0.212, 0.26, -0.06, -0.12],
              [-0.105, 0.082, 0.192, 0.22, -0.24, 0.25],
            ].map(([bx, by, bz, rx, ry, rz], idx) => (
              <mesh
                key={`bang-${idx}`}
                geometry={bangCapsuleGeo}
                material={materials.hairMat}
                position={[bx, by, bz]}
                rotation={[rx, ry, rz]}
                scale={[0.92, 1.05, 0.52]}
                castShadow
              />
            ))}

            <group ref={hairStrandsRef} position={[0.04, 0.02, 0.04]}>
              <mesh geometry={hairStrandGeos.loop} material={materials.hairMat} castShadow />
              <mesh geometry={hairStrandGeos.s1} material={materials.hairMat} castShadow />
              <mesh geometry={hairStrandGeos.s2} material={materials.hairMat} castShadow />
              <mesh geometry={hairStrandGeos.s3} material={materials.hairMat} castShadow />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
