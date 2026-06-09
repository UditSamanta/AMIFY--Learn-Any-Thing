import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'

function OrbitingOrb({ radius, orbitRadius, speed, yOffset }) {
  const groupRef = useRef()
  const meshRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t * speed) * orbitRadius
      groupRef.current.position.z = Math.sin(t * speed) * orbitRadius
      groupRef.current.position.y = yOffset + Math.sin(t * 2 + orbitRadius) * 0.2
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.5
      meshRef.current.rotation.y = t * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      <Sphere ref={meshRef} args={[radius, 32, 32]}>
        <meshStandardMaterial 
          color="#FF9933"
          emissive="#FF6600"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </group>
  )
}

function Particles() {
  const count = 150
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate random positions
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30
      const y = (Math.random() - 0.5) * 20
      const z = (Math.random() - 0.5) * 15 - 5
      const speed = 0.5 + Math.random() * 0.8 // A bit faster drifting upward
      temp.push({ x, y, z, speed })
    }
    return temp
  }, [count])

  useFrame((state, delta) => {
    particles.forEach((p, i) => {
      p.y += p.speed * delta
      if (p.y > 10) p.y = -10 
      dummy.position.set(p.x, p.y, p.z)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} />
    </instancedMesh>
  )
}

export default function HeroBackground3D() {
  const orbs = [
    { orbitRadius: 3.5, speed: 0.3, yOffset: 0.5, radius: 0.4 },
    { orbitRadius: 4.5, speed: 0.2, yOffset: -0.3, radius: 0.45 },
    { orbitRadius: 3.0, speed: 0.4, yOffset: 0.8, radius: 0.35 },
    { orbitRadius: 5.0, speed: 0.25, yOffset: -0.5, radius: 0.5 },
    { orbitRadius: 4.0, speed: 0.35, yOffset: 0.2, radius: 0.38 },
  ]

  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-screen overflow-hidden">
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }} gl={{ alpha: true }}>
        <fog attach="fog" args={['#FFFFFF', 5, 15]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#FFFFFF" />
        {orbs.map((orb, i) => (
          <OrbitingOrb key={i} {...orb} />
        ))}
        <Particles />
      </Canvas>
    </div>
  )
}
