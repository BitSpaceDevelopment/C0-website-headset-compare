// Spec parsing and winner-detection utilities

export type WinnerResult = 'winner' | 'loser' | 'neutral' | 'na'

// Which direction is "better" for each spec name (case-insensitive match)
const HIGHER_BETTER = [
  'resolution',
  'refresh rate',
  'field of view',
  'ram',
  'storage',
  'battery life',
  'eye tracking',
  'hand tracking',
]
const LOWER_BETTER = ['weight', 'price']

function matchesSpec(specName: string, keywords: string[]): boolean {
  const lower = specName.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

export function parseNumericValue(value: string | null, specName: string): number | null {
  if (!value || value === '—' || value === 'N/A' || value === '—') return null

  const name = specName.toLowerCase()

  // Resolution: "2064 × 2208 px" or "3660 × 3142 px (micro-OLED)"
  if (name.includes('resolution')) {
    const m = value.match(/(\d[\d,]*)\s*[×xX]\s*(\d[\d,]*)/)
    if (m) return parseInt(m[1].replace(',', '')) * parseInt(m[2].replace(',', ''))
  }

  // Refresh rate: extract max Hz value
  if (name.includes('refresh')) {
    const nums = [...value.matchAll(/(\d+)\s*hz/gi)].map(m => parseInt(m[1]))
    if (nums.length) return Math.max(...nums)
    const plain = [...value.matchAll(/\b(\d{2,3})\b/g)].map(m => parseInt(m[1]))
    if (plain.length) return Math.max(...plain)
  }

  // Field of view: first degree number
  if (name.includes('field') || name.includes('fov')) {
    const m = value.match(/~?(\d+)°/)
    return m ? parseInt(m[1]) : null
  }

  // Weight: parse grams, handle ranges
  if (name.includes('weight')) {
    const range = value.match(/(\d+)[–-](\d+)\s*g/i)
    if (range) return (parseInt(range[1]) + parseInt(range[2])) / 2
    const single = value.match(/(\d+)\s*g\b/i)
    return single ? parseInt(single[1]) : null
  }

  // RAM: "8 GB", "16 GB"
  if (name === 'ram') {
    const m = value.match(/(\d+)\s*GB/i)
    return m ? parseInt(m[1]) : null
  }

  // Storage: pick highest tier
  if (name.includes('storage')) {
    const tb = value.match(/(\d+)\s*TB/i)
    if (tb) return parseInt(tb[1]) * 1024
    const nums = [...value.matchAll(/(\d+)\s*GB/gi)].map(m => parseInt(m[1]))
    return nums.length ? Math.max(...nums) : null
  }

  // Battery life: extract max hours
  if (name.includes('battery')) {
    const range = value.match(/([\d.]+)[–-]([\d.]+)\s*hours?/i)
    if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2
    const m = value.match(/([\d.]+)\s*hours?/i)
    return m ? parseFloat(m[1]) : null
  }

  // Eye/hand tracking: Yes → 1, No → 0
  if (name.includes('tracking') && (name.includes('eye') || name.includes('hand'))) {
    if (value.toLowerCase().startsWith('yes')) return 1
    if (value.toLowerCase().startsWith('no')) return 0
  }

  return null
}

export function computeRowWinners(
  values: (string | null)[],
  specName: string,
): WinnerResult[] {
  const parsed = values.map(v => parseNumericValue(v, specName))
  const validValues = parsed.filter((v): v is number => v !== null)

  if (validValues.length < 2) return values.map(() => 'neutral')

  const isHigherBetter = matchesSpec(specName, HIGHER_BETTER)
  const isLowerBetter = matchesSpec(specName, LOWER_BETTER)

  if (!isHigherBetter && !isLowerBetter) return values.map(() => 'neutral')

  const best = isHigherBetter ? Math.max(...validValues) : Math.min(...validValues)
  const worst = isHigherBetter ? Math.min(...validValues) : Math.max(...validValues)

  return parsed.map(v => {
    if (v === null) return 'na'
    if (v === best) return 'winner'
    if (v === worst && validValues.length > 2) return 'loser'
    return 'neutral'
  })
}

// Filter utilities

export interface FilterState {
  inProductionOnly: boolean
  eyeTracking: 'any' | 'yes'
  handTracking: 'any' | 'yes'
  minRefreshHz: 0 | 90 | 120 | 144
  maxWeightG: 0 | 600 | 700 | 800 | 1000
  standaloneOnly: boolean
}

export const DEFAULT_FILTER: FilterState = {
  inProductionOnly: false,
  eyeTracking: 'any',
  handTracking: 'any',
  minRefreshHz: 0,
  maxWeightG: 0,
  standaloneOnly: false,
}

export function countActiveFilters(f: FilterState): number {
  return [
    f.inProductionOnly,
    f.eyeTracking !== 'any',
    f.handTracking !== 'any',
    f.minRefreshHz > 0,
    f.maxWeightG > 0,
    f.standaloneOnly,
  ].filter(Boolean).length
}

function getSpecVal(
  deviceId: string,
  specNameSubstr: string,
  allSpecs: { device_id: string; spec_item_id: string; value: string | null }[],
  itemMap: Map<string, string>, // specName → spec_item_id
): string | null {
  for (const [name, id] of itemMap) {
    if (name.toLowerCase().includes(specNameSubstr.toLowerCase())) {
      const s = allSpecs.find(s => s.device_id === deviceId && s.spec_item_id === id)
      return s?.value ?? null
    }
  }
  return null
}

export function deviceMatchesFilters(
  device: { id: string; is_in_production: boolean; price: number | null; currency: string },
  filters: FilterState,
  allSpecs: { device_id: string; spec_item_id: string; value: string | null }[],
  itemMap: Map<string, string>,
): boolean {
  if (filters.inProductionOnly && !device.is_in_production) return false

  if (filters.eyeTracking === 'yes') {
    const val = getSpecVal(device.id, 'eye tracking', allSpecs, itemMap)
    if (!val?.toLowerCase().startsWith('yes')) return false
  }

  if (filters.handTracking === 'yes') {
    const val = getSpecVal(device.id, 'hand tracking', allSpecs, itemMap)
    if (!val?.toLowerCase().startsWith('yes')) return false
  }

  if (filters.minRefreshHz > 0) {
    const val = getSpecVal(device.id, 'refresh rate', allSpecs, itemMap)
    const hz = parseNumericValue(val, 'Refresh Rate')
    if (hz === null || hz < filters.minRefreshHz) return false
  }

  if (filters.maxWeightG > 0) {
    const val = getSpecVal(device.id, 'weight', allSpecs, itemMap)
    const g = parseNumericValue(val, 'Weight')
    if (g !== null && g > filters.maxWeightG) return false
  }

  if (filters.standaloneOnly) {
    const val = getSpecVal(device.id, 'pc tethering', allSpecs, itemMap)
    // If PC tethering is "required" / "required" → not standalone
    if (val?.toLowerCase().includes('required')) return false
    const platform = getSpecVal(device.id, 'platform', allSpecs, itemMap)
    if (platform?.toLowerCase().includes('pc required') || platform?.toLowerCase().includes('pc vr')) return false
  }

  return true
}

export function buildItemMap(
  categories: { spec_items?: { id: string; name: string }[] }[],
): Map<string, string> {
  const map = new Map<string, string>()
  for (const cat of categories) {
    for (const item of cat.spec_items ?? []) {
      map.set(item.name, item.id)
    }
  }
  return map
}
