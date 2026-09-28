import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CAMERA_MODES,
  type BrushMood,
  type CameraMode,
  type VirtualWalkInput,
} from '../domain/cityConfig';
import {
  CITY_DISTRICTS,
  cellToWorld,
  findCityPath,
  type CityDistrict,
} from '../domain/cityLayout';
import { soundtrack, type SongInfo } from '../audio/SoundtrackEngine';

const START_SQUARE = cellToWorld(6, 5);

export function useCityController() {
  const [cameraMode, setCameraMode] = useState<CameraMode>('road');
  const [brushMood, setBrushMood] = useState<BrushMood>('morning-wash');
  const [autoWalk, setAutoWalk] = useState<boolean>(false);
  const [hudHidden, setHudHidden] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [currentDistrictId, setCurrentDistrictId] = useState<string>(CITY_DISTRICTS[0].id);
  const [discoveredDistricts, setDiscoveredDistricts] = useState<string[]>([
    CITY_DISTRICTS[0].id,
  ]);
  const [discoveryToast, setDiscoveryToast] = useState<CityDistrict | null>(null);
  const [collectedCharms, setCollectedCharms] = useState<number[]>([]);
  const [walkMarker, setWalkMarker] = useState<[number, number, number] | null>(null);
  const [audioState, setAudioState] = useState<{
    isPlaying: boolean;
    song: SongInfo;
    songIndex: number;
  }>(() => soundtrack.getState());

  // Start Kaede on the curving foreground sandy road facing straight toward the camera with a big anime smile!
  const characterPosRef = useRef<THREE.Vector3>(
    new THREE.Vector3(START_SQUARE.x - 0.38, 0, START_SQUARE.z + 2.85)
  );
  const characterYawRef = useRef<number>(0);
  const characterSpeedRef = useRef<number>(0);
  const cameraYawRef = useRef<number>(Math.PI);
  const cameraPitchRef = useRef<number>(0.22);
  const walkPathRef = useRef<THREE.Vector3[]>([]);
  const waveTimerRef = useRef<number>(3.2);
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

  const toastTimerRef = useRef<number | null>(null);
  const tourIndexRef = useRef<number>(1);

  useEffect(() => {
    return soundtrack.subscribe(() => {
      setAudioState(soundtrack.getState());
    });
  }, []);

  // Keyboard shortcuts for HUD toggle (H) and Music (M / N)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'h') {
        setHudHidden((prev) => !prev);
      } else if (k === 'm') {
        soundtrack.toggle();
      } else if (k === 'n') {
        soundtrack.nextSong();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const triggerDistrictDiscovery = (districtId: string) => {
    setCurrentDistrictId((prev) => (prev === districtId ? prev : districtId));
    setDiscoveredDistricts((prev) => {
      if (prev.includes(districtId)) return prev;
      const found = CITY_DISTRICTS.find((d) => d.id === districtId) || null;
      if (found) {
        setDiscoveryToast(found);
        waveTimerRef.current = 1.6;
        soundtrack.playDiscoveryChime();
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
          setDiscoveryToast(null);
        }, 3200);
      }
      return [...prev, districtId];
    });
  };

  const collectCharm = (charmId: number) => {
    setCollectedCharms((prev) => {
      if (prev.includes(charmId)) return prev;
      soundtrack.playDiscoveryChime();
      return [...prev, charmId];
    });
  };

  const cycleBrushMood = () => {
    setBrushMood((prev) =>
      prev === 'morning-wash'
        ? 'persimmon-dusk'
        : prev === 'persimmon-dusk'
          ? 'moonlit-ink'
          : 'morning-wash'
    );
  };

  const cycleCameraMode = () => {
    const ids = CAMERA_MODES.map((m) => m.id);
    setCameraMode((prev) => {
      const idx = ids.indexOf(prev);
      return ids[(idx + 1) % ids.length];
    });
  };

  const handleRoadClick = (point: THREE.Vector3) => {
    // Ensure music is started on first world click if not yet playing
    if (!soundtrack.getState().isPlaying) {
      void soundtrack.start();
    }
    const waypoints = findCityPath(characterPosRef.current, point);
    walkPathRef.current = waypoints;
    if (waypoints.length > 0) {
      const last = waypoints[waypoints.length - 1];
      setWalkMarker([last.x, 0.04, last.z]);
    }
  };

  const clearWalkTarget = () => {
    walkPathRef.current = [];
    setWalkMarker(null);
    if (autoWalk) {
      const nextDistrict = CITY_DISTRICTS[tourIndexRef.current % CITY_DISTRICTS.length];
      tourIndexRef.current = (tourIndexRef.current + 1) % CITY_DISTRICTS.length;
      const targetVec = new THREE.Vector3(nextDistrict.worldX, 0, nextDistrict.worldZ);
      const waypoints = findCityPath(characterPosRef.current, targetVec);
      walkPathRef.current = waypoints;
      if (waypoints.length > 0) {
        const last = waypoints[waypoints.length - 1];
        setWalkMarker([last.x, 0.04, last.z]);
      }
    }
  };

  const stopAutoWalkOnManualInput = () => {
    if (autoWalk) setAutoWalk(false);
    if (walkPathRef.current.length > 0) {
      walkPathRef.current = [];
      setWalkMarker(null);
    }
  };

  const toggleAutoWalk = () => {
    setAutoWalk((prev) => {
      const next = !prev;
      if (next) {
        const nextDistrict = CITY_DISTRICTS[tourIndexRef.current % CITY_DISTRICTS.length];
        tourIndexRef.current = (tourIndexRef.current + 1) % CITY_DISTRICTS.length;
        const targetVec = new THREE.Vector3(nextDistrict.worldX, 0, nextDistrict.worldZ);
        const waypoints = findCityPath(characterPosRef.current, targetVec);
        walkPathRef.current = waypoints;
        if (waypoints.length > 0) {
          const last = waypoints[waypoints.length - 1];
          setWalkMarker([last.x, 0.04, last.z]);
        }
      } else {
        walkPathRef.current = [];
        setWalkMarker(null);
      }
      return next;
    });
  };

  const navigateToDistrict = (district: CityDistrict, teleport = false) => {
    if (teleport) {
      setAutoWalk(false);
      walkPathRef.current = [];
      setWalkMarker(null);
      characterPosRef.current.set(district.worldX, 0, district.worldZ);
      triggerDistrictDiscovery(district.id);
      return;
    }
    const targetVec = new THREE.Vector3(district.worldX, 0, district.worldZ);
    const waypoints = findCityPath(characterPosRef.current, targetVec);
    walkPathRef.current = waypoints;
    if (waypoints.length > 0) {
      const last = waypoints[waypoints.length - 1];
      setWalkMarker([last.x, 0.04, last.z]);
    }
  };

  return {
    cameraMode,
    brushMood,
    autoWalk,
    hudHidden,
    hoveredItem,
    currentDistrictId,
    discoveredDistricts,
    discoveryToast,
    collectedCharms,
    walkMarker,
    audioState,
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
    cycleBrushMood,
    setHudHidden,
    setHoveredItem,
    toggleAutoWalk,
    handleRoadClick,
    clearWalkTarget,
    stopAutoWalkOnManualInput,
    triggerDistrictDiscovery,
    collectCharm,
    navigateToDistrict,
    toggleMusic: () => soundtrack.toggle(),
    nextSong: () => soundtrack.nextSong(),
    startMusic: () => soundtrack.start(),
  };
}
