import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraMode, VirtualWalkInput } from '../../domain/cityConfig';
import { clampCameraToRoad } from '../../domain/cityLayout';

interface CityCameraRigProps {
  cameraMode: CameraMode;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterYawRef: React.MutableRefObject<number>;
  characterSpeedRef: React.MutableRefObject<number>;
  cameraYawRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
  jumpHeightRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualWalkInput>;
  onCycleCameraMode: () => void;
}

const _anchor = new THREE.Vector3();
const _desiredCam = new THREE.Vector3();
const _safeCam = new THREE.Vector3();
const _lookAt = new THREE.Vector3();

export default function CityCameraRig({
  cameraMode,
  characterPosRef,
  characterYawRef,
  characterSpeedRef,
  cameraYawRef,
  cameraPitchRef,
  jumpHeightRef,
  virtualInputRef,
  onCycleCameraMode,
}: CityCameraRigProps) {
  const { gl } = useThree();

  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const roadZoomDistRef = useRef<number>(3.35);
  const skyAltitudeRef = useRef<number>(28.0);
  const smoothCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-0.38, 1.45, 13.6));
  const smoothLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 2.35, 6.0));
  const headBobRef = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({});

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

      const sens = 0.005;
      cameraYawRef.current -= dx * sens;
      cameraPitchRef.current = THREE.MathUtils.clamp(
        cameraPitchRef.current - dy * sens * 0.85,
        -0.65,
        0.65
      );
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (cameraMode === 'from-up') {
        skyAltitudeRef.current = THREE.MathUtils.clamp(
          skyAltitudeRef.current + e.deltaY * 0.022,
          12.0,
          54.0
        );
      } else {
        roadZoomDistRef.current = THREE.MathUtils.clamp(
          roadZoomDistRef.current + e.deltaY * 0.0022,
          1.45,
          5.2
        );
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k === 'v') {
        onCycleCameraMode();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gl, cameraMode, cameraYawRef, cameraPitchRef, onCycleCameraMode]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.065);
    const elapsed = state.clock.getElapsedTime();
    const charPos = characterPosRef.current;
    const speed = characterSpeedRef.current;
    const jumpY = jumpHeightRef.current;
    const keys = keysRef.current;
    const vInput = virtualInputRef.current;

    // Q / E keyboard camera rotation
    const turnL = keys['q'] || vInput.turnLeft;
    const turnR = keys['e'] || vInput.turnRight;
    if (turnL) cameraYawRef.current += 2.2 * dt;
    if (turnR) cameraYawRef.current -= 2.2 * dt;

    const yaw = cameraYawRef.current;
    const pitch = cameraPitchRef.current;
    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);

    if (cameraMode === 'from-up') {
      // =====================================================================
      // 1. "FROM UP" SKY BIRD'S-EYE CAMERA — See the entire big city from above!
      // =====================================================================
      const alt = skyAltitudeRef.current;
      const horizontalDist = alt * 0.68;
      _desiredCam.set(
        charPos.x - fwdX * horizontalDist,
        alt,
        charPos.z - fwdZ * horizontalDist
      );
      _lookAt.set(
        charPos.x + fwdX * 2.5,
        0.8,
        charPos.z + fwdZ * 2.5
      );
      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 9.5));
      smoothLookAtRef.current.lerp(_lookAt, Math.min(1, dt * 11.0));
    } else if (cameraMode === 'painting') {
      // =====================================================================
      // 2. REFERENCE PAINTING VISTA — Frames the exact watercolor illustration!
      // =====================================================================
      _anchor.set(charPos.x, 1.25, charPos.z);
      _desiredCam.set(
        charPos.x - 0.28 + Math.sin(elapsed * 0.45) * 0.08,
        1.62,
        charPos.z + 3.45
      );
      clampCameraToRoad(_anchor, _desiredCam, 0.32, _safeCam);
      _lookAt.set(charPos.x + 0.15, 2.55, charPos.z - 6.8);

      smoothCamPosRef.current.lerp(_safeCam, Math.min(1, dt * 10.5));
      smoothLookAtRef.current.lerp(_lookAt, Math.min(1, dt * 12.0));
    } else if (cameraMode === 'clouds') {
      // =====================================================================
      // 3. CLOUD ORBIT — Sweeping aerial flight through the brush clouds!
      // =====================================================================
      const orbitAngle = yaw + elapsed * 0.18;
      const radius = 19.5 + Math.sin(elapsed * 0.35) * 3.5;
      _desiredCam.set(
        charPos.x - Math.sin(orbitAngle) * radius,
        13.5 + Math.cos(elapsed * 0.4) * 2.4,
        charPos.z - Math.cos(orbitAngle) * radius
      );
      _lookAt.set(charPos.x, 2.2, charPos.z);

      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 8.0));
      smoothLookAtRef.current.lerp(_lookAt, Math.min(1, dt * 10.0));
    } else if (cameraMode === 'pov') {
      // =====================================================================
      // 4. FIRST-PERSON ROAD WALK POV
      // =====================================================================
      if (speed > 0.08) {
        headBobRef.current += dt * (7.2 + speed * 1.3);
      }
      const bobY = speed > 0.08 ? Math.sin(headBobRef.current * 2) * 0.024 : 0;
      _desiredCam.set(
        charPos.x + fwdX * 0.12,
        1.02 + jumpY + bobY,
        charPos.z + fwdZ * 0.12
      );
      _lookAt.set(
        _desiredCam.x + fwdX * 5.0,
        _desiredCam.y + Math.sin(pitch) * 3.2,
        _desiredCam.z + fwdZ * 5.0
      );
      smoothCamPosRef.current.lerp(_desiredCam, Math.min(1, dt * 22.0));
      smoothLookAtRef.current.lerp(_lookAt, Math.min(1, dt * 24.0));
    } else {
      // =====================================================================
      // 5. ROAD VIEW (Default) — Smooth 3rd-person road discovery camera
      // =====================================================================
      _anchor.set(charPos.x, 1.15 + jumpY * 0.5, charPos.z);
      const dist = roadZoomDistRef.current + Math.min(0.35, speed * 0.045);
      const camH = THREE.MathUtils.clamp(
        1.62 - Math.sin(pitch) * 1.35 + jumpY * 0.35,
        0.65,
        5.2
      );

      _desiredCam.set(
        charPos.x - fwdX * dist,
        camH,
        charPos.z - fwdZ * dist
      );
      clampCameraToRoad(_anchor, _desiredCam, 0.32, _safeCam);

      _lookAt.set(
        charPos.x + fwdX * 4.2,
        2.1 + jumpY * 0.4 + Math.sin(pitch) * 1.35,
        charPos.z + fwdZ * 4.2
      );

      smoothCamPosRef.current.lerp(_safeCam, Math.min(1, dt * 16.0));
      smoothLookAtRef.current.lerp(_lookAt, Math.min(1, dt * 18.0));
    }

    state.camera.position.copy(smoothCamPosRef.current);
    state.camera.lookAt(smoothLookAtRef.current);

    // Subtle banking roll when turning along roads
    const yawDiff = characterYawRef.current - yaw;
    const bank =
      cameraMode === 'road'
        ? THREE.MathUtils.clamp(-Math.sin(yawDiff) * 0.025 * Math.min(1, speed / 4), -0.03, 0.03)
        : 0;
    state.camera.rotation.z += bank;
  });

  return null;
}
