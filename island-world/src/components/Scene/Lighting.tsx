import { useRef } from 'react'
import * as THREE from 'three'

export default function Lighting() {
  return (
    <>
      <directionalLight
        position={[-3, 5, 4]}
        color="#fff5e0"
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-bias={-0.001}
        shadow-radius={4}
      />
      <hemisphereLight
        args={['#87ceeb', '#f5e6c8', 0.4]}
      />
      <ambientLight
        color="#c8e8e8"
        intensity={0.3}
      />
    </>
  )
}
