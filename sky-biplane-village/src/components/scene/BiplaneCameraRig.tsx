import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraMode } from '../../domain/skyConfig';

interface BiplaneCameraRigProps {
  cameraMode: CameraMode;
  planePosRef: React.MutableRefObject<THREE.Vector3>;
  planeYawRef: React.MutableRefObject<number>;
  planePitchRef: React.MutableRefObject<number>;
  planeRollRef: React.MutableRefObject<number>;
  planeSpeedRef: React.MutableRefObject<number>;
  cameraYawOffsetRef: React.MutableRefObject<number>;
  cameraPitchOffsetRef: React.MutableRefObject<number>;
  onCycleCameraMode: () => void;
}

const _desiredCam = new THREE.Vector3();
const _desiredLook = new THREE.Vector3();

export default function BiplaneCameraRig({
  cameraMode,
  planePosRef,
  planeYawRef,
  planePitchRef,
  planeRollRef,
  planeSpeedRef,
  cameraYawOffsetRef,
  cameraPitchOffsetRef,
  onCycleCameraMode,
}: BiplaneCameraRigProps) {
  const { gl } = useThree();

  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const zoomMultiplierRef = useRef<number>(1.0);

  const smoothCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(12.5, 31.5, 28.5));
  const smoothLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0.0, 10.5, 14.5));

  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDraggingRef.current = true;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      cameraYawOffsetRef.current -= dx * 0.0055;
      cameraPitchOffsetRef.current = THREE.MathUtils.clamp(
        cameraPitchOffsetRef.current + dy * 0.0045,
        -0.55,
        0.65
      );
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      zoomMultiplierRef.current = THREE.MathUtils.clamp(
        zoomMultiplierRef.current + e.deltaY * 0.0008,
        0.45,
        2.15
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'v') {
        onCycleCameraMode();
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [gl, cameraYawOffsetRef, cameraPitchOffsetRef, onCycleCameraMode]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.06);
    const t = state.clock.getElapsedTime();
    const pos = planePosRef.current;
    const yaw = planeYawRef.current;
    const pitch = planePitchRef.current;
    const roll = planeRollRef.current;
    const speed = planeSpeedRef.current;
    const yawOff = cameraYawOffsetRef.current;
    const pitchOff = cameraPitchOffsetRef.current;
    const zoom = zoomMultiplierRef.current;

    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    if (cameraMode === 'anime-cinema') {
      // =====================================================================
      // 1. ANIME FULL VIEW (Cinema Panorama — Wide Ghibli/Shinkai Vista)
      // Frames the fast biplane + wingtip ribbons + full 3x village, river & sky!
      // =====================================================================
      const sway = Math.sin(t * 0.38) * 0.14;
      const camAngle = yaw + yawOff + 0.32 + sway;
      const cFwdX = Math.sin(camAngle);
      const cFwdZ = Math.cos(camAngle);
      const dist = 11.2 * zoom;
      const height = (5.4 + pitchOff * 6.0) * zoom;

      _desiredCam.set(
        pos.x - cFwdX * dist + rightX * 1.8,
        pos.y + height,
        pos.z - cFwdZ * dist + rightZ * 1.8
      );
      _desiredLook.set(
        pos.x + fwdX * 12.5 - rightX * 1.2,
        pos.y - 3.6,
        pos.z + fwdZ * 12.5 - rightZ * 1.2
      );

      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 9.5));
      smoothLookAtRef.current.lerp(_desiredLook, Math.min(1, dt * 11.0));
    } else if (cameraMode === 'illustration') {
      // =====================================================================
      // 2. SKY ILLUSTRATION VIEW — High-angled hand-drawn illustration view
      // =====================================================================
      const baseAngle = -0.68 + yawOff;
      const dist = 15.0 * zoom;
      const height = (14.5 + pitchOff * 8.0) * zoom;

      _desiredCam.set(
        pos.x - Math.sin(baseAngle) * dist,
        pos.y + height,
        pos.z + Math.cos(baseAngle) * dist
      );
      _desiredLook.set(
        pos.x - 1.8 + fwdX * 1.8,
        pos.y - 6.8,
        pos.z + 1.2 + fwdZ * 1.8
      );

      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 8.5));
      smoothLookAtRef.current.lerp(_desiredLook, Math.min(1, dt * 10.0));
    } else if (cameraMode === 'overlook') {
      // =====================================================================
      // 3. 3X VALLEY OVERLOOK — High bird's-eye panorama over the 3x village
      // =====================================================================
      const angle = yawOff;
      const dist = 24.0 * zoom;
      const height = (36.0 + pitchOff * 14.0) * zoom;

      _desiredCam.set(
        pos.x + Math.sin(angle) * dist,
        pos.y + height,
        pos.z + Math.cos(angle) * dist
      );
      _desiredLook.set(pos.x, 2.0, pos.z);

      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 7.5));
      smoothLookAtRef.current.lerp(_desiredLook, Math.min(1, dt * 9.0));
    } else if (cameraMode === 'chase') {
      // =====================================================================
      // 4. HIGH-SPEED WING CHASE — Swooping flight camera behind upper wing
      // =====================================================================
      const chaseYaw = yaw + yawOff;
      const cFwdX = Math.sin(chaseYaw);
      const cFwdZ = Math.cos(chaseYaw);
      const dist = 6.8 * zoom;
      const height = (2.75 + pitchOff * 3.2) * zoom;

      _desiredCam.set(
        pos.x - cFwdX * dist,
        pos.y + height,
        pos.z - cFwdZ * dist
      );
      _desiredLook.set(
        pos.x + fwdX * 8.5,
        pos.y - 2.2,
        pos.z + fwdZ * 8.5
      );

      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 13.0));
      smoothLookAtRef.current.lerp(_desiredLook, Math.min(1, dt * 15.0));
    } else if (cameraMode === 'wingtip') {
      // =====================================================================
      // 5. WINGTIP CINEMA — Dramatic side view across struts & pilot scarf
      // =====================================================================
      const dist = 5.6 * zoom;
      _desiredCam.set(
        pos.x + rightX * dist - fwdX * 1.6,
        pos.y + 1.85 + pitchOff * 2.5,
        pos.z + rightZ * dist - fwdZ * 1.6
      );
      _desiredLook.set(
        pos.x - rightX * 2.0 + fwdX * 2.8,
        pos.y - 2.6,
        pos.z - rightZ * 2.0 + fwdZ * 2.8
      );

      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 11.0));
      smoothLookAtRef.current.lerp(_desiredLook, Math.min(1, dt * 13.0));
    } else {
      // =====================================================================
      // 6. COCKPIT POV — First-person aviator view from behind windscreen
      // =====================================================================
      _desiredCam.set(
        pos.x - fwdX * 0.18,
        pos.y + 0.62,
        pos.z - fwdZ * 0.18
      );
      _desiredLook.set(
        pos.x + fwdX * 14.0,
        pos.y - 3.4 + Math.sin(pitch - pitchOff) * 8.0,
        pos.z + fwdZ * 14.0
      );

      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 22.0));
      smoothLookAtRef.current.lerp(_desiredLook, Math.min(1, dt * 24.0));
    }

    state.camera.position.copy(smoothCamPosRef.current);
    state.camera.lookAt(smoothLookAtRef.current);

    if (cameraMode === 'anime-cinema' || cameraMode === 'chase' || cameraMode === 'cockpit') {
      const bankFactor = cameraMode === 'anime-cinema' ? 0.22 : 0.35;
      state.camera.rotation.z += roll * bankFactor;
    }

    // Dynamic Anime Speed-FOV Zoom
    if ('fov' in state.camera) {
      const persp = state.camera as THREE.PerspectiveCamera;
      const baseFov =
        cameraMode === 'anime-cinema'
          ? 54
          : cameraMode === 'overlook'
            ? 52
            : cameraMode === 'chase'
              ? 52
              : 46;
      const speedFovBoost = THREE.MathUtils.clamp((speed - 18.0) * 0.28, 0, 9.0);
      const targetFov = baseFov + speedFovBoost;
      if (Math.abs(persp.fov - targetFov) > 0.05) {
        persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov, Math.min(1, dt * 6.0));
        persp.updateProjectionMatrix();
      }
    }
  });

  return null;
}
