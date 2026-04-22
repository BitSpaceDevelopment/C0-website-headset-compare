import { useState } from 'react'
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from '../../lib/queries'
import type { Device, DeviceFormData } from '../../types'
import DeviceForm from '../../components/admin/DeviceForm'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

export default function DevicesPage() {
  const { data: devices = [], isLoading } = useDevices()
  const createDevice = useCreateDevice()
  const updateDevice = useUpdateDevice()
  const deleteDevice = useDeleteDevice()

  const [modal, setModal] = useState<'create' | Device | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Device | null>(null)

  async function handleCreate(data: DeviceFormData) {
    await createDevice.mutateAsync(data)
    setModal(null)
  }

  async function handleUpdate(device: Device, data: DeviceFormData) {
    await updateDevice.mutateAsync({ id: device.id, ...data })
    setModal(null)
  }

  async function handleDelete(device: Device) {
    await deleteDevice.mutateAsync(device.id)
    setConfirmDelete(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted mb-1">Admin</div>
          <h1 className="text-xl uppercase tracking-widest text-text font-bold">Devices</h1>
        </div>
        <Button onClick={() => setModal('create')}>+ Add Device</Button>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted uppercase tracking-widest">Loading...</div>
      ) : (
        <div className="border border-border overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {['Brand', 'Name', 'Price', 'Status', 'Production', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 uppercase tracking-widest text-muted font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map((device, i) => (
                <tr
                  key={device.id}
                  className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}
                >
                  <td className="px-4 py-3 text-muted uppercase tracking-wider">{device.brand}</td>
                  <td className="px-4 py-3 text-text uppercase tracking-wider">{device.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {device.price ? `${device.currency}$${device.price.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`uppercase tracking-widest ${device.is_active ? 'text-green-500' : 'text-muted'}`}>
                      {device.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`uppercase tracking-widest ${device.is_in_production ? 'text-green-500' : 'text-yellow-600'}`}>
                      {device.is_in_production ? 'Current' : 'Discontinued'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        className="text-muted hover:text-text transition-colors uppercase tracking-wider"
                        onClick={() => setModal(device)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-700 hover:text-red-500 transition-colors uppercase tracking-wider"
                        onClick={() => setConfirmDelete(device)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {devices.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted uppercase tracking-widest">
              No devices yet. Add one to get started.
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="Add Device" onClose={() => setModal(null)} wide>
          <DeviceForm onSubmit={handleCreate} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {/* Edit modal */}
      {modal && modal !== 'create' && (
        <Modal title={`Edit — ${(modal as Device).name}`} onClose={() => setModal(null)} wide>
          <DeviceForm
            device={modal as Device}
            onSubmit={data => handleUpdate(modal as Device, data)}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
          <p className="text-xs text-text mb-6">
            Delete <span className="text-accent">{confirmDelete.brand} {confirmDelete.name}</span>?
            This will also remove all spec values for this device.
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
