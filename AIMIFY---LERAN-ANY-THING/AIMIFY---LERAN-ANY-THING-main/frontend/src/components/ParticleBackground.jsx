import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 200 }) {
  const meshRef = useRef()

  // Generate particles only once on mount
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      // position from -5 to 5 horizontally, -5 to 5 vertically, -5 to 5 depth
      const x = (Math.random() - 0.5) * 10
      const y = (Math.random() - 0.5) * 10
      const z = (Math.random() - 0.5) * 10
      
      const speed = 0.005 + Math.random() * 0.01
      const size = 0.02 + Math.random() * 0.04
      
      // color distribution
      const isOrange = Math.random() < 0.2
      const color = isOrange ? new THREE.Color('#FF6600') : new THREE.Color('#FFFFFF')
      const opacity = isOrange ? 0.4 : 0.3

      temp.push({ x, y, z, speed, size, color, opacity })
    }
    return temp
  }, [count])

  // Create geometry and material
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), [])
  const instanceMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, depthWrite: false }),
  [])

  useFrame(() => {
    if (!meshRef.current) return
    
    const dummy = new THREE.Object3D()
    const colorObject = new THREE.Color()

    particles.forEach((particle, i) => {
      // Drift upward slowly
      particle.y += particle.speed

      // Reset to bottom when it exits top
      if (particle.y > 5) {
        particle.y = -5
      }

      // Apply transformations
      dummy.position.set(particle.x, particle.y, particle.z)
      dummy.scale.set(particle.size, particle.size, particle.size)
      dummy.updateMatrix()

      meshRef.current.setMatrixAt(i, dummy.matrix)
      
      // In InstancedMesh, colors are applied like this
      meshRef.current.setColorAt(i, particle.color)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.instanceColor.needsUpdate = true
  })

  // We use InstancedMesh for performance with many objects
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, instanceMaterial, count]} 
    />
  )
}

export default function ParticleBackground() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Particles count={200} />
      </Canvas>
    </div>
  )
}
