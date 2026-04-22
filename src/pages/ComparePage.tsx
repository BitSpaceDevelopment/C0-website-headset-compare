import { useState, useMemo, lazy, Suspense, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDevices, useSpecCategories, useAllDeviceSpecs } from '../lib/queries'
import type { FilterState } from '../lib/specUtils'
import { DEFAULT_FILTER, deviceMatchesFilters, buildItemMap } from '../lib/specUtils'
import { useTheme } from '../lib/theme'
import DeviceSelector from '../components/comparison/DeviceSelector'
import DeviceCard from '../components/comparison/DeviceCard'
import SpecTable from '../components/comparison/SpecTable'
import FilterPanel from '../components/comparison/FilterPanel'
import type { Device } from '../types'

const ExportButton = lazy(() => import('../components/comparison/ExportButton'))

const MAX_SLOTS = 4

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-8 h-8 flex items-center justify-center border border-border text-muted hover:border-accent hover:text-accent transition-colors text-base"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}

export default function ComparePage() {
  const [selected, setSelected] = useState<(Device | null)[]>([null, null, null, null])
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER)
  const { theme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: devices = [], isLoading: devicesLoading } = useDevices(true)
  const { data: categories = [], isLoading: catsLoading } = useSpecCategories()
  const { data: allSpecs = [] } = useAllDeviceSpecs()

  useEffect(() => {
    const addId = searchParams.get('add')
    if (!addId || devices.length === 0) return
    const device = devices.find(d => d.id === addId)
    if (!device) return
    setSelected(prev => {
      if (prev.some(s => s?.id === addId)) return prev
      const emptyIdx = prev.findIndex(s => s === null)
      if (emptyIdx === -1) return prev
      const next = [...prev]
      next[emptyIdx] = device
      return next
    })
    setSearchParams({}, { replace: true })
  }, [searchParams, devices, setSearchParams])

  const itemMap = useMemo(() => buildItemMap(categories), [categories])

  const filteredDevices = useMemo(
    () => devices.filter(d => deviceMatchesFilters(d, filters, allSpecs, itemMap)),
    [devices, filters, allSpecs, itemMap],
  )

  const filteredIds = useMemo(() => new Set(filteredDevices.map(d => d.id)), [filteredDevices])

  const selectedIds = useMemo(() => selected.filter(Boolean).map(d => d!.id), [selected])

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
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
        <a href="https://bsdxr.com" target="_blank" rel="noopener noreferrer">
          <img
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="BSD XR"
            className="h-8 w-auto"
          />
        </a>
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-widest text-accent border-b border-accent pb-0.5">Compare</span>
          <a
            href="https://bsdxr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-widest text-muted hover:text-text transition-colors"
          >
            bsdxr.com
          </a>
          <Link to="/admin" className="text-xs uppercase tracking-widest text-muted hover:text-text transition-colors">Admin</Link>
          <ThemeToggle />
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
                const isFiltered = device !== null && !filteredIds.has(device.id)
                return (
                  <div key={i} className="bg-background p-4 flex flex-col gap-3">
                    <DeviceSelector
                      devices={filteredDevices}
                      selected={device}
                      excluded={selectedIds.filter(id => id !== device?.id)}
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
              {/* Sticky device header + export */}
              <div
                className="sticky top-0 z-20 grid gap-px bg-border border-b border-border"
                style={{ gridTemplateColumns: `192px repeat(${MAX_SLOTS}, 1fr)` }}
              >
                <div className="bg-surface-2 px-4 py-3 flex items-center">
                  <Suspense fallback={null}>
                    <ExportButton selectedDevices={selected} categories={categories} specs={allSpecs} />
                  </Suspense>
                </div>
                {selected.map((device, i) => (
                  <div key={i} className="bg-surface-2 px-4 py-3 text-xs uppercase tracking-wider text-text truncate">
                    {device ? <><span className="text-muted">{device.brand} / </span>{device.name}</> : <span className="text-muted">—</span>}
                  </div>
                ))}
              </div>
              <SpecTable selectedDevices={selected} categories={categories} specs={allSpecs} />
            </div>
          ) : (
            /* Zero-selection: show all devices as cards */
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
                  const filtered = !filteredIds.has(device.id)
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
                      <Link
                        to={`/device/${device.id}`}
                        className="text-[10px] uppercase tracking-widest text-muted hover:text-accent transition-colors text-center"
                      >
                        View More →
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CTA Banner */}
          <div className="border-t border-border bg-surface mt-8">
            <div className="px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted mb-2">Need Expert Guidance?</div>
                <h2 className="text-xl uppercase tracking-widest font-bold text-text mb-2">
                  Let Us Help You Choose the Right Headset
                </h2>
                <p className="text-xs text-muted tracking-wider leading-relaxed max-w-md">
                  BSD XR specializes in deploying immersive technology across aerospace, construction, education,
                  and manufacturing. Book a demo and get a tailored recommendation for your use case.
                </p>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <a
                  href="https://bsdxr.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-widest border border-accent text-accent px-6 py-3 hover:bg-accent hover:text-background transition-colors text-center font-bold"
                >
                  Book a Demo →
                </a>
                <a
                  href="https://bsdxr.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-widest border border-border text-muted px-6 py-2 hover:border-accent hover:text-accent transition-colors text-center"
                >
                  Learn More About BSD XR
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-border px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <a href="https://bsdxr.com" target="_blank" rel="noopener noreferrer">
              <img
                src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                alt="BSD XR"
                className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity"
              />
            </a>
            <div className="text-[10px] uppercase tracking-widest text-muted">
              Bit Space Development Ltd. · Winnipeg, MB, Canada · bsdxr.com
            </div>
          </footer>
        </>
      )}
    </div>
  )
}
