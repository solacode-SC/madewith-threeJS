import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';

export type CameraPreset = 'postcard' | 'follow' | 'window' | 'patio' | 'aerial';
export type TimeOfDay = 'sunny' | 'golden';

export interface PresetConfig {
  position: [number, number, number];
  target: [number, number, number];
  label: string;
}

export const CAMERA_PRESETS: Record<CameraPreset, PresetConfig> = {
  postcard: {
    position: [0, 2.35, 8.2],
    target: [0, 2.15, 0],
    label: 'Postcard View',
  },
  follow: {
    position: [0, 2.4, 6.2],
    target: [0, 0.8, 2.4],
    label: 'Follow Ronin',
  },
  window: {
    position: [-1.05, 1.55, 4.1],
    target: [-0.82, 1.35, 0.8],
    label: 'Coffee Window',
  },
  patio: {
    position: [4.8, 2.1, 4.4],
    target: [1.3, 1.4, 0.2],
    label: 'Side Patio',
  },
  aerial: {
    position: [-5.2, 5.4, 7.5],
    target: [0, 1.6, 0],
    label: 'Island Overview',
  },
};

export function useSceneState() {
  const [activePreset, setActivePreset] = useState<CameraPreset>('postcard');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('sunny');
  const [autoPatrol, setAutoPatrol] = useState<boolean>(true);
  const [doorOpen, setDoorOpen] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Shared mutable character position for smooth 60fps camera tracking without React re-renders
  const characterPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-1.35, 0, 2.55));
  const characterAngleRef = useRef<number>(Math.PI * 0.42);
  const walkTargetRef = useRef<THREE.Vector3 | null>(null);
  const [walkMarker, setWalkMarker] = useState<[number, number, number] | null>(null);

  // Virtual D-pad state for on-screen buttons
  const virtualInputRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean; sprint: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false,
  });

  const selectPreset = useCallback((preset: CameraPreset) => {
    setActivePreset(preset);
  }, []);

  const toggleTimeOfDay = useCallback(() => {
    setTimeOfDay((prev) => (prev === 'sunny' ? 'golden' : 'sunny'));
  }, []);

  const toggleAutoPatrol = useCallback(() => {
    setAutoPatrol((prev) => {
      const next = !prev;
      if (next) {
        walkTargetRef.current = null;
        setWalkMarker(null);
      }
      return next;
    });
  }, []);

  const toggleDoor = useCallback(() => {
    setDoorOpen((prev) => !prev);
  }, []);

  const handleGroundClick = useCallback((point: THREE.Vector3) => {
    const clampedX = THREE.MathUtils.clamp(point.x, -6.5, 6.5);
    const clampedZ = THREE.MathUtils.clamp(point.z, -3.4, 4.3);
    const target = new THREE.Vector3(clampedX, 0, clampedZ);
    walkTargetRef.current = target;
    setWalkMarker([clampedX, 0.02, clampedZ]);
    setAutoPatrol(false);
  }, []);

  const clearWalkTarget = useCallback(() => {
    walkTargetRef.current = null;
    setWalkMarker(null);
  }, []);

  const stopAutoPatrolOnManualInput = useCallback(() => {
    setAutoPatrol((prev) => (prev ? false : prev));
    if (walkTargetRef.current) {
      walkTargetRef.current = null;
      setWalkMarker(null);
    }
  }, []);

  return {
    activePreset,
    timeOfDay,
    autoPatrol,
    doorOpen,
    hoveredItem,
    walkMarker,
    characterPosRef,
    characterAngleRef,
    walkTargetRef,
    virtualInputRef,
    setHoveredItem,
    selectPreset,
    toggleTimeOfDay,
    toggleAutoPatrol,
    toggleDoor,
    handleGroundClick,
    clearWalkTarget,
    stopAutoPatrolOnManualInput,
  };
}
