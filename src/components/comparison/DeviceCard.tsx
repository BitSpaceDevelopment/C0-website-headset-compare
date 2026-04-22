import type { Device } from '../../types'

interface Props {
  device: Device | null
}

export default function DeviceCard({ device }: Props) {
  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-40 border border-dashed border-border text-muted text-xs uppercase tracking-widest">
        —
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="w-24 h-24 flex items-center justify-center bg-surface-2 border border-border overflow-hidden">
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

      <div className="text-center">
        <div className="text-xs text-muted uppercase tracking-widest">{device.brand}</div>
        <div className="text-sm uppercase tracking-wider text-text font-bold mt-0.5">{device.name}</div>
      </div>

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
