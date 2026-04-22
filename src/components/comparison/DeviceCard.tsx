import { Link } from 'react-router-dom'
import type { Device } from '../../types'

interface Props {
  device: Device | null
  filtered?: boolean
}

export default function DeviceCard({ device, filtered = false }: Props) {
  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border border-dashed border-border text-muted text-xs uppercase tracking-widest">
        —
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-3 py-4 ${filtered ? 'opacity-40' : ''}`}>
      {/* Status badges */}
      <div className="flex gap-1 flex-wrap justify-center min-h-[20px]">
        {!device.is_in_production && (
          <span className="text-[10px] uppercase tracking-widest border border-yellow-700 text-yellow-600 px-1.5 py-0.5">
            Discontinued
          </span>
        )}
        {filtered && (
          <span className="text-[10px] uppercase tracking-widest border border-orange-800 text-orange-500 px-1.5 py-0.5">
            Filtered
          </span>
        )}
      </div>

      <Link to={`/device/${device.id}`} className="group block">
        <div className="w-24 h-24 flex items-center justify-center bg-surface-2 border border-border overflow-hidden group-hover:border-accent transition-colors">
          {device.image_url ? (
            <img
              src={device.image_url}
              alt={device.name}
              className="w-full h-full object-contain p-2"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span className="text-muted text-xs uppercase tracking-wider">No img</span>
          )}
        </div>
        <div className="text-center mt-3">
          <div className="text-xs text-muted uppercase tracking-widest">{device.brand}</div>
          <div className="text-sm uppercase tracking-wider text-text font-bold mt-0.5 group-hover:text-accent transition-colors">{device.name}</div>
        </div>
      </Link>

      <div className="text-center">
        {device.price ? (
          <div className="text-xs text-text tracking-wider">
            {device.currency}${device.price.toLocaleString()}
          </div>
        ) : (
          <div className="text-xs text-muted">—</div>
        )}
      </div>

      {device.buy_url ? (
        <a
          href={device.buy_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-widest border border-accent text-accent px-4 py-1.5 hover:bg-accent hover:text-background transition-colors"
        >
          Buy →
        </a>
      ) : (
        <span className="text-xs uppercase tracking-widest border border-border text-muted px-4 py-1.5 cursor-not-allowed">
          Notify Me
        </span>
      )}
    </div>
  )
}
