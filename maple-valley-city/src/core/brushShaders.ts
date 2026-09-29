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
 * 1. Custom GLSL High-Draw Anime Cumulonimbus & Watercolor Cloud Shader Material.
 * Produces crisp, multi-tiered Makoto Shinkai / Studio Ghibli style anime clouds with
 * cel-stepped billow highlights, warm apricot-rose midtones, periwinkle-azure shadows,
 * a luminous silver-lining rim contour, and a camera-proximity safety fade so clouds NEVER block the view.
 */
export function createBrushCloudShaderMaterial(
  topColor = '#FFFFFF',
  midColor = '#FFF1E0',
  shadowColor = '#B8CCE4',
  opacity = 0.96
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
      uDeepShadowColor: { value: new THREE.Color('#92AECF') },
      uRimGlowColor: { value: new THREE.Color('#FFFDF5') },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying float vCamDist;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        worldPos.y += sin(worldPos.x * 0.08 + uTime * 0.35) * 0.18;
        vWorldPos = worldPos.xyz;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = viewMatrix * worldPos;
        vCamDist = length(mvPos.xyz);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uShadowColor;
      uniform vec3 uDeepShadowColor;
      uniform vec3 uRimGlowColor;
      uniform float uOpacity;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying float vCamDist;
      varying vec2 vUv;

      ${NOISE_GLSL}

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewDir);

        // High-detail anime brush & billow FBM detail in world space
        vec2 billowCoord = vWorldPos.xz * vec2(0.065, 0.085) + vec2(uTime * 0.012, 0.0);
        vec2 q = vec2(
          fbmBrush(billowCoord),
          fbmBrush(billowCoord + vec2(4.1, 2.3))
        );
        float strokePattern = fbmBrush(billowCoord + 1.45 * q);
        float fineCrisp = noise2D(billowCoord * 3.8 + q * 2.0);

        // Directional anime sun illumination from upper-left-front
        vec3 sunDir = normalize(vec3(-0.48, 0.76, 0.44));
        float ndl = dot(n, sunDir) * 0.5 + 0.5;
        float lightVal = clamp(ndl * 0.68 + (n.y * 0.5 + 0.5) * 0.32 + (strokePattern - 0.48) * 0.28, 0.0, 1.0);

        // Crisp 4-band anime cel-shaded cumulonimbus color ramp
        vec3 col = uDeepShadowColor;
        col = mix(col, uShadowColor, smoothstep(0.22, 0.30, lightVal));
        col = mix(col, uMidColor, smoothstep(0.45, 0.54, lightVal));
        col = mix(col, uTopColor, smoothstep(0.66, 0.75, lightVal));

        // Subtle anime internal cloud-fold contour lines
        float foldLine = smoothstep(0.43, 0.46, lightVal) * (1.0 - smoothstep(0.46, 0.50, lightVal));
        col = mix(col, uShadowColor * 0.88, foldLine * 0.35);

        // Crisp anime cloud silhouette with hand-drawn billow edge
        float ndv = clamp(dot(n, v), 0.0, 1.0);
        float edgeNoise = (strokePattern - 0.42) * 0.32 + (fineCrisp - 0.5) * 0.12;
        float softSilhouette = smoothstep(0.06, 0.36, ndv + edgeNoise);

        // Luminous anime silver-lining rim highlight on sunlit upper edges
        float rim = (1.0 - smoothstep(0.18, 0.52, ndv)) * smoothstep(0.45, 0.85, ndl + n.y * 0.35);
        col = mix(col, uRimGlowColor, rim * 0.65);

        // Safety distance fade so clouds can NEVER cover or obstruct any camera view
        float viewSafeFade = smoothstep(28.0, 58.0, vCamDist);
        float alpha = softSilhouette * uOpacity * viewSafeFade;
        if (alpha < 0.03) discard;

        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

/**
 * 2. Custom GLSL Colorful Qinglü (Blue-Green) & Autumn Shanshui Mountain Shader Material.
 * Combines lush meadow-emerald bases, vibrant autumn maple persimmon/amber forested mid-slopes,
 * mineral jade & turquoise ridges, and azure-cobalt summits with sunlit golden highlights.
 */
export function createShanshuiMountainShaderMaterial(
  peakColor = '#3B7EA8',
  midColor = '#47997E',
  baseColor = '#58A65C'
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPeakColor: { value: new THREE.Color(peakColor) },
      uMidColor: { value: new THREE.Color(midColor) },
      uBaseColor: { value: new THREE.Color(baseColor) },
      uForestEmerald: { value: new THREE.Color('#3D8E52') },
      uAutumnCrimson: { value: new THREE.Color('#E85D32') },
      uAutumnAmber: { value: new THREE.Color('#F7A43B') },
      uMineralCobalt: { value: new THREE.Color('#4A72B2') },
      uSunGold: { value: new THREE.Color('#FFE59E') },
      uInkColor: { value: new THREE.Color('#2B3F46') },
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
      uniform vec3 uForestEmerald;
      uniform vec3 uAutumnCrimson;
      uniform vec3 uAutumnAmber;
      uniform vec3 uMineralCobalt;
      uniform vec3 uSunGold;
      uniform vec3 uInkColor;

      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;

      ${NOISE_GLSL}

      void main() {
        // Normalized mountain height (0 at valley green-land base, 1 at high summit peak)
        float h = clamp(vWorldPos.y / 44.0, 0.0, 1.0);

        // Diagonal shanshui brushwork (cunfa) ridge strokes + organic color patches
        vec2 strokeUv = vec2(vWorldPos.x * 0.055 - vWorldPos.y * 0.04, vWorldPos.y * 0.075 + vWorldPos.z * 0.035);
        float brushWash = fbmBrush(strokeUv);
        float fineStroke = fbmBrush(strokeUv * 2.6 + vec2(3.1, 1.7));
        float colorPatch = fbmBrush(vWorldPos.xz * 0.045 + vec2(vWorldPos.y * 0.05, 2.4));

        // 1. Base-to-Summit Multi-Color Qinglü Shanshui Gradient:
        // Lush Green Meadow Base -> Emerald Forest -> Turquoise-Jade Mid -> Azure-Cobalt Peak
        vec3 col = mix(uBaseColor, uForestEmerald, smoothstep(0.03, 0.24, h + (brushWash - 0.5) * 0.14));
        col = mix(col, uMidColor, smoothstep(0.22, 0.56, h + (brushWash - 0.5) * 0.18));
        col = mix(col, uPeakColor, smoothstep(0.50, 0.84, h + (fineStroke - 0.5) * 0.18));
        col = mix(col, uMineralCobalt, smoothstep(0.74, 0.96, h + (colorPatch - 0.5) * 0.15));

        // 2. Vibrant Autumn Maple Crimson & Golden-Amber Foliage Groves along Lower & Mid Slopes
        float autumnZone = smoothstep(0.06, 0.22, h) * (1.0 - smoothstep(0.48, 0.72, h));
        float crimsonPatch = smoothstep(0.52, 0.74, colorPatch) * autumnZone;
        float amberPatch = smoothstep(0.48, 0.72, fineStroke) * autumnZone;
        col = mix(col, uAutumnAmber, amberPatch * 0.58);
        col = mix(col, uAutumnCrimson, crimsonPatch * 0.62);

        // 3. Sunlit Left Slope Golden-Peach Wash vs Cool Mineral Blue-Jade Right Slope Shadow
        vec3 lightDir = normalize(vec3(-0.62, 0.66, 0.42));
        float ndl = dot(normalize(vNormal), lightDir) * 0.5 + 0.5;
        float celLight = smoothstep(0.32, 0.72, ndl);
        col = mix(col * 0.84, mix(col * 1.12, uSunGold, 0.22 * smoothstep(0.35, 0.9, h)), celLight);

        // 4. Crisp Diagonal Cunfa Brushstroke Texture Ridges on the Mountain Face
        float ribBand = smoothstep(0.50, 0.66, fineStroke) * smoothstep(0.18, 0.88, h);
        col = mix(col, uPeakColor * 0.82, ribBand * 0.25);

        // 5. Delicate Sumi-e Ink Ridge Contour near the Summit & Steep Cliffs
        float crestInk = smoothstep(0.68, 0.96, h) * (1.0 - abs(vNormal.y)) * 0.42;
        col = mix(col, uInkColor, crestInk);

        // 6. Blend the very bottom foot seamlessly into the outer Lush Green Land
        float baseBlend = smoothstep(0.0, 0.09, h);
        col = mix(uBaseColor, col, baseBlend);

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
