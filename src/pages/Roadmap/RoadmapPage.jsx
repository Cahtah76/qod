import React, { useState, useRef, useCallback } from 'react'
import { useRoadmap } from '../../context/RoadmapContext.jsx'
import { UNASSIGNED_TASKS } from './roadmapData.js'
import {
  Plus, X, ArrowLeft, Search, GripVertical, Calendar,
  ChevronDown, FolderOpen, Trash2, Sparkles, Send, Bot,
  MessageSquare, FileText, CheckCircle2,
  AlertTriangle, ChevronRight
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'


const KANBAN_COLUMNS = ['Backlog', 'In Progress', 'In Review', 'Done']
const PROJECT_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-700',
  Med: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-600',
}
const ASSIGNEE_COLORS = {
  JC: 'bg-blue-600 text-white',
  MR: 'bg-purple-600 text-white',
  AP: 'bg-emerald-600 text-white',
  BC: 'bg-orange-500 text-white',
  TBD: 'bg-gray-300 text-gray-600',
}
const STATUS_DOT = {
  'Done': 'bg-green-500',
  'In Review': 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  'Backlog': 'bg-gray-400',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(str) { return new Date(str + 'T00:00:00') }
function formatDateShort(str) {
  return parseDate(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function completionPct(tasks) {
  if (!tasks.length) return 0
  return Math.round((tasks.filter(t => t.status === 'Done').length / tasks.length) * 100)
}
function newId() { return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
function addDays(dateStr, n) {
  const d = parseDate(dateStr); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function makeNote(text, source = 'manual') {
  return { id: newId(), text, createdAt: new Date().toISOString(), source }
}
function formatRelTime(iso) {
  const d = new Date(iso)
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Shared small components ──────────────────────────────────────────────────

function Avatar({ initials }) {
  const cls = ASSIGNEE_COLORS[initials] || 'bg-gray-300 text-gray-600'
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold flex-shrink-0 ${cls}`}>
      {initials}
    </span>
  )
}

function PriorityBadge({ priority }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low}`}>
      {priority}
    </span>
  )
}

// ─── NotesThread ──────────────────────────────────────────────────────────────

function NotesThread({ notes = [], onAdd }) {
  const [text, setText] = useState('')

  function submit() {
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  return (
    <div className="space-y-3">
      {notes.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">No notes yet</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {notes.map(note => (
            <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2.5">
              {note.source === 'standup' && (
                <div className="flex items-center gap-1 mb-1">
                  <Bot size={10} className="text-blue-500" />
                  <span className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider">Standup</span>
                </div>
              )}
              <p className="text-xs text-gray-800 leading-relaxed">{note.text}</p>
              <p className="text-[10px] text-gray-400 mt-1">{formatRelTime(note.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          className="input flex-1 text-sm resize-none"
          rows={2}
          placeholder="Add a note… (⌘+Enter)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="btn-primary self-end px-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────

function TaskDetailModal({ task, sprintName, onClose, onUpdate }) {
  function handleAddNote(text) {
    onUpdate({ ...task, notes: [...(task.notes || []), makeNote(text)] })
  }
  function handleStatusChange(newStatus) {
    onUpdate({ ...task, status: newStatus })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16 px-4 pb-8"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{sprintName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Avatar initials={task.assignee} />
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{task.tag}</span>
            <select
              className="input py-1 text-sm w-auto ml-auto"
              value={task.status}
              onChange={e => handleStatusChange(e.target.value)}
            >
              {KANBAN_COLUMNS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
            <NotesThread notes={task.notes || []} onAdd={handleAddNote} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sprint Detail ────────────────────────────────────────────────────────────

function SprintDetail({ sprint, onClose, onUpdateSprint }) {
  const [dragTaskId, setDragTaskId] = useState(null)
  const [tab, setTab] = useState('board')
  const [detailTask, setDetailTask] = useState(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', assignee: 'JC', priority: 'Med', tag: '', status: 'Backlog' })

  function handleDrop(e, column) {
    e.preventDefault()
    if (!dragTaskId) return
    onUpdateSprint({ ...sprint, tasks: sprint.tasks.map(t => t.id === dragTaskId ? { ...t, status: column } : t) })
    setDragTaskId(null)
  }

  function handleAddTask() {
    if (!newTask.title.trim()) return
    onUpdateSprint({ ...sprint, tasks: [...sprint.tasks, { ...newTask, id: newId(), title: newTask.title.trim(), notes: [] }] })
    setNewTask({ title: '', assignee: 'JC', priority: 'Med', tag: '', status: 'Backlog' })
    setShowAddTask(false)
  }

  function handleUpdateTask(updatedTask) {
    const updated = { ...sprint, tasks: sprint.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }
    onUpdateSprint(updated)
    setDetailTask(updatedTask)
  }

  function handleAddSprintNote(text) {
    onUpdateSprint({ ...sprint, notes: [...(sprint.notes || []), makeNote(text)] })
  }

  const pct = completionPct(sprint.tasks)
  const totalNotes = sprint.tasks.reduce((n, t) => n + (t.notes?.length || 0), 0) + (sprint.notes?.length || 0)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-5xl bg-white border-l border-gray-200 flex flex-col h-full shadow-2xl"
        style={{ animation: 'slideInRight 0.2s ease-out' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{sprint.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDateShort(sprint.startDate)} – {formatDateShort(sprint.endDate)} · {sprint.tasks.length} tasks · {pct}% complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'board' && (
              <button onClick={() => setShowAddTask(true)} className="btn-primary text-xs py-1.5 px-3">
                <Plus size={13} /> Add Task
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        </div>

        {/* Progress + tabs */}
        <div className="px-5 pt-2 pb-0 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-600 rounded-full h-1.5 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
          </div>
          <div className="flex gap-1">
            {[
              ['board', 'Board'],
              ['notes', `Notes${totalNotes ? ` (${totalNotes})` : ''}`],
            ].map(([v, label]) => (
              <button key={v} onClick={() => setTab(v)}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === v ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Board tab */}
        {tab === 'board' && (
          <div className="flex-1 overflow-x-auto p-5 bg-gray-50">
            <div className="flex gap-3 h-full min-w-max">
              {KANBAN_COLUMNS.map(col => {
                const colTasks = sprint.tasks.filter(t => t.status === col)
                return (
                  <div key={col} className="w-60 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm"
                    onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col)}>
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{col}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {colTasks.length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                      {colTasks.map(task => (
                        <div key={task.id} draggable
                          onDragStart={e => { setDragTaskId(task.id); e.dataTransfer.effectAllowed = 'move' }}
                          onClick={() => setDetailTask(task)}
                          className="bg-white border border-gray-200 rounded-lg p-2.5 cursor-pointer group hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-2">
                            <span className="text-xs text-gray-800 leading-snug">{task.title}</span>
                            <GripVertical size={11} className="text-gray-300 flex-shrink-0 group-hover:text-gray-400 mt-0.5" />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Avatar initials={task.assignee} />
                            <PriorityBadge priority={task.priority} />
                            <span className="text-[9px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{task.tag}</span>
                            {task.notes?.length > 0 && (
                              <span className="ml-auto flex items-center gap-0.5 text-[9px] text-gray-400">
                                <MessageSquare size={9} />{task.notes.length}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {!colTasks.length && (
                        <div className="text-center text-gray-300 text-xs py-6">Drop here</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes tab */}
        {tab === 'notes' && (
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
            <div className="max-w-2xl space-y-6">
              {/* Sprint notes */}
              <div className="card p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sprint Notes</p>
                <NotesThread notes={sprint.notes || []} onAdd={handleAddSprintNote} />
              </div>

              {/* Per-task notes */}
              {sprint.tasks.filter(t => t.notes?.length > 0).map(task => (
                <div key={task.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar initials={task.assignee} />
                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">{task.title}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[task.status] || 'bg-gray-400'}`} />
                    <span className="text-xs text-gray-400">{task.status}</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {task.notes.map(note => (
                      <div key={note.id} className="bg-gray-50 rounded-lg px-3 py-2">
                        {note.source === 'standup' && (
                          <div className="flex items-center gap-1 mb-0.5">
                            <Bot size={9} className="text-blue-500" />
                            <span className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider">Standup</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-700">{note.text}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatRelTime(note.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Task modal */}
        {showAddTask && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg border border-gray-200 shadow-xl p-5 w-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">New Task</h3>
                <button onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
              </div>
              <div className="space-y-3">
                <div><label className="label">Title</label>
                  <input autoFocus className="input text-sm" placeholder="Task title" value={newTask.title}
                    onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label">Assignee</label>
                    <select className="input text-sm" value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}>
                      {['JC', 'MR', 'AP', 'BC'].map(a => <option key={a}>{a}</option>)}</select></div>
                  <div><label className="label">Priority</label>
                    <select className="input text-sm" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
                      {['High', 'Med', 'Low'].map(p => <option key={p}>{p}</option>)}</select></div>
                </div>
                <div><label className="label">Tag</label>
                  <input className="input text-sm" placeholder="e.g. SDK, AR Engine" value={newTask.tag}
                    onChange={e => setNewTask(p => ({ ...p, tag: e.target.value }))} /></div>
                <div><label className="label">Column</label>
                  <select className="input text-sm" value={newTask.status} onChange={e => setNewTask(p => ({ ...p, status: e.target.value }))}>
                    {KANBAN_COLUMNS.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary flex-1 justify-center text-sm" onClick={() => setShowAddTask(false)}>Cancel</button>
                <button className="btn-primary flex-1 justify-center text-sm" onClick={handleAddTask}>Add Task</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task detail modal — z-[60] so it floats above the drawer */}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          sprintName={sprint.name}
          onClose={() => setDetailTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const CANVAS_W = 1400
const CANVAS_H = 180
const DRAG_THRESHOLD = 6

function TimelineView({ sprints, projectColor, onSprintClick, onAddSprint }) {
  const scrollRef = useRef(null)
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })
  const [showNewSprint, setShowNewSprint] = useState(false)
  const [newSprint, setNewSprint] = useState({ name: '', startDate: '', endDate: '' })

  const allDates = sprints.flatMap(s => [parseDate(s.startDate), parseDate(s.endDate)])
  const minDate = allDates.length ? new Date(Math.min(...allDates) - 18 * 86400000) : new Date(Date.now() - 30 * 86400000)
  const maxDate = allDates.length ? new Date(Math.max(...allDates) + 18 * 86400000) : new Date(Date.now() + 60 * 86400000)
  const totalMs = maxDate - minDate

  function msToX(ms) { return ((ms - minDate) / totalMs) * CANVAS_W }
  function dateToX(str) { return msToX(parseDate(str).getTime()) }
  function xToDate(x) { return new Date(minDate.getTime() + (x / CANVAS_W) * totalMs).toISOString().slice(0, 10) }

  const ticks = []
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  while (cur <= maxDate) { ticks.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1) }

  const didScroll = useRef(false)
  const scrollOnMount = useCallback(node => {
    if (!node || didScroll.current) return
    didScroll.current = true
    node.scrollLeft = msToX(Date.now()) - node.clientWidth / 2
  }, [])

  function onMouseDown(e) {
    if (e.button !== 0) return
    drag.current = { active: true, startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft, moved: false }
    e.currentTarget.style.cursor = 'grabbing'
  }
  function onMouseMove(e) {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > DRAG_THRESHOLD) drag.current.moved = true
    if (drag.current.moved) scrollRef.current.scrollLeft = drag.current.scrollLeft - dx
  }
  function onMouseUp(e) {
    if (!drag.current.active) return
    drag.current.active = false
    e.currentTarget.style.cursor = 'grab'
    if (!drag.current.moved) {
      const rect = e.currentTarget.querySelector('[data-canvas]').getBoundingClientRect()
      const dateStr = xToDate(e.clientX - rect.left)
      setNewSprint({ name: '', startDate: dateStr, endDate: addDays(dateStr, 13) })
      setShowNewSprint(true)
    }
  }
  function onMouseLeave(e) {
    if (drag.current.active) { drag.current.active = false; e.currentTarget.style.cursor = 'grab' }
  }

  function handleCreate() {
    if (!newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate) return
    onAddSprint({ ...newSprint, name: newSprint.name.trim(), id: newId(), tasks: [], notes: [] })
    setShowNewSprint(false)
  }

  const today = new Date()
  const todayInRange = today >= minDate && today <= maxDate
  const AXIS_Y = Math.floor(CANVAS_H / 2)

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 px-0.5">
        <Calendar size={11} /> Drag to pan · Click to create a sprint
      </p>
      <div
        ref={node => { scrollRef.current = node; scrollOnMount(node) }}
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white select-none"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
      >
        <div data-canvas className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
          <div className="absolute left-0 right-0 bg-gray-200" style={{ top: AXIS_Y, height: 2 }} />

          {ticks.map((tick, i) => {
            const x = msToX(tick.getTime())
            return (
              <div key={i} className="absolute" style={{ left: x, top: AXIS_Y - 6, transform: 'translateX(-50%)' }}>
                <div className="w-px h-3 bg-gray-300 mx-auto" />
                <span className="text-[9px] text-gray-400 whitespace-nowrap block text-center mt-0.5">
                  {tick.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </span>
              </div>
            )
          })}

          {todayInRange && (() => {
            const x = msToX(today.getTime())
            return (
              <div className="absolute flex flex-col items-center" style={{ left: x, top: AXIS_Y - 36, transform: 'translateX(-50%)' }}>
                <span className="text-[8px] text-blue-600 font-bold mb-0.5">TODAY</span>
                <div className="w-px bg-blue-400" style={{ height: 72 }} />
              </div>
            )
          })()}

          {sprints.map((sprint, i) => {
            const x = dateToX(sprint.startDate)
            const w = Math.max(dateToX(sprint.endDate) - x, 120)
            const above = i % 2 === 0
            const pct = completionPct(sprint.tasks)
            const cardTop = above ? AXIS_Y - 78 : AXIS_Y + 8
            return (
              <div key={sprint.id} className="absolute" style={{ left: x, width: w, top: cardTop }}>
                <div className="absolute bg-gray-300" style={{
                  left: '50%', width: 1,
                  ...(above ? { top: '100%', height: 8 } : { bottom: '100%', height: 8 }),
                }} />
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onSprintClick(sprint) }}
                  className="w-full text-left card p-2 hover:shadow-md transition-all group"
                >
                  <div className="text-[10px] font-semibold text-gray-900 mb-0.5 truncate group-hover:text-blue-700 transition-colors leading-tight">
                    {sprint.name}
                  </div>
                  <div className="text-[9px] text-gray-400 mb-1">
                    {formatDateShort(sprint.startDate)} – {formatDateShort(sprint.endDate)} · {sprint.tasks.length}t
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div className="rounded-full h-1 transition-all" style={{ width: `${pct}%`, backgroundColor: projectColor }} />
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={showNewSprint} onClose={() => setShowNewSprint(false)} title="New Sprint" size="sm">
        <div className="space-y-3">
          <div><label className="label">Sprint name</label>
            <input autoFocus className="input" placeholder="e.g. Sprint 5 — Mobile Rollout"
              value={newSprint.name} onChange={e => setNewSprint(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start date</label>
              <input type="date" className="input" value={newSprint.startDate}
                onChange={e => setNewSprint(p => ({ ...p, startDate: e.target.value }))} /></div>
            <div><label className="label">End date</label>
              <input type="date" className="input" value={newSprint.endDate}
                onChange={e => setNewSprint(p => ({ ...p, endDate: e.target.value }))} /></div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-secondary flex-1 justify-center" onClick={() => setShowNewSprint(false)}>Cancel</button>
          <button className="btn-primary flex-1 justify-center" onClick={handleCreate}>Create Sprint</button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Local standup parser ─────────────────────────────────────────────────────

const DONE_KW     = ['done', 'complete', 'completed', 'finished', 'merged', 'shipped', 'deployed', 'closed', 'fixed', 'resolved', 'wrapped up']
const REVIEW_KW   = ['in review', 'under review', 'code review', 'pr up', 'pr open', 'pull request', 'reviewing']
const PROGRESS_KW = ['in progress', 'started', 'working on', 'wip', 'began', 'ongoing', 'continuing', 'picked up']

function detectStatus(line) {
  const l = line.toLowerCase()
  if (DONE_KW.some(k => l.includes(k))) return 'Done'
  if (REVIEW_KW.some(k => l.includes(k))) return 'In Review'
  if (PROGRESS_KW.some(k => l.includes(k))) return 'In Progress'
  return null
}

function taskMatchScore(line, task) {
  const l = line.toLowerCase()
  const words = task.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  if (!words.length) return 0
  return words.filter(w => l.includes(w)).length / words.length
}

function cleanLine(line) {
  return line
    .replace(/^[-•*]\s+/, '')
    .replace(/^(?:new|add|todo)[:\s]+/i, '')
    .replace(/^[A-Za-z]{2,4}:\s+/, '')  // strip speaker initials like "JC: "
    .replace(/\s+/g, ' ')
    .trim()
}

function buildTaskNote(line, newStatus, allTasks) {
  const clean = cleanLine(line)
  // Remove redundant status keywords already conveyed by the status change
  const stripped = clean
    .replace(/\b(done|complete|completed|finished|merged|shipped|in progress|in review|started|wip|working on)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const note = (stripped.length > 8 ? stripped : clean).replace(/^./, c => c.toUpperCase())
  return note || `Marked ${newStatus} in standup`
}

function buildProjectNote(lines, taskUpdates, allTasks) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const attendeeLine = lines.find(l => /^attendees?:/i.test(l))
  const attendees = attendeeLine?.replace(/^attendees?:\s*/i, '').trim()

  const updatedNames = taskUpdates.map(u => {
    const task = allTasks.find(t => t.id === u.taskId)
    return task ? `${task.title} (→ ${u.newStatus})` : null
  }).filter(Boolean)

  const flagged = lines
    .filter(l => /blocked?|risk|decision|decided|concern|escalat/i.test(l))
    .map(l => cleanLine(l))
    .filter(l => l.length > 8)
    .slice(0, 2)

  const parts = []
  if (attendees) parts.push(`Attendees: ${attendees}`)
  if (updatedNames.length) parts.push(`Updates: ${updatedNames.join('; ')}`)
  if (flagged.length) parts.push(`Noted: ${flagged.join('; ')}`)
  if (!parts.length) parts.push(`${lines.length} items discussed`)

  return `Standup ${date} — ${parts.join(' · ')}`
}

function parseStandupLocally(notesText, project) {
  const lines = notesText.split('\n').map(l => l.trim()).filter(Boolean)
  const allTasks = project.sprints.flatMap(s => s.tasks.map(t => ({ ...t, sprintId: s.id })))
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const taskUpdates = []
  const usedTaskIds = new Set()

  for (const line of lines) {
    let bestTask = null, bestScore = 0
    for (const task of allTasks) {
      if (usedTaskIds.has(task.id)) continue
      const score = taskMatchScore(line, task)
      if (score > bestScore) { bestScore = score; bestTask = task }
    }
    if (bestTask && bestScore >= 0.4) {
      const newStatus = detectStatus(line)
      if (newStatus && newStatus !== bestTask.status) {
        taskUpdates.push({ taskId: bestTask.id, newStatus, note: buildTaskNote(line, newStatus, allTasks) })
        usedTaskIds.add(bestTask.id)
      }
    }
  }

  // New tasks: bullet lines that don't match any existing task
  const newTasks = []
  const activeSprint = project.sprints.find(s => parseDate(s.startDate) <= today && parseDate(s.endDate) >= today)
  for (const line of lines) {
    if (!/^[-•*]\s+/.test(line) && !/^(?:new|add|todo)[:\s]/i.test(line)) continue
    const title = cleanLine(line)
    if (title.length < 6) continue
    const alreadyMatched = allTasks.some(t => taskMatchScore(line, t) >= 0.4)
    if (!alreadyMatched) {
      newTasks.push({ title, assignee: 'TBD', priority: 'Med', tag: '', sprintId: activeSprint?.id || null })
    }
  }

  const projectNote = buildProjectNote(lines, taskUpdates, allTasks)

  const summary = (taskUpdates.length || newTasks.length)
    ? `Matched ${taskUpdates.length} task update${taskUpdates.length !== 1 ? 's' : ''} and ${newTasks.length} new item${newTasks.length !== 1 ? 's' : ''} from keyword analysis.`
    : 'No task matches found — standup notes will be saved as a project log entry.'

  return { summary, taskUpdates, newTasks, projectNote, sprintNotes: [] }
}

// ─── Standup Import Modal ─────────────────────────────────────────────────────

function StandupImportModal({ open, onClose, project, onApply }) {
  const [step, setStep] = useState('input')
  const [notesText, setNotesText] = useState('')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [selTaskUpdates, setSelTaskUpdates] = useState(new Set())
  const [selNewTasks, setSelNewTasks] = useState(new Set())

  function reset() { setStep('input'); setNotesText(''); setPreview(null); setError('') }

  function analyze() {
    if (!notesText.trim()) return
    const result = parseStandupLocally(notesText, project)
    setPreview(result)
    setSelTaskUpdates(new Set((result.taskUpdates || []).map(u => u.taskId)))
    setSelNewTasks(new Set((result.newTasks || []).map((_, i) => i)))
    setStep('preview')
  }

  function apply() {
    const taskUpdates = (preview.taskUpdates || []).filter(u => selTaskUpdates.has(u.taskId))
    const newTasks = (preview.newTasks || []).filter((_, i) => selNewTasks.has(i))
    onApply({ preview, taskUpdates, newTasks })
    reset()
    onClose()
  }

  function getTaskTitle(id) {
    for (const s of project.sprints) { const t = s.tasks.find(t => t.id === id); if (t) return t.title }
    return id
  }
  function getTaskStatus(id) {
    for (const s of project.sprints) { const t = s.tasks.find(t => t.id === id); if (t) return t.status }
    return '?'
  }
  function getSprintName(id) { return project.sprints.find(s => s.id === id)?.name || id }

  const totalChanges = selTaskUpdates.size + selNewTasks.size

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-8"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">Import Standup Notes</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {step === 'input' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Paste your Gemini meeting notes below. Tasks will be matched by keyword and status updates detected automatically.
              </p>
              <textarea
                autoFocus
                className="input w-full text-sm font-mono resize-none"
                style={{ minHeight: 220 }}
                placeholder={`Paste standup notes here…\n\ne.g.\nAttendees: James, Mark, Amy\n\n- AR anchor calibration: James confirmed complete\n- Asset streaming: Mark says 80% done, ETA Thursday\n- New: investigate memory leak in iOS renderer`}
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
              />
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
              <button className="btn-secondary" onClick={reset}>Try again</button>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-blue-600" />
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Summary</span>
                </div>
                <p className="text-sm text-blue-900">{preview.summary}</p>
              </div>

              {preview.taskUpdates?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Task Updates ({preview.taskUpdates.length})
                  </p>
                  <div className="space-y-1.5">
                    {preview.taskUpdates.map(u => (
                      <label key={u.taskId} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" className="mt-0.5 flex-shrink-0"
                          checked={selTaskUpdates.has(u.taskId)}
                          onChange={e => setSelTaskUpdates(prev => {
                            const n = new Set(prev); e.target.checked ? n.add(u.taskId) : n.delete(u.taskId); return n
                          })} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{getTaskTitle(u.taskId)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{getTaskStatus(u.taskId)}</span>
                            <span className="text-xs text-gray-300">→</span>
                            <span className={`text-xs font-semibold ${
                              u.newStatus === 'Done' ? 'text-green-600' :
                              u.newStatus === 'In Progress' ? 'text-yellow-600' :
                              u.newStatus === 'In Review' ? 'text-blue-600' : 'text-gray-600'
                            }`}>{u.newStatus}</span>
                          </div>
                          {u.note && <p className="text-xs text-gray-500 mt-0.5">{u.note}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {preview.newTasks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    New Tasks ({preview.newTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {preview.newTasks.map((t, i) => (
                      <label key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input type="checkbox" className="mt-0.5 flex-shrink-0"
                          checked={selNewTasks.has(i)}
                          onChange={e => setSelNewTasks(prev => {
                            const n = new Set(prev); e.target.checked ? n.add(i) : n.delete(i); return n
                          })} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <PriorityBadge priority={t.priority} />
                            {t.tag && <span className="text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{t.tag}</span>}
                            {t.sprintId && <span className="text-xs text-gray-400">→ {getSprintName(t.sprintId)}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {(preview.projectNote || preview.sprintNotes?.length > 0) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes to be Added</p>
                  <div className="space-y-1.5">
                    {preview.projectNote && (
                      <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-[10px] font-semibold text-gray-400 mb-1">Project · {project.name}</p>
                        <p className="text-xs text-gray-700">{preview.projectNote}</p>
                      </div>
                    )}
                    {preview.sprintNotes?.map(sn => (
                      <div key={sn.sprintId} className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-400">
                        <p className="text-[10px] font-semibold text-gray-400 mb-1">Sprint · {getSprintName(sn.sprintId)}</p>
                        <p className="text-xs text-gray-700">{sn.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!preview.taskUpdates?.length && !preview.newTasks?.length && !preview.projectNote && (
                <p className="text-center text-sm text-gray-500 py-8">No actionable updates found in these notes.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 flex-shrink-0">
          <button className="btn-secondary" onClick={step === 'preview' ? reset : onClose}>
            {step === 'preview' ? '← Back' : 'Cancel'}
          </button>
          {step === 'input' && (
            <button className="btn-primary" onClick={analyze} disabled={!notesText.trim()}>
              <Sparkles size={14} /> Analyze
            </button>
          )}
          {step === 'preview' && (
            <button className="btn-primary" onClick={apply}>
              Apply {totalChanges > 0 ? `${totalChanges} change${totalChanges !== 1 ? 's' : ''}` : 'notes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Project Status Summary ───────────────────────────────────────────────────

const HEALTH_STYLE = {
  'On Track': { border: 'border-l-green-400', badge: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  'At Risk':  { border: 'border-l-yellow-400', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  'Blocked':  { border: 'border-l-red-400', badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
}

function computeProjectSummary(project) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { sprints } = project
  if (!sprints.length) return null

  const completed = sprints.filter(s => parseDate(s.endDate) < today)
  const active = sprints.filter(s => parseDate(s.startDate) <= today && parseDate(s.endDate) >= today)
  const upcoming = sprints.filter(s => parseDate(s.startDate) > today)

  const allTasks = sprints.flatMap(s => s.tasks)
  const doneTasks = allTasks.filter(t => t.status === 'Done')
  const inProgressTasks = allTasks.filter(t => t.status === 'In Progress' || t.status === 'In Review')
  const backlogTasks = allTasks.filter(t => t.status === 'Backlog')
  const highPriorityIncomplete = allTasks.filter(t => t.priority === 'High' && t.status !== 'Done')
  const overallPct = allTasks.length ? Math.round((doneTasks.length / allTasks.length) * 100) : 0

  const allNoteTexts = [
    ...(project.notes || []).map(n => n.text.toLowerCase()),
    ...sprints.flatMap(s => [
      ...(s.notes || []).map(n => n.text.toLowerCase()),
      ...s.tasks.flatMap(t => (t.notes || []).map(n => n.text.toLowerCase())),
    ]),
  ]
  const hasBlockerMention = allNoteTexts.some(t => t.includes('block') || t.includes('stuck'))

  const overdueWithLowCompletion = completed.filter(s => completionPct(s.tasks) < 70)

  let activeBehind = false
  for (const s of active) {
    const start = parseDate(s.startDate).getTime()
    const end = parseDate(s.endDate).getTime()
    const elapsed = (today.getTime() - start) / (end - start)
    if (elapsed > 0.6 && completionPct(s.tasks) / 100 < elapsed - 0.25) activeBehind = true
  }

  let health = 'On Track'
  if (hasBlockerMention) {
    health = 'Blocked'
  } else if (overdueWithLowCompletion.length > 0 || activeBehind || highPriorityIncomplete.length > 3) {
    health = 'At Risk'
  }

  const activeSprint = active[0] || completed[completed.length - 1]
  let headline
  if (active.length > 0) {
    const pct = completionPct(activeSprint.tasks)
    headline = `${activeSprint.name} is ${pct}% complete — ${allTasks.length - doneTasks.length} task${allTasks.length - doneTasks.length !== 1 ? 's' : ''} remaining`
  } else if (upcoming.length > 0) {
    headline = `${doneTasks.length} of ${allTasks.length} tasks complete · ${upcoming[0].name} starts ${formatDateShort(upcoming[0].startDate)}`
  } else {
    headline = `${doneTasks.length} of ${allTasks.length} tasks complete across ${completed.length} sprint${completed.length !== 1 ? 's' : ''}`
  }

  const summaryParts = []
  if (completed.length > 0) {
    const avgPct = Math.round(completed.reduce((n, s) => n + completionPct(s.tasks), 0) / completed.length)
    summaryParts.push(`${completed.length} sprint${completed.length !== 1 ? 's' : ''} completed (avg ${avgPct}% done)`)
  }
  if (active.length > 0) summaryParts.push(`${active.length} sprint${active.length !== 1 ? 's' : ''} currently active`)
  if (inProgressTasks.length > 0) summaryParts.push(`${inProgressTasks.length} task${inProgressTasks.length !== 1 ? 's' : ''} in progress or review`)
  if (upcoming.length > 0) summaryParts.push(`${upcoming.length} sprint${upcoming.length !== 1 ? 's' : ''} upcoming`)
  const summary = summaryParts.join(' · ') + '.'

  const highlights = []
  if (doneTasks.length > 0) highlights.push(`${doneTasks.length} task${doneTasks.length !== 1 ? 's' : ''} completed (${overallPct}% overall)`)
  const doneHighPriority = allTasks.filter(t => t.priority === 'High' && t.status === 'Done')
  if (doneHighPriority.length > 0) highlights.push(`${doneHighPriority.length} high-priority item${doneHighPriority.length !== 1 ? 's' : ''} shipped`)
  if (completed.length > 0 && overdueWithLowCompletion.length === 0) highlights.push('All completed sprints closed in good shape')

  const risks = []
  if (overdueWithLowCompletion.length > 0) risks.push(`${overdueWithLowCompletion.map(s => s.name).join(', ')} ended with work incomplete`)
  if (highPriorityIncomplete.length > 0) risks.push(`${highPriorityIncomplete.length} high-priority task${highPriorityIncomplete.length !== 1 ? 's' : ''} still open`)
  if (activeBehind) risks.push('Active sprint is behind schedule')

  const upcomingItems = []
  for (const s of active) upcomingItems.push(`${s.name} ends ${formatDateShort(s.endDate)}`)
  for (const s of upcoming.slice(0, 2)) upcomingItems.push(`${s.name} starts ${formatDateShort(s.startDate)}`)
  const highBacklog = backlogTasks.filter(t => t.priority === 'High')
  if (highBacklog.length > 0) upcomingItems.push(`${highBacklog.length} high-priority backlog item${highBacklog.length !== 1 ? 's' : ''} to schedule`)

  return { health, headline, summary, highlights, risks, upcoming: upcomingItems }
}

function ProjectStatusSummary({ project }) {
  const data = computeProjectSummary(project)
  if (!data) return null

  const style = HEALTH_STYLE[data.health] || HEALTH_STYLE['On Track']

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Sparkles size={14} className="text-blue-400" />
        <h2 className="text-sm font-semibold text-gray-700">Project Status</h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className={`card border-l-4 p-5 ${style.border}`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="text-sm font-semibold text-gray-900">{data.headline}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1.5 ${style.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {data.health}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">{data.summary}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.highlights?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 size={10} className="text-green-500" /> Highlights
              </p>
              <ul className="space-y-1">
                {data.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <ChevronRight size={10} className="text-gray-300 flex-shrink-0 mt-0.5" />{h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.risks?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle size={10} className="text-yellow-500" /> Risks
              </p>
              <ul className="space-y-1">
                {data.risks.map((r, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <ChevronRight size={10} className="text-gray-300 flex-shrink-0 mt-0.5" />{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.upcoming?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar size={10} className="text-blue-400" /> Up Next
              </p>
              <ul className="space-y-1">
                {data.upcoming.map((u, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <ChevronRight size={10} className="text-gray-300 flex-shrink-0 mt-0.5" />{u}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Backlog ──────────────────────────────────────────────────────────────────

function BacklogView({ sprints }) {
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterAssignee, setFilterAssignee] = useState('All')

  const groups = [
    { id: 'u', name: 'Unassigned', tasks: UNASSIGNED_TASKS },
    ...sprints.map(s => ({ id: s.id, name: s.name, tasks: s.tasks })),
  ]

  function match(t) {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false
    if (filterStatus !== 'All' && t.status !== filterStatus) return false
    if (filterAssignee !== 'All' && t.assignee !== filterAssignee) return false
    return true
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search tasks…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          { label: 'Priority', v: filterPriority, set: setFilterPriority, opts: ['All', 'High', 'Med', 'Low'] },
          { label: 'Status', v: filterStatus, set: setFilterStatus, opts: ['All', ...KANBAN_COLUMNS] },
          { label: 'Assignee', v: filterAssignee, set: setFilterAssignee, opts: ['All', 'JC', 'MR', 'AP', 'BC'] },
        ].map(({ label, v, set, opts }) => (
          <select key={label} className="input py-1.5 text-sm w-auto" value={v} onChange={e => set(e.target.value)}>
            {opts.map(o => <option key={o} value={o}>{o === 'All' ? `${label}: All` : o}</option>)}
          </select>
        ))}
      </div>

      {groups.map(g => {
        const rows = g.tasks.filter(match)
        if (!rows.length) return null
        return (
          <div key={g.id}>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{g.name}</span>
              <span className="text-xs text-gray-400">({rows.length})</span>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Task</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Assignee</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Tag</th>
                  <th className="table-header">Notes</th>
                </tr></thead>
                <tbody>
                  {rows.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-medium text-gray-900 text-sm">{task.title}</td>
                      <td className="table-cell">
                        <span className="flex items-center gap-1.5 text-sm text-gray-600">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[task.status] || 'bg-gray-400'}`} />
                          {task.status}
                        </span>
                      </td>
                      <td className="table-cell"><Avatar initials={task.assignee} /></td>
                      <td className="table-cell"><PriorityBadge priority={task.priority} /></td>
                      <td className="table-cell"><span className="status-badge bg-gray-100 text-gray-600 text-[10px]">{task.tag}</span></td>
                      <td className="table-cell">
                        {task.notes?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MessageSquare size={11} />{task.notes.length}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Project Selector ─────────────────────────────────────────────────────────

function ProjectSelector({ projects, activeId, onSelect, onNew, onDelete }) {
  const [open, setOpen] = useState(false)
  const active = projects.find(p => p.id === activeId)

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: active?.color }} />
        <span className="max-w-[160px] truncate">{active?.name || 'Select project'}</span>
        <ChevronDown size={13} className="text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Projects</div>
            {projects.map(p => (
              <div key={p.id} className="flex items-center group">
                <button onClick={() => { onSelect(p.id); setOpen(false) }}
                  className={`flex items-center gap-2.5 flex-1 px-3 py-2 text-sm text-left transition-colors ${p.id === activeId ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-[10px] text-gray-400">{p.sprints.length}s</span>
                </button>
                {projects.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); onDelete(p.id); setOpen(false) }}
                    className="px-2 py-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button onClick={() => { onNew(); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                <Plus size={13} /> New project
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const { projects, loaded, updateProject, addProject, removeProject } = useRoadmap()
  const [activeProjectId, setActiveProjectId] = useState(() => projects[0]?.id)
  const [view, setView] = useState('timeline')
  const [activeSprint, setActiveSprint] = useState(null)
  const [showStandup, setShowStandup] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', color: PROJECT_COLORS[2] })

  // Once data loads, default to first project if nothing is selected
  React.useEffect(() => {
    if (loaded && !activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0].id)
    }
  }, [loaded, projects])

  const project = projects.find(p => p.id === activeProjectId) || projects[0]

  function handleUpdateSprint(sprint) {
    const updated = { ...project, sprints: project.sprints.map(s => s.id === sprint.id ? sprint : s) }
    updateProject(updated)
    setActiveSprint(sprint)
  }

  function handleAddSprint(sprint) {
    updateProject({
      ...project,
      sprints: [...project.sprints, sprint].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    })
  }

  function handleAddProjectNote(text) {
    updateProject({ ...project, notes: [...(project.notes || []), makeNote(text)] })
  }

  function handleApplyStandup({ preview, taskUpdates, newTasks }) {
    const now = new Date().toISOString()

    let updated = { ...project }

    // Project note
    if (preview.projectNote) {
      updated = { ...updated, notes: [...(updated.notes || []), { id: newId(), text: preview.projectNote, createdAt: now, source: 'standup' }] }
    }

    // Task updates + sprint notes
    updated = {
      ...updated,
      sprints: updated.sprints.map(sprint => {
        let s = { ...sprint }

        // Apply task status + notes
        s = {
          ...s,
          tasks: s.tasks.map(task => {
            const upd = taskUpdates.find(u => u.taskId === task.id)
            if (!upd) return task
            return {
              ...task,
              status: upd.newStatus,
              notes: [...(task.notes || []), { id: newId(), text: upd.note || `Status updated to ${upd.newStatus}`, createdAt: now, source: 'standup' }],
            }
          }),
        }

        // Sprint-level notes from standup
        const sprintNote = preview.sprintNotes?.find(sn => sn.sprintId === sprint.id)
        if (sprintNote) {
          s = { ...s, notes: [...(s.notes || []), { id: newId(), text: sprintNote.note, createdAt: now, source: 'standup' }] }
        }

        // Add new tasks to their sprint
        const toAdd = newTasks.filter(t => t.sprintId === sprint.id)
        if (toAdd.length) {
          s = { ...s, tasks: [...s.tasks, ...toAdd.map(t => ({ id: newId(), ...t, status: 'Backlog', notes: [] }))] }
        }

        return s
      }),
    }

    updateProject(updated)

    // Keep active sprint in sync
    if (activeSprint) {
      const refreshed = updated.sprints.find(s => s.id === activeSprint.id)
      if (refreshed) setActiveSprint(refreshed)
    }
  }

  function handleCreateProject() {
    if (!newProject.name.trim()) return
    const p = { id: newId(), name: newProject.name.trim(), color: newProject.color, notes: [], sprints: [] }
    addProject(p)
    setActiveProjectId(p.id)
    setNewProject(prev => ({ name: '', color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length] }))
    setShowNewProject(false)
  }

  function handleDeleteProject(id) {
    const remaining = projects.filter(p => p.id !== id)
    removeProject(id)
    if (activeProjectId === id) setActiveProjectId(remaining[0]?.id)
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalTasks = project?.sprints.reduce((n, s) => n + s.tasks.length, 0) ?? 0
  const totalNotes = (project?.notes?.length || 0) + (project?.sprints.reduce((n, s) => n + (s.notes?.length || 0) + s.tasks.reduce((m, t) => m + (t.notes?.length || 0), 0), 0) ?? 0)

  return (
    <div>
      <PageHeader
        title="Roadmap"
        subtitle={`${project.sprints.length} sprints · ${totalTasks} tasks`}
        actions={
          <div className="flex items-center gap-2">
            <ProjectSelector
              projects={projects}
              activeId={activeProjectId}
              onSelect={setActiveProjectId}
              onNew={() => setShowNewProject(true)}
              onDelete={handleDeleteProject}
            />
            <button
              onClick={() => setShowStandup(true)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
            >
              <Sparkles size={14} className="text-blue-500" />
              Import Standup
            </button>
            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg p-0.5">
              {[['timeline', 'Timeline'], ['backlog', 'Backlog']].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    v === view ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="p-5 bg-gray-50 space-y-6">
        {view === 'timeline' ? (
          <>
            <TimelineView
              sprints={project.sprints}
              projectColor={project.color}
              onSprintClick={setActiveSprint}
              onAddSprint={handleAddSprint}
            />
            {project.sprints.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen size={28} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No sprints yet</p>
                <p className="text-xs text-gray-400 mt-1">Click anywhere on the timeline above to create the first sprint.</p>
              </div>
            )}

            <ProjectStatusSummary project={project} />

            <div>
              <div className="flex items-center gap-3 mb-3">
                <FileText size={14} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Project Notes
                  {totalNotes > 0 && <span className="ml-2 text-xs font-normal text-gray-400">({totalNotes})</span>}
                </h2>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="card p-4">
                <NotesThread notes={project.notes || []} onAdd={handleAddProjectNote} />
              </div>
            </div>
          </>
        ) : (
          <BacklogView sprints={project.sprints} />
        )}
      </div>

      {activeSprint && (
        <SprintDetail
          sprint={activeSprint}
          onClose={() => setActiveSprint(null)}
          onUpdateSprint={handleUpdateSprint}
        />
      )}

      <StandupImportModal
        open={showStandup}
        onClose={() => setShowStandup(false)}
        project={project}
        onApply={handleApplyStandup}
      />

      <Modal open={showNewProject} onClose={() => setShowNewProject(false)} title="New Project" size="sm">
        <div className="space-y-3">
          <div><label className="label">Project name</label>
            <input autoFocus className="input" placeholder="e.g. Data Pipeline Overhaul"
              value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreateProject()} /></div>
          <div><label className="label">Color</label>
            <div className="flex gap-2 mt-1">
              {PROJECT_COLORS.map(c => (
                <button key={c} onClick={() => setNewProject(p => ({ ...p, color: c }))}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newProject.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button className="btn-secondary flex-1 justify-center" onClick={() => setShowNewProject(false)}>Cancel</button>
          <button className="btn-primary flex-1 justify-center" onClick={handleCreateProject}>Create Project</button>
        </div>
      </Modal>
    </div>
  )
}
