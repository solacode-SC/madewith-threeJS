import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clampCameraToCorridor, CEILING_HEIGHT } from '../../utils/mazeLayout';
import type { CameraMode, VirtualWalkInput } from '../../hooks/useMazeState';

interface MazeCameraRigProps {
  cameraMode: CameraMode;
  characterPosRef: React.MutableRefObject<THREE.Vector3>;
  characterSpeedRef: React.MutableRefObject<number>;
  cameraYawRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
  virtualInputRef: React.MutableRefObject<VirtualWalkInput>;
  onCycleCameraMode: () => void;
}

const _eyePos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _anchorTarget = new THREE.Vector3();
const _desiredCam = new THREE.Vector3();
const _safeCam = new THREE.Vector3();

export default function MazeCameraRig({
  cameraMode,
  characterPosRef,
  characterSpeedRef,
  cameraYawRef,
  cameraPitchRef,
  virtualInputRef,
  onCycleCameraMode,
}: MazeCameraRigProps) {
  const { camera, gl } = useThree();

  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetYawVelRef = useRef<number>(0);
  const followDistanceRef = useRef<number>(2.45);
  const smoothCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-4.45, 1.48, 7.6));
  const smoothLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(-4.6, 0.96, 3.5));
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
        -0.48,
        0.45
      );
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (cameraMode === 'follow') {
        followDistanceRef.current = THREE.MathUtils.clamp(
          followDistanceRef.current + e.deltaY * 0.0018,
          1.15,
          3.25
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

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.065);
    const charPos = characterPosRef.current;
    const speed = characterSpeedRef.current;
    const keys = keysRef.current;
    const vInput = virtualInputRef.current;

    // Keyboard / Virtual Look Turn (Q / E or on-screen turn buttons)
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

    if (cameraMode === 'pov') {
      // ===================================================================
      // 1. FIRST-PERSON CHARACTER POV (Directly Through Mina's Eyes!)
      // ===================================================================
      if (speed > 0.08) {
        headBobPhaseRef.current += dt * (7.2 + speed * 1.35);
      }
      const bobY =
        speed > 0.08 ? Math.sin(headBobPhaseRef.current * 2) * 0.024 * Math.min(1, speed / 4.2) : 0;
      const bobSide =
        speed > 0.08 ? Math.cos(headBobPhaseRef.current) * 0.014 * Math.min(1, speed / 4.2) : 0;

      const rightX = -forwardZ;
      const rightZ = forwardX;

      _eyePos.set(
        charPos.x + forwardX * 0.08 + rightX * bobSide,
        0.92 + bobY,
        charPos.z + forwardZ * 0.08 + rightZ * bobSide
      );

      _lookTarget.set(
        _eyePos.x + forwardX * 4.0,
        _eyePos.y + Math.sin(pitch) * 3.4,
        _eyePos.z + forwardZ * 4.0
      );

      smoothCamPosRef.current.lerp(_eyePos, Math.min(1, dt * 24));
      smoothLookAtRef.current.lerp(_lookTarget, Math.min(1, dt * 26));

      camera.position.copy(smoothCamPosRef.current);
      camera.lookAt(smoothLookAtRef.current);
    } else if (cameraMode === 'painting') {
      // ===================================================================
      // 2. WATERCOLOR ARCHWAY PAINTING ANGLE (Reference Image 1 Framing!)
      // ===================================================================
      _anchorTarget.set(charPos.x, 1.05, charPos.z - 0.35);
      _desiredCam.set(charPos.x + 0.22, 1.42, charPos.z + 2.65);
      clampCameraToCorridor(_anchorTarget, _desiredCam, 0.28, _safeCam);

      _lookTarget.set(charPos.x - 0.08, 1.22, charPos.z - 3.2);

      smoothCamPosRef.current.lerp(_safeCam, Math.min(1, dt * 12.0));
      smoothLookAtRef.current.lerp(_lookTarget, Math.min(1, dt * 13.5));

      camera.position.copy(smoothCamPosRef.current);
      camera.lookAt(smoothLookAtRef.current);
    } else {
      // ===================================================================
      // 3. CLOSE 3RD-PERSON COMFORT FOLLOW CAM (With Wall-Collision Arm!)
      // ===================================================================
      _anchorTarget.set(charPos.x, 1.02, charPos.z);
      const dist = followDistanceRef.current;

      const desiredHeight = THREE.MathUtils.clamp(
        1.44 - Math.sin(pitch) * 1.15,
        0.58,
        CEILING_HEIGHT - 0.62
      );

      _desiredCam.set(
        charPos.x - forwardX * dist,
        desiredHeight,
        charPos.z - forwardZ * dist
      );

      clampCameraToCorridor(_anchorTarget, _desiredCam, 0.3, _safeCam);

      _lookTarget.set(
        charPos.x + forwardX * 1.15,
        0.96 + Math.sin(pitch) * 0.85,
        charPos.z + forwardZ * 1.15
      );

      smoothCamPosRef.current.lerp(_safeCam, Math.min(1, dt * 18.0));
      smoothLookAtRef.current.lerp(_lookTarget, Math.min(1, dt * 20.0));

      camera.position.copy(smoothCamPosRef.current);
      camera.lookAt(smoothLookAtRef.current);
    }
  });

  return null;
}
