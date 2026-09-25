import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createStrawHatTexture } from '../../utils/textures';

interface ChibiRoninProps {
  autoPatrol: boolean;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterAngleRef: React.MutableRefObject<number>;
  walkTargetRef: React.MutableRefObject<THREE.Vector3 | null>;
  virtualInputRef: React.MutableRefObject<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    sprint: boolean;
  }>;
  onClearWalkTarget: () => void;
  onManualMove: () => void;
  onSelectCharacter: () => void;
  onHover: (label: string | null) => void;
}

// Scenic waypoints around all 4 sides of the coastal house
const PATROL_WAYPOINTS: { pos: [number, number]; lookAt: [number, number]; pause: number }[] = [
  { pos: [-0.85, 2.35], lookAt: [-0.82, 1.2], pause: 2.2 }, // Admiring the arched coffee window
  { pos: [0.62, 2.35], lookAt: [0.62, 1.2], pause: 1.5 },   // Stepping in front of the teal door
  { pos: [2.75, 1.85], lookAt: [1.65, 0.5], pause: 0.4 },   // Rounding front-right corner
  { pos: [2.85, -0.2], lookAt: [1.65, -0.2], pause: 1.8 },  // Checking out the side patio cafe
  { pos: [2.5, -2.25], lookAt: [0, -3.5], pause: 0.4 },     // Rounding back-right corner
  { pos: [0.2, -2.35], lookAt: [0.2, -5.0], pause: 2.0 },   // Looking out at the turquoise ocean
  { pos: [-2.45, -2.1], lookAt: [-2.45, 0], pause: 0.4 },   // Rounding back-left corner
  { pos: [-2.55, 0.2], lookAt: [-1.65, 0.2], pause: 1.0 },  // Strolling along the left alley
  { pos: [-2.25, 2.25], lookAt: [-0.8, 2.25], pause: 0.4 }, // Returning to front promenade
];

// House bounding box (including pots & patio) for smooth collision avoidance
const HOUSE_BOUNDS = {
  minX: -2.18,
  maxX: 2.32,
  minZ: -1.82,
  maxZ: 1.88,
};

function resolveHouseCollision(nextPos: THREE.Vector3, prevPos: THREE.Vector3) {
  // Clamp to overall coastal promenade island bounds
  nextPos.x = THREE.MathUtils.clamp(nextPos.x, -6.6, 6.6);
  nextPos.z = THREE.MathUtils.clamp(nextPos.z, -3.45, 4.35);

  if (
    nextPos.x > HOUSE_BOUNDS.minX &&
    nextPos.x < HOUSE_BOUNDS.maxX &&
    nextPos.z > HOUSE_BOUNDS.minZ &&
    nextPos.z < HOUSE_BOUNDS.maxZ
  ) {
    // Push out along the axis of shallowest penetration
    const dLeft = Math.abs(nextPos.x - HOUSE_BOUNDS.minX);
    const dRight = Math.abs(HOUSE_BOUNDS.maxX - nextPos.x);
    const dBack = Math.abs(nextPos.z - HOUSE_BOUNDS.minZ);
    const dFront = Math.abs(HOUSE_BOUNDS.maxZ - nextPos.z);
    const minPen = Math.min(dLeft, dRight, dBack, dFront);

    if (minPen === dFront) nextPos.z = HOUSE_BOUNDS.maxZ;
    else if (minPen === dBack) nextPos.z = HOUSE_BOUNDS.minZ;
    else if (minPen === dLeft) nextPos.x = HOUSE_BOUNDS.minX;
    else if (minPen === dRight) nextPos.x = HOUSE_BOUNDS.maxX;
    else nextPos.copy(prevPos);
  }
}

export default function ChibiRonin({
  autoPatrol,
  characterPosRef,
  characterAngleRef,
  walkTargetRef,
  virtualInputRef,
  onClearWalkTarget,
  onManualMove,
  onSelectCharacter,
  onHover,
}: ChibiRoninProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headHatRef = useRef<THREE.Group>(null);
  const sproutRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftFootRef = useRef<THREE.Group>(null);
  const rightFootRef = useRef<THREE.Group>(null);
  const swordRef = useRef<THREE.Group>(null);
  const sweatRef = useRef<THREE.Group>(null);
  const dustGroupRef = useRef<THREE.Group>(null);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const patrolIdxRef = useRef<number>(0);
  const patrolPauseRef = useRef<number>(0.6);
  const walkCycleRef = useRef<number>(0);

  // Keyboard listeners for WASD & Arrow keys
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
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

  const strawHatTex = useMemo(() => createStrawHatTexture(), []);

  // Custom curved conical straw hat geometry (LatheGeometry matching Picture 2's silhouette)
  const hatGeo = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 = apex, 1 = outer brim
      const r = t * 0.56;
      // Gentle convex-to-flared curve matching the kasa hat in Picture 2
      const y = (1 - Math.pow(t, 0.88)) * 0.29;
      points.push(new THREE.Vector2(r, y));
    }
    const geo = new THREE.LatheGeometry(points, 36);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Curved leaf blade geometry for the sprout on top of the hat
  const sproutLeafGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.03, 0.08, 0),
      new THREE.Vector3(0.11, 0.13, 0.01),
      new THREE.Vector3(0.19, 0.1, 0.02),
    ]);
    return new THREE.TubeGeometry(curve, 12, 0.014, 8, false);
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
    const sprint = keys['shift'] || vInput.sprint;

    let moveVec = new THREE.Vector3(0, 0, 0);
    let isMoving = false;
    let speed = sprint ? 2.65 : 1.55;

    // 1. Direct Keyboard / Virtual D-Pad Input (camera-relative on XZ plane)
    if (up || down || left || right) {
      if (vInput.up || vInput.down || vInput.left || vInput.right) {
        onManualMove();
      }
      const camForward = new THREE.Vector3();
      state.camera.getWorldDirection(camForward);
      camForward.y = 0;
      if (camForward.lengthSq() < 0.001) camForward.set(0, 0, -1);
      camForward.normalize();

      const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

      if (up) moveVec.add(camForward);
      if (down) moveVec.sub(camForward);
      if (right) moveVec.add(camRight);
      if (left) moveVec.sub(camRight);

      if (moveVec.lengthSq() > 0.001) {
        moveVec.normalize();
        isMoving = true;
      }
    }
    // 2. Click-to-Walk Target Navigation (with automatic obstacle corner steering)
    else if (walkTargetRef.current) {
      const target = walkTargetRef.current;
      const toTarget = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
      const dist = toTarget.length();

      if (dist < 0.12) {
        onClearWalkTarget();
      } else {
        toTarget.normalize();
        // Check if a step directly toward target would hit the house; if so, steer around corner
        const probe = pos.clone().addScaledVector(toTarget, 0.35);
        if (
          probe.x > HOUSE_BOUNDS.minX &&
          probe.x < HOUSE_BOUNDS.maxX &&
          probe.z > HOUSE_BOUNDS.minZ &&
          probe.z < HOUSE_BOUNDS.maxZ
        ) {
          const tangent = new THREE.Vector3(-toTarget.z, 0, toTarget.x);
          const probeA = pos.clone().addScaledVector(tangent, 0.4);
          const probeB = pos.clone().addScaledVector(tangent, -0.4);
          moveVec.copy(
            probeA.distanceToSquared(target) < probeB.distanceToSquared(target)
              ? tangent
              : tangent.negate()
          );
        } else {
          moveVec.copy(toTarget);
        }
        isMoving = true;
        speed = 1.85;
      }
    }
    // 3. Scenic Auto-Patrol Around the House
    else if (autoPatrol) {
      const wp = PATROL_WAYPOINTS[patrolIdxRef.current];
      const toWp = new THREE.Vector3(wp.pos[0] - pos.x, 0, wp.pos[1] - pos.z);
      const dist = toWp.length();

      if (dist < 0.12) {
        // Pause and turn toward point of interest
        const lookDir = new THREE.Vector2(wp.lookAt[0] - pos.x, wp.lookAt[1] - pos.z);
        const desiredYaw = Math.atan2(lookDir.x, lookDir.y);
        let diff = desiredYaw - characterAngleRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        characterAngleRef.current += diff * Math.min(1, dt * 4.5);

        patrolPauseRef.current -= dt;
        if (patrolPauseRef.current <= 0) {
          patrolIdxRef.current = (patrolIdxRef.current + 1) % PATROL_WAYPOINTS.length;
          patrolPauseRef.current = PATROL_WAYPOINTS[patrolIdxRef.current].pause;
        }
      } else {
        moveVec.copy(toWp.normalize());
        isMoving = true;
        speed = 1.18;
      }
    }

    // Apply movement & house collision resolution
    if (isMoving) {
      pos.addScaledVector(moveVec, speed * dt);
      resolveHouseCollision(pos, prevPos);

      const actualDelta = pos.clone().sub(prevPos);
      if (actualDelta.lengthSq() > 0.00001) {
        const targetYaw = Math.atan2(moveVec.x, moveVec.z);
        let angleDiff = targetYaw - characterAngleRef.current;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        characterAngleRef.current += angleDiff * Math.min(1, dt * 10);
      }

      walkCycleRef.current += dt * (sprint ? 13.5 : 9.2);
    } else {
      // Smoothly settle walk cycle when idle
      walkCycleRef.current += dt * 1.8;
    }

    // Update root transform
    if (rootRef.current) {
      rootRef.current.position.copy(pos);
      rootRef.current.rotation.y = characterAngleRef.current;
    }

    // Procedural Chibi Walk & Idle Animations
    const wc = walkCycleRef.current;
    if (bodyRef.current && headHatRef.current && sproutRef.current) {
      if (isMoving) {
        const stride = Math.sin(wc);
        const bounce = Math.abs(Math.cos(wc));

        // Bouncy chibi vertical hop & side waddle
        bodyRef.current.position.y = bounce * 0.055;
        bodyRef.current.rotation.z = stride * 0.055;
        bodyRef.current.rotation.x = 0.06; // Slight forward lean as in Picture 2

        // Hat & head gentle lag/nod
        headHatRef.current.rotation.x = 0.14 + Math.sin(wc * 2) * 0.035;
        headHatRef.current.rotation.z = -0.06 - stride * 0.04;

        // Top sprout lively springy whip
        sproutRef.current.rotation.z = Math.sin(wc * 2 - 0.5) * 0.18;
        sproutRef.current.rotation.x = Math.cos(wc - 0.3) * 0.12;

        //Feet alternating step cycle
        if (leftFootRef.current && rightFootRef.current) {
          leftFootRef.current.position.z = stride * 0.11;
          leftFootRef.current.position.y = Math.max(0, stride) * 0.065 + 0.035;
          leftFootRef.current.rotation.x = -stride * 0.35;

          rightFootRef.current.position.z = -stride * 0.11;
          rightFootRef.current.position.y = Math.max(0, -stride) * 0.065 + 0.035;
          rightFootRef.current.rotation.x = stride * 0.35;
        }

        // Billowy kimono sleeves swing
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = -stride * 0.28;
          rightArmRef.current.rotation.x = stride * 0.22;
        }

        // Katana scabbard gentle bounce
        if (swordRef.current) {
          swordRef.current.rotation.z = 0.32 + Math.sin(wc * 2) * 0.03;
        }
      } else {
        // Gentle breathing idle
        const breath = Math.sin(elapsed * 2.4);
        bodyRef.current.position.y = (breath + 1) * 0.012;
        bodyRef.current.rotation.z = Math.sin(elapsed * 1.2) * 0.015;
        bodyRef.current.rotation.x = 0.02;

        headHatRef.current.rotation.x = 0.12 + breath * 0.02;
        headHatRef.current.rotation.z = -0.05;

        sproutRef.current.rotation.z = Math.sin(elapsed * 2.8) * 0.08;

        if (leftFootRef.current && rightFootRef.current) {
          leftFootRef.current.position.set(-0.075, 0.035, 0.03);
          leftFootRef.current.rotation.x = 0;
          rightFootRef.current.position.set(0.075, 0.035, -0.03);
          rightFootRef.current.rotation.x = 0;
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = 0.08;
          rightArmRef.current.rotation.x = -0.05;
        }
      }
    }

    // Animate cute anime sweat droplets near the hat brim (like Picture 2!)
    if (sweatRef.current) {
      sweatRef.current.visible = isMoving;
      sweatRef.current.position.y = 0.56 + Math.sin(elapsed * 6) * 0.02;
    }

    // Animate footstep dust puffs when moving
    if (dustGroupRef.current) {
      dustGroupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (isMoving) {
          const phase = (elapsed * 3.5 + i * 0.33) % 1;
          mesh.visible = true;
          mesh.position.z = -0.12 - phase * 0.28;
          mesh.position.y = 0.04 + phase * 0.1;
          mesh.position.x = (i % 2 === 0 ? -1 : 1) * (0.05 + phase * 0.08);
          const s = Math.sin(phase * Math.PI) * 0.9;
          mesh.scale.setScalar(Math.max(0.01, s));
        } else {
          mesh.visible = false;
        }
      });
    }
  });

  // Palette matching Picture 2 (Chibi Wandering Samurai)
  const skinColor = '#f7ded2';
  const blushColor = '#eb9b94';
  const hairColor = '#3b2622';
  const kimonoColor = '#bcc4a5'; // Soft sage-olive green kimono top
  const kimonoTrim = '#8c9476';
  const hakamaColor = '#4a342e'; // Dark brown gathered hakama pants
  const obiColor = '#3d2924';
  const scabbardColor = '#3d2219';
  const brassColor = '#d8a54c';

  return (
    <group
      ref={rootRef}
      position={[-1.35, 0, 2.55]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover('Wandering Ronin — Click to Follow (or use WASD / Click Ground)');
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelectCharacter();
      }}
    >
      {/* Soft Ground Contact Shadow Oval (matching Picture 2's hand-drawn ground shadow) */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#4a372d" transparent opacity={0.28} />
      </mesh>

      {/* Footstep Dust Puffs */}
      <group ref={dustGroupRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} visible={false}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color="#f2ece1" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>

      {/* Tiny Bare Feet (alternating in walk cycle) */}
      <group ref={leftFootRef} position={[-0.075, 0.035, 0.03]}>
        <mesh scale={[0.85, 0.65, 1.35]} castShadow>
          <sphereGeometry args={[0.052, 12, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.65} />
        </mesh>
      </group>
      <group ref={rightFootRef} position={[0.075, 0.035, -0.03]}>
        <mesh scale={[0.85, 0.65, 1.35]} castShadow>
          <sphereGeometry args={[0.052, 12, 12]} />
          <meshStandardMaterial color={skinColor} roughness={0.65} />
        </mesh>
      </group>

      {/* Animated Upper Body Group */}
      <group ref={bodyRef}>
        {/* ===================================================== */}
        {/* 1. DARK BROWN GATHERED HAKAMA PANTS & OBI SASH        */}
        {/* ===================================================== */}
        <group position={[0, 0.22, 0]}>
          {/* Left & Right Puffy Hakama Leg Pleats */}
          <mesh position={[-0.072, -0.02, 0.01]} scale={[0.95, 1.18, 1.05]} castShadow receiveShadow>
            <sphereGeometry args={[0.115, 16, 16]} />
            <meshStandardMaterial color={hakamaColor} roughness={0.82} />
          </mesh>
          <mesh position={[0.072, -0.02, -0.01]} scale={[0.95, 1.18, 1.05]} castShadow receiveShadow>
            <sphereGeometry args={[0.115, 16, 16]} />
            <meshStandardMaterial color={hakamaColor} roughness={0.82} />
          </mesh>
          {/* Ankle Cuffs */}
          <mesh position={[-0.072, -0.14, 0.01]} castShadow>
            <cylinderGeometry args={[0.055, 0.048, 0.05, 12]} />
            <meshStandardMaterial color={obiColor} roughness={0.85} />
          </mesh>
          <mesh position={[0.072, -0.14, -0.01]} castShadow>
            <cylinderGeometry args={[0.055, 0.048, 0.05, 12]} />
            <meshStandardMaterial color={obiColor} roughness={0.85} />
          </mesh>

          {/* Waist Sash (Obi) & Hanging Front Tie Ribbons */}
          <mesh position={[0, 0.095, 0]} castShadow>
            <cylinderGeometry args={[0.148, 0.158, 0.065, 18]} />
            <meshStandardMaterial color={obiColor} roughness={0.8} />
          </mesh>
          {/* Obi Knot & Two Hanging Straps */}
          <mesh position={[-0.02, 0.08, 0.15]} rotation={[0.1, 0, 0.18]} castShadow>
            <boxGeometry args={[0.038, 0.14, 0.02]} />
            <meshStandardMaterial color={obiColor} roughness={0.8} />
          </mesh>
          <mesh position={[0.025, 0.08, 0.15]} rotation={[0.1, 0, -0.15]} castShadow>
            <boxGeometry args={[0.038, 0.13, 0.02]} />
            <meshStandardMaterial color={obiColor} roughness={0.8} />
          </mesh>
        </group>

        {/* ===================================================== */}
        {/* 2. SAGE-GREEN KIMONO / HAORI TOP & BILLOWY SLEEVES    */}
        {/* ===================================================== */}
        <group position={[0, 0.42, 0]}>
          {/* Main Kimono Torso */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.13, 0.165, 0.22, 18]} />
            <meshStandardMaterial color={kimonoColor} roughness={0.78} />
          </mesh>
          {/* Crossed Kimono Collar Trim (V-neck) */}
          <mesh position={[-0.03, 0.05, 0.135]} rotation={[0, 0, -0.42]}>
            <boxGeometry args={[0.035, 0.14, 0.02]} />
            <meshStandardMaterial color={kimonoTrim} roughness={0.8} />
          </mesh>
          <mesh position={[0.03, 0.05, 0.13]} rotation={[0, 0, 0.42]}>
            <boxGeometry args={[0.035, 0.14, 0.02]} />
            <meshStandardMaterial color={kimonoTrim} roughness={0.8} />
          </mesh>

          {/* Flared Haori Coattail at Back/Right (matching the draped hem in Picture 2) */}
          <mesh
            position={[0.04, -0.11, -0.09]}
            rotation={[0.38, 0.2, -0.25]}
            castShadow
          >
            <coneGeometry args={[0.15, 0.22, 12, 1, true]} />
            <meshStandardMaterial
              color={kimonoColor}
              roughness={0.78}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Left Billowy Kimono Sleeve + Cute Tiny Hand */}
          <group ref={leftArmRef} position={[-0.14, 0.06, 0]}>
            <mesh
              position={[-0.06, -0.09, 0.02]}
              rotation={[0.15, 0, -0.38]}
              scale={[0.85, 1.15, 1.1]}
              castShadow
            >
              <coneGeometry args={[0.11, 0.22, 14]} />
              <meshStandardMaterial color={kimonoColor} roughness={0.78} />
            </mesh>
            {/* Tiny Left Hand Holding Sword */}
            <mesh position={[-0.08, -0.19, 0.05]} castShadow>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.65} />
            </mesh>
          </group>

          {/* Right Billowy Kimono Sleeve + Cute Tiny Hand */}
          <group ref={rightArmRef} position={[0.14, 0.06, 0]}>
            <mesh
              position={[0.06, -0.09, 0.01]}
              rotation={[0.1, 0, 0.38]}
              scale={[0.85, 1.15, 1.1]}
              castShadow
            >
              <coneGeometry args={[0.11, 0.22, 14]} />
              <meshStandardMaterial color={kimonoColor} roughness={0.78} />
            </mesh>
            {/* Tiny Right Hand */}
            <mesh position={[0.08, -0.19, 0.03]} castShadow>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshStandardMaterial color={skinColor} roughness={0.65} />
            </mesh>
          </group>
        </group>

        {/* ===================================================== */}
        {/* 3. DIAGONAL SHEATHED KATANA SWORD (as in Picture 2)   */}
        {/* ===================================================== */}
        <group
          ref={swordRef}
          position={[0.02, 0.33, -0.06]}
          rotation={[0.12, 0.28, 0.32]}
        >
          {/* Main Lacquered Dark-Brown Scabbard & Hilt Shaft */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.026, 0.022, 1.08, 12]} />
            <meshStandardMaterial color={scabbardColor} roughness={0.55} />
          </mesh>

          {/* Front Hilt Brass Pommel Cap (Kashira) */}
          <mesh position={[-0.54, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.028, 0.028, 0.04, 12]} />
            <meshStandardMaterial color={brassColor} metalness={0.65} roughness={0.35} />
          </mesh>

          {/* Brass Studs Along Hilt & Scabbard (matching the dots in Picture 2) */}
          {[-0.44, -0.35, 0.22, 0.28].map((sx, idx) => (
            <mesh key={idx} position={[sx, 0, 0.024]}>
              <sphereGeometry args={[0.009, 8, 8]} />
              <meshStandardMaterial color={brassColor} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}

          {/* Reddish-Brown Tapered Scabbard Tip (Kojiri) Extending Behind Back */}
          <mesh position={[0.58, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <coneGeometry args={[0.022, 0.11, 10]} />
            <meshStandardMaterial color="#873623" roughness={0.5} />
          </mesh>
        </group>

        {/* ===================================================== */}
        {/* 4. CHUBBY CHEEKS, DARK HAIR, STRAW HAT & TOP SPROUT   */}
        {/* ===================================================== */}
        <group ref={headHatRef} position={[0, 0.62, 0.02]}>
          {/* Chubby Chibi Head & Prominent Lower Cheeks */}
          <mesh position={[0, -0.02, 0.02]} scale={[1.08, 0.92, 1.05]} castShadow>
            <sphereGeometry args={[0.175, 20, 20]} />
            <meshStandardMaterial color={skinColor} roughness={0.68} />
          </mesh>
          {/* Extra Chubby Front Cheek Pouch (matching the adorable side-profile cheek in Picture 2) */}
          <mesh position={[-0.07, -0.06, 0.11]} scale={[1.15, 0.85, 1.1]} castShadow>
            <sphereGeometry args={[0.095, 16, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.68} />
          </mesh>
          <mesh position={[0.07, -0.06, 0.11]} scale={[1.15, 0.85, 1.1]} castShadow>
            <sphereGeometry args={[0.095, 16, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.68} />
          </mesh>

          {/* Soft Rosy Pink Cheek Blush Ovals */}
          <mesh position={[-0.11, -0.065, 0.165]} rotation={[0.1, -0.35, 0]}>
            <circleGeometry args={[0.042, 16]} />
            <meshBasicMaterial color={blushColor} transparent opacity={0.65} />
          </mesh>
          <mesh position={[0.11, -0.065, 0.165]} rotation={[0.1, 0.35, 0]}>
            <circleGeometry args={[0.042, 16]} />
            <meshBasicMaterial color={blushColor} transparent opacity={0.65} />
          </mesh>

          {/* Flowing Dark Espresso-Brown Shoulder-Length Hair Under Hat */}
          <group position={[0, -0.03, -0.03]}>
            {/* Back Hair Bell Volume */}
            <mesh position={[0, -0.04, -0.04]} scale={[1.08, 1.0, 1.05]} castShadow>
              <cylinderGeometry args={[0.15, 0.21, 0.24, 18]} />
              <meshStandardMaterial color={hairColor} roughness={0.78} />
            </mesh>
            {/* Sculpted Curved Hair Locks Flaring Out at Sides & Back */}
            {[
              [-0.15, -0.08, -0.02, 0, 0, -0.32],
              [0.15, -0.08, -0.02, 0, 0, 0.32],
              [-0.11, -0.09, -0.12, -0.25, 0, -0.2],
              [0.11, -0.09, -0.12, -0.25, 0, 0.2],
              [0, -0.1, -0.15, -0.3, 0, 0],
            ].map(([hx, hy, hz, rx, ry, rz], idx) => (
              <mesh
                key={idx}
                position={[hx, hy, hz]}
                rotation={[rx, ry, rz]}
                castShadow
              >
                <capsuleGeometry args={[0.042, 0.12, 8, 10]} />
                <meshStandardMaterial color={hairColor} roughness={0.75} />
              </mesh>
            ))}
          </group>

          {/* Wide Conical Woven Bamboo/Straw Hat (Kasa) Tilted Over Eyes */}
          <group position={[0, 0.01, 0.02]} rotation={[0.12, 0, -0.05]}>
            <mesh geometry={hatGeo} castShadow receiveShadow>
              <meshStandardMaterial
                map={strawHatTex}
                roughness={0.82}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Dark Straw Rim Binding Torus */}
            <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.558, 0.012, 8, 36]} />
              <meshStandardMaterial color="#5c3e29" roughness={0.85} />
            </mesh>

            {/* Top Woven Ring Cap + Signature Green Leaf Sprout! */}
            <group ref={sproutRef} position={[0, 0.285, 0]}>
              {/* Woven Crown Knot at Hat Apex */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.045, 0.014, 8, 16]} />
                <meshStandardMaterial color="#6e482f" roughness={0.85} />
              </mesh>
              {/* Curved Green Sprout Stem */}
              <mesh geometry={sproutLeafGeo} castShadow>
                <meshStandardMaterial color="#88b858" roughness={0.55} />
              </mesh>
              {/* Broad Flattened Leaf Blade on the Sprout */}
              <mesh
                position={[0.13, 0.12, 0.015]}
                rotation={[0.1, 0.1, -0.38]}
                scale={[1.8, 0.35, 0.7]}
                castShadow
              >
                <sphereGeometry args={[0.048, 12, 10]} />
                <meshStandardMaterial color="#98c967" roughness={0.5} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Cute Floating Anime Sweat Droplets (just like Picture 2!) */}
        <group ref={sweatRef} position={[-0.36, 0.56, 0.22]}>
          <mesh position={[0, 0.05, 0]} rotation={[0, 0, 0.35]}>
            <coneGeometry args={[0.016, 0.045, 8]} />
            <meshBasicMaterial color="#d8f0f8" transparent opacity={0.85} />
          </mesh>
          <mesh position={[-0.04, -0.02, 0.02]} rotation={[0, 0, 0.45]}>
            <coneGeometry args={[0.014, 0.04, 8]} />
            <meshBasicMaterial color="#d8f0f8" transparent opacity={0.75} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
