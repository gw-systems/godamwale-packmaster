import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid, ContactShadows, RoundedBox } from '@react-three/drei'
import { useStore } from '../store'
import * as THREE from 'three'
import { useMemo, useState } from 'react' // 1. Added useState

// Individual Box component (Unchanged)
function Box({ position, size, color }) {
  return (
    <group position={position}>
      <RoundedBox args={size} radius={0.3} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color} 
          roughness={0.7}
          metalness={0.05}
        />
      </RoundedBox>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color={color} transparent opacity={0.6} />
      </lineSegments>
    </group>
  )
}

// Container wireframe (Unchanged)
function Container({ size, color = '#3b82f6' }) {
  const [l, w, h] = size
  return (
    <group position={[l/2, h/2, w/2]}>
      <mesh position={[0, -h/2 + 0.5, 0]} receiveShadow>
        <boxGeometry args={[l - 1, 1, w - 1]} />
        <meshStandardMaterial color="#1a365d" transparent opacity={0.4} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(l, h, w)]} />
        <lineBasicMaterial color={color} transparent opacity={0.8} />
      </lineSegments>
      {[[-1,-1], [-1,1], [1,-1], [1,1]].map(([x, z], i) => (
        <mesh key={i} position={[x * (l/2 - 1), 0, z * (w/2 - 1)]}>
          <cylinderGeometry args={[0.8, 0.8, h, 8]} />
          <meshStandardMaterial color={color} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// --- UPDATED COMPONENT ---
// Accepts 'filterIndex' to determine what to show
function PackedBoxes({ results, scaleFactor, filterIndex }) {
  const boxes = useMemo(() => {
    if (!results || !results.items) return []
    
    const boxList = []
    
    results.items.forEach((item, itemIdx) => {
      // 2. FILTERING LOGIC: Skip this item if it doesn't match the selection
      if (filterIndex !== 'all' && Number(filterIndex) !== itemIdx) return;

      const { orient, nx, ny, nz, color, startH = 0 } = item
      const iL = orient.l * scaleFactor
      const iW = orient.w * scaleFactor
      const iH = orient.h * scaleFactor
      const gap = 0.8
      
      const maxLayers = Math.min(nz, 8)
      
      for (let iz = 0; iz < maxLayers; iz++) {
        for (let ix = 0; ix < nx; ix++) {
          for (let iy = 0; iy < ny; iy++) {
            const x = ix * iL + iL/2 + gap
            const y = (startH * scaleFactor) + iz * iH + iH/2 + gap
            const z = iy * iW + iW/2 + gap
            
            boxList.push({
              key: `${itemIdx}-${ix}-${iy}-${iz}`,
              position: [x, y, z],
              size: [iL - gap*2, iH - gap*2, iW - gap*2],
              color
            })
          }
        }
      }
    })
    
    return boxList
  }, [results, scaleFactor, filterIndex]) // Added filterIndex to dependencies
  
  return (
    <group>
      {boxes.map(box => (
        <Box
          key={box.key}
          position={box.position}
          size={box.size}
          color={box.color}
        />
      ))}
    </group>
  )
}

// --- UPDATED COMPONENT ---
// Accepts 'filterIndex' prop to pass down
function Scene({ filterIndex }) {
  const results = useStore((state) => state.results)
  const storage = useStore((state) => state.storage)
  const marginEnabled = useStore((state) => state.marginEnabled)
  const safetyMargin = useStore((state) => state.safetyMargin)
  
  const margin = marginEnabled ? safetyMargin : 0
  const container = {
    l: storage.l - margin * 2,
    w: storage.w - margin * 2,
    h: storage.h - margin * 2
  }
  
  const maxDim = Math.max(container.l, container.w, container.h)
  const scaleFactor = 100 / maxDim
  
  const scaledContainer = {
    l: container.l * scaleFactor,
    w: container.w * scaleFactor,
    h: container.h * scaleFactor
  }
  
  const center = [scaledContainer.l / 2, 0, scaledContainer.w / 2]
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[80, 120, 80]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={300}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-40, 60, -40]} intensity={0.4} />
      <hemisphereLight args={['#87ceeb', '#362907', 0.3]} />
      
      <Grid 
        position={[center[0], 0.01, center[2]]}
        args={[200, 200]}
        cellSize={10}
        cellThickness={0.6}
        cellColor="#1e3a5f"
        sectionSize={50}
        sectionThickness={1.2}
        sectionColor="#3b82f6"
        fadeDistance={250}
        fadeStrength={1}
        followCamera={false}
      />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center[0], 0, center[2]]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#0a0e14" />
      </mesh>
      
      <Container size={[scaledContainer.l, scaledContainer.h, scaledContainer.w]} />
      
      {results && (
        <PackedBoxes 
            results={results} 
            scaleFactor={scaleFactor} 
            filterIndex={filterIndex} // Pass prop down
        />
      )}
      
      <ContactShadows
        position={[center[0], 0.02, center[2]]}
        opacity={0.35}
        scale={180}
        blur={2.5}
        far={80}
        resolution={256}
      />
    </>
  )
}

// --- MAIN EXPORT UPDATED ---
export default function Scene3D() {
  const storage = useStore((state) => state.storage)
  const results = useStore((state) => state.results) // Need results for the dropdown
  const cameraDistance = 150
  
  // 3. UI STATE
  const [filterIndex, setFilterIndex] = useState('all')
  
  return (
    // 4. WRAPPER DIV for positioning UI over Canvas
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      
      {/* 5. UI OVERLAY */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 10,
        background: '#1a2234', // Using your theme color
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(148,163,184,0.12)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Show:</span>
        <select 
          value={filterIndex}
          onChange={(e) => setFilterIndex(e.target.value)}
          style={{
            background: '#0c1017',
            border: '1px solid rgba(148,163,184,0.2)',
            color: '#f8fafc',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Items</option>
          {results?.items?.map((item, idx) => (
            <option key={idx} value={idx}>
              {item.name} ({item.total})
            </option>
          ))}
        </select>
      </div>

      <Canvas 
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#080b10']} />
        <fog attach="fog" args={['#080b10', 150, 400]} />
        
        <PerspectiveCamera 
          makeDefault 
          position={[cameraDistance, cameraDistance * 0.7, cameraDistance]} 
          fov={45}
          near={1}
          far={1000}
        />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={30}
          maxDistance={400}
          target={[50, 25, 50]}
          maxPolarAngle={Math.PI / 2.1}
        />
        
        {/* Pass state to Scene */}
        <Scene filterIndex={filterIndex} />
      </Canvas>
    </div>
  )
}