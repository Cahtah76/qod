import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Plus, Calendar, List, Search, MapPin, Clock, Package, Sparkles, Trash2, Tv2 } from 'lucide-react'
import { tzAbbr } from '../../utils/time.js'
import { useApp, getEventStatus, getEventStatusColor, getChecklistProgress } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EventForm from './EventForm.jsx'
import ImportGamesModal from './ImportGamesModal.jsx'
import GameLookupModal from './GameLookupModal.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'

export default function EventsPage() {
  const { state, dispatch } = useApp()
  const { can } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [leagueFilter, setLeagueFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showLookup, setShowLookup] = useState(false)
  const [prefill, setPrefill] = useState(null)
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isAdmin = can('admin')

  const handleBulkDelete = () => {
    selected.forEach(id => dispatch({ type: 'DELETE_EVENT', payload: id }))
    setSelected(new Set())
    setShowDeleteConfirm(false)
  }

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleSelectAll = () => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(e => e.id)))
  }

  const leagues = ['All', ...new Set(state.events.map(e => e.league))]
  const statuses = ['Active', 'Planning', 'Set Day', 'Game Day', 'All']

  const filtered = state.events
    .filter(e => {
      if (statusFilter === 'Active' && getEventStatus(e) === 'Complete') return false
      if (statusFilter !== 'Active' && statusFilter !== 'All' && getEventStatus(e) !== statusFilter) return false
      if (leagueFilter !== 'All' && e.league !== leagueFilter) return false
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle={`${state.events.length} total events`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => setShowImport(true)}>
              <Sparkles size={14} /> Import Games
            </button>
            <button className="btn-secondary" onClick={() => setShowLookup(true)}>
              <Tv2 size={14} /> Find Game
            </button>
            <button className="btn-primary" onClick={() => { setPrefill(null); setShowModal(true) }}>
              <Plus size={14} /> Add Event
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 py-1.5 text-sm"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input py-1.5 text-sm w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input py-1.5 text-sm w-auto" value={leagueFilter} onChange={e => setLeagueFilter(e.target.value)}>
          {leagues.map(l => <option key={l}>{l}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-1 border border-gray-200 rounded p-0.5">
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded text-xs transition-colors ${view === 'list' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`p-1.5 rounded text-xs transition-colors ${view === 'calendar' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Calendar size={14} />
          </button>
        </div>
      </div>

      {isAdmin && selected.size > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-3">
          <span className="text-sm text-red-700 font-medium">{selected.size} event{selected.size !== 1 ? 's' : ''} selected</span>
          <button className="btn-danger py-1 px-3 text-xs ml-auto" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={12} /> Delete Selected
          </button>
          <button className="btn-secondary py-1 px-3 text-xs" onClick={() => setSelected(new Set())}>
            Cancel
          </button>
        </div>
      )}

      <div className="p-6">
        {view === 'list' ? (
          <EventList
            events={filtered}
            state={state}
            isAdmin={isAdmin}
            selected={selected}
            onToggle={toggleSelect}
            onToggleAll={toggleSelectAll}
          />
        ) : (
          <EventCalendar events={filtered} state={state} />
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Event" size="lg">
        <EventForm prefill={prefill} onClose={() => setShowModal(false)} />
      </Modal>

      <Modal open={showLookup} onClose={() => setShowLookup(false)} title="Find a Game" size="lg">
        <GameLookupModal
          onSelect={(game) => {
            setPrefill(game)
            setShowLookup(false)
            setShowModal(true)
          }}
          onClose={() => setShowLookup(false)}
        />
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Games" size="lg">
        <ImportGamesModal state={state} dispatch={dispatch} onClose={() => setShowImport(false)} />
      </Modal>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Events" size="sm">
        <p className="text-sm text-gray-700 mb-4">
          Permanently delete <span className="font-semibold">{selected.size} event{selected.size !== 1 ? 's' : ''}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          <button className="btn-danger" onClick={handleBulkDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}

function EventList({ events, state, isAdmin, selected, onToggle, onToggleAll }) {
  if (events.length === 0) {
    return <div className="text-center py-16 text-sm text-gray-400">No events found</div>
  }
  const allSelected = events.length > 0 && events.every(e => selected.has(e.id))
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            {isAdmin && (
              <th className="table-header w-8">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={allSelected}
                  onChange={onToggleAll}
                />
              </th>
            )}
            <th className="table-header">Event</th>
            <th className="table-header">Date / Time</th>
            <th className="table-header">Venue</th>
            <th className="table-header">Kit</th>
            <th className="table-header">Status</th>
            <th className="table-header">Progress</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => {
            const venue = state.venues.find(v => v.id === event.venueId)
            const kit = state.kits.find(k => k.id === event.kitId)
            const sdCli = state.checklistInstances.find(c => c.id === event.setDayChecklistId)
            const gdCli = state.checklistInstances.find(c => c.id === event.gameDayChecklistId)
            const sdTemplate = state.checklistTemplates.find(t => t.id === sdCli?.templateId)
            const gdTemplate = state.checklistTemplates.find(t => t.id === gdCli?.templateId)
            const sdPct = getChecklistProgress(sdCli, sdTemplate)
            const gdPct = getChecklistProgress(gdCli, gdTemplate)
            const isSelected = selected.has(event.id)
            return (
              <tr key={event.id} className={`transition-colors ${isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                {isAdmin && (
                  <td className="table-cell w-8">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={isSelected}
                      onChange={() => onToggle(event.id)}
                    />
                  </td>
                )}
                <td className="table-cell">
                  <Link to={`/events/${event.id}`} className="font-medium text-blue-700 hover:text-blue-900">
                    {event.name}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-500">{event.league} · {event.season}</span>
                    {event.eventType && (
                      <span className={`status-badge text-[10px] ${event.eventType === 'Spatial' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                        {event.eventType}
                      </span>
                    )}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="text-sm">{format(new Date(event.startTime), 'MMM d, yyyy')}</div>
                  <div className="text-xs text-gray-500">{format(new Date(event.startTime), 'h:mm a')} {tzAbbr()}</div>
                </td>
                <td className="table-cell">
                  <span className="text-sm text-gray-700">{venue?.name || '—'}</span>
                  {venue && <div className="text-xs text-gray-400">{venue.city}</div>}
                </td>
                <td className="table-cell">
                  <span className="text-sm text-gray-700">{kit?.name || '—'}</span>
                </td>
                <td className="table-cell">
                  <span className={`status-badge ${getEventStatusColor(getEventStatus(event))}`}>{getEventStatus(event)}</span>
                </td>
                <td className="table-cell min-w-[140px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-12 flex-shrink-0">Set Day</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${sdPct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${sdPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-6">{sdPct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-12 flex-shrink-0">Game Day</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${gdPct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${gdPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-6">{gdPct}%</span>
                    </div>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EventCalendar({ events, state }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()

  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))

  const eventsInMonth = events.filter(e => {
    const d = new Date(e.startTime)
    return d.getMonth() === month && d.getFullYear() === year
  })

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          className="btn-secondary py-1 px-3 text-xs"
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
        >
          ‹ Prev
        </button>
        <h3 className="text-sm font-semibold text-gray-800">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <button
          className="btn-secondary py-1 px-3 text-xs"
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
        >
          Next ›
        </button>
      </div>
      <div className="grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-500 uppercase py-2 border-b border-gray-100">
            {d}
          </div>
        ))}
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="border-b border-r border-gray-100 min-h-[80px]" />
          const dayEvents = eventsInMonth.filter(e => {
            const ed = new Date(e.startTime)
            return ed.getDate() === day.getDate()
          })
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div key={day.toISOString()} className={`border-b border-r border-gray-100 min-h-[80px] p-1.5 ${isToday ? 'bg-blue-50' : ''}`}>
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.map(e => (
                  <Link
                    key={e.id}
                    to={`/events/${e.id}`}
                    className={`block text-[10px] px-1.5 py-0.5 rounded truncate text-white font-medium`}
                    style={{ backgroundColor: '#0066cc' }}
                    title={e.name}
                  >
                    {e.homeTeam.abbreviation} vs {e.awayTeam.abbreviation}
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
