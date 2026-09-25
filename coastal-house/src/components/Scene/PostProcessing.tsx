import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.22}
        luminanceThreshold={0.88}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.12} darkness={0.32} />
    </EffectComposer>
  );
}
