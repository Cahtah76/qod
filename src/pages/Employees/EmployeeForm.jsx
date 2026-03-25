import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

export default function EmployeeForm({ emp, onClose }) {
  const { dispatch } = useApp()
  const isNew = !emp
  const [form, setForm] = useState(emp || {
    name: '',
    email: '',
    phone: '',
    role: 'User',
    avatar: null,
    assignedEvents: [],
  })
  const [tempPassword, setTempPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (emp) {
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: { ...emp, ...form } })
    } else {
      dispatch({ type: 'ADD_EMPLOYEE', payload: {
        ...form,
        password: tempPassword,
        mustChangePassword: true,
      }})
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Full Name *</label>
        <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input" required value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input type="tel" className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Role</label>
        <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      {isNew && (
        <div>
          <label className="label">Temporary Password *</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className="input pr-9"
              required
              minLength={6}
              value={tempPassword}
              onChange={e => setTempPassword(e.target.value)}
              placeholder="Min. 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Employee will be required to change this on first login.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary">{emp ? 'Save Changes' : 'Add Employee'}</button>
      </div>
    </form>
  )
}
