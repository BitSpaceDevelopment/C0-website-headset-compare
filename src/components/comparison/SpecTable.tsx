import type { Device, SpecCategory, DeviceSpec } from '../../types'

interface Props {
  selectedDevices: (Device | null)[]
  categories: SpecCategory[]
  specs: DeviceSpec[]
}

export default function SpecTable({ selectedDevices, categories, specs }: Props) {
  const activeDevices = selectedDevices.filter(Boolean) as Device[]

  if (activeDevices.length === 0) return null

  const getValue = (deviceId: string, specItemId: string) => {
    const s = specs.find(s => s.device_id === deviceId && s.spec_item_id === specItemId)
    return s?.value ?? '—'
  }

  const colCount = selectedDevices.length

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <colgroup>
          <col className="w-48" />
          {selectedDevices.map((_, i) => (
            <col key={i} style={{ width: `${100 / colCount}%` }} />
          ))}
        </colgroup>

        {categories.map(cat => (
          <tbody key={cat.id}>
            {/* Category header */}
            <tr>
              <td
                colSpan={colCount + 1}
                className="px-4 py-3 bg-surface-2 border-t border-b border-border text-xs uppercase tracking-widest text-text font-bold"
              >
                {cat.name}
              </td>
            </tr>

            {(cat.spec_items ?? []).map((item, idx) => (
              <tr
                key={item.id}
                className={idx % 2 === 0 ? 'bg-background' : 'bg-surface'}
              >
                <td className="px-4 py-3 text-muted border-r border-border uppercase tracking-wider whitespace-nowrap">
                  {item.name}
                </td>
                {selectedDevices.map((device, di) => (
                  <td key={di} className="px-4 py-3 text-text border-r border-border last:border-r-0 align-top">
                    {device ? getValue(device.id, item.id) : <span className="text-muted">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}
