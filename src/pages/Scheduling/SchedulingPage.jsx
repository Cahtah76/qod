import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { tzAbbr } from '../../utils/time.js'
import { UserCheck, Calendar, List, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react'
import { useApp, getEventStatus } from '../../context/AppContext.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'

export default function SchedulingPage() {
  const { state, dispatch } = useApp()
  const [view, setView] = useState('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)

  const events = state.events
    .filter(e => getEventStatus(e) !== 'Complete')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })
  const startDow = startOfMonth(currentMonth).getDay()

  return (
    <div>
      <PageHeader
        title="Scheduling"
        subtitle="Assign employees to events"
        actions={
          <div className="flex items-center gap-1 border border-gray-200 rounded p-0.5">
            <button onClick={() => setView('calendar')} className={`p-1.5 rounded text-xs transition-colors ${view === 'calendar' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <Calendar size={14} />
            </button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded text-xs transition-colors ${view === 'list' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              <List size={14} />
            </button>
          </div>
        }
      />

      <div className="p-6">
        {view === 'list' ? (
          <ScheduleList events={events} state={state} onAssign={(event) => { setAssignTarget(event); setShowAssignModal(true) }} />
        ) : (
          <ScheduleCalendar
            days={days}
            startDow={startDow}
            currentMonth={currentMonth}
            events={events}
            state={state}
            onPrev={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
            onAssign={(event) => { setAssignTarget(event); setShowAssignModal(true) }}
          />
        )}
      </div>

      <Modal open={showAssignModal} onClose={() => { setShowAssignModal(false); setAssignTarget(null) }} title="Assign Crew" size="md">
        {assignTarget && <AssignCrewForm event={assignTarget} state={state} dispatch={dispatch} onClose={() => { setShowAssignModal(false); setAssignTarget(null) }} />}
      </Modal>
    </div>
  )
}

function ScheduleList({ events, state, onAssign }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header">Event</th>
            <th className="table-header">Date</th>
            <th className="table-header">Remote Operator</th>
            <th className="table-header">Onsite Operators</th>
            <th className="table-header"></th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => {
            const remoteOp = state.employees.find(e => e.id === event.crew?.remoteOperator)
            const onsiteOps = (event.crew?.onsiteOperators || []).map(id => state.employees.find(e => e.id === id)).filter(Boolean)
            return (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-gray-800">{event.name}</td>
                <td className="table-cell text-sm text-gray-600">
                  {format(new Date(event.startTime), 'MMM d, yyyy')}
                  <div className="text-xs text-gray-400">{format(new Date(event.startTime), 'h:mm a')} {tzAbbr()}</div>
                </td>
                <td className="table-cell">
                  {remoteOp ? (
                    <CrewBadge emp={remoteOp} />
                  ) : (
                    <span className="text-xs text-orange-600 font-medium">Unassigned</span>
                  )}
                </td>
                <td className="table-cell">
                  {onsiteOps.length > 0 ? (
                    <div className="space-y-1">
                      {onsiteOps.map(e => <CrewBadge key={e.id} emp={e} />)}
                    </div>
                  ) : (
                    <span className="text-xs text-orange-600 font-medium">Unassigned</span>
                  )}
                </td>
                <td className="table-cell">
                  <button className="btn-secondary py-1 px-2.5 text-xs" onClick={() => onAssign(event)}>
                    <Users size={12} /> Assign
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ScheduleCalendar({ days, startDow, currentMonth, events, state, onPrev, onNext, onAssign }) {
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  days.forEach(d => cells.push(d))

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button className="btn-secondary py-1 px-3 text-xs" onClick={onPrev}><ChevronLeft size={13} /> Prev</button>
        <h3 className="text-sm font-semibold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button className="btn-secondary py-1 px-3 text-xs" onClick={onNext}>Next <ChevronRight size={13} /></button>
      </div>
      <div className="grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-500 uppercase py-2 border-b border-gray-100">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} className="border-b border-r border-gray-100 min-h-[90px]" />
          const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day))
          const isToday = isSameDay(day, new Date())
          return (
            <div key={day.toISOString()} className={`border-b border-r border-gray-100 min-h-[90px] p-1.5 ${isToday ? 'bg-blue-50' : ''}`}>
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>{day.getDate()}</div>
              <div className="space-y-0.5">
                {dayEvents.map(e => {
                  const remoteOp = state.employees.find(emp => emp.id === e.crew?.remoteOperator)
                  const hasOnsite = (e.crew?.onsiteOperators || []).length > 0
                  const unassigned = !remoteOp || !hasOnsite
                  return (
                    <button
                      key={e.id}
                      onClick={() => onAssign(e)}
                      className={`block w-full text-left text-[10px] px-1.5 py-1 rounded text-white font-medium ${unassigned ? 'bg-orange-500' : 'bg-blue-600'}`}
                      title={e.name}
                    >
                      <div className="truncate">{e.homeTeam?.abbreviation} vs {e.awayTeam?.abbreviation}</div>
                      {unassigned && <div className="text-orange-200">⚠ Needs crew</div>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AssignCrewForm({ event, state, dispatch, onClose }) {
  const [remoteOp, setRemoteOp] = useState(event.crew?.remoteOperator || '')
  const [onsiteOps, setOnsiteOps] = useState(event.crew?.onsiteOperators || [])

  const toggleOnsite = (id) => {
    setOnsiteOps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_EVENT',
      payload: { ...event, crew: { remoteOperator: remoteOp, onsiteOperators: onsiteOps } },
    })
    onClose()
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-gray-800 mb-0.5">{event.name}</div>
        <div className="text-xs text-gray-500">{format(new Date(event.startTime), 'EEEE, MMMM d, yyyy · h:mm a')} {tzAbbr()}</div>
      </div>
      <div>
        <label className="label">Remote Operator</label>
        <select className="input" value={remoteOp} onChange={e => setRemoteOp(e.target.value)}>
          <option value="">Unassigned</option>
          {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Onsite Operators</label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
          {state.employees.map(emp => (
            <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={onsiteOps.includes(emp.id)}
                onChange={() => toggleOnsite(emp.id)}
              />
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                {emp.name.charAt(0)}
              </div>
              <div className="text-xs font-medium text-gray-800">{emp.name}</div>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>Save Assignment</button>
      </div>
    </div>
  )
}

function CrewBadge({ emp }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
        {emp.name.charAt(0)}
      </div>
      <span className="text-xs text-gray-700">{emp.name}</span>
    </div>
  )
}
