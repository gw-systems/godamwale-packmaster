import { create } from 'zustand'

const COLORS = ['#22c55e', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316']

// 1. UPDATED HELPER: Handles cm, in, m, ft, mm
const convert = (val, from, to) => {
  if (from === to) return val
  
  // Convert "From" to CM
  let inCM = val
  if (from === 'in') inCM = val * 2.54
  if (from === 'm') inCM = val * 100
  if (from === 'ft') inCM = val * 30.48
  if (from === 'mm') inCM = val / 10
  
  // Convert CM to "To"
  if (to === 'cm') return parseFloat(inCM.toFixed(2))
  if (to === 'in') return parseFloat((inCM / 2.54).toFixed(2))
  if (to === 'm') return parseFloat((inCM / 100).toFixed(2))
  if (to === 'ft') return parseFloat((inCM / 30.48).toFixed(2))
  if (to === 'mm') return parseFloat((inCM * 10).toFixed(2))
  
  return val
}

export const useStore = create((set, get) => ({
  // --- STORAGE SETTINGS ---
  storageUnit: 'cm', // Renamed from 'unit'
  storageType: 'pallet',
  storage: { l: 120, w: 80, h: 180 },
  safetyMargin: 0,
  marginEnabled: false,
  
  // --- ITEM SETTINGS ---
  itemUnit: 'cm', // NEW: Independent unit for boxes
  items: [],
  
  // --- MODES ---
  mode: 'individual', 
  priority: 'volume',
  shipmentQty: 0, 
  
  // --- STATE ---
  results: null,
  showResults: false,
  selectedItemIndex: null,
  
  // --- ACTIONS ---
  
  // Set Storage Unit (Converts Container & Margin)
  setStorageUnit: (newUnit) => set((state) => {
    const oldUnit = state.storageUnit
    if (oldUnit === newUnit) return {}

    return {
      storageUnit: newUnit,
      storage: {
        l: convert(state.storage.l, oldUnit, newUnit),
        w: convert(state.storage.w, oldUnit, newUnit),
        h: convert(state.storage.h, oldUnit, newUnit),
      },
      safetyMargin: convert(state.safetyMargin, oldUnit, newUnit),
      results: null, // Clear results to force recalc
      showResults: false
    }
  }),

  // NEW: Set Item Unit (Converts all existing items)
  setItemUnit: (newUnit) => set((state) => {
    const oldUnit = state.itemUnit
    if (oldUnit === newUnit) return {}

    const newItems = state.items.map(item => ({
      ...item,
      l: convert(item.l, oldUnit, newUnit),
      w: convert(item.w, oldUnit, newUnit),
      h: convert(item.h, oldUnit, newUnit),
    }))

    return {
      itemUnit: newUnit,
      items: newItems,
      results: null,
      showResults: false
    }
  }),

  setStorageType: (storageType) => set({ storageType, results: null, showResults: false }),
  setStorage: (storage) => set({ storage, results: null, showResults: false }),
  setSafetyMargin: (safetyMargin) => set({ safetyMargin, results: null, showResults: false }),
  setMarginEnabled: (marginEnabled) => set({ marginEnabled, results: null, showResults: false }),

  setMode: (mode) => set({ mode }),
  setPriority: (priority) => set({ priority }),
  setSelectedItemIndex: (index) => set({ selectedItemIndex: index }),
  setShipmentQty: (qty) => set({ shipmentQty: qty }),
  toggleResults: () => set((state) => ({ showResults: !state.showResults })),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, {
      ...item,
      id: Date.now(),
      color: COLORS[state.items.length % COLORS.length]
    }],
    results: null,
    showResults: false
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id),
    results: null,
    showResults: false
  })),
  
  // --- UPDATED CALCULATION LOGIC ---
  calculate: () => {
    const state = get()
    if (state.items.length === 0) return
    
    // 1. Normalize STORAGE to CM for calculation
    const margin = state.marginEnabled ? state.safetyMargin : 0
    // We must convert margin to CM first if it's not already
    const marginCM = convert(margin, state.storageUnit, 'cm')
    
    const containerCM = {
      l: convert(state.storage.l, state.storageUnit, 'cm') - marginCM * 2,
      w: convert(state.storage.w, state.storageUnit, 'cm') - marginCM * 2,
      h: convert(state.storage.h, state.storageUnit, 'cm') - marginCM * 2
    }
    
    // Calculate Volume in CM³
    const containerVolCM = containerCM.l * containerCM.w * containerCM.h

    // 2. Prepare Items (Convert to CM for calc)
    const itemsCM = state.items.map(item => ({
      ...item,
      l: convert(item.l, state.itemUnit, 'cm'),
      w: convert(item.w, state.itemUnit, 'cm'),
      h: convert(item.h, state.itemUnit, 'cm'),
    }))

    if (state.mode === 'individual') {
      const results = itemsCM.map(item => {
        // Use the CM dimensions for packing logic
        const best = findBestOrientation(item, containerCM)
        const itemVolCM = item.l * item.w * item.h
        
        const itemsPerPallet = best.total
        const palletsNeeded = (state.shipmentQty > 0 && itemsPerPallet > 0)
          ? Math.ceil(state.shipmentQty / itemsPerPallet)
          : 0

        return {
          ...best,
          id: item.id,
          name: item.name,
          color: item.color,
          // Store display dims for the UI (original units)
          displayDims: { 
            l: state.items.find(i => i.id === item.id).l, 
            w: state.items.find(i => i.id === item.id).w, 
            h: state.items.find(i => i.id === item.id).h 
          },
          efficiency: ((best.total * itemVolCM / containerVolCM) * 100).toFixed(1),
          palletsNeeded,
          shipmentQty: state.shipmentQty
        }
      })
      
      set({
        results: {
          mode: 'individual',
          container: state.storage, // Original Units
          renderContainer: containerCM, // Normalized CM (For 3D)
          containerVol: containerVolCM, // In CM³
          shipmentQty: state.shipmentQty,
          items: results
        },
        showResults: true
      })
    } else {
      // Mixed Logic
      let sorted = [...itemsCM]
      if (state.priority === 'volume') {
        sorted.sort((a, b) => (b.l * b.w * b.h) - (a.l * a.w * a.h))
      }
      
      let remainingH = containerCM.h
      const packed = []
      let totalVol = 0
      
      for (const item of sorted) {
        if (remainingH <= 0) break
        
        const orientations = getOrientations(item)
        let best = null
        
        for (const [l, w, h] of orientations) {
          if (h > remainingH) continue
          const result = calcPacking(containerCM.l, containerCM.w, remainingH, l, w, h)
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
          
          const originalItem = state.items.find(i => i.id === item.id)

          packed.push({
            ...best,
            id: item.id,
            name: item.name,
            color: item.color,
            displayDims: { l: originalItem.l, w: originalItem.w, h: originalItem.h },
            startH: containerCM.h - remainingH, // CM
            heightUsed // CM
          })
          
          totalVol += best.total * itemVol
          remainingH -= heightUsed
        }
      }
      
      set({
        results: {
          mode: 'mixed',
          container: state.storage,
          renderContainer: containerCM, // CM
          containerVol: containerVolCM,
          items: packed,
          totalItems: packed.reduce((sum, i) => sum + i.total, 0),
          efficiency: ((totalVol / containerVolCM) * 100).toFixed(1),
          unusedH: remainingH
        },
        showResults: true
      })
    }
  }
}))

// --- Helpers (Unchanged) ---
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