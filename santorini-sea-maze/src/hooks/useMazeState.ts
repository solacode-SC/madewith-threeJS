import { useState, useRef } from 'react';
import * as THREE from 'three';
import {
  LANDMARK_ZONES,
  cellToWorld,
  findMazePath,
  type LandmarkZone,
} from '../utils/mazeLayout';

export type CameraMode = 'follow' | 'painting' | 'cinematic' | 'sea-breeze' | 'pov';
export type SunMood = 'aegean-noon' | 'caldera-sunset' | 'starlight-blue';

export interface VirtualWalkInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  sprint: boolean;
  jump: boolean;
  wave: boolean;
}

export const CAMERA_MODE_LABELS: Record<
  CameraMode,
  { label: string; shortLabel: string; description: string }
> = {
  follow: {
    label: '🎥 3rd-Person Follow',
    shortLabel: 'Follow Cam',
    description: 'Smooth corridor spring-arm camera behind Midori with turn banking',
  },
  painting: {
    label: '🖼️ Reference Vista',
    shortLabel: 'Postcard Angle',
    description: 'Exact Santorini turquoise-stepped road angle matching the reference picture',
  },
  cinematic: {
    label: '🎬 Vibe Director',
    shortLabel: 'Director Vibe',
    description: 'Dynamic sweeping low-angle & over-shoulder cinematic tracking shots',
  },
  'sea-breeze': {
    label: '🌊 Sea & Domes Vista',
    shortLabel: 'Sea Panorama',
    description: 'Elevated coastal angle showcasing whitewashed rooftops, domes & the Aegean Sea',
  },
  pov: {
    label: '👁️ 1st-Person POV',
    shortLabel: 'Midori POV',
    description: "See directly through Midori's eyes with natural walking head-bob",
  },
};

const START_CELL_WORLD = cellToWorld(6, 3);

export function useMazeState() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [sunMood, setSunMood] = useState<SunMood>('aegean-noon');
  const [showGuidePath, setShowGuidePath] = useState<boolean>(true);
  const [autoWalk, setAutoWalk] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [currentZoneId, setCurrentZoneId] = useState<string>(LANDMARK_ZONES[0].id);
  const [discoveredZones, setDiscoveredZones] = useState<string[]>([LANDMARK_ZONES[0].id]);
  const [discoveryToast, setDiscoveryToast] = useState<LandmarkZone | null>(null);
  const [collectedRelics, setCollectedRelics] = useState<number[]>([]);
  const [walkMarker, setWalkMarker] = useState<[number, number, number] | null>(null);
  const [targetZoneId, setTargetZoneId] = useState<string>('blue-dome-cathedral');

  // Start Midori at [6, 3] (Turquoise Step Promenade) facing North toward the Blue Dome Cathedral [2, 3]
  const characterPosRef = useRef<THREE.Vector3>(
    new THREE.Vector3(START_CELL_WORLD.x, 0, START_CELL_WORLD.z + 0.85)
  );
  const characterYawRef = useRef<number>(Math.PI);
  const characterSpeedRef = useRef<number>(0);
  const cameraYawRef = useRef<number>(Math.PI);
  const cameraPitchRef = useRef<number>(-0.05);
  const walkPathRef = useRef<THREE.Vector3[]>([]);
  const waveTimerRef = useRef<number>(2.0);
  const jumpVelRef = useRef<number>(0);
  const jumpHeightRef = useRef<number>(0);

  const virtualInputRef = useRef<VirtualWalkInput>({
    up: false,
    down: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
    sprint: false,
    jump: false,
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
        waveTimerRef.current = 1.8;
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
      waveTimerRef.current = 1.3;
      return [...prev, relicId];
    });
  };

  const cycleSunMood = () => {
    setSunMood((prev) =>
      prev === 'aegean-noon'
        ? 'caldera-sunset'
        : prev === 'caldera-sunset'
          ? 'starlight-blue'
          : 'aegean-noon'
    );
  };

  const cycleCameraMode = () => {
    const order: CameraMode[] = ['follow', 'painting', 'cinematic', 'sea-breeze', 'pov'];
    setCameraMode((prev) => {
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
  };

  const triggerWave = () => {
    waveTimerRef.current = 2.2;
  };

  const triggerJump = () => {
    if (jumpHeightRef.current <= 0.01) {
      jumpVelRef.current = 4.6;
    }
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
    // If autoWalk is active, automatically chain to the next Landmark Place in the 16-place tour!
    if (autoWalk) {
      const currentTargetIdx = LANDMARK_ZONES.findIndex((z) => z.id === targetZoneId);
      const nextZone =
        LANDMARK_ZONES[(currentTargetIdx + 1) % LANDMARK_ZONES.length];
      setTargetZoneId(nextZone.id);
      const nextWaypoints = findMazePath(
        { x: characterPosRef.current.x, z: characterPosRef.current.z },
        { x: nextZone.x, z: nextZone.z }
      );
      walkPathRef.current = nextWaypoints;
      setWalkMarker([nextZone.x, 0.03, nextZone.z]);
      return;
    }
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
          LANDMARK_ZONES[3];
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
      const hasCenterStructure =
        zone.id === 'sapphire-fountain' ||
        zone.id === 'windmill-point' ||
        zone.id === 'lighthouse-pier';
      characterPosRef.current.set(zone.x, 0, zone.z + (hasCenterStructure ? 1.05 : 0.45));
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
    jumpVelRef,
    jumpHeightRef,
    virtualInputRef,
    setCameraMode,
    cycleCameraMode,
    setHoveredItem,
    cycleSunMood,
    setShowGuidePath,
    toggleAutoWalk,
    triggerWave,
    triggerJump,
    triggerZoneDiscovery,
    collectRelic,
    handleFloorClick,
    clearWalkTarget,
    stopAutoWalkOnManualInput,
    navigateToZone,
  };
}
