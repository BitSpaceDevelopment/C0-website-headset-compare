import { useState, lazy, Suspense } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDevice, useManufacturer, useDeviceMedia, useDeviceSpecs, useSpecCategories } from '../lib/queries'
import { useTheme } from '../lib/theme'
import SpecTable from '../components/comparison/SpecTable'

const DeviceExportButton = lazy(() => import('../components/comparison/DeviceExportButton'))

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-8 h-8 flex items-center justify-center border border-border text-muted hover:border-accent hover:text-accent transition-colors"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}

export default function DevicePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [activeImage, setActiveImage] = useState<string | null>(null)

  const { data: device, isLoading: deviceLoading } = useDevice(id ?? '')
  const { data: manufacturer } = useManufacturer(device?.manufacturer_id)
  const { data: media = [] } = useDeviceMedia(id)
  const { data: specs = [] } = useDeviceSpecs(id ? [id] : [])
  const { data: categories = [] } = useSpecCategories()

  const images = media.filter(m => m.type === 'image')
  const videos = media.filter(m => m.type === 'youtube')

  const heroImage = activeImage ?? device?.image_url ?? null

  if (deviceLoading) {
    return (
      <div className="min-h-screen bg-background font-mono flex items-center justify-center">
        <span className="text-xs text-muted uppercase tracking-widest">Loading...</span>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-background font-mono flex flex-col items-center justify-center gap-4">
        <span className="text-xs text-muted uppercase tracking-widest">Device not found</span>
        <Link to="/" className="text-xs uppercase tracking-widest border border-border text-muted px-4 py-2 hover:border-accent hover:text-accent transition-colors">
          ← Back to Compare
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
        <a href="https://bsdxr.com" target="_blank" rel="noopener noreferrer">
          <img src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} alt="BSD XR" className="h-8 w-auto" />
        </a>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs uppercase tracking-widest text-muted hover:text-text transition-colors">
            ← Compare
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2 text-xs text-muted uppercase tracking-widest">
        <Link to="/" className="hover:text-text transition-colors">Compare</Link>
        <span>/</span>
        <span className="text-text">{device.brand} {device.name}</span>
      </div>

      {/* Hero */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-10">
          {/* Image column */}
          <div className="flex flex-col gap-3">
            <div className="aspect-square bg-surface-2 border border-border flex items-center justify-center overflow-hidden">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={device.name}
                  className="w-full h-full object-contain p-6"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span className="text-muted text-xs uppercase tracking-widest">No image</span>
              )}
            </div>

            {/* Thumbnail strip */}
            {(images.length > 0 || device.image_url) && (
              <div className="flex gap-2 flex-wrap">
                {device.image_url && (
                  <button
                    onClick={() => setActiveImage(device.image_url)}
                    className={`w-16 h-16 border overflow-hidden flex-shrink-0 transition-colors ${(activeImage === device.image_url || activeImage === null) ? 'border-accent' : 'border-border hover:border-border-light'}`}
                  >
                    <img src={device.image_url} alt="" className="w-full h-full object-contain p-1"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </button>
                )}
                {images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.url)}
                    className={`w-16 h-16 border overflow-hidden flex-shrink-0 transition-colors ${activeImage === img.url ? 'border-accent' : 'border-border hover:border-border-light'}`}
                  >
                    <img src={img.url} alt={img.caption ?? ''} className="w-full h-full object-contain p-1"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-6">
            {/* Status badges */}
            <div className="flex gap-2 flex-wrap">
              {!device.is_in_production && (
                <span className="text-[10px] uppercase tracking-widest border border-yellow-700 text-yellow-600 px-2 py-0.5">
                  Discontinued
                </span>
              )}
            </div>

            <div>
              <div className="text-xs text-muted uppercase tracking-widest mb-1">{device.brand}</div>
              <h1 className="text-3xl uppercase tracking-widest font-bold text-text">{device.name}</h1>
            </div>

            {/* Manufacturer */}
            {manufacturer && (
              <div className="flex items-center gap-3 border-t border-border pt-4">
                {manufacturer.logo_url && (
                  <div className="w-8 h-8 flex-shrink-0 bg-surface-2 border border-border flex items-center justify-center overflow-hidden p-1">
                    <img src={manufacturer.logo_url} alt={manufacturer.name} className="w-full h-full object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-widest">Manufacturer</div>
                  {manufacturer.website_url ? (
                    <a href={manufacturer.website_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs uppercase tracking-wider text-accent hover:underline">
                      {manufacturer.name}
                    </a>
                  ) : (
                    <div className="text-xs uppercase tracking-wider text-text">{manufacturer.name}</div>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="border-t border-border pt-4">
              {device.price ? (
                <div className="text-2xl font-bold text-text tracking-wider">
                  {device.currency}${device.price.toLocaleString()}
                </div>
              ) : (
                <div className="text-xs text-muted uppercase tracking-widest">Price not available</div>
              )}
            </div>

            {/* Description */}
            {device.description && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted leading-relaxed tracking-wide">{device.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              {device.buy_url ? (
                <a
                  href={device.buy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-widest border border-accent text-accent px-6 py-3 hover:bg-accent hover:text-background transition-colors text-center font-bold"
                >
                  Buy Now →
                </a>
              ) : (
                <span className="text-xs uppercase tracking-widest border border-border text-muted px-6 py-3 text-center cursor-not-allowed">
                  Unavailable
                </span>
              )}
              <button
                onClick={() => navigate(`/?add=${device.id}`)}
                className="text-xs uppercase tracking-widest border border-border text-muted px-6 py-2 hover:border-accent hover:text-accent transition-colors text-center"
              >
                + Add to Compare
              </button>
              <Suspense fallback={null}>
                <DeviceExportButton
                  device={device}
                  manufacturer={manufacturer}
                  categories={categories}
                  specs={specs}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Videos */}
      {videos.length > 0 && (
        <div className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="text-xs uppercase tracking-widest text-muted mb-6">Videos</div>
            <div className="grid gap-6 md:grid-cols-2">
              {videos.map(v => {
                const ytId = getYouTubeId(v.url)
                if (!ytId) return null
                return (
                  <div key={v.id}>
                    <div className="aspect-video bg-surface-2 border border-border overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title={v.caption ?? device.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                    {v.caption && (
                      <div className="mt-2 text-[10px] text-muted uppercase tracking-widest">{v.caption}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full specs */}
      {categories.length > 0 && specs.length > 0 && (
        <div className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="text-xs uppercase tracking-widest text-muted mb-6">Full Specifications</div>
            <SpecTable selectedDevices={[device]} categories={categories} specs={specs} />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted mb-2">Need Expert Guidance?</div>
            <h2 className="text-xl uppercase tracking-widest font-bold text-text mb-2">
              Let Us Help You Choose the Right Headset
            </h2>
            <p className="text-xs text-muted tracking-wider leading-relaxed max-w-md">
              BSD XR specializes in deploying immersive technology for aerospace, construction, education, and manufacturing.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <a href="https://bsdxr.com/contact" target="_blank" rel="noopener noreferrer"
              className="text-xs uppercase tracking-widest border border-accent text-accent px-6 py-3 hover:bg-accent hover:text-background transition-colors text-center font-bold">
              Book a Demo →
            </a>
            <Link to="/"
              className="text-xs uppercase tracking-widest border border-border text-muted px-6 py-2 hover:border-accent hover:text-accent transition-colors text-center">
              ← Back to Compare
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <a href="https://bsdxr.com" target="_blank" rel="noopener noreferrer">
          <img src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} alt="BSD XR"
            className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity" />
        </a>
        <div className="text-[10px] uppercase tracking-widest text-muted">
          Bit Space Development Ltd. · Winnipeg, MB, Canada · bsdxr.com
        </div>
      </footer>
    </div>
  )
}
