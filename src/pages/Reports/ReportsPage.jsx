import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { FileText, Plus, Download, ChevronRight, ArrowLeft, CheckCircle, AlertTriangle, Star, BookOpen, Database, Activity, Users, Clock, Wifi, TrendingUp, XCircle } from 'lucide-react'
import { useApp, getChecklistProgress } from '../../context/AppContext.jsx'
import { downloadPdf } from '../../utils/downloadPdf.js'
import PageHeader from '../../components/ui/PageHeader.jsx'

export default function ReportsPage() {
  const { state } = useApp()

  const reports = state.reports
    .map(r => ({ ...r, event: state.events.find(e => e.id === r.eventId) }))
    .filter(r => r.event)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={`${reports.length} event reports`}
        actions={
          <Link to="/reports/new" className="btn-primary">
            <Plus size={14} /> New Report
          </Link>
        }
      />
      <div className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            No reports generated yet.
            <div className="mt-2">
              <Link to="/reports/new" className="text-blue-600 hover:underline">Create your first report →</Link>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Event</th>
                  <th className="table-header">League</th>
                  <th className="table-header">Checklist Completion</th>
                  <th className="table-header">Issues</th>
                  <th className="table-header">Created</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-medium text-gray-800">{r.event?.name}</td>
                    <td className="table-cell text-sm text-gray-600">{r.event?.league}</td>
                    <td className="table-cell">
                      <div className="text-xs text-gray-600">
                        Set Day: {r.checklistSummary?.setDay?.completed}/{r.checklistSummary?.setDay?.total} ·
                        Game Day: {r.checklistSummary?.gameDay?.completed}/{r.checklistSummary?.gameDay?.total}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs text-gray-600">{r.issues?.length || 0} logged</span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">
                      {format(new Date(r.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Link to={`/reports/${r.id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          View <ChevronRight size={11} />
                        </Link>
                        <Link to={`/reports/${r.id}?print=1`} className="text-gray-400 hover:text-gray-600" title="Download PDF">
                          <Download size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReportDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { state, dispatch } = useApp()
  const contentRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!contentRef.current) return
    setDownloading(true)
    try {
      const event = state.events.find(e => e.id === state.reports.find(r => r.id === id)?.eventId)
      const filename = event ? `report-${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : `report-${id}`
      await downloadPdf(contentRef.current, filename)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('print') === '1') {
      const t = setTimeout(() => handleDownload(), 400)
      return () => clearTimeout(t)
    }
  }, [])

  const report = state.reports.find(r => r.id === id)
  if (!report) return (
    <div className="p-6">
      <div className="text-sm text-gray-500">Report not found.</div>
      <Link to="/reports" className="text-blue-600 text-sm mt-2 block">← Back to Reports</Link>
    </div>
  )

  const event = state.events.find(e => e.id === report.eventId)
  const venue = event ? state.venues.find(v => v.id === event.venueId) : null
  const createdBy = state.employees.find(e => e.id === report.createdBy)
  const issues = report.issues?.map(iid => state.issues.find(i => i.id === iid)).filter(Boolean)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/reports" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={13} /> Reports
          </Link>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="font-medium text-gray-800">{event?.name} — Report</span>
        </div>
        <button className="btn-secondary py-1.5 px-3 text-xs" onClick={handleDownload} disabled={downloading}>
          <Download size={12} /> {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>


      <div ref={contentRef} className="p-6 max-w-4xl space-y-5">
        {/* Header */}
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Event Report</h2>
              <div className="text-sm text-gray-500 mt-0.5">{event?.name}</div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Created by {createdBy?.name}</div>
              <div>{format(new Date(report.createdAt), 'MMMM d, yyyy')}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Venue</div>
              <div className="text-sm text-gray-700">{venue?.name || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">League</div>
              <div className="text-sm text-gray-700">{event?.league}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Date</div>
              <div className="text-sm text-gray-700">{event?.startTime ? format(new Date(event.startTime), 'MMM d, yyyy') : '—'}</div>
            </div>
          </div>
        </div>

        {/* Checklist Summary */}
        <div className="card p-4">
          <h3 className="section-title mb-3 flex items-center gap-2"><CheckCircle size={13} className="text-green-500" /> Checklist Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-2">Set Day</div>
              <div className="text-2xl font-bold text-gray-900">
                {report.checklistSummary?.setDay?.completed}/{report.checklistSummary?.setDay?.total}
              </div>
              <div className="text-xs text-gray-500">items completed</div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-1.5 bg-green-500 rounded-full"
                  style={{ width: `${Math.round((report.checklistSummary?.setDay?.completed / report.checklistSummary?.setDay?.total) * 100)}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-2">Game Day</div>
              <div className="text-2xl font-bold text-gray-900">
                {report.checklistSummary?.gameDay?.completed}/{report.checklistSummary?.gameDay?.total}
              </div>
              <div className="text-xs text-gray-500">items completed</div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-1.5 bg-green-500 rounded-full"
                  style={{ width: `${Math.round((report.checklistSummary?.gameDay?.completed / report.checklistSummary?.gameDay?.total) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {report.metrics && Object.values(report.metrics).some(v => v !== '' && v !== null && v !== undefined) && (() => {
          const m = report.metrics
          const regCount = parseInt(m.registrationCount) || 0
          const regSuccess = parseInt(m.registrationSuccesses) || 0
          const regFail = parseInt(m.registrationFailures) || 0
          const successRate = regCount > 0 ? Math.round((regSuccess / regCount) * 100) : null
          const failRate = regCount > 0 ? Math.round((regFail / regCount) * 100) : null

          return (
            <div className="card p-4">
              <h3 className="section-title mb-4 flex items-center gap-2"><Activity size={13} className="text-blue-500" /> Performance Metrics</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {m.totalUsers && (
                  <div className="p-3 bg-blue-50 rounded border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-700">{m.totalUsers}</div>
                    <div className="text-xs text-blue-600 mt-0.5 flex items-center justify-center gap-1"><Users size={10} /> Total Users</div>
                  </div>
                )}
                {m.registrationCount && (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-900">{m.registrationCount}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1"><Users size={10} /> Total Registrations</div>
                  </div>
                )}
                {m.registrationSuccesses && (
                  <div className="p-3 bg-green-50 rounded border border-green-200 text-center">
                    <div className="text-2xl font-bold text-green-700">{m.registrationSuccesses}</div>
                    <div className="text-xs text-green-600 mt-0.5 flex items-center justify-center gap-1"><CheckCircle size={10} /> Successes{successRate !== null ? ` (${successRate}%)` : ''}</div>
                  </div>
                )}
                {m.registrationFailures && (
                  <div className="p-3 bg-red-50 rounded border border-red-200 text-center">
                    <div className="text-2xl font-bold text-red-700">{m.registrationFailures}</div>
                    <div className="text-xs text-red-600 mt-0.5 flex items-center justify-center gap-1"><XCircle size={10} /> Failures{failRate !== null ? ` (${failRate}%)` : ''}</div>
                  </div>
                )}
              </div>
              {successRate !== null && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Registration Success Rate</span>
                    <span className="font-semibold text-gray-700">{successRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: `${successRate}%` }} />
                  </div>
                </div>
              )}
              {(m.totalExperienceTime || m.avgExperienceTime) && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {m.totalExperienceTime && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <Clock size={13} className="text-blue-500 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Total Experience Time</div>
                        <div className="text-sm font-semibold text-gray-800">{m.totalExperienceTime}</div>
                      </div>
                    </div>
                  )}
                  {m.avgExperienceTime && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <Clock size={13} className="text-purple-500 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500">Avg Experience Time</div>
                        <div className="text-sm font-semibold text-gray-800">{m.avgExperienceTime}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Issues */}
        {issues && issues.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 flex items-center gap-2"><AlertTriangle size={13} className="text-orange-500" /> Issues Encountered</h3>
            <div className="space-y-2">
              {issues.map(issue => (
                <div key={issue.id} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded">
                  <AlertTriangle size={13} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{issue.summary}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{issue.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Status: {issue.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Successes */}
        {report.successes?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 flex items-center gap-2"><Star size={13} className="text-yellow-500" /> Successes</h3>
            <ul className="space-y-1.5">
              {report.successes.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lessons Learned */}
        {report.lessonsLearned?.length > 0 && (
          <div className="card p-4">
            <h3 className="section-title mb-3 flex items-center gap-2"><BookOpen size={13} className="text-blue-500" /> Lessons Learned</h3>
            <ul className="space-y-1.5">
              {report.lessonsLearned.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 font-bold mt-0.5 flex-shrink-0">→</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Offload + Retro */}
        <div className="grid grid-cols-2 gap-4">
          {report.dataOffloadNotes && (
            <div className="card p-4">
              <h3 className="section-title mb-2 flex items-center gap-2"><Database size={13} /> Data Offload</h3>
              <p className="text-sm text-gray-700">{report.dataOffloadNotes}</p>
            </div>
          )}
          {report.retroNotes && (
            <div className="card p-4">
              <h3 className="section-title mb-2">Retrospective Notes</h3>
              <p className="text-sm text-gray-700">{report.retroNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ReportForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const preselectedEventId = searchParams.get('eventId') || ''

  const [form, setForm] = useState({
    eventId: preselectedEventId,
    successes: [''],
    lessonsLearned: [''],
    dataOffloadNotes: '',
    retroNotes: '',
    metrics: {
      totalUsers: '',
      registrationCount: '',
      registrationSuccesses: '',
      registrationFailures: '',
      totalExperienceTime: '',
      avgExperienceTime: '',
    },
  })

  const setMetric = (field, value) => setForm(f => ({ ...f, metrics: { ...f.metrics, [field]: value } }))

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const event = state.events.find(e => e.id === form.eventId)
  const reportAuthor = state.employees.find(e => e.id === event?.crew?.remoteOperator)
  const sdCli = event ? state.checklistInstances.find(c => c.id === event.setDayChecklistId) : null
  const gdCli = event ? state.checklistInstances.find(c => c.id === event.gameDayChecklistId) : null

  const handleSubmit = (e) => {
    e.preventDefault()
    const eventIssues = state.issues.filter(i => i.linkedTo?.id === form.eventId).map(i => i.id)
    const report = {
      ...form,
      createdBy: event?.crew?.remoteOperator || null,
      issues: eventIssues,
      checklistSummary: {
        setDay: sdCli ? { completed: sdCli.items.filter(i => i.completed).length, total: sdCli.items.length } : { completed: 0, total: 0 },
        gameDay: gdCli ? { completed: gdCli.items.filter(i => i.completed).length, total: gdCli.items.length } : { completed: 0, total: 0 },
      },
      successes: form.successes.filter(s => s.trim()),
      lessonsLearned: form.lessonsLearned.filter(l => l.trim()),
    }
    dispatch({ type: 'ADD_REPORT', payload: report })
    navigate('/reports')
  }

  const updateList = (field, idx, value) => {
    const arr = [...form[field]]
    arr[idx] = value
    set(field, arr)
  }
  const addListItem = (field) => set(field, [...form[field], ''])
  const removeListItem = (field, idx) => set(field, form[field].filter((_, i) => i !== idx))

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 text-sm">
        <Link to="/reports" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft size={13} /> Reports
        </Link>
        <ChevronRight size={12} className="text-gray-400" />
        <span className="font-medium text-gray-800">New Report</span>
      </div>

      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-4">
            <h3 className="section-title mb-3">Event</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Event *</label>
                <select className="input" required value={form.eventId} onChange={e => set('eventId', e.target.value)}>
                  <option value="">Select event...</option>
                  {state.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Report Author</label>
                <div className="input bg-gray-50 text-gray-700">
                  {reportAuthor ? reportAuthor.name : <span className="text-gray-400">Assigned when event is selected</span>}
                </div>
              </div>
            </div>
            {event && sdCli && gdCli && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600">
                Set Day: {sdCli.items.filter(i => i.completed).length}/{sdCli.items.length} completed ·
                Game Day: {gdCli.items.filter(i => i.completed).length}/{gdCli.items.length} completed
              </div>
            )}
          </div>

          <div className="card p-4 space-y-4">
            <h3 className="section-title flex items-center gap-2"><Activity size={13} className="text-blue-500" /> Performance Metrics</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Total Users</label>
                <input type="number" min="0" className="input text-sm" placeholder="0" value={form.metrics.totalUsers} onChange={e => setMetric('totalUsers', e.target.value)} />
              </div>
              <div>
                <label className="label">Total Registrations</label>
                <input type="number" min="0" className="input text-sm" placeholder="191" value={form.metrics.registrationCount} onChange={e => setMetric('registrationCount', e.target.value)} />
              </div>
              <div>
                <label className="label">Successful Registrations</label>
                <input type="number" min="0" className="input text-sm" placeholder="90" value={form.metrics.registrationSuccesses} onChange={e => setMetric('registrationSuccesses', e.target.value)} />
              </div>
              <div>
                <label className="label">Failed Registrations</label>
                <input type="number" min="0" className="input text-sm" placeholder="101" value={form.metrics.registrationFailures} onChange={e => setMetric('registrationFailures', e.target.value)} />
              </div>
              <div>
                <label className="label">Total Experience Time</label>
                <input className="input text-sm" placeholder="44m 34s" value={form.metrics.totalExperienceTime} onChange={e => setMetric('totalExperienceTime', e.target.value)} />
              </div>
              <div>
                <label className="label">Avg Experience Time</label>
                <input className="input text-sm" placeholder="5m 34s" value={form.metrics.avgExperienceTime} onChange={e => setMetric('avgExperienceTime', e.target.value)} />
              </div>
            </div>
            {form.metrics.registrationCount && form.metrics.registrationSuccesses && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700 flex items-center gap-2">
                <TrendingUp size={11} />
                Registration success rate: <span className="font-semibold">
                  {Math.round((parseInt(form.metrics.registrationSuccesses) / parseInt(form.metrics.registrationCount)) * 100)}%
                </span>
              </div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="section-title mb-3 flex items-center gap-2"><Star size={13} className="text-yellow-500" /> Successes</h3>
            <div className="space-y-2">
              {form.successes.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1 text-sm" placeholder="What went well?" value={s} onChange={e => updateList('successes', i, e.target.value)} />
                  {form.successes.length > 1 && (
                    <button type="button" onClick={() => removeListItem('successes', i)} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={() => addListItem('successes')}>+ Add success</button>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="section-title mb-3 flex items-center gap-2"><BookOpen size={13} className="text-blue-500" /> Lessons Learned</h3>
            <div className="space-y-2">
              {form.lessonsLearned.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1 text-sm" placeholder="What would you do differently?" value={l} onChange={e => updateList('lessonsLearned', i, e.target.value)} />
                  {form.lessonsLearned.length > 1 && (
                    <button type="button" onClick={() => removeListItem('lessonsLearned', i)} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={() => addListItem('lessonsLearned')}>+ Add lesson</button>
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <div>
              <label className="label flex items-center gap-2"><Database size={12} /> Data Offload Notes</label>
              <textarea className="input min-h-[70px] text-sm" value={form.dataOffloadNotes} onChange={e => set('dataOffloadNotes', e.target.value)} placeholder="Describe data backup, storage, and handoff..." />
            </div>
            <div>
              <label className="label">Retrospective Notes</label>
              <textarea className="input min-h-[70px] text-sm" value={form.retroNotes} onChange={e => set('retroNotes', e.target.value)} placeholder="General retrospective observations..." />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link to="/reports" className="btn-secondary">Cancel</Link>
            <button type="submit" className="btn-primary"><FileText size={14} /> Generate Report</button>
          </div>
        </form>
      </div>
    </div>
  )
}
