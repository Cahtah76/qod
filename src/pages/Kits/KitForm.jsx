import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Plus, Trash2 } from 'lucide-react'

export default function KitForm({ kit, onClose }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState(kit || {
    name: '',
    description: '',
    currentLocation: '',
    locationHistory: [],
    inventory: [],
    assignedEvents: [],
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const addInventoryItem = () => set('inventory', [...form.inventory, { item: '', qty: 1 }])
  const updateInventory = (idx, field, value) => {
    const inventory = [...form.inventory]
    inventory[idx] = { ...inventory[idx], [field]: value }
    set('inventory', inventory)
  }
  const removeInventory = (idx) => set('inventory', form.inventory.filter((_, i) => i !== idx))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (kit) {
      dispatch({ type: 'UPDATE_KIT', payload: { ...kit, ...form } })
    } else {
      dispatch({ type: 'ADD_KIT', payload: form })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Kit Name *</label>
          <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Kit Alpha-1" />
        </div>
        <div>
          <label className="label">Current Location</label>
          <input className="input" value={form.currentLocation} onChange={e => set('currentLocation', e.target.value)} placeholder="Quintar HQ - Warehouse" />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Primary AR overlay system" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Inventory</label>
          <button type="button" className="btn-secondary py-1 px-2 text-xs" onClick={addInventoryItem}>
            <Plus size={12} /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {form.inventory.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input className="input flex-1 py-1 text-xs" placeholder="Item name" value={item.item} onChange={e => updateInventory(idx, 'item', e.target.value)} />
              <input type="number" min="1" className="input w-20 py-1 text-xs" placeholder="Qty" value={item.qty} onChange={e => updateInventory(idx, 'qty', parseInt(e.target.value) || 1)} />
              <button type="button" onClick={() => removeInventory(idx)} className="text-red-500 hover:text-red-700">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {kit && (
        <div>
          <label className="label">Add Location Entry</label>
          <div className="text-xs text-gray-500">Location history is tracked automatically when kit location changes.</div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">{kit ? 'Save Changes' : 'Add Kit'}</button>
      </div>
    </form>
  )
}
