import React, { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Search, Edit, Trash2, AlertTriangle, MessageSquare, Send, Circle, Loader, CheckCircle, XCircle } from 'lucide-react'
import { useApp, getIssueStatusColor, getPriorityColor } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import IssueForm from './IssueForm.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

export default function IssuesPage() {
  const { state, dispatch } = useApp()
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [linkedFilter, setLinkedFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editIssue, setEditIssue] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [detailIssue, setDetailIssue] = useState(null)
  const [noteText, setNoteText] = useState('')

  const filtered = state.issues
    .filter(i => {
      if (statusFilter !== 'All' && i.status !== statusFilter) return false
      if (priorityFilter !== 'All' && i.priority !== priorityFilter) return false
      if (linkedFilter !== 'All' && i.linkedTo?.type !== linkedFilter) return false
      if (search && !i.summary.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      const pOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
      return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4)
    })

  const getLinkedLabel = (linkedTo) => {
    if (!linkedTo?.id) return '—'
    if (linkedTo.type === 'Event') return state.events.find(e => e.id === linkedTo.id)?.name || '—'
    if (linkedTo.type === 'Venue') return state.venues.find(v => v.id === linkedTo.id)?.name || '—'
    if (linkedTo.type === 'Kit') return state.kits.find(k => k.id === linkedTo.id)?.name || '—'
    return '—'
  }

  const openCount = state.issues.filter(i => i.status === 'Open').length
  const inProgressCount = state.issues.filter(i => i.status === 'In Progress').length
  const resolvedCount = state.issues.filter(i => i.status === 'Resolved').length
  const closedCount = state.issues.filter(i => i.status === 'Closed').length

  const statCards = [
    { label: 'Open', value: openCount, icon: Circle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500', status: 'Open' },
    { label: 'In Progress', value: inProgressCount, icon: Loader, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500', status: 'In Progress' },
    { label: 'Resolved', value: resolvedCount, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-500', status: 'Resolved' },
    { label: 'Closed', value: closedCount, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-400', status: 'Closed' },
  ]

  return (
    <div>
      <PageHeader
        title="Issue Tracking"
        subtitle={`${openCount} open · ${inProgressCount} in progress`}
        actions={
          <button className="btn-primary" onClick={() => { setEditIssue(null); setShowModal(true) }}>
            <Plus size={14} /> New Issue
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <button
            key={card.status}
            onClick={() => setStatusFilter(s => s === card.status ? 'All' : card.status)}
            className={`card p-4 border-l-4 ${card.border} text-left transition-all ${statusFilter === card.status ? 'ring-2 ring-offset-1 ring-blue-400' : 'hover:shadow-sm'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-3xl font-extrabold ${card.color}`}>{card.value}</div>
                <div className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{card.label}</div>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <card.icon size={20} className={card.color} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search issues..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input py-1.5 text-sm w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>
        <select className="input py-1.5 text-sm w-auto" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option>All</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select className="input py-1.5 text-sm w-auto" value={linkedFilter} onChange={e => setLinkedFilter(e.target.value)}>
          <option>All</option>
          <option>Event</option>
          <option>Venue</option>
          <option>Kit</option>
        </select>
      </div>

      <div className="p-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No issues found"
            description="Adjust your filters or create a new issue."
            action={<button className="btn-primary text-sm" onClick={() => setShowModal(true)}><Plus size={13} /> New Issue</button>}
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Summary</th>
                  <th className="table-header">Linked To</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Due Date</th>
                  <th className="table-header">Reported By</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(issue => {
                  const reporter = state.employees.find(e => e.id === issue.createdBy)
                  return (
                    <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell max-w-xs">
                        <button
                          className="font-medium text-blue-700 hover:text-blue-900 text-sm text-left"
                          onClick={() => { setDetailIssue(issue); setNoteText('') }}
                        >
                          {issue.summary}
                        </button>
                        {issue.description && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">{issue.description}</div>
                        )}
                        {(issue.notes?.length > 0) && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                            <MessageSquare size={10} /> {issue.notes.length} note{issue.notes.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="text-xs">
                          <span className="text-gray-400">{issue.linkedTo?.type}: </span>
                          <span className="text-gray-700">{getLinkedLabel(issue.linkedTo)}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`status-badge ${getPriorityColor(issue.priority)}`}>{issue.priority}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`status-badge ${getIssueStatusColor(issue.status)}`}>{issue.status}</span>
                      </td>
                      <td className="table-cell text-xs text-gray-600">
                        {issue.dueDate ? format(new Date(issue.dueDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-cell text-xs text-gray-600">{reporter?.name || '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditIssue(issue); setShowModal(true) }}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteId(issue.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditIssue(null) }} title={editIssue ? 'Edit Issue' : 'New Issue'} size="md">
        <IssueForm issue={editIssue} onClose={() => { setShowModal(false); setEditIssue(null) }} />
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Issue" size="sm">
        <div>
          <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete this issue?</p>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => { dispatch({ type: 'DELETE_ISSUE', payload: deleteId }); setDeleteId(null) }}>Delete</button>
          </div>
        </div>
      </Modal>

      {/* Issue Detail / Notes Modal */}
      <Modal
        open={!!detailIssue}
        onClose={() => setDetailIssue(null)}
        title="Issue Notes"
        size="md"
      >
        {detailIssue && (() => {
          const live = state.issues.find(i => i.id === detailIssue.id) || detailIssue
          const notes = live.notes || []
          const handleAddNote = () => {
            if (!noteText.trim()) return
            dispatch({ type: 'ADD_ISSUE_NOTE', payload: { issueId: live.id, text: noteText.trim(), authorId: currentUser?.id } })
            setNoteText('')
          }
          return (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{live.summary}</div>
                  {live.description && <p className="text-xs text-gray-500 mt-1">{live.description}</p>}
                </div>
                <div className="flex-shrink-0">
                  <label className="label mb-1">Status</label>
                  <select
                    className="input py-1 text-sm w-auto"
                    value={live.status}
                    onChange={e => dispatch({ type: 'UPDATE_ISSUE', payload: { ...live, status: e.target.value } })}
                  >
                    {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</div>
                {notes.length === 0 ? (
                  <div className="text-xs text-gray-400 py-4 text-center">No notes yet</div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {notes.map(note => {
                      const author = state.employees.find(e => e.id === note.authorId)
                      return (
                        <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2.5">
                          <p className="text-sm text-gray-800">{note.text}</p>
                          <div className="text-[10px] text-gray-400 mt-1.5">
                            {author?.name || 'Unknown'} · {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex gap-2">
                  <textarea
                    className="input flex-1 min-h-[60px] text-sm resize-none"
                    placeholder="Add a note..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote() }}
                  />
                  <button
                    className="btn-primary self-end px-3"
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
