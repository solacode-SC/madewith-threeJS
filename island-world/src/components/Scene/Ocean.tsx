import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

// Function to calculate a gentle wave height
float calculateWave(vec2 position, float time) {
    float wave = sin(position.x * 2.0 + time * 0.5) * 0.02;
    wave += sin(position.y * 3.0 - time * 0.4) * 0.015;
    wave += sin((position.x + position.y) * 1.5 + time * 0.3) * 0.025;
    return wave;
}

// Simple normal calculation based on neighbors
vec3 calculateNormal(vec2 position, float time) {
    float h0 = calculateWave(position, time);
    float h1 = calculateWave(position + vec2(0.1, 0.0), time);
    float h2 = calculateWave(position + vec2(0.0, 0.1), time);
    
    vec3 v1 = vec3(0.1, 0.0, h1 - h0); // local space X axis step
    vec3 v2 = vec3(0.0, 0.1, h2 - h0); // local space Y axis step
    
    return normalize(cross(v1, v2));
}

void main() {
    vUv = uv;
    
    vec3 pos = position;
    // Apply displacement (Z axis since PlaneGeometry is created on XY plane)
    float elevation = calculateWave(pos.xy, uTime);
    pos.z += elevation; 
    
    vPosition = pos;
    vNormal = calculateNormal(pos.xy, uTime);
    
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uSunDirection;
uniform vec3 uWaterColor;
uniform vec3 uDeepColor;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

// Noise function for micro-surface normal perturbation (shimmering)
vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

void main() {
    // Basic setup
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);
    
    // Micro normal perturbation for shimmering
    vec2 noiseUv = vWorldPosition.xz * 0.5 + uTime * 0.1;
    float n1 = noise(noiseUv * 2.0);
    float n2 = noise(noiseUv * 4.0 - uTime * 0.2);
    
    // Final local normal with perturbation
    vec3 finalNormal = normalize(normal + vec3(n1 * 0.05, n2 * 0.05, 0.0));
    
    // Transform local normal roughly to world space (plane is rotated -90 deg on X)
    vec3 worldNormal = normalize(vec3(finalNormal.x, finalNormal.z, -finalNormal.y)); 
    
    // Fresnel effect
    float fresnel = dot(viewDirection, worldNormal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    // Specular highlight (Blinn-Phong)
    vec3 halfVector = normalize(uSunDirection + viewDirection);
    float specularPhase = max(0.0, dot(worldNormal, halfVector));
    float specular = pow(specularPhase, 150.0) * 1.5; // High gloss
    
    // Depth-based color (simulate shallow vs deep based on distance from center origin)
    float distFromCenter = length(vWorldPosition.xz);
    float depthFactor = smoothstep(10.0, 80.0, distFromCenter);
    vec3 albedo = mix(uWaterColor, uDeepColor, depthFactor);
    
    // Combine lighting
    vec3 finalColor = albedo + vec3(specular) + fresnel * vec3(0.3, 0.5, 0.6);
    
    // Transparency mapping (fades at edges to blend with background, and more transparent near shore)
    float alpha = mix(0.7, 0.95, depthFactor); // More transparent near island
    alpha *= smoothstep(100.0, 80.0, distFromCenter); // Fade out at extreme edges (radius 80 to 100)
    
    gl_FragColor = vec4(finalColor, alpha);
    
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export default function Ocean() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // upper-left-front sun direction
  const sunDirection = useMemo(() => new THREE.Vector3(-1, 1, 1).normalize(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDirection: { value: sunDirection },
      uWaterColor: { value: new THREE.Color('#7dd3c0') },
      uDeepColor: { value: new THREE.Color('#5cb8b2') },
    }),
    [sunDirection]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * 0.5; // Slow wave animation
    }
  });

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      receiveShadow
    >
      <planeGeometry args={[200, 200, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
}
