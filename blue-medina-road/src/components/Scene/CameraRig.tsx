import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import gsap from 'gsap';
import * as THREE from 'three';
import { CAMERA_MODES, type CameraMode } from '../../hooks/useSceneState';

interface CameraRigProps {
  cameraMode: CameraMode;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
}

export default function CameraRig({ cameraMode, characterPosRef }: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const prevCharPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.1, 1.4));
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    if (cameraMode === 'follow') {
      const charPos = characterPosRef.current;
      prevCharPosRef.current.copy(charPos);
      isTransitioningRef.current = true;

      gsap.to(camera.position, {
        x: charPos.x,
        y: charPos.y + 0.92,
        z: charPos.z + 4.65,
        duration: 1.15,
        ease: 'power3.out',
        onComplete: () => {
          isTransitioningRef.current = false;
        },
      });

      gsap.to(controls.target, {
        x: charPos.x,
        y: charPos.y + 0.48,
        z: charPos.z - 1.4,
        duration: 1.15,
        ease: 'power3.out',
      });
    } else {
      const preset = CAMERA_MODES[cameraMode];
      isTransitioningRef.current = true;

      gsap.to(camera.position, {
        x: preset.position[0],
        y: preset.position[1],
        z: preset.position[2],
        duration: 1.35,
        ease: 'power3.inOut',
        onComplete: () => {
          isTransitioningRef.current = false;
        },
      });

      gsap.to(controls.target, {
        x: preset.target[0],
        y: preset.target[1],
        z: preset.target[2],
        duration: 1.35,
        ease: 'power3.inOut',
      });
    }
  }, [cameraMode, camera, characterPosRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (cameraMode === 'follow' && !isTransitioningRef.current) {
      const charPos = characterPosRef.current;
      const moveDelta = new THREE.Vector3().subVectors(charPos, prevCharPosRef.current);

      // Translate camera along with the flying character while preserving user's orbit angle
      camera.position.add(moveDelta);

      const desiredTarget = new THREE.Vector3(
        charPos.x,
        charPos.y + 0.45,
        charPos.z - 0.85
      );
      controls.target.lerp(desiredTarget, Math.min(1, delta * 8.5));
      prevCharPosRef.current.copy(charPos);
    } else {
      prevCharPosRef.current.copy(characterPosRef.current);
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={1.8}
      maxDistance={42}
      maxPolarAngle={Math.PI / 2 + 0.08}
      minPolarAngle={0.12}
      target={[0, 1.55, -1.2]}
    />
  );
}
