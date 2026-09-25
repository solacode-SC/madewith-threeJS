import { useState, useCallback, useEffect } from 'react';

export type CameraMode = 'cinematic' | 'explore' | 'preset';

export interface PresetTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
}

export const CAMERA_PRESETS: Record<string, PresetTarget> = {
  Overview: {
    position: [3, 2.5, 6],
    lookAt: [0, 0.5, 0],
  },
  Cabin: {
    position: [1.4, 1.2, 2.4],
    lookAt: [0.3, 0.75, 0],
  },
  Palms: {
    position: [-2.4, 2.2, 2.8],
    lookAt: [-0.4, 1.6, -0.2],
  },
  Boat: {
    position: [2.2, 0.9, 2.8],
    lookAt: [0.8, 0.1, 1.2],
  },
  Island: {
    position: [0, 3.8, 7.5],
    lookAt: [0, 0.3, 0],
  },
  Reset: {
    position: [3, 2.5, 6],
    lookAt: [0, 0.5, 0],
  },
};

export function useInteraction() {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('Overview');
  const [cameraMode, setCameraMode] = useState<CameraMode>('explore');
  const [presetTarget, setPresetTarget] = useState<PresetTarget>(CAMERA_PRESETS.Overview);
  const [hasExplored, setHasExplored] = useState<boolean>(false);

  useEffect(() => {
    document.body.style.cursor = hoveredObject ? 'pointer' : 'grab';
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [hoveredObject]);

  const handlePointerOver = useCallback((name: string) => {
    setHoveredObject(name);
  }, []);

  const handlePointerOut = useCallback(() => {
    setHoveredObject(null);
  }, []);

  const selectPreset = useCallback((preset: string) => {
    const target = CAMERA_PRESETS[preset] || CAMERA_PRESETS.Overview;
    setActivePreset(preset === 'Reset' ? 'Overview' : preset);
    setPresetTarget({
      position: [...target.position],
      lookAt: [...target.lookAt],
    });
    setCameraMode('preset');
    setHasExplored(true);
  }, []);

  const markExplored = useCallback(() => {
    setHasExplored(true);
  }, []);

  return {
    hoveredObject,
    activePreset,
    cameraMode,
    presetTarget,
    hasExplored,
    setCameraMode,
    handlePointerOver,
    handlePointerOut,
    selectPreset,
    markExplored,
  };
}
