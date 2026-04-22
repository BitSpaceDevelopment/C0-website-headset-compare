import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDevices, useSpecCategories, useAllDeviceSpecs } from '../lib/queries'
import type { FilterState } from '../lib/specUtils'
import { DEFAULT_FILTER, deviceMatchesFilters, buildItemMap } from '../lib/specUtils'
import DeviceSelector from '../components/comparison/DeviceSelector'
import DeviceCard from '../components/comparison/DeviceCard'
import SpecTable from '../components/comparison/SpecTable'
import FilterPanel from '../components/comparison/FilterPanel'
import type { Device } from '../types'

const MAX_SLOTS = 4

export default function ComparePage() {
  const [selected, setSelected] = useState<(Device | null)[]>([null, null, null, null])
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER)

  const { data: devices = [], isLoading: devicesLoading } = useDevices(true)
  const { data: categories = [], isLoading: catsLoading } = useSpecCategories()
  const { data: allSpecs = [] } = useAllDeviceSpecs()

  const itemMap = buildItemMap(categories)

  const passesFilter = (d: Device) => deviceMatchesFilters(d, filters, allSpecs, itemMap)
  const filteredDevices = devices.filter(passesFilter)

  const selectedIds = selected.filter(Boolean).map(d => d!.id)
  const excludedIds = selectedIds

  function handleSelect(index: number, device: Device | null) {
    setSelected(prev => {
      const next = [...prev]
      next[index] = device
      return next
    })
  }

  const isLoading = devicesLoading || catsLoading

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-text font-bold">
          BSD <span className="text-muted">XR</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs uppercase tracking-widest text-accent border-b border-accent pb-0.5">Compare</span>
          <Link to="/admin" className="text-xs uppercase tracking-widest text-muted hover:text-text transition-colors">Admin</Link>
        </div>
      </nav>

      {/* Header */}
      <div className="px-6 pt-10 pb-6 border-b border-border">
        <div className="text-xs uppercase tracking-widest text-muted mb-2">Compare</div>
        <h1 className="text-3xl uppercase tracking-widest font-bold text-text mb-1">VR Systems</h1>
        <p className="text-xs text-muted tracking-wider">Select up to {MAX_SLOTS} devices to compare side-by-side.</p>
      </div>

      {/* Filter Panel */}
      <FilterPanel filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-xs text-muted uppercase tracking-widest">
          Loading...
        </div>
      ) : (
        <>
          {/* Selectors + Cards */}
          <div className="border-b border-border">
            <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `repeat(${MAX_SLOTS}, 1fr)` }}>
              {selected.map((device, i) => {
                const isFiltered = device !== null && !passesFilter(device)
                return (
                  <div key={i} className="bg-background p-4 flex flex-col gap-3">
                    <DeviceSelector
                      devices={filteredDevices}
                      selected={device}
                      excluded={excludedIds.filter(id => id !== device?.id)}
                      onChange={d => handleSelect(i, d)}
                      slotIndex={i}
                    />
                    <DeviceCard device={device} filtered={isFiltered} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Spec Table */}
          {selectedIds.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Sticky device header */}
              <div
                className="sticky top-0 z-20 grid gap-px bg-border border-b border-border"
                style={{ gridTemplateColumns: `192px repeat(${MAX_SLOTS}, 1fr)` }}
              >
                <div className="bg-surface-2 px-4 py-3 text-xs uppercase tracking-widest text-muted">Spec</div>
                {selected.map((device, i) => (
                  <div key={i} className="bg-surface-2 px-4 py-3 text-xs uppercase tracking-wider text-text truncate">
                    {device ? <><span className="text-muted">{device.brand} / </span>{device.name}</> : <span className="text-border-light">—</span>}
                  </div>
                ))}
              </div>
              <SpecTable selectedDevices={selected} categories={categories} specs={allSpecs} />
            </div>
          ) : (
            /* Zero-selection: show filtered devices as cards */
            <div className="px-6 py-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-xs uppercase tracking-widest text-muted">All Devices</div>
                {filteredDevices.length !== devices.length && (
                  <div className="text-xs uppercase tracking-widest text-orange-500">
                    {filteredDevices.length} / {devices.length} match
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {devices.map(device => {
                  const filtered = !passesFilter(device)
                  return (
                    <div
                      key={device.id}
                      className={`border border-border p-4 flex flex-col items-center gap-3 ${filtered ? 'opacity-40' : ''}`}
                    >
                      <div className="w-20 h-20 flex items-center justify-center bg-surface-2 overflow-hidden">
                        {device.image_url ? (
                          <img src={device.image_url} alt={device.name} className="w-full h-full object-contain p-2"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <span className="text-muted text-xs">No img</span>
                        )}
                      </div>
                      <div className="text-center">
                        {!device.is_in_production && (
                          <div className="text-[10px] uppercase tracking-widest text-yellow-600 mb-1">Discontinued</div>
                        )}
                        <div className="text-xs text-muted uppercase tracking-widest">{device.brand}</div>
                        <div className="text-xs uppercase tracking-wider text-text font-bold">{device.name}</div>
                        {device.price && (
                          <div className="text-xs text-muted mt-1">{device.currency}${device.price.toLocaleString()}</div>
                        )}
                      </div>
                      <button
                        className="text-xs uppercase tracking-widest border border-border text-muted px-3 py-1 hover:border-accent hover:text-accent transition-colors w-full disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => {
                          const emptyIdx = selected.findIndex(s => s === null)
                          if (emptyIdx !== -1) handleSelect(emptyIdx, device)
                        }}
                        disabled={selectedIds.includes(device.id) || selectedIds.length >= MAX_SLOTS}
                      >
                        {selectedIds.includes(device.id) ? 'Added' : '+ Compare'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
