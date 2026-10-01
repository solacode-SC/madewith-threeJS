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

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise2D(p);
      p = rot * p * 2.02 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }
`;

/**
 * 1. HIGH-ART INSTANCED FLORA SHADER:
 * Features:
 * - 0ms CPU cost: All natural wind swaying computed in vertex shader
 * - Supports vertex colors and per-instance color variation
 * - Multi-tiered Gouache Cel Shading with brush-jittered terminator
 * - Signature Crisp Painted Rim Contour (fine gouache white/pale outline on petal edges)
 * - Radial petal vein brush striations
 * - Luminous translucent subsurface petal glow when backlit by the sun
 * - Distance fog perfectly matching the painting's atmospheric depth
 */
export function createInstancedFloraShaderMaterial(
  baseColorHex: string,
  darkRimHex: string
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: 1.0 },
      uWindDir: { value: new THREE.Vector2(0.85, 0.52).normalize() },
      uSunDir: { value: new THREE.Vector3(0.5, 0.8, -0.3).normalize() },
      uSunColor: { value: new THREE.Color('#FFFDF0') },
      uAmbientColor: { value: new THREE.Color('#BACDE0') },
      uBaseColor: { value: new THREE.Color(baseColorHex) },
      uDarkRimColor: { value: new THREE.Color(darkRimHex) },
      uEmissiveGlow: { value: 0.15 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uWindStrength;
      uniform vec2 uWindDir;
      uniform vec3 uSunDir;

      attribute vec3 color;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vInstanceColor;
      varying vec3 vVertexColor;
      varying vec2 vUv;
      varying float vHeight;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vHeight = position.y;
        vVertexColor = color;

        #ifdef USE_INSTANCING_COLOR
          vInstanceColor = instanceColor;
        #else
          vInstanceColor = vec3(1.0);
        #endif

        // Transform normal
        vNormal = normalize((modelMatrix * instanceMatrix * vec4(normal, 0.0)).xyz);

        // Instance world position
        vec4 localWorldPos = instanceMatrix * vec4(position, 1.0);
        vec4 worldPos = modelMatrix * localWorldPos;

        // Natural botanical wind physics:
        // Stem base stays rooted (y < 0.1), stem arcs smoothly, flower head bobs with harmonic gusts
        float stemFlex = smoothstep(0.05, 1.15, position.y);
        float swayFreq = uTime * 2.2 + worldPos.x * 0.38 + worldPos.z * 0.48;
        float wave = sin(swayFreq) * cos(swayFreq * 0.72 + 1.2);
        float gust = sin(uTime * 0.82 + worldPos.x * 0.18) * 0.32;
        float totalSway = (wave + gust) * stemFlex * uWindStrength * 0.22;

        worldPos.x += uWindDir.x * totalSway;
        worldPos.z += uWindDir.y * totalSway;
        worldPos.y -= abs(wave) * stemFlex * 0.045; // natural stem nod

        vWorldPos = worldPos.xyz;
        vec4 mvPos = viewMatrix * worldPos;
        vViewDir = normalize(-mvPos.xyz);

        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBaseColor;
      uniform vec3 uDarkRimColor;
      uniform vec3 uSunColor;
      uniform vec3 uAmbientColor;
      uniform vec3 uSunDir;
      uniform float uEmissiveGlow;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vInstanceColor;
      varying vec3 vVertexColor;
      varying vec2 vUv;
      varying float vHeight;
      varying vec3 vViewDir;

      ${NOISE_GLSL}

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewDir);

        // A. Hand-painted brush stipple on lighting terminator
        float brushJitter = (noise2D(vWorldPos.xz * 14.0 + vHeight * 8.0) - 0.5) * 0.14;
        float NdotL = dot(n, uSunDir) + brushJitter;

        // B. Multi-tiered Gouache Cel Light Stepping
        // Creates crisp, deliberate hand-painted tonal bands rather than plastic CGI gradients!
        float lightStep1 = smoothstep(-0.25, 0.08, NdotL);
        float lightStep2 = smoothstep(0.12, 0.55, NdotL);
        float celFactor = mix(0.42, 0.78, lightStep1);
        celFactor = mix(celFactor, 1.12, lightStep2);

        // C. Combine Base Material Tint with Per-Instance Jitter and Vertex Colors
        vec3 flowerColor = uBaseColor * vInstanceColor * vVertexColor;

        // Subtle dark core gradient toward flower center
        float centerFade = smoothstep(0.0, 0.38, vUv.y);
        flowerColor = mix(uDarkRimColor, flowerColor, centerFade);

        // D. Radial Petal Vein Brush Marks (hand-painted striations)
        if (vHeight > 0.6) {
          float veinNoise = noise2D(vec2(vUv.x * 32.0, vUv.y * 8.0));
          flowerColor *= (0.92 + veinNoise * 0.16);
        }

        // E. Signature Hand-Painted Rim Highlight (crisp pale painted contour on petal edges)
        float rim = 1.0 - max(0.0, dot(n, v));
        float paintedEdge = smoothstep(0.65, 0.94, rim) * smoothstep(0.5, 1.1, vHeight);
        vec3 paintedRimColor = mix(flowerColor, vec3(0.96, 0.98, 1.0), 0.72);

        // F. Subsurface Translucent Backlight Glow
        float backlight = max(0.0, dot(-v, uSunDir));
        float subSurface = pow(backlight, 2.5) * 0.35 * smoothstep(0.4, 1.2, vHeight);

        // G. Combine Final Gouache Lighting
        vec3 lit = flowerColor * (uAmbientColor * 0.78 + uSunColor * celFactor * 0.7);
        lit += flowerColor * (uEmissiveGlow + subSurface);
        lit = mix(lit, paintedRimColor, paintedEdge * 0.55);

        // H. Fine-Art Watercolor Paper Tooth
        float paperGrain = (noise2D(gl_FragCoord.xy * 0.75) - 0.5) * 0.035;
        lit += vec3(paperGrain);

        // I. Atmospheric Distance Fade (harmonized with sky and mountains)
        float dist = length(vWorldPos - cameraPosition);
        float fogFactor = smoothstep(52.0, 220.0, dist);
        vec3 fogColor = vec3(0.88, 0.91, 0.94);

        gl_FragColor = vec4(mix(lit, fogColor, fogFactor * 0.8), 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}

/**
 * 2. MASTERWORK GOUACHE INDIGO CANOPY SHADER:
 * Specifically tuned to render the deep, billowing, hand-painted indigo & cobalt crowns
 * of the sentinel trees in reference-art.jpg:
 * - 3-Tone Gouache Palette: Midnight ink shadow -> Royal cobalt -> Vibrant cerulean highlight
 * - Dappled brush-dab micro texture across foliage clumps
 * - Painted white/azure silhouette edge contour
 * - Gentle canopy breathing motion
 */
export function createIndigoCanopyShaderMaterial(foliageColorHex: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.5, 0.8, -0.3).normalize() },
      uSunColor: { value: new THREE.Color('#FFFDF0') },
      uAmbientColor: { value: new THREE.Color('#B6CCE4') },
      uCanopyColor: { value: new THREE.Color(foliageColorHex) },
      uDeepNavyShadow: { value: new THREE.Color('#0A152D') },
      uSkyRimColor: { value: new THREE.Color('#7BA4E2') },
      uHighlightDab: { value: new THREE.Color('#3B82F6') },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute vec3 color;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec3 vVertexColor;

      void main() {
        vVertexColor = color;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);

        // Natural organic canopy sway in the mountain breeze
        float sway = sin(worldPos.y * 0.45 + uTime * 1.15) * 0.09;
        worldPos.x += sway;
        worldPos.z += sway * 0.5;

        vWorldPos = worldPos.xyz;
        vec4 mvPos = viewMatrix * worldPos;
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uAmbientColor;
      uniform vec3 uCanopyColor;
      uniform vec3 uDeepNavyShadow;
      uniform vec3 uSkyRimColor;
      uniform vec3 uHighlightDab;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      varying vec3 vVertexColor;

      ${NOISE_GLSL}

      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewDir);

        // Dappled gouache brushmark jitter
        float brushJitter = (fbm(vWorldPos.xz * 2.8 + vWorldPos.y * 1.5) - 0.5) * 0.28;
        float NdotL = dot(n, uSunDir) + brushJitter;

        // 3-Tone Gouache Cel Stepping
        float shadowStep = smoothstep(-0.25, 0.15, NdotL);
        float highlightStep = smoothstep(0.3, 0.72, NdotL);

        vec3 tone = mix(uDeepNavyShadow, uCanopyColor, shadowStep);
        tone = mix(tone, uHighlightDab, highlightStep * 0.85);

        // Apply vertex tip brightness
        tone *= vVertexColor;

        // Signature Painted Silhouette Rim Contour (the pale outline along tree edges in reference art)
        float rim = 1.0 - max(0.0, dot(n, v));
        float rimStep = smoothstep(0.62, 0.94, rim);
        tone = mix(tone, uSkyRimColor, rimStep * 0.65);

        vec3 lit = tone * (uAmbientColor * 0.85 + uSunColor * max(0.0, NdotL) * 0.42);

        // Atmospheric Distance Haze
        float dist = length(vWorldPos - cameraPosition);
        float fogFactor = smoothstep(55.0, 240.0, dist);
        vec3 fogColor = vec3(0.86, 0.90, 0.93);

        gl_FragColor = vec4(mix(lit, fogColor, fogFactor * 0.78), 1.0);
      }
    `,
  });
}

/**
 * 3. AUTHENTIC BIRCH TRUNK SHADER:
 * Renders the pale cream/ash trunks with subtle wood rings and painted bark brushwork.
 */
export function createTrunkShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: { value: new THREE.Vector3(0.5, 0.8, -0.3).normalize() },
      uSunColor: { value: new THREE.Color('#FFFDF0') },
      uAmbientColor: { value: new THREE.Color('#B6CCE4') },
      uTrunkBase: { value: new THREE.Color('#ECE7DD') },
      uTrunkKnot: { value: new THREE.Color('#6B6455') },
    },
    vertexShader: /* glsl */ `
      attribute vec3 color;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vVertexColor;

      void main() {
        vVertexColor = color;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uAmbientColor;
      uniform vec3 uTrunkBase;
      uniform vec3 uTrunkKnot;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vVertexColor;

      ${NOISE_GLSL}

      void main() {
        vec3 n = normalize(vNormal);
        float NdotL = dot(n, uSunDir);
        float diffuse = max(0.0, (NdotL + 0.3) / 1.3);

        vec3 barkColor = uTrunkBase * vVertexColor;

        // Subtle birch bark grain and rings
        float ring = noise2D(vec2(vWorldPos.y * 8.0, vWorldPos.x * 2.0));
        barkColor = mix(barkColor, uTrunkKnot, smoothstep(0.72, 0.92, ring) * 0.5);

        vec3 lit = barkColor * (uAmbientColor * 0.78 + uSunColor * diffuse * 0.7);

        // Distance fog
        float dist = length(vWorldPos - cameraPosition);
        float fogFactor = smoothstep(55.0, 240.0, dist);
        vec3 fogColor = vec3(0.86, 0.90, 0.93);

        gl_FragColor = vec4(mix(lit, fogColor, fogFactor * 0.75), 1.0);
      }
    `,
  });
}

/**
 * 4. TIERED SAGE HILLS & CHALKY WINDING PATH SHADER:
 * Reproduces the masterwork landscape in reference-art.jpg:
 * - Winding ivory/cream sandstone chalk path with painted dabs
 * - Smooth, elegant tiered sage, celadon, chartreuse, and olive contour bands
 * - Hand-painted gouache stipple texture
 */
export function createMeadowTerrainShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.5, 0.8, -0.3).normalize() },
      uSunColor: { value: new THREE.Color('#FFFDF0') },
      uAmbientColor: { value: new THREE.Color('#CADCEE') },
      uSageGreen: { value: new THREE.Color('#98AD85') },
      uCeladon: { value: new THREE.Color('#BFD1B3') },
      uChartreuse: { value: new THREE.Color('#D3E2B6') },
      uOliveDeep: { value: new THREE.Color('#647850') },
      uChalkPath: { value: new THREE.Color('#F6F2E7') },
      uChalkPathEdge: { value: new THREE.Color('#DED4BC') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
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
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uAmbientColor;
      uniform vec3 uSageGreen;
      uniform vec3 uCeladon;
      uniform vec3 uChartreuse;
      uniform vec3 uOliveDeep;
      uniform vec3 uChalkPath;
      uniform vec3 uChalkPathEdge;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      ${NOISE_GLSL}

      float getPathDistance(vec2 p) {
        float z = p.y;
        float pathCenterX = 0.5 + sin(z * 0.08) * 1.4 + cos(z * 0.035) * 0.8;
        return abs(p.x - pathCenterX);
      }

      void main() {
        vec3 n = normalize(vNormal);
        float NdotL = dot(n, uSunDir);
        float diffuse = max(0.0, (NdotL + 0.35) / 1.35);

        // Painterly tiered contour bands on the rolling hills
        float contourNoise = fbm(vWorldPos.xz * 0.038);
        float heightBand = vWorldPos.y * 0.16 + contourNoise * 0.32;
        float bandStep = fract(heightBand * 2.4);

        // Mix rolling hill grass tones (Sage, Celadon, Chartreuse, Olive)
        vec3 grassColor = mix(uSageGreen, uCeladon, smoothstep(0.18, 0.82, bandStep));
        if (n.y > 0.86) {
          grassColor = mix(grassColor, uChartreuse, 0.42);
        } else {
          grassColor = mix(grassColor, uOliveDeep, 0.52);
        }

        // Impasto gouache stipple
        float stipple = noise2D(vWorldPos.xz * 1.6) * 0.07 - 0.035;
        grassColor += vec3(stipple);

        // Blend with winding chalky earthen path
        float pathDist = getPathDistance(vWorldPos.xz);
        float pathMask = smoothstep(1.25, 0.3, pathDist);
        float pathEdgeMask = smoothstep(1.65, 0.95, pathDist);

        vec3 groundColor = grassColor;
        if (vWorldPos.z > -75.0) {
          // Soft dabbed edges of path
          float edgeNoise = noise2D(vWorldPos.xz * 2.5) * 0.15;
          groundColor = mix(groundColor, uChalkPathEdge, clamp(pathEdgeMask * 0.85 + edgeNoise, 0.0, 1.0));
          groundColor = mix(groundColor, uChalkPath, pathMask);
        }

        vec3 finalColor = groundColor * (uAmbientColor * 0.82 + uSunColor * diffuse);

        // Distance fog fade
        float dist = length(vWorldPos - cameraPosition);
        float fogFactor = smoothstep(45.0, 250.0, dist);
        vec3 fogColor = vec3(0.86, 0.90, 0.93);

        gl_FragColor = vec4(mix(finalColor, fogColor, fogFactor * 0.82), 1.0);
      }
    `,
  });
}

/**
 * 5. HORIZONTAL GOUACHE CLOUD BANDS SKY SHADER:
 * Recreates the horizontal brush sweeps of cream, soft slate grey, and pale blue-grey
 * from reference-art.jpg.
 */
export function createPainterlySkyMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTopColor: { value: new THREE.Color('#B4C6D8') },
      uMidColor: { value: new THREE.Color('#DFE6EC') },
      uCloudWhite: { value: new THREE.Color('#F9F8F2') },
      uCloudGrey: { value: new THREE.Color('#D8D5CB') },
      uHorizonColor: { value: new THREE.Color('#F6F4ED') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uCloudWhite;
      uniform vec3 uCloudGrey;
      uniform vec3 uHorizonColor;

      varying vec3 vWorldPos;
      varying vec2 vUv;

      ${NOISE_GLSL}

      void main() {
        vec3 dir = normalize(vWorldPos);
        float elevation = max(0.0, dir.y);

        // Base sky gradient: warm horizon cream -> mid dove grey -> top periwinkle slate
        vec3 skyGrad = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.32, elevation));
        skyGrad = mix(skyGrad, uTopColor, smoothstep(0.32, 1.0, elevation));

        // Horizontal gouache cloud sweeps
        float cloudY = elevation * 30.0;
        float cloudDrift = uTime * 0.012;
        float bandWave = sin(cloudY * 0.85 + dir.x * 2.2 + cloudDrift) * 0.5 + 0.5;
        float bandDetail = fbm(vec2(dir.x * 7.5 + cloudDrift * 0.4, cloudY * 1.4));

        float cloudAlpha = smoothstep(0.36, 0.74, bandWave * 0.68 + bandDetail * 0.42);
        cloudAlpha *= smoothstep(0.07, 0.28, elevation);

        vec3 cloudColor = mix(uCloudGrey, uCloudWhite, smoothstep(0.38, 0.82, bandDetail));
        vec3 finalColor = mix(skyGrad, cloudColor, cloudAlpha * 0.86);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
}
