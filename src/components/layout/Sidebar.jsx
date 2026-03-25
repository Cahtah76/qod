import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  LayoutDashboard, Calendar, MapPin, Package, Users, ClipboardList,
  AlertTriangle, FileText, BarChart2, Settings, ChevronLeft, ChevronRight,
  Radio, BookOpen, UserCheck, Menu
} from 'lucide-react'

const navSections = [
  {
    label: 'Operations',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/events', icon: Calendar, label: 'Events' },
      { to: '/scheduling', icon: UserCheck, label: 'Scheduling' },
      { to: '/issues', icon: AlertTriangle, label: 'Issues' },
      { to: '/reports', icon: BarChart2, label: 'Reports' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { to: '/venues', icon: MapPin, label: 'Venues' },
      { to: '/kits', icon: Package, label: 'Kits' },
      { to: '/employees', icon: Users, label: 'Employees' },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { to: '/documentation', icon: BookOpen, label: 'Documentation' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/admin', icon: Settings, label: 'Admin' },
    ],
  },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const { can } = useAuth()
  const visibleSections = navSections.filter(s => s.label !== 'Admin' || can('admin'))

  return (
    <aside
      className={`flex flex-col bg-[#1e1e24] border-r border-gray-800 transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'} flex-shrink-0`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-800 ${collapsed ? 'justify-center py-3 px-2' : 'px-4 py-3'}`}>
        {!collapsed && (
          <img src="/quintar-logo.png" alt="Quintar" className="h-8 w-auto brightness-0 invert" />
        )}
        {collapsed && (
          <img src="/quintar-logo.png" alt="Quintar" className="h-7 w-7 object-cover object-left brightness-0 invert" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {visibleSections.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">
                {section.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-2 py-2 rounded text-sm transition-colors duration-100 group ${
                        isActive
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-700/60 hover:text-gray-100'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

