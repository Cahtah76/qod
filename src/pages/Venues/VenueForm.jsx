import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Plus, Trash2 } from 'lucide-react'

export default function VenueForm({ venue, onClose }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState(venue || {
    name: '',
    city: '',
    shippingAddress: '',
    shippingNotes: '',
    contacts: [],
    siteVisitNotes: '',
    media: [],
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const addContact = () => set('contacts', [...form.contacts, { id: Date.now().toString(), name: '', role: '', phone: '', email: '' }])
  const updateContact = (idx, field, value) => {
    const contacts = [...form.contacts]
    contacts[idx] = { ...contacts[idx], [field]: value }
    set('contacts', contacts)
  }
  const removeContact = (idx) => set('contacts', form.contacts.filter((_, i) => i !== idx))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (venue) {
      dispatch({ type: 'UPDATE_VENUE', payload: { ...venue, ...form } })
    } else {
      dispatch({ type: 'ADD_VENUE', payload: form })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Venue Name *</label>
          <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">City / State</label>
          <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Los Angeles, CA" />
        </div>
      </div>
      <div>
        <label className="label">Shipping Address</label>
        <input className="input" value={form.shippingAddress} onChange={e => set('shippingAddress', e.target.value)} />
      </div>
      <div>
        <label className="label">Shipping Notes</label>
        <textarea className="input min-h-[60px]" value={form.shippingNotes} onChange={e => set('shippingNotes', e.target.value)} />
      </div>
      <div>
        <label className="label">Site Visit Notes</label>
        <textarea className="input min-h-[80px]" value={form.siteVisitNotes} onChange={e => set('siteVisitNotes', e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Venue Contacts</label>
          <button type="button" className="btn-secondary py-1 px-2 text-xs" onClick={addContact}>
            <Plus size={12} /> Add Contact
          </button>
        </div>
        <div className="space-y-3">
          {form.contacts.map((c, idx) => (
            <div key={c.id} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded border border-gray-200">
              <input className="input py-1 text-xs" placeholder="Name" value={c.name} onChange={e => updateContact(idx, 'name', e.target.value)} />
              <input className="input py-1 text-xs" placeholder="Role" value={c.role} onChange={e => updateContact(idx, 'role', e.target.value)} />
              <input className="input py-1 text-xs" placeholder="Phone" value={c.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} />
              <div className="flex gap-2">
                <input className="input py-1 text-xs flex-1" placeholder="Email" value={c.email} onChange={e => updateContact(idx, 'email', e.target.value)} />
                <button type="button" onClick={() => removeContact(idx)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">{venue ? 'Save Changes' : 'Add Venue'}</button>
      </div>
    </form>
  )
}
