import { useState } from 'react'
import {
  useSpecCategories,
  useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCreateSpecItem, useUpdateSpecItem, useDeleteSpecItem,
} from '../../lib/queries'
import type { SpecCategory, SpecItem } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'

export default function SpecsPage() {
  const { data: categories = [], isLoading } = useSpecCategories()
  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()
  const createItem = useCreateSpecItem()
  const updateItem = useUpdateSpecItem()
  const deleteItem = useDeleteSpecItem()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [newCatName, setNewCatName] = useState('')
  const [editCat, setEditCat] = useState<SpecCategory | null>(null)
  const [deleteCat_, setDeleteCat] = useState<SpecCategory | null>(null)

  const [newItemName, setNewItemName] = useState<Record<string, string>>({})
  const [editItem, setEditItem] = useState<SpecItem | null>(null)
  const [deleteItem_, setDeleteItem] = useState<SpecItem | null>(null)

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    await createCat.mutateAsync(newCatName.trim())
    setNewCatName('')
  }

  async function handleAddItem(catId: string) {
    const name = (newItemName[catId] ?? '').trim()
    if (!name) return
    await createItem.mutateAsync({ category_id: catId, name })
    setNewItemName(v => ({ ...v, [catId]: '' }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted mb-1">Admin</div>
          <h1 className="text-xl uppercase tracking-widest text-text font-bold">Spec Structure</h1>
        </div>
      </div>

      {/* Add category */}
      <div className="flex gap-3 mb-8">
        <Input
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          placeholder="New category name..."
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
          className="flex-1"
        />
        <Button onClick={handleAddCategory} disabled={!newCatName.trim() || createCat.isPending}>
          + Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted uppercase tracking-widest">Loading...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map(cat => (
            <div key={cat.id} className="border border-border">
              {/* Category row */}
              <div className="flex items-center justify-between px-4 py-3 bg-surface-2">
                <button
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-text hover:text-accent transition-colors"
                  onClick={() => toggleExpand(cat.id)}
                >
                  <span className="text-muted">{expanded.has(cat.id) ? '▾' : '▸'}</span>
                  {cat.name}
                  <span className="text-muted ml-1">({(cat.spec_items ?? []).length})</span>
                </button>
                <div className="flex gap-3">
                  <button className="text-xs text-muted hover:text-text transition-colors uppercase tracking-wider" onClick={() => setEditCat(cat)}>Edit</button>
                  <button className="text-xs text-red-700 hover:text-red-500 transition-colors uppercase tracking-wider" onClick={() => setDeleteCat(cat)}>Delete</button>
                </div>
              </div>

              {/* Items */}
              {expanded.has(cat.id) && (
                <div className="border-t border-border">
                  {(cat.spec_items ?? []).map((item, i) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-6 py-2.5 text-xs border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}
                    >
                      <span className="text-text uppercase tracking-wider">{item.name}</span>
                      <div className="flex gap-3">
                        <button className="text-muted hover:text-text transition-colors uppercase tracking-wider" onClick={() => setEditItem(item)}>Edit</button>
                        <button className="text-red-700 hover:text-red-500 transition-colors uppercase tracking-wider" onClick={() => setDeleteItem(item)}>Delete</button>
                      </div>
                    </div>
                  ))}

                  {/* Add item */}
                  <div className="flex gap-2 px-6 py-3 bg-surface border-t border-border">
                    <input
                      value={newItemName[cat.id] ?? ''}
                      onChange={e => setNewItemName(v => ({ ...v, [cat.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(cat.id) } }}
                      placeholder="New spec item..."
                      className="flex-1 bg-background border border-border text-text font-mono text-xs px-3 py-1.5 outline-none focus:border-border-light placeholder:text-muted"
                    />
                    <Button size="sm" onClick={() => handleAddItem(cat.id)}>+ Add</Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12 text-xs text-muted uppercase tracking-widest">
              No spec categories yet.
            </div>
          )}
        </div>
      )}

      {/* Edit category modal */}
      {editCat && (
        <EditNameModal
          title={`Edit Category — ${editCat.name}`}
          initial={editCat.name}
          onSave={async name => { await updateCat.mutateAsync({ id: editCat.id, name }); setEditCat(null) }}
          onCancel={() => setEditCat(null)}
        />
      )}

      {/* Delete category confirm */}
      {deleteCat_ && (
        <Modal title="Delete Category" onClose={() => setDeleteCat(null)}>
          <p className="text-xs text-text mb-6">
            Delete category <span className="text-accent">{deleteCat_.name}</span> and all its spec items?
            Device spec values for these items will also be removed.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={async () => { await deleteCat.mutateAsync(deleteCat_.id); setDeleteCat(null) }}>Delete</Button>
            <Button variant="ghost" onClick={() => setDeleteCat(null)}>Cancel</Button>
          </div>
        </Modal>
      )}

      {/* Edit item modal */}
      {editItem && (
        <EditNameModal
          title={`Edit Spec Item — ${editItem.name}`}
          initial={editItem.name}
          onSave={async name => { await updateItem.mutateAsync({ id: editItem.id, name }); setEditItem(null) }}
          onCancel={() => setEditItem(null)}
        />
      )}

      {/* Delete item confirm */}
      {deleteItem_ && (
        <Modal title="Delete Spec Item" onClose={() => setDeleteItem(null)}>
          <p className="text-xs text-text mb-6">
            Delete spec item <span className="text-accent">{deleteItem_.name}</span>?
            Device values for this item will also be removed.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={async () => { await deleteItem.mutateAsync(deleteItem_.id); setDeleteItem(null) }}>Delete</Button>
            <Button variant="ghost" onClick={() => setDeleteItem(null)}>Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EditNameModal({ title, initial, onSave, onCancel }: {
  title: string
  initial: string
  onSave: (name: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial)
  const [loading, setLoading] = useState(false)

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          onKeyDown={async e => {
            if (e.key === 'Enter' && name.trim()) {
              setLoading(true)
              await onSave(name.trim())
              setLoading(false)
            }
          }}
        />
        <div className="flex gap-3">
          <Button
            disabled={!name.trim() || loading}
            onClick={async () => { setLoading(true); await onSave(name.trim()); setLoading(false) }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}
