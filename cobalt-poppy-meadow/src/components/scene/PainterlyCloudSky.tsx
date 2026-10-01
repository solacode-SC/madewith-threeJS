import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createPainterlySkyMaterial } from '../../core/meadowShaders';
import { MOOD_THEMES, type SkyMood } from '../../domain/meadowConfig';

interface PainterlyCloudSkyProps {
  skyMood: SkyMood;
}

export default function PainterlyCloudSky({ skyMood }: PainterlyCloudSkyProps) {
  const skyMat = useMemo(() => createPainterlySkyMaterial(), []);

  useEffect(() => {
    const theme = MOOD_THEMES[skyMood];
    skyMat.uniforms.uTopColor.value.set(theme.skyTopColor);
    skyMat.uniforms.uMidColor.value.set(theme.skyMidColor);
    skyMat.uniforms.uHorizonColor.value.set(theme.skyHorizonColor);

    if (skyMood === 'golden-hour') {
      skyMat.uniforms.uCloudWhite.value.set('#FFE8CC');
      skyMat.uniforms.uCloudGrey.value.set('#E2AF85');
    } else if (skyMood === 'lavender-twilight') {
      skyMat.uniforms.uCloudWhite.value.set('#D1C4E9');
      skyMat.uniforms.uCloudGrey.value.set('#5E5478');
    } else {
      skyMat.uniforms.uCloudWhite.value.set('#FAF9F2');
      skyMat.uniforms.uCloudGrey.value.set('#DDD9CE');
    }
  }, [skyMood, skyMat]);

  useFrame((state) => {
    skyMat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh material={skyMat} name="PainterlySkyDome">
      <sphereGeometry args={[320, 32, 24]} />
    </mesh>
  );
}
