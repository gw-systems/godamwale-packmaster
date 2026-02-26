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

    // Calculate Volume in CM³
    const containerCM = {
      l: convert(state.storage.l, state.storageUnit, 'cm') - marginCM * 2,
      w: convert(state.storage.w, state.storageUnit, 'cm') - marginCM * 2,
      h: convert(state.storage.h, state.storageUnit, 'cm') - marginCM * 2,
      isCyl: state.storageType === 'drum',
      dia: convert(state.storage.l, state.storageUnit, 'cm') - marginCM * 2 // Using 'l' as diameter for drums
    }

    // Calculate Volume in CM³
    const containerVolCM = containerCM.isCyl
      ? Math.PI * Math.pow(containerCM.dia / 2, 2) * containerCM.h
      : containerCM.l * containerCM.w * containerCM.h

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
      // Mixed Logic - 3D Bottom-Left Bin Packing with Collision Detection
      let sorted = [...itemsCM]
      if (state.priority === 'volume') {
        sorted.sort((a, b) => (b.l * b.w * b.h) - (a.l * a.w * a.h))
      }

      const { l: cL, w: cW, h: cH, isCyl, dia } = containerCM;
      const radius = isCyl ? dia / 2 : 0;

      // All placed boxes across all types
      const occupied = [];

      // Points where new boxes can be placed (Bottom-Left-Front of a new potential box)
      let points = [{ x: 0, y: 0, z: 0 }];

      // Helper: Collision Check
      const collides = (box) => {
        // Check container boundaries with small epsilon for precision
        if (box.x + box.l > cL + 0.001 || box.y + box.h > cH + 0.001 || box.z + box.w > cW + 0.001) return true;
        if (box.x < -0.001 || box.y < -0.001 || box.z < -0.001) return true;

        // Check cylindrical boundary
        if (isCyl) {
          const corners = [[0, 0], [box.l, 0], [0, box.w], [box.l, box.w]];
          for (const [ox, oz] of corners) {
            const px = (box.x + ox) - radius;
            const pz = (box.z + oz) - radius;
            if (Math.hypot(px, pz) > radius + 0.001) return true;
          }
        }

        // Check overlap with other boxes
        for (const other of occupied) {
          if (
            box.x < other.x + other.l - 0.001 &&
            box.x + box.l > other.x + 0.001 &&
            box.y < other.y + other.h - 0.001 &&
            box.y + box.h > other.y + 0.001 &&
            box.z < other.z + other.w - 0.001 &&
            box.z + box.w > other.z + 0.001
          ) {
            return true;
          }
        }
        return false;
      };

      // Helper: Support Check
      const isSupported = (box) => {
        if (box.y <= 0.001) return true; // On the floor

        // Check if bottom surface is resting on one or more other boxes
        // Theoretically, we should check if enough area is supported, 
        // but checking if any box is directly beneath is a good start for this algorithm.
        for (const other of occupied) {
          // Bottom of current box must be at the top of 'other'
          if (Math.abs(box.y - (other.y + other.h)) < 0.001) {
            // Check X-Z overlap
            if (
              box.x < other.x + other.l - 0.001 &&
              box.x + box.l > other.x + 0.001 &&
              box.z < other.z + other.w - 0.001 &&
              box.z + box.w > other.z + 0.001
            ) {
              return true;
            }
          }
        }
        return false;
      };

      const itemStates = sorted.map(item => ({
        ...item,
        qtyToPack: item.qty > 0 ? item.qty : 500, // Safe limit for fill mode
        packedQty: 0,
        coords: []
      }));

      let keepPacking = true;
      while (keepPacking) {
        keepPacking = false;

        for (const item of itemStates) {
          if (item.packedQty >= item.qtyToPack) continue;

          // Sort points to prioritize Bottom-Left-Front (Y, then Z, then X)
          points.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 0.01) return a.y - b.y;
            if (Math.abs(a.z - b.z) > 0.01) return a.z - b.z;
            return a.x - b.x;
          });

          let placed = false;
          const orientations = getOrientations(item);

          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (p.y >= cH) continue;

            for (const [ol, ow, oh] of orientations) {
              const candidate = { x: p.x, y: p.y, z: p.z, l: ol, h: oh, w: ow };
              if (!collides(candidate) && isSupported(candidate)) {
                item.coords.push({
                  x: p.x + ol / 2,
                  y: p.y + oh / 2,
                  z: p.z + ow / 2,
                  l: ol,
                  h: oh,
                  w: ow
                });

                occupied.push({ ...candidate });
                item.packedQty++;

                // Remove used point
                points.splice(i, 1);

                // Add new potential points (neighbors)
                // We add points where new boxes can start
                const newPoints = [
                  { x: p.x + ol, y: p.y, z: p.z },
                  { x: p.x, y: p.y + oh, z: p.z },
                  { x: p.x, y: p.y, z: p.z + ow }
                ];

                for (const np of newPoints) {
                  // Only add if point is within container and not already present
                  if (np.x < cL && np.y < cH && np.z < cW) {
                    if (!points.some(existing =>
                      Math.abs(existing.x - np.x) < 0.001 &&
                      Math.abs(existing.y - np.y) < 0.001 &&
                      Math.abs(existing.z - np.z) < 0.001
                    )) {
                      points.push(np);
                    }
                  }
                }

                placed = true;
                keepPacking = true;
                break;
              }
            }
            if (placed) break;
          }
        }
      }

      const packed = [];
      let totalVolUsed = 0;
      for (const item of itemStates) {
        if (item.packedQty > 0) {
          const originalItem = state.items.find(i => i.id === item.id) || item;
          const finalOrient = getOrientations(item)[0];
          packed.push({
            orient: { l: finalOrient[0], w: finalOrient[1], h: finalOrient[2] },
            id: item.id,
            name: item.name,
            color: item.color,
            displayDims: { l: originalItem.l, w: originalItem.w, h: originalItem.h },
            total: item.packedQty,
            itemVol: item.l * item.w * item.h,
            packedCoords: item.coords
          });
          totalVolUsed += item.packedQty * (item.l * item.w * item.h);
        }
      }

      set({
        results: {
          mode: 'mixed',
          container: state.storage,
          renderContainer: containerCM,
          containerVol: containerVolCM,
          items: packed,
          totalItems: packed.reduce((sum, i) => sum + i.total, 0),
          efficiency: ((totalVolUsed / containerVolCM) * 100).toFixed(1),
          unusedH: 0
        },
        showResults: true
      })
    }
  },

  // --- EXPORT HELPERS ---
  exportCSV: () => {
    const state = get()
    if (!state.results) return
    const r = state.results
    const unit = state.storageUnit
    let csv = `GODAMWALE PACKMASTER 3D - ${r.mode.toUpperCase()}\n${new Date().toLocaleString()}\n\nContainer (${unit}): ${r.container.l}×${r.container.w}×${r.container.h}\nVolume: ${r.containerVol.toFixed(0)}\n\n`
    csv += 'Item,Orientation,PerLayer,Layers,Total,Efficiency\n'
    r.items.forEach(i => {
      csv += `"${i.name}","${i.orient.l}×${i.orient.w}×${i.orient.h}",${i.perLayer},${i.layers},${i.total},${i.efficiency}%\n`
    })
    if (r.mode === 'mixed') {
      csv += `\nTotal Items: ${r.totalItems}\nEfficiency: ${r.efficiency}%\n`
    }
    download(csv, 'packmaster.csv', 'text/csv')
  },

  exportJSON: () => {
    const state = get()
    if (!state.results) return
    download(JSON.stringify({ ...state.results, ts: new Date().toISOString() }, null, 2), 'packmaster.json', 'application/json')
  },

  saveConfig: () => {
    const state = get()
    const config = {
      storageUnit: state.storageUnit,
      itemUnit: state.itemUnit,
      storageType: state.storageType,
      storage: state.storage,
      items: state.items,
      mode: state.mode
    }
    download(JSON.stringify(config, null, 2), 'packmaster-config.json', 'application/json')
  }
}))

// --- Helpers ---
function download(content, name, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function packCyl(r, cH, iL, iW, iH) {
  let cnt = 0; const pos = [];
  for (let x = -r + iL / 2; x <= r - iL / 2; x += iL) {
    for (let y = -r + iW / 2; y <= r - iW / 2; y += iW) {
      const corners = [[x - iL / 2, y - iW / 2], [x + iL / 2, y - iW / 2], [x - iL / 2, y + iW / 2], [x + iL / 2, y + iW / 2]];
      if (corners.every(([cx, cy]) => Math.hypot(cx, cy) <= r)) {
        cnt++; pos.push({ x, y });
      }
    }
  }
  const nz = Math.floor(cH / iH);
  return { nx: cnt, ny: 1, nz, perLayer: cnt, layers: nz, total: cnt * nz, pos, wastedH: cH - nz * iH };
}
function getOrientations(item) {
  const { l, w, h, rotation, lockH, lockL, lockW } = item
  if (lockH && lockL && lockW) return [[l, w, h]]
  let orientations
  if (rotation === 'none') {
    orientations = [[l, w, h]]
  } else if (rotation === 'planar') {
    orientations = [[l, w, h], [w, l, h]]
  } else {
    orientations = [[l, w, h], [l, h, w], [w, l, h], [w, h, l], [h, l, w], [h, w, l]]
  }
  return orientations.filter(([ol, ow, oh]) => {
    if (lockH && oh !== h) return false
    if (lockL && ol !== l) return false
    if (lockW && ow !== w) return false
    return true
  })
}

function calcPacking(container, iL, iW, iH) {
  const { l: cL, w: cW, h: cH, isCyl, dia } = container
  if (isCyl) {
    return packCyl(dia / 2, cH, iL, iW, iH)
  }
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
    const result = calcPacking(container, l, w, h)
    result.orient = { l, w, h }
    if (!best || result.total > best.total) best = result
  }
  return best
}