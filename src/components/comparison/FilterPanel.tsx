import type { FilterState } from '../../lib/specUtils'
import { DEFAULT_FILTER, countActiveFilters } from '../../lib/specUtils'

interface Props {
  filters: FilterState
  onChange: (f: FilterState) => void
}

const REFRESH_OPTIONS: { label: string; value: FilterState['minRefreshHz'] }[] = [
  { label: 'Any', value: 0 },
  { label: '90+ Hz', value: 90 },
  { label: '120+ Hz', value: 120 },
  { label: '144+ Hz', value: 144 },
]

const WEIGHT_OPTIONS: { label: string; value: FilterState['maxWeightG'] }[] = [
  { label: 'Any', value: 0 },
  { label: 'Under 600 g', value: 600 },
  { label: 'Under 700 g', value: 700 },
  { label: 'Under 800 g', value: 800 },
  { label: 'Under 1 kg', value: 1000 },
]

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs uppercase tracking-widest border transition-colors ${
        active
          ? 'border-accent text-accent bg-accent/10'
          : 'border-border text-muted hover:border-border-light hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

export default function FilterPanel({ filters, onChange }: Props) {
  const count = countActiveFilters(filters)
  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    onChange({ ...filters, [key]: val })

  return (
    <div className="border-b border-border bg-surface px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="text-xs uppercase tracking-widest text-muted shrink-0">
        Filter
        {count > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] bg-accent text-background rounded-none font-bold">
            {count}
          </span>
        )}
      </span>

      {/* In production */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted uppercase tracking-wider shrink-0">Status</span>
        <Toggle active={filters.inProductionOnly} onClick={() => set('inProductionOnly', !filters.inProductionOnly)}>
          In Production
        </Toggle>
      </div>

      {/* Eye tracking */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted uppercase tracking-wider shrink-0">Eye Tracking</span>
        <Toggle active={filters.eyeTracking === 'yes'} onClick={() => set('eyeTracking', filters.eyeTracking === 'yes' ? 'any' : 'yes')}>
          Required
        </Toggle>
      </div>

      {/* Hand tracking */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted uppercase tracking-wider shrink-0">Hand Tracking</span>
        <Toggle active={filters.handTracking === 'yes'} onClick={() => set('handTracking', filters.handTracking === 'yes' ? 'any' : 'yes')}>
          Required
        </Toggle>
      </div>

      {/* Standalone */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted uppercase tracking-wider shrink-0">Platform</span>
        <Toggle active={filters.standaloneOnly} onClick={() => set('standaloneOnly', !filters.standaloneOnly)}>
          Standalone Only
        </Toggle>
      </div>

      {/* Refresh rate */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted uppercase tracking-wider shrink-0">Refresh</span>
        <div className="flex gap-1">
          {REFRESH_OPTIONS.map(opt => (
            <Toggle key={opt.value} active={filters.minRefreshHz === opt.value} onClick={() => set('minRefreshHz', opt.value)}>
              {opt.label}
            </Toggle>
          ))}
        </div>
      </div>

      {/* Weight */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted uppercase tracking-wider shrink-0">Weight</span>
        <div className="flex gap-1 flex-wrap">
          {WEIGHT_OPTIONS.map(opt => (
            <Toggle key={opt.value} active={filters.maxWeightG === opt.value} onClick={() => set('maxWeightG', opt.value)}>
              {opt.label}
            </Toggle>
          ))}
        </div>
      </div>

      {/* Reset */}
      {count > 0 && (
        <button
          onClick={() => onChange(DEFAULT_FILTER)}
          className="text-xs uppercase tracking-widest text-muted hover:text-text transition-colors ml-auto shrink-0"
        >
          Reset
        </button>
      )}
    </div>
  )
}
