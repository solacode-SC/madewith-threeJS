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
 * 1. Custom GLSL Hand-Painted Gouache & Watercolor Meadow Terrain Shader.
 * Supports Morning, Noon, Evening Sunset, and Starry Night modes + wet riverbanks + warm lantern ground glow.
 */
export function createPainterlyMeadowTerrainShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunlitLime: { value: new THREE.Color('#CEE26A') },
      uWarmMeadow: { value: new THREE.Color('#95C852') },
      uLushEmerald: { value: new THREE.Color('#64A446') },
      uDeepOlive: { value: new THREE.Color('#3E7034') },
      uForestShadow: { value: new THREE.Color('#294F24') },
      uDirtEdge: { value: new THREE.Color('#BFA882') },
      uInkGrassColor: { value: new THREE.Color('#1F3B1C') },
      uSunbeamTint: { value: new THREE.Color('#FFF8CC') },
      uSunbeamStrength: { value: 0.34 },
      uSunDir: { value: new THREE.Vector3(0.54, 0.72, -0.43).normalize() },
      uLanternGlowStrength: { value: 0.0 },
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
      uniform float uTime;
      uniform vec3 uSunlitLime;
      uniform vec3 uWarmMeadow;
      uniform vec3 uLushEmerald;
      uniform vec3 uDeepOlive;
      uniform vec3 uForestShadow;
      uniform vec3 uDirtEdge;
      uniform vec3 uInkGrassColor;
      uniform vec3 uSunbeamTint;
      uniform float uSunbeamStrength;
      uniform vec3 uSunDir;
      uniform float uLanternGlowStrength;

      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;

      ${NOISE_GLSL}

      float handInkedGrassMarks(vec2 worldXZ) {
        vec2 cellSize = vec2(2.15, 2.15);
        vec2 cellId = floor(worldXZ / cellSize);
        vec2 local = fract(worldXZ / cellSize) - 0.5;

        float rnd = hash21(cellId);
        if (rnd < 0.58) return 0.0;

        vec2 jitter = vec2(hash21(cellId + 7.1) - 0.5, hash21(cellId + 13.3) - 0.5) * 0.42;
        vec2 p = local - jitter;

        float blade1 = smoothstep(0.030, 0.010, abs(p.x + 0.09 + p.y * 0.15)) * smoothstep(0.15, 0.06, abs(p.y));
        float blade2 = smoothstep(0.028, 0.009, abs(p.x - 0.01 - p.y * 0.08)) * smoothstep(0.18, 0.07, abs(p.y - 0.02));
        float blade3 = smoothstep(0.030, 0.010, abs(p.x - 0.10 + p.y * 0.18)) * smoothstep(0.14, 0.05, abs(p.y + 0.01));

        return clamp(blade1 + blade2 + blade3, 0.0, 1.0);
      }

      void main() {
        vec2 xz = vWorldPos.xz;
        float distFromCenter = length(xz);

        // 1. Directional Gouache Brushstrokes
        mat2 brushRot = mat2(0.82, -0.57, 0.57, 0.82);
        vec2 strokeCoord = brushRot * xz;
        float broadWash = fbmBrush(strokeCoord * 0.046);
        float mediumBrush = fbmBrush(strokeCoord * vec2(0.18, 0.09) + vec2(3.4, 1.9));
        float fineBristle = noise2D(strokeCoord * vec2(0.75, 0.24));
        float stippleDab = noise2D(xz * 0.55 + vec2(mediumBrush * 1.8));

        float pigment = broadWash * 0.50 + mediumBrush * 0.34 + fineBristle * 0.16;
        float outerHillFactor = smoothstep(105.0, 220.0, distFromCenter);

        vec3 col = uDeepOlive;
        col = mix(col, uLushEmerald, smoothstep(0.22, 0.42, pigment));
        col = mix(col, uWarmMeadow, smoothstep(0.44, 0.62, pigment));
        col = mix(col, uSunlitLime, smoothstep(0.63, 0.80, pigment + outerHillFactor * 0.10));

        // Expressive gouache dab highlights & olive-moss shadow dabs
        float highlightDab = smoothstep(0.68, 0.84, stippleDab) * smoothstep(0.42, 0.72, mediumBrush);
        float shadowDab = smoothstep(0.70, 0.86, 1.0 - stippleDab) * (1.0 - smoothstep(0.35, 0.65, broadWash));
        col = mix(col, uSunlitLime * 1.08, highlightDab * 0.50);
        col = mix(col, uForestShadow, shadowDab * 0.44);

        // 2. Directional Sunlight / Moonlight
        float ndl = dot(normalize(vNormal), normalize(uSunDir)) * 0.5 + 0.5;
        float celSlope = smoothstep(0.34, 0.68, ndl);
        col = mix(col * 0.80, mix(col * 1.06, uSunlitLime, 0.24), celSlope);

        // 3. Diagonal Sunbeam Bands & Slow Cloud Shadow Drift
        float beamCoord = (xz.x * 0.72 + xz.y * 0.69) * 0.085 - uTime * 0.04;
        float sunbeamWave = sin(beamCoord) * 0.5 + 0.5;
        float sunbeamBand = smoothstep(0.54, 0.86, sunbeamWave) * (1.0 - outerHillFactor * 0.45);
        col = mix(col, mix(col, uSunbeamTint, 0.42), sunbeamBand * uSunbeamStrength);

        float cloudShadowNoise = fbmBrush(xz * 0.018 + vec2(uTime * 0.008, -uTime * 0.005));
        float cloudShadowMask = smoothstep(0.58, 0.76, cloudShadowNoise);
        col = mix(col, uDeepOlive * 0.76, cloudShadowMask * 0.28);

        // 4. Winding River Channel & Wet Stone Banks
        float riverCenterX = 36.0 + sin(xz.y * 0.022) * 12.0 + cos(xz.y * 0.011 - 0.6) * 6.5;
        float riverHalfW = 5.2 + sin(xz.y * 0.035 + 1.1) * 0.65;
        float riverDist = abs(xz.x - riverCenterX);
        float bankMask = 1.0 - smoothstep(riverHalfW - 0.4, riverHalfW + 3.4, riverDist);
        float pebbleTex = noise2D(xz * 2.8);
        vec3 wetBankCol = mix(uDirtEdge * 0.78, vec3(0.45, 0.48, 0.44), pebbleTex * 0.5);
        col = mix(col, wetBankCol, bankMask * 0.78);

        // 5. Hand-Inked Grass Hatching Marks across the pastures
        float grassInk = handInkedGrassMarks(xz) * (1.0 - bankMask);
        col = mix(col, uInkGrassColor, grassInk * 0.65);

        // 6. Warm Golden Village Lantern Ground Glow in Evening & Night Modes
        if (uLanternGlowStrength > 0.01) {
          float mainLaneDist = min(abs(xz.x - -1.5), abs(xz.x - 58.0));
          float crossLaneDist = min(
            min(abs(xz.y - -11.0), abs(xz.y - 12.0)),
            min(abs(xz.y - -56.0), abs(xz.y - 58.0))
          );
          float laneProximity = exp(-pow(min(mainLaneDist, crossLaneDist) * 0.14, 2.0));
          float lanternSpacing = sin(xz.x * 0.35) * cos(xz.y * 0.35) * 0.5 + 0.5;
          float warmPool = laneProximity * (0.45 + 0.55 * lanternSpacing) * (1.0 - smoothstep(95.0, 145.0, distFromCenter));
          col += vec3(1.0, 0.68, 0.28) * warmPool * uLanternGlowStrength * 0.42;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/**
 * 2. Custom GLSL Animated Anime River Water Shader (Studio Ghibli / Makoto Shinkai style).
 * Features flowing water currents, cel-shaded foam ribbons, riverbank whitewater,
 * swirling wakes around bridge piers, and sparkling sun/moon/lantern reflections.
 */
export function createAnimeRiverWaterShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    uniforms: {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color('#1E7A8C') },
      uShallowColor: { value: new THREE.Color('#58C4D0') },
      uFoamColor: { value: new THREE.Color('#F4FCFA') },
      uShimmerColor: { value: new THREE.Color('#FFFAD6') },
      uLanternGlow: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        // Gentle animated surface wave ripples
        float wave = sin(worldPos.z * 0.55 - uTime * 3.6) * 0.045
                   + cos(worldPos.x * 0.95 + uTime * 2.8) * 0.025;
        worldPos.y += wave;
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uFoamColor;
      uniform vec3 uShimmerColor;
      uniform float uLanternGlow;

      varying vec2 vUv;
      varying vec3 vWorldPos;

      ${NOISE_GLSL}

      void main() {
        // vUv.x: 0 (west bank) -> 0.5 (center channel) -> 1 (east bank)
        // vUv.y: 0 -> 1 along river length
        float bankDist = abs(vUv.x - 0.5) * 2.0;

        // Soft organic shoreline feathering
        float shoreNoise = (noise2D(vWorldPos.xz * 0.8 + vec2(0.0, -uTime * 0.4)) - 0.5) * 0.08;
        float effBank = bankDist + shoreNoise;
        float edgeAlpha = 1.0 - smoothstep(0.88, 0.99, effBank);
        if (edgeAlpha < 0.02) discard;

        // 1. Depth Color Gradient (deep emerald-teal center to crystal turquoise shallows)
        float depthFactor = smoothstep(0.0, 0.82, effBank);
        vec3 col = mix(uDeepColor, uShallowColor, depthFactor * 0.85);

        // 2. Animated Flowing Current Ribbons (scrolling downstream with uTime)
        vec2 flowUv1 = vec2(vUv.x * 7.5 + sin(vUv.y * 18.0 - uTime * 1.2) * 0.18, vUv.y * 32.0 - uTime * 1.45);
        vec2 flowUv2 = vec2(vUv.x * 12.0 - cos(vUv.y * 24.0 - uTime * 0.9) * 0.14, vUv.y * 46.0 - uTime * 1.95);

        float current1 = fbmBrush(flowUv1);
        float current2 = noise2D(flowUv2);

        // Cel-shaded anime water ripple bands
        float rippleBand = smoothstep(0.56, 0.62, current1) * (1.0 - smoothstep(0.68, 0.74, current1));
        float fineStreak = smoothstep(0.68, 0.74, current2) * (1.0 - effBank * 0.5);

        col = mix(col, mix(uShallowColor, uFoamColor, 0.48), rippleBand * 0.55);
        col = mix(col, uFoamColor, fineStreak * 0.38);

        // 3. Whitewater Shoreline Foam along both Riverbanks
        float bankFoamWave = sin(vWorldPos.z * 1.4 - uTime * 3.8 + current1 * 4.0) * 0.5 + 0.5;
        float bankFoam = smoothstep(0.72, 0.88, effBank) * (0.45 + 0.55 * bankFoamWave);
        col = mix(col, uFoamColor, bankFoam * 0.72);

        // 4. Bridge Pier & Watermill Whitewater Wake Ripples
        float z = vWorldPos.z;
        float dBridge1 = abs(z - -56.0);
        float dBridge2 = abs(z - -11.0);
        float dBridge3 = abs(z - 12.0);
        float dBridge4 = abs(z - 58.0);
        float dMill = abs(z - 8.0);
        float minBridgeDist = min(min(dBridge1, dBridge2), min(dBridge3, min(dBridge4, dMill)));

        if (minBridgeDist < 5.5) {
          float wakeStrength = (1.0 - minBridgeDist / 5.5);
          float wakeFoam = smoothstep(0.48, 0.64, noise2D(vec2(vUv.x * 16.0, z * 1.8 - uTime * 4.5)));
          col = mix(col, uFoamColor, wakeFoam * wakeStrength * 0.68);
        }

        // 5. Sparkling Anime Sun / Moon Specular Diamonds on the Water Surface
        vec2 sparkleGrid = vWorldPos.xz * vec2(2.6, 1.8) + vec2(sin(uTime * 1.7), -uTime * 2.2);
        float sp1 = noise2D(sparkleGrid);
        float sp2 = noise2D(sparkleGrid * 1.9 - vec2(uTime * 1.3, uTime * 1.8));
        float sparkle = smoothstep(0.76, 0.84, sp1 * sp2 * 1.55) * (1.0 - effBank * 0.65);
        col = mix(col, uShimmerColor, sparkle * 0.92);

        // 6. Warm Golden Bridge Lantern Water Reflections in Evening & Night Modes
        if (uLanternGlow > 0.05 && minBridgeDist < 12.0) {
          float lanternFalloff = (1.0 - minBridgeDist / 12.0);
          float rippleReflect = sin(vWorldPos.z * 3.5 - uTime * 5.0 + vUv.x * 12.0) * 0.5 + 0.5;
          col += vec3(1.0, 0.72, 0.30) * lanternFalloff * rippleReflect * uLanternGlow * 0.55;
        }

        gl_FragColor = vec4(col, edgeAlpha * 0.94);
      }
    `,
  });
}

/**
 * 3. Custom GLSL Hand-Painted Country Dirt Road & Courtyard Path Shader.
 */
export function createHandPaintedRoadShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    uniforms: {
      uCenterColor: { value: new THREE.Color('#E3D3B4') },
      uRutColor: { value: new THREE.Color('#C4AE88') },
      uVergeColor: { value: new THREE.Color('#98B85C') },
      uPebbleInk: { value: new THREE.Color('#4A3E30') },
      uBrightness: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCenterColor;
      uniform vec3 uRutColor;
      uniform vec3 uVergeColor;
      uniform vec3 uPebbleInk;
      uniform float uBrightness;

      varying vec2 vUv;
      varying vec3 vWorldPos;

      ${NOISE_GLSL}

      void main() {
        float distFromCenter = abs(vUv.x - 0.5) * 2.0;

        float brushEdge = (fbmBrush(vWorldPos.xz * 0.55) - 0.5) * 0.28;
        float effectiveDist = distFromCenter + brushEdge;

        float alpha = 1.0 - smoothstep(0.62, 0.98, effectiveDist);
        if (alpha < 0.02) discard;

        float rutMask = exp(-pow((distFromCenter - 0.36) * 5.5, 2.0));
        float wash = fbmBrush(vWorldPos.xz * 0.35);

        vec3 col = mix(uCenterColor, uRutColor, rutMask * 0.65 + (1.0 - wash) * 0.25);
        col = mix(col, uVergeColor, smoothstep(0.52, 0.92, effectiveDist) * 0.55);

        float pebble = smoothstep(0.84, 0.89, noise2D(vWorldPos.xz * 3.8));
        col = mix(col, uPebbleInk, pebble * 0.35);

        gl_FragColor = vec4(col * uBrightness, alpha * 0.95);
      }
    `,
  });
}

/**
 * 4. Custom GLSL Hand-Drawn Tree Canopy Foliage Shader.
 */
export function createCelFoliageShaderMaterial(
  topColor = '#B6E46E',
  midColor = '#68A846',
  shadowColor = '#3A702D',
  deepInkColor = '#1C3B18'
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTopColor: { value: new THREE.Color(topColor) },
      uMidColor: { value: new THREE.Color(midColor) },
      uShadowColor: { value: new THREE.Color(shadowColor) },
      uDeepInkColor: { value: new THREE.Color(deepInkColor) },
      uRimSunColor: { value: new THREE.Color('#EAF9A0') },
      uSunDir: { value: new THREE.Vector3(0.54, 0.74, -0.40).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = viewMatrix * worldPos;
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uShadowColor;
      uniform vec3 uDeepInkColor;
      uniform vec3 uRimSunColor;
      uniform vec3 uSunDir;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;

      ${NOISE_GLSL}

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewDir);

        vec2 leafUv = vWorldPos.xz * 0.52 + vec2(vWorldPos.y * 0.42);
        float brushDab = fbmBrush(leafUv);
        float fineLeaf = noise2D(leafUv * 2.6);

        float ndl = dot(n, normalize(uSunDir)) * 0.5 + 0.5;
        float lightVal = clamp(
          ndl * 0.66 + (n.y * 0.5 + 0.5) * 0.34 + (brushDab - 0.48) * 0.34 + (fineLeaf - 0.5) * 0.14,
          0.0,
          1.0
        );

        vec3 col = uDeepInkColor;
        col = mix(col, uShadowColor, smoothstep(0.20, 0.28, lightVal));
        col = mix(col, uMidColor, smoothstep(0.43, 0.52, lightVal));
        col = mix(col, uTopColor, smoothstep(0.66, 0.75, lightVal));

        float clusterInk1 =
          smoothstep(0.415, 0.435, lightVal) * (1.0 - smoothstep(0.435, 0.460, lightVal));
        float clusterInk2 =
          smoothstep(0.645, 0.665, lightVal) * (1.0 - smoothstep(0.665, 0.688, lightVal));
        col = mix(col, uDeepInkColor, (clusterInk1 * 0.55 + clusterInk2 * 0.35));

        float ndv = clamp(dot(n, v), 0.0, 1.0);
        float rim = (1.0 - smoothstep(0.15, 0.52, ndv)) * smoothstep(0.55, 0.90, ndl + n.y * 0.3);
        col = mix(col, uRimSunColor, rim * 0.38);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/**
 * 5. Custom GLSL Hand-Painted Perimeter Cloud Shader.
 */
export function createHandDrawnCloudMistShaderMaterial(
  topColor = '#FFFFFF',
  midColor = '#F4FAF4',
  shadowColor = '#C2D8D0',
  opacity = 0.82,
  minSafeDist = 18.0,
  maxSafeDist = 34.0
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
      uMinSafeDist: { value: minSafeDist },
      uMaxSafeDist: { value: maxSafeDist },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying float vCamDist;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        worldPos.x += sin(worldPos.z * 0.09 + uTime * 0.28) * 0.22;
        worldPos.y += cos(worldPos.x * 0.08 + uTime * 0.24) * 0.12;
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
      uniform float uOpacity;
      uniform float uMinSafeDist;
      uniform float uMaxSafeDist;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying float vCamDist;

      ${NOISE_GLSL}

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewDir);

        vec2 billowUv = vWorldPos.xz * 0.065 + vec2(uTime * 0.015, -uTime * 0.008);
        float brushNoise = fbmBrush(billowUv);
        float fineEdge = noise2D(billowUv * 3.2);

        vec3 sunDir = normalize(vec3(0.54, 0.74, -0.40));
        float ndl = dot(n, sunDir) * 0.5 + 0.5;
        float lightVal = clamp(ndl * 0.65 + (n.y * 0.5 + 0.5) * 0.35 + (brushNoise - 0.5) * 0.25, 0.0, 1.0);

        vec3 col = mix(uShadowColor, uMidColor, smoothstep(0.28, 0.52, lightVal));
        col = mix(col, uTopColor, smoothstep(0.55, 0.78, lightVal));

        float ndv = clamp(dot(n, v), 0.0, 1.0);
        float edgeMod = (brushNoise - 0.44) * 0.36 + (fineEdge - 0.5) * 0.14;
        float softAlpha = smoothstep(0.14, 0.52, ndv + edgeMod);

        float safeFade = smoothstep(uMinSafeDist, uMaxSafeDist, vCamDist);
        float alpha = softAlpha * uOpacity * safeFade;
        if (alpha < 0.02) discard;

        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

/**
 * 6. Soft Gaussian-Feathered Watercolor Mist Layer Shader.
 */
export function createFeatheredMistPlaneShaderMaterial(
  opacity = 0.42
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uMistColor: { value: new THREE.Color('#FAFCF8') },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying float vCamDist;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vec4 mvPos = viewMatrix * worldPos;
        vCamDist = length(mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uMistColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying float vCamDist;

      ${NOISE_GLSL}

      void main() {
        vec2 centered = (vUv - 0.5) * 2.0;
        float radialDistSq = dot(centered, centered);
        if (radialDistSq > 1.0) discard;
        float envelope = pow(1.0 - radialDistSq, 2.2);

        vec2 mistUv = vWorldPos.xz * 0.08 + vec2(uTime * 0.018, -uTime * 0.012);
        float mistNoise = fbmBrush(mistUv);
        float wisp = smoothstep(0.32, 0.74, mistNoise);

        float safeFade = smoothstep(10.0, 22.0, vCamDist);
        float alpha = envelope * wisp * uOpacity * safeFade;
        if (alpha < 0.01) discard;

        gl_FragColor = vec4(uMistColor, alpha);
      }
    `,
  });
}

/**
 * 7. Custom GLSL Diagonal Sunbeam / Moonbeam (God-Ray) Shader.
 */
export function createSunbeamGodRayShaderMaterial(
  beamColor = '#FFF8C4',
  opacity = 0.22
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBeamColor: { value: new THREE.Color(beamColor) },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vCamDist;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vCamDist = length(mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uBeamColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vCamDist;

      void main() {
        float across = sin(vUv.x * 3.14159265);
        across = pow(max(0.0, across), 2.4);

        float along = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.62, 1.0, vUv.y));
        float shimmer = 0.85 + 0.15 * sin(vUv.x * 14.0 + uTime * 0.55);
        float safeFade = smoothstep(12.0, 24.0, vCamDist);

        float alpha = across * along * shimmer * uOpacity * safeFade;
        if (alpha < 0.006) discard;

        gl_FragColor = vec4(uBeamColor, alpha);
      }
    `,
  });
}

/**
 * 8. Custom GLSL Anime Sky Dome Shader with Sun Disc, Sunset Horizon, Twinkling Starfield & Luminous Moon.
 */
export function createSkyDomeShaderMaterial(
  skyTop = '#CBE6D8',
  skyHorizon = '#F6F7E4'
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSkyTop: { value: new THREE.Color(skyTop) },
      uSkyHorizon: { value: new THREE.Color(skyHorizon) },
      uSunGlow: { value: new THREE.Color('#FFFBE0') },
      uSunDir: { value: new THREE.Vector3(0.54, 0.62, -0.42).normalize() },
      uStarIntensity: { value: 0.0 },
      uMoonIntensity: { value: 0.0 },
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
      uniform float uTime;
      uniform vec3 uSkyTop;
      uniform vec3 uSkyHorizon;
      uniform vec3 uSunGlow;
      uniform vec3 uSunDir;
      uniform float uStarIntensity;
      uniform float uMoonIntensity;
      varying vec3 vWorldPos;

      ${NOISE_GLSL}

      void main() {
        vec3 dir = normalize(vWorldPos);
        float elevation = clamp(dir.y, 0.0, 1.0);

        float paperWash = fbmBrush(dir.xz * 3.2 + vec2(dir.y * 1.8));
        float blend = smoothstep(0.0, 0.58, elevation + (paperWash - 0.5) * 0.08);
        vec3 col = mix(uSkyHorizon, uSkyTop, blend);

        vec3 sunDir = normalize(uSunDir);
        float sunDot = clamp(dot(dir, sunDir), 0.0, 1.0);

        // Radiant Sun or Moon Halo & Crisp Anime Celestial Disc
        col = mix(col, uSunGlow, pow(sunDot, 5.0) * 0.52);
        float celestialDisc = smoothstep(0.9965, 0.9982, sunDot);
        col = mix(col, vec3(1.0, 0.99, 0.92), celestialDisc * 0.92);

        // Twinkling Anime Starfield & Milky Way Band in Evening / Night Modes
        if (uStarIntensity > 0.01 && dir.y > 0.04) {
          float skyHeightFade = smoothstep(0.04, 0.28, dir.y);
          vec2 starUv = dir.xz / (dir.y + 0.35) * 95.0;
          vec2 cellId = floor(starUv);
          vec2 localUv = fract(starUv) - 0.5;

          float starSeed = hash21(cellId);
          if (starSeed > 0.88) {
            vec2 starOffset = vec2(hash21(cellId + 3.1) - 0.5, hash21(cellId + 8.7) - 0.5) * 0.55;
            float dist = length(localUv - starOffset);
            float twinkle = 0.55 + 0.45 * sin(uTime * (2.2 + starSeed * 3.5) + starSeed * 40.0);
            float starCore = smoothstep(0.14, 0.02, dist) * twinkle;
            vec3 starCol = mix(vec3(0.78, 0.88, 1.0), vec3(1.0, 0.95, 0.80), hash21(cellId + 19.4));
            col += starCol * starCore * uStarIntensity * skyHeightFade * 1.35;
          }

          // Subtle Milky Way Stardust Band
          float milkyBand = exp(-pow((dir.x * 0.7 + dir.z * 0.5) * 2.6, 2.0));
          float milkyNoise = fbmBrush(dir.xz * 6.5);
          col += vec3(0.32, 0.48, 0.78) * milkyBand * milkyNoise * uStarIntensity * skyHeightFade * 0.22;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
