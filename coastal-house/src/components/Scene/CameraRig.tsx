import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import gsap from 'gsap';
import * as THREE from 'three';
import { CAMERA_PRESETS, type CameraPreset } from '../../hooks/useSceneState';

interface CameraRigProps {
  activePreset: CameraPreset;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
}

export default function CameraRig({ activePreset, characterPosRef }: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const prevCharPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-1.35, 0, 2.55));
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    if (activePreset === 'follow') {
      const charPos = characterPosRef.current;
      prevCharPosRef.current.copy(charPos);
      isTransitioningRef.current = true;

      gsap.to(camera.position, {
        x: charPos.x + 1.8,
        y: 2.3,
        z: charPos.z + 3.6,
        duration: 1.2,
        ease: 'power3.out',
        onComplete: () => {
          isTransitioningRef.current = false;
        },
      });

      gsap.to(controls.target, {
        x: charPos.x,
        y: 0.65,
        z: charPos.z,
        duration: 1.2,
        ease: 'power3.out',
      });
    } else {
      const preset = CAMERA_PRESETS[activePreset];
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
  }, [activePreset, camera, characterPosRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (activePreset === 'follow' && !isTransitioningRef.current) {
      const charPos = characterPosRef.current;
      const targetPos = new THREE.Vector3(charPos.x, 0.65, charPos.z);

      // Move camera by the same delta as character so user's orbit angle is preserved
      const moveDelta = new THREE.Vector3().subVectors(charPos, prevCharPosRef.current);
      camera.position.add(moveDelta);
      controls.target.lerp(targetPos, Math.min(1, delta * 8));
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
      minDistance={2.2}
      maxDistance={18}
      maxPolarAngle={Math.PI / 2 - 0.03}
      minPolarAngle={0.15}
      target={[0, 2.15, 0]}
    />
  );
}
