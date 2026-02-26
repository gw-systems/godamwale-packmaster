import { useStore } from '../store'

export default function ResultsPanel() {
  const results = useStore((state) => state.results)
  const showResults = useStore((state) => state.showResults)
  const toggleResults = useStore((state) => state.toggleResults)
  const storageUnit = useStore((state) => state.storageUnit)
  const itemUnit = useStore((state) => state.itemUnit)

  const storageType = useStore((state) => state.storageType)

  const getStorageLabel = (type, count) => {
    const labels = {
      pallet: 'Pallet',
      drum: 'Drum',
      container: 'Container'
    }
    const label = labels[type] || 'Unit'
    return count === 1 ? label : `${label}s`
  }

  if (!results) return null

  return (
    <div className="results-panel" style={{ display: showResults ? 'flex' : 'none' }}>
      <div className="results-header">
        <span>📊 Results</span>
        <button
          onClick={toggleResults}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>
      <div className="results-body">
        {/* Container Info */}
        <div className="container-info">
          <div className="container-label">{storageType.toUpperCase()}</div>
          <div className="container-dims">
            {results.container.l} × {results.container.w} × {results.container.h} {storageUnit.toUpperCase()}
          </div>
          <div className="container-volume">
            Volume: {results.containerVol.toLocaleString(undefined, { maximumFractionDigits: 0 })} cm³
          </div>
        </div>

        {/* Logistics Plan for Individual Mode */}
        {results.mode === 'individual' && results.items.some(item => item.palletsNeeded > 0) && (
          <div className="logistics-plan">
            <div className="logistics-header">📦 LOGISTICS PLAN</div>
            {results.items.filter(item => item.palletsNeeded > 0).map((item, idx) => (
              <div key={idx} style={{ marginBottom: idx < results.items.filter(i => i.palletsNeeded > 0).length - 1 ? '10px' : 0 }}>
                <div>
                  <span className="pallet-count">{item.palletsNeeded}</span>
                  <span className="pallet-label">{getStorageLabel(storageType, item.palletsNeeded)}</span>
                </div>
                <div className="shipment-info">
                  Required for {item.shipmentQty.toLocaleString()} units of "{item.name}"
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mixed Mode Summary */}
        {results.mode === 'mixed' && (
          <div className="mixed-summary">
            <div className="mixed-header">
              <span style={{ fontWeight: 600, color: 'var(--gw-red)', fontSize: '0.8rem' }}>🧩 Mixed Packing</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--gw-red)', fontSize: '0.85rem' }}>
                {results.efficiency}%
              </span>
            </div>
            <div className="mixed-stats">
              <div>
                <div className="mixed-stat-value">{results.totalItems}</div>
                <div className="mixed-stat-label">TOTAL</div>
              </div>
              <div>
                <div className="mixed-stat-value">{results.items.length}</div>
                <div className="mixed-stat-label">TYPES</div>
              </div>
              <div>
                <div className="mixed-stat-value">{results.unusedH.toFixed(1)}</div>
                <div className="mixed-stat-label">UNUSED H</div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Items */}
        {results.items.map((item, idx) => (
          <div key={idx} className="result-item" style={{ borderLeft: `3px solid ${item.color}` }}>
            <div className="result-item-header">
              <div>
                <div className="result-item-name" style={{ color: item.color }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {item.displayDims.l}×{item.displayDims.w}×{item.displayDims.h} {itemUnit.toUpperCase()}
                </div>
              </div>
              <div className="result-item-total">
                <div className="value" style={{ color: item.color }}>{item.total}</div>
                <div className="label">units</div>
              </div>
            </div>
            <div className="result-stats">
              {results.mode === 'individual' ? (
                <>
                  <div className="result-stat">
                    <div className="value">{item.perLayer}</div>
                    <div className="label">Per Layer</div>
                  </div>
                  <div className="result-stat">
                    <div className="value">{item.layers}</div>
                    <div className="label">Layers</div>
                  </div>
                </>
              ) : (
                <div className="result-stat">
                  <div className="value">{item.total}</div>
                  <div className="label">Total Units</div>
                </div>
              )}
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