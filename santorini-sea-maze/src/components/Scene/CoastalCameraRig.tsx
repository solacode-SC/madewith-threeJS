import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clampCameraToCorridor, WALL_HEIGHT } from '../../utils/mazeLayout';
import type { CameraMode, VirtualWalkInput } from '../../hooks/useMazeState';

interface CoastalCameraRigProps {
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

const _eyePos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _anchorTarget = new THREE.Vector3();
const _desiredCam = new THREE.Vector3();
const _safeCam = new THREE.Vector3();

export default function CoastalCameraRig({
  cameraMode,
  characterPosRef,
  characterYawRef,
  characterSpeedRef,
  cameraYawRef,
  cameraPitchRef,
  jumpHeightRef,
  virtualInputRef,
  onCycleCameraMode,
}: CoastalCameraRigProps) {
  const { gl } = useThree();

  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetYawVelRef = useRef<number>(0);
  const followDistanceRef = useRef<number>(2.38);
  const smoothCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-4.8, 1.48, 13.0));
  const smoothLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(-4.8, 0.96, 8.0));
  const smoothRollRef = useRef<number>(0);
  const headBobPhaseRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});

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

      const sensitivity = cameraMode === 'pov' ? 0.0046 : 0.0052;
      cameraYawRef.current -= dx * sensitivity;
      cameraPitchRef.current = THREE.MathUtils.clamp(
        cameraPitchRef.current - dy * sensitivity * 0.85,
        -0.52,
        0.58
      );
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (cameraMode === 'follow' || cameraMode === 'cinematic' || cameraMode === 'sea-breeze') {
        followDistanceRef.current = THREE.MathUtils.clamp(
          followDistanceRef.current + e.deltaY * 0.0018,
          1.15,
          3.45
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
    const charYaw = characterYawRef.current;
    const speed = characterSpeedRef.current;
    const jumpY = jumpHeightRef.current;
    const keys = keysRef.current;
    const vInput = virtualInputRef.current;

    // Keyboard / Virtual Look Turn (Q / E)
    const turnLeft = keys['q'] || vInput.turnLeft;
    const turnRight = keys['e'] || vInput.turnRight;
    const desiredTurnVel = (turnLeft ? 2.65 : 0) - (turnRight ? 2.65 : 0);
    targetYawVelRef.current = THREE.MathUtils.lerp(
      targetYawVelRef.current,
      desiredTurnVel,
      Math.min(1, dt * 16)
    );
    if (Math.abs(targetYawVelRef.current) > 0.001) {
      cameraYawRef.current += targetYawVelRef.current * dt;
    }

    const yaw = cameraYawRef.current;
    const pitch = cameraPitchRef.current;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    const rightX = -forwardZ;
    const rightZ = forwardX;

    let targetRoll = 0;

    if (cameraMode === 'pov') {
      // 1. First-Person Character POV
      if (speed > 0.08) {
        headBobPhaseRef.current += dt * (7.4 + speed * 1.35);
      }
      const bobY =
        speed > 0.08 ? Math.sin(headBobPhaseRef.current * 2) * 0.025 * Math.min(1, speed / 4.2) : 0;
      const bobSide =
        speed > 0.08 ? Math.cos(headBobPhaseRef.current) * 0.015 * Math.min(1, speed / 4.2) : 0;

      _eyePos.set(
        charPos.x + forwardX * 0.09 + rightX * bobSide,
        0.94 + jumpY + bobY,
        charPos.z + forwardZ * 0.09 + rightZ * bobSide
      );

      _lookTarget.set(
        _eyePos.x + forwardX * 4.2,
        _eyePos.y + Math.sin(pitch) * 3.4,
        _eyePos.z + forwardZ * 4.2
      );

      smoothCamPosRef.current.lerp(_eyePos, Math.min(1, dt * 24));
      smoothLookAtRef.current.lerp(_lookTarget, Math.min(1, dt * 26));
    } else if (cameraMode === 'painting') {
      // 2. Reference Postcard Angle — Heroic low-angle framing up the turquoise steps toward the Blue Dome!
      _anchorTarget.set(charPos.x, 1.02 + jumpY * 0.5, charPos.z - 0.35);
      _desiredCam.set(
        charPos.x + 0.16 + Math.sin(elapsed * 0.6) * 0.08,
        1.28,
        charPos.z + 2.75
      );
      clampCameraToCorridor(_anchorTarget, _desiredCam, 0.28, _safeCam, false);

      _lookTarget.set(charPos.x - 0.05, 1.62 + jumpY * 0.3, charPos.z - 4.8);

      smoothCamPosRef.current.lerp(_safeCam, Math.min(1, dt * 11.0));
      smoothLookAtRef.current.lerp(_lookTarget, Math.min(1, dt * 12.5));
    } else if (cameraMode === 'cinematic') {
      // 3. Vibe Director Angle — Sweeping over-the-shoulder & low-angle hero tracking
      const cineSweep = Math.sin(elapsed * 0.48) * 0.52;
      const cineYaw = yaw + cineSweep;
      const cFwdX = Math.sin(cineYaw);
      const cFwdZ = Math.cos(cineYaw);
      const cRightX = -cFwdZ;
      const cRightZ = cFwdX;

      _anchorTarget.set(charPos.x, 0.96 + jumpY * 0.6, charPos.z);
      const dist = 2.05 + Math.cos(elapsed * 0.42) * 0.35;
      const height = 1.12 + Math.sin(elapsed * 0.55) * 0.34;

      _desiredCam.set(
        charPos.x - cFwdX * dist + cRightX * 0.38,
        height,
        charPos.z - cFwdZ * dist + cRightZ * 0.38
      );
      clampCameraToCorridor(_anchorTarget, _desiredCam, 0.28, _safeCam, false);

      _lookTarget.set(
        charPos.x + cFwdX * 1.45,
        1.18 + jumpY * 0.4 + Math.sin(elapsed * 0.5) * 0.14,
        charPos.z + cFwdZ * 1.45
      );

      targetRoll = Math.sin(elapsed * 0.48) * 0.032;
      smoothCamPosRef.current.lerp(_safeCam, Math.min(1, dt * 10.5));
      smoothLookAtRef.current.lerp(_lookTarget, Math.min(1, dt * 12.0));
    } else if (cameraMode === 'sea-breeze') {
      // 4. Coastal Sea & Rooftop Panorama Angle — High vista above the whitewashed domes & Aegean Sea
      _anchorTarget.set(charPos.x, 1.2 + jumpY * 0.5, charPos.z);
      const seaOrbitYaw = yaw + Math.sin(elapsed * 0.32) * 0.28;
      const sFwdX = Math.sin(seaOrbitYaw);
      const sFwdZ = Math.cos(seaOrbitYaw);

      _desiredCam.set(
        charPos.x - sFwdX * 4.8 - 0.8,
        WALL_HEIGHT + 1.85 + Math.sin(elapsed * 0.6) * 0.22,
        charPos.z - sFwdZ * 4.8 + 0.6
      );
      clampCameraToCorridor(_anchorTarget, _desiredCam, 0.3, _safeCam, true);

      _lookTarget.set(
        charPos.x + sFwdX * 1.6,
        0.95 + jumpY * 0.4,
        charPos.z + sFwdZ * 1.6
      );

      smoothCamPosRef.current.lerp(_safeCam, Math.min(1, dt * 10.0));
      smoothLookAtRef.current.lerp(_lookTarget, Math.min(1, dt * 12.0));
    } else {
      // 5. Dynamic 3rd-Person Follow Cam with Wall-Aware Spring Arm & Turn Banking
      _anchorTarget.set(charPos.x, 1.02 + jumpY * 0.6, charPos.z);
      const speedZoom = Math.min(0.32, (speed / 8.5) * 0.32);
      const dist = followDistanceRef.current + speedZoom;

      const desiredHeight = THREE.MathUtils.clamp(
        1.38 - Math.sin(pitch) * 1.15 + jumpY * 0.35,
        0.56,
        WALL_HEIGHT + 1.2
      );

      _desiredCam.set(
        charPos.x - forwardX * dist,
        desiredHeight,
        charPos.z - forwardZ * dist
      );

      clampCameraToCorridor(_anchorTarget, _desiredCam, 0.3, _safeCam, false);

      _lookTarget.set(
        charPos.x + forwardX * 1.15,
        0.98 + jumpY * 0.45 + Math.sin(pitch) * 0.85,
        charPos.z + forwardZ * 1.15
      );

      // Subtle Dutch-angle camera roll when Midori banks into a turn
      let yawDiff = charYaw - yaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      targetRoll = THREE.MathUtils.clamp(-yawDiff * 0.035 * Math.min(1, speed / 4.0), -0.045, 0.045);

      smoothCamPosRef.current.lerp(_safeCam, Math.min(1, dt * 18.0));
      smoothLookAtRef.current.lerp(_lookTarget, Math.min(1, dt * 20.0));
    }

    state.camera.position.copy(smoothCamPosRef.current);
    state.camera.lookAt(smoothLookAtRef.current);

    smoothRollRef.current = THREE.MathUtils.lerp(
      smoothRollRef.current,
      targetRoll,
      Math.min(1, dt * 10.0)
    );
    state.camera.rotation.z += smoothRollRef.current;
  });

  return null;
}
