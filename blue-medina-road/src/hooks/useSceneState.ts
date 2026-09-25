import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import {
  LANDMARK_ZONES,
  ROAD_END_Z,
  ROAD_START_Z,
  getRoadCenterX,
  getRoadElevationY,
  getRoadHalfWidth,
  type LandmarkZone,
} from '../utils/roadPath';

export type CameraMode = 'follow' | 'vista' | 'fountain' | 'summit' | 'aerial';
export type TimeOfDay = 'noon' | 'sunset' | 'starlight';

export const CAMERA_MODES: Record<
  CameraMode,
  { label: string; position: [number, number, number]; target: [number, number, number] }
> = {
  follow: {
    label: '✨ Follow Flight',
    position: [0, 1.95, 6.2],
    target: [0, 1.45, -1.2],
  },
  vista: {
    label: "🎨 Painter's Vista",
    position: [0, 1.82, 6.6],
    target: [0, 2.35, -6.5],
  },
  fountain: {
    label: '⛲ Sky Fountain',
    position: [
      getRoadCenterX(-46) + 2.8,
      getRoadElevationY(-46) + 2.8,
      -39.2,
    ],
    target: [getRoadCenterX(-46), getRoadElevationY(-46) + 1.2, -46.0],
  },
  summit: {
    label: '🏛️ Celestial Summit',
    position: [
      getRoadCenterX(-81.5) + 0.0,
      getRoadElevationY(-81.5) + 3.0,
      -73.2,
    ],
    target: [getRoadCenterX(-81.5), getRoadElevationY(-81.5) + 2.0, -81.5],
  },
  aerial: {
    label: '🦅 Long Road Overview',
    position: [14.5, 19.5, -12.0],
    target: [0, 7.5, -42.0],
  },
};

export interface VirtualFlightInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  ascend: boolean;
  descend: boolean;
  boost: boolean;
}

export function useSceneState() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon');
  const [autoFly, setAutoFly] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Discovery progression along the long road
  const [currentZoneId, setCurrentZoneId] = useState<string>('painters-steps');
  const [discoveredZones, setDiscoveredZones] = useState<string[]>(['painters-steps']);
  const [discoveryToast, setDiscoveryToast] = useState<LandmarkZone | null>(null);
  const [collectedStars, setCollectedStars] = useState<number[]>([]);

  // Mutable 60fps refs for the flying character
  const startZ = 1.4;
  const startY = getRoadElevationY(startZ) + 0.92;
  const characterPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, startY, startZ));
  const characterYawRef = useRef<number>(Math.PI); // Facing up the stairs (-Z)
  const flightAltitudeOffsetRef = useRef<number>(0.92); // Hover height above steps
  const flyTargetRef = useRef<THREE.Vector3 | null>(null);
  const [flyMarker, setFlyMarker] = useState<[number, number, number] | null>(null);

  const virtualInputRef = useRef<VirtualFlightInput>({
    up: false,
    down: false,
    left: false,
    right: false,
    ascend: false,
    descend: false,
    boost: false,
  });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerZoneDiscovery = useCallback((zoneId: string) => {
    setCurrentZoneId((prev) => (prev === zoneId ? prev : zoneId));
    setDiscoveredZones((prev) => {
      if (prev.includes(zoneId)) return prev;
      const zone = LANDMARK_ZONES.find((z) => z.id === zoneId);
      if (zone) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setDiscoveryToast(zone);
        toastTimerRef.current = setTimeout(() => {
          setDiscoveryToast(null);
        }, 4200);
      }
      return [...prev, zoneId];
    });
  }, []);

  const collectStar = useCallback((starId: number) => {
    setCollectedStars((prev) => (prev.includes(starId) ? prev : [...prev, starId]));
  }, []);

  const cycleTimeOfDay = useCallback(() => {
    setTimeOfDay((prev) => {
      if (prev === 'noon') return 'sunset';
      if (prev === 'sunset') return 'starlight';
      return 'noon';
    });
  }, []);

  const toggleAutoFly = useCallback(() => {
    setAutoFly((prev) => {
      const next = !prev;
      if (next) {
        flyTargetRef.current = null;
        setFlyMarker(null);
        setCameraMode('follow');
      }
      return next;
    });
  }, []);

  const handleRoadClick = useCallback((point: THREE.Vector3) => {
    const clampedZ = THREE.MathUtils.clamp(point.z, ROAD_END_Z + 1.0, ROAD_START_Z - 0.3);
    const centerX = getRoadCenterX(clampedZ);
    const halfW = getRoadHalfWidth(clampedZ) - 0.45;
    const clampedX = THREE.MathUtils.clamp(point.x, centerX - halfW, centerX + halfW);
    const roadY = getRoadElevationY(clampedZ);

    const target = new THREE.Vector3(clampedX, roadY + flightAltitudeOffsetRef.current, clampedZ);
    flyTargetRef.current = target;
    setFlyMarker([clampedX, roadY + 0.08, clampedZ]);
    setAutoFly(false);
    setCameraMode('follow');
  }, []);

  const clearFlyTarget = useCallback(() => {
    flyTargetRef.current = null;
    setFlyMarker(null);
  }, []);

  const stopAutoFlyOnManualInput = useCallback(() => {
    setAutoFly((prev) => (prev ? false : prev));
    if (flyTargetRef.current) {
      flyTargetRef.current = null;
      setFlyMarker(null);
    }
    setCameraMode((prev) => (prev !== 'follow' ? 'follow' : prev));
  }, []);

  const jumpToZone = useCallback(
    (zone: LandmarkZone) => {
      const targetZ = zone.zCenter;
      const targetX = getRoadCenterX(targetZ);
      const targetY = getRoadElevationY(targetZ) + flightAltitudeOffsetRef.current;

      // Set click-to-fly target if nearby, or warp smoothly near the zone entrance
      const currentZ = characterPosRef.current.z;
      if (Math.abs(currentZ - targetZ) > 26) {
        const approachZ = Math.min(ROAD_START_Z - 0.5, targetZ + 5.5);
        characterPosRef.current.set(
          getRoadCenterX(approachZ),
          getRoadElevationY(approachZ) + flightAltitudeOffsetRef.current,
          approachZ
        );
      }

      const dest = new THREE.Vector3(targetX, targetY, targetZ);
      flyTargetRef.current = dest;
      setFlyMarker([targetX, getRoadElevationY(targetZ) + 0.08, targetZ]);
      setAutoFly(false);
      setCameraMode('follow');
      triggerZoneDiscovery(zone.id);
    },
    [triggerZoneDiscovery]
  );

  return {
    cameraMode,
    timeOfDay,
    autoFly,
    hoveredItem,
    currentZoneId,
    discoveredZones,
    discoveryToast,
    collectedStars,
    flyMarker,
    characterPosRef,
    characterYawRef,
    flightAltitudeOffsetRef,
    flyTargetRef,
    virtualInputRef,
    setCameraMode,
    setHoveredItem,
    cycleTimeOfDay,
    toggleAutoFly,
    triggerZoneDiscovery,
    collectStar,
    handleRoadClick,
    clearFlyTarget,
    stopAutoFlyOnManualInput,
    jumpToZone,
  };
}
