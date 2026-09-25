import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.28}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.12} darkness={0.3} />
    </EffectComposer>
  );
}
