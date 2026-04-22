import { useState, useRef, useEffect } from 'react'
import type { Device } from '../../types'

interface Props {
  devices: Device[]
  selected: Device | null
  excluded: string[]
  onChange: (device: Device | null) => void
  slotIndex: number
}

export default function DeviceSelector({ devices, selected, excluded, onChange, slotIndex }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const available = devices.filter(d => !excluded.includes(d.id) || d.id === selected?.id)

  if (selected) {
    return (
      <div className="relative flex flex-col items-start gap-1">
        <button
          className="text-xs uppercase tracking-widest text-muted hover:text-text transition-colors"
          onClick={() => onChange(null)}
        >
          × Remove
        </button>
        <button
          className="w-full text-left border border-border bg-surface px-3 py-2 text-xs uppercase tracking-wider text-text hover:border-border-light transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <span className="text-muted">{selected.brand} /</span> {selected.name}
        </button>
        {open && (
          <div ref={ref} className="absolute top-full left-0 right-0 z-30 bg-surface border border-border-light mt-px max-h-64 overflow-y-auto">
            {available.map(d => (
              <button
                key={d.id}
                className="w-full text-left px-3 py-2 text-xs uppercase tracking-wider hover:bg-surface-2 transition-colors text-text"
                onClick={() => { onChange(d); setOpen(false) }}
              >
                <span className="text-muted">{d.brand} /</span> {d.name}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="w-full border border-dashed border-border text-muted text-xs uppercase tracking-widest px-3 py-2 hover:border-border-light hover:text-text transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        + Add Device {slotIndex + 1}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 bg-surface border border-border-light mt-px max-h-64 overflow-y-auto">
          {available.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted">No devices available</div>
          ) : (
            available.map(d => (
              <button
                key={d.id}
                className="w-full text-left px-3 py-2 text-xs uppercase tracking-wider hover:bg-surface-2 transition-colors text-text"
                onClick={() => { onChange(d); setOpen(false) }}
              >
                <span className="text-muted">{d.brand} /</span> {d.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
