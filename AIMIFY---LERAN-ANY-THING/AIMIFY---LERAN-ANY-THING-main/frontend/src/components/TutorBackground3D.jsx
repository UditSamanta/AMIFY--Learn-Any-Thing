import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Icosahedron } from '@react-three/drei'

function MorphingShape() {
  const meshRef = useRef()

  // Slow rotation and gentle pulsing scale
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      // Rotate slowly on all axes
      meshRef.current.rotation.x += 0.001
      meshRef.current.rotation.y += 0.001
      meshRef.current.rotation.z += 0.001
      
      // Gentle pulse between 1.8 and 2.2
      const scale = 2 + Math.sin(t * 0.5) * 0.2
      meshRef.current.scale.set(scale, scale, scale)
    }
  })

  // Icosahedron with detail = 2 yields a complex enough geodesic sphere look
  return (
    <Icosahedron ref={meshRef} args={[1, 2]}>
      <meshBasicMaterial 
        color="#FF6600" 
        wireframe={true} 
        transparent={true} 
        opacity={0.15} 
      />
    </Icosahedron>
  )
}

export default function TutorBackground3D() {
  return (
    <div 
      className="absolute top-0 right-0 w-[40%] h-full z-0 pointer-events-none overflow-hidden"
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <MorphingShape />
      </Canvas>
    </div>
  )
}
