import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, Text } from '@react-three/drei'

function OrbitingOrb({ name, radius, orbitRadius, speed, yOffset }) {
  const groupRef = useRef()
  const meshRef = useRef()

  // Orbit animation + bounce
  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      // Orbital rotation
      groupRef.current.position.x = Math.cos(t * speed) * orbitRadius
      groupRef.current.position.z = Math.sin(t * speed) * orbitRadius
      
      // Gentle bounce on Y axis
      groupRef.current.position.y = yOffset + Math.sin(t * 2 + orbitRadius) * 0.2
    }

    if (meshRef.current) {
      // Slow object rotation
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
          emissiveIntensity={0.8 + Math.random() * 0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Agent Label floating above orb */}
      <Text 
        position={[0, radius + 0.4, 0]}
        fontSize={0.25}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name}
      </Text>
    </group>
  )
}

export default function AgentOrbs3D() {
  const agents = [
    { name: "Diagnostic", orbitRadius: 3.5, speed: 0.3, yOffset: 0.5, radius: 0.4 },
    { name: "Pathway", orbitRadius: 4.5, speed: 0.2, yOffset: -0.3, radius: 0.45 },
    { name: "Tutor", orbitRadius: 3.0, speed: 0.4, yOffset: 0.8, radius: 0.35 },
    { name: "Assessment", orbitRadius: 5.0, speed: 0.25, yOffset: -0.5, radius: 0.5 },
    { name: "Adaptation", orbitRadius: 4.0, speed: 0.35, yOffset: 0.2, radius: 0.38 },
  ]

  return (
    <div className="w-full absolute inset-0 -z-10 h-[500px] top-1/2 -translate-y-1/2 pointer-events-none opacity-80 mix-blend-screen overflow-hidden">
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }} gl={{ alpha: true }}>
        <fog attach="fog" args={['#FFFFFF', 5, 15]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#FFFFFF" />
        
        {agents.map((agent) => (
          <OrbitingOrb 
            key={agent.name}
            name={agent.name}
            radius={agent.radius}
            orbitRadius={agent.orbitRadius}
            speed={agent.speed}
            yOffset={agent.yOffset}
          />
        ))}
      </Canvas>
    </div>
  )
}
