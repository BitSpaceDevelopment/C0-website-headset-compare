import { useState } from 'react'
import { useManufacturers, useCreateManufacturer, useUpdateManufacturer, useDeleteManufacturer } from '../../lib/queries'
import type { Manufacturer, ManufacturerFormData } from '../../types'
import ManufacturerForm from '../../components/admin/ManufacturerForm'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

export default function ManufacturersPage() {
  const { data: manufacturers = [], isLoading } = useManufacturers()
  const createMfr = useCreateManufacturer()
  const updateMfr = useUpdateManufacturer()
  const deleteMfr = useDeleteManufacturer()

  const [modal, setModal] = useState<'create' | Manufacturer | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Manufacturer | null>(null)

  async function handleCreate(data: ManufacturerFormData) {
    await createMfr.mutateAsync(data)
    setModal(null)
  }

  async function handleUpdate(mfr: Manufacturer, data: ManufacturerFormData) {
    await updateMfr.mutateAsync({ id: mfr.id, ...data })
    setModal(null)
  }

  async function handleDelete(mfr: Manufacturer) {
    await deleteMfr.mutateAsync(mfr.id)
    setConfirmDelete(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted mb-1">Admin</div>
          <h1 className="text-xl uppercase tracking-widest text-text font-bold">Manufacturers</h1>
        </div>
        <Button onClick={() => setModal('create')}>+ Add Manufacturer</Button>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted uppercase tracking-widest">Loading...</div>
      ) : (
        <div className="border border-border overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {['Logo', 'Name', 'Website', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 uppercase tracking-widest text-muted font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {manufacturers.map((mfr, i) => (
                <tr key={mfr.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                  <td className="px-4 py-3 w-12">
                    {mfr.logo_url ? (
                      <div className="w-8 h-8 bg-surface-2 border border-border flex items-center justify-center overflow-hidden p-0.5">
                        <img src={mfr.logo_url} alt={mfr.name} className="w-full h-full object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-surface-2 border border-border" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-text uppercase tracking-wider">{mfr.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {mfr.website_url ? (
                      <a href={mfr.website_url} target="_blank" rel="noopener noreferrer"
                        className="hover:text-accent transition-colors truncate block max-w-xs">
                        {mfr.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button className="text-muted hover:text-text transition-colors uppercase tracking-wider"
                        onClick={() => setModal(mfr)}>Edit</button>
                      <button className="text-red-700 hover:text-red-500 transition-colors uppercase tracking-wider"
                        onClick={() => setConfirmDelete(mfr)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {manufacturers.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted uppercase tracking-widest">
              No manufacturers yet.
            </div>
          )}
        </div>
      )}

      {modal === 'create' && (
        <Modal title="Add Manufacturer" onClose={() => setModal(null)} wide>
          <ManufacturerForm onSubmit={handleCreate} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {modal && modal !== 'create' && (
        <Modal title={`Edit — ${(modal as Manufacturer).name}`} onClose={() => setModal(null)} wide>
          <ManufacturerForm
            manufacturer={modal as Manufacturer}
            onSubmit={data => handleUpdate(modal as Manufacturer, data)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
          <p className="text-xs text-text mb-6">
            Delete <span className="text-accent">{confirmDelete.name}</span>?
            Devices linked to this manufacturer will be unlinked.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => handleDelete(confirmDelete)}>Delete</Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
