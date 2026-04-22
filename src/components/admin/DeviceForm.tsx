import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  useSpecCategories, useDeviceSpecs, useUpsertDeviceSpecs,
  useManufacturers, useDeviceMedia, useAddDeviceMedia, useDeleteDeviceMedia,
} from '../../lib/queries'
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
  const { data: manufacturers = [] } = useManufacturers()
  const { data: media = [] } = useDeviceMedia(device?.id)
  const upsertSpecs = useUpsertDeviceSpecs()
  const addMedia = useAddDeviceMedia()
  const deleteMedia = useDeleteDeviceMedia()

  const [form, setForm] = useState<DeviceFormData>({
    name:             device?.name             ?? '',
    brand:            device?.brand            ?? '',
    image_url:        device?.image_url        ?? '',
    price:            device?.price            ?? null,
    currency:         device?.currency         ?? 'CAD',
    buy_url:          device?.buy_url          ?? '',
    is_active:        device?.is_active        ?? true,
    is_in_production: device?.is_in_production ?? true,
    description:      device?.description      ?? '',
    manufacturer_id:  device?.manufacturer_id  ?? '',
  })

  const [specValues, setSpecValues] = useState<Record<string, string>>({})
  const [specsInitialized, setSpecsInitialized] = useState(false)
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [newMediaCaption, setNewMediaCaption] = useState('')
  const [newMediaType, setNewMediaType] = useState<'image' | 'youtube'>('image')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const payload = {
        ...form,
        manufacturer_id: form.manufacturer_id || null,
        description: form.description || null,
      }
      await onSubmit(payload)

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

  async function handleAddMedia() {
    if (!newMediaUrl.trim() || !device) return
    await addMedia.mutateAsync({
      device_id: device.id,
      type: newMediaType,
      url: newMediaUrl.trim(),
      caption: newMediaCaption.trim() || undefined,
    })
    setNewMediaUrl('')
    setNewMediaCaption('')
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

        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-xs uppercase tracking-widest text-muted">Manufacturer</label>
          <select
            value={form.manufacturer_id ?? ''}
            onChange={e => set('manufacturer_id', e.target.value || null)}
            className="bg-surface border border-border text-text font-mono text-sm px-3 py-2 outline-none focus:border-border-light"
          >
            <option value="">— None —</option>
            {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <Input label="Image URL"  value={form.image_url ?? ''}  onChange={e => set('image_url', e.target.value)} className="col-span-2" />
        <Input label="Buy URL"    value={form.buy_url   ?? ''}  onChange={e => set('buy_url',   e.target.value)} className="col-span-2" />

        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-muted">Description</label>
          <textarea
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            rows={3}
            className="bg-surface border border-border text-text font-mono text-xs px-3 py-2 outline-none focus:border-border-light resize-none"
            placeholder="Product description shown on the device detail page..."
          />
        </div>

        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted cursor-pointer col-span-2">
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="accent-accent" />
          Active (visible on comparison page)
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted cursor-pointer col-span-2">
          <input type="checkbox" checked={form.is_in_production} onChange={e => set('is_in_production', e.target.checked)} className="accent-accent" />
          In Production (uncheck if discontinued)
        </label>
      </div>

      {/* Media (edit mode only) */}
      {device && (
        <div className="border-t border-border pt-6">
          <div className="text-xs uppercase tracking-widest text-muted mb-4">Media — Images & Videos</div>

          {media.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {media.map(item => (
                <div key={item.id} className="relative group border border-border">
                  {item.type === 'image' ? (
                    <div className="aspect-square bg-surface-2 overflow-hidden">
                      <img src={item.url} alt={item.caption ?? ''} className="w-full h-full object-contain p-2"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  ) : (
                    <div className="aspect-square bg-surface-2 flex flex-col items-center justify-center gap-1 p-2">
                      <span className="text-muted text-lg">▶</span>
                      <span className="text-[10px] text-muted uppercase tracking-widest text-center break-all line-clamp-2">
                        {item.caption ?? 'YouTube'}
                      </span>
                    </div>
                  )}
                  <div className="px-2 py-1 border-t border-border flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted uppercase tracking-widest">{item.type}</span>
                    <button
                      type="button"
                      onClick={() => deleteMedia.mutate({ id: item.id, device_id: device.id })}
                      className="text-red-700 hover:text-red-500 text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border border-border p-3 flex flex-col gap-3">
            <div className="text-[10px] text-muted uppercase tracking-widest">Add Media</div>
            <div className="flex gap-2">
              {(['image', 'youtube'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewMediaType(t)}
                  className={`px-3 py-1 text-xs uppercase tracking-widest border transition-colors ${newMediaType === t ? 'border-accent text-accent' : 'border-border text-muted hover:border-border-light hover:text-text'}`}
                >
                  {t === 'youtube' ? 'YouTube' : 'Image'}
                </button>
              ))}
            </div>
            <Input
              label={newMediaType === 'youtube' ? 'YouTube URL' : 'Image URL'}
              value={newMediaUrl}
              onChange={e => setNewMediaUrl(e.target.value)}
              placeholder={newMediaType === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
            />
            <Input
              label="Caption (optional)"
              value={newMediaCaption}
              onChange={e => setNewMediaCaption(e.target.value)}
              placeholder="Caption..."
            />
            <Button type="button" size="sm" onClick={handleAddMedia} disabled={!newMediaUrl.trim() || addMedia.isPending}>
              + Add {newMediaType === 'youtube' ? 'Video' : 'Image'}
            </Button>
          </div>
        </div>
      )}

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
