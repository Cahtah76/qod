import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Plus, Search, Users, Mail, Phone, Edit, Trash2, Shield, User } from 'lucide-react'
import { useApp, getEventStatus } from '../../context/AppContext.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmployeeForm from './EmployeeForm.jsx'

export default function EmployeesPage() {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editEmp, setEditEmp] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [viewEmp, setViewEmp] = useState(null)

  const filtered = state.employees.filter(e => {
    if (roleFilter !== 'All' && e.role !== roleFilter) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.email?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${state.employees.length} employees`}
        actions={
          <button className="btn-primary" onClick={() => { setEditEmp(null); setShowModal(true) }}>
            <Plus size={14} /> Add Employee
          </button>
        }
      />
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input py-1.5 text-sm w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option>All</option>
          <option>Admin</option>
          <option>User</option>
        </select>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => {
            const assignedEvents = state.events.filter(e =>
              e.crew?.remoteOperator === emp.id ||
              e.crew?.onsiteOperators?.includes(emp.id)
            ).filter(e => getEventStatus(e) !== 'Complete')
            return (
              <div
                key={emp.id}
                className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setViewEmp(emp)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{emp.name}</span>
                      {emp.role === 'Admin' && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Admin</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Mail size={10} />{emp.email}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {assignedEvents.length > 0 ? (
                        <span className="text-blue-700">{assignedEvents.length} active assignment{assignedEvents.length !== 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-gray-400">No active assignments</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                  <button className="text-gray-400 hover:text-blue-600 transition-colors" onClick={() => { setEditEmp(emp); setShowModal(true) }}>
                    <Edit size={13} />
                  </button>
                  <button className="text-gray-400 hover:text-red-600 transition-colors" onClick={() => setDeleteId(emp.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* View Employee Modal */}
      <Modal open={!!viewEmp} onClose={() => setViewEmp(null)} title="Employee Profile" size="md">
        {viewEmp && <EmployeeProfile emp={viewEmp} state={state} />}
      </Modal>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditEmp(null) }} title={editEmp ? 'Edit Employee' : 'Add Employee'} size="md">
        <EmployeeForm emp={editEmp} onClose={() => { setShowModal(false); setEditEmp(null) }} />
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Employee" size="sm">
        <div>
          <p className="text-sm text-gray-700 mb-4">Delete this employee? This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => { dispatch({ type: 'DELETE_EMPLOYEE', payload: deleteId }); setDeleteId(null) }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function EmployeeProfile({ emp, state }) {
  const events = state.events.filter(e =>
    e.crew?.remoteOperator === emp.id ||
    e.crew?.onsiteOperators?.includes(emp.id)
  ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
          {emp.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{emp.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${emp.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {emp.role}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700"><Mail size={14} className="text-gray-400" />{emp.email}</div>
        {emp.phone && <div className="flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-400" />{emp.phone}</div>}
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Assigned Events</div>
        {events.length === 0 ? (
          <div className="text-xs text-gray-400">No assigned events</div>
        ) : (
          <div className="space-y-1">
            {events.map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-700">{e.name}</span>
                <span className="text-gray-500">{format(new Date(e.startTime), 'MMM d')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
