import { useStore } from '../store'

export default function ResultsPanel() {
  const results = useStore((state) => state.results)
  const showResults = useStore((state) => state.showResults)
  const toggleResults = useStore((state) => state.toggleResults)
  const unit = useStore((state) => state.unit)
  
  if (!results) return null
  
  return (
    <div className="results-panel" style={{ display: showResults ? 'block' : 'none' }}>
      <div className="results-header">
        <span>📊 Results</span>
        <button 
          onClick={toggleResults}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ×
        </button>
      </div>
      <div className="results-body">
        {/* Container Info */}
        <div style={{ 
          padding: '12px', 
          background: 'var(--bg-elevated)', 
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            CONTAINER
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.95rem' }}>
            {results.container.l} × {results.container.w} × {results.container.h} {unit}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Volume: {results.containerVol.toLocaleString(undefined, { maximumFractionDigits: 0 })} {unit}³
          </div>
        </div>
        
        {/* Mixed Mode Summary */}
        {results.mode === 'mixed' && (
          <div style={{
            padding: '14px',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(6,182,212,0.1))',
            border: '1px solid var(--accent-1)',
            borderRadius: '10px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-1)' }}>🧩 Mixed Packing</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--accent-1)' }}>
                {results.efficiency}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.3rem', fontWeight: 700 }}>
                  {results.totalItems}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.3rem', fontWeight: 700 }}>
                  {results.items.length}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TYPES</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.3rem', fontWeight: 700 }}>
                  {results.unusedH.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>UNUSED H</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Individual Items */}
        {results.items.map((item, idx) => (
          <div key={idx} className="result-item" style={{ borderLeft: `4px solid ${item.color}` }}>
            <div className="result-item-header">
              <div>
                <div className="result-item-name" style={{ color: item.color }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {item.originalDims.l}×{item.originalDims.w}×{item.originalDims.h} → {item.orient.l}×{item.orient.w}×{item.orient.h}
                </div>
              </div>
              <div className="result-item-total">
                <div className="value" style={{ color: item.color }}>{item.total}</div>
                <div className="label">units</div>
              </div>
            </div>
            <div className="result-stats">
              <div className="result-stat">
                <div className="value">{item.perLayer}</div>
                <div className="label">Per Layer</div>
              </div>
              <div className="result-stat">
                <div className="value">{item.layers}</div>
                <div className="label">Layers</div>
              </div>
              <div className="result-stat">
                <div className="value">{item.efficiency || '-'}%</div>
                <div className="label">Efficiency</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
