import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

export default function PainterlyPostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.18}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.28} darkness={0.22} />
    </EffectComposer>
  );
}
