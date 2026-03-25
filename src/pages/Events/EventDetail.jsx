import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { tzAbbr } from '../../utils/time.js'
import {
  MapPin, Clock, Package, Users, ClipboardList, AlertTriangle, FileText,
  Edit, ArrowLeft, Radio, CheckCircle, ChevronRight, Plus, Megaphone, Trash2, X
} from 'lucide-react'
import { useApp, getEventStatus, getEventStatusColor, getChecklistProgress, getIssueStatusColor, getPriorityColor } from '../../context/AppContext.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EventForm from './EventForm.jsx'
import IssueForm from '../Issues/IssueForm.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'

export default function EventDetail() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [showIssue, setShowIssue] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [checklistPicker, setChecklistPicker] = useState(null) // { slot: 'setDay'|'gameDay'|'extra' }

  const event = state.events.find(e => e.id === id)
  if (!event) return (
    <div className="p-6">
      <div className="text-gray-500 text-sm">Event not found.</div>
      <Link to="/events" className="btn-secondary mt-3 inline-flex">← Back to Events</Link>
    </div>
  )

  const venue = state.venues.find(v => v.id === event.venueId)
  const kit = state.kits.find(k => k.id === event.kitId)
  const remoteOp = state.employees.find(e => e.id === event.crew?.remoteOperator)
  const onsiteOps = (event.crew?.onsiteOperators || []).map(eid => state.employees.find(e => e.id === eid)).filter(Boolean)
  const sdCli = state.checklistInstances.find(c => c.id === event.setDayChecklistId)
  const gdCli = state.checklistInstances.find(c => c.id === event.gameDayChecklistId)
  const sdTmpl = sdCli ? state.checklistTemplates.find(t => t.id === sdCli.templateId) : null
  const gdTmpl = gdCli ? state.checklistTemplates.find(t => t.id === gdCli.templateId) : null
  const sdPct = getChecklistProgress(sdCli, sdTmpl)
  const gdPct = getChecklistProgress(gdCli, gdTmpl)
  const eventIssues = state.issues.filter(i => i.linkedTo?.id === event.id)
  const report = state.reports.find(r => r.id === event.reportId)
  const eventAnnouncements = state.announcements.filter(a => a.eventId === event.id)

  const handleDelete = () => {
    dispatch({ type: 'DELETE_EVENT', payload: event.id })
    navigate('/events')
  }

  const handleAssignChecklist = (templateId) => {
    dispatch({ type: 'ASSIGN_CHECKLIST_TO_EVENT', payload: { eventId: event.id, templateId, slot: checklistPicker.slot } })
    setChecklistPicker(null)
  }

  const handleRemoveExtra = (instanceId) => {
    dispatch({ type: 'REMOVE_EXTRA_CHECKLIST', payload: { eventId: event.id, instanceId } })
  }

  const extraInstances = (event.extraChecklistIds || [])
    .map(cid => state.checklistInstances.find(c => c.id === cid))
    .filter(Boolean)

  return (
    <div>
      {/* Breadcrumb + actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/events" className="hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={13} /> Events
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">{event.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-badge ${getEventStatusColor(getEventStatus(event))}`}>{getEventStatus(event)}</span>
          <button className="btn-secondary py-1.5 px-3 text-xs" onClick={() => setShowEdit(true)}>
            <Edit size={12} /> Edit
          </button>
          <button className="btn-danger py-1.5 px-3 text-xs" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Header card */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{event.name}</h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                <span className="font-medium">{event.league}</span>
                <span className="text-gray-300">|</span>
                <span>{event.season}</span>
                {event.surveyRequired && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded text-xs font-medium">
                      Survey: {event.surveyType}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 text-center flex-shrink-0">
              <div>
                <div className="text-xs text-gray-400 mb-1">Away</div>
                <div className="text-lg font-bold" style={{ color: event.awayTeam.primaryColor }}>
                  {event.awayTeam.abbreviation}
                </div>
                <div className="text-xs text-gray-500">{event.awayTeam.name}</div>
              </div>
              <div className="text-gray-400 text-lg font-light">vs</div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Home</div>
                <div className="text-lg font-bold" style={{ color: event.homeTeam.primaryColor }}>
                  {event.homeTeam.abbreviation}
                </div>
                <div className="text-xs text-gray-500">{event.homeTeam.name}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100">
            <InfoItem icon={Clock} label="Game Start" value={event.startTime ? `${format(new Date(event.startTime), 'MMM d, yyyy h:mm a')} ${tzAbbr()}` : '—'} />
            <InfoItem icon={Radio} label="Remote Call" value={event.remoteCallTime ? `${format(new Date(event.remoteCallTime), 'MMM d, h:mm a')} ${tzAbbr()}` : '—'} />
            <InfoItem icon={MapPin} label="Field Call" value={event.fieldCallTime ? `${format(new Date(event.fieldCallTime), 'MMM d, h:mm a')} ${tzAbbr()}` : '—'} />
            <InfoItem icon={MapPin} label="Venue" value={venue?.name || '—'} sub={venue?.city} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Checklist Progress */}
            <div className="card p-4">
              <div className="mb-3">
                <h3 className="section-title">Checklists</h3>
              </div>

              <div className="space-y-3">
                {/* Set Day slot */}
                <ChecklistSlot
                  label="Set Day"
                  instance={sdCli}
                  pct={sdPct}
                  linkTo={`/events/${event.id}/checklist/set-day`}
                  onAssign={() => setChecklistPicker({ slot: 'setDay' })}
                />

                {/* Game Day slot */}
                <ChecklistSlot
                  label="Game Day"
                  instance={gdCli}
                  pct={gdPct}
                  linkTo={`/events/${event.id}/checklist/game-day`}
                  onAssign={() => setChecklistPicker({ slot: 'gameDay' })}
                />

                {/* Extra checklists */}
                {extraInstances.map(inst => {
                  const tmpl = state.checklistTemplates.find(t => t.id === inst.templateId)
                  const pct = getChecklistProgress(inst, tmpl)
                  return (
                    <ChecklistSlot
                      key={inst.id}
                      label={tmpl?.name || 'Checklist'}
                      instance={inst}
                      pct={pct}
                      linkTo={`/events/${event.id}/checklist/instance/${inst.id}`}
                      onAssign={() => setChecklistPicker({ slot: 'extra' })}
                      onRemove={() => handleRemoveExtra(inst.id)}
                    />
                  )
                })}
              </div>
            </div>

            {/* Issues */}
            <div className="card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="section-title flex items-center gap-2">
                  <AlertTriangle size={13} className="text-orange-500" />
                  Issues ({eventIssues.length})
                </h3>
                <button className="btn-primary py-1 px-2.5 text-xs" onClick={() => setShowIssue(true)}>
                  <Plus size={12} /> New Issue
                </button>
              </div>
              {eventIssues.length === 0 ? (
                <div className="px-4 py-5 text-xs text-gray-400 text-center">No issues linked to this event</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Summary</th>
                      <th className="table-header">Priority</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventIssues.map(issue => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="table-cell">
                          <Link to="/issues" className="text-blue-700 hover:text-blue-900">{issue.summary}</Link>
                        </td>
                        <td className="table-cell">
                          <span className={`status-badge ${getPriorityColor(issue.priority)}`}>{issue.priority}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`status-badge ${getIssueStatusColor(issue.status)}`}>{issue.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Report */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title flex items-center gap-2">
                  <FileText size={13} className="text-gray-500" />
                  Event Report
                </h3>
              </div>
              {report ? (
                <Link to={`/reports/${report.id}`} className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50">
                  <FileText size={16} className="text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">Event Report</div>
                    <div className="text-xs text-gray-500">Created {format(new Date(report.createdAt), 'MMM d, yyyy')}</div>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-gray-400" />
                </Link>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">No report generated yet</span>
                  <Link to={`/reports/new?eventId=${event.id}`} className="btn-primary py-1.5 px-3 text-xs">
                    <Plus size={12} /> Create Report
                  </Link>
                </div>
              )}
            </div>

            {event.notes && (
              <div className="card p-4">
                <h3 className="section-title mb-2">Notes</h3>
                <p className="text-sm text-gray-700">{event.notes}</p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Crew */}
            <div className="card p-4">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <Users size={13} />
                Crew
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-gray-400 mb-1">Remote Operator</div>
                  {remoteOp ? (
                    <EmployeeChip emp={remoteOp} />
                  ) : (
                    <span className="text-xs text-gray-400">Unassigned</span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-gray-400 mb-1">Onsite Operators</div>
                  {onsiteOps.length > 0 ? (
                    <div className="space-y-1.5">
                      {onsiteOps.map(emp => <EmployeeChip key={emp.id} emp={emp} />)}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Kit */}
            <div className="card p-4">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <Package size={13} />
                Assigned Kit
              </h3>
              {kit ? (
                <Link to={`/kits`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded -mx-2">
                  <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                    <Package size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{kit.name}</div>
                    <div className="text-xs text-gray-500">{kit.currentLocation}</div>
                  </div>
                </Link>
              ) : (
                <span className="text-xs text-gray-400">No kit assigned</span>
              )}
            </div>

            {/* Venue */}
            {venue && (
              <div className="card p-4">
                <h3 className="section-title mb-3 flex items-center gap-2">
                  <MapPin size={13} />
                  Venue
                </h3>
                <Link to={`/venues/${venue.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded -mx-2">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{venue.name}</div>
                    <div className="text-xs text-gray-500">{venue.city}</div>
                  </div>
                  <ChevronRight size={13} className="ml-auto text-gray-400" />
                </Link>
              </div>
            )}

            {/* Announcements */}
            <div className="card">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <Megaphone size={13} className="text-blue-500" />
                <h3 className="section-title">Event Announcements</h3>
              </div>
              {eventAnnouncements.length === 0 ? (
                <div className="px-4 py-4 text-xs text-gray-400">No event announcements</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {eventAnnouncements.map(ann => (
                    <div key={ann.id} className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-800">{ann.title}</div>
                      <p className="text-xs text-gray-500 mt-0.5">{ann.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Event" size="lg">
        <EventForm event={event} onClose={() => setShowEdit(false)} />
      </Modal>

      <Modal open={showIssue} onClose={() => setShowIssue(false)} title="New Issue" size="md">
        <IssueForm
          defaultLinkedTo={{ type: 'Event', id: event.id }}
          onClose={() => setShowIssue(false)}
        />
      </Modal>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Event" size="sm">
        <div>
          <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete <strong>{event.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete Event</button>
          </div>
        </div>
      </Modal>

      {/* Template picker modal */}
      <Modal
        open={!!checklistPicker}
        onClose={() => setChecklistPicker(null)}
        title={checklistPicker?.slot === 'extra' ? 'Add Checklist from Template' : `Assign ${checklistPicker?.slot === 'setDay' ? 'Set Day' : 'Game Day'} Template`}
        size="md"
      >
        <TemplatePicker
          templates={state.checklistTemplates}
          onSelect={handleAssignChecklist}
          onClose={() => setChecklistPicker(null)}
        />
      </Modal>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, sub }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={12} className="text-gray-400" />
        <span className="text-[10px] uppercase font-semibold text-gray-400">{label}</span>
      </div>
      <div className="text-sm text-gray-800 font-medium">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  )
}

function ChecklistSlot({ label, instance, pct, linkTo, onAssign, onRemove }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 mr-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          {instance && (
            <span className={`text-xs font-semibold ${pct === 100 ? 'text-green-600' : 'text-gray-500'}`}>
              {pct}%
            </span>
          )}
        </div>
        {instance ? (
          <>
            <ProgressBar value={pct} showValue={false} />
            <div className="flex items-center gap-3 mt-1.5">
              <Link
                to={linkTo}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {pct === 100 ? <CheckCircle size={11} className="text-green-500" /> : <ClipboardList size={11} />}
                {pct === 100 ? 'Completed' : 'Open checklist'}
              </Link>
              <button
                onClick={onAssign}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Change template
              </button>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-400 italic">No template assigned</div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!instance && (
          <button
            onClick={onAssign}
            className="btn-primary py-1 px-2.5 text-xs"
          >
            <Plus size={11} /> Assign
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove checklist"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function TemplatePicker({ templates, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <input
        className="input w-full mb-3 text-sm"
        placeholder="Search templates…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
      />
      {filtered.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-6">No templates found</div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {filtered.map(tmpl => (
            <button
              key={tmpl.id}
              onClick={() => onSelect(tmpl.id)}
              className="w-full text-left px-3 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{tmpl.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 uppercase font-medium">{tmpl.type}</span>
                    <span className="text-[10px] text-gray-400">·</span>
                    <span className="text-[10px] text-gray-400">{tmpl.items.length} items</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 mt-0.5 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
        <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

function EmployeeChip({ emp }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
        {emp.name.charAt(0)}
      </div>
      <div>
        <div className="text-xs font-medium text-gray-800">{emp.name}</div>
      </div>
    </div>
  )
}
