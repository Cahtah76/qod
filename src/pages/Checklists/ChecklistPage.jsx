import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, ChevronRight, Clock, User, FileText } from 'lucide-react'
import { useApp, getChecklistProgress } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { tzAbbr } from '../../utils/time.js'
import ProgressBar from '../../components/ui/ProgressBar.jsx'

function getTargetTime(eventStartTime, minutesBefore) {
  if (!eventStartTime || minutesBefore == null || minutesBefore <= 0) return null
  const t = new Date(new Date(eventStartTime).getTime() - minutesBefore * 60 * 1000)
  return format(t, 'h:mm a') + ' ' + tzAbbr()
}

export default function ChecklistPage({ type }) {
  // type: 'set-day' | 'game-day' | 'instance'
  const { id, instanceId: paramInstanceId } = useParams()
  const { state, dispatch } = useApp()
  const { currentUser: authUser } = useAuth()
  const [activeNote, setActiveNote] = useState(null)
  const [noteText, setNoteText] = useState('')
  const loggedInEmp = state.employees.find(e => e.email === authUser?.email)
  const [currentUser, setCurrentUser] = useState(loggedInEmp?.id || 'e1')

  const event = state.events.find(e => e.id === id)
  if (!event) return <div className="p-6 text-sm text-gray-500">Event not found.</div>

  let instanceId
  if (type === 'instance') {
    instanceId = paramInstanceId
  } else {
    instanceId = type === 'set-day' ? event.setDayChecklistId : event.gameDayChecklistId
  }

  const instance = state.checklistInstances.find(c => c.id === instanceId)
  const template = instance ? state.checklistTemplates.find(t => t.id === instance.templateId) : null

  if (!instance || !template) return (
    <div className="p-6 text-sm text-gray-500">
      No checklist found for this event.
      <Link to={`/events/${id}`} className="ml-2 text-blue-600">← Back to event</Link>
    </div>
  )

  const pct = getChecklistProgress(instance, template)
  const completedCount = instance.items.filter(i => i.completed).length
  const totalCount = template.items.length

  const toggleItem = (templateItemId) => {
    const item = instance.items.find(i => i.templateItemId === templateItemId)
    const nowComplete = !(item?.completed ?? false)
    dispatch({
      type: 'UPDATE_CHECKLIST_ITEM',
      payload: {
        instanceId,
        templateItemId,
        updates: {
          completed: nowComplete,
          completedBy: nowComplete ? currentUser : null,
          completedAt: nowComplete ? new Date().toISOString() : null,
        },
      },
    })
  }

  const saveNote = (templateItemId) => {
    dispatch({
      type: 'UPDATE_CHECKLIST_ITEM',
      payload: { instanceId, templateItemId, updates: { notes: noteText } },
    })
    setActiveNote(null)
    setNoteText('')
  }

  const getItem = (tid) => instance.items.find(i => i.templateItemId === tid)
  const getEmployee = (eid) => state.employees.find(e => e.id === eid)

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm">
          <Link to={`/events/${event.id}`} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={13} /> {event.name}
          </Link>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="font-medium text-gray-800">
            {type === 'instance' ? template.name : (type === 'set-day' ? 'Set Day' : 'Game Day') + ' Checklist'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Completing as:</span>
            <select
              className="text-xs border border-gray-200 rounded px-2 py-1"
              value={currentUser}
              onChange={e => setCurrentUser(e.target.value)}
            >
              {state.employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : 'text-gray-700'}`}>
              {completedCount}/{totalCount}
            </span>
            <span className="text-xs text-gray-500">items</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* Progress */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">{template.name}</h2>
            {pct === 100 && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-semibold">
                <CheckCircle size={16} /> Complete
              </span>
            )}
          </div>
          <ProgressBar value={pct} />
          <div className="text-xs text-gray-500 mt-1">{completedCount} of {totalCount} items completed</div>
        </div>

        {/* Items */}
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {template.items
              .sort((a, b) => a.order - b.order)
              .map((templateItem, idx) => {
                const itemState = getItem(templateItem.id)
                const completedBy = itemState?.completedBy ? getEmployee(itemState.completedBy) : null
                const isNotingThis = activeNote === templateItem.id

                return (
                  <div key={templateItem.id} className={`p-4 ${itemState?.completed ? 'bg-green-50/40' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItem(templateItem.id)}
                        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          itemState?.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {itemState?.completed && (
                          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className={`text-sm ${itemState?.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            <span className="text-[10px] font-semibold text-gray-400 mr-1">{idx + 1}.</span>
                            {templateItem.description}
                          </div>
                          {(() => {
                            const target = getTargetTime(event.startTime, templateItem.minutesBefore)
                            return target ? (
                              <div className={`flex items-center gap-1 mt-0.5 text-[11px] font-medium
                                ${itemState?.completed ? 'text-gray-400' : 'text-blue-600'}`}>
                                <Clock size={10} />
                                {target}
                              </div>
                            ) : null
                          })()}
                        </div>

                        {templateItem.notes && (
                          <div className="text-xs text-gray-500 mt-1 italic">{templateItem.notes}</div>
                        )}

                        {itemState?.completed && completedBy && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <User size={10} />
                              {completedBy.name}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                              <Clock size={10} />
                              {format(new Date(itemState.completedAt), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        )}

                        {itemState?.notes && !isNotingThis && (
                          <div className="mt-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            Note: {itemState.notes}
                          </div>
                        )}

                        {isNotingThis ? (
                          <div className="mt-2 flex gap-2">
                            <input
                              className="input text-xs py-1 flex-1"
                              placeholder="Add a note..."
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && saveNote(templateItem.id)}
                            />
                            <button className="btn-primary text-xs py-1 px-3" onClick={() => saveNote(templateItem.id)}>Save</button>
                            <button className="btn-secondary text-xs py-1 px-2" onClick={() => setActiveNote(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button
                            className="mt-1.5 text-[10px] text-gray-400 hover:text-blue-600 flex items-center gap-1"
                            onClick={() => {
                              setActiveNote(templateItem.id)
                              setNoteText(itemState?.notes || '')
                            }}
                          >
                            <FileText size={10} />
                            {itemState?.notes ? 'Edit note' : 'Add note'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
