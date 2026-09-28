import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

export default function PainterlyPostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.26}
        luminanceThreshold={0.88}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.22} darkness={0.26} />
    </EffectComposer>
  );
}
