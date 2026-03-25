import React, { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Header({ title }) {
  const { state } = useApp()
  const { currentUser, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const openIssues = state.issues.filter(i => i.status === 'Open').length

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="h-12 bg-[#22222a] border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
      <h1 className="text-white text-sm font-semibold">{title}</h1>

      <div className="flex items-center gap-3">
        {openIssues > 0 && (
          <span className="text-xs text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded">
            {openIssues} open issue{openIssues !== 1 ? 's' : ''}
          </span>
        )}

        <div className="w-px h-5 bg-gray-700" />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-1.5 hover:bg-gray-700/50 rounded px-1.5 py-1 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-gray-300 text-xs leading-tight">{currentUser?.name}</div>
              <div className="text-gray-500 text-[10px] leading-tight">{currentUser?.role}</div>
            </div>
            <ChevronDown size={12} className="text-gray-500" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#22222a] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-700">
                <div className="text-white text-xs font-medium">{currentUser?.name}</div>
                <div className="text-gray-400 text-[11px]">{currentUser?.email}</div>
                <div className="text-gray-500 text-[10px] mt-0.5">{currentUser?.role}</div>
              </div>
              <button
                onClick={() => { setMenuOpen(false); logout() }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
