import { useState, useRef } from 'react';
import * as THREE from 'three';
import {
  LANDMARK_ZONES,
  cellToWorld,
  findMazePath,
  type LandmarkZone,
} from '../utils/mazeLayout';

export type CameraMode = 'follow' | 'pov' | 'painting';
export type SunMood = 'morning-gold' | 'amber-afternoon' | 'lantern-dusk';

export interface VirtualWalkInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  sprint: boolean;
  wave: boolean;
}

export const CAMERA_MODE_LABELS: Record<
  CameraMode,
  { label: string; shortLabel: string; description: string }
> = {
  follow: {
    label: '🎥 3rd-Person Character View',
    shortLabel: '3rd-Person Follow',
    description: 'Smooth corridor follow camera behind Hana with wall-aware spring arm',
  },
  pov: {
    label: '👁️ 1st-Person Character POV',
    shortLabel: 'Character POV (Eyes)',
    description: "See directly through Hana's eyes with natural walking head-bob",
  },
  painting: {
    label: '🖼️ Village Alleyway Angle',
    shortLabel: 'Painting Angle',
    description: 'Scenic village composition matching the reference artwork',
  },
};

const START_CELL_WORLD = cellToWorld(5, 1);

export function useMazeState() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [sunMood, setSunMood] = useState<SunMood>('morning-gold');
  const [showGuidePath, setShowGuidePath] = useState<boolean>(true);
  const [autoWalk, setAutoWalk] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [currentZoneId, setCurrentZoneId] = useState<string>(LANDMARK_ZONES[0].id);
  const [discoveredZones, setDiscoveredZones] = useState<string[]>([LANDMARK_ZONES[0].id]);
  const [discoveryToast, setDiscoveryToast] = useState<LandmarkZone | null>(null);
  const [collectedRelics, setCollectedRelics] = useState<number[]>([]);
  const [walkMarker, setWalkMarker] = useState<[number, number, number] | null>(null);
  const [targetZoneId, setTargetZoneId] = useState<string>('sunset-terrace');

  const characterPosRef = useRef<THREE.Vector3>(
    new THREE.Vector3(START_CELL_WORLD.x + 0.15, 0, START_CELL_WORLD.z + 1.15)
  );
  const characterYawRef = useRef<number>(Math.PI);
  const characterSpeedRef = useRef<number>(0);
  const cameraYawRef = useRef<number>(Math.PI);
  const cameraPitchRef = useRef<number>(-0.04);
  const walkPathRef = useRef<THREE.Vector3[]>([]);
  const waveTimerRef = useRef<number>(1.8);

  const virtualInputRef = useRef<VirtualWalkInput>({
    up: false,
    down: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
    sprint: false,
    wave: false,
  });

  const toastTimeoutRef = useRef<number | null>(null);

  const triggerZoneDiscovery = (zoneId: string) => {
    setCurrentZoneId((prev) => (prev === zoneId ? prev : zoneId));
    setDiscoveredZones((prev) => {
      if (prev.includes(zoneId)) return prev;
      const zone = LANDMARK_ZONES.find((z) => z.id === zoneId) || null;
      if (zone) {
        setDiscoveryToast(zone);
        waveTimerRef.current = 1.6;
        if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = window.setTimeout(() => {
          setDiscoveryToast(null);
        }, 3800);
      }
      return [...prev, zoneId];
    });
  };

  const collectRelic = (relicId: number) => {
    setCollectedRelics((prev) => {
      if (prev.includes(relicId)) return prev;
      waveTimerRef.current = 1.2;
      return [...prev, relicId];
    });
  };

  const cycleSunMood = () => {
    setSunMood((prev) =>
      prev === 'morning-gold'
        ? 'amber-afternoon'
        : prev === 'amber-afternoon'
          ? 'lantern-dusk'
          : 'morning-gold'
    );
  };

  const cycleCameraMode = () => {
    setCameraMode((prev) =>
      prev === 'follow' ? 'pov' : prev === 'pov' ? 'painting' : 'follow'
    );
  };

  const triggerWave = () => {
    waveTimerRef.current = 1.8;
  };

  const handleFloorClick = (point: THREE.Vector3) => {
    const waypoints = findMazePath(
      { x: characterPosRef.current.x, z: characterPosRef.current.z },
      { x: point.x, z: point.z }
    );
    walkPathRef.current = waypoints;
    setWalkMarker([point.x, 0.03, point.z]);
    setAutoWalk(false);
  };

  const clearWalkTarget = () => {
    walkPathRef.current = [];
    setWalkMarker(null);
  };

  const stopAutoWalkOnManualInput = () => {
    setAutoWalk((prev) => (prev ? false : prev));
    if (walkPathRef.current.length > 0) {
      walkPathRef.current = [];
      setWalkMarker(null);
    }
  };

  const toggleAutoWalk = () => {
    setAutoWalk((prev) => {
      const next = !prev;
      if (next) {
        const goalZone =
          LANDMARK_ZONES.find((z) => z.id === targetZoneId) ||
          LANDMARK_ZONES[LANDMARK_ZONES.length - 1];
        walkPathRef.current = findMazePath(
          { x: characterPosRef.current.x, z: characterPosRef.current.z },
          { x: goalZone.x, z: goalZone.z }
        );
        setWalkMarker([goalZone.x, 0.03, goalZone.z]);
      } else {
        walkPathRef.current = [];
        setWalkMarker(null);
      }
      return next;
    });
  };

  const navigateToZone = (zone: LandmarkZone, teleport = false) => {
    setTargetZoneId(zone.id);
    if (teleport) {
      characterPosRef.current.set(zone.x, 0, zone.z + 0.6);
      characterYawRef.current = zone.defaultYaw;
      cameraYawRef.current = zone.defaultYaw;
      walkPathRef.current = [];
      setWalkMarker(null);
      setAutoWalk(false);
      triggerZoneDiscovery(zone.id);
    } else {
      const waypoints = findMazePath(
        { x: characterPosRef.current.x, z: characterPosRef.current.z },
        { x: zone.x, z: zone.z }
      );
      walkPathRef.current = waypoints;
      setWalkMarker([zone.x, 0.03, zone.z]);
      setShowGuidePath(true);
    }
  };

  return {
    cameraMode,
    sunMood,
    showGuidePath,
    autoWalk,
    hoveredItem,
    currentZoneId,
    targetZoneId,
    discoveredZones,
    discoveryToast,
    collectedRelics,
    walkMarker,
    characterPosRef,
    characterYawRef,
    characterSpeedRef,
    cameraYawRef,
    cameraPitchRef,
    walkPathRef,
    waveTimerRef,
    virtualInputRef,
    setCameraMode,
    cycleCameraMode,
    setHoveredItem,
    cycleSunMood,
    setShowGuidePath,
    toggleAutoWalk,
    triggerWave,
    triggerZoneDiscovery,
    collectRelic,
    handleFloorClick,
    clearWalkTarget,
    stopAutoWalkOnManualInput,
    navigateToZone,
  };
}
