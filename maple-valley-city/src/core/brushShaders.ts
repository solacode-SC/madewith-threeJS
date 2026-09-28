import * as THREE from 'three';

const NOISE_GLSL = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbmBrush(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += amp * noise2D(p);
      p = rot * p * 2.02 + vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return v;
  }
`;

/**
 * 1. Custom GLSL Watercolor Brush Cloud Shader Material.
 * Produces ultra-smooth, hand-painted brush clouds with domain-warped FBM edges,
 * warm sunlit rice-paper cream highlights, and soft celadon-apricot under-washes.
 */
export function createBrushCloudShaderMaterial(
  topColor = '#FFFFFF',
  midColor = '#FBF1E1',
  shadowColor = '#D6DFD0',
  opacity = 0.92
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uTopColor: { value: new THREE.Color(topColor) },
      uMidColor: { value: new THREE.Color(midColor) },
      uShadowColor: { value: new THREE.Color(shadowColor) },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        worldPos.y += sin(worldPos.x * 0.18 + uTime * 0.45) * 0.14;
        vWorldPos = worldPos.xyz;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = viewMatrix * worldPos;
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uShadowColor;
      uniform float uOpacity;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      ${NOISE_GLSL}

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewDir);

        // Anisotropic horizontal brush-stroke coordinates in world space
        vec2 brushCoord = vWorldPos.xz * vec2(0.14, 0.22) + vec2(uTime * 0.025, 0.0);
        vec2 q = vec2(
          fbmBrush(brushCoord),
          fbmBrush(brushCoord + vec2(5.2, 1.3))
        );
        float strokePattern = fbmBrush(brushCoord + 1.65 * q);

        // Smooth vertical watercolor wash across the cloud volume
        float heightFactor = clamp(n.y * 0.5 + 0.5 + (strokePattern - 0.5) * 0.28, 0.0, 1.0);

        vec3 col = mix(uShadowColor, uMidColor, smoothstep(0.10, 0.56, heightFactor));
        col = mix(col, uTopColor, smoothstep(0.46, 0.90, heightFactor));

        // Feathered brush-tip edge fade using view dot normal + domain-warped FBM
        float ndv = clamp(dot(n, v), 0.0, 1.0);
        float softSilhouette = smoothstep(0.08, 0.62, ndv + (strokePattern - 0.45) * 0.32);

        // Subtle watercolor wet-pigment rim contour
        float wetEdge = smoothstep(0.20, 0.34, softSilhouette) * (1.0 - smoothstep(0.34, 0.54, softSilhouette));
        col = mix(col, uShadowColor * 0.90, wetEdge * 0.25);

        float alpha = softSilhouette * uOpacity;
        if (alpha < 0.02) discard;

        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

/**
 * 2. Custom GLSL Shanshui Watercolor Mountain Shader Material.
 * Matches the celadon-sage & misty olive mountain peaks in the reference painting,
 * complete with diagonal brush-wash ridges, misty base fade, and ink crest contour.
 */
export function createShanshuiMountainShaderMaterial(
  peakColor = '#9EAE90',
  midColor = '#BCC8AE',
  baseColor = '#EFE8D8'
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPeakColor: { value: new THREE.Color(peakColor) },
      uMidColor: { value: new THREE.Color(midColor) },
      uBaseColor: { value: new THREE.Color(baseColor) },
      uInkColor: { value: new THREE.Color('#5A6453') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uPeakColor;
      uniform vec3 uMidColor;
      uniform vec3 uBaseColor;
      uniform vec3 uInkColor;

      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;

      ${NOISE_GLSL}

      void main() {
        // Normalized mountain height (0 at valley base, 1 at summit peak)
        float h = clamp(vWorldPos.y / 25.0, 0.0, 1.0);

        // Diagonal shanshui brushwork (cunfa) ridge strokes matching the painting's left-to-right wash
        vec2 strokeUv = vec2(vWorldPos.x * 0.09 - vWorldPos.y * 0.06, vWorldPos.y * 0.11);
        float brushWash = fbmBrush(strokeUv);
        float fineStroke = fbmBrush(strokeUv * 2.8 + vec2(3.1, 1.7));

        // Base-to-peak watercolor wash
        vec3 col = mix(uBaseColor, uMidColor, smoothstep(0.08, 0.48, h + (brushWash - 0.5) * 0.18));
        col = mix(col, uPeakColor, smoothstep(0.42, 0.88, h + (fineStroke - 0.5) * 0.20));

        // Sunlit left slope highlight vs cool celadon right slope wash (matching reference painting!)
        vec3 lightDir = normalize(vec3(-0.65, 0.65, 0.38));
        float ndl = dot(normalize(vNormal), lightDir) * 0.5 + 0.5;
        col = mix(col * 0.88, col * 1.07, smoothstep(0.28, 0.76, ndl));

        // Diagonal brushstroke bands on the mountain face
        float ribBand = smoothstep(0.48, 0.68, fineStroke) * smoothstep(0.25, 0.85, h);
        col = mix(col, uPeakColor * 0.86, ribBand * 0.24);

        // Delicate sumi-e ink ridge contour near the summit
        float crestInk = smoothstep(0.74, 0.96, h) * (1.0 - abs(vNormal.y)) * 0.38;
        col = mix(col, uInkColor, crestInk);

        // Dissolve lower base smoothly into warm valley rice-paper mist
        float mistFade = smoothstep(0.04, 0.26, h);
        col = mix(uBaseColor, col, mistFade);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/**
 * 3. Custom GLSL Rice-Paper Watercolor Sky Dome Shader.
 */
export function createRicePaperSkyShaderMaterial(
  skyTop = '#FDF9EE',
  skyHorizon = '#F5EBDC'
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSkyTop: { value: new THREE.Color(skyTop) },
      uSkyHorizon: { value: new THREE.Color(skyHorizon) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHorizon;
      varying vec3 vWorldPos;

      ${NOISE_GLSL}

      void main() {
        vec3 dir = normalize(vWorldPos);
        float elevation = clamp(dir.y, 0.0, 1.0);

        // Subtle watercolor paper wash variation
        float paperWash = fbmBrush(dir.xz * 3.5 + vec2(dir.y * 2.0));
        float blend = smoothstep(0.0, 0.55, elevation + (paperWash - 0.5) * 0.08);

        vec3 col = mix(uSkyHorizon, uSkyTop, blend);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
