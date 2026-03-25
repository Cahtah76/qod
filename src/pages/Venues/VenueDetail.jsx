import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Edit, MapPin, Phone, Mail, AlertTriangle, Calendar, ChevronRight, Plus } from 'lucide-react'
import { useApp, getEventStatus, getEventStatusColor, getIssueStatusColor, getPriorityColor } from '../../context/AppContext.jsx'
import Modal from '../../components/ui/Modal.jsx'
import VenueForm from './VenueForm.jsx'
import IssueForm from '../Issues/IssueForm.jsx'

export default function VenueDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const [showEdit, setShowEdit] = useState(false)
  const [showIssue, setShowIssue] = useState(false)
  const [tab, setTab] = useState('overview')

  const venue = state.venues.find(v => v.id === id)
  if (!venue) return <div className="p-6 text-sm text-gray-500">Venue not found.</div>

  const events = state.events.filter(e => e.venueId === venue.id).sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
  const issues = state.issues.filter(i => i.linkedTo?.type === 'Venue' && i.linkedTo?.id === venue.id)

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/venues" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft size={13} /> Venues
          </Link>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="font-medium text-gray-800">{venue.name}</span>
        </div>
        <button className="btn-secondary py-1.5 px-3 text-xs" onClick={() => setShowEdit(true)}>
          <Edit size={12} /> Edit
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {['overview', 'events', 'issues'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t}</button>
        ))}
      </div>

      <div className="p-6 max-w-5xl">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              {/* Main info */}
              <div className="card p-4">
                <h2 className="text-lg font-semibold text-gray-900">{venue.name}</h2>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin size={13} />{venue.city}
                </div>

                <div className="mt-4 space-y-3">
                  {venue.shippingAddress && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Shipping Address</div>
                      <div className="text-sm text-gray-700">{venue.shippingAddress}</div>
                    </div>
                  )}
                  {venue.shippingNotes && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Shipping Notes</div>
                      <div className="text-sm text-gray-700">{venue.shippingNotes}</div>
                    </div>
                  )}
                  {venue.siteVisitNotes && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Site Visit Notes</div>
                      <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-100 p-3 rounded">{venue.siteVisitNotes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent events */}
              <div className="card">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="section-title">Event History</h3>
                </div>
                {events.length === 0 ? (
                  <div className="px-4 py-5 text-xs text-gray-400">No events at this venue</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-header">Event</th>
                        <th className="table-header">Date</th>
                        <th className="table-header">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(e => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="table-cell">
                            <Link to={`/events/${e.id}`} className="text-blue-700 hover:underline">{e.name}</Link>
                          </td>
                          <td className="table-cell">{format(new Date(e.startTime), 'MMM d, yyyy')}</td>
                          <td className="table-cell">
                            <span className={`status-badge ${getEventStatusColor(getEventStatus(e))}`}>{getEventStatus(e)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Contacts */}
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="section-title mb-3">Venue Contacts</h3>
                {venue.contacts.length === 0 ? (
                  <div className="text-xs text-gray-400">No contacts added</div>
                ) : (
                  <div className="space-y-3">
                    {venue.contacts.map(c => (
                      <div key={c.id} className="border border-gray-100 rounded p-3">
                        <div className="text-sm font-medium text-gray-800">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.role}</div>
                        {c.phone && (
                          <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline">
                            <Phone size={10} />{c.phone}
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-blue-600 mt-0.5 hover:underline">
                            <Mail size={10} />{c.email}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="card p-4">
                <h3 className="section-title mb-3">Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Events</span>
                    <span className="font-semibold">{events.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Open Issues</span>
                    <span className="font-semibold text-orange-600">
                      {issues.filter(i => i.status === 'Open').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Contacts</span>
                    <span className="font-semibold">{venue.contacts.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'issues' && (
          <div className="card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="section-title">Issues</h3>
              <button className="btn-primary py-1 px-2.5 text-xs" onClick={() => setShowIssue(true)}>
                <Plus size={12} /> New Issue
              </button>
            </div>
            {issues.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No issues for this venue</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Summary</th>
                    <th className="table-header">Priority</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(issue => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="table-cell">{issue.summary}</td>
                      <td className="table-cell">
                        <span className={`status-badge ${getPriorityColor(issue.priority)}`}>{issue.priority}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`status-badge ${getIssueStatusColor(issue.status)}`}>{issue.status}</span>
                      </td>
                      <td className="table-cell text-xs text-gray-500">
                        {issue.dueDate ? format(new Date(issue.dueDate), 'MMM d') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'events' && (
          <div className="card">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="section-title">All Events at {venue.name}</h3>
            </div>
            {events.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No events at this venue</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Event</th>
                    <th className="table-header">League</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <Link to={`/events/${e.id}`} className="text-blue-700 hover:underline">{e.name}</Link>
                      </td>
                      <td className="table-cell">{e.league}</td>
                      <td className="table-cell">{format(new Date(e.startTime), 'MMM d, yyyy')}</td>
                      <td className="table-cell">
                        <span className={`status-badge ${getEventStatusColor(getEventStatus(e))}`}>{getEventStatus(e)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Venue" size="lg">
        <VenueForm venue={venue} onClose={() => setShowEdit(false)} />
      </Modal>
      <Modal open={showIssue} onClose={() => setShowIssue(false)} title="New Issue" size="md">
        <IssueForm defaultLinkedTo={{ type: 'Venue', id: venue.id }} onClose={() => setShowIssue(false)} />
      </Modal>
    </div>
  )
}
