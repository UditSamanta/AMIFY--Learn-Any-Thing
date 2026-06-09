import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Sphere, Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

/* ─── Layout constants ─── */
const Z_SPACING = -3       // depth_level spacing on Z axis
const X_SPACING = 3        // horizontal spacing between same-depth nodes
const NODE_RADIUS = 0.4

/* ─── Determine visual status for a concept ─── */
const resolveStatus = (concept, progressArray, currentIndex, concepts) => {
  // Current concept
  if (currentIndex != null && concepts[currentIndex]?.concept === concept.concept) {
    return 'CURRENT'
  }

  // Look up progress entry
  const prog = progressArray?.find(
    (p) => p.concept_name === concept.concept || p.concept_id === concept.concept
  )

  if (prog) {
    if (prog.status === 'PASSED') return 'PASSED'
    if (prog.status === 'TEACHING') return 'TEACHING'
    if (prog.status === 'SKIPPED') return 'SKIPPED'
    return prog.status || 'NOT_STARTED'
  }

  return 'NOT_STARTED'
}

/* ─── Build grid positions: depth → Z, same-depth → X ─── */
const calculatePositions = (concepts) => {
  const positions = {}
  if (!concepts?.length) return positions

  const byDepth = {}
  concepts.forEach((c) => {
    const d = c.depth_level || 1
    if (!byDepth[d]) byDepth[d] = []
    byDepth[d].push(c)
  })

  Object.entries(byDepth).forEach(([depth, nodes]) => {
    const z = (parseInt(depth) - 1) * Z_SPACING
    const totalWidth = (nodes.length - 1) * X_SPACING
    const startX = -totalWidth / 2

    nodes.forEach((c, i) => {
      positions[c.concept] = [startX + i * X_SPACING, 0, z]
    })
  })

  return positions
}

/* ═══════════════════════════════════════════════════════
   Animated Ring for Active Node
   ═══════════════════════════════════════════════════════ */
function AnimatedRing({ radius }) {
  const ringRef = useRef()

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.getElapsedTime() * 0.5
      ringRef.current.rotation.x = Math.PI / 2 // keep it flat initially, then rotate Y
    }
  })

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius + 0.15, 0.05, 16, 64]} />
      <meshStandardMaterial color="#FF6600" emissive="#FF6600" emissiveIntensity={1.5} />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════
   Particle Trails for Edges
   ═══════════════════════════════════════════════════════ */
function ParticleTrail({ start, end, speedOffset }) {
  const dotCount = 4
  const particlesRef = useRef()
  const vStart = useMemo(() => new THREE.Vector3(...start), [start])
  const vEnd = useMemo(() => new THREE.Vector3(...end), [end])

  useFrame((state) => {
    if (!particlesRef.current) return
    const t = (state.clock.elapsedTime * 0.5 + speedOffset) % 1

    particlesRef.current.children.forEach((child, i) => {
      // Offset each dot's position along the path 0 -> 1
      const progress = (t + i / dotCount) % 1
      child.position.lerpVectors(vStart, vEnd, progress)
    })
  })

  return (
    <group ref={particlesRef}>
      {Array.from({ length: dotCount }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#FF9933" />
        </mesh>
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   Single Concept Node — rendered inside R3F Canvas
   ═══════════════════════════════════════════════════════ */
function ConceptNode({ concept, position, status, onClick, fadeDelay }) {
  const meshRef = useRef()
  const matRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [opacity, setOpacity] = useState(0) // for fade-in

  // Staggered fade-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), fadeDelay)
    return () => clearTimeout(timer)
  }, [fadeDelay])

  // Per-frame animation (pulse, float, fade)
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    // Fade-in via material
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, opacity, 0.06)
    }

    if (status === 'CURRENT') {
      // Pulsing scale: 1 → 1.15 → 1 over ~2s (π rad/s)
      const s = 1 + Math.sin(t * Math.PI) * 0.15
      meshRef.current.scale.setScalar(s)
      if (matRef.current) {
        matRef.current.emissiveIntensity = 1 + Math.abs(Math.sin(t * 2)) * 1 // boost emission
      }
    } else if (status === 'PASSED') {
      // Gentle floating on Y ±0.1
      meshRef.current.position.y = position[1] + Math.sin(t * 1.2 + position[0]) * 0.1
      meshRef.current.scale.setScalar(1)
    } else {
      meshRef.current.position.y = position[1]
      meshRef.current.scale.setScalar(1)
    }
  })

  /* ── Visual properties by status ── */
  let color = '#4B5563'
  let emissive = '#000000'
  let wireframe = false
  let emissiveIntensity = 0
  let sizeScale = 1

  switch (status) {
    case 'NOT_STARTED':
      wireframe = true
      break
    case 'CURRENT':
      color = '#FF8533'
      emissive = '#FF6600'
      emissiveIntensity = 2.0 // cranked for bloom
      break
    case 'TEACHING':
      color = '#FF6600'
      emissive = '#FF6600'
      emissiveIntensity = 1.0
      break
    case 'PASSED':
      color = '#FF8533'
      emissive = '#FF8533'
      emissiveIntensity = 1.2 // slight glow
      break
    case 'SKIPPED':
      color = '#374151'
      sizeScale = 0.55
      wireframe = true
      break
    default:
      break
  }

  // Hover override
  if (hovered && status !== 'SKIPPED') {
    emissiveIntensity = Math.max(emissiveIntensity, 0.8)
    if (color === '#4B5563') color = '#9CA3AF'
  }

  return (
    <group position={position}>
      {/* Active ring indicator */}
      {status === 'CURRENT' && <AnimatedRing radius={NODE_RADIUS * sizeScale} />}

      {/* Sphere */}
      <Sphere
        ref={meshRef}
        args={[NODE_RADIUS * sizeScale, 32, 32]}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(concept)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          wireframe={wireframe}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0}
        />
      </Sphere>

      {/* Label above node */}
      <Text
        position={[0, NODE_RADIUS * sizeScale + 0.35, 0]}
        fontSize={0.22}
        color={
          hovered || status === 'CURRENT' || status === 'PASSED'
            ? '#FFFFFF'
            : '#9CA3AF'
        }
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        maxWidth={3}
        textAlign="center"
      >
        {concept.concept}
      </Text>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function ConceptGraph3D({
  concepts = [],
  progress = [],
  currentConceptIndex,
  onNodeClick = () => {},
}) {
  // Memoise positions
  const positions = useMemo(() => calculatePositions(concepts), [concepts])

  // Build connection lines — prerequisite-based, falling back to depth heuristic
  const connections = useMemo(() => {
    const lines = []
    if (!concepts?.length) return lines

    const conceptMap = {}
    concepts.forEach((c) => (conceptMap[c.concept] = c))

    const hasPrereqs = concepts.some(
      (c) => c.prerequisites && c.prerequisites.length > 0
    )

    if (hasPrereqs) {
      // Prerequisite-based edges
      concepts.forEach((node) => {
        if (!node.prerequisites?.length) return
        const startPos = positions[node.concept]
        if (!startPos) return

        node.prerequisites.forEach((prereqName) => {
          const endPos = positions[prereqName]
          if (!endPos) return

          const startStatus = resolveStatus(node, progress, currentConceptIndex, concepts)
          const endStatus = resolveStatus(conceptMap[prereqName], progress, currentConceptIndex, concepts)
          const isActive =
            endStatus === 'PASSED' &&
            ['CURRENT', 'PASSED', 'TEACHING'].includes(startStatus)

          lines.push({
            id: `${prereqName}->${node.concept}`,
            points: [endPos, startPos],
            color: isActive ? '#FF6600' : '#374151',
            lineWidth: isActive ? 2.5 : 1,
            opacity: isActive ? 0.7 : 0.2,
            isActive // used for particle trail
          })
        })
      })
    } else {
      // Fallback: connect to closest node in previous depth level
      const byDepth = {}
      concepts.forEach((c) => {
        const d = c.depth_level || 1
        if (!byDepth[d]) byDepth[d] = []
        byDepth[d].push(c)
      })

      const depths = Object.keys(byDepth)
        .map(Number)
        .sort((a, b) => a - b)

      for (let i = 1; i < depths.length; i++) {
        const curr = byDepth[depths[i]]
        const prev = byDepth[depths[i - 1]]

        curr.forEach((node) => {
          const startPos = positions[node.concept]
          if (!startPos) return

          // Find closest parent by X distance
          let closest = prev[0]
          let minDist = Infinity
          prev.forEach((p) => {
             const pPos = positions[p.concept]
            const d = Math.abs(pPos[0] - startPos[0])
            if (d < minDist) {
              minDist = d
              closest = p
            }
          })

          const endPos = positions[closest.concept]
          if (!endPos) return

          const startStatus = resolveStatus(node, progress, currentConceptIndex, concepts)
          const endStatus = resolveStatus(closest, progress, currentConceptIndex, concepts)
          const isActive =
            endStatus === 'PASSED' &&
            ['CURRENT', 'PASSED', 'TEACHING'].includes(startStatus)

          lines.push({
            id: `${closest.concept}->${node.concept}`,
            points: [endPos, startPos],
            color: isActive ? '#FF6600' : '#374151',
            lineWidth: isActive ? 2.5 : 1,
            opacity: isActive ? 0.7 : 0.2,
            isActive
          })
        })
      }
    }

    return lines
  }, [concepts, positions, progress, currentConceptIndex])

  if (!concepts || concepts.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          borderRadius: 24,
          border: '1px solid #222',
          color: '#6B7280',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Waiting for initial concepts...
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 500,
        background: '#0A0A0A',
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)',
        border: '1px solid #222',
      }}
    >
      <Canvas camera={{ position: [0, 4, 10], fov: 45 }}>
        {/* Environment and Lighting */}
        <color attach="background" args={['#0A0A0A']} />
        <Environment preset="city" />
        <ambientLight intensity={0.3} color="#FFFFFF" />
        <pointLight position={[0, 5, 0]} intensity={1.5} color="#FF6600" />
        <directionalLight position={[5, 5, 5]} intensity={0.4} />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          maxDistance={25}
          minDistance={3}
          maxPolarAngle={Math.PI / 1.5}
          target={[0, 0, 0]}
        />

        {/* Postprocessing Bloom */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.3} 
            luminanceSmoothing={0.9} 
            intensity={0.8} 
            radius={0.5} 
            mipmapBlur 
          />
        </EffectComposer>

        {/* Nodes */}
        {concepts.map((concept, i) => (
          <ConceptNode
            key={concept.concept}
            concept={concept}
            position={positions[concept.concept] || [0, 0, 0]}
            status={resolveStatus(concept, progress, currentConceptIndex, concepts)}
            onClick={onNodeClick}
            fadeDelay={i * 120} // stagger 120ms per node
          />
        ))}

        {/* Connection Lines & Particle Trails */}
        {connections.map((line, i) => (
          <group key={line.id}>
            <Line
              points={line.points}
              color={line.color}
              lineWidth={line.lineWidth}
              transparent
              opacity={line.opacity}
            />
            {line.isActive && (
              <ParticleTrail 
                start={line.points[0]} 
                end={line.points[1]} 
                speedOffset={i * 0.1} // different start offset per edge
              />
            )}
          </group>
        ))}

        {/* Ground grid */}
        <gridHelper
          args={[20, 20, '#FF6600', '#FF6600']}
          position={[0, -2, 0]}
          material-opacity={0.2}
          material-transparent={true}
        />
      </Canvas>

      {/* Overlay hint */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          pointerEvents: 'none',
          fontSize: 11,
          color: '#555',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}
      >
        Left Click: Rotate &nbsp;•&nbsp; Scroll: Zoom &nbsp;•&nbsp; Right Click: Pan
      </div>
    </div>
  )
}
