import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'

// Convert a UTC ISO string to the "YYYY-MM-DDTHH:MM" format that
// datetime-local inputs expect — in the user's LOCAL timezone.
function toLocalInput(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const defaultForm = {
  name: '',
  league: 'NFL',
  season: '2025-2026',
  eventType: 'Spatial',
  homeTeam: { name: '', abbreviation: '', primaryColor: '#000000' },
  awayTeam: { name: '', abbreviation: '', primaryColor: '#000000' },
  venueId: '',
  startTime: '',
  remoteCallTime: '',
  fieldCallTime: '',
  hasSetDay: true,
  surveyRequired: false,
  surveyType: '',
  kitId: '',
  crew: { remoteOperator: '', onsiteOperators: [] },
  notes: '',
}

export default function EventForm({ event, prefill, onClose }) {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(event ? {
    ...event,
    startTime: toLocalInput(event.startTime),
    remoteCallTime: toLocalInput(event.remoteCallTime),
    fieldCallTime: toLocalInput(event.fieldCallTime),
  } : {
    ...defaultForm,
    ...(prefill ? {
      ...prefill,
      startTime: toLocalInput(prefill.startTime),
    } : {}),
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
      remoteCallTime: form.remoteCallTime ? new Date(form.remoteCallTime).toISOString() : null,
      fieldCallTime: form.fieldCallTime ? new Date(form.fieldCallTime).toISOString() : null,
    }

    if (event) {
      dispatch({ type: 'UPDATE_EVENT', payload })
    } else {
      // Generate new checklist instances
      const sdTemplate = state.checklistTemplates.find(t => t.type === 'SetDay')
      const gdTemplate = state.checklistTemplates.find(t => t.type === 'GameDay')
      const sdId = 'cli_' + Math.random().toString(36).substr(2, 9)
      const gdId = 'cli_' + Math.random().toString(36).substr(2, 9)
      const evId = 'ev_' + Math.random().toString(36).substr(2, 9)

      if (sdTemplate) {
        dispatch({
          type: 'ADD_CHECKLIST_INSTANCE',
          payload: {
            id: sdId,
            templateId: sdTemplate.id,
            eventId: evId,
            type: 'SetDay',
            items: sdTemplate.items.map(item => ({
              templateItemId: item.id,
              completed: false,
              completedBy: null,
              completedAt: null,
              notes: '',
            })),
            createdAt: new Date().toISOString(),
          },
        })
      }
      if (gdTemplate) {
        dispatch({
          type: 'ADD_CHECKLIST_INSTANCE',
          payload: {
            id: gdId,
            templateId: gdTemplate.id,
            eventId: evId,
            type: 'GameDay',
            items: gdTemplate.items.map(item => ({
              templateItemId: item.id,
              completed: false,
              completedBy: null,
              completedAt: null,
              notes: '',
            })),
            createdAt: new Date().toISOString(),
          },
        })
      }

      dispatch({
        type: 'ADD_EVENT',
        payload: {
          ...payload,
          id: evId,
          setDayChecklistId: sdTemplate ? sdId : null,
          gameDayChecklistId: gdTemplate ? gdId : null,
          reportId: null,
        },
      })
    }
    onClose()
  }

  const leagues = ['NFL', 'NBA', 'NCAA Football', 'NCAA Basketball', 'MLB', 'NHL', 'MLS', 'Other']

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Event Name *</label>
          <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="NFL Week 14 — LAR vs SF" />
        </div>
        <div>
          <label className="label">League</label>
          <select className="input" value={form.league} onChange={e => set('league', e.target.value)}>
            {leagues.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Season</label>
          <input className="input" value={form.season} onChange={e => set('season', e.target.value)} />
        </div>
        <div>
          <label className="label">Event Type</label>
          <select className="input" value={form.eventType} onChange={e => set('eventType', e.target.value)}>
            <option value="Spatial">Spatial</option>
            <option value="Venue">Venue</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Home Team Name</label>
          <input className="input" value={form.homeTeam.name} onChange={e => set('homeTeam', { ...form.homeTeam, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Home Team Abbrev.</label>
          <input className="input" value={form.homeTeam.abbreviation} maxLength={5} onChange={e => set('homeTeam', { ...form.homeTeam, abbreviation: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <label className="label">Away Team Name</label>
          <input className="input" value={form.awayTeam.name} onChange={e => set('awayTeam', { ...form.awayTeam, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Away Team Abbrev.</label>
          <input className="input" value={form.awayTeam.abbreviation} maxLength={5} onChange={e => set('awayTeam', { ...form.awayTeam, abbreviation: e.target.value.toUpperCase() })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Venue</label>
          <select className="input" value={form.venueId} onChange={e => set('venueId', e.target.value)}>
            <option value="">Select venue...</option>
            {state.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Assigned Kit</label>
          <select className="input" value={form.kitId} onChange={e => set('kitId', e.target.value)}>
            <option value="">Select kit...</option>
            {state.kits.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Event Start Time</label>
          <input type="datetime-local" className="input" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
        </div>
        <div>
          <label className="label">Remote Call Time</label>
          <input type="datetime-local" className="input" value={form.remoteCallTime} onChange={e => set('remoteCallTime', e.target.value)} />
        </div>
        <div>
          <label className="label">Field Call Time</label>
          <input type="datetime-local" className="input" value={form.fieldCallTime} onChange={e => set('fieldCallTime', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Remote Operator</label>
          <select className="input" value={form.crew.remoteOperator} onChange={e => set('crew', { ...form.crew, remoteOperator: e.target.value })}>
            <option value="">Unassigned</option>
            {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">On-Site Operators</label>
          <div className="input min-h-[38px] h-auto py-1.5 space-y-1">
            {state.employees.map(emp => (
              <label key={emp.id} className="flex items-center gap-2 cursor-pointer px-0.5">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={(form.crew.onsiteOperators || []).includes(emp.id)}
                  onChange={e => {
                    const ops = form.crew.onsiteOperators || []
                    set('crew', {
                      ...form.crew,
                      onsiteOperators: e.target.checked
                        ? [...ops, emp.id]
                        : ops.filter(id => id !== emp.id),
                    })
                  }}
                />
                <span className="text-sm text-gray-700">{emp.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={form.hasSetDay !== false}
            onChange={e => set('hasSetDay', e.target.checked)}
          />
          Has Set Day
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={form.surveyRequired}
            onChange={e => set('surveyRequired', e.target.checked)}
          />
          Survey Required
        </label>
        {form.surveyRequired && (
          <input
            className="input flex-1"
            placeholder="Survey type (e.g. 5G Coverage Survey)"
            value={form.surveyType}
            onChange={e => set('surveyType', e.target.value)}
          />
        )}
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input min-h-[60px]" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">{event ? 'Save Changes' : 'Create Event'}</button>
      </div>
    </form>
  )
}
