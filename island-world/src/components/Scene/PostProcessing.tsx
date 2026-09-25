import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.25}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.15} darkness={0.45} />
    </EffectComposer>
  );
}
