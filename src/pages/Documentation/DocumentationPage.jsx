import React, { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Search, BookOpen, Tag, CheckCircle, Users, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'

export default function DocumentationPage() {
  const { state, dispatch } = useApp()
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [expandedDoc, setExpandedDoc] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [quizModal, setQuizModal] = useState(null)

  const categories = ['All', ...new Set(state.documentation.map(d => d.category))]

  const filtered = state.documentation.filter(d => {
    if (categoryFilter !== 'All' && d.category !== categoryFilter) return false
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.tags.some(t => t.includes(search.toLowerCase()))) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Documentation & Training"
        subtitle={`${state.documentation.length} documents`}
        actions={
          <button className="btn-primary" onClick={() => { setEditDoc(null); setShowModal(true) }}>
            <Plus size={14} /> Add Document
          </button>
        }
      />

      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search docs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input py-1.5 text-sm w-auto" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="p-6 space-y-3">
        {filtered.map(doc => {
          const assigned = doc.trainingAssignments.map(id => state.employees.find(e => e.id === id)).filter(Boolean)
          const completedCount = doc.completions.length
          const isExpanded = expandedDoc === doc.id

          return (
            <div key={doc.id} className="card">
              <div className="flex items-start gap-4 p-4">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{doc.category}</span>
                        {doc.quiz && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Has Quiz</span>}
                        {doc.tags.map(tag => (
                          <span key={tag} className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Tag size={9} />{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {assigned.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users size={11} />
                          <span>{completedCount}/{assigned.length} completed</span>
                        </div>
                      )}
                      <button onClick={() => setExpandedDoc(isExpanded ? null : doc.id)} className="text-gray-400 hover:text-gray-600">
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button onClick={() => { setEditDoc(doc); setShowModal(true) }} className="text-gray-400 hover:text-blue-600"><Edit size={13} /></button>
                      <button onClick={() => setDeleteId(doc.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Training assignments */}
                  {assigned.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {assigned.map(emp => {
                        const completion = doc.completions.find(c => c.employeeId === emp.id)
                        return (
                          <div key={emp.id} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${completion ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${completion ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                              {emp.name.charAt(0)}
                            </div>
                            {emp.name}
                            {completion && <CheckCircle size={10} className="text-green-500" />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans leading-relaxed bg-gray-50 border border-gray-200 rounded p-3 max-h-64 overflow-y-auto">
                      {doc.content}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {doc.quiz ? (
                      <button
                        className="btn-primary py-1.5 px-3 text-xs"
                        onClick={() => setQuizModal(doc)}
                      >
                        Take Quiz
                      </button>
                    ) : currentUser && (() => {
                      const alreadyDone = doc.completions.some(c => c.employeeId === currentUser.id)
                      return alreadyDone ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle size={13} /> Completed
                        </span>
                      ) : (
                        <button
                          className="btn-primary py-1.5 px-3 text-xs"
                          onClick={() => dispatch({ type: 'COMPLETE_TRAINING', payload: { docId: doc.id, employeeId: currentUser.id, score: null } })}
                        >
                          <CheckCircle size={12} /> Mark as Complete
                        </button>
                      )
                    })()}
                    <span className="text-xs text-gray-400">Added {format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditDoc(null) }} title={editDoc ? 'Edit Document' : 'Add Document'} size="xl">
        <DocForm doc={editDoc} state={state} dispatch={dispatch} onClose={() => { setShowModal(false); setEditDoc(null) }} />
      </Modal>

      <Modal open={!!quizModal} onClose={() => setQuizModal(null)} title={`Quiz: ${quizModal?.title}`} size="md">
        {quizModal && <QuizView doc={quizModal} state={state} dispatch={dispatch} currentUser={currentUser} onClose={() => setQuizModal(null)} />}
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Document" size="sm">
        <div>
          <p className="text-sm text-gray-700 mb-4">Delete this document? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => { dispatch({ type: 'DELETE_DOC', payload: deleteId }); setDeleteId(null) }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DocForm({ doc, state, dispatch, onClose }) {
  const [form, setForm] = useState(doc || {
    title: '',
    category: 'Setup',
    tags: [],
    content: '',
    trainingAssignments: [],
    completions: [],
    quiz: null,
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      set('tags', [...form.tags, tagInput.trim()])
      setTagInput('')
    }
  }
  const removeTag = (tag) => set('tags', form.tags.filter(t => t !== tag))

  const toggleAssignment = (id) => {
    set('trainingAssignments', form.trainingAssignments.includes(id)
      ? form.trainingAssignments.filter(x => x !== id)
      : [...form.trainingAssignments, id]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (doc) {
      dispatch({ type: 'UPDATE_DOC', payload: { ...doc, ...form } })
    } else {
      dispatch({ type: 'ADD_DOC', payload: form })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" required value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            {['Setup', 'Operations', 'Survey', 'Safety', 'Training', 'General'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Tags</label>
        <div className="flex gap-2 flex-wrap mb-2">
          {form.tags.map(tag => (
            <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-blue-500 hover:text-blue-700">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
          <button type="button" className="btn-secondary text-xs py-1 px-3" onClick={addTag}>Add</button>
        </div>
      </div>

      <div>
        <label className="label">Content (Markdown supported)</label>
        <textarea className="input min-h-[160px] text-sm font-mono" value={form.content} onChange={e => set('content', e.target.value)} />
      </div>

      <div>
        <label className="label">Training Assignments</label>
        <div className="grid grid-cols-2 gap-1">
          {state.employees.map(emp => (
            <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded text-sm">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={form.trainingAssignments.includes(emp.id)}
                onChange={() => toggleAssignment(emp.id)}
              />
              {emp.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">{doc ? 'Save Changes' : 'Add Document'}</button>
      </div>
    </form>
  )
}

function QuizView({ doc, state, dispatch, currentUser: loggedInUser, onClose }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [currentUser, setCurrentUser] = useState(loggedInUser?.id || '')

  if (!doc.quiz) return null

  const handleSubmit = () => {
    const correct = doc.quiz.questions.filter(q => answers[q.id] === q.correct).length
    const score = Math.round((correct / doc.quiz.questions.length) * 100)
    dispatch({ type: 'COMPLETE_TRAINING', payload: { docId: doc.id, employeeId: currentUser, score } })
    setSubmitted(true)
  }

  const score = submitted
    ? Math.round((doc.quiz.questions.filter(q => answers[q.id] === q.correct).length / doc.quiz.questions.length) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Completing as</label>
        <select className="input text-sm" value={currentUser} onChange={e => setCurrentUser(e.target.value)}>
          {state.employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>
      </div>
      {doc.quiz.questions.map((q, idx) => (
        <div key={q.id} className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="text-sm font-medium text-gray-800 mb-2">{idx + 1}. {q.question}</div>
          <div className="space-y-1.5">
            {q.options.map((opt, optIdx) => {
              const isSelected = answers[q.id] === optIdx
              const isCorrect = submitted && optIdx === q.correct
              const isWrong = submitted && isSelected && optIdx !== q.correct
              return (
                <label
                  key={optIdx}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${isCorrect ? 'bg-green-50 border border-green-200' : isWrong ? 'bg-red-50 border border-red-200' : isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white border border-transparent'}`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    disabled={submitted}
                    checked={isSelected}
                    onChange={() => setAnswers(a => ({ ...a, [q.id]: optIdx }))}
                  />
                  {opt}
                  {isCorrect && <CheckCircle size={13} className="ml-auto text-green-500" />}
                </label>
              )
            })}
          </div>
        </div>
      ))}
      {submitted ? (
        <div className={`text-center py-4 rounded border ${score >= 70 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="text-2xl font-bold">{score}%</div>
          <div className="text-sm mt-1">{score >= 70 ? 'Passed!' : 'Review material and try again'}</div>
          <button className="btn-secondary mt-3 text-xs" onClick={onClose}>Close</button>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>Submit Quiz</button>
        </div>
      )}
    </div>
  )
}
