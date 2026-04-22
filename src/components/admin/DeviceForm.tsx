import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useSpecCategories, useDeviceSpecs, useUpsertDeviceSpecs } from '../../lib/queries'
import type { Device, DeviceFormData } from '../../types'
import Input from '../ui/Input'
import Button from '../ui/Button'

interface Props {
  device?: Device
  onSubmit: (data: DeviceFormData) => Promise<void>
  onCancel: () => void
}

export default function DeviceForm({ device, onSubmit, onCancel }: Props) {
  const { data: categories = [] } = useSpecCategories()
  const { data: existingSpecs = [] } = useDeviceSpecs(device ? [device.id] : [])
  const upsertSpecs = useUpsertDeviceSpecs()

  const [form, setForm] = useState<DeviceFormData>({
    name:             device?.name             ?? '',
    brand:            device?.brand            ?? '',
    image_url:        device?.image_url        ?? '',
    price:            device?.price            ?? null,
    currency:         device?.currency         ?? 'CAD',
    buy_url:          device?.buy_url          ?? '',
    is_active:        device?.is_active        ?? true,
    is_in_production: device?.is_in_production ?? true,
  })

  const [specValues, setSpecValues] = useState<Record<string, string>>({})
  const [specsInitialized, setSpecsInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Populate spec fields once existing data loads
  useEffect(() => {
    if (!specsInitialized && existingSpecs.length > 0) {
      const initial: Record<string, string> = {}
      for (const s of existingSpecs) {
        if (s.value) initial[s.spec_item_id] = s.value
      }
      setSpecValues(initial)
      setSpecsInitialized(true)
    }
  }, [existingSpecs, specsInitialized])

  const set = (key: keyof DeviceFormData, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)

      if (device && Object.keys(specValues).length > 0) {
        const rows = Object.entries(specValues)
          .filter(([, v]) => v.trim() !== '')
          .map(([spec_item_id, value]) => ({ device_id: device.id, spec_item_id, value }))
        if (rows.length > 0) await upsertSpecs.mutateAsync(rows)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} required />
        <Input label="Name"  value={form.name}  onChange={e => set('name',  e.target.value)} required />
        <Input label="Price" type="number" value={form.price ?? ''} onChange={e => set('price', e.target.value ? Number(e.target.value) : null)} />
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-muted">Currency</label>
          <select
            value={form.currency}
            onChange={e => set('currency', e.target.value)}
            className="bg-surface border border-border text-text font-mono text-sm px-3 py-2 outline-none focus:border-border-light"
          >
            {['CAD', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Image URL" value={form.image_url ?? ''} onChange={e => set('image_url', e.target.value)} className="col-span-2" />
        <Input label="Buy URL"   value={form.buy_url   ?? ''} onChange={e => set('buy_url',   e.target.value)} className="col-span-2" />
        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted cursor-pointer col-span-2">
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="accent-accent" />
          Active (visible on comparison page)
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted cursor-pointer col-span-2">
          <input type="checkbox" checked={form.is_in_production} onChange={e => set('is_in_production', e.target.checked)} className="accent-accent" />
          In Production (uncheck if discontinued)
        </label>
      </div>

      {/* Spec values (edit mode only) */}
      {device && categories.length > 0 && (
        <div className="border-t border-border pt-6">
          <div className="text-xs uppercase tracking-widest text-muted mb-4">Spec Values</div>
          <div className="flex flex-col gap-6">
            {categories.map(cat => (
              <div key={cat.id}>
                <div className="text-xs uppercase tracking-widest text-text mb-3 pb-1 border-b border-border">
                  {cat.name}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(cat.spec_items ?? []).map(item => (
                    <Input
                      key={item.id}
                      label={item.name}
                      value={specValues[item.id] ?? ''}
                      onChange={e => setSpecValues(v => ({ ...v, [item.id]: e.target.value }))}
                      placeholder="—"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 border border-red-900 bg-red-950/30 px-3 py-2">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : device ? 'Save Changes' : 'Add Device'}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
