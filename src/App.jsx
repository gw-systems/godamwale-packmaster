import { Suspense } from 'react'
import Sidebar from './components/Sidebar'
import Scene3D from './components/Scene3D'
import ResultsPanel from './components/ResultsPanel'
import { useStore } from './store'

function LoadingScreen() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6',
      color: '#94a3b8'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <div>Loading 3D Scene...</div>
      </div>
    </div>
  )
}

function Header() {
  const results = useStore((state) => state.results)
  const showResults = useStore((state) => state.showResults)
  const toggleResults = useStore((state) => state.toggleResults)
  
  return (
    <div className="header">
      <div className="logo">
        <div className="logo-icon">📦</div>
        <div className="logo-text">
          <h1>Godamwale PackMaster 3D</h1>
          <span>Space Optimization Calculator</span>
        </div>
      </div>
      {/* Hide Results button moved to Scene3D component, next to View dropdown */}
    </div>
  )
}

function CanvasControls() {
  return (
    <div className="canvas-controls">
      <button className="control-btn" title="Rotate view by dragging">🔄</button>
      <button className="control-btn" title="Zoom with scroll">🔍</button>
      <button className="control-btn" title="Pan with right-click drag">✋</button>
    </div>
  )
}

export default function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-area">
        <Header />
        <div className="canvas-container">
          <Suspense fallback={<LoadingScreen />}>
            <Scene3D />
          </Suspense>
          <ResultsPanel />
          <CanvasControls />
        </div>
      </div>
    </div>
  )
}