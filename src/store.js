import { create } from 'zustand'

const COLORS = ['#22c55e', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316']

// 1. HELPER: Unit Conversion Logic
const convert = (val, from, to) => {
  if (from === to) return val
  
  // First, convert everything to CM
  let inCM = val
  if (from === 'in') inCM = val * 2.54
  if (from === 'm') inCM = val * 100
  
  // Then convert CM to the target unit
  if (to === 'cm') return parseFloat(inCM.toFixed(2))
  if (to === 'in') return parseFloat((inCM / 2.54).toFixed(2))
  if (to === 'm') return parseFloat((inCM / 100).toFixed(2))
  
  return val
}

export const useStore = create((set, get) => ({
  // Storage settings
  unit: 'cm',
  storageType: 'pallet',
  storage: { l: 120, w: 100, h: 150 },
  safetyMargin: 0,
  marginEnabled: false,
  
  // Packing mode
  mode: 'individual', 
  priority: 'volume',
  
  // New: Shipment Calculator
  shipmentQty: 0, 
  
  // Items
  items: [],
  
  // Results
  results: null,
  
  // UI state
  selectedItemIndex: null,
  showResults: true,
  
  // Actions
  
  // 2. UPDATED: Set Unit triggers conversion for everything
  setUnit: (newUnit) => set((state) => {
    const oldUnit = state.unit
    if (oldUnit === newUnit) return {}

    // Convert Storage
    const newStorage = {
      l: convert(state.storage.l, oldUnit, newUnit),
      w: convert(state.storage.w, oldUnit, newUnit),
      h: convert(state.storage.h, oldUnit, newUnit),
    }

    // Convert Safety Margin
    const newMargin = convert(state.safetyMargin, oldUnit, newUnit)

    // Convert All Items
    const newItems = state.items.map(item => ({
      ...item,
      l: convert(item.l, oldUnit, newUnit),
      w: convert(item.w, oldUnit, newUnit),
      h: convert(item.h, oldUnit, newUnit),
    }))

    return {
      unit: newUnit,
      storage: newStorage,
      safetyMargin: newMargin,
      items: newItems,
      // Clear results as dimensions have changed
      results: null,
      showResults: false
    }
  }),

  setStorageType: (storageType) => set({ storageType }),
  setStorage: (storage) => set({ storage }),
  setSafetyMargin: (safetyMargin) => set({ safetyMargin }),
  setMarginEnabled: (marginEnabled) => set({ marginEnabled }),
  setMode: (mode) => set({ mode }),
  setPriority: (priority) => set({ priority }),
  setSelectedItemIndex: (index) => set({ selectedItemIndex: index }),
  
  // New Action
  setShipmentQty: (qty) => set({ shipmentQty: qty }),

  toggleResults: () => set((state) => ({ showResults: !state.showResults })),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, {
      ...item,
      id: Date.now(),
      color: COLORS[state.items.length % COLORS.length]
    }]
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  
  // Calculation
  calculate: () => {
    const state = get()
    if (state.items.length === 0) return
    
    const margin = state.marginEnabled ? state.safetyMargin : 0
    const container = {
      l: state.storage.l - margin * 2,
      w: state.storage.w - margin * 2,
      h: state.storage.h - margin * 2
    }
    const containerVol = container.l * container.w * container.h
    
    if (state.mode === 'individual') {
      const results = state.items.map(item => {
        const best = findBestOrientation(item, container)
        const itemVol = item.l * item.w * item.h
        
        // 3. UPDATED: Pallet Calculation Logic
        // "If I have 5000 boxes, how many pallets?"
        const itemsPerPallet = best.total
        const palletsNeeded = (state.shipmentQty > 0 && itemsPerPallet > 0)
          ? Math.ceil(state.shipmentQty / itemsPerPallet)
          : 0

        return {
          ...best,
          id: item.id,
          name: item.name,
          color: item.color,
          originalDims: { l: item.l, w: item.w, h: item.h },
          itemVol,
          packedVol: best.total * itemVol,
          efficiency: ((best.total * itemVol / containerVol) * 100).toFixed(1),
          // Add these to result
          palletsNeeded,
          shipmentQty: state.shipmentQty
        }
      })
      
      set({
        results: {
          mode: 'individual',
          container,
          containerVol,
          // We pass the global shipment qty here too for easy access
          shipmentQty: state.shipmentQty,
          items: results
        },
        showResults: true
      })
    } else {
      // Mixed packing (Logic remains mostly the same)
      let sorted = [...state.items]
      if (state.priority === 'volume') {
        sorted.sort((a, b) => (b.l * b.w * b.h) - (a.l * a.w * a.h))
      }
      
      let remainingH = container.h
      const packed = []
      let totalVol = 0
      
      for (const item of sorted) {
        if (remainingH <= 0) break
        
        const orientations = getOrientations(item)
        let best = null
        
        for (const [l, w, h] of orientations) {
          if (h > remainingH) continue
          const result = calcPacking(container.l, container.w, remainingH, l, w, h)
          result.orient = { l, w, h }
          
          if (item.qty > 0) {
            result.total = Math.min(result.total, item.qty)
            result.layers = Math.ceil(result.total / result.perLayer)
          }
          
          if (!best || result.total > best.total) best = result
        }
        
        if (best && best.total > 0) {
          const itemVol = item.l * item.w * item.h
          const heightUsed = best.layers * best.orient.h
          
          packed.push({
            ...best,
            id: item.id,
            name: item.name,
            color: item.color,
            originalDims: { l: item.l, w: item.w, h: item.h },
            itemVol,
            packedVol: best.total * itemVol,
            startH: container.h - remainingH,
            heightUsed
          })
          
          totalVol += best.total * itemVol
          remainingH -= heightUsed
        }
      }
      
      set({
        results: {
          mode: 'mixed',
          container,
          containerVol,
          items: packed,
          totalItems: packed.reduce((sum, i) => sum + i.total, 0),
          totalVol,
          efficiency: ((totalVol / containerVol) * 100).toFixed(1),
          unusedH: remainingH
        },
        showResults: true
      })
    }
  }
}))

// --- Helper functions (Unchanged) ---

function getOrientations(item) {
  const { l, w, h, rotation, lockH, lockL, lockW } = item
  
  if (lockH && lockL && lockW) return [[l, w, h]]
  
  let orientations
  if (rotation === 'none') {
    orientations = [[l, w, h]]
  } else if (rotation === 'planar') {
    orientations = [[l, w, h], [w, l, h]]
  } else {
    orientations = [[l,w,h], [l,h,w], [w,l,h], [w,h,l], [h,l,w], [h,w,l]]
  }
  
  return orientations.filter(([ol, ow, oh]) => {
    if (lockH && oh !== h) return false
    if (lockL && ol !== l) return false
    if (lockW && ow !== w) return false
    return true
  })
}

function calcPacking(cL, cW, cH, iL, iW, iH) {
  const nx = Math.floor(cL / iL)
  const ny = Math.floor(cW / iW)
  const nz = Math.floor(cH / iH)
  return {
    nx, ny, nz,
    perLayer: nx * ny,
    layers: nz,
    total: nx * ny * nz,
    wastedL: cL - nx * iL,
    wastedW: cW - ny * iW,
    wastedH: cH - nz * iH
  }
}

function findBestOrientation(item, container) {
  const orientations = getOrientations(item)
  let best = null
  
  for (const [l, w, h] of orientations) {
    const result = calcPacking(container.l, container.w, container.h, l, w, h)
    result.orient = { l, w, h }
    
    if (!best || result.total > best.total) best = result
  }
  
  return best
}