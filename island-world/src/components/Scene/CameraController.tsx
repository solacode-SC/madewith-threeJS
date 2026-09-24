import { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import gsap from 'gsap'

export interface CameraControllerProps {
  mode: 'cinematic' | 'explore' | 'preset'
  presetTarget?: { position: [number, number, number]; lookAt: [number, number, number] }
  onModeChange?: (mode: string) => void
}

export default function CameraController({
  mode: initialMode,
  presetTarget,
  onModeChange
}: CameraControllerProps) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  
  const [currentMode, setCurrentMode] = useState(initialMode)
  
  useEffect(() => {
    setCurrentMode(initialMode)
  }, [initialMode])
  
  useEffect(() => {
    // Initial camera position
    camera.position.set(3, 2.5, 6)
  }, [camera])

  useEffect(() => {
    if (currentMode === 'preset' && presetTarget && controlsRef.current) {
      const controls = controlsRef.current
      
      const tl = gsap.timeline({
        onComplete: () => {
          setCurrentMode('explore')
          if (onModeChange) onModeChange('explore')
        }
      })
      
      tl.to(camera.position, {
        x: presetTarget.position[0],
        y: presetTarget.position[1],
        z: presetTarget.position[2],
        duration: 2,
        ease: 'power2.inOut'
      }, 0)
      
      tl.to(controls.target, {
        x: presetTarget.lookAt[0],
        y: presetTarget.lookAt[1],
        z: presetTarget.lookAt[2],
        duration: 2,
        ease: 'power2.inOut'
      }, 0)
    }
  }, [currentMode, presetTarget, camera.position, onModeChange])
  
  const basePosition = useRef(new THREE.Vector3(3, 2.5, 6))

  useFrame((state) => {
    if (currentMode === 'cinematic' && controlsRef.current) {
      const time = state.clock.getElapsedTime()
      camera.position.x += Math.sin(time * 0.1) * 0.001
      camera.position.y += Math.sin(time * 0.15) * 0.0005
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 0.5, 0]}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={18}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI / 2 - 0.1}
      minAzimuthAngle={-Math.PI * (120/180)}
      maxAzimuthAngle={Math.PI * (120/180)}
      autoRotate={false}
      enableZoom={true}
      enabled={currentMode !== 'cinematic'}
    />
  )
}
