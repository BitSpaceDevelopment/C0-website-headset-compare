import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useManufacturerImages, useAddManufacturerImage, useDeleteManufacturerImage } from '../../lib/queries'
import type { Manufacturer, ManufacturerFormData } from '../../types'
import Input from '../ui/Input'
import Button from '../ui/Button'

interface Props {
  manufacturer?: Manufacturer
  onSubmit: (data: ManufacturerFormData) => Promise<void>
  onCancel: () => void
}

export default function ManufacturerForm({ manufacturer, onSubmit, onCancel }: Props) {
  const { data: images = [] } = useManufacturerImages(manufacturer?.id)
  const addImage = useAddManufacturerImage()
  const deleteImage = useDeleteManufacturerImage()

  const [form, setForm] = useState<ManufacturerFormData>({
    name:        manufacturer?.name        ?? '',
    logo_url:    manufacturer?.logo_url    ?? '',
    website_url: manufacturer?.website_url ?? '',
    description: manufacturer?.description ?? '',
  })
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageCaption, setNewImageCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync if manufacturer prop changes
  useEffect(() => {
    if (manufacturer) {
      setForm({
        name:        manufacturer.name        ?? '',
        logo_url:    manufacturer.logo_url    ?? '',
        website_url: manufacturer.website_url ?? '',
        description: manufacturer.description ?? '',
      })
    }
  }, [manufacturer?.id])

  const set = (key: keyof ManufacturerFormData, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddImage() {
    if (!newImageUrl.trim() || !manufacturer) return
    await addImage.mutateAsync({
      manufacturer_id: manufacturer.id,
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || undefined,
    })
    setNewImageUrl('')
    setNewImageCaption('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Name" value={form.name} onChange={e => set('name', e.target.value)} required className="col-span-2" />
        <Input label="Logo URL" value={form.logo_url ?? ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." className="col-span-2" />
        <Input label="Website URL" value={form.website_url ?? ''} onChange={e => set('website_url', e.target.value)} placeholder="https://..." className="col-span-2" />
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-muted">Description</label>
          <textarea
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            rows={4}
            className="bg-surface border border-border text-text font-mono text-xs px-3 py-2 outline-none focus:border-border-light resize-none"
            placeholder="About this manufacturer..."
          />
        </div>
      </div>

      {/* Logo preview */}
      {form.logo_url && (
        <div className="flex items-center gap-3 border border-border p-3">
          <div className="w-12 h-12 bg-surface-2 border border-border flex items-center justify-center overflow-hidden p-1">
            <img src={form.logo_url} alt="Logo preview" className="w-full h-full object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <span className="text-[10px] text-muted uppercase tracking-widest">Logo preview</span>
        </div>
      )}

      {/* Image gallery (edit mode only) */}
      {manufacturer && (
        <div className="border-t border-border pt-6">
          <div className="text-xs uppercase tracking-widest text-muted mb-4">Image Gallery</div>

          {/* Existing images */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {images.map(img => (
                <div key={img.id} className="relative group border border-border">
                  <div className="aspect-square bg-surface-2 overflow-hidden">
                    <img src={img.url} alt={img.caption ?? ''} className="w-full h-full object-contain p-2"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                  {img.caption && (
                    <div className="px-2 py-1 text-[10px] text-muted uppercase tracking-widest truncate border-t border-border">
                      {img.caption}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteImage.mutate({ id: img.id, manufacturer_id: manufacturer.id })}
                    className="absolute top-1 right-1 w-5 h-5 bg-background border border-border text-red-500 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-950"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add image */}
          <div className="flex flex-col gap-2 border border-border p-3">
            <div className="text-[10px] text-muted uppercase tracking-widest mb-1">Add Image</div>
            <Input
              label="Image URL"
              value={newImageUrl}
              onChange={e => setNewImageUrl(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Caption (optional)"
              value={newImageCaption}
              onChange={e => setNewImageCaption(e.target.value)}
              placeholder="Caption..."
            />
            <Button
              type="button"
              onClick={handleAddImage}
              disabled={!newImageUrl.trim() || addImage.isPending}
              size="sm"
            >
              + Add Image
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 border border-red-900 bg-red-950/30 px-3 py-2">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : manufacturer ? 'Save Changes' : 'Add Manufacturer'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
