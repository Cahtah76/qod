import React, { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback } from 'react'
import { initialData } from '../data/mockData.js'
import { api } from '../utils/api.js'
import { differenceInCalendarDays } from 'date-fns'

const AppContext = createContext(null)

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function reducer(state, action) {
  switch (action.type) {
    // Internal: replace entire state with server data
    case 'SET_STATE':
      return { ...state, ...action.payload }

    // EVENTS
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] }
    case 'UPDATE_EVENT':
      return { ...state, events: state.events.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) }
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.payload) }

    // VENUES
    case 'ADD_VENUE':
      return { ...state, venues: [...state.venues, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] }
    case 'UPDATE_VENUE':
      return { ...state, venues: state.venues.map(v => v.id === action.payload.id ? { ...v, ...action.payload } : v) }
    case 'DELETE_VENUE':
      return { ...state, venues: state.venues.filter(v => v.id !== action.payload) }

    // EMPLOYEES
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, { ...action.payload, id: generateId() }] }
    case 'UPDATE_EMPLOYEE':
      return { ...state, employees: state.employees.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) }
    case 'DELETE_EMPLOYEE':
      return { ...state, employees: state.employees.filter(e => e.id !== action.payload) }

    // KITS
    case 'ADD_KIT':
      return { ...state, kits: [...state.kits, { ...action.payload, id: generateId() }] }
    case 'UPDATE_KIT':
      return { ...state, kits: state.kits.map(k => k.id === action.payload.id ? { ...k, ...action.payload } : k) }
    case 'DELETE_KIT':
      return { ...state, kits: state.kits.filter(k => k.id !== action.payload) }

    // ISSUES
    case 'ADD_ISSUE':
      return { ...state, issues: [...state.issues, { ...action.payload, id: generateId(), notes: [], createdAt: new Date().toISOString() }] }
    case 'UPDATE_ISSUE':
      return { ...state, issues: state.issues.map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) }
    case 'DELETE_ISSUE':
      return { ...state, issues: state.issues.filter(i => i.id !== action.payload) }
    case 'ADD_ISSUE_NOTE':
      return {
        ...state,
        issues: state.issues.map(i =>
          i.id === action.payload.issueId
            ? { ...i, notes: [...(i.notes || []), { id: generateId(), text: action.payload.text, authorId: action.payload.authorId, createdAt: new Date().toISOString() }] }
            : i
        ),
      }

    // CHECKLIST TEMPLATES
    case 'ADD_TEMPLATE':
      return { ...state, checklistTemplates: [...state.checklistTemplates, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] }
    case 'UPDATE_TEMPLATE':
      return { ...state, checklistTemplates: state.checklistTemplates.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) }
    case 'DELETE_TEMPLATE':
      return { ...state, checklistTemplates: state.checklistTemplates.filter(t => t.id !== action.payload) }

    // CHECKLIST INSTANCES
    case 'ASSIGN_CHECKLIST_TO_EVENT': {
      const { eventId, templateId, slot } = action.payload
      const template = state.checklistTemplates.find(t => t.id === templateId)
      if (!template) return state
      const newInstance = {
        id: generateId(),
        templateId,
        eventId,
        type: slot === 'setDay' ? 'SetDay' : slot === 'gameDay' ? 'GameDay' : template.type,
        items: template.items.map(item => ({
          templateItemId: item.id,
          completed: false,
          completedBy: null,
          completedAt: null,
          notes: '',
        })),
        createdAt: new Date().toISOString(),
      }
      const updatedEvents = state.events.map(e => {
        if (e.id !== eventId) return e
        if (slot === 'setDay')  return { ...e, setDayChecklistId: newInstance.id }
        if (slot === 'gameDay') return { ...e, gameDayChecklistId: newInstance.id }
        return { ...e, extraChecklistIds: [...(e.extraChecklistIds || []), newInstance.id] }
      })
      return { ...state, checklistInstances: [...state.checklistInstances, newInstance], events: updatedEvents }
    }
    case 'REMOVE_EXTRA_CHECKLIST': {
      const { eventId, instanceId } = action.payload
      return {
        ...state,
        events: state.events.map(e =>
          e.id !== eventId ? e
            : { ...e, extraChecklistIds: (e.extraChecklistIds || []).filter(id => id !== instanceId) }
        ),
        checklistInstances: state.checklistInstances.filter(ci => ci.id !== instanceId),
      }
    }
    case 'UPDATE_CHECKLIST_ITEM': {
      const { instanceId, templateItemId, updates } = action.payload
      return {
        ...state,
        checklistInstances: state.checklistInstances.map(ci => {
          if (ci.id !== instanceId) return ci
          const exists = ci.items.some(i => i.templateItemId === templateItemId)
          if (exists) {
            return { ...ci, items: ci.items.map(i => i.templateItemId === templateItemId ? { ...i, ...updates } : i) }
          }
          return { ...ci, items: [...ci.items, { templateItemId, completed: false, completedBy: null, completedAt: null, notes: '', ...updates }] }
        }),
      }
    }
    case 'ADD_CHECKLIST_INSTANCE':
      return { ...state, checklistInstances: [...state.checklistInstances, { ...action.payload, id: generateId() }] }

    // REPORTS
    case 'ADD_REPORT': {
      const report = { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }
      return {
        ...state,
        reports: [...state.reports, report],
        events: state.events.map(e => e.id === action.payload.eventId ? { ...e, reportId: report.id } : e),
      }
    }
    case 'UPDATE_REPORT':
      return { ...state, reports: state.reports.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) }

    // ANNOUNCEMENTS
    case 'ADD_ANNOUNCEMENT':
      return { ...state, announcements: [...state.announcements, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] }
    case 'DELETE_ANNOUNCEMENT':
      return { ...state, announcements: state.announcements.filter(a => a.id !== action.payload) }

    // DOCUMENTATION
    case 'ADD_DOC':
      return { ...state, documentation: [...state.documentation, { ...action.payload, id: generateId(), createdAt: new Date().toISOString() }] }
    case 'UPDATE_DOC':
      return { ...state, documentation: state.documentation.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) }
    case 'DELETE_DOC':
      return { ...state, documentation: state.documentation.filter(d => d.id !== action.payload) }
    case 'COMPLETE_TRAINING': {
      const { docId, employeeId, score } = action.payload
      return {
        ...state,
        documentation: state.documentation.map(d => {
          if (d.id !== docId) return d
          const existing = d.completions.find(c => c.employeeId === employeeId)
          if (existing) return d
          return { ...d, completions: [...d.completions, { employeeId, completedAt: new Date().toISOString(), score }] }
        }),
      }
    }

    default:
      return state
  }
}

// Finds the one item in `next` that isn't in `prev` (by id).
function findAdded(prev, next) {
  const prevIds = new Set(prev.map(i => i.id))
  return next.find(i => !prevIds.has(i.id))
}

async function syncToApi(action, prevState, nextState) {
  switch (action.type) {
    // EVENTS
    case 'ADD_EVENT': {
      const item = findAdded(prevState.events, nextState.events)
      return api.put(`/api/events/${item.id}`, item)
    }
    case 'UPDATE_EVENT': {
      const item = nextState.events.find(e => e.id === action.payload.id)
      return api.put(`/api/events/${item.id}`, item)
    }
    case 'DELETE_EVENT':
      return api.del(`/api/events/${action.payload}`)

    // VENUES
    case 'ADD_VENUE': {
      const item = findAdded(prevState.venues, nextState.venues)
      return api.put(`/api/venues/${item.id}`, item)
    }
    case 'UPDATE_VENUE': {
      const item = nextState.venues.find(v => v.id === action.payload.id)
      return api.put(`/api/venues/${item.id}`, item)
    }
    case 'DELETE_VENUE':
      return api.del(`/api/venues/${action.payload}`)

    // EMPLOYEES
    case 'ADD_EMPLOYEE': {
      const item = findAdded(prevState.employees, nextState.employees)
      return api.put(`/api/employees/${item.id}`, item)
    }
    case 'UPDATE_EMPLOYEE': {
      const item = nextState.employees.find(e => e.id === action.payload.id)
      return api.put(`/api/employees/${item.id}`, item)
    }
    case 'DELETE_EMPLOYEE':
      return api.del(`/api/employees/${action.payload}`)

    // KITS
    case 'ADD_KIT': {
      const item = findAdded(prevState.kits, nextState.kits)
      return api.put(`/api/kits/${item.id}`, item)
    }
    case 'UPDATE_KIT': {
      const item = nextState.kits.find(k => k.id === action.payload.id)
      return api.put(`/api/kits/${item.id}`, item)
    }
    case 'DELETE_KIT':
      return api.del(`/api/kits/${action.payload}`)

    // ISSUES
    case 'ADD_ISSUE': {
      const item = findAdded(prevState.issues, nextState.issues)
      return api.put(`/api/issues/${item.id}`, item)
    }
    case 'UPDATE_ISSUE': {
      const item = nextState.issues.find(i => i.id === action.payload.id)
      return api.put(`/api/issues/${item.id}`, item)
    }
    case 'DELETE_ISSUE':
      return api.del(`/api/issues/${action.payload}`)
    case 'ADD_ISSUE_NOTE': {
      const item = nextState.issues.find(i => i.id === action.payload.issueId)
      return api.put(`/api/issues/${item.id}`, item)
    }

    // CHECKLIST TEMPLATES
    case 'ADD_TEMPLATE': {
      const item = findAdded(prevState.checklistTemplates, nextState.checklistTemplates)
      return api.put(`/api/checklist-templates/${item.id}`, item)
    }
    case 'UPDATE_TEMPLATE': {
      const item = nextState.checklistTemplates.find(t => t.id === action.payload.id)
      return api.put(`/api/checklist-templates/${item.id}`, item)
    }
    case 'DELETE_TEMPLATE':
      return api.del(`/api/checklist-templates/${action.payload}`)

    // CHECKLIST INSTANCES
    case 'ASSIGN_CHECKLIST_TO_EVENT': {
      const inst = findAdded(prevState.checklistInstances, nextState.checklistInstances)
      const event = nextState.events.find(e => e.id === action.payload.eventId)
      await api.put(`/api/checklist-instances/${inst.id}`, inst)
      return api.put(`/api/events/${event.id}`, event)
    }
    case 'REMOVE_EXTRA_CHECKLIST': {
      const event = nextState.events.find(e => e.id === action.payload.eventId)
      await api.del(`/api/checklist-instances/${action.payload.instanceId}`)
      return api.put(`/api/events/${event.id}`, event)
    }
    case 'UPDATE_CHECKLIST_ITEM': {
      const item = nextState.checklistInstances.find(ci => ci.id === action.payload.instanceId)
      return api.put(`/api/checklist-instances/${item.id}`, item)
    }
    case 'ADD_CHECKLIST_INSTANCE': {
      const item = findAdded(prevState.checklistInstances, nextState.checklistInstances)
      return api.put(`/api/checklist-instances/${item.id}`, item)
    }

    // REPORTS
    case 'ADD_REPORT': {
      const item = findAdded(prevState.reports, nextState.reports)
      const event = nextState.events.find(e => e.id === action.payload.eventId)
      await api.put(`/api/reports/${item.id}`, item)
      return api.put(`/api/events/${event.id}`, event)
    }
    case 'UPDATE_REPORT': {
      const item = nextState.reports.find(r => r.id === action.payload.id)
      return api.put(`/api/reports/${item.id}`, item)
    }

    // ANNOUNCEMENTS
    case 'ADD_ANNOUNCEMENT': {
      const item = findAdded(prevState.announcements, nextState.announcements)
      return api.put(`/api/announcements/${item.id}`, item)
    }
    case 'DELETE_ANNOUNCEMENT':
      return api.del(`/api/announcements/${action.payload}`)

    // DOCUMENTATION
    case 'ADD_DOC': {
      const item = findAdded(prevState.documentation, nextState.documentation)
      return api.put(`/api/documentation/${item.id}`, item)
    }
    case 'UPDATE_DOC': {
      const item = nextState.documentation.find(d => d.id === action.payload.id)
      return api.put(`/api/documentation/${item.id}`, item)
    }
    case 'DELETE_DOC':
      return api.del(`/api/documentation/${action.payload}`)
    case 'COMPLETE_TRAINING': {
      const item = nextState.documentation.find(d => d.id === action.payload.docId)
      return api.put(`/api/documentation/${item.id}`, item)
    }

    case 'SET_STATE':
      return // No-op: this action comes from the API, don't echo back

    default:
      console.warn('syncToApi: unhandled action type', action.type)
  }
}

export function AppProvider({ children }) {
  const [state, baseDispatch] = useReducer(reducer, initialData)
  const stateRef = useRef(initialData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('qod_user')
    if (!stored) { setLoading(false); return }
    api.get('/api/state')
      .then((data) => {
        if (!data) return  // 401 redirect already in flight
        stateRef.current = { ...initialData, ...data }
        baseDispatch({ type: 'SET_STATE', payload: data })
      })
      .catch((err) => console.error('Failed to load state from API:', err))
      .finally(() => setLoading(false))
  }, [])

  const dispatch = useCallback((action) => {
    const prevState = stateRef.current
    const nextState = reducer(prevState, action)
    stateRef.current = nextState
    baseDispatch(action)
    if (action.type !== 'SET_STATE') {
      syncToApi(action, prevState, nextState).catch((err) =>
        console.error('API sync failed for', action.type, err)
      )
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// ── Selectors ──────────────────────────────────────────────────────────────────

export function getChecklistProgress(instance, template) {
  if (!instance) return 0
  const total = template ? template.items.length : instance.items.length
  if (total === 0) return 0
  const completed = instance.items.filter(i => i.completed).length
  return Math.round((completed / total) * 100)
}

export function getEventStatus(event) {
  if (!event?.startTime) return 'Planning'
  const diff = differenceInCalendarDays(new Date(event.startTime), new Date())
  if (diff < 0) return 'Complete'
  if (diff === 0) return 'Game Day'
  if (diff === 1) return 'Set Day'
  return 'Planning'
}

export function getEventStatusColor(status) {
  switch (status) {
    case 'Planning': return 'bg-gray-100 text-gray-700'
    case 'Set Day': return 'bg-yellow-50 text-yellow-800 border border-yellow-200'
    case 'Game Day': return 'bg-blue-50 text-blue-800 border border-blue-200'
    case 'Complete': return 'bg-green-50 text-green-800 border border-green-200'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'Critical': return 'bg-red-100 text-red-800'
    case 'High': return 'bg-orange-100 text-orange-800'
    case 'Medium': return 'bg-yellow-100 text-yellow-700'
    case 'Low': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export function getIssueStatusColor(status) {
  switch (status) {
    case 'Open': return 'bg-red-50 text-red-700 border border-red-200'
    case 'In Progress': return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'Resolved': return 'bg-green-50 text-green-700 border border-green-200'
    case 'Closed': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}
