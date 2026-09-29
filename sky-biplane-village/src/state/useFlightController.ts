import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CAMERA_MODES,
  type CameraMode,
  type FlightSpeedPreset,
  type SkyMood,
  type VirtualFlightInput,
} from '../domain/skyConfig';
import {
  VILLAGE_LANDMARKS,
  type VillageLandmark,
} from '../domain/villageLayout';
import { SONGS, soundtrackEngine, type SongInfo } from '../audio/SoundtrackEngine';

export const MOOD_ORDER: SkyMood[] = [
  'morning-mist',
  'noon-gouache',
  'evening-sunset',
  'starry-night',
];

const SPEED_ORDER: FlightSpeedPreset[] = ['relaxed', 'fast', 'turbo'];

export function useFlightController() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('anime-cinema');
  const [skyMood, setSkyMood] = useState<SkyMood>('morning-mist');
  const [speedPreset, setSpeedPreset] = useState<FlightSpeedPreset>('fast');
  const [autoCruise, setAutoCruise] = useState<boolean>(true);
  const [hudHidden, setHudHidden] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const [currentLandmarkId, setCurrentLandmarkId] = useState<string>(
    VILLAGE_LANDMARKS[0].id
  );
  const [discoveredLandmarks, setDiscoveredLandmarks] = useState<string[]>([
    VILLAGE_LANDMARKS[0].id,
  ]);
  const [discoveryToast, setDiscoveryToast] = useState<VillageLandmark | null>(null);
  const [collectedRings, setCollectedRings] = useState<number[]>([]);
  const [flightMarker, setFlightMarker] = useState<[number, number, number] | null>(null);

  const [audioState, setAudioState] = useState<{
    isPlaying: boolean;
    song: SongInfo;
    songIndex: number;
  }>(() => ({
    isPlaying: false,
    song: SONGS[0],
    songIndex: 0,
  }));

  // Live 60fps mutable flight state refs
  const planePosRef = useRef<THREE.Vector3>(new THREE.Vector3(6.5, 19.2, 22.0));
  const planeYawRef = useRef<number>(Math.PI * 0.72);
  const planePitchRef = useRef<number>(0);
  const planeRollRef = useRef<number>(-0.14);
  const planeSpeedRef = useRef<number>(21.5);
  const targetPointRef = useRef<THREE.Vector3 | null>(null);
  const barrelRollTimerRef = useRef<number>(0);

  // Camera orbit offset refs
  const cameraYawOffsetRef = useRef<number>(0);
  const cameraPitchOffsetRef = useRef<number>(0);

  const virtualInputRef = useRef<VirtualFlightInput>({
    forward: false,
    backward: false,
    turnLeft: false,
    turnRight: false,
    climb: false,
    descend: false,
    boost: false,
  });

  useEffect(() => {
    return soundtrackEngine.subscribe(() => {
      setAudioState(soundtrackEngine.getState());
    });
  }, []);

  const cycleCameraMode = useCallback(() => {
    setCameraMode((prev) => {
      const idx = CAMERA_MODES.findIndex((m) => m.id === prev);
      return CAMERA_MODES[(idx + 1) % CAMERA_MODES.length].id;
    });
  }, []);

  const cycleSkyMood = useCallback(() => {
    setSkyMood((prev) => {
      const idx = MOOD_ORDER.indexOf(prev);
      return MOOD_ORDER[(idx + 1) % MOOD_ORDER.length];
    });
  }, []);

  const cycleSpeedPreset = useCallback(() => {
    setSpeedPreset((prev) => {
      const idx = SPEED_ORDER.indexOf(prev);
      return SPEED_ORDER[(idx + 1) % SPEED_ORDER.length];
    });
  }, []);

  const toggleAutoCruise = useCallback(() => {
    setAutoCruise((prev) => !prev);
  }, []);

  const triggerBarrelRoll = useCallback(() => {
    if (barrelRollTimerRef.current <= 0.05) {
      barrelRollTimerRef.current = 1.35;
      soundtrackEngine.playWindRingChime();
    }
  }, []);

  const handleGroundOrVillageClick = useCallback((point: THREE.Vector3) => {
    const desiredAlt = THREE.MathUtils.clamp(planePosRef.current.y, 16.5, 28.0);
    targetPointRef.current = new THREE.Vector3(point.x, desiredAlt, point.z);
    setFlightMarker([point.x, point.y + 0.25, point.z]);
    setAutoCruise(true);
  }, []);

  const clearFlightTarget = useCallback(() => {
    targetPointRef.current = null;
    setFlightMarker(null);
  }, []);

  const triggerLandmarkDiscovery = useCallback((landmarkId: string) => {
    setCurrentLandmarkId(landmarkId);
    setDiscoveredLandmarks((prev) => {
      if (prev.includes(landmarkId)) return prev;
      const found = VILLAGE_LANDMARKS.find((l) => l.id === landmarkId);
      if (found) {
        setDiscoveryToast(found);
      }
      return [...prev, landmarkId];
    });
  }, []);

  useEffect(() => {
    if (!discoveryToast) return;
    const t = window.setTimeout(() => setDiscoveryToast(null), 3600);
    return () => window.clearTimeout(t);
  }, [discoveryToast]);

  const collectSkyRing = useCallback((ringId: number) => {
    setCollectedRings((prev) => {
      if (prev.includes(ringId)) return prev;
      soundtrackEngine.playWindRingChime();
      return [...prev, ringId];
    });
  }, []);

  const flyToLandmark = useCallback((landmark: VillageLandmark, instantTeleport = false) => {
    if (instantTeleport) {
      planePosRef.current.set(landmark.x + 8, landmark.flyAltitude, landmark.z + 10);
      planeYawRef.current = Math.atan2(-8, -10);
      targetPointRef.current = null;
      setFlightMarker(null);
    } else {
      targetPointRef.current = new THREE.Vector3(
        landmark.x,
        landmark.flyAltitude,
        landmark.z
      );
      setFlightMarker([landmark.x, 1.2, landmark.z]);
      setAutoCruise(true);
    }
    setCurrentLandmarkId(landmark.id);
  }, []);

  const toggleMusic = useCallback(() => {
    void soundtrackEngine.toggle();
  }, []);

  const nextSong = useCallback(() => {
    void soundtrackEngine.nextSong();
  }, []);

  const startMusic = useCallback(() => {
    void soundtrackEngine.start();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'h') {
        setHudHidden((p) => !p);
      } else if (k === 'l') {
        cycleSkyMood();
      } else if (k === 'g') {
        cycleSpeedPreset();
      } else if (k === 'm') {
        void soundtrackEngine.toggle();
      } else if (k === 'n') {
        void soundtrackEngine.nextSong();
      } else if (k === 'f') {
        triggerBarrelRoll();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cycleSkyMood, cycleSpeedPreset, triggerBarrelRoll]);

  return {
    cameraMode,
    skyMood,
    speedPreset,
    autoCruise,
    hudHidden,
    hoveredItem,
    currentLandmarkId,
    discoveredLandmarks,
    discoveryToast,
    collectedRings,
    flightMarker,
    audioState,
    planePosRef,
    planeYawRef,
    planePitchRef,
    planeRollRef,
    planeSpeedRef,
    targetPointRef,
    barrelRollTimerRef,
    cameraYawOffsetRef,
    cameraPitchOffsetRef,
    virtualInputRef,
    setCameraMode,
    cycleCameraMode,
    setSkyMood,
    cycleSkyMood,
    setSpeedPreset,
    cycleSpeedPreset,
    setHudHidden,
    setHoveredItem,
    toggleAutoCruise,
    triggerBarrelRoll,
    handleGroundOrVillageClick,
    clearFlightTarget,
    triggerLandmarkDiscovery,
    collectSkyRing,
    flyToLandmark,
    toggleMusic,
    nextSong,
    startMusic,
  };
}
