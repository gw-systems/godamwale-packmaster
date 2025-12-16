import { useState } from 'react'
import { useStore } from '../store'

const PRESETS = {
  pallet: [
    { name: 'EUR', l: 120, w: 80, h: 180 },
    { name: 'US', l: 121.9, w: 101.6, h: 180 },
    { name: 'Asia', l: 110, w: 110, h: 180 }
  ],
  drum: [
    { name: '55 Gal', l: 57.15, w: 57.15, h: 88.9 },
    { name: '30 Gal', l: 48.26, w: 48.26, h: 73.66 }
  ],
  container: [
    { name: '20ft', l: 589, w: 235, h: 239 },
    { name: '40ft', l: 1203, w: 235, h: 239 }
  ]
}

export default function Sidebar() {
  const {
    storageUnit, setStorageUnit, 
    itemUnit, setItemUnit,
    storageType, setStorageType,
    storage, setStorage,
    safetyMargin, setSafetyMargin,
    marginEnabled, setMarginEnabled,
    mode, setMode,
    items, addItem, removeItem,
    calculate,
    shipmentQty, setShipmentQty
  } = useStore()
  
  const [itemForm, setItemForm] = useState({
    name: '',
    l: 30,
    w: 20,
    h: 15,
    rotation: 'full',
    lockH: false,
    lockL: false,
    lockW: false,
    qty: 0
  })
  
  const units = ['cm', 'in', 'm', 'ft', 'mm'];

  const handlePresetClick = (p) => {
    let { l, w, h } = p;

    if (storageUnit === 'in') {
      l = l / 2.54; w = w / 2.54; h = h / 2.54;
    } else if (storageUnit === 'm') {
      l = l / 100; w = w / 100; h = h / 100;
    } else if (storageUnit === 'ft') {
      l = l / 30.48; w = w / 30.48; h = h / 30.48;
    } else if (storageUnit === 'mm') {
      l = l * 10; w = w * 10; h = h * 10;
    }

    setStorage({
      l: parseFloat(l.toFixed(2)),
      w: parseFloat(w.toFixed(2)),
      h: parseFloat(h.toFixed(2))
    });
  }

  const handleAddItem = () => {
    if (itemForm.l <= 0 || itemForm.w <= 0 || itemForm.h <= 0) {
      alert('Please enter valid dimensions')
      return
    }
    addItem({
      name: itemForm.name || `Item ${items.length + 1}`,
      l: parseFloat(itemForm.l),
      w: parseFloat(itemForm.w),
      h: parseFloat(itemForm.h),
      rotation: itemForm.rotation,
      lockH: itemForm.lockH,
      lockL: itemForm.lockL,
      lockW: itemForm.lockW,
      qty: parseInt(itemForm.qty) || 0
    })
    setItemForm(prev => ({ ...prev, name: '' }))
  }
  
  const presets = PRESETS[storageType] || []
  
  return (
    <div className="sidebar">
      {/* Storage Material Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon">🏗️</div>
            <span className="card-title">Storage Material</span>
          </div>
          <div className="chip-group">
            {units.map(u => (
              <button
                key={u}
                className={`chip ${storageUnit === u ? 'active' : ''}`}
                onClick={() => setStorageUnit(u)}
                style={{ padding: '3px 7px', fontSize: '0.62rem' }}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={storageType}
              onChange={(e) => setStorageType(e.target.value)}
            >
              <option value="pallet">Pallet</option>
              <option value="drum">Drum / Cylinder</option>
              <option value="container">Container / Custom</option>
            </select>
          </div>
          
          <div className="presets-row">
            {presets.map((p, i) => (
              <div
                key={i}
                className="preset-chip"
                onClick={() => handlePresetClick(p)}
              >
                <span className="name">{p.name}</span>
                <span className="dims">{p.l}×{p.w}×{p.h}</span>
              </div>
            ))}
          </div>
          
          <div className="input-row" style={{ marginTop: 10 }}>
            <div className="form-group">
              <label className="form-label">Length ({storageUnit})</label>
              <input
                type="number"
                className="form-input"
                value={storage.l}
                onChange={(e) => setStorage({ ...storage, l: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Width ({storageUnit})</label>
              <input
                type="number"
                className="form-input"
                value={storage.w}
                onChange={(e) => setStorage({ ...storage, w: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Height ({storageUnit})</label>
              <input
                type="number"
                className="form-input"
                value={storage.h}
                onChange={(e) => setStorage({ ...storage, h: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="input-row-2" style={{ marginTop: 8 }}>
            <div className="form-group">
              <label className="form-label">Safety Margin ({storageUnit})</label>
              <input
                type="number"
                className="form-input"
                value={safetyMargin}
                onChange={(e) => setSafetyMargin(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">&nbsp;</label>
              <button
                className={`chip ${marginEnabled ? 'active' : ''}`}
                onClick={() => setMarginEnabled(!marginEnabled)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {marginEnabled ? '✓ Enabled' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Packing Mode Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon">🎯</div>
            <span className="card-title">Packing Mode</span>
          </div>
        </div>
        <div className="card-body">
          <div className="mode-toggle">
            <div
              className={`mode-option ${mode === 'individual' ? 'active' : ''}`}
              onClick={() => setMode('individual')}
            >
              <div className="icon">📊</div>
              <div className="title">Individual</div>
              <div className="desc">Separate per box</div>
            </div>
            <div
              className={`mode-option ${mode === 'mixed' ? 'active' : ''}`}
              onClick={() => setMode('mixed')}
            >
              <div className="icon">🧩</div>
              <div className="title">Mixed</div>
              <div className="desc">Combine in one</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Items Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon">📐</div>
            <span className="card-title">Items / Boxes</span>
          </div>
        </div>

        {/* Item Unit Toggle Bar */}
        <div style={{ padding: '0 12px 8px 12px', borderBottom: '1px solid var(--border)' }}>
          <div className="chip-group" style={{ justifyContent: 'center' }}>
            {units.map(u => (
              <button
                key={u}
                className={`chip ${itemUnit === u ? 'active' : ''}`}
                onClick={() => setItemUnit(u)}
                style={{ padding: '3px 7px', fontSize: '0.62rem' }}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Carton A"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            />
          </div>
          
          <div className="input-row">
            <div className="form-group">
              <label className="form-label">Length ({itemUnit})</label>
              <input
                type="number"
                className="form-input"
                value={itemForm.l}
                onChange={(e) => setItemForm({ ...itemForm, l: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Width ({itemUnit})</label>
              <input
                type="number"
                className="form-input"
                value={itemForm.w}
                onChange={(e) => setItemForm({ ...itemForm, w: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Height ({itemUnit})</label>
              <input
                type="number"
                className="form-input"
                value={itemForm.h}
                onChange={(e) => setItemForm({ ...itemForm, h: e.target.value })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Rotation</label>
            <div className="chip-group">
              {['full', 'planar', 'none'].map(r => (
                <button
                  key={r}
                  className={`chip ${itemForm.rotation === r ? 'active' : ''}`}
                  onClick={() => setItemForm({ ...itemForm, rotation: r })}
                >
                  {r === 'full' ? 'Full' : r === 'planar' ? 'Planar' : 'Fixed'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Lock Dimensions</label>
            <div className="chip-group">
              <button
                className={`chip ${itemForm.lockH ? 'active' : ''}`}
                onClick={() => setItemForm({ ...itemForm, lockH: !itemForm.lockH })}
              >
                {itemForm.lockH ? '✓' : ''} Height
              </button>
              <button
                className={`chip ${itemForm.lockL ? 'active' : ''}`}
                onClick={() => setItemForm({ ...itemForm, lockL: !itemForm.lockL })}
              >
                {itemForm.lockL ? '✓' : ''} Length
              </button>
              <button
                className={`chip ${itemForm.lockW ? 'active' : ''}`}
                onClick={() => setItemForm({ ...itemForm, lockW: !itemForm.lockW })}
              >
                {itemForm.lockW ? '✓' : ''} Width
              </button>
            </div>
          </div>
          
          {/* Shipment Calculator */}
          {mode === 'individual' && (
             <div className="form-group" style={{ 
               marginTop: '10px', 
               padding: '9px', 
               background: 'rgba(211, 47, 47, 0.05)', 
               borderRadius: '8px', 
               border: '1px dashed var(--gw-red)' 
             }}>
                <label className="form-label" style={{ color: 'var(--gw-red)' }}>📦 Total Shipment Quantity</label>
                <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 5000 total boxes"
                    value={shipmentQty || ''}
                    onChange={(e) => setShipmentQty(parseInt(e.target.value) || 0)}
                />
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Calculate how many pallets you need.
                </div>
            </div>
          )}
          
          {mode === 'mixed' && (
            <div className="form-group">
              <label className="form-label">Quantity (0 = fill space)</label>
              <input
                type="number"
                className="form-input"
                value={itemForm.qty}
                onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })}
              />
            </div>
          )}
          
          <button className="btn btn-primary" onClick={handleAddItem} style={{ marginTop: 8 }}>
            + Add Item
          </button>
          
          <div className="items-list">
            {items.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📭</div>
                <p style={{ fontSize: '0.8rem', margin: '6px 0 0 0' }}>No items yet</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="item-card">
                  <div className="item-card-header">
                    <div className="item-name">
                      <span className="item-dot" style={{ background: item.color }}></span>
                      {item.name}
                    </div>
                    <span className="item-dims">{item.l}×{item.w}×{item.h}</span>
                  </div>
                  <div className="item-tags">
                    <span className="item-tag">
                      {item.rotation === 'full' ? 'Full' : item.rotation === 'planar' ? 'Planar' : 'Fixed'}
                    </span>
                    {item.lockH && <span className="item-tag">H Lock</span>}
                    {item.lockL && <span className="item-tag">L Lock</span>}
                    {item.lockW && <span className="item-tag">W Lock</span>}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => removeItem(item.id)}
                    style={{ marginTop: 6 }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Calculate Button */}
      <button className="btn btn-primary btn-block" onClick={calculate} style={{ padding: 14, fontSize: '0.9rem' }}>
        🚀 Calculate Optimal Packing
      </button>
    </div>
  )
}