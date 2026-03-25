import React from 'react'
import { Link } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { tzAbbr } from '../utils/time.js'
import {
  Calendar, AlertTriangle, Megaphone, ArrowRight, Clock,
  MapPin, Radio, Building2, TrendingUp
} from 'lucide-react'
import { useApp, getEventStatus, getChecklistProgress, getEventStatusColor, getPriorityColor } from '../context/AppContext.jsx'

export default function Dashboard() {
  const { state } = useApp()
  const now = new Date()

  const upcomingEvents = state.events
    .filter(e => getEventStatus(e) !== 'Complete')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 6)

  const openIssues = state.issues.filter(i => i.status === 'Open' || i.status === 'In Progress')

  const futureEvents = state.events.filter(e => {
    const d = new Date(e.startTime)
    return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })
  const futureSpatial = futureEvents.filter(e => e.eventType === 'Spatial')
  const futureVenue = futureEvents.filter(e => e.eventType === 'Venue')

  const stats = [
    {
      label: 'Scheduled Events',
      value: futureEvents.length,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-500',
    },
    {
      label: 'Scheduled Spatial Events',
      value: futureSpatial.length,
      icon: Radio,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-500',
    },
    {
      label: 'Scheduled Venue Events',
      value: futureVenue.length,
      icon: Building2,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-500',
    },
    {
      label: 'Open Issues',
      value: openIssues.length,
      icon: AlertTriangle,
      color: openIssues.length > 0 ? 'text-orange-600' : 'text-gray-500',
      bg: openIssues.length > 0 ? 'bg-orange-50' : 'bg-gray-50',
      border: openIssues.length > 0 ? 'border-orange-500' : 'border-gray-300',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className={`card p-5 border-l-4 ${stat.border}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">{stat.label}</div>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Upcoming Events</h2>
            <Link to="/events" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingEvents.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No upcoming events</div>
            ) : (
              upcomingEvents.map(event => {
                const venue = state.venues.find(v => v.id === event.venueId)
                const sdCli = state.checklistInstances.find(c => c.id === event.setDayChecklistId)
                const gdCli = state.checklistInstances.find(c => c.id === event.gameDayChecklistId)
                const sdTemplate = state.checklistTemplates.find(t => t.id === sdCli?.templateId)
                const gdTemplate = state.checklistTemplates.find(t => t.id === gdCli?.templateId)
                const sdPct = getChecklistProgress(sdCli, sdTemplate)
                const gdPct = getChecklistProgress(gdCli, gdTemplate)
                const daysAway = differenceInDays(new Date(event.startTime), now)

                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Team badge */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-xs font-bold text-gray-700">{event.homeTeam.abbreviation}</div>
                      <div className="text-[10px] text-gray-400">vs</div>
                      <div className="text-xs font-bold text-gray-700">{event.awayTeam.abbreviation}</div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{event.name}</span>
                        <span className={`status-badge text-[10px] ${getEventStatusColor(getEventStatus(event))}`}>
                          {getEventStatus(event)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {venue && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={10} />{venue.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={10} />{format(new Date(event.startTime), 'MMM d, h:mm a')} {tzAbbr()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-[10px] text-gray-400 w-12">Set Day</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${sdPct === 100 ? 'bg-green-500' : sdPct > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                              style={{ width: `${sdPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 w-6">{sdPct}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-[10px] text-gray-400 w-12">Game Day</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${gdPct === 100 ? 'bg-green-500' : gdPct > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                              style={{ width: `${gdPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 w-6">{gdPct}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className={`text-xs font-semibold ${daysAway <= 3 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway}d`}
                      </div>
                      <div className="text-[10px] text-gray-400">{event.league}</div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Open Issues */}
          <div className="card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-500" />
                Open Issues
              </h2>
              <Link to="/issues" className="text-xs text-blue-600 hover:text-blue-800">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {openIssues.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">No open issues</div>
              ) : (
                openIssues.slice(0, 5).map(issue => (
                  <Link key={issue.id} to="/issues" className="block px-4 py-2.5 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-700 leading-snug">{issue.summary}</span>
                      <span className={`status-badge flex-shrink-0 ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{issue.status}</div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Megaphone size={14} className="text-blue-500" />
                Announcements
              </h2>
            </div>
            <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
              {state.announcements
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 4)
                .map(ann => {
                  const author = state.employees.find(e => e.id === ann.createdBy)
                  return (
                    <div key={ann.id} className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-800">{ann.title}</div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ann.body}</p>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {author?.name} · {format(new Date(ann.createdAt), 'MMM d')}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
