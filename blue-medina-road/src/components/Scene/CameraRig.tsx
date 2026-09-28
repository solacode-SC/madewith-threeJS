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
  onCycleCameraMode?: () => void;
}

// Pre-allocated scratch vectors for zero per-frame GC allocations
const _moveDelta = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();

export default function CameraRig({
  cameraMode,
  characterPosRef,
  onCycleCameraMode,
}: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const prevCharPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.1, 1.4));
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    if (!onCycleCameraMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'v') {
        onCycleCameraMode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCycleCameraMode]);

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
        y: charPos.y + 0.72,
        z: charPos.z + 3.45,
        duration: 0.95,
        ease: 'power3.out',
        onComplete: () => {
          isTransitioningRef.current = false;
        },
      });

      gsap.to(controls.target, {
        x: charPos.x,
        y: charPos.y + 0.45,
        z: charPos.z - 0.85,
        duration: 0.95,
        ease: 'power3.out',
      });
    } else if (cameraMode === 'vista') {
      const charPos = characterPosRef.current;
      prevCharPosRef.current.copy(charPos);
      isTransitioningRef.current = true;

      gsap.to(camera.position, {
        x: charPos.x + 0.16,
        y: charPos.y + 0.58,
        z: charPos.z + 2.85,
        duration: 0.95,
        ease: 'power3.out',
        onComplete: () => {
          isTransitioningRef.current = false;
        },
      });

      gsap.to(controls.target, {
        x: charPos.x - 0.04,
        y: charPos.y + 0.52,
        z: charPos.z - 2.4,
        duration: 0.95,
        ease: 'power3.out',
      });
    } else {
      const preset = CAMERA_MODES[cameraMode];
      isTransitioningRef.current = true;

      gsap.to(camera.position, {
        x: preset.position[0],
        y: preset.position[1],
        z: preset.position[2],
        duration: 1.15,
        ease: 'power3.inOut',
        onComplete: () => {
          isTransitioningRef.current = false;
        },
      });

      gsap.to(controls.target, {
        x: preset.target[0],
        y: preset.target[1],
        z: preset.target[2],
        duration: 1.15,
        ease: 'power3.inOut',
      });
    }
  }, [cameraMode, camera, characterPosRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const dt = Math.min(delta, 0.05);

    if ((cameraMode === 'follow' || cameraMode === 'vista') && !isTransitioningRef.current) {
      const charPos = characterPosRef.current;
      _moveDelta.subVectors(charPos, prevCharPosRef.current);

      // Translate camera along with the flying character while preserving user's orbit angle
      camera.position.add(_moveDelta);

      _desiredTarget.set(
        charPos.x,
        charPos.y + 0.46,
        charPos.z - 0.65
      );
      controls.target.lerp(_desiredTarget, Math.min(1, dt * 15.0));
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
      dampingFactor={0.07}
      minDistance={1.4}
      maxDistance={42}
      maxPolarAngle={Math.PI / 2 + 0.08}
      minPolarAngle={0.12}
      target={[0, 1.5, -0.6]}
    />
  );
}
