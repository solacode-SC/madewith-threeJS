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
  getRoadYaw,
} from '../../utils/roadPath';
import type { VirtualFlightInput } from '../../hooks/useSceneState';

interface FlyingChibiGirlProps {
  autoFly: boolean;
  collectedStars: number[];
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterYawRef: React.MutableRefObject<number>;
  flightAltitudeOffsetRef: React.MutableRefObject<number>;
  flyTargetRef: React.MutableRefObject<THREE.Vector3 | null>;
  virtualInputRef: React.MutableRefObject<VirtualFlightInput>;
  onClearFlyTarget: () => void;
  onManualMove: () => void;
  onDiscoverZone: (zoneId: string) => void;
  onCollectStar: (starId: number) => void;
  onSelectCharacter: () => void;
  onHover: (label: string | null) => void;
}

export default function FlyingChibiGirl({
  autoFly,
  collectedStars,
  characterPosRef,
  characterYawRef,
  flightAltitudeOffsetRef,
  flyTargetRef,
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
  const autoFlyDirectionRef = useRef<-1 | 1>(-1); // -1 = flying up the road (-Z), +1 = returning
  const smoothPitchRef = useRef<number>(0.12);
  const smoothRollRef = useRef<number>(0);
  const flightPhaseRef = useRef<number>(0);

  // Trail history ring buffer for magical sparkle wake
  const trailHistoryRef = useRef<THREE.Vector3[]>(
    Array.from({ length: 14 }, () => new THREE.Vector3(0, 1, 1.4))
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
        onManualMove();
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
  }, [onManualMove]);

  // Signature curved ahoge (top hair curl) matching Reference Image 2
  const ahogeGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.01, 0.065, 0.015),
      new THREE.Vector3(0.035, 0.125, 0.045),
      new THREE.Vector3(0.085, 0.105, 0.065),
      new THREE.Vector3(0.07, 0.075, 0.055),
    ]);
    return new THREE.TubeGeometry(curve, 16, 0.014, 8, false);
  }, []);

  // 4-pointed star geometry (✧) matching the sparkle in Reference Image 2
  const fourPointStarGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = 0.052;
    const inner = 0.013;
    shape.moveTo(0, outer);
    shape.quadraticCurveTo(inner, inner, outer, 0);
    shape.quadraticCurveTo(inner, -inner, 0, -outer);
    shape.quadraticCurveTo(-inner, -inner, -outer, 0);
    shape.quadraticCurveTo(-inner, inner, 0, outer);

    const extrudeSettings = {
      depth: 0.008,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const elapsed = state.clock.getElapsedTime();

    const pos = characterPosRef.current;
    const prevPos = pos.clone();

    const keys = keysRef.current;
    const vInput = virtualInputRef.current;

    const up = keys['w'] || keys['arrowup'] || vInput.up;
    const down = keys['s'] || keys['arrowdown'] || vInput.down;
    const left = keys['a'] || keys['arrowleft'] || vInput.left;
    const right = keys['d'] || keys['arrowright'] || vInput.right;
    const ascend = keys[' '] || keys['e'] || vInput.ascend;
    const descend = keys['c'] || keys['q'] || vInput.descend;
    const boost = keys['shift'] || vInput.boost;

    // Altitude adjustment (soaring higher or skimming steps)
    if (ascend) {
      flightAltitudeOffsetRef.current = Math.min(
        3.5,
        flightAltitudeOffsetRef.current + dt * 2.1
      );
    }
    if (descend) {
      flightAltitudeOffsetRef.current = Math.max(
        0.58,
        flightAltitudeOffsetRef.current - dt * 2.1
      );
    }

    let moveVec = new THREE.Vector3(0, 0, 0);
    let isFlyingMove = false;
    let speed = boost ? 6.4 : 3.85;

    // 1. Direct Keyboard or On-Screen Flight Pad Input (Camera-relative XZ)
    if (up || down || left || right) {
      if (vInput.up || vInput.down || vInput.left || vInput.right) {
        onManualMove();
      }
      const camForward = new THREE.Vector3();
      state.camera.getWorldDirection(camForward);
      camForward.y = 0;
      if (camForward.lengthSq() < 0.001) camForward.set(0, 0, -1);
      camForward.normalize();

      const camRight = new THREE.Vector3()
        .crossVectors(camForward, new THREE.Vector3(0, 1, 0))
        .normalize();

      if (up) moveVec.add(camForward);
      if (down) moveVec.sub(camForward);
      if (right) moveVec.add(camRight);
      if (left) moveVec.sub(camRight);

      if (moveVec.lengthSq() > 0.001) {
        moveVec.normalize();
        isFlyingMove = true;
      }
    }
    // 2. Click-to-Fly Destination Navigation along the Blue Road
    else if (flyTargetRef.current) {
      const target = flyTargetRef.current;
      const toTarget = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
      const dist = toTarget.length();

      if (dist < 0.22) {
        onClearFlyTarget();
      } else {
        toTarget.normalize();
        // Follow the road curve smoothly if flying a longer distance
        const aheadZ = pos.z + Math.sign(target.z - pos.z) * Math.min(2.5, dist);
        const guideX = THREE.MathUtils.lerp(getRoadCenterX(aheadZ), target.x, 0.55);
        const steered = new THREE.Vector3(guideX - pos.x, 0, aheadZ - pos.z).normalize();
        moveVec.copy(dist < 3.5 ? toTarget : steered);
        isFlyingMove = true;
        speed = 4.5;
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
        pos.z + autoFlyDirectionRef.current * 2.8,
        ROAD_END_Z + 1.2,
        ROAD_START_Z - 0.8
      );
      // Gentle figure-8 weaving along the centerline
      const weaveX = getRoadCenterX(lookAheadZ) + Math.sin(elapsed * 0.9) * 0.42;
      const toNext = new THREE.Vector3(weaveX - pos.x, 0, lookAheadZ - pos.z);
      if (toNext.lengthSq() > 0.001) {
        moveVec.copy(toNext.normalize());
        isFlyingMove = true;
        speed = 3.45;
      }
    }

    // Apply horizontal flight movement & clamp smoothly within the Blue Medina canyon walls
    if (isFlyingMove) {
      pos.x += moveVec.x * speed * dt;
      pos.z += moveVec.z * speed * dt;
    }

    pos.z = THREE.MathUtils.clamp(pos.z, ROAD_END_Z + 1.0, ROAD_START_Z - 0.2);
    const roadCenter = getRoadCenterX(pos.z);
    const corridorHalfWidth = getRoadHalfWidth(pos.z) - 0.42;
    pos.x = THREE.MathUtils.clamp(
      pos.x,
      roadCenter - corridorHalfWidth,
      roadCenter + corridorHalfWidth
    );

    // Smoothly hover above the ascending painted steps (never walking, always levitating!)
    const groundY = getRoadElevationY(pos.z);
    const hoverBob =
      Math.sin(elapsed * 2.8) * 0.085 + Math.cos(elapsed * 1.6) * 0.035;
    const targetY = groundY + flightAltitudeOffsetRef.current + hoverBob;
    pos.y = THREE.MathUtils.lerp(pos.y, targetY, Math.min(1, dt * 9.0));

    // Compute yaw rotation & banking roll angle
    let turnRate = 0;
    const actualDeltaXZ = new THREE.Vector2(pos.x - prevPos.x, pos.z - prevPos.z);
    if (isFlyingMove && actualDeltaXZ.lengthSq() > 0.000005) {
      const targetYaw = Math.atan2(moveVec.x, moveVec.z);
      let angleDiff = targetYaw - characterYawRef.current;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      turnRate = angleDiff;
      characterYawRef.current += angleDiff * Math.min(1, dt * 9.5);
      flightPhaseRef.current += dt * (boost ? 11.0 : 7.5);
    } else {
      flightPhaseRef.current += dt * 2.6;
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
    for (const zone of LANDMARK_ZONES) {
      if (pos.z <= zone.zRange[0] && pos.z >= zone.zRange[1]) {
        onDiscoverZone(zone.id);
        break;
      }
    }

    // Check Collectible Sky Stars (✧) proximity
    for (const star of INITIAL_SKY_STARS) {
      if (!collectedStars.includes(star.id)) {
        const dx = pos.x - star.position[0];
        const dy = pos.y + 0.35 - star.position[1];
        const dz = pos.z - star.position[2];
        if (dx * dx + dy * dy + dz * dz < 1.15 * 1.15) {
          onCollectStar(star.id);
        }
      }
    }

    // Procedural Fantasy Flight & Hover Body Animations
    const fp = flightPhaseRef.current;
    const targetPitch = isFlyingMove ? (boost ? 0.52 : 0.34) : 0.08;
    const targetRoll = isFlyingMove
      ? THREE.MathUtils.clamp(-turnRate * 0.45, -0.35, 0.35)
      : Math.sin(elapsed * 1.5) * 0.04;

    smoothPitchRef.current = THREE.MathUtils.lerp(
      smoothPitchRef.current,
      targetPitch,
      Math.min(1, dt * 7.5)
    );
    smoothRollRef.current = THREE.MathUtils.lerp(
      smoothRollRef.current,
      targetRoll,
      Math.min(1, dt * 7.5)
    );

    if (bodyTiltRef.current) {
      bodyTiltRef.current.rotation.x = smoothPitchRef.current;
      bodyTiltRef.current.rotation.z = smoothRollRef.current;
    }

    // Head looks slightly up when gliding forward so her cute cheeks & closed eyes stay visible
    if (headRef.current) {
      headRef.current.rotation.x =
        -smoothPitchRef.current * 0.48 + Math.sin(fp * 1.2) * 0.035;
      headRef.current.rotation.z = Math.cos(fp * 0.9) * 0.03;
    }

    // Bouncy top ahoge curl sways in the slipstream
    if (ahogeRef.current) {
      ahogeRef.current.rotation.x =
        -smoothPitchRef.current * 0.6 + Math.sin(fp * 2.4) * 0.16;
      ahogeRef.current.rotation.z = Math.cos(fp * 2.0) * 0.18;
    }

    // Wide kimono sleeves trail back like little wings during flight
    if (leftSleeveRef.current && rightSleeveRef.current) {
      const wingSpread = isFlyingMove ? (boost ? 0.52 : 0.34) : 0.14;
      const flutter = Math.sin(fp * 2.2) * 0.08;
      leftSleeveRef.current.rotation.z = -wingSpread - flutter;
      leftSleeveRef.current.rotation.x = -smoothPitchRef.current * 0.55;
      rightSleeveRef.current.rotation.z = wingSpread + flutter;
      rightSleeveRef.current.rotation.x = -smoothPitchRef.current * 0.55;
    }

    // Dangling legs & bare feet sway gently in mid-air (never walking!)
    if (leftLegRef.current && rightLegRef.current) {
      const swayA = Math.sin(fp * 1.5) * 0.12;
      const swayB = Math.cos(fp * 1.5) * 0.12;
      const trailAngle = isFlyingMove ? -0.32 : -0.12;
      leftLegRef.current.rotation.x = trailAngle + swayA;
      rightLegRef.current.rotation.x = trailAngle + swayB;
    }

    // Sheathed sword gentle aerodynamic sway
    if (swordRef.current) {
      swordRef.current.rotation.z = 0.28 + Math.sin(fp * 1.8) * 0.04;
    }

    // Floating 4-pointed star sparkle (✧) beside her cheek (from Reference Image 2!)
    if (faceSparkleRef.current) {
      faceSparkleRef.current.position.y = 0.68 + Math.sin(elapsed * 4.2) * 0.035;
      faceSparkleRef.current.rotation.y = elapsed * 1.8;
      const pulse = 0.88 + Math.sin(elapsed * 5.5) * 0.22;
      faceSparkleRef.current.scale.setScalar(pulse);
    }

    // Wind-spirit ribbons streaming behind her coral backpack
    if (ribbonLeftRef.current && ribbonRightRef.current) {
      const ribbonOpacity = isFlyingMove ? (boost ? 0.78 : 0.52) : 0.22;
      const ribbonScaleY = isFlyingMove ? (boost ? 1.65 : 1.15) : 0.55;
      ribbonLeftRef.current.scale.set(1, ribbonScaleY, 1);
      ribbonRightRef.current.scale.set(1, ribbonScaleY, 1);
      ribbonLeftRef.current.rotation.z = Math.sin(elapsed * 6.5) * 0.18;
      ribbonRightRef.current.rotation.z = -Math.sin(elapsed * 6.5 + 1.2) * 0.18;
      (ribbonLeftRef.current.material as THREE.MeshBasicMaterial).opacity = ribbonOpacity;
      (ribbonRightRef.current.material as THREE.MeshBasicMaterial).opacity = ribbonOpacity;
    }

    // Update world-space sparkle trail history
    trailTimerRef.current += dt;
    if (trailTimerRef.current > 0.035) {
      trailTimerRef.current = 0;
      const hist = trailHistoryRef.current;
      for (let i = hist.length - 1; i > 0; i--) {
        hist[i].copy(hist[i - 1]);
      }
      hist[0].set(
        pos.x + (Math.sin(elapsed * 9.0) * 0.12),
        pos.y + 0.28 + Math.cos(elapsed * 7.0) * 0.08,
        pos.z
      );
    }

    if (trailParticlesRef.current && rootRef.current) {
      const hist = trailHistoryRef.current;
      const invYaw = -characterYawRef.current;
      trailParticlesRef.current.children.forEach((child, idx) => {
        const pt = hist[Math.min(idx + 1, hist.length - 1)];
        const rel = pt.clone().sub(pos).applyAxisAngle(new THREE.Vector3(0, 1, 0), invYaw);
        child.position.copy(rel);
        child.rotation.y = elapsed * 3.0 + idx;
        child.rotation.z = elapsed * 2.0;
        const fade = (1 - idx / hist.length) * (isFlyingMove ? 1.1 : 0.55);
        child.scale.setScalar(Math.max(0.01, fade));
      });
    }
  });

  // Exact Color Palette from Reference Image 2
  const skinColor = '#fdeee7';       // Soft porcelain-peach chubby cheeks
  const blushColor = '#f28b82';      // Warm coral-pink blush
  const blushLineColor = '#d95f57';  // Diagonal anime blush hash marks
  const hairColor = '#46302b';       // Warm dark espresso bob hair
  const hairHighlight = '#73534a';   // Soft cocoa crown highlight
  const tunicColor = '#cbc9be';      // Oversized sage-grey / warm olive tunic top
  const tunicTrim = '#a6a498';       // Collar & sleeve trim
  const backpackColor = '#f29586';   // Coral-salmon round backpack
  const strapColor = '#c2ada2';      // Shoulder strap
  const pantsColor = '#dfc5d6';      // Soft lavender-pink wide cropped pants
  const pantsCrease = '#bda0b3';
  const scabbardColor = '#322726';   // Dark charcoal-brown sheathed blade
  const hiltWrapColor = '#c96242';   // Terracotta-orange hilt wrap

  //Unused import guard for getRoadYaw if needed
  void getRoadYaw;

  return (
    <group
      ref={rootRef}
      position={[0, 1.1, 1.4]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover('Lumina (Sky Wanderer) — Flying with WASD / Space / Click Road');
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelectCharacter();
      }}
    >
      {/* ========================================================= */}
      {/* 0. GROUND CELESTIAL WIND HALO & SPARKLE WAKE TRAIL        */}
      {/* ========================================================= */}
      <group ref={groundHaloRef} position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Soft glowing azure levitation ring on the cobalt steps */}
        <mesh>
          <ringGeometry args={[0.24, 0.31, 32]} />
          <meshBasicMaterial
            color="#8ce0ff"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[0.22, 24]} />
          <meshBasicMaterial color="#0b2e78" transparent opacity={0.22} />
        </mesh>
      </group>

      {/* Trailing 4-Pointed Star Sparkles (✧) in Wake */}
      <group ref={trailParticlesRef}>
        {Array.from({ length: 12 }).map((_, idx) => (
          <mesh key={idx} geometry={fourPointStarGeo}>
            <meshBasicMaterial
              color={idx % 2 === 0 ? '#fff6d6' : '#8ce4ff'}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>

      {/* ========================================================= */}
      {/* MAIN LEVITATING & PITCHING CHARACTER BODY GROUP           */}
      {/* ========================================================= */}
      <group ref={bodyTiltRef}>
        {/* Soft Magical Aura Glow Point Light Attached to Character */}
        <pointLight
          position={[0, 0.35, 0.15]}
          color="#a8e4ff"
          intensity={0.65}
          distance={3.5}
        />

        {/* ===================================================== */}
        {/* 1. DANGLING WIDE LAVENDER PANTS & BARE FEET           */}
        {/* ===================================================== */}
        <group position={[0, 0.22, 0]}>
          {/* Left Wide Cropped Lavender Pant Leg + Dangling Bare Foot */}
          <group ref={leftLegRef} position={[-0.075, 0.04, 0]}>
            <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.078, 0.112, 0.19, 16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.78} />
            </mesh>
            {/* Subtle pant pleat line */}
            <mesh position={[-0.02, -0.09, 0.098]} rotation={[0, 0, 0.08]}>
              <boxGeometry args={[0.012, 0.15, 0.01]} />
              <meshStandardMaterial color={pantsCrease} roughness={0.8} />
            </mesh>
            {/* Dangling Relaxed Bare Foot (pointed slightly downward in flight!) */}
            <mesh
              position={[0, -0.21, 0.025]}
              rotation={[0.48, 0, 0]}
              scale={[0.82, 0.62, 1.35]}
              castShadow
            >
              <sphereGeometry args={[0.046, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.65} />
            </mesh>
          </group>

          {/* Right Wide Cropped Lavender Pant Leg + Dangling Bare Foot */}
          <group ref={rightLegRef} position={[0.075, 0.04, 0]}>
            <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.078, 0.112, 0.19, 16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.78} />
            </mesh>
            <mesh position={[0.02, -0.09, 0.098]} rotation={[0, 0, -0.08]}>
              <boxGeometry args={[0.012, 0.15, 0.01]} />
              <meshStandardMaterial color={pantsCrease} roughness={0.8} />
            </mesh>
            {/* Dangling Relaxed Bare Foot */}
            <mesh
              position={[0, -0.21, 0.025]}
              rotation={[0.52, 0, 0]}
              scale={[0.82, 0.62, 1.35]}
              castShadow
            >
              <sphereGeometry args={[0.046, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.65} />
            </mesh>
          </group>
        </group>

        {/* ===================================================== */}
        {/* 2. OVERSIZED SAGE-GREY TUNIC TOP & CORAL BACKPACK     */}
        {/* ===================================================== */}
        <group position={[0, 0.39, 0]}>
          {/* Flared Oversized Sage-Grey Tunic Torso (matching Image 2's bell silhouette) */}
          <mesh position={[0, -0.01, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.125, 0.195, 0.27, 20]} />
            <meshStandardMaterial color={tunicColor} roughness={0.8} />
          </mesh>

          {/* Rounded Soft Collar Neckline Trim */}
          <mesh position={[0, 0.12, 0.01]} rotation={[Math.PI / 2 + 0.1, 0, 0]}>
            <torusGeometry args={[0.115, 0.018, 10, 24]} />
            <meshStandardMaterial color={tunicTrim} roughness={0.82} />
          </mesh>

          {/* Coral-Pink Puffy Backpack / Satchel on Her Back (Image 2 signature detail!) */}
          <group position={[0, 0.01, -0.145]}>
            <mesh scale={[1.05, 1.15, 0.88]} castShadow receiveShadow>
              <sphereGeometry args={[0.125, 18, 18]} />
              <meshStandardMaterial color={backpackColor} roughness={0.72} />
            </mesh>
            {/* Shoulder Strap Wrapping Over Tunic */}
            <mesh
              position={[-0.045, 0.03, 0.095]}
              rotation={[0.35, 0.2, -0.45]}
              castShadow
            >
              <boxGeometry args={[0.028, 0.22, 0.025]} />
              <meshStandardMaterial color={strapColor} roughness={0.78} />
            </mesh>
            <mesh
              position={[0.045, 0.03, 0.095]}
              rotation={[0.35, -0.2, 0.45]}
              castShadow
            >
              <boxGeometry args={[0.028, 0.22, 0.025]} />
              <meshStandardMaterial color={strapColor} roughness={0.78} />
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

          {/* Left Wide Bell Sleeve + Cute Tiny Chibi Hand */}
          <group ref={leftSleeveRef} position={[-0.125, 0.08, 0.01]}>
            <mesh
              position={[-0.055, -0.095, 0.01]}
              rotation={[0.1, 0, -0.36]}
              scale={[0.92, 1.12, 1.12]}
              castShadow
            >
              <coneGeometry args={[0.105, 0.22, 16]} />
              <meshStandardMaterial color={tunicColor} roughness={0.8} />
            </mesh>
            <mesh position={[-0.085, -0.195, 0.025]} castShadow>
              <sphereGeometry args={[0.036, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.65} />
            </mesh>
          </group>

          {/* Right Wide Bell Sleeve + Cute Tiny Chibi Hand */}
          <group ref={rightSleeveRef} position={[0.125, 0.08, 0.01]}>
            <mesh
              position={[0.055, -0.095, 0.01]}
              rotation={[0.1, 0, 0.36]}
              scale={[0.92, 1.12, 1.12]}
              castShadow
            >
              <coneGeometry args={[0.105, 0.22, 16]} />
              <meshStandardMaterial color={tunicColor} roughness={0.8} />
            </mesh>
            <mesh position={[0.085, -0.195, 0.025]} castShadow>
              <sphereGeometry args={[0.036, 12, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.65} />
            </mesh>
          </group>
        </group>

        {/* ===================================================== */}
        {/* 3. DIAGONAL DARK SWORD & TERRACOTTA HILT (Image 2!)   */}
        {/* ===================================================== */}
        <group
          ref={swordRef}
          position={[-0.06, 0.28, -0.02]}
          rotation={[-0.34, 0.18, 0.15]}
        >
          {/* Long Tapered Dark Scabbard Extending Behind Her Back */}
          <mesh position={[0, 0, -0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.026, 0.014, 0.68, 12]} />
            <meshStandardMaterial color={scabbardColor} roughness={0.6} />
          </mesh>
          {/* Tapered Sword Tip */}
          <mesh position={[0, 0, -0.51]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.014, 0.07, 10]} />
            <meshStandardMaterial color={scabbardColor} roughness={0.6} />
          </mesh>
          {/* Circular Bronze Sword Guard (Tsuba) */}
          <mesh position={[0, 0, 0.21]}>
            <cylinderGeometry args={[0.044, 0.044, 0.014, 14]} />
            <meshStandardMaterial color="#4a3731" roughness={0.5} />
          </mesh>
          {/* Warm Terracotta-Orange Wrapped Hilt Peeking in Front */}
          <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.022, 0.024, 0.13, 12]} />
            <meshStandardMaterial color={hiltWrapColor} roughness={0.68} />
          </mesh>
        </group>

        {/* ===================================================== */}
        {/* 4. CHUBBY CHEEKS, CLOSED EYES, BOB HAIR & AHOGE CURL  */}
        {/* ===================================================== */}
        <group ref={headRef} position={[0, 0.64, 0.02]}>
          {/* Main Rounded Chibi Head */}
          <mesh position={[0, 0, 0.01]} scale={[1.06, 0.96, 1.06]} castShadow>
            <sphereGeometry args={[0.185, 24, 24]} />
            <meshStandardMaterial color={skinColor} roughness={0.65} />
          </mesh>

          {/* Signature Puffed Chubby Lower Cheeks (matching Image 2's adorable profile!) */}
          <mesh position={[-0.078, -0.052, 0.105]} scale={[1.18, 0.88, 1.15]} castShadow>
            <sphereGeometry args={[0.102, 18, 18]} />
            <meshStandardMaterial color={skinColor} roughness={0.65} />
          </mesh>
          <mesh position={[0.078, -0.052, 0.105]} scale={[1.18, 0.88, 1.15]} castShadow>
            <sphereGeometry args={[0.102, 18, 18]} />
            <meshStandardMaterial color={skinColor} roughness={0.65} />
          </mesh>

          {/* Cute Rounded Chibi Ears */}
          <mesh position={[-0.175, -0.035, 0.01]} scale={[0.55, 0.85, 0.75]} castShadow>
            <sphereGeometry args={[0.048, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.68} />
          </mesh>
          <mesh position={[0.175, -0.035, 0.01]} scale={[0.55, 0.85, 0.75]} castShadow>
            <sphereGeometry args={[0.048, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.68} />
          </mesh>

          {/* Peaceful Serene Closed Eyes (Curved Eyelash Arcs + Tiny Eyelashes) */}
          <group position={[-0.072, -0.002, 0.184]} rotation={[0, -0.22, -0.06]}>
            <mesh>
              <boxGeometry args={[0.046, 0.009, 0.008]} />
              <meshBasicMaterial color="#382420" />
            </mesh>
            <mesh position={[-0.022, -0.004, 0]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.016, 0.007, 0.008]} />
              <meshBasicMaterial color="#382420" />
            </mesh>
          </group>
          <group position={[0.072, -0.002, 0.184]} rotation={[0, 0.22, 0.06]}>
            <mesh>
              <boxGeometry args={[0.046, 0.009, 0.008]} />
              <meshBasicMaterial color="#382420" />
            </mesh>
            <mesh position={[0.022, -0.004, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.016, 0.007, 0.008]} />
              <meshBasicMaterial color="#382420" />
            </mesh>
          </group>

          {/* Rosy Coral-Pink Blush Ovals + Anime Diagonal Blush Hash Lines (exact match to Image 2!) */}
          {[-1, 1].map((side) => (
            <group
              key={side}
              position={[side * 0.112, -0.052, 0.178]}
              rotation={[0.08, side * 0.38, 0]}
            >
              <mesh>
                <circleGeometry args={[0.048, 18]} />
                <meshBasicMaterial color={blushColor} transparent opacity={0.72} />
              </mesh>
              {/* Three tiny diagonal blush hash marks */}
              {[-0.016, 0, 0.016].map((bx, bIdx) => (
                <mesh
                  key={bIdx}
                  position={[bx, 0, 0.002]}
                  rotation={[0, 0, -0.28]}
                >
                  <planeGeometry args={[0.005, 0.024]} />
                  <meshBasicMaterial color={blushLineColor} transparent opacity={0.85} />
                </mesh>
              ))}
            </group>
          ))}

          {/* ================================================= */}
          {/* VOLUMINOUS ESPRESSO-BROWN BOB HAIR & AHOGE CURL   */}
          {/* ================================================= */}
          <group position={[0, 0.02, -0.01]}>
            {/* Upper Hair Dome Cap */}
            <mesh position={[0, 0.035, 0]} scale={[1.12, 0.98, 1.12]} castShadow>
              <sphereGeometry
                args={[0.188, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]}
              />
              <meshStandardMaterial color={hairColor} roughness={0.72} />
            </mesh>

            {/* Warm Cocoa Hair Highlight Ovals on Crown (matching Image 2's top shading!) */}
            <mesh
              position={[-0.055, 0.155, 0.075]}
              rotation={[-0.45, -0.25, -0.2]}
              scale={[1.4, 0.45, 0.9]}
            >
              <sphereGeometry args={[0.042, 12, 12]} />
              <meshStandardMaterial color={hairHighlight} roughness={0.65} />
            </mesh>
            <mesh
              position={[0.065, 0.145, 0.055]}
              rotation={[-0.4, 0.3, 0.25]}
              scale={[1.2, 0.45, 0.85]}
            >
              <sphereGeometry args={[0.036, 12, 12]} />
              <meshStandardMaterial color={hairHighlight} roughness={0.65} />
            </mesh>

            {/* Front Forehead Bangs */}
            {[
              [-0.075, 0.075, 0.168, 0.22, -0.18, 0.24],
              [-0.02, 0.085, 0.182, 0.26, -0.05, 0.08],
              [0.04, 0.082, 0.178, 0.25, 0.08, -0.12],
              [0.09, 0.068, 0.162, 0.2, 0.22, -0.28],
            ].map(([bx, by, bz, rx, ry, rz], idx) => (
              <mesh
                key={`bang-${idx}`}
                position={[bx, by, bz]}
                rotation={[rx, ry, rz]}
                scale={[0.95, 1.0, 0.58]}
                castShadow
              >
                <capsuleGeometry args={[0.036, 0.075, 8, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.72} />
              </mesh>
            ))}

            {/* Full Rounded Bob Hair Bell Around Back & Sides */}
            <mesh position={[0, -0.045, -0.035]} scale={[1.14, 1.0, 1.08]} castShadow>
              <cylinderGeometry args={[0.175, 0.225, 0.23, 22]} />
              <meshStandardMaterial color={hairColor} roughness={0.74} />
            </mesh>

            {/* Sculpted Flared Bob Hair Tips Around Neck & Cheeks (matching Image 2!) */}
            {[
              [-0.175, -0.055, 0.055, 0.1, 0.1, -0.24],
              [0.175, -0.055, 0.055, 0.1, -0.1, 0.24],
              [-0.185, -0.075, -0.035, -0.08, 0, -0.32],
              [0.185, -0.075, -0.035, -0.08, 0, 0.32],
              [-0.135, -0.085, -0.125, -0.26, 0, -0.22],
              [0.135, -0.085, -0.125, -0.26, 0, 0.22],
              [0, -0.09, -0.155, -0.32, 0, 0],
            ].map(([lx, ly, lz, rx, ry, rz], idx) => (
              <mesh
                key={`lock-${idx}`}
                position={[lx, ly, lz]}
                rotation={[rx, ry, rz]}
                castShadow
              >
                <capsuleGeometry args={[0.046, 0.12, 8, 12]} />
                <meshStandardMaterial color={hairColor} roughness={0.72} />
              </mesh>
            ))}

            {/* Signature Bouncy Curved Top Ahoge Hair Curl (exact crown detail in Image 2!) */}
            <group ref={ahogeRef} position={[0, 0.195, 0.01]}>
              <mesh geometry={ahogeGeo} castShadow>
                <meshStandardMaterial color={hairColor} roughness={0.68} />
              </mesh>
            </group>
          </group>
        </group>

        {/* ===================================================== */}
        {/* 5. FLOATING 4-POINTED STAR SPARKLE (✧) BY HER FACE    */}
        {/* ===================================================== */}
        <group ref={faceSparkleRef} position={[-0.24, 0.68, 0.24]}>
          <mesh geometry={fourPointStarGeo}>
            <meshBasicMaterial color="#fff8e0" />
          </mesh>
          {/* Subtle warm rose-gold outline halo matching Image 2's drawn star */}
          <mesh geometry={fourPointStarGeo} scale={[1.35, 1.35, 0.8]}>
            <meshBasicMaterial color="#d8968c" transparent opacity={0.45} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
