import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid, ContactShadows, RoundedBox } from '@react-three/drei'
import { useStore } from '../store'
import * as THREE from 'three'
import { useMemo, useState } from 'react'

// Individual Box component
function Box({ position, size, color }) {
  return (
    <group position={position}>
      <RoundedBox args={size} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color} 
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </lineSegments>
    </group>
  )
}

// Container wireframe
function Container({ size, color = '#374151' }) {
  const [l, h, w] = size 
  
  return (
    <group>
      {/* Base floor */}
      <mesh position={[l/2, 0.15, w/2]} receiveShadow>
        <boxGeometry args={[l, 0.3, w]} />
        <meshStandardMaterial color="#e5e7eb" transparent opacity={0.8} />
      </mesh>
      
      {/* Container wireframe */}
      <group position={[l/2, h/2, w/2]}>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(l, h, w)]} />
          <lineBasicMaterial color={color} transparent opacity={0.8} />
        </lineSegments>
      </group>
      
      {/* Corner posts */}
      {[[0, 0], [0, w], [l, 0], [l, w]].map(([x, z], i) => (
        <mesh key={i} position={[x, h/2, z]}>
          <cylinderGeometry args={[0.4, 0.4, h, 8]} />
          <meshStandardMaterial color={color} transparent opacity={0.2} />
        </mesh>
      ))}
      
      {/* Back walls */}
      <mesh position={[l/2, h/2, 0]}>
        <planeGeometry args={[l, h]} />
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, h/2, w/2]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Packed boxes component
function PackedBoxes({ results, container, scaleFactor, filterIndex }) {
  const boxes = useMemo(() => {
    if (!results || !results.items) return []
    
    const boxList = []
    const gap = 0.2 
    
    results.items.forEach((item, itemIdx) => {
      if (filterIndex !== 'all' && Number(filterIndex) !== itemIdx) return

      const { orient, nx, ny, nz, color, startH = 0 } = item
      
      const boxL = orient.l * scaleFactor
      const boxW = orient.w * scaleFactor
      const boxH = orient.h * scaleFactor
      const startY = startH * scaleFactor
      
      const maxLayers = Math.min(nz, 20)
      
      for (let layer = 0; layer < maxLayers; layer++) {
        for (let xi = 0; xi < nx; xi++) {
          for (let zi = 0; zi < ny; zi++) {
            const x = xi * boxL + boxL / 2
            const y = startY + layer * boxH + boxH / 2 + 0.3 
            const z = zi * boxW + boxW / 2
            
            boxList.push({
              key: `${itemIdx}-${xi}-${zi}-${layer}`,
              position: [x, y, z],
              size: [boxL - gap, boxH - gap, boxW - gap],
              color
            })
          }
        }
      }
    })
    
    return boxList
  }, [results, container, scaleFactor, filterIndex])
  
  return (
    <group>
      {boxes.map(box => (
        <Box key={box.key} position={box.position} size={box.size} color={box.color} />
      ))}
    </group>
  )
}

// Main Scene
function Scene({ filterIndex }) {
  const results = useStore((state) => state.results)
  const storage = useStore((state) => state.storage)
  const marginEnabled = useStore((state) => state.marginEnabled)
  const safetyMargin = useStore((state) => state.safetyMargin)
  
  let containerL, containerW, containerH
  
  if (results && results.container) {
    containerL = results.container.l
    containerW = results.container.w
    containerH = results.container.h
  } else {
    const margin = marginEnabled ? safetyMargin : 0
    containerL = storage.l - margin * 2
    containerW = storage.w - margin * 2
    containerH = storage.h - margin * 2
  }
  
  const maxDim = Math.max(containerL, containerW, containerH)
  const scaleFactor = 100 / maxDim
  
  const scaledL = containerL * scaleFactor
  const scaledW = containerW * scaleFactor
  const scaledH = containerH * scaleFactor
  
  const centerX = scaledL / 2
  const centerZ = scaledW / 2
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[100, 150, 100]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={400}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-50, 80, -50]} intensity={0.5} />
      <hemisphereLight args={['#ffffff', '#f3f4f6', 0.6]} />
      
      {/* Floor Grid */}
      <Grid 
        position={[centerX, 0.01, centerZ]}
        args={[250, 250]}
        cellSize={10}
        cellThickness={0.5}
        cellColor="#e5e7eb"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#d1d5db"
        fadeDistance={300}
        fadeStrength={1}
        followCamera={false}
      />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#f3f4f6" /> 
      </mesh>
      
      {/* Container */}
      <Container size={[scaledL, scaledH, scaledW]} />
      
      {/* Boxes */}
      {results && (
        <PackedBoxes 
          results={results}
          container={{ l: containerL, w: containerW, h: containerH }}
          scaleFactor={scaleFactor}
          filterIndex={filterIndex}
        />
      )}
      
      {/* Contact shadows */}
      <ContactShadows
        position={[centerX, 0.02, centerZ]}
        opacity={0.25}
        scale={200}
        blur={2}
        far={100}
        resolution={256}
      />
    </>
  )
}

// Main export with controls in top-right
export default function Scene3D() {
  const results = useStore((state) => state.results)
  const showResults = useStore((state) => state.showResults)
  const toggleResults = useStore((state) => state.toggleResults)
  const [filterIndex, setFilterIndex] = useState('all')
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Top-right controls: Hide Results button + View dropdown */}
      {results && results.items && results.items.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          {/* Hide Results Button */}
          <button
            onClick={toggleResults}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#4b5563',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#d32f2f'
              e.target.style.color = '#d32f2f'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e5e7eb'
              e.target.style.color = '#4b5563'
            }}
          >
            {showResults ? 'Hide Results' : 'Show Results'}
          </button>

          {/* View Dropdown */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 600 }}>View:</span>
            <select 
              value={filterIndex}
              onChange={(e) => setFilterIndex(e.target.value)}
              style={{
                background: 'transparent',
                border: '1px solid #e5e7eb',
                color: '#111827',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              <option value="all">All Items</option>
              {results.items.map((item, idx) => (
                <option key={idx} value={idx}>
                  {item.name} ({item.total})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <Canvas 
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#f3f4f6']} />
        <fog attach="fog" args={['#f3f4f6', 180, 450]} />
        
        <PerspectiveCamera 
          makeDefault 
          position={[160, 130, 160]} 
          fov={45}
          near={1}
          far={1000}
        />
        
        <OrbitControls 
          enablePan
          enableZoom
          enableRotate
          minDistance={40}
          maxDistance={500}
          target={[50, 30, 50]}
          maxPolarAngle={Math.PI / 2.05}
        />
        
        <Scene filterIndex={filterIndex} />
      </Canvas>
    </div>
  )
}