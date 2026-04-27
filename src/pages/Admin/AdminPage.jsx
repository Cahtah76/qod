import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Settings, Users, ClipboardList, Megaphone, BarChart2, Shield,
  Plus, Edit, Trash2, GripVertical, ChevronDown, ChevronUp, ArrowRight, Clock, Calendar, KeyRound
} from 'lucide-react'
import { useApp, getEventStatus } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../utils/api.js'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import GoogleCalendarSettings from './GoogleCalendarSettings.jsx'

export default function AdminPage() {
  const { state, dispatch } = useApp()
  const location = useLocation()
  const initialTab = new URLSearchParams(location.search).get('tab') || 'overview'
  const [tab, setTab] = useState(initialTab)

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'templates', label: 'Checklist Templates' },
    { value: 'announcements', label: 'Announcements' },
    { value: 'employees', label: 'Employees' },
    { value: 'integrations', label: 'Integrations' },
  ]

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="System configuration and management"
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="p-6">
        {tab === 'overview' && <AdminOverview state={state} onTabChange={setTab} />}
        {tab === 'templates' && <ChecklistTemplates state={state} dispatch={dispatch} />}
        {tab === 'announcements' && <Announcements state={state} dispatch={dispatch} />}
        {tab === 'employees' && <AdminEmployees state={state} dispatch={dispatch} />}
        {tab === 'integrations' && <GoogleCalendarSettings />}
      </div>
    </div>
  )
}

function AdminOverview({ state, onTabChange }) {
  const stats = [
    { label: 'Total Events', value: state.events.length, link: '/events', color: 'text-blue-600' },
    { label: 'Active Events', value: state.events.filter(e => getEventStatus(e) !== 'Complete').length, link: '/events', color: 'text-green-600' },
    { label: 'Employees', value: state.employees.length, link: '/employees', color: 'text-purple-600' },
    { label: 'Open Issues', value: state.issues.filter(i => i.status === 'Open').length, link: '/issues', color: 'text-orange-600' },
    { label: 'Venues', value: state.venues.length, link: '/venues', color: 'text-gray-700' },
    { label: 'Kits', value: state.kits.length, link: '/kits', color: 'text-gray-700' },
    { label: 'Reports', value: state.reports.length, link: '/reports', color: 'text-gray-700' },
    { label: 'Documents', value: state.documentation.length, link: '/documentation', color: 'text-gray-700' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} to={s.link} className="card p-4 hover:shadow-md transition-shadow">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminQuickLink icon={ClipboardList} title="Checklist Templates" desc="Manage Set Day and Game Day templates" onClick={() => onTabChange('templates')} />
        <AdminQuickLink icon={Megaphone} title="Announcements" desc="Post global or event-specific announcements" onClick={() => onTabChange('announcements')} />
        <AdminQuickLink to="/reports" icon={BarChart2} title="Reports" desc="View and generate event reports" />
        <AdminQuickLink icon={Calendar} title="Google Calendar" desc="Connect and manage calendar event syncing" onClick={() => onTabChange('integrations')} />
      </div>
    </div>
  )
}

function AdminQuickLink({ to, icon: Icon, title, desc, onClick }) {
  const inner = (
    <>
      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-blue-600" />
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
      </div>
      <ArrowRight size={13} className="ml-auto text-gray-400 mt-1 flex-shrink-0" />
    </>
  )
  if (onClick) {
    return (
      <button onClick={onClick} className="card p-4 hover:shadow-md transition-shadow flex items-start gap-3 w-full text-left">
        {inner}
      </button>
    )
  }
  return (
    <Link to={to} className="card p-4 hover:shadow-md transition-shadow flex items-start gap-3">
      {inner}
    </Link>
  )
}

function ChecklistTemplates({ state, dispatch }) {
  const [showModal, setShowModal] = useState(false)
  const [editTemplate, setEditTemplate] = useState(null)
  const [expandedTemplate, setExpandedTemplate] = useState(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Checklist Templates</h2>
        <button className="btn-primary text-xs" onClick={() => { setEditTemplate(null); setShowModal(true) }}>
          <Plus size={13} /> New Template
        </button>
      </div>

      {state.checklistTemplates.map(template => {
        const isExpanded = expandedTemplate === template.id
        return (
          <div key={template.id} className="card">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <ClipboardList size={15} className="text-blue-600" />
                <div>
                  <div className="text-sm font-semibold text-gray-800">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.items.length} items · {template.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditTemplate(template); setShowModal(true) }} className="text-gray-400 hover:text-blue-600"><Edit size={13} /></button>
                <button onClick={() => setExpandedTemplate(isExpanded ? null : template.id)} className="text-gray-400 hover:text-gray-600">
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-2">
                <div className="space-y-1">
                  {template.items
                    .sort((a, b) => a.order - b.order)
                    .map((item, idx) => (
                      <div key={item.id} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-semibold text-gray-400 w-5 flex-shrink-0 mt-0.5">{idx + 1}</span>
                        <span className="text-sm text-gray-700 flex-1">{item.description}</span>
                        {item.notes && <span className="text-xs text-gray-500 italic">{item.notes}</span>}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditTemplate(null) }} title={editTemplate ? 'Edit Template' : 'New Template'} size="lg">
        <TemplateForm template={editTemplate} dispatch={dispatch} onClose={() => { setShowModal(false); setEditTemplate(null) }} />
      </Modal>
    </div>
  )
}

function TemplateForm({ template, dispatch, onClose }) {
  const [form, setForm] = useState(template || {
    name: '',
    type: 'SetDay',
    items: [{ id: 'ni1', order: 1, description: '', notes: '', media: [] }],
  })
  const dragIdx = React.useRef(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const addItem = () => {
    const newId = 'ni' + Date.now()
    set('items', [...form.items, { id: newId, order: form.items.length + 1, description: '', notes: '', media: [] }])
  }
  const updateItem = (idx, field, value) => {
    const items = [...form.items]
    items[idx] = { ...items[idx], [field]: value }
    set('items', items)
  }
  const removeItem = (idx) => {
    const items = form.items.filter((_, i) => i !== idx).map((item, i) => ({ ...item, order: i + 1 }))
    set('items', items)
  }

  const onDragStart = (idx) => { dragIdx.current = idx }
  const onDragOver = (e, idx) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }
  const onDrop = (targetIdx) => {
    const from = dragIdx.current
    if (from === null || from === targetIdx) { setDragOverIdx(null); return }
    const items = [...form.items]
    const [moved] = items.splice(from, 1)
    items.splice(targetIdx, 0, moved)
    set('items', items.map((item, i) => ({ ...item, order: i + 1 })))
    dragIdx.current = null
    setDragOverIdx(null)
  }
  const onDragEnd = () => { dragIdx.current = null; setDragOverIdx(null) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (template) {
      dispatch({ type: 'UPDATE_TEMPLATE', payload: { ...template, ...form } })
    } else {
      dispatch({ type: 'ADD_TEMPLATE', payload: form })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Template Name *</label>
          <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="SetDay">Set Day</option>
            <option value="GameDay">Game Day</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="label mb-0">Checklist Items</label>
            <p className="text-[10px] text-gray-400 mt-0.5">Drag <GripVertical size={9} className="inline" /> to reorder</p>
          </div>
          <button type="button" className="btn-secondary py-1 px-2 text-xs" onClick={addItem}>
            <Plus size={12} /> Add Item
          </button>
        </div>
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
          {form.items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDrop={() => onDrop(idx)}
              onDragEnd={onDragEnd}
              className={`flex gap-2 items-start p-2 rounded border transition-colors
                ${dragOverIdx === idx && dragIdx.current !== idx
                  ? 'border-blue-400 bg-blue-50'
                  : 'bg-gray-50 border-gray-200'}`}
            >
              {/* Drag handle */}
              <div className="flex-shrink-0 mt-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                <GripVertical size={14} />
              </div>
              <span className="text-[10px] font-semibold text-gray-400 mt-2 w-4 flex-shrink-0">{idx + 1}</span>
              <div className="flex-1 space-y-1.5">
                <input
                  className="input py-1.5 text-sm"
                  placeholder="Checklist item description..."
                  value={item.description}
                  onChange={e => updateItem(idx, 'description', e.target.value)}
                />
                <input
                  className="input py-1 text-xs"
                  placeholder="Notes (optional)..."
                  value={item.notes}
                  onChange={e => updateItem(idx, 'notes', e.target.value)}
                />
                {/* Time-before-start */}
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="number"
                    min="0"
                    max="99"
                    className="input py-0.5 text-xs text-center w-12"
                    placeholder="0"
                    value={item.minutesBefore != null ? Math.floor(item.minutesBefore / 60) : ''}
                    onChange={e => {
                      const hrs = Math.max(0, parseInt(e.target.value) || 0)
                      const mins = item.minutesBefore != null ? item.minutesBefore % 60 : 0
                      updateItem(idx, 'minutesBefore', hrs * 60 + mins)
                    }}
                  />
                  <span className="text-xs text-gray-400">hr</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="input py-0.5 text-xs text-center w-12"
                    placeholder="0"
                    value={item.minutesBefore != null ? item.minutesBefore % 60 : ''}
                    onChange={e => {
                      const mins = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                      const hrs = item.minutesBefore != null ? Math.floor(item.minutesBefore / 60) : 0
                      updateItem(idx, 'minutesBefore', hrs * 60 + mins)
                    }}
                  />
                  <span className="text-xs text-gray-400">min before start</span>
                  {item.minutesBefore != null && item.minutesBefore > 0 && (
                    <button
                      type="button"
                      className="text-[10px] text-gray-300 hover:text-red-400 ml-1"
                      onClick={() => updateItem(idx, 'minutesBefore', null)}
                      title="Clear time"
                    >✕</button>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 mt-1.5 flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">{template ? 'Save Changes' : 'Create Template'}</button>
      </div>
    </form>
  )
}

function Announcements({ state, dispatch }) {
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const sorted = [...state.announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Announcements</h2>
        <button className="btn-primary text-xs" onClick={() => setShowModal(true)}>
          <Plus size={13} /> New Announcement
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Title</th>
              <th className="table-header">Scope</th>
              <th className="table-header">Created By</th>
              <th className="table-header">Date</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(ann => {
              const author = state.employees.find(e => e.id === ann.createdBy)
              const linkedEvent = ann.eventId ? state.events.find(e => e.id === ann.eventId) : null
              return (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="font-medium text-sm text-gray-800">{ann.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">{ann.body}</div>
                  </td>
                  <td className="table-cell">
                    {linkedEvent ? (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{linkedEvent.name}</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Global</span>
                    )}
                  </td>
                  <td className="table-cell text-xs text-gray-600">{author?.name || '—'}</td>
                  <td className="table-cell text-xs text-gray-500">{format(new Date(ann.createdAt), 'MMM d, yyyy')}</td>
                  <td className="table-cell">
                    <button onClick={() => setDeleteId(ann.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Announcement" size="md">
        <AnnouncementForm state={state} dispatch={dispatch} onClose={() => setShowModal(false)} />
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Announcement" size="sm">
        <div>
          <p className="text-sm text-gray-700 mb-4">Delete this announcement?</p>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => { dispatch({ type: 'DELETE_ANNOUNCEMENT', payload: deleteId }); setDeleteId(null) }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function AnnouncementForm({ state, dispatch, onClose }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ title: '', body: '', eventId: '' })
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch({ type: 'ADD_ANNOUNCEMENT', payload: { ...form, createdBy: currentUser?.id || null, eventId: form.eventId || null } })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className="input" required value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div>
        <label className="label">Body *</label>
        <textarea className="input min-h-[100px]" required value={form.body} onChange={e => set('body', e.target.value)} />
      </div>
      <div>
        <label className="label">Link to Event (optional)</label>
        <select className="input" value={form.eventId} onChange={e => set('eventId', e.target.value)}>
          <option value="">Global</option>
          {state.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">Post Announcement</button>
      </div>
    </form>
  )
}

function AdminEmployees({ state }) {
  const [resetTarget, setResetTarget] = useState(null) // employee object
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function openReset(emp) {
    setResetTarget(emp)
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) return setError('Password must be at least 8 characters.')
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')
    setSaving(true)
    try {
      await api.post('/api/admin/reset-password', { employeeId: resetTarget.id, newPassword })
      setSuccess(`Password reset for ${resetTarget.name}. They will be prompted to change it on next login.`)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">All Employees</h2>
        <Link to="/employees" className="btn-secondary text-xs"><Users size={13} /> Manage Employees</Link>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Role</th>
              <th className="table-header">Email</th>
              <th className="table-header">Events</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody>
            {state.employees.map(emp => {
              const eventCount = state.events.filter(e =>
                e.crew?.remoteOperator === emp.id || e.crew?.onsiteOperators?.includes(emp.id)
              ).length
              return (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm text-gray-800">{emp.name}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge ${emp.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-gray-600">{emp.email}</td>
                  <td className="table-cell text-sm text-gray-600">{eventCount}</td>
                  <td className="table-cell">
                    <button
                      onClick={() => openReset(emp)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                      title="Reset password"
                    >
                      <KeyRound size={13} /> Reset password
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!resetTarget} onClose={() => { setResetTarget(null); setSuccess('') }} title="Reset Password" size="sm">
        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{success}</p>
            <div className="flex justify-end">
              <button className="btn-secondary" onClick={() => { setResetTarget(null); setSuccess('') }}>Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-gray-600">
              Set a new temporary password for <span className="font-semibold text-gray-900">{resetTarget?.name}</span>.
              They will be required to change it on their next login.
            </p>
            <div>
              <label className="label">New Password</label>
              <input
                autoFocus
                type="password"
                className="input w-full"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input w-full"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setResetTarget(null)}>Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                {saving ? 'Saving…' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
