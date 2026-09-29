import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

export default function PainterlyPostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.22}
        luminanceThreshold={0.86}
        luminanceSmoothing={0.42}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.22} darkness={0.24} />
    </EffectComposer>
  );
}
