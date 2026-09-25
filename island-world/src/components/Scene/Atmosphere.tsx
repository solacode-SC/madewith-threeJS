import * as THREE from 'three'
import { useMemo } from 'react'

export default function Atmosphere() {
  const shaderArgs = useMemo(() => {
    return {
      uniforms: {
        topColor: { value: new THREE.Color('#4a8a8a') },
        bottomColor: { value: new THREE.Color('#8abcbc') },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    }
  }, [])

  return (
    <>
      <fogExp2 attach="fog" args={['#9ac5c5', 0.008]} />
      <mesh>
        <sphereGeometry args={[100, 32, 32]} />
        <shaderMaterial attach="material" {...shaderArgs} />
      </mesh>
    </>
  )
}
