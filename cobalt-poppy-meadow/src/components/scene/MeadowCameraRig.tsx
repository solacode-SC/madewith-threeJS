import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_PRESETS, type CameraPreset } from '../../domain/meadowConfig';
import { getMeadowHeight } from '../../domain/meadowLayout';

interface MeadowCameraRigProps {
  cameraPreset: CameraPreset;
  onPresetChange?: (preset: CameraPreset) => void;
}

export default function MeadowCameraRig({ cameraPreset }: MeadowCameraRigProps) {
  const { camera, gl } = useThree();

  const currentPos = useRef(new THREE.Vector3(...CAMERA_PRESETS[cameraPreset].position));
  const currentTarget = useRef(new THREE.Vector3(...CAMERA_PRESETS[cameraPreset].target));

  // User input interaction state
  const isDragging = useRef(false);
  const lastMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitYaw = useRef(0);
  const orbitPitch = useRef(0);
  const strollOffset = useRef(new THREE.Vector3(0, 0, 0));
  const keys = useRef<Record<string, boolean>>({});

  // When preset changes, smoothly reset yaw/pitch/stroll
  useEffect(() => {
    orbitYaw.current = 0;
    orbitPitch.current = 0;
    strollOffset.current.set(0, 0, 0);
  }, [cameraPreset]);

  // Pointer & Keyboard listeners
  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const sens = 0.0035;
      orbitYaw.current -= dx * sens;
      orbitPitch.current = THREE.MathUtils.clamp(
        orbitPitch.current - dy * sens,
        -0.55,
        0.55
      );
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gl]);

  // Frame tick: smooth camera interpolation & ground collision clamping
  useFrame((state, delta) => {
    const targetPreset = CAMERA_PRESETS[cameraPreset];
    const targetPos = new THREE.Vector3(...targetPreset.position);
    const targetLook = new THREE.Vector3(...targetPreset.target);

    // 1. Cinematic Orbit mode: gentle revolving drift
    if (cameraPreset === 'cinematic-orbit') {
      const t = state.clock.elapsedTime * 0.12;
      const radius = 16.0;
      targetPos.x = Math.sin(t) * radius;
      targetPos.z = Math.cos(t) * (radius * 0.75) - 10;
      targetPos.y = 8.5 + Math.sin(t * 1.5) * 2.2;
    }

    // 2. Free walk along path stroll mode
    if (cameraPreset === 'path-stroll') {
      const speed = 4.2 * delta;
      const moveDir = new THREE.Vector3();
      if (keys.current['w'] || keys.current['arrowup']) moveDir.z -= 1;
      if (keys.current['s'] || keys.current['arrowdown']) moveDir.z += 1;
      if (keys.current['a'] || keys.current['arrowleft']) moveDir.x -= 1;
      if (keys.current['d'] || keys.current['arrowright']) moveDir.x += 1;

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize().multiplyScalar(speed);
        strollOffset.current.add(moveDir);
        // Clamp stroll within meadow bounds
        strollOffset.current.x = THREE.MathUtils.clamp(strollOffset.current.x, -15, 15);
        strollOffset.current.z = THREE.MathUtils.clamp(strollOffset.current.z, -35, 10);
      }

      targetPos.add(strollOffset.current);
      targetLook.add(strollOffset.current);
    }

    // 3. Apply orbit drag rotation
    if (orbitYaw.current !== 0 || orbitPitch.current !== 0) {
      const offset = new THREE.Vector3().subVectors(targetLook, targetPos);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitYaw.current);
      targetLook.copy(targetPos).add(offset);
      targetLook.y += orbitPitch.current * 4.0;
    }

    // 4. Ground collision safety clamping
    const terrainHeightAtCam = getMeadowHeight(targetPos.x, targetPos.z);
    targetPos.y = Math.max(terrainHeightAtCam + 1.1, targetPos.y);

    // 5. Smooth exponential lerp
    const lerpFactor = Math.min(1.0, delta * 3.8);
    currentPos.current.lerp(targetPos, lerpFactor);
    currentTarget.current.lerp(targetLook, lerpFactor);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetPreset.fov, lerpFactor);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
