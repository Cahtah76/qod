import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'

export default function IssueForm({ issue, defaultLinkedTo, onClose }) {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(issue || {
    summary: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    dueDate: '',
    linkedTo: defaultLinkedTo || { type: 'Event', id: '' },
    createdBy: 'e1',
    photos: [],
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null }
    if (issue) {
      dispatch({ type: 'UPDATE_ISSUE', payload: { ...issue, ...payload } })
    } else {
      dispatch({ type: 'ADD_ISSUE', payload })
    }
    onClose()
  }

  const linkedOptions = [
    ...state.events.map(e => ({ type: 'Event', id: e.id, label: `Event: ${e.name}` })),
    ...state.venues.map(v => ({ type: 'Venue', id: v.id, label: `Venue: ${v.name}` })),
    ...state.kits.map(k => ({ type: 'Kit', id: k.id, label: `Kit: ${k.name}` })),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Summary *</label>
        <input className="input" required value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="Brief description of the issue" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[80px]" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed description..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
            {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.dueDate ? form.dueDate.slice(0, 10) : ''} onChange={e => set('dueDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Linked To</label>
          <select
            className="input"
            value={`${form.linkedTo.type}:${form.linkedTo.id}`}
            onChange={e => {
              const [type, id] = e.target.value.split(':')
              set('linkedTo', { type, id })
            }}
          >
            <option value=":">None</option>
            {linkedOptions.map(o => (
              <option key={`${o.type}:${o.id}`} value={`${o.type}:${o.id}`}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Reported By</label>
        <select className="input" value={form.createdBy} onChange={e => set('createdBy', e.target.value)}>
          {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">{issue ? 'Save Changes' : 'Create Issue'}</button>
      </div>
    </form>
  )
}
