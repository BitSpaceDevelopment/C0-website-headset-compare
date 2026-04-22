import { useMemo } from 'react'
import { computeRowWinners } from '../../lib/specUtils'
import type { Device, SpecCategory, DeviceSpec } from '../../types'

interface Props {
  selectedDevices: (Device | null)[]
  categories: SpecCategory[]
  specs: DeviceSpec[]
}

export default function SpecTable({ selectedDevices, categories, specs }: Props) {
  const activeDevices = selectedDevices.filter(Boolean) as Device[]
  if (activeDevices.length === 0) return null

  // O(1) lookup instead of O(n) find per cell
  const specMap = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const s of specs) map.set(`${s.device_id}:${s.spec_item_id}`, s.value ?? null)
    return map
  }, [specs])

  const getValue = (deviceId: string, specItemId: string): string | null =>
    specMap.get(`${deviceId}:${specItemId}`) ?? null

  const colCount = selectedDevices.length

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <colgroup>
          <col style={{ width: '180px' }} />
          {selectedDevices.map((_, i) => (
            <col key={i} style={{ width: `${100 / colCount}%` }} />
          ))}
        </colgroup>

        {categories.map(cat => (
          <tbody key={cat.id}>
            <tr>
              <td
                colSpan={colCount + 1}
                className="px-4 py-3 bg-surface-2 border-t border-b border-border text-xs uppercase tracking-widest text-text font-bold"
              >
                {cat.name}
              </td>
            </tr>

            {(cat.spec_items ?? []).map((item, idx) => {
              const rowValues = selectedDevices.map(d =>
                d ? getValue(d.id, item.id) : null,
              )
              const winners = computeRowWinners(rowValues, item.name)
              const hasWinner = winners.some(w => w === 'winner')

              return (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-surface'}>
                  <td className="px-4 py-3 text-muted border-r border-border uppercase tracking-wider whitespace-nowrap">
                    {item.name}
                  </td>
                  {selectedDevices.map((device, di) => {
                    const raw = device ? getValue(device.id, item.id) : null
                    const display = raw ?? '—'
                    const result = winners[di]

                    let textClass = 'text-text'
                    let indicator: React.ReactNode = null

                    if (hasWinner) {
                      if (result === 'winner') {
                        textClass = 'text-accent font-bold'
                        indicator = <span className="ml-1 text-green-400 text-[10px]">↑</span>
                      } else if (result === 'loser') {
                        textClass = 'text-muted'
                      } else if (result === 'na' || !device) {
                        textClass = 'text-muted'
                      }
                    }

                    return (
                      <td
                        key={di}
                        className={`px-4 py-3 border-r border-border last:border-r-0 align-top ${textClass}`}
                      >
                        {device ? (
                          <>
                            {display}
                            {indicator}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        ))}
      </table>
    </div>
  )
}
